/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Artifact, Session } from '../types';

interface SemanticRouterProps {
    sessions: Session[];
    onUpdateArtifactHtml?: (sessionId: string, artifactId: string, newHtml: string) => void;
    refactorCode?: (code: string, instruction: string) => Promise<string | undefined>;
    generateTailoredRecommendations?: (currentPrompt: string, html: string, techStack?: string, searchQuery?: string) => Promise<{ components: string[], integrations: string[], apis: string[] }>;
    onClose?: () => void;
}

interface PageData {
    id: string;
    sessionId: string;
    title: string;
    html: string;
    styleName: string;
    sessionPrompt: string;
}

interface RouteLog {
    time: string;
    type: 'info' | 'event' | 'warn' | 'success';
    message: string;
}

export function getPageHotspots(html: string) {
    if (!html) return [];
    const found = new Set<string>();
    
    // 1. Scan links
    const aRegex = /<a[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = aRegex.exec(html)) !== null) {
        let inner = match[1].replace(/<[^>]*>/g, '').trim();
        if (!inner) {
            const titleMatch = match[0].match(/title="([^"]+)"/i) || match[0].match(/id="([^"]+)"/i);
            if (titleMatch) inner = titleMatch[1];
        }
        if (inner && inner.length < 35 && !inner.includes('<svg') && !inner.includes('<img')) {
            found.add(inner);
        }
    }
    
    // 2. Scan buttons
    const btnRegex = /<button[^>]*>([\s\S]*?)<\/button>/gi;
    while ((match = btnRegex.exec(html)) !== null) {
        const inner = match[1].replace(/<[^>]*>/g, '').trim();
        if (inner && inner.length < 35 && !inner.includes('<svg') && !inner.includes('<img') && !inner.includes('class')) {
            found.add(inner);
        }
    }

    // 3. Scan list navigation
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    while ((match = liRegex.exec(html)) !== null) {
        const inner = match[1].replace(/<[^>]*>/g, '').trim();
        if (inner && inner.length < 30 && (inner.toLowerCase().includes('dashboard') || inner.toLowerCase().includes('setting') || inner.toLowerCase().includes('profile') || inner.toLowerCase().includes('home') || inner.toLowerCase().includes('login') || inner.toLowerCase().includes('sign'))) {
            found.add(inner);
        }
    }

    return Array.from(found);
}

export default function SemanticRouter({
    sessions,
    onUpdateArtifactHtml,
    refactorCode,
    generateTailoredRecommendations,
    onClose
}: SemanticRouterProps) {
    // 1. Gather all complete pages across sessions
    const pages = useMemo<PageData[]>(() => {
        const list: PageData[] = [];
        sessions.forEach(session => {
            session.artifacts.forEach(art => {
                if (art.html && art.status === 'complete') {
                    // Make a human-friendly title based on the session prompt
                    let pageTitle = art.styleName;
                    const promptWords = session.prompt.split(' ');
                    const titleKeywords = promptWords.slice(0, 3).join(' ');
                    if (titleKeywords) {
                        pageTitle = `${pageTitle} (${titleKeywords}...)`;
                    }
                    list.push({
                        id: art.id,
                        sessionId: session.id,
                        title: pageTitle,
                        html: art.html,
                        styleName: art.styleName,
                        sessionPrompt: session.prompt
                    });
                }
            });
        });
        return list;
    }, [sessions]);

    // 2. Active entry points, navigation & configuration
    const [entryPointId, setEntryPointId] = useState<string>('');
    const [currentPageId, setCurrentPageId] = useState<string>('');
    const [routeHistory, setRouteHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    
    // Explicit dynamic links map: { [sourcePageId]: { [clickTextOrTarget]: targetPageId } }
    const [routeRules, setRouteRules] = useState<Record<string, Record<string, string>>>(() => {
        try {
            const saved = localStorage.getItem('semantic_route_rules');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    const [logs, setLogs] = useState<RouteLog[]>([
        { time: new Date().toLocaleTimeString(), type: 'info', message: 'Core State Machine Router Engine initialized.' }
    ]);

    const logsEndRef = useRef<HTMLDivElement>(null);
    const [isAutoMapping, setIsAutoMapping] = useState(false);
    const [isRefactoringHTML, setIsRefactoringHTML] = useState(false);
    const [refactorProgress, setRefactorProgress] = useState<string | null>(null);

    const [activeSubTab, setActiveSubTab] = useState<'weaver' | 'flowchart'>('flowchart');
    const [nodePositions, setNodePositions] = useState<Record<string, {x: number, y: number}>>(() => {
        try {
            const saved = localStorage.getItem('semantic_node_positions');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const [canvasMousePos, setCanvasMousePos] = useState({ x: 0, y: 0 });
    const [activeSocketDrag, setActiveSocketDrag] = useState<{ sourceId: string; triggerText: string; triggerIndex: number } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    // Distribute node positions dynamically if missing
    useEffect(() => {
        if (pages.length === 0) return;
        setNodePositions(prev => {
            let changed = false;
            const updated = { ...prev };
            pages.forEach((page, index) => {
                if (!updated[page.id]) {
                    const cols = 2;
                    const row = Math.floor(index / cols);
                    const col = index % cols;
                    updated[page.id] = {
                        x: 20 + col * 200,
                        y: 20 + row * 190
                    };
                    changed = true;
                }
            });
            if (changed) {
                localStorage.setItem('semantic_node_positions', JSON.stringify(updated));
                return updated;
            }
            return prev;
        });
    }, [pages]);

    const handleNodeMouseDown = (e: React.MouseEvent, pageId: string) => {
        if (e.button !== 0) return;
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const currentPos = nodePositions[pageId] || { x: 50, y: 50 };
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setDraggingNodeId(pageId);
        setDragOffset({
            x: mouseX - currentPos.x,
            y: mouseY - currentPos.y
        });
        e.stopPropagation();
    };

    const handleSocketDragStart = (e: React.MouseEvent, pageId: string, triggerText: string, triggerIndex: number) => {
        if (e.button !== 0) return;
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setActiveSocketDrag({
            sourceId: pageId,
            triggerText,
            triggerIndex
        });
        setCanvasMousePos({ x: mouseX, y: mouseY });
        e.preventDefault();
        e.stopPropagation();
    };

    const handleContainerMouseMove = (e: React.MouseEvent) => {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (draggingNodeId) {
            let x = mouseX - dragOffset.x;
            let y = mouseY - dragOffset.y;
            // constraints
            x = Math.max(10, Math.min(x, rect.width - 210));
            y = Math.max(10, Math.min(y, rect.height - 150));
            setNodePositions(prev => ({
                ...prev,
                [draggingNodeId]: { x, y }
            }));
        } else if (activeSocketDrag) {
            setCanvasMousePos({ x: mouseX, y: mouseY });
        }
    };

    const handleContainerMouseUpOrSocketEnd = () => {
        if (draggingNodeId) {
            localStorage.setItem('semantic_node_positions', JSON.stringify(nodePositions));
            setDraggingNodeId(null);
        }
        if (activeSocketDrag) {
            setActiveSocketDrag(null);
        }
    };

    const handleContainerMouseLeave = () => {
        setDraggingNodeId(null);
        setActiveSocketDrag(null);
    };

    const handleConnectSocketToPage = (targetPageId: string) => {
        if (activeSocketDrag) {
            if (activeSocketDrag.sourceId !== targetPageId) {
                handleSetRouteRule(activeSocketDrag.sourceId, activeSocketDrag.triggerText, targetPageId);
            }
            setActiveSocketDrag(null);
        }
    };

    const handleDisconnectRule = (sourcePageId: string, triggerText: string) => {
        setRouteRules(prev => {
            const next = { ...prev };
            if (next[sourcePageId]) {
                const updatedRules = { ...next[sourcePageId] };
                delete updatedRules[triggerText];
                next[sourcePageId] = updatedRules;
            }
            return next;
        });
        addLog('warn', `Severed routing connection for hotspot "${triggerText}" on source node!`);
    };

    const handlePageDragStart = (e: React.DragEvent, pageId: string) => {
        e.dataTransfer.setData('targetPageId', pageId);
        e.dataTransfer.effectAllowed = 'link';
    };

    const linesToRender = useMemo(() => {
        const list: { id: string; path: string; sourceId: string; targetId: string; triggerText: string }[] = [];
        pages.forEach(source => {
            const rules = routeRules[source.id] || {};
            const posSrc = nodePositions[source.id];
            if (!posSrc) return;

            const allHotspots = getPageHotspots(source.html);

            Object.entries(rules).forEach(([triggerText, targetId]) => {
                const posTgt = nodePositions[targetId];
                if (!posTgt) return;

                // Find index of this trigger to offset output line
                const triggerIndex = Math.max(0, allHotspots.indexOf(triggerText));

                const startX = posSrc.x + 180;
                const startY = posSrc.y + 45 + triggerIndex * 24;
                const endX = posTgt.x;
                const endY = posTgt.y + 40;

                const dx = Math.abs(endX - startX);
                const ctrlX = startX + Math.min(100, dx * 0.5);
                const ctrlX2 = endX - Math.min(100, dx * 0.5);

                const path = `M ${startX} ${startY} C ${ctrlX} ${startY}, ${ctrlX2} ${endY}, ${endX} ${endY}`;
                
                list.push({
                    id: `${source.id}_${triggerText}_${targetId}`,
                    path,
                    sourceId: source.id,
                    targetId,
                    triggerText
                });
            });
        });
        return list;
    }, [pages, routeRules, nodePositions]);

    const dragLinePath = useMemo(() => {
        if (!activeSocketDrag) return null;
        const posSrc = nodePositions[activeSocketDrag.sourceId];
        if (!posSrc) return null;

        const startX = posSrc.x + 180;
        const startY = posSrc.y + 45 + activeSocketDrag.triggerIndex * 24;
        const endX = canvasMousePos.x;
        const endY = canvasMousePos.y;

        const dx = Math.abs(endX - startX);
        const ctrlX = startX + Math.min(100, dx * 0.5);
        const ctrlX2 = endX - Math.min(100, dx * 0.5);

        return `M ${startX} ${startY} C ${ctrlX} ${startY}, ${ctrlX2} ${endY}, ${endX} ${endY}`;
    }, [activeSocketDrag, canvasMousePos, nodePositions]);

    // Auto-save route rules to local storage
    useEffect(() => {
        localStorage.setItem('semantic_route_rules', JSON.stringify(routeRules));
    }, [routeRules]);

    // Set fallback default entry points when pages load
    useEffect(() => {
        if (pages.length > 0) {
            if (!entryPointId || !pages.some(p => p.id === entryPointId)) {
                setEntryPointId(pages[0].id);
                setCurrentPageId(pages[0].id);
                setRouteHistory([pages[0].id]);
                setHistoryIndex(0);
                addLog('info', `Set "${pages[0].title}" as default entry page.`);
            }
        }
    }, [pages, entryPointId]);

    // Keep logs scrolled down
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const addLog = (type: 'info' | 'event' | 'warn' | 'success', message: string) => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        setLogs(prev => [...prev, { time: timeStr, type, message }]);
    };

    // Parse clickable elements/hotspots from active page HTML
    const activePage = pages.find(p => p.id === currentPageId);

    const activePageHotspots = useMemo(() => {
        if (!activePage) return [];
        const html = activePage.html;
        const found: { text: string; cleanText: string; type: 'Link' | 'Button' | 'Sidebar/Nav' }[] = [];
        
        // Find links
        const aRegex = /<a[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        while ((match = aRegex.exec(html)) !== null) {
            let inner = match[1].replace(/<[^>]*>/g, '').trim();
            // Fallback to title/id if empty
            if (!inner) {
                const titleMatch = match[0].match(/title="([^"]+)"/i) || match[0].match(/id="([^"]+)"/i);
                if (titleMatch) inner = titleMatch[1];
            }
            if (inner && inner.length < 40 && !inner.includes('<svg') && !inner.includes('img')) {
                found.push({ text: inner, cleanText: inner.toLowerCase(), type: 'Link' });
            }
        }
        
        // Find buttons
        const btnRegex = /<button[^>]*>([\s\S]*?)<\/button>/gi;
        while ((match = btnRegex.exec(html)) !== null) {
            const inner = match[1].replace(/<[^>]*>/g, '').trim();
            if (inner && inner.length < 40 && !inner.includes('<svg') && !inner.includes('img') && !inner.includes('class')) {
                found.push({ text: inner, cleanText: inner.toLowerCase(), type: 'Button' });
            }
        }

        // Find common dashboard items/li tags
        const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        while ((match = liRegex.exec(html)) !== null) {
            const inner = match[1].replace(/<[^>]*>/g, '').trim();
            if (inner && inner.length < 30 && (inner.toLowerCase().includes('dashboard') || inner.toLowerCase().includes('setting') || inner.toLowerCase().includes('profile') || inner.toLowerCase().includes('home') || inner.toLowerCase().includes('login') || inner.toLowerCase().includes('sign'))) {
                found.push({ text: inner, cleanText: inner.toLowerCase(), type: 'Sidebar/Nav' });
            }
        }

        // Deduplicate
        const seen = new Set<string>();
        return found.filter(item => {
            const key = `${item.text}_${item.type}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [activePage]);

    // Handle Manual router connector changes
    const handleSetRouteRule = (sourceIdOrText: string, triggerTextOrTargetId: string, maybeTargetId?: string) => {
        let sourcePageId = currentPageId;
        let triggerText = sourceIdOrText;
        let targetId = triggerTextOrTargetId;

        if (maybeTargetId !== undefined) {
            sourcePageId = sourceIdOrText;
            triggerText = triggerTextOrTargetId;
            targetId = maybeTargetId;
        }

        if (!sourcePageId) return;

        setRouteRules(prev => ({
            ...prev,
            [sourcePageId]: {
                ...(prev[sourcePageId] || {}),
                [triggerText]: targetId
            }
        }));
        
        const sourcePage = pages.find(p => p.id === sourcePageId);
        const targetPage = pages.find(p => p.id === targetId);
        addLog('success', `Created mapping: Clicking "${triggerText}" on "${sourcePage?.styleName || 'Page'}" ➔ Navigates to "${targetPage?.title || targetId}"`);
    };

    // Simulate clicking in parent dropdowns
    const handleSimulateNavigation = (targetId: string, clickText: string) => {
        const targetPage = pages.find(p => p.id === targetId);
        if (!targetPage) return;

        addLog('event', `[ROUTER] Manual transition triggered via flow selector: Transitioning to "${targetPage.title}"`);
        
        // Append to history
        const newHistory = routeHistory.slice(0, historyIndex + 1);
        newHistory.push(targetId);
        setRouteHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setCurrentPageId(targetId);
    };

    // Auto Mapping with rule-based heuristics, visual hierarchy, and element classification scores
    const handleAutoMapSemanticRoutes = async () => {
        if (pages.length < 2) {
            alert("Ensure you have generated at least 2 distinct user screens before running auto-connector.");
            return;
        }

        setIsAutoMapping(true);
        addLog('info', 'Executing advanced Visual Hierarchy & Path-Aware Auto-Mapping Algorithm...');

        interface ExtractedTrigger {
            text: string;
            tag: 'a' | 'button' | 'li';
            parentContext: string;
            visualZone: 'header' | 'sidebar' | 'hero' | 'footer' | 'body';
            isPrimaryCta: boolean;
            isNavigationLink: boolean;
        }

        try {
            const updatedRules = { ...routeRules };
            let connectionCount = 0;

            pages.forEach(source => {
                const sourceRules = updatedRules[source.id] || {};
                const sourceHtml = source.html;
                
                // 1. Scan and extract all triggers with structural, layout, and visual context
                const extractedTriggers: ExtractedTrigger[] = [];
                const regex = /<(a|button|li)([^>]*)>([\s\S]*?)<\/\1>/gi;
                let match;
                
                while ((match = regex.exec(sourceHtml)) !== null) {
                    const tag = match[1].toLowerCase() as 'a' | 'button' | 'li';
                    const attribs = match[2];
                    const innerText = match[3].replace(/<[^>]*>/g, '').trim();

                    // Filter out unrepresentative empty texts, or media elements
                    if (!innerText || innerText.length > 50 || innerText.includes('<svg') || innerText.includes('<img')) {
                        continue;
                    }

                    // Get index and surrounding context (350 character context size)
                    const matchIdx = match.index;
                    const startIdx = Math.max(0, matchIdx - 350);
                    const endIdx = Math.min(sourceHtml.length, matchIdx + match[0].length + 350);
                    const surround = sourceHtml.substring(startIdx, endIdx).toLowerCase();

                    // Determine Visual Zone based on tag names and class keywords in surrounding HTML
                    let visualZone: 'header' | 'sidebar' | 'hero' | 'footer' | 'body' = 'body';
                    if (surround.includes('<nav') || surround.includes('<header') || surround.includes('class="navbar') || surround.includes('id="navbar') || surround.includes('nav-bar') || surround.includes('header-bar')) {
                        visualZone = 'header';
                    } else if (surround.includes('<aside') || surround.includes('class="sidebar') || surround.includes('id="sidebar') || surround.includes('sidebar-') || surround.includes('navigation-rail') || surround.includes('nav-rail')) {
                        visualZone = 'sidebar';
                    } else if (surround.includes('<footer') || surround.includes('class="footer') || surround.includes('id="footer')) {
                        visualZone = 'footer';
                    } else if (surround.includes('class="hero') || surround.includes('hero-content') || surround.includes('id="hero') || surround.includes('gradient-hero') || surround.includes('jumbotron') || surround.includes('banner-hero')) {
                        visualZone = 'hero';
                    }

                    // Determine if element behaves as a Core Primary CTA (High visual hierarchy priority)
                    const attribsLower = attribs.toLowerCase();
                    let isPrimaryCta = false;
                    if (tag === 'button') {
                        // Regular buttons are primary triggers unless explicitly named secondary, outline, or flat
                        isPrimaryCta = !attribsLower.includes('secondary') && !attribsLower.includes('outline') && !attribsLower.includes('ghost') && !attribsLower.includes('flat') && !attribsLower.includes('border');
                    } else if (tag === 'a') {
                        // Anchor tag formatted visually like high visual-weight button or banner trigger
                        isPrimaryCta = attribsLower.includes('cta') || attribsLower.includes('primary') || attribsLower.includes('btn-primary') || attribsLower.includes('bg-[#') || attribsLower.includes('bg-pink') || attribsLower.includes('bg-purple') || attribsLower.includes('bg-blue');
                    }

                    // Is it meant as navigation?
                    const isNavigationLink = tag === 'li' || visualZone === 'sidebar' || visualZone === 'header' || attribsLower.includes('nav') || attribsLower.includes('link') || attribsLower.includes('tab');

                    // Skip simple list items that clearly carry no navigation utility
                    if (tag === 'li') {
                        const hasNavContext = visualZone === 'sidebar' || visualZone === 'header' || surround.includes('menu') || surround.includes('dropdown');
                        const hasKeyword = /dashboard|setting|profile|home|login|sign|logout|analytics|pricing|help/i.test(innerText);
                        if (!hasNavContext && !hasKeyword) {
                            continue;
                        }
                    }

                    // Deduplicate identical triggers (keep first encounter with metadata)
                    if (!extractedTriggers.some(t => t.text.toLowerCase() === innerText.toLowerCase())) {
                        extractedTriggers.push({
                            text: innerText,
                            tag,
                            parentContext: surround,
                            visualZone,
                            isPrimaryCta,
                            isNavigationLink
                        });
                    }
                }

                if (extractedTriggers.length === 0) {
                    addLog('info', `No navigation nodes or responsive layout elements encountered in prompt page "${source.title}".`);
                }

                // 2. Score target candidates multi-dimensionally and prioritize likely paths
                extractedTriggers.forEach(trigger => {
                    const cue = trigger.text.toLowerCase();
                    let bestTargetId = '';
                    let highestScore = 0;

                    pages.forEach(target => {
                        if (target.id === source.id) return; // Never route back to self as default

                        const targetStyleClean = target.styleName.toLowerCase();
                        const targetPromptClean = target.sessionPrompt.toLowerCase();

                        let score = 0;

                        // ---- Multi-Dimension Feature 1: Semantic Keyword Alignments (Max 50 points) ----
                        if (cue === targetStyleClean) {
                            score += 48; // Exact semantic concept style alignment
                        } else {
                            // Keyword checks
                            if (cue.includes('login') || cue.includes('sign in') || cue.includes('signin') || cue.includes('authenticate')) {
                                if (targetStyleClean.includes('login') || targetPromptClean.includes('login') || targetStyleClean.includes('auth') || targetPromptClean.includes('auth')) {
                                    score += 40;
                                }
                            }
                            if (cue.includes('dashboard') || cue.includes('console') || cue.includes('home') || cue.includes('overview') || cue.includes('main')) {
                                if (targetStyleClean.includes('dashboard') || targetPromptClean.includes('dashboard') || targetStyleClean.includes('panel') || targetPromptClean.includes('panel') || targetStyleClean.includes('home')) {
                                    score += 40;
                                }
                            }
                            if (cue.includes('setting') || cue.includes('preference') || cue.includes('configuration') || cue.includes('security')) {
                                if (targetStyleClean.includes('setting') || targetPromptClean.includes('setting') || targetStyleClean.includes('config') || targetStyleClean.includes('preference')) {
                                    score += 40;
                                }
                            }
                            if (cue.includes('register') || cue.includes('sign up') || cue.includes('signup') || cue.includes('onboard') || cue.includes('join')) {
                                if (targetStyleClean.includes('register') || targetPromptClean.includes('register') || targetStyleClean.includes('signup') || targetPromptClean.includes('signup') || targetStyleClean.includes('onboard')) {
                                    score += 40;
                                }
                            }
                            if (cue.includes('profile') || cue.includes('account') || cue.includes('user') || cue.includes('avatar')) {
                                if (targetStyleClean.includes('profile') || targetPromptClean.includes('profile') || targetStyleClean.includes('account') || targetPromptClean.includes('account')) {
                                    score += 38;
                                }
                            }
                            if (cue.includes('billing') || cue.includes('stripe') || cue.includes('pricing') || cue.includes('checkout') || cue.includes('upgrade') || cue.includes('payment') || cue.includes('plan')) {
                                if (targetStyleClean.includes('pricing') || targetPromptClean.includes('pricing') || targetStyleClean.includes('billing') || targetPromptClean.includes('stripe') || targetStyleClean.includes('checkout') || targetPromptClean.includes('checkout')) {
                                    score += 40;
                                }
                            }
                            if (cue.includes('analytic') || cue.includes('chart') || cue.includes('stat') || cue.includes('metric') || cue.includes('report')) {
                                if (targetStyleClean.includes('analytic') || targetPromptClean.includes('analytic') || targetStyleClean.includes('chart') || targetStyleClean.includes('stat') || targetStyleClean.includes('reporting')) {
                                    score += 38;
                                }
                            }
                            if (cue.includes('chat') || cue.includes('message') || cue.includes('inbox') || cue.includes('support')) {
                                if (targetStyleClean.includes('chat') || targetPromptClean.includes('chat') || targetStyleClean.includes('message') || targetPromptClean.includes('inbox') || targetStyleClean.includes('support')) {
                                    score += 38;
                                }
                            }
                        }

                        // Broad sub-keyword bonus matching
                        const cueWords = cue.split(/\s+/).filter(w => w.length > 2);
                        cueWords.forEach(w => {
                            if (targetStyleClean.includes(w)) score += 8;
                            if (targetPromptClean.includes(w)) score += 4;
                        });

                        // ---- Multi-Dimension Feature 2: Visual Hierarchy & Page-Zone Prioritization (Max 35 points) ----
                        if (trigger.visualZone === 'sidebar') {
                            // Sidebar triggers are strictly meant for app management internal hubs, dashboards, & profile tabs!
                            const isInternalTab = targetStyleClean.includes('dashboard') || targetStyleClean.includes('setting') || targetStyleClean.includes('profile') || targetStyleClean.includes('analytic') || targetStyleClean.includes('panel') || targetStyleClean.includes('chat') || targetStyleClean.includes('management');
                            if (isInternalTab) {
                                score += 32; // Boost connection probability to management panes!
                            } else {
                                score -= 15; // Prevent routing sidebar selectors out of app shell to general sales/checkout landing!
                            }
                        } else if (trigger.visualZone === 'header') {
                            // Header links (top menu) point typically to product sections, home, pricing/pricing plans, or signin
                            if (cue.includes('pricing') || cue.includes('plan') || cue.includes('cost')) {
                                if (targetStyleClean.includes('pricing') || targetStyleClean.includes('billing')) score += 30;
                            }
                            if (cue.includes('home') || cue.includes('landing') || cue.includes('product')) {
                                if (targetStyleClean.includes('dashboard') || targetStyleClean.includes('home') || targetStyleClean.includes('hero')) score += 25;
                            }
                        } else if (trigger.visualZone === 'hero') {
                            // Hero-element triggers are active front-page Conversion Targets! Call-to-actions are highly transactional.
                            if (trigger.isPrimaryCta) {
                                // "Get Started" CTAs are strongly mapped to register screen, checkout portal, or onboard
                                const isActionTarget = targetStyleClean.includes('checkout') || targetStyleClean.includes('register') || targetStyleClean.includes('signup') || targetStyleClean.includes('onboard');
                                if (isActionTarget) {
                                    score += 35; // Huge visual prioritization boost for conversions!
                                }
                            }
                        }

                        // ---- Multi-Dimension Feature 3: Action & Link Classification Weights (Max 15 points) ----
                        if (trigger.isPrimaryCta) {
                            // If a primary button, prefer transactional/main flow targets rather than background setting configs
                            if (targetStyleClean.includes('setting') || targetStyleClean.includes('faq')) {
                                score -= 8;
                            } else {
                                score += 10;
                            }
                        }
                        if (trigger.isNavigationLink) {
                            // Tab bars are highly matching index pages or settings
                            if (targetStyleClean.includes('dashboard') || targetStyleClean.includes('setting') || targetStyleClean.includes('profile')) {
                                score += 12;
                            }
                        }

                        // Track the highest confidence match
                        if (score > highestScore) {
                            highestScore = score;
                            bestTargetId = target.id;
                        }
                    });

                    // Confirmed threshold: Match must score at least 45 to establish a validated connection
                    if (highestScore >= 45 && bestTargetId && !sourceRules[trigger.text]) {
                        sourceRules[trigger.text] = bestTargetId;
                        connectionCount++;
                        const targetPage = pages.find(p => p.id === bestTargetId);
                        addLog('info', `[PATH MATCH] Identified link "${trigger.text}" in zone "${trigger.isPrimaryCta ? 'Primary CTA - ' : ''}${trigger.visualZone}" with high confidence (${highestScore}pts) -> Routed to "${targetPage?.title}"`);
                    }
                });

                updatedRules[source.id] = sourceRules;
            });

            // Set the states immediately
            setRouteRules(updatedRules);
            addLog('success', `Visual Hierarchy Auto-Mapping Complete! Intelligently calculated and connected ${connectionCount} high-probability user paths across screens.`);
        } catch (e) {
            console.error("Path-aware heuristic mapping failed", e);
            addLog('warn', 'Visual Hierarchy auto-mapper failed. Consult dev console reports.');
        } finally {
            setIsAutoMapping(false);
        }
    };

    // Physically rewrite the underlying HTML in-place
    const handleRefactorHTMLRoutes = async () => {
        if (!refactorCode || pages.length === 0) {
            alert("No backend refactor engine found or no pages generated.");
            return;
        }

        setIsRefactoringHTML(true);
        setRefactorProgress("Synthesized whole project links topology...");
        addLog('info', 'AI State Machine Link Refactorer started in background.');

        try {
            let processed = 0;
            for (const page of pages) {
                const rules = routeRules[page.id];
                if (!rules || Object.keys(rules).length === 0) continue;

                setRefactorProgress(`Injecting routes into page ${processed + 1} of ${pages.length}...`);
                
                // Construct mapping dictionary for prompt
                const mappedConnections = Object.entries(rules).map(([trigger, targetId]) => {
                    const tgt = pages.find(p => p.id === targetId);
                    return `"${trigger}" ➔ connects to "${tgt?.styleName || tgt?.title || 'Another Page'}"`;
                }).join('\n- ');

                const instruction = `Enhance the page navigation anchors or button clicks so they physically incorporate JavaScript action triggers.
We want any button or anchor containing these exact trigger words to change state:
${mappedConnections}

METHOD:
For each matching element in the HTML, add standard onclick handlers, e.g. onclick="window.parent.postMessage({ type: 'ROUTER_CLICK_DETECTED', text: '...', href: '#...' }, '*')" so the links are fully interactive.
Ensure normal style details are entirely retained. Do not break visual aesthetics. `;

                const updatedHtml = await refactorCode(page.html, instruction);
                if (updatedHtml && onUpdateArtifactHtml) {
                    onUpdateArtifactHtml(page.sessionId, page.id, updatedHtml);
                }
                
                processed++;
            }

            addLog('success', `AI Refactoring Complete! Injected click route handlers into ${processed} HTML screens directly.`);
            addLog('info', 'All changes successfully synchronized back to your session workspace history!');
            alert("Route mappings successfully printed and hardwired into HTML anchor codes!");
        } catch (e) {
            console.error("Link refactoring failed: ", e);
            addLog('warn', 'AI Route Refactoring encountered an issue. See console.');
        } finally {
            setIsRefactoringHTML(false);
            setRefactorProgress(null);
        }
    };

    // Navigation triggers
    const handleBack = () => {
        if (historyIndex > 0) {
            const nextIdx = historyIndex - 1;
            setHistoryIndex(nextIdx);
            setCurrentPageId(routeHistory[nextIdx]);
            addLog('info', `Navigated Back to "${pages.find(p => p.id === routeHistory[nextIdx])?.title}"`);
        }
    };

    const handleForward = () => {
        if (historyIndex < routeHistory.length - 1) {
            const nextIdx = historyIndex + 1;
            setHistoryIndex(nextIdx);
            setCurrentPageId(routeHistory[nextIdx]);
            addLog('info', `Navigated Forward to "${pages.find(p => p.id === routeHistory[nextIdx])?.title}"`);
        }
    };

    const handleRestart = () => {
        if (entryPointId) {
            setRouteHistory([entryPointId]);
            setHistoryIndex(0);
            setCurrentPageId(entryPointId);
            addLog('event', 'Simulator Route restarted and reset to entry page.');
        }
    };

    const handleClearMapRules = () => {
        if (window.confirm("Are you sure you want to clear all configured connection routes?")) {
            setRouteRules({});
            localStorage.removeItem('semantic_route_rules');
            addLog('warn', 'Cleared all routing rules mappings.');
        }
    };

    // 3. Click intercept listener handler inside the simulated iframe
    useEffect(() => {
        const handleIframeMessage = (e: MessageEvent) => {
            const msg = e.data;
            if (!msg || typeof msg !== 'object') return;

            if (msg.type === 'ROUTER_CLICK_DETECTED') {
                const triggerText = msg.text || '';
                const clickHref = msg.href || '';
                const clickId = msg.id || '';

                addLog('event', `[INTERCEPT] Click identified: "${triggerText}" (href: "${clickHref}", id: "${clickId}")`);

                // 1. Explicit Rule Checklist lookup
                let matchedPageId = '';

                const currentPageRules = routeRules[currentPageId] || {};
                
                // Precise match by text
                if (currentPageRules[triggerText]) {
                    matchedPageId = currentPageRules[triggerText];
                }
                // Precise match by href target (if configured)
                else if (currentPageRules[clickHref]) {
                    matchedPageId = currentPageRules[clickHref];
                }
                // Partial heuristic matching (fallback if no precise rule setup yet)
                else {
                    const normTrigger = triggerText.toLowerCase();
                    const normHref = clickHref.toLowerCase();
                    
                    const partialMatch = pages.find(p => {
                        if (p.id === currentPageId) return false;
                        const tStyle = p.styleName.toLowerCase();
                        const tPrompt = p.sessionPrompt.toLowerCase();
                        
                        // Heuristic match prompts
                        return (normTrigger.length > 2 && (tStyle.includes(normTrigger) || tPrompt.includes(normTrigger) || normTrigger.includes(tStyle))) ||
                               (normHref.length > 1 && (tStyle.includes(normHref.substring(1)) || tPrompt.includes(normHref.substring(1))));
                    });
                    
                    if (partialMatch) {
                        matchedPageId = partialMatch.id;
                        addLog('info', `[HEURISTIC] Auto-matched trigger "${triggerText}" to page "${partialMatch.title}"`);
                    }
                }

                if (matchedPageId) {
                    const targetPage = pages.find(p => p.id === matchedPageId);
                    if (targetPage) {
                        addLog('success', `[TRANSITION] Routing event triggered! "${triggerText}" ➔ Navigating to "${targetPage.title}"`);
                        
                        // Append to navigation flow history
                        const newHistory = routeHistory.slice(0, historyIndex + 1);
                        newHistory.push(matchedPageId);
                        setRouteHistory(newHistory);
                        setHistoryIndex(newHistory.length - 1);
                        setCurrentPageId(matchedPageId);
                    }
                } else {
                    addLog('warn', `No connection is mapped for hotspot "${triggerText}". Connect this button in the Rule Weaver panel!`);
                }
            }
        };

        window.addEventListener('message', handleIframeMessage);
        return () => window.removeEventListener('message', handleIframeMessage);
    }, [currentPageId, routeRules, pages, routeHistory, historyIndex]);

    // Inject active router interceptor script inside iframe documents
    const readyIframeHtml = useMemo(() => {
        if (!activePage) return '';
        
        const routerInterceptor = `
        <script>
        (function() {
            // Prevent all form submissions and clicks reloading parent frame
            document.addEventListener('DOMContentLoaded', function() {
                // Ensure all anchor targets point to mock context
                document.querySelectorAll('a').forEach(function(el) {
                    el.removeAttribute('target');
                });
            });

            document.addEventListener('click', function(e) {
                const target = e.target.closest('a') || e.target.closest('button') || e.target.closest('[role="button"]') || e.target.closest('li');
                if (!target) return;

                const text = target.textContent ? target.textContent.trim() : '';
                const href = target.getAttribute('href') || '';
                const id = target.getAttribute('id') || '';

                // Notify outer orchestrator of routing click
                window.parent.postMessage({
                    type: 'ROUTER_CLICK_DETECTED',
                    text: text || 'Click Triggered',
                    href: href,
                    id: id
                }, '*');

                e.preventDefault();
                e.stopPropagation();
            }, true);

            // Intercept standard HTML form submission
            document.addEventListener('submit', function(e) {
                e.preventDefault();
                const submitBtn = e.target.querySelector('button[type="submit"]') || e.target.querySelector('input[type="submit"]');
                const text = submitBtn ? submitBtn.textContent.trim() : 'Form Submitted';
                window.parent.postMessage({
                    type: 'ROUTER_CLICK_DETECTED',
                    text: text,
                    href: '#form-submission',
                    id: e.target.getAttribute('id') || ''
                }, '*');
            }, true);
        })();
        </script>
        `;

        if (activePage.html.includes('</body>')) {
            return activePage.html.replace('</body>', `${routerInterceptor}</body>`);
        } else {
            return `${activePage.html}${routerInterceptor}`;
        }
    }, [activePage]);

    return (
        <div className="semantic-router-dashboard flex flex-col h-full bg-[#050507] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="router-header flex items-center justify-between px-6 py-4 bg-black/60 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <span className="pulse-bullet"></span>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wider text-white uppercase font-mono">
                            Semantic State Machine Router
                        </h2>
                        <p className="text-xs text-zinc-500">Multi-Page Orchestration Panel</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleAutoMapSemanticRoutes}
                        className="p-2 px-3 text-xs font-semibold rounded-lg bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/20 hover:bg-[#ec4899]/20 transition flex items-center gap-1.5"
                        disabled={isAutoMapping}
                        title="Auto-connect page anchors using smart semantics matches"
                    >
                        {isAutoMapping ? 'Mapping...' : '🔮 Auto Map Links'}
                    </button>
                    
                    <button 
                        onClick={handleRefactorHTMLRoutes}
                        className="p-2 px-3 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 transition flex items-center gap-1.5"
                        disabled={isRefactoringHTML}
                        title="Rewrite raw HTML code on workspace with hardcoded route handles"
                    >
                        {isRefactoringHTML ? 'Writing...' : '🔌 Commit to HTML'}
                    </button>

                    <button 
                        onClick={handleClearMapRules}
                        className="p-2 px-3 text-xs text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                        title="Clear all manual links mappings"
                    >
                        Clear Map
                    </button>

                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="p-2 px-3 text-xs font-semibold text-white bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                        >
                            Exit
                        </button>
                    )}
                </div>
            </div>

            {refactorProgress && (
                <div className="bg-pink-500/10 border-b border-pink-500/20 px-6 py-2 text-xs text-pink-300 flex items-center gap-2">
                    <span className="animate-pulse block w-2 h-2 rounded-full bg-pink-500"></span>
                    {refactorProgress}
                </div>
            )}

            {/* Split Content View */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left controls and log panel */}
                <div className="w-1/2 flex flex-col border-r border-[#1e1c27] overflow-hidden">
                    {/* Sub-Tab navigation header */}
                    <div className="flex bg-[#07070a]/90 border-b border-white/5 p-1 gap-1">
                        <button
                            onClick={() => setActiveSubTab('flowchart')}
                            className={`flex-1 py-2 text-xs font-semibold rounded-lg font-mono transition-all duration-200 uppercase tracking-tight flex items-center justify-center gap-1.5 ${
                                activeSubTab === 'flowchart'
                                    ? 'bg-[#ec4899]/12 text-[#ec4899] border border-[#ec4899]/25 shadow-[0_0_12px_rgba(236,72,153,0.1)] font-bold'
                                    : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            📊 Visual Flow Chart
                        </button>
                        <button
                            onClick={() => setActiveSubTab('weaver')}
                            className={`flex-1 py-2 text-xs font-semibold rounded-lg font-mono transition-all duration-200 uppercase tracking-tight flex items-center justify-center gap-1.5 ${
                                activeSubTab === 'weaver'
                                    ? 'bg-[#ec4899]/12 text-[#ec4899] border border-[#ec4899]/25 shadow-[0_0_12px_rgba(236,72,153,0.1)] font-bold'
                                    : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            🛠️ Connections Weaver
                        </button>
                    </div>

                    {activeSubTab === 'weaver' ? (
                        <div className="flex-1 overflow-y-auto p-5 space-y-5">
                            {/* Summary Description */}
                            <div className="p-4 bg-zinc-900/40 rounded-xl border border-white/5 space-y-1">
                                <h4 className="text-xs text-zinc-400 font-bold uppercase tracking-wider font-mono">System Architecture</h4>
                                <p className="text-xs text-zinc-500 leading-relaxed font-sans">
                                    Automatically link separate standalone generations together, formulating an interactive client traversal flow. Click buttons straight inside the simulation screen on the right to trigger fully connected routes.
                                </p>
                            </div>

                            {/* Configuration Controls */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-zinc-300 font-mono tracking-wider uppercase">
                                    🔗 Node Connections Graph
                                </h3>
                                
                                {pages.length === 0 ? (
                                    <div className="text-xs text-zinc-500 border border-dashed border-white/5 rounded-xl p-8 text-center bg-zinc-950/40">
                                        No completed page designs detected. Please generate at least 1-2 code pages in sessions first.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Select Active Screen to config */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-zinc-500 block mb-1 uppercase font-mono">Current Active Screen</label>
                                                <select
                                                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-2 text-xs text-white"
                                                    value={currentPageId}
                                                    onChange={(e) => {
                                                        const selectedId = e.target.value;
                                                        setCurrentPageId(selectedId);
                                                        setRouteHistory([selectedId]);
                                                        setHistoryIndex(0);
                                                        addLog('info', `Switched active preview screen base focus to: "${pages.find(p => p.id === selectedId)?.title}"`);
                                                    }}
                                                >
                                                    {pages.map(page => (
                                                        <option key={page.id} value={page.id}>
                                                            {page.title} {page.id === entryPointId ? '(Entry)' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[10px] text-zinc-500 block mb-1 uppercase font-mono">Choose Starting Page Link</label>
                                                <select
                                                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-2 text-xs text-white"
                                                    value={entryPointId}
                                                    onChange={(e) => {
                                                        const id = e.target.value;
                                                        setEntryPointId(id);
                                                        addLog('info', `Modified system primary entry anchor node to: "${pages.find(p => p.id === id)?.title}"`);
                                                    }}
                                                >
                                                    {pages.map(page => (
                                                        <option key={page.id} value={page.id}>
                                                            {page.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Rule Weaver - Config each hotspot trigger */}
                                        <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-bold text-zinc-300 font-mono uppercase">
                                                    🛠️ Rule Weaver: "{activePage?.styleName || 'Active Page'}"
                                                </span>
                                                <span className="text-[10px] text-zinc-500 px-2 py-0.5 rounded-full bg-zinc-800">
                                                    {activePageHotspots.length} Trigger Spots Scanned
                                                </span>
                                            </div>

                                            {activePageHotspots.length === 0 ? (
                                                <div className="text-xs text-zinc-500 italic py-2">
                                                    No buttons or anchor clicks identified on this template yet. Turn on Auto Map or add rules.
                                                </div>
                                            ) : (
                                                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                                                    {activePageHotspots.map((spot, i) => {
                                                        const currentMapRules = routeRules[currentPageId] || {};
                                                        const mappedTargetId = currentMapRules[spot.text] || '';
                                                        
                                                        return (
                                                            <div key={i} className="flex items-center justify-between gap-4 p-2 bg-[#0d0d11]/80 rounded-lg border border-white/5 hover:border-white/10 transition">
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-semibold text-zinc-200">
                                                                        "{spot.text}"
                                                                    </span>
                                                                    <span className="text-[10px] text-zinc-500 font-mono">
                                                                        {spot.type} anchor
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-zinc-500">➔</span>
                                                                    <select
                                                                        className="bg-[#050507] border border-white/10 text-zinc-200 text-xs rounded-md p-1 px-2 focus:outline-none focus:border-[#ec4899]/50 w-44"
                                                                        value={mappedTargetId}
                                                                        onChange={(e) => handleSetRouteRule(currentPageId, spot.text, e.target.value)}
                                                                    >
                                                                        <option value="">- Map target page -</option>
                                                                        {pages.map(p => (
                                                                            <option key={p.id} value={p.id}>
                                                                                {p.title}
                                                                            </option>
                                                                        ))}
                                                                    </select>

                                                                    {mappedTargetId && (
                                                                        <button 
                                                                            onClick={() => handleSimulateNavigation(mappedTargetId, spot.text)}
                                                                            className="p-1 px-2 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-white rounded font-mono"
                                                                            title="Directly trigger simulator jump here"
                                                                        >
                                                                            Jump
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Interactive Topology Graph Flowchart List */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-zinc-300 font-mono tracking-wider uppercase">
                                    📊 Website Topology Graph
                                </h3>
                                <div className="border border-white/5 rounded-xl p-4 bg-[#08080a] space-y-3 max-h-48 overflow-y-auto">
                                    {pages.map(page => {
                                        const countMapped = Object.keys(routeRules[page.id] || {}).length;
                                        return (
                                            <div key={page.id} className={`p-2.5 rounded-lg border ${page.id === currentPageId ? 'border-[#ec4899]/30 bg-[#ec4899]/5' : 'border-white/5 bg-zinc-900/40'} flex items-center justify-between`}>
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span className={`w-2 h-2 rounded-full ${page.id === entryPointId ? 'bg-emerald-400' : 'bg-pink-400'}`} title={page.id === entryPointId ? 'Main Entry' : 'Sub-page'}></span>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-xs font-semibold text-zinc-200 truncate">{page.styleName}</span>
                                                        <span className="text-[10px] text-zinc-500 truncate font-mono">{page.sessionPrompt}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-950 text-emerald-400 border border-emerald-500/10 font-mono">
                                                        {countMapped} Connection(s)
                                                    </span>
                                                    <button 
                                                        className="p-1 px-2 text-[10px] bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white font-mono"
                                                        onClick={() => {
                                                            setCurrentPageId(page.id);
                                                            setRouteHistory([page.id]);
                                                            setHistoryIndex(0);
                                                            addLog('info', `Selected active node focus to: "${page.title}"`);
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 flex flex-col h-full bg-[#020203]">
                            {/* Drag and drop interactive flowchart canvas */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xs font-bold text-zinc-100 font-mono tracking-wider uppercase">
                                        🛡️ Stateful Blueprint Traversal
                                    </h3>
                                    <p className="text-[10px] text-zinc-500">
                                        Drag header to arrange. Link outputs (○) to other cards, or drag pages from base dock directly onto hotspot slots!
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (window.confirm("Restore standard spacing grids?")) {
                                            const updated: Record<string, { x: number, y: number }> = {};
                                            pages.forEach((page, index) => {
                                                const cols = 2;
                                                const row = Math.floor(index / cols);
                                                const col = index % cols;
                                                updated[page.id] = {
                                                    x: 20 + col * 200,
                                                    y: 20 + row * 190
                                                };
                                            });
                                            setNodePositions(updated);
                                            localStorage.setItem('semantic_node_positions', JSON.stringify(updated));
                                            addLog('info', 'Reconfigured interactive spatial map layout positioning.');
                                        }
                                    }}
                                    className="text-[9px] px-2 py-1 bg-[#101014] hover:bg-zinc-800 text-zinc-400 rounded border border-white/5 transition font-mono whitespace-nowrap"
                                >
                                    Auto Layout
                                </button>
                            </div>

                            {/* Canvas coordinate relative overlay */}
                            <div 
                                ref={containerRef}
                                className="flex-1 min-h-[460px] relative rounded-xl border border-[#1e1c27] bg-[#020204] overflow-hidden select-none"
                                style={{
                                    backgroundSize: '20px 20px',
                                    backgroundImage: 'radial-gradient(circle, rgba(236,72,153,0.02) 1.2px, transparent 1.2px)'
                                }}
                                onMouseMove={handleContainerMouseMove}
                                onMouseUp={handleContainerMouseUpOrSocketEnd}
                                onMouseLeave={handleContainerMouseLeave}
                            >
                                <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
                                    <defs>
                                        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="3" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                        <marker id="arrow-pink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ec4899" />
                                        </marker>
                                        <marker id="arrow-glow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                                            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fb7185" />
                                        </marker>
                                        <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#fc0fc0" />
                                            <stop offset="100%" stopColor="#ec4899" />
                                        </linearGradient>
                                    </defs>

                                    {/* Curved Paths mapping lines */}
                                    {linesToRender.map(line => {
                                        const isActive = line.sourceId === currentPageId || line.targetId === currentPageId;
                                        return (
                                            <g key={line.id} className="cursor-pointer pointer-events-auto group">
                                                {/* Thick click boundary handler */}
                                                <path 
                                                    d={line.path}
                                                    stroke="transparent"
                                                    strokeWidth="10"
                                                    fill="none"
                                                    onClick={() => {
                                                        if (window.confirm(`Sever connected flow route for hotspot: "${line.triggerText}"?`)) {
                                                            handleDisconnectRule(line.sourceId, line.triggerText);
                                                        }
                                                    }}
                                                >
                                                    <title>Sever connected flow route for hotspot: "{line.triggerText}"</title>
                                                </path>
                                                {/* Glowing backing */}
                                                <path 
                                                    d={line.path}
                                                    stroke={isActive ? 'rgba(251,113,133,0.2)' : 'rgba(236,72,153,0.1)'}
                                                    strokeWidth="4"
                                                    fill="none"
                                                    filter="url(#neon-glow)"
                                                />
                                                {/* Sharper foreground glowing SVG curved arc */}
                                                <path 
                                                    d={line.path}
                                                    stroke={isActive ? '#fb7185' : 'url(#neonGradient)'}
                                                    strokeWidth="2"
                                                    fill="none"
                                                    markerEnd={isActive ? 'url(#arrow-glow)' : 'url(#arrow-pink)'}
                                                    className="transition-all duration-300"
                                                />
                                                {/* Glowing energy flow bullets traveling along curve */}
                                                <circle r="3" fill={isActive ? '#ffffff' : '#fbcfe8'}>
                                                    <animateMotion path={line.path} dur="3s" repeatCount="indefinite" />
                                                </circle>
                                            </g>
                                        );
                                    })}

                                    {/* Active connector preview wire */}
                                    {dragLinePath && (
                                        <path 
                                            d={dragLinePath}
                                            stroke="#f472b6"
                                            strokeWidth="2.2"
                                            strokeDasharray="3 3"
                                            fill="none"
                                            filter="url(#neon-glow)"
                                            markerEnd="url(#arrow-pink)"
                                        />
                                    )}
                                </svg>

                                {/* Render Draggable Cards representation */}
                                {pages.map(page => {
                                    const pos = nodePositions[page.id] || { x: 40, y: 40 };
                                    const isActiveNode = page.id === currentPageId;
                                    const isMainEntry = page.id === entryPointId;
                                    const hotspots = getPageHotspots(page.html);

                                    return (
                                        <div
                                            key={page.id}
                                            onMouseUp={() => handleConnectSocketToPage(page.id)}
                                            className={`absolute w-[180px] rounded-xl border text-white transition-all select-none z-10 flex flex-col bg-[#0b0a10]/95 ${
                                                isActiveNode 
                                                    ? 'border-[#ec4899] shadow-[0_0_18px_rgba(236,72,153,0.18)]' 
                                                    : 'border-[#1e1c27] hover:border-zinc-700'
                                            }`}
                                            style={{ left: pos.x, top: pos.y }}
                                        >
                                            {/* Left side node header acting as DRAG HANDLE */}
                                            <div 
                                                onMouseDown={(e) => handleNodeMouseDown(e, page.id)}
                                                className="p-2 bg-[#121118] border-b border-white/5 flex items-center justify-between cursor-grab active:cursor-grabbing rounded-t-xl"
                                            >
                                                <div className="flex items-center gap-1.5 overflow-hidden">
                                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isMainEntry ? 'bg-emerald-400 animate-pulse' : 'bg-pink-500'}`} title={isMainEntry ? 'EntryPoint Node' : 'Sub-Screen Node'} />
                                                    <span className="text-[11px] font-bold font-mono tracking-tight truncate max-w-[100px]" title={page.styleName}>
                                                        {page.styleName}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {isActiveNode && (
                                                        <span className="text-[8px] bg-[#ec4899]/15 text-[#ec4899] font-mono border border-[#ec4899]/25 p-0.5 px-1 rounded">
                                                            LIVE
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-zinc-600 font-mono">⠿</span>
                                                </div>
                                            </div>

                                            {/* Draggable Hotspots list */}
                                            <div className="p-2 space-y-2 flex-1 max-h-[140px] overflow-y-auto scrollbar-none">
                                                {hotspots.length === 0 ? (
                                                    <div className="text-[9.5px] text-zinc-600 italic text-center py-1.5 font-sans">
                                                        No visual navigation hotspots scanned
                                                    </div>
                                                ) : (
                                                    hotspots.map((trigger, trigIdx) => {
                                                        const mappedTargetId = (routeRules[page.id] || {})[trigger];
                                                        const hasLandingTarget = !!mappedTargetId;
                                                        const targetPage = pages.find(p => p.id === mappedTargetId);

                                                        return (
                                                            <div key={trigger} className="space-y-1">
                                                                <div className="flex items-center justify-between gap-1 overflow-hidden">
                                                                    <span className="text-[9.5px] font-mono text-zinc-400 truncate max-w-[110px]" title={trigger}>
                                                                        "{trigger}"
                                                                    </span>

                                                                    {/* Pin socket pin drawer connector */}
                                                                    <button
                                                                        onMouseDown={(e) => handleSocketDragStart(e, page.id, trigger, trigIdx)}
                                                                        className={`w-3.5 h-3.5 rounded-full border border-pink-500/30 flex items-center justify-center transition focus:outline-none ${
                                                                            hasLandingTarget 
                                                                                ? 'bg-emerald-500/10 border-emerald-400 text-emerald-400' 
                                                                                : 'bg-[#ec4899]/10 border-[#ec4899]/30 text-[#ec4899] hover:bg-[#ec4899]/20'
                                                                        }`}
                                                                        title="Click & Drag pin to target card mapping"
                                                                    >
                                                                        <span className="text-[7px]">○</span>
                                                                    </button>
                                                                </div>

                                                                {/* Interactive Drop target slot inside card representation */}
                                                                <div
                                                                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'link'; }}
                                                                    onDrop={(e) => {
                                                                        e.preventDefault();
                                                                        const targetPageId = e.dataTransfer.getData('targetPageId');
                                                                        if (targetPageId && targetPageId !== page.id) {
                                                                            handleSetRouteRule(page.id, trigger, targetPageId);
                                                                        }
                                                                    }}
                                                                    className={`border rounded p-1 flex items-center justify-between gap-1 text-[9px] transition-all duration-150 ${
                                                                        hasLandingTarget 
                                                                            ? 'border-emerald-500/15 bg-emerald-500/5 text-emerald-300' 
                                                                            : 'border-dashed border-zinc-800 bg-black/40 text-zinc-600 hover:border-zinc-700 hover:text-zinc-500'
                                                                    }`}
                                                                >
                                                                    <span className="truncate max-w-[110px]" title={hasLandingTarget ? `Navigates to ${targetPage?.styleName}` : 'Drop target page here'}>
                                                                        {hasLandingTarget ? `➔ ${targetPage?.styleName || 'Page'}` : '📥 drop page Block'}
                                                                    </span>
                                                                    {hasLandingTarget && (
                                                                        <button
                                                                            onClick={() => handleDisconnectRule(page.id, trigger)}
                                                                            className="w-3.1 h-3.1 bg-black/50 hover:bg-red-500/20 hover:text-red-400 rounded flex items-center justify-center text-[7px] p-0.5"
                                                                            title="Sever relationship"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            {/* Base block card controls */}
                                            <div className="p-1 px-2.5 bg-black/40 border-t border-white/5 flex items-center justify-between">
                                                <span 
                                                    draggable="true"
                                                    onDragStart={(e) => handlePageDragStart(e, page.id)}
                                                    className="text-[9px] text-[#ec4899] hover:text-[#fb7185] bg-[#ec4899]/10 border border-[#ec4899]/15 p-0.5 px-1.5 rounded cursor-grab active:cursor-grabbing font-mono"
                                                    title="Drag and drop onto slots"
                                                >
                                                    🎒 page-block
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setCurrentPageId(page.id);
                                                        setRouteHistory([page.id]);
                                                        setHistoryIndex(0);
                                                        addLog('info', `Preview window focused to Node "${page.title}"`);
                                                    }}
                                                    className="text-[9px] text-zinc-500 hover:text-white font-mono"
                                                >
                                                    Select
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Dock tray bottom mapping tool for raw Drag blocks */}
                            <div className="bg-[#09090c] border border-[#1e1c27] rounded-xl p-3.5 space-y-2">
                                <label className="text-[10px] text-zinc-400 block uppercase font-mono tracking-wider">
                                    🎒 Floating Node Dock (Drag Blocks onto slots to create route relations)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {pages.map(p => (
                                        <div
                                            key={p.id}
                                            draggable="true"
                                            onDragStart={(e) => handlePageDragStart(e, p.id)}
                                            className="p-1.5 px-2.5 bg-[#0e0d16] border border-white/5 hover:border-[#ec4899]/40 hover:bg-[#120a16] text-xs font-semibold rounded-lg font-mono text-zinc-200 hover:text-[#ec4899] cursor-grab active:cursor-grabbing transition duration-150 flex items-center gap-1.5"
                                        >
                                            <span className="text-zinc-600">⁝⁝</span>
                                            {p.styleName}
                                            <span className="text-[8px] bg-black text-[#ec4899] border border-[#ec4899]/20 p-0.5 px-1.5 rounded font-mono uppercase">
                                                drag
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Retro Logger Output */}
                    <div className="h-44 bg-black border-t border-white/5 flex flex-col overflow-hidden font-mono text-[11px]">
                        <div className="flex items-center justify-between bg-zinc-900/50 px-4 py-1.5 border-b border-white/5">
                            <span className="text-zinc-400 font-bold tracking-wider">STATE ROUTER TERMINAL CORES</span>
                            <span className="text-[#ec4899]/80 text-[10px]">● SIMULATOR WATCHDOG ACTIVE</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                            {logs.map((log, idx) => {
                                let color = 'text-zinc-500';
                                if (log.type === 'event') color = 'text-sky-300';
                                else if (log.type === 'warn') color = 'text-amber-400';
                                else if (log.type === 'success') color = 'text-emerald-400';
                                return (
                                    <div key={idx} className="flex gap-2">
                                        <span className="text-zinc-600">[{log.time}]</span>
                                        <span className={color}>{log.message}</span>
                                    </div>
                                );
                            })}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                </div>

                {/* Right Interactive Live Traversal Screen */}
                <div className="w-1/2 flex flex-col overflow-hidden bg-black/40">
                    {/* Control Address Bar */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-[#0a0a0c] border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleBack} 
                                disabled={historyIndex <= 0}
                                className="p-1 px-2 bg-zinc-900 rounded border border-white/5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                                title="Back Page"
                            >
                                ◀
                            </button>
                            <button 
                                onClick={handleForward} 
                                disabled={historyIndex >= routeHistory.length - 1}
                                className="p-1 px-2 bg-zinc-900 rounded border border-white/5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                                title="Forward Page"
                            >
                                ▶
                            </button>
                            <button 
                                onClick={handleRestart}
                                className="p-1 px-2 bg-zinc-900 rounded border border-white/5 text-emerald-400 hover:text-emerald-300 transition"
                                title="Restart flow from primary entry point"
                            >
                                ↺ Reset Flow
                            </button>
                        </div>
                        
                        <div className="flex-1 bg-black rounded-lg border border-white/5 p-1.5 text-xs text-zinc-500 flex items-center gap-2 overflow-hidden justify-between font-mono">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="text-[#ec4899]/70">https://ais-router.local/</span>
                                <span className="text-zinc-200 truncate font-semibold">
                                    {activePage?.styleName?.toLowerCase().replace(/\s+/g, '-')}
                                </span>
                            </div>
                            <span className="text-[9px] bg-zinc-800 text-zinc-400 p-0.5 px-1.5 rounded-full select-none">
                                SECURE PROTOTYPE
                            </span>
                        </div>
                    </div>

                    {/* Simulation frame representation */}
                    <div className="flex-1 p-6 flex items-center justify-center overflow-hidden">
                        {activePage ? (
                            <div className="w-full h-full max-w-[480px] rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-pink-500/5 bg-black flex flex-col relative group">
                                <div className="bg-zinc-950 p-2 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex gap-1.5 px-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/85"></span>
                                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/85"></span>
                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500/85"></span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-mono tracking-wider truncate px-4">
                                        Active Node: {activePage.styleName}
                                    </span>
                                    <div style={{ width: '38px' }}></div>
                                </div>
                                <div className="flex-1 bg-white relative">
                                    <iframe 
                                        srcDoc={readyIframeHtml}
                                        title="state-route-preview"
                                        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
                                        className="absolute inset-0 w-full h-full bg-zinc-950"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-zinc-500 max-w-sm space-y-2">
                                <div className="text-3xl">🎛️</div>
                                <h4 className="text-sm font-semibold text-white uppercase font-mono">Simulator Screen Inactive</h4>
                                <p className="text-xs leading-relaxed">
                                    Select an active screen focus in the connections panel on the left to start traversing the live multi-page site mockup.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
