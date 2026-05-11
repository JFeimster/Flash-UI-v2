
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ThinkingIcon, DownloadIcon, BotIcon, SparklesIcon, LayoutIcon, CodeIcon, CopyIcon, ChevronDownIcon, MagicWandIcon, SearchIcon, StarIcon, StarFilledIcon, BookmarkIcon, BookmarkFilledIcon, HeartIcon, HeartFilledIcon, XIcon, InfoIcon, CheckIcon, AlertCircleIcon } from './Icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Artifact, ComponentVariation, RecommendedPage, AnimationStyle, Template, Session } from '../types';
import { TEMPLATES } from '../templates';
import { ANIMATION_STYLES } from '../animations';
import { downloadCode, downloadZip, getExportedFiles, ExportedFiles } from '../utils/export';
import { formatAsMarkdown, downloadAsMarkdown, downloadAsPlainText, downloadAsPDF, downloadAsDoc } from '../utils/exportRecommendations';
import { deployToVercel } from '../utils/vercel';

interface DrawerContentProps {
    mode: 'code' | 'variations' | 'templates' | 'recommended' | 'animations' | 'ai-tools' | 'library' | null;
    data: any;
    isLoading: boolean;
    componentVariations: ComponentVariation[];
    savedArtifacts: Artifact[];
    sessions?: Session[];
    userApiKey?: string;
    setUserApiKey?: (key: string) => void;
    validateApiKey?: (key: string) => Promise<boolean>;
    apiKeyStatus?: { isValid: boolean | null; error: string | null; quotaInfo?: string };
    onApplyVariation: (html: string) => void;
    onTemplateClick: (prompt: string) => void;
    toggleFavorite?: (sessionId: string, artifactId: string) => void;
    toggleSave?: (sessionId: string, artifactId: string) => void;
    removeSaved?: (artifactId: string) => void;
    explainCode?: (code: string) => Promise<string | undefined>;
    refactorCode?: (code: string, instruction: string, onChunk?: (chunk: string) => void) => Promise<string | undefined>;
    onRefactorApply?: (newHtml: string) => void;
    generateRecommendedPages?: (sessionId: string, artifactId: string, outputFormat?: string) => Promise<RecommendedPage[]>;
    onSwitchMode?: (mode: 'code' | 'recommended') => void;
    applyAnimation?: (code: string, animationPrompt: string) => Promise<string | undefined>;
    generateAdditionalFile?: (baseHtml: string, filename: string, description: string, outputFormat?: string) => Promise<string>;
    onUpdateArtifactFiles?: (sessionId: string, artifactId: string, files: Record<string, string>) => void;
}

const FORMATS = [
    { id: 'static', label: 'Static HTML', desc: 'Direct browser use' },
    { id: 'nextjs', label: 'Next.js', desc: 'Modern App Router' },
    { id: 'react', label: 'React', desc: 'Best Single Component' },
    { id: 'vue', label: 'Vue', desc: 'SFC Version' },
    { id: 'svelte', label: 'Svelte', desc: 'Reactive Component' },
    { id: 'wix', label: 'Wix Velo', desc: 'For Wix Sites' },
    { id: 'notion', label: 'Notion', desc: 'Markdown Embed' },
];

const AI_TOOLS = [
    {
        id: 'real-copy',
        name: 'Real Content Injector',
        description: 'Replaces all placeholder text and generic data with realistic, high-quality copy tailored to the component\'s purpose.',
        prompt: 'Replace all placeholder text, "lorem ipsum", and generic content with realistic, engaging, and professional copy that fits the context of this UI. Keep the HTML structure identical.'
    },
    {
        id: 'a11y-fix',
        name: 'Accessibility Booster',
        description: 'Analyzes the HTML and enhances it with proper ARIA labels, semantic roles, and better keyboard navigation support.',
        prompt: 'Review the HTML for accessibility. Add missing aria-labels, alt text for images, ensure semantic HTML tags are used (like <nav>, <main>, <header>), and improve keyboard focus states. Maintain the original design.'
    },
    {
        id: 'dark-mode',
        name: 'Dark Mode Generator',
        description: 'Automatically creates a beautiful high-contrast dark theme version of the component.',
        prompt: 'Create a dark mode version of this UI. Use a deep, modern palette (like #09090b or #121212) with elegant high-contrast text and accents. Ensure it feels premium and easy on the eyes.'
    },
    {
        id: 'mobile-opt',
        name: 'Mobile Layout Optimizer',
        description: 'Refines the Tailwind classes to ensure maximum layout fluidity and perfect responsiveness on all mobile devices.',
        prompt: 'Optimize the responsiveness of this UI. Ensure all elements layout perfectly on small screens. Fix any horizontal scrolling, adjust padding for mobile, and make buttons thumb-friendly sizes. Use standard Tailwind responsive prefixes.'
    },
    {
        id: 'clean-code',
        name: 'Code Clean & Prep',
        description: 'Refactors the code for better performance, removes redundant styles, and organizes the structure for production.',
        prompt: 'Refactor this code to be cleaner and more production-ready. Remove any redundant CSS classes or inline styles. Group related Tailwind utilities. Ensure the structure is logical and well-organized while keeping the visual design identical.'
    },
    {
        id: 'code-opt',
        name: 'Logic Optimizer',
        description: 'Refactors logic for better readability and efficiency, simplifying complex expressions.',
        prompt: 'Review the underlying logic and structure. Simplify complex conditions, improve variable naming, and ensure the code follows best practices for efficiency and readability.'
    },
    {
        id: 'perf-boost',
        name: 'Performance Booster',
        description: 'Optimizes asset loading and speeds up execution by reducing overhead.',
        prompt: 'Optimize this component for performance. Focus on reducing DOM complexity, minimizing reflows, and ensuring efficient styling. If there are animations, make them hardware-accelerated.'
    },
    {
        id: 'add-docs',
        name: 'Documentation Pro',
        description: 'Adds helpful comments and documentation headers to the code for better maintainability.',
        prompt: 'Add clear, concise comments to the code. Include a header explaining the component\'s purpose and document any complex sections or specific Tailwind configurations used. Maintain the original code functionality.'
    }
];

export default function DrawerContent({
    mode,
    data,
    isLoading,
    componentVariations,
    savedArtifacts,
    sessions = [],
    userApiKey,
    setUserApiKey,
    validateApiKey,
    apiKeyStatus,
    onApplyVariation,
    onTemplateClick,
    toggleFavorite,
    toggleSave,
    removeSaved,
    explainCode,
    refactorCode,
    onRefactorApply,
    generateRecommendedPages,
    onSwitchMode,
    applyAnimation,
    generateAdditionalFile,
    onUpdateArtifactFiles
}: DrawerContentProps) {
    const [downloadFormat, setDownloadFormat] = useState<'static' | 'nextjs' | 'wix' | 'notion' | 'react' | 'vue' | 'svelte'>('static');
    const [recommendedFormat, setRecommendedFormat] = useState<string>('');
    const [hasManuallySelected, setHasManuallySelected] = useState(false);
    const [fileCopyFeedback, setFileCopyFeedback] = useState(false);

    const [localApiKey, setLocalApiKey] = useState(userApiKey || '');
    const [isApiKeyHelpOpen, setIsApiKeyHelpOpen] = useState(false);
    const [isValidating, setIsValidating] = useState(false);

    // AI Assistant state
    const [assistantMode, setAssistantMode] = useState<'none' | 'explain' | 'refactor'>('none');
    const [assistantResponse, setAssistantResponse] = useState<string>('');
    const [isAssistantLoading, setIsAssistantLoading] = useState(false);
    const [refactorInstruction, setRefactorInstruction] = useState('');

    // Recommended Pages state
    const [recommendedPages, setRecommendedPages] = useState<RecommendedPage[]>([]);
    const [isRecommendedLoading, setIsRecommendedLoading] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [exportFeedback, setExportFeedback] = useState<string | null>(null);

    // Animations state
    const [isAnimating, setIsAnimating] = useState(false);

    // Multi-file state
    const [activeFile, setActiveFile] = useState<string>('');
    const [generatingFiles, setGeneratingFiles] = useState<Set<string>>(new Set());
    const [exportedFiles, setExportedFiles] = useState<ExportedFiles>({});

    const [vercelToken, setVercelToken] = useState('');
    const [vercelProjectName, setVercelProjectName] = useState('my-flash-ui-project');
    const [isVercelDeploying, setIsVercelDeploying] = useState(false);
    const [vercelDeploymentResult, setVercelDeploymentResult] = useState<{ url: string } | null>(null);
    const [vercelDeployError, setVercelDeployError] = useState<string | null>(null);

    // GitHub state
    const [githubConnected, setGithubConnected] = useState<boolean | null>(null);
    const [isDeploying, setIsDeploying] = useState(false);
    const [deploymentResult, setDeploymentResult] = useState<{ url: string, name: string } | null>(null);
    const [showGithubModal, setShowGithubModal] = useState(false);
    const [repoName, setRepoName] = useState('');
    const [repoDescription, setRepoDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);

    useEffect(() => {
        if (data?.html) {
            const htmlContent = data.html.toLowerCase();
            const promptContent = (data.prompt || '').toLowerCase();
            let rec = 'static';

            // 1. Explicit Prompt Hooks (User intentions override heuristics)
            if (promptContent.includes('next.js') || promptContent.includes('nextjs')) rec = 'nextjs';
            else if (promptContent.includes('wix')) rec = 'wix';
            else if (promptContent.includes('notion')) rec = 'notion';
            else if (promptContent.includes('react')) rec = 'react';
            else if (promptContent.includes('vue')) rec = 'vue';
            else if (promptContent.includes('svelte')) rec = 'svelte';
            
            // 2. Code-based heuristics
            else if (htmlContent.includes('framer-motion') || htmlContent.includes('motion.')) {
                rec = 'nextjs';
            } 
            else if (htmlContent.includes('###') || (htmlContent.trim().startsWith('#') && !htmlContent.includes('<div'))) {
                rec = 'notion';
            }
            else if (htmlContent.includes('v-if') || htmlContent.includes('v-for')) {
                rec = 'vue';
            }
            else if (htmlContent.includes('class=') && data.html.length > 5000) {
                // Large complex pages are best as Next.js projects
                rec = 'nextjs';
            }
            else if (htmlContent.includes('lucide') || (htmlContent.includes('<button') && htmlContent.includes('onClick'))) {
                // Interactive components with logic
                rec = 'react';
            }
            else if (htmlContent.includes('<section') && data.html.length < 2500) {
                // Small sections are great for Wix Velo embedding
                rec = 'wix';
            }
            else if (htmlContent.includes('<html') || htmlContent.includes('<!doctype')) {
                // Full standalone documents
                rec = 'static';
            }
            else {
                // Default to React for snippets
                rec = 'react';
            }

            setRecommendedFormat(rec);
            
            // Auto-set the download format to the recommended one if user hasn't touched it
            if (!hasManuallySelected) {
                setDownloadFormat(rec as any);
            }
        }
    }, [data?.html, data?.prompt, hasManuallySelected]);

    const handleVercelDeploy = useCallback(async () => {
        if (!vercelToken) {
            setVercelDeployError('Vercel API Token is required');
            return;
        }
        setIsVercelDeploying(true);
        setVercelDeployError(null);
        try {
            const files = getExportedFiles(data.html, downloadFormat, data.additionalFiles);
            const result = await deployToVercel(vercelToken, files, vercelProjectName);
            setVercelDeploymentResult({ url: result.url });
        } catch (err: any) {
            setVercelDeployError(err.message || 'Deployment failed');
        } finally {
            setIsVercelDeploying(false);
        }
    }, [vercelToken, data?.html, downloadFormat, data?.additionalFiles, vercelProjectName]);

    const [templateSearch, setTemplateSearch] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        TEMPLATES.forEach(t => {
            if ((t as Template).tags) {
                (t as Template).tags!.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags).sort();
    }, []);

    const filteredTemplates = useMemo(() => {
        return TEMPLATES.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(templateSearch.toLowerCase()) || 
                                  t.description.toLowerCase().includes(templateSearch.toLowerCase());
            const matchesTag = !selectedTag || (t as Template).tags?.includes(selectedTag);
            return matchesSearch && matchesTag;
        });
    }, [templateSearch, selectedTag]);

    const [isMagicLoading, setIsMagicLoading] = useState(false);
    const [magicFeedback, setMagicFeedback] = useState<string | null>(null);

    const handleApplyMagic = useCallback(async (tool: typeof AI_TOOLS[0]) => {
        if (!refactorCode || !data?.html) return;
        setIsMagicLoading(true);
        setMagicFeedback(`Running ${tool.name}...`);
        
        try {
            const result = await refactorCode(data.html, tool.prompt);
            if (result && onRefactorApply) {
                onRefactorApply(result);
                setMagicFeedback('Magic applied successfully!');
                setTimeout(() => setMagicFeedback(null), 3000);
            }
        } catch (e) {
            setMagicFeedback('Magic failed. Try again.');
        } finally {
            setIsMagicLoading(false);
        }
    }, [refactorCode, data?.html, onRefactorApply]);

    const handleCopyRecommended = useCallback(() => {
        const md = formatAsMarkdown(recommendedPages);
        navigator.clipboard.writeText(md);
        setExportFeedback('Copied Markdown!');
        setTimeout(() => setExportFeedback(null), 2000);
    }, [recommendedPages]);

    const handleDownloadFormat = useCallback(async (format: 'md' | 'txt' | 'pdf' | 'doc') => {
        switch (format) {
            case 'md':
                downloadAsMarkdown(recommendedPages);
                break;
            case 'txt':
                downloadAsPlainText(recommendedPages);
                break;
            case 'pdf':
                downloadAsPDF(recommendedPages);
                break;
            case 'doc':
                await downloadAsDoc(recommendedPages);
                break;
        }
        setShowExportMenu(false);
    }, [recommendedPages]);


    const allSavedAndFavorites = useMemo(() => {
        // Collect all favorites from sessions
        const favorites = sessions.flatMap(s => 
            s.artifacts
                .filter(a => a.isFavorite)
                .map(a => ({ ...a, sessionId: s.id } as Artifact & { sessionId: string }))
        );
        
        // Combine with saved artifacts, avoiding duplicates by ID
        const combined = [...savedArtifacts] as (Artifact & { sessionId?: string })[];
        favorites.forEach(fav => {
            if (!combined.find(c => c.id === fav.id)) {
                combined.push(fav);
            }
        });
        
        return combined.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
    }, [sessions, savedArtifacts]);

    const isLoadingVariations = isLoading && mode === 'variations' && componentVariations.length === 0;

    useEffect(() => {
        if (mode === 'code') {
            checkGithubStatus();
        }
    }, [mode]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'github') {
                setGithubConnected(true);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const checkGithubStatus = async () => {
        try {
            const res = await fetch('/api/github/status');
            const data = await res.json();
            setGithubConnected(data.connected);
        } catch (e) {
            setGithubConnected(false);
        }
    };

    const handleGithubConnect = async () => {
        try {
            const res = await fetch('/api/auth/github/url');
            const { url } = await res.json();
            window.open(url, 'github_oauth', 'width=600,height=700');
        } catch (e) {
            console.error('Failed to get GitHub auth URL');
        }
    };

    const handleDeploy = async () => {
        if (!repoName.trim() || !data?.html) return;
        setIsDeploying(true);
        setDeploymentResult(null);

        try {
            const res = await fetch('/api/github/deploy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repoName: repoName.trim(),
                    description: repoDescription,
                    files: exportedFiles,
                    isPrivate
                })
            });

            const result = await res.json();
            if (result.success) {
                setDeploymentResult({ url: result.url, name: result.fullName });
                setShowGithubModal(false);
            } else {
                alert(result.error || 'Failed to deploy to GitHub');
            }
        } catch (e) {
            alert('An error occurred during deployment.');
        } finally {
            setIsDeploying(false);
        }
    };

    useEffect(() => {
        if (mode === 'code' && data?.html) {
            const files = getExportedFiles(data.html, downloadFormat, data.additionalFiles);
            setExportedFiles(files);
            if (!activeFile || !files[activeFile]) {
                setActiveFile(Object.keys(files)[0]);
            }
        }
    }, [mode, data, downloadFormat]);

    useEffect(() => {
        if (mode === 'recommended' && data?.sessionId && data?.artifactId && recommendedPages.length === 0) {
            loadRecommendedPages();
        }
    }, [mode, data]);

    const loadRecommendedPages = async () => {
        if (!generateRecommendedPages || !data?.sessionId) return;
        setIsRecommendedLoading(true);
        const pages = await generateRecommendedPages(data.sessionId, data.artifactId, downloadFormat);
        setRecommendedPages(pages);
        setIsRecommendedLoading(false);
    };

    const handleCopyFile = () => {
        const content = exportedFiles[activeFile];
        if (!content) return;
        navigator.clipboard.writeText(content);
        setFileCopyFeedback(true);
        setTimeout(() => setFileCopyFeedback(false), 2000);
    };

    const handleDownloadFile = () => {
        const content = exportedFiles[activeFile];
        if (!content) return;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = activeFile;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleGeneratePageFile = async (filename: string, description: string) => {
        if (!generateAdditionalFile || !onUpdateArtifactFiles || !data?.html) return;
        
        setGeneratingFiles(prev => {
            const next = new Set(prev);
            next.add(filename);
            return next;
        });

        try {
            const fileContent = await generateAdditionalFile(data.html, filename, description, downloadFormat);
            if (fileContent) {
                onUpdateArtifactFiles(data.sessionId, data.artifactId, { [filename]: fileContent });
            }
        } finally {
            setGeneratingFiles(prev => {
                const next = new Set(prev);
                next.delete(filename);
                return next;
            });
        }
    };

    const handleExplain = async () => {
        if (!explainCode || !data?.html) return;
        setIsAssistantLoading(true);
        setAssistantMode('explain');
        const explanation = await explainCode(data.html);
        setAssistantResponse(explanation || 'Failed to explain code.');
        setIsAssistantLoading(false);
    };

    const handleRefactor = async () => {
        if (!refactorCode || !refactorInstruction.trim() || !data?.html) return;
        setIsAssistantLoading(true);
        setAssistantMode('refactor');
        setAssistantResponse(''); // Clear previous
        const refactored = await refactorCode(data.html, refactorInstruction, (chunk) => {
            setAssistantResponse(chunk);
        });
        setIsAssistantLoading(false);
    };

    const handleApplyRefactor = () => {
        if (onRefactorApply && assistantResponse) {
            onRefactorApply(assistantResponse);
            setAssistantMode('none');
            setAssistantResponse('');
            setRefactorInstruction('');
        }
    };

    const handleApplyAnimation = async (style: AnimationStyle) => {
        if (!applyAnimation || !onRefactorApply || !data?.html) return;
        setIsAnimating(true);
        const animatedCode = await applyAnimation(data.html, style.prompt);
        if (animatedCode) {
            onRefactorApply(animatedCode);
        }
        setIsAnimating(false);
    };

    return (
        <>
            {isLoadingVariations && (
                 <div className="loading-state">
                     <ThinkingIcon /> 
                     Designing variations...
                 </div>
            )}

            {(mode === 'code' || mode === 'recommended') && (
                <div className="drawer-tabs">
                    <button 
                        className={`drawer-tab ${mode === 'code' ? 'active' : ''}`}
                        onClick={() => onSwitchMode?.('code')}
                    >
                        <CodeIcon /> Source
                    </button>
                    <button 
                        className={`drawer-tab ${mode === 'recommended' ? 'active' : ''}`}
                        onClick={() => onSwitchMode?.('recommended')}
                    >
                        <LayoutIcon /> Recommended
                    </button>
                </div>
            )}

            {mode === 'code' && (
                <div className="code-display-wrapper">
                    <div className="format-selector-wrapper">
                        <div className="format-label-row">
                            <label>Export Format:</label>
                        </div>
                        <div className="format-grid">
                            {FORMATS.map((f) => (
                                <button
                                    key={f.id}
                                    className={`format-btn ${downloadFormat === f.id ? 'active' : ''} ${recommendedFormat === f.id ? 'recommended' : ''}`}
                                    onClick={() => {
                                        setDownloadFormat(f.id as any);
                                        setHasManuallySelected(true);
                                    }}
                                >
                                    <div className="format-name">
                                        {f.label}
                                        {recommendedFormat === f.id && <span className="rec-badge">Best</span>}
                                    </div>
                                    <div className="format-desc">{f.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="code-header-actions">
                        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-start', width: '100%'}}>
                            <button 
                                className={`download-code-btn assistant-btn ${assistantMode === 'refactor' ? 'active' : ''}`} 
                                onClick={() => setAssistantMode(assistantMode === 'refactor' ? 'none' : 'refactor')}
                                title="AI Refactor"
                            >
                                <BotIcon /> Refactor
                            </button>
                            <button 
                                className="download-code-btn assistant-btn" 
                                onClick={handleExplain}
                                title="AI Explain"
                            >
                                <BotIcon /> Explain
                            </button>
                            <button 
                                className="download-code-btn" 
                                onClick={() => downloadZip(data.html, downloadFormat, data.additionalFiles)}
                                title="Download Project Zip"
                            >
                                <DownloadIcon /> Zip
                            </button>
                            <button 
                                className={`download-code-btn github-btn ${githubConnected ? 'active' : ''}`}
                                onClick={githubConnected ? () => setShowGithubModal(true) : handleGithubConnect}
                                title={githubConnected ? "Deploy to GitHub" : "Connect GitHub"}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                {githubConnected ? 'Deploy' : 'Connect'}
                            </button>
                        </div>
                    </div>

                    {showGithubModal && (
                        <div className="github-modal-overlay" onClick={() => setShowGithubModal(false)}>
                            <div className="github-modal" onClick={e => e.stopPropagation()}>
                                <div className="github-modal-header">
                                    <h3>Deploy to GitHub</h3>
                                    <button onClick={() => setShowGithubModal(false)}>×</button>
                                </div>
                                <div className="github-modal-content">
                                    <div className="input-group">
                                        <label>Repository Name</label>
                                        <input 
                                            type="text" 
                                            value={repoName} 
                                            onChange={e => setRepoName(e.target.value.replace(/[^a-zA-Z0-9._-]/g, '-'))}
                                            placeholder="my-awesome-project"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Description (Optional)</label>
                                        <textarea 
                                            value={repoDescription} 
                                            onChange={e => setRepoDescription(e.target.value)}
                                            placeholder="A beautiful web component generated by Flash UI"
                                        />
                                    </div>
                                    <div className="checkbox-group">
                                        <label>
                                            <input 
                                                type="checkbox" 
                                                checked={isPrivate} 
                                                onChange={e => setIsPrivate(e.target.checked)}
                                            />
                                            Private Repository
                                        </label>
                                    </div>
                                    <button 
                                        className="deploy-submit-btn" 
                                        onClick={handleDeploy}
                                        disabled={isDeploying || !repoName.trim()}
                                    >
                                        {isDeploying ? 'Deploying...' : 'Push to GitHub'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {deploymentResult && (
                        <div className="deployment-success-banner">
                            <div className="success-content">
                                <SparklesIcon />
                                <div>
                                    <strong>Success!</strong> Deployed to <span>{deploymentResult.name}</span>
                                </div>
                            </div>
                            <a href={deploymentResult.url} target="_blank" rel="noreferrer" className="view-repo-link">View Repo</a>
                            <button className="close-banner" onClick={() => setDeploymentResult(null)}>×</button>
                        </div>
                    )}

                    {assistantMode === 'refactor' && (
                        <div className="assistant-panel">
                            <div className="assistant-input-row">
                                <input 
                                    type="text" 
                                    className="assistant-input" 
                                    placeholder="e.g. Make it dark mode, add a shadow..." 
                                    value={refactorInstruction}
                                    onChange={(e) => setRefactorInstruction(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRefactor()}
                                />
                                <button 
                                    className="assistant-action-btn" 
                                    onClick={handleRefactor}
                                    disabled={isAssistantLoading || !refactorInstruction.trim()}
                                >
                                    {isAssistantLoading ? <ThinkingIcon /> : <SparklesIcon />}
                                </button>
                            </div>
                            {assistantResponse && !isAssistantLoading && (
                                <div className="assistant-result">
                                    <div className="assistant-result-header">
                                        <span>Refactored Preview</span>
                                        <button className="apply-btn" onClick={handleApplyRefactor}>Apply Changes</button>
                                    </div>
                                    <div className="assistant-preview-split">
                                        <pre className="code-block mini"><code>{assistantResponse}</code></pre>
                                        <div className="mini-preview-container">
                                            <iframe 
                                                srcDoc={assistantResponse} 
                                                title="Refactor Preview" 
                                                sandbox="allow-scripts allow-same-origin"
                                                className="mini-preview-iframe"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {assistantMode === 'explain' && (
                        <div className="assistant-panel">
                            <div className="assistant-header">
                                <BotIcon /> AI Explanation
                                <button className="close-mini-btn" onClick={() => setAssistantMode('none')}>×</button>
                            </div>
                            {isAssistantLoading ? (
                                <div className="assistant-loading"><ThinkingIcon /> Analyzing code...</div>
                            ) : (
                                <div className="assistant-explanation">
                                    {assistantResponse}
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                        <div className="file-tabs" style={{marginBottom: 0}}>
                            {Object.keys(exportedFiles).map(filename => (
                                <button 
                                    key={filename}
                                    className={`file-tab ${activeFile === filename ? 'active' : ''}`}
                                    onClick={() => setActiveFile(filename)}
                                >
                                    {filename}
                                </button>
                            ))}
                        </div>
                        <div style={{display: 'flex', gap: '8px'}}>
                            <button 
                                className="file-tab" 
                                onClick={handleCopyFile}
                                title="Copy File Content"
                                style={{display: 'flex', alignItems: 'center', gap: '4px'}}
                            >
                                <CopyIcon /> {fileCopyFeedback ? 'Copied!' : 'Copy'}
                            </button>
                            <button 
                                className="file-tab" 
                                onClick={handleDownloadFile}
                                title="Download File"
                                style={{display: 'flex', alignItems: 'center', gap: '4px'}}
                            >
                                <DownloadIcon /> Download
                            </button>
                        </div>
                    </div>

                    <div className="syntax-highlighter-wrapper">
                        <SyntaxHighlighter 
                            language={activeFile.endsWith('.tsx') || activeFile.endsWith('.ts') ? 'typescript' : 'html'} 
                            style={vscDarkPlus}
                            showLineNumbers={true}
                            customStyle={{
                                margin: 0,
                                background: 'transparent',
                                fontSize: '0.85rem',
                                padding: '16px'
                            }}
                        >
                            {exportedFiles[activeFile] || ''}
                        </SyntaxHighlighter>
                    </div>

                    <div className="vercel-deploy-section">
                        <div className="section-header">
                            <BotIcon /> DEPLOY_TO_VERCEL
                        </div>
                        <div className="vercel-form">
                            <input 
                                type="password" 
                                placeholder="Vercel API Token" 
                                value={vercelToken}
                                onChange={(e) => setVercelToken(e.target.value)}
                                className="vercel-input"
                            />
                            <input 
                                type="text" 
                                placeholder="Project Name" 
                                value={vercelProjectName}
                                onChange={(e) => setVercelProjectName(e.target.value)}
                                className="vercel-input"
                            />
                            <button 
                                className="blueprint-btn deploy-btn"
                                onClick={handleVercelDeploy}
                                disabled={isVercelDeploying}
                            >
                                {isVercelDeploying ? <ThinkingIcon /> : <DownloadIcon />}
                                {isVercelDeploying ? 'DEPLOYING...' : 'INITIALIZE_DEPLOYMENT'}
                            </button>
                        </div>
                        {vercelDeployError && <div className="deploy-error">{vercelDeployError}</div>}
                        {vercelDeploymentResult && (
                            <div className="deploy-success">
                                <p>Success! Your app is live at:</p>
                                <a href={`https://${vercelDeploymentResult.url}`} target="_blank" rel="noreferrer">
                                    {vercelDeploymentResult.url}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {mode === 'recommended' && (
                <div className="recommended-pages-wrapper">
                    <div className="recommended-actions-bar">
                        <div className="section-title">Project Blueprint</div>
                        <div className="blueprint-actions">
                            <button 
                                className="blueprint-btn copy-btn"
                                onClick={handleCopyRecommended}
                                title="Copy as Markdown"
                            >
                                <CopyIcon /> {exportFeedback || 'Copy Markdown'}
                            </button>
                            <div className="export-menu-container">
                                <button 
                                    className="blueprint-btn export-btn"
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                >
                                    <DownloadIcon /> Export <ChevronDownIcon />
                                </button>
                                {showExportMenu && (
                                    <div className="export-dropdown">
                                        <button onClick={() => handleDownloadFormat('md')}>Markdown (.md)</button>
                                        <button onClick={() => handleDownloadFormat('txt')}>Text (.txt)</button>
                                        <button onClick={() => handleDownloadFormat('pdf')}>PDF Document</button>
                                        <button onClick={() => handleDownloadFormat('doc')}>Word Doc (.docx)</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {isRecommendedLoading ? (
                        <div className="loading-state">
                            <ThinkingIcon /> 
                            Analyzing component & suggesting pages...
                        </div>
                    ) : (
                        <div className="recommended-list">
                            {recommendedPages.map((page, i) => (
                                <div key={i} className="recommended-card">
                                    <div className="recommended-header">
                                        <h3>{page.title}</h3>
                                    </div>
                                    <p className="recommended-desc">{page.description}</p>
                                    <div className="file-structure">
                                        <div className="structure-label">Suggested Structure:</div>
                                        <ul className="structure-list">
                                            {page.fileStructure.map((file, j) => {
                                                const isGenerated = data?.additionalFiles?.[file];
                                                const isGenerating = generatingFiles.has(file);
                                                
                                                return (
                                                    <li key={j} className="structure-item">
                                                        <span className="file-name">{file}</span>
                                                        {isGenerated ? (
                                                            <span className="generated-tag">Added</span>
                                                        ) : (
                                                            <button 
                                                                className="generate-file-btn"
                                                                onClick={() => handleGeneratePageFile(file, `Part of ${page.title}: ${page.description}`)}
                                                                disabled={isGenerating}
                                                            >
                                                                {isGenerating ? 'Generating...' : 'Generate'}
                                                            </button>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {mode === 'animations' && (
                <div className="animations-wrapper">
                    {isAnimating && (
                        <div className="loading-state">
                            <ThinkingIcon /> 
                            Applying sizzling animations...
                        </div>
                    )}
                    <div className="sexy-grid">
                        {ANIMATION_STYLES.map((style) => (
                            <div 
                                key={style.id} 
                                className="sexy-card animation-card"
                                onClick={() => handleApplyAnimation(style)}
                            >
                                <div className="sexy-label" style={{borderTop: 'none', background: 'transparent', textAlign: 'left', padding: '20px'}}>
                                    <div style={{fontSize: '1rem', marginBottom: '6px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'}}>
                                        <SparklesIcon /> {style.name}
                                    </div>
                                    <div style={{fontSize: '0.85rem', opacity: 0.7, lineHeight: 1.4}}>{style.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {mode === 'ai-tools' && (
                <div className="ai-tools-wrapper">
                    <div className="api-key-settings">
                        <div className="settings-header">
                            <div className="settings-title">
                                Gemini API Configuration
                                <button className="help-icon-btn" onClick={() => setIsApiKeyHelpOpen(!isApiKeyHelpOpen)} title="Help">
                                    <InfoIcon />
                                </button>
                            </div>
                            {apiKeyStatus?.quotaInfo && <div className="quota-display">{apiKeyStatus.quotaInfo}</div>}
                        </div>

                        {isApiKeyHelpOpen && (
                            <div className="api-key-help">
                                <p>To use your own Gemini API key:</p>
                                <ol>
                                    <li>Go to the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="help-link">Google AI Studio API Key page</a>.</li>
                                    <li>Create or copy your API key.</li>
                                    <li>Paste it below and click "Save & Validate".</li>
                                </ol>
                                <p className="help-note">Your key is stored securely in your browser's local storage.</p>
                            </div>
                        )}

                        <div className="api-key-input-group">
                            <div className="input-with-icon">
                                <input 
                                    type="password" 
                                    placeholder="Paste your Gemini API Key here..." 
                                    value={localApiKey}
                                    onChange={(e) => setLocalApiKey(e.target.value)}
                                    className={`api-key-input ${apiKeyStatus?.isValid === true ? 'valid' : ''} ${apiKeyStatus?.isValid === false ? 'invalid' : ''}`}
                                />
                                {apiKeyStatus?.isValid === true && <div className="status-icon success"><CheckIcon /></div>}
                                {apiKeyStatus?.isValid === false && <div className="status-icon error"><AlertCircleIcon /></div>}
                            </div>
                            <button 
                                className="save-api-key-btn"
                                onClick={async () => {
                                    setIsValidating(true);
                                    const success = await validateApiKey?.(localApiKey);
                                    if (success) {
                                        setUserApiKey?.(localApiKey);
                                    }
                                    setIsValidating(false);
                                }}
                                disabled={isValidating || !localApiKey}
                            >
                                {isValidating ? <ThinkingIcon /> : 'Save & Validate'}
                            </button>
                            {userApiKey && (
                                <button 
                                    className="clear-api-key-btn"
                                    onClick={() => {
                                        setLocalApiKey('');
                                        setUserApiKey?.('');
                                    }}
                                    title="Clear Key"
                                >
                                    <XIcon />
                                </button>
                            )}
                        </div>
                        {apiKeyStatus?.error && <div className="api-key-error">{apiKeyStatus.error}</div>}
                    </div>

                    <div className="magic-status-bar">
                        <div className="status-title">
                            <MagicWandIcon /> AI MAGIC TOOLS
                        </div>
                        {magicFeedback && <div className="magic-feedback">{magicFeedback}</div>}
                    </div>

                    {isMagicLoading ? (
                        <div className="loading-state">
                            <ThinkingIcon /> 
                            {magicFeedback || 'Consulting the AI spirits...'}
                        </div>
                    ) : (
                        <div className="sexy-grid">
                            {AI_TOOLS.map((tool) => (
                                <div 
                                    key={tool.id} 
                                    className="sexy-card ai-tool-card"
                                    onClick={() => handleApplyMagic(tool)}
                                >
                                    <div className="sexy-label" style={{borderTop: 'none', background: 'transparent', textAlign: 'left', padding: '20px'}}>
                                        <div style={{fontSize: '1rem', marginBottom: '8px', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px'}}>
                                            {tool.name}
                                        </div>
                                        <div style={{fontSize: '0.85rem', opacity: 0.6, lineHeight: 1.5}}>{tool.description}</div>
                                        <div className="magic-action-hint">Click to Apply Magic</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {mode === 'variations' && (
                <div className="sexy-grid">
                    {componentVariations.map((v, i) => (
                         <div key={i} className="sexy-card" onClick={() => onApplyVariation(v.html)}>
                             <div className="sexy-preview">
                                 <iframe srcDoc={v.html} title={v.name} sandbox="allow-scripts allow-same-origin" />
                             </div>
                             <div className="sexy-label">{v.name}</div>
                         </div>
                    ))}
                </div>
            )}

            {mode === 'templates' && (
                <div className="templates-wrapper">
                    <div className="templates-filter-bar">
                        <div className="template-search-container">
                            <SearchIcon />
                            <input 
                                type="text" 
                                placeholder="Search templates..." 
                                value={templateSearch}
                                onChange={(e) => setTemplateSearch(e.target.value)}
                            />
                        </div>
                        <div className="template-tags-scroll">
                            <button 
                                className={`tag-btn ${!selectedTag ? 'active' : ''}`}
                                onClick={() => setSelectedTag(null)}
                            >
                                All
                            </button>
                            {allTags.map(tag => (
                                <button 
                                    key={tag}
                                    className={`tag-btn ${selectedTag === tag ? 'active' : ''}`}
                                    onClick={() => setSelectedTag(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="sexy-grid">
                        {filteredTemplates.map((t, i) => (
                            <div key={i} className="sexy-card template-card" onClick={() => onTemplateClick(t.prompt)}>
                                <div className="sexy-label" style={{borderTop: 'none', background: 'transparent', textAlign: 'left', padding: '20px'}}>
                                    <div style={{fontSize: '1.1rem', marginBottom: '8px', color: '#fff', fontWeight: 700}}>{t.title}</div>
                                    <div style={{fontSize: '0.85rem', opacity: 0.6, lineHeight: 1.5, marginBottom: '12px'}}>{t.description}</div>
                                    <div className="template-tags">
                                        {(t as Template).tags?.map(tag => (
                                            <span key={tag} className="mini-tag">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredTemplates.length === 0 && (
                        <div className="no-results">
                            No templates found matching your criteria.
                        </div>
                    )}
                </div>
            )}

            {mode === 'library' && (
                <div className="library-wrapper">
                    {allSavedAndFavorites.length === 0 ? (
                        <div className="no-results" style={{padding: '60px 20px'}}>
                            <div className="empty-library-icons">
                                <BookmarkIcon />
                                <HeartIcon />
                            </div>
                            <div style={{marginTop: '24px', fontSize: '1.2rem', fontWeight: 600, color: '#fff'}}>Your Library is empty</div>
                            <div className="library-help-box">
                                <p>There are two ways to keep your designs:</p>
                                <ul>
                                    <li><BookmarkIcon /> <strong>Save:</strong> Click the bookmark icon to add a version permanently to your Library.</li>
                                    <li><HeartIcon /> <strong>Favorite:</strong> Click the heart/star icon to mark items you like; these will also appear here!</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="library-grid">
                            {allSavedAndFavorites.map((artifact) => (
                                <div key={artifact.id} className="library-item">
                                    <div className="library-item-preview">
                                        <iframe 
                                            srcDoc={artifact.html} 
                                            title={artifact.styleName} 
                                            sandbox="allow-scripts allow-same-origin"
                                        />
                                        <div className="library-item-overlay">
                                            <button 
                                                className="library-action-btn"
                                                onClick={() => {
                                                    if (artifact.isSaved) {
                                                        removeSaved?.(artifact.id);
                                                    } else if (artifact.sessionId) {
                                                        toggleFavorite?.(artifact.sessionId, artifact.id);
                                                    }
                                                }}
                                                title="Remove from Library"
                                            >
                                                <XIcon />
                                            </button>
                                            <button 
                                                className="library-action-btn primary"
                                                onClick={() => onApplyVariation(artifact.html)}
                                                title="View/Restore"
                                            >
                                                Restore
                                            </button>
                                        </div>
                                    </div>
                                    <div className="library-item-info">
                                        <div className="info-main">
                                            <span className="style-badge">{artifact.styleName}</span>
                                            <div className="info-badges">
                                                {artifact.isFavorite && <HeartFilledIcon style={{color: '#ff4757', width: '14px', height: '14px'}} />}
                                                {artifact.isSaved && <BookmarkFilledIcon style={{color: '#6b21ff', width: '14px', height: '14px'}} />}
                                            </div>
                                        </div>
                                        <div className="info-meta">
                                            {Object.keys(artifact.additionalFiles || {}).length > 0 && 
                                                <span>{Object.keys(artifact.additionalFiles || {}).length} files</span>
                                            }
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
