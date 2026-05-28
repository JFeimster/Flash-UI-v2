
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
import { 
    formatAsMarkdown, 
    downloadAsMarkdown, 
    downloadAsPlainText, 
    downloadAsPDF, 
    downloadAsDoc,
    downloadSuggestionsAsMarkdown,
    downloadSuggestionsAsPlainText,
    downloadSuggestionsAsJSON,
    downloadSuggestionsAsPDF
} from '../utils/exportRecommendations';
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
    generateTailoredRecommendations?: (currentPrompt: string, html: string, techStack?: string, searchQuery?: string) => Promise<{ components: string[], integrations: string[], apis: string[] }>;
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
    onUpdateArtifactFiles,
    generateTailoredRecommendations
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

    // Dynamic Blueprint Subtab State & Lists Tracker
    const [subTab, setSubTab] = useState<'pages' | 'components' | 'integrations' | 'apis' | 'grounding'>('pages');

    // Checked items for Injection
    const [checkedComponents, setCheckedComponents] = useState<Set<string>>(new Set());
    const [checkedIntegrations, setCheckedIntegrations] = useState<Set<string>>(new Set());
    const [checkedAPIs, setCheckedAPIs] = useState<Set<string>>(new Set());

    // Custom items lists (so users can add/create their own items)
    const [customComponents, setCustomComponents] = useState<string[]>([]);
    const [customIntegrations, setCustomIntegrations] = useState<string[]>([]);
    const [customAPIs, setCustomAPIs] = useState<string[]>([]);

    // Simple text box inputs for adding custom items
    const [customComponentInput, setCustomComponentInput] = useState('');
    const [customIntegrationInput, setCustomIntegrationInput] = useState('');
    const [customAPIInput, setCustomAPIInput] = useState('');

    // Search keywords for lists
    const [componentSearch, setComponentSearch] = useState('');
    const [integrationSearch, setIntegrationSearch] = useState('');
    const [apiSearch, setApiSearch] = useState('');

    const [localTechStack, setLocalTechStack] = useState(() => {
        return localStorage.getItem('flash_ui_tech_stack') || '';
    });
    const [showExportSuggestionsMenu, setShowExportSuggestionsMenu] = useState(false);
    const [realtimeSearch, setRealtimeSearch] = useState('');

    const [isInjecting, setIsInjecting] = useState(false);
    const [injectionStatus, setInjectionStatus] = useState<string | null>(null);
    const [isTailoring, setIsTailoring] = useState(false);

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

    const DEFAULT_RECOMMENDED_COMPONENTS = [
        "Sleek Dark Mode Toggle",
        "Multi-Column Responsive Grid View",
        "Interactive Data Table with Search & Filtering",
        "CSV/JSON Data Uploader & Preview Table",
        "Interactive Stats Overview Bento Grid",
        "Clean User Settings Modal with Profile Forms",
        "Animated Toast Notifications",
        "Responsive Navigation Sidebar",
        "Comprehensive Analytics Dashboard Header with Datepicker",
        "Interactive Kanban Board with Drag & Drop Stencils",
        "Responsive Horizontal Mega-Menu Navigation bar",
        "Beautiful Pricing Comparison Grid with Annual/Monthly Toggle",
        "Advanced Multi-step Onboarding & Registration Form",
        "Clean Accordion-Style Collapsible FAQ Section",
        "Dynamic Micro-Sparkline Charts & Trend Indicators",
        "Integrated Customer Feedback Widget with Rating Stars",
        "Slide-over Navigation Rail with Collapsing Control"
    ];

    const DEFAULT_INTEGRATIONS = [
        { name: "Firebase Firestore & Auth", desc: "Allows sign-in and saving artifacts to user portfolios with secure rules." },
        { name: "Google Drive & Google Picker", desc: "Saves generated code files directly in Drive and browses asset references." },
        { name: "Google Sheets Grounding", desc: "Integrates spreadsheets context dynamically into the UI as a database grid." },
        { name: "Google Calendar & Tasks", desc: "Saves schedules, events, or todo boards back to the user's active workspace." },
        { name: "Gmail & Google Meet Sync", desc: "Saves drafts of generated components or triggers automated meetings with deep links." },
        { name: "Supabase Database & Realtime", desc: "Connects a PostgreSQL database with real-time row-level listener subscriptions." },
        { name: "Stripe Subscriptions & Gateways", desc: "Configures secure checkout overlays, billing portals, and recurring packages." },
        { name: "Auth0 Single Sign-On (SSO)", desc: "Enables enterprise-grade multi-factor authentications and token handlers." },
        { name: "OpenAI Speech & Translate TTS", desc: "Converts frontend text selectors to realistic, high-fidelity vocal speech." },
        { name: "Algolia Lightning search index", desc: "Applies high-speed instant search query filters over large collections." },
        { name: "Sentry Performance Monitor", desc: "Auto-reports runtime exceptions, diagnostics, and session replay analytics." },
        { name: "Zapier Trigger Integration", desc: "Hooks up automated multi-step trigger webhooks when specific components execute." }
    ];

    const DEFAULT_APIS = [
        { name: "Stripe Subscriptions API", type: "Payment Processing", desc: "Fledges out subscriptions checkout and billing status pill elements." },
        { name: "SendGrid SMTP Mailer API", type: "Transactional Email", desc: "Automates scheduled report dispatches and verification triggers." },
        { name: "Twilio SMS & Alert API", type: "Notifications", desc: "Triggers urgent custom text indicators, verification codes, and client messages." },
        { name: "OpenWeather Live Forecast API", type: "Geo Feeds", desc: "Wires real-time live location weather widgets and forecast cards." },
        { name: "GitHub Repository API", type: "Deployment", desc: "Commits files directly to a repository or raises custom pull requests." },
        { name: "HubSpot CRM & Sync API", type: "CRM Systems", desc: "Synchronizes contact details, customer requests, and support tickets." },
        { name: "CoinGecko Market Feed API", type: "Crypto Feed", desc: "Pulls cryptocurrency charts and exchange values." },
        { name: "Unsplash Imagery Engine API", type: "Digital Assets", desc: "Direct searches for user avatars, mock design photos, and background banners." },
        { name: "Resend Email Dispatcher API", type: "Communications", desc: "Next-gen API specifically tuned to dispatch clean React-based mail drafts." },
        { name: "Google Cloud Client Translate API", type: "Localization", desc: "Translates entire text elements instantly based on client region triggers." },
        { name: "Slack Alerts Webhook Service", type: "Collaboration", desc: "Posts structured webhook payloads straight to team communication spaces." }
    ];

    // Filter computation memos
    const filteredComponentsList = useMemo(() => {
        const list = [...DEFAULT_RECOMMENDED_COMPONENTS, ...customComponents];
        if (!componentSearch.trim()) return list;
        return list.filter(item => item.toLowerCase().includes(componentSearch.toLowerCase()));
    }, [componentSearch, customComponents]);

    const filteredIntegrationsList = useMemo(() => {
        const list = [...DEFAULT_INTEGRATIONS.map(i => i.name), ...customIntegrations];
        if (!integrationSearch.trim()) return list;
        return list.filter(item => item.toLowerCase().includes(integrationSearch.toLowerCase()));
    }, [integrationSearch, customIntegrations]);

    const filteredAPIsList = useMemo(() => {
        const list = [...DEFAULT_APIS.map(a => a.name), ...customAPIs];
        if (!apiSearch.trim()) return list;
        return list.filter(item => item.toLowerCase().includes(apiSearch.toLowerCase()));
    }, [apiSearch, customAPIs]);

    // Check all / Uncheck all toggle actions for filtered items
    const toggleSelectAllComponents = () => {
        const allChecked = filteredComponentsList.every(comp => checkedComponents.has(comp));
        setCheckedComponents(curr => {
            const next = new Set(curr);
            filteredComponentsList.forEach(comp => {
                if (allChecked) {
                    next.delete(comp);
                } else {
                    next.add(comp);
                }
            });
            return next;
        });
    };

    const toggleSelectAllIntegrations = () => {
        const allChecked = filteredIntegrationsList.every(item => checkedIntegrations.has(item));
        setCheckedIntegrations(curr => {
            const next = new Set(curr);
            filteredIntegrationsList.forEach(item => {
                if (allChecked) {
                    next.delete(item);
                } else {
                    next.add(item);
                }
            });
            return next;
        });
    };

    const toggleSelectAllAPIs = () => {
        const allChecked = filteredAPIsList.every(item => checkedAPIs.has(item));
        setCheckedAPIs(curr => {
            const next = new Set(curr);
            filteredAPIsList.forEach(item => {
                if (allChecked) {
                    next.delete(item);
                } else {
                    next.add(item);
                }
            });
            return next;
        });
    };

    const handleInjectSelectedBlueprints = async () => {
        if (!refactorCode || !data?.html) return;
        setIsInjecting(true);
        setInjectionStatus("Analyzing code layout & synthesizing selected components...");

        const componentsToIncorporate = [
            ...Array.from(checkedComponents)
        ];
        const integrationsToIncorporate = [
            ...[...DEFAULT_INTEGRATIONS, ...customIntegrations.map(name => ({ name, desc: "Custom added AI integration requirement." }))].filter(item => checkedIntegrations.has(item.name)).map(item => `${item.name}: ${item.desc}`)
        ];
        const apisToIncorporate = [
            ...[...DEFAULT_APIS, ...customAPIs.map(name => ({ name, type: "Integration", desc: "Custom added API routing." }))].filter(item => checkedAPIs.has(item.name)).map(item => `${item.name} (${(item as any).type || 'Custom'}): ${item.desc}`)
        ];

        if (componentsToIncorporate.length === 0 && integrationsToIncorporate.length === 0 && apisToIncorporate.length === 0) {
            alert("Please select at least one component, integration, or API/Webhook from the checklists to inject!");
            setIsInjecting(false);
            return;
        }

        const prompt = `Refactor this UI to fully incorporate the following requested capabilities:
${componentsToIncorporate.length > 0 ? `COMPONENTS & UX MODES TO INTEGRATE:\n- ${componentsToIncorporate.join('\n- ')}\n` : ''}
${integrationsToIncorporate.length > 0 ? `AI INTEGRATIONS TO PRE-CONFIGURE:\n- ${integrationsToIncorporate.join('\n- ')}\n` : ''}
${apisToIncorporate.length > 0 ? `WEBHOOKS / ACTIONS / APIS TO STENCIL OUT:\n- ${apisToIncorporate.join('\n- ')}\n` : ''}

INSTRUCTIONS:
1. Revamp the UI layout. Add beautiful modern visual controls (like toggles, sidebars, interactive dashboard cards, forms, config panels, stats rows, action logs, connection states) representing each checked feature.
2. Structure the template code cleanly. Implement complete interactive mock states (using React/vanilla JS or Tailwind states) for these new controls so they look and work correctly inside the live preview.
3. Write actual client-ready stencils, variables, and API trigger structures (using fetch/axios placeholders), explaining where to put the keys and how the endpoints interact.
4. Maintain the absolute crisp visual vibe, background colors, and typography. Ensure the resulting UI looks high-fidelity, polished, and premium.`;

        try {
            setInjectionStatus("Writing code modifications...");
            const result = await refactorCode(data.html, prompt);
            if (result && onRefactorApply) {
                onRefactorApply(result);
                setInjectionStatus("Successfully integrated requested blueprints!");
                setTimeout(() => setInjectionStatus(null), 3000);
            } else {
                setInjectionStatus("Refinement returned empty. Try again.");
                setTimeout(() => setInjectionStatus(null), 3000);
            }
        } catch (e) {
            console.error(e);
            setInjectionStatus("Injection failed. Please check your token or try again.");
            setTimeout(() => setInjectionStatus(null), 3000);
        } finally {
            setIsInjecting(false);
        }
    };

    const handleAITailorRecommendations = async (overrideSearchQuery?: string) => {
        if (!data?.html || !generateTailoredRecommendations || !data?.prompt) {
            alert("Ensure your draft holds prompts before tailoring recommendations.");
            return;
        }
        setIsTailoring(true);
        if (overrideSearchQuery) {
            setInjectionStatus(`Querying real-time AI context for "${overrideSearchQuery}"...`);
        } else {
            setInjectionStatus("AI is analyzing active prototype context...");
        }
        try {
            const parsed = await generateTailoredRecommendations(data.prompt, data.html, localTechStack, overrideSearchQuery);
            
            if (parsed.components && parsed.components.length > 0) {
                setCustomComponents(prev => {
                    const nextList = [...prev];
                    parsed.components.forEach((c: string) => {
                        if (!nextList.includes(c)) nextList.push(c);
                    });
                    return nextList;
                });
                parsed.components.forEach((c: string) => setCheckedComponents(curr => {
                    const next = new Set(curr);
                    next.add(c);
                    return next;
                }));
            }
            if (parsed.integrations && parsed.integrations.length > 0) {
                setCustomIntegrations(prev => {
                    const nextList = [...prev];
                    parsed.integrations.forEach((i: string) => {
                        if (!nextList.includes(i)) nextList.push(i);
                    });
                    return nextList;
                });
                parsed.integrations.forEach((i: string) => setCheckedIntegrations(curr => {
                    const next = new Set(curr);
                    next.add(i);
                    return next;
                }));
            }
            if (parsed.apis && parsed.apis.length > 0) {
                setCustomAPIs(prev => {
                    const nextList = [...prev];
                    parsed.apis.forEach((a: string) => {
                        if (!nextList.includes(a)) nextList.push(a);
                    });
                    return nextList;
                });
                parsed.apis.forEach((a: string) => setCheckedAPIs(curr => {
                    const next = new Set(curr);
                    next.add(a);
                    return next;
                }));
            }
            setInjectionStatus(overrideSearchQuery ? "Live options grounded successfully!" : "Custom suggestions tailored & auto-checked!");
            setTimeout(() => setInjectionStatus(null), 3500);
        } catch (e) {
            console.error(e);
            setInjectionStatus("AI Analysis failed. Try again.");
            setTimeout(() => setInjectionStatus(null), 3000);
        } finally {
            setIsTailoring(false);
        }
    };

    const handleExportSuggestions = (format: 'md' | 'txt' | 'json' | 'pdf') => {
        const DEFAULT_RECOMMENDED_COMPONENTS = [
            "Interactive Stats Overview Bento Grid",
            "Clean User Settings Modal with Profile Forms",
            "Animated Toast Notifications",
            "Responsive Navigation Sidebar",
            "Comprehensive Analytics Dashboard Header with Datepicker",
            "Interactive Kanban Board with Drag & Drop Stencils",
            "Responsive Horizontal Mega-Menu Navigation bar",
            "Beautiful Pricing Comparison Grid with Annual/Monthly Toggle",
            "Advanced Multi-step Onboarding & Registration Form",
            "Clean Accordion-Style Collapsible FAQ Section",
            "Dynamic Micro-Sparkline Charts & Trend Indicators",
            "Integrated Customer Feedback Widget with Rating Stars",
            "Slide-over Navigation Rail with Collapsing Control"
        ];
    
        const DEFAULT_INTEGRATIONS = [
            { name: "Google Drive & Google Picker", desc: "Saves generated code files directly in Drive and browses asset references." },
            { name: "Google Sheets Grounding", desc: "Integrates spreadsheets context dynamically into the UI as a database grid." },
            { name: "Google Calendar & Tasks", desc: "Saves schedules, events, or todo boards back to the user's active workspace." },
            { name: "Gmail & Google Meet Sync", desc: "Saves drafts of generated components or triggers automated meetings with deep links." },
            { name: "Supabase Database & Realtime", desc: "Connects a PostgreSQL database with real-time row-level listener subscriptions." },
            { name: "Stripe Subscriptions & Gateways", desc: "Configures secure checkout overlays, billing portals, and recurring packages." },
            { name: "Auth0 Single Sign-On (SSO)", desc: "Enables enterprise-grade multi-factor authentications and token handlers." },
            { name: "OpenAI Speech & Translate TTS", desc: "Converts frontend text selectors to realistic, high-fidelity vocal speech." },
            { name: "Algolia Lightning search index", desc: "Applies high-speed instant search query filters over large collections." },
            { name: "Sentry Performance Monitor", desc: "Auto-reports runtime exceptions, diagnostics, and session replay analytics." },
            { name: "Zapier Trigger Integration", desc: "Hooks up automated multi-step trigger webhooks when specific components execute." }
        ];
    
        const DEFAULT_APIS = [
            { name: "Stripe Subscriptions API", type: "Payment Processing", desc: "Fledges out subscriptions checkout and billing status pill elements." },
            { name: "SendGrid SMTP Mailer API", type: "Transactional Email", desc: "Automates scheduled report dispatches and verification triggers." },
            { name: "Twilio SMS & Alert API", type: "Notifications", desc: "Triggers urgent custom text indicators, verification codes, and client messages." },
            { name: "OpenWeather Live Forecast API", type: "Geo Feeds", desc: "Wires real-time live location weather widgets and forecast cards." },
            { name: "GitHub Repository API", type: "Deployment", desc: "Commits files directly to a repository or raises custom pull requests." },
            { name: "HubSpot CRM & Sync API", type: "CRM Systems", desc: "Synchronizes contact details, customer requests, and support tickets." },
            { name: "CoinGecko Market Feed API", type: "Crypto Feed", desc: "Pulls cryptocurrency charts and exchange values." },
            { name: "Unsplash Imagery Engine API", type: "Digital Assets", desc: "Direct searches for user avatars, mock design photos, and background banners." },
            { name: "Resend Email Dispatcher API", type: "Communications", desc: "Next-gen API specifically tuned to dispatch clean React-based mail drafts." },
            { name: "Google Cloud Client Translate API", type: "Localization", desc: "Translates entire text elements instantly based on client region triggers." },
            { name: "Slack Alerts Webhook Service", type: "Collaboration", desc: "Posts structured webhook payloads straight to team communication spaces." }
        ];

        const components = [...DEFAULT_RECOMMENDED_COMPONENTS, ...customComponents];
        const integrations = [
            ...DEFAULT_INTEGRATIONS, 
            ...customIntegrations.map(name => ({ name, desc: "Custom added AI integration requirement." }))
        ];
        const apis = [
            ...DEFAULT_APIS, 
            ...customAPIs.map(name => ({ name, type: "Integration", desc: "Custom added API routing." }))
        ];

        const dataExport = {
            components,
            checkedComponents,
            integrations,
            checkedIntegrations,
            apis,
            checkedAPIs,
            techStack: localTechStack
        };

        if (format === 'md') {
            downloadSuggestionsAsMarkdown(dataExport);
        } else if (format === 'txt') {
            downloadSuggestionsAsPlainText(dataExport);
        } else if (format === 'json') {
            downloadSuggestionsAsJSON(dataExport);
        } else if (format === 'pdf') {
            downloadSuggestionsAsPDF(dataExport);
        }
        setShowExportSuggestionsMenu(false);
        setExportFeedback("Exported successfully!");
        setTimeout(() => setExportFeedback(null), 2500);
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
                        <div className="section-title">Architect Blueprint</div>
                        <div className="blueprint-actions">
                            {subTab === 'pages' ? (
                                <>
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
                                </>
                            ) : (
                                <div className="export-menu-container">
                                    <button 
                                        className="blueprint-btn export-btn"
                                        onClick={() => setShowExportSuggestionsMenu(!showExportSuggestionsMenu)}
                                        title="Export suggestions to PDF, Markdown, Text, JSON..."
                                    >
                                        <DownloadIcon /> Export Suggestions <ChevronDownIcon />
                                    </button>
                                    {showExportSuggestionsMenu && (
                                        <div className="export-dropdown">
                                            <button onClick={() => handleExportSuggestions('md')}>Markdown (.md)</button>
                                            <button onClick={() => handleExportSuggestions('txt')}>Plain Text (.txt)</button>
                                            <button onClick={() => handleExportSuggestions('json')}>JSON (.json)</button>
                                            <button onClick={() => handleExportSuggestions('pdf')}>PDF Report</button>
                                        </div>
                                    )}
                                </div>
                            )}
                            <button 
                                className="blueprint-btn ai-tailor-btn"
                                onClick={() => handleAITailorRecommendations()}
                                disabled={isTailoring || isInjecting}
                                title="AI Auto-suggest tailored components & APIs"
                            >
                                {isTailoring ? <ThinkingIcon /> : '🔮 AI Suggest'}
                            </button>
                        </div>
                    </div>

                    <div className="blueprint-tabs">
                        <button 
                            className={`blueprint-tab ${subTab === 'pages' ? 'active' : ''}`}
                            onClick={() => setSubTab('pages')}
                        >
                            🗂️ App Pages
                        </button>
                        <button 
                            className={`blueprint-tab ${subTab === 'components' ? 'active' : ''}`}
                            onClick={() => setSubTab('components')}
                        >
                            🧱 UI Components
                        </button>
                        <button 
                            className={`blueprint-tab ${subTab === 'integrations' ? 'active' : ''}`}
                            onClick={() => setSubTab('integrations')}
                        >
                            ⚡ AI Integrations
                        </button>
                        <button 
                            className={`blueprint-tab ${subTab === 'apis' ? 'active' : ''}`}
                            onClick={() => setSubTab('apis')}
                        >
                            🔌 Actions & APIs
                        </button>
                        <button 
                            className={`blueprint-tab ${subTab === 'grounding' ? 'active' : ''}`}
                            onClick={() => setSubTab('grounding')}
                            style={{ position: 'relative' }}
                        >
                            🎯 Grounding Hub
                            <span className="live-pulse-badge">Live</span>
                        </button>
                    </div>

                    {injectionStatus && (
                        <div className="injection-status-banner">
                            <span className="pulse-bullet"></span> {injectionStatus}
                        </div>
                    )}

                    {subTab === 'pages' && (
                        <>
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
                                    {recommendedPages.length === 0 && (
                                        <div className="recommended-empty-tip">
                                            No pages suggested yet. Select standard Static, Next.js or React formats to fetch full-stack blueprint page arrays.
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {subTab === 'components' && (
                        <div className="sub-components-panel">
                            <p className="tab-instructions">Select responsive layout modes, views, or complementary components to insert straight into this prototype.</p>
                            
                            <div className="add-custom-row">
                                <input 
                                    type="text" 
                                    placeholder="Add custom component/mode descriptor..." 
                                    value={customComponentInput}
                                    onChange={(e) => setCustomComponentInput(e.target.value)}
                                    className="custom-input-box"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && customComponentInput.trim()) {
                                            const val = customComponentInput.trim();
                                            setCustomComponents(prev => [...prev, val]);
                                            setCheckedComponents(curr => {
                                                const next = new Set(curr);
                                                next.add(val);
                                                return next;
                                            });
                                            setCustomComponentInput('');
                                        }
                                    }}
                                />
                                <button className="add-custom-btn" onClick={() => {
                                    if (customComponentInput.trim()) {
                                        const val = customComponentInput.trim();
                                        setCustomComponents(prev => [...prev, val]);
                                        setCheckedComponents(curr => {
                                            const next = new Set(curr);
                                            next.add(val);
                                            return next;
                                        });
                                        setCustomComponentInput('');
                                    }
                                }}>Add</button>
                            </div>

                            {/* Search Filter input */}
                            <div className="checklist-search-wrapper">
                                <input 
                                    type="text" 
                                    className="checklist-search-input" 
                                    placeholder="Filter components below..." 
                                    value={componentSearch}
                                    onChange={(e) => setComponentSearch(e.target.value)}
                                />
                                <span className="checklist-search-icon">🔍</span>
                            </div>

                            {/* Selection actions & counter */}
                            <div className="checklist-utils-row">
                                <button className="util-link-btn" onClick={toggleSelectAllComponents}>
                                    {filteredComponentsList.every(c => checkedComponents.has(c)) ? "Uncheck All Filtered" : "Check All Filtered"}
                                </button>
                                <span className="filter-count-badge">
                                    {filteredComponentsList.filter(c => checkedComponents.has(c)).length} of {filteredComponentsList.length} selected
                                </span>
                            </div>

                            <div className="curated-checklist">
                                {filteredComponentsList.map((comp, idx) => {
                                    const isChecked = checkedComponents.has(comp);
                                    return (
                                        <label key={idx} className={`checklist-item ${isChecked ? 'checked' : ''}`}>
                                            <input 
                                                type="checkbox" 
                                                checked={isChecked}
                                                onChange={() => {
                                                    setCheckedComponents(curr => {
                                                        const next = new Set(curr);
                                                        if (next.has(comp)) next.delete(comp);
                                                        else next.add(comp);
                                                        return next;
                                                    });
                                                }}
                                            />
                                            <span className="checklist-label">{comp}</span>
                                        </label>
                                    );
                                })}
                                {filteredComponentsList.length === 0 && (
                                    <div className="no-results" style={{padding: '12px 6px', fontSize: '0.8rem', opacity: 0.6}}>
                                        No matching components. Press "Add" to create one.
                                    </div>
                                )}
                            </div>

                            <button 
                                className="inject-blueprints-btn pulsing"
                                onClick={handleInjectSelectedBlueprints}
                                disabled={isInjecting || isTailoring}
                            >
                                {isInjecting ? <ThinkingIcon /> : '⚡ Inject Selected Components & Modes'}
                            </button>
                        </div>
                    )}

                    {subTab === 'integrations' && (
                        <div className="sub-components-panel">
                            <p className="tab-instructions">Toggle real-time Firebase syncing, file exports, or automated Google Workspace integrations into the HTML draft stencils.</p>
                            
                            <div className="add-custom-row">
                                <input 
                                    type="text" 
                                    placeholder="Add custom workspace/database task context..." 
                                    value={customIntegrationInput}
                                    className="custom-input-box"
                                    onChange={(e) => setCustomIntegrationInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && customIntegrationInput.trim()) {
                                            const val = customIntegrationInput.trim();
                                            setCustomIntegrations(prev => [...prev, val]);
                                            setCheckedIntegrations(curr => {
                                                const next = new Set(curr);
                                                next.add(val);
                                                return next;
                                            });
                                            setCustomIntegrationInput('');
                                        }
                                    }}
                                />
                                <button className="add-custom-btn" onClick={() => {
                                    if (customIntegrationInput.trim()) {
                                        const val = customIntegrationInput.trim();
                                        setCustomIntegrations(prev => [...prev, val]);
                                        setCheckedIntegrations(curr => {
                                            const next = new Set(curr);
                                            next.add(val);
                                            return next;
                                        });
                                        setCustomIntegrationInput('');
                                    }
                                }}>Add</button>
                            </div>

                            {/* Search Filter input */}
                            <div className="checklist-search-wrapper">
                                <input 
                                    type="text" 
                                    className="checklist-search-input" 
                                    placeholder="Filter integrations below..." 
                                    value={integrationSearch}
                                    onChange={(e) => setIntegrationSearch(e.target.value)}
                                />
                                <span className="checklist-search-icon">🔍</span>
                            </div>

                            {/* Selection actions & counter */}
                            <div className="checklist-utils-row">
                                <button className="util-link-btn" onClick={toggleSelectAllIntegrations}>
                                    {filteredIntegrationsList.every(i => checkedIntegrations.has(i)) ? "Uncheck All Filtered" : "Check All Filtered"}
                                </button>
                                <span className="filter-count-badge">
                                    {filteredIntegrationsList.filter(i => checkedIntegrations.has(i)).length} of {filteredIntegrationsList.length} selected
                                </span>
                            </div>

                            <div className="curated-checklist">
                                {filteredIntegrationsList.map((item, idx) => {
                                    const isChecked = checkedIntegrations.has(item);
                                    const desc = DEFAULT_INTEGRATIONS.find(i => i.name === item)?.desc || "Custom added AI integration requirement.";
                                    return (
                                        <label key={idx} className={`checklist-item has-desc ${isChecked ? 'checked' : ''}`}>
                                            <div className="checkbox-wrap">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isChecked}
                                                    onChange={() => {
                                                        setCheckedIntegrations(curr => {
                                                            const next = new Set(curr);
                                                            if (next.has(item)) next.delete(item);
                                                            else next.add(item);
                                                            return next;
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <div className="checklist-texts">
                                                <span className="checklist-label-strong">{item}</span>
                                                <span className="checklist-desc">{desc}</span>
                                            </div>
                                        </label>
                                    );
                                })}
                                {filteredIntegrationsList.length === 0 && (
                                    <div className="no-results" style={{padding: '12px 6px', fontSize: '0.8rem', opacity: 0.6}}>
                                        No matching integrations. Press "Add" to create one.
                                    </div>
                                )}
                            </div>

                            <button 
                                className="inject-blueprints-btn pulsing"
                                onClick={handleInjectSelectedBlueprints}
                                disabled={isInjecting || isTailoring}
                            >
                                {isInjecting ? <ThinkingIcon /> : '⚡ Inject Selected Workspaces & AI Sync'}
                            </button>
                        </div>
                    )}

                    {subTab === 'apis' && (
                        <div className="sub-components-panel">
                            <p className="tab-instructions">Configure microservices, payment tunnels, SMTP servers, geographic feeds, or Github webhooks with live interactive states.</p>
                            
                            <div className="add-custom-row">
                                <input 
                                    type="text" 
                                    placeholder="Add custom Webhook / REST API routing..." 
                                    className="custom-input-box"
                                    value={customAPIInput}
                                    onChange={(e) => setCustomAPIInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && customAPIInput.trim()) {
                                            const val = customAPIInput.trim();
                                            setCustomAPIs(prev => [...prev, val]);
                                            setCheckedAPIs(curr => {
                                                const next = new Set(curr);
                                                next.add(val);
                                                return next;
                                            });
                                            setCustomAPIInput('');
                                        }
                                    }}
                                />
                                <button className="add-custom-btn" onClick={() => {
                                    if (customAPIInput.trim()) {
                                        const val = customAPIInput.trim();
                                        setCustomAPIs(prev => [...prev, val]);
                                        setCheckedAPIs(curr => {
                                            const next = new Set(curr);
                                            next.add(val);
                                            return next;
                                        });
                                        setCustomAPIInput('');
                                    }
                                }}>Add</button>
                            </div>

                            {/* Search Filter input */}
                            <div className="checklist-search-wrapper">
                                <input 
                                    type="text" 
                                    className="checklist-search-input" 
                                    placeholder="Filter APIs/Webhooks below..." 
                                    value={apiSearch}
                                    onChange={(e) => setApiSearch(e.target.value)}
                                />
                                <span className="checklist-search-icon">🔍</span>
                            </div>

                            {/* Selection actions & counter */}
                            <div className="checklist-utils-row">
                                <button className="util-link-btn" onClick={toggleSelectAllAPIs}>
                                    {filteredAPIsList.every(a => checkedAPIs.has(a)) ? "Uncheck All Filtered" : "Check All Filtered"}
                                </button>
                                <span className="filter-count-badge">
                                    {filteredAPIsList.filter(a => checkedAPIs.has(a)).length} of {filteredAPIsList.length} selected
                                </span>
                            </div>

                            <div className="curated-checklist">
                                {filteredAPIsList.map((item, idx) => {
                                    const isChecked = checkedAPIs.has(item);
                                    const apiObj = DEFAULT_APIS.find(a => a.name === item);
                                    const desc = apiObj ? `${apiObj.type} • ${apiObj.desc}` : "Custom added API / Webhook trigger routing.";
                                    return (
                                        <label key={idx} className={`checklist-item has-desc ${isChecked ? 'checked' : ''}`}>
                                            <div className="checkbox-wrap">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isChecked}
                                                    onChange={() => {
                                                        setCheckedAPIs(curr => {
                                                            const next = new Set(curr);
                                                            if (next.has(item)) next.delete(item);
                                                            else next.add(item);
                                                            return next;
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <div className="checklist-texts">
                                                <span className="checklist-label-strong">{item}</span>
                                                <span className="checklist-desc">{desc}</span>
                                            </div>
                                        </label>
                                    );
                                })}
                                {filteredAPIsList.length === 0 && (
                                    <div className="no-results" style={{padding: '12px 6px', fontSize: '0.8rem', opacity: 0.6}}>
                                        No matching APIs. Press "Add" to create one.
                                    </div>
                                )}
                            </div>

                            <button 
                                className="inject-blueprints-btn pulsing"
                                onClick={handleInjectSelectedBlueprints}
                                disabled={isInjecting || isTailoring}
                            >
                                {isInjecting ? <ThinkingIcon /> : '⚡ Inject Selected Actions & Webhooks'}
                            </button>
                        </div>
                    )}

                    {subTab === 'grounding' && (
                        <div className="sub-components-panel grounding-hub-panel">
                            <p className="tab-instructions">
                                Connect your exact local apps / tools stack and trigger Google Search grounded queries to fetch and automatically inject the latest real-time libraries, elements, and configurations into your suggestions.
                            </p>

                            {/* Tech Stack Input Section */}
                            <div className="grounding-section">
                                <div className="grounding-section-title">
                                    🔌 Tech Stack & Local App Environment
                                </div>
                                <div className="tech-stack-input-wrapper" style={{ marginTop: '8px' }}>
                                    <label className="grounding-label-helper">My Active Tech Stack & Tools:</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter tools, e.g. React, Supabase, Tailwind, Stripe, Resend..."
                                        value={localTechStack}
                                        onChange={(e) => {
                                            setLocalTechStack(e.target.value);
                                            localStorage.setItem('flash_ui_tech_stack', e.target.value);
                                        }}
                                        className="tech-stack-input-box"
                                        style={{ width: '100%', marginBottom: '10px' }}
                                    />
                                </div>

                                <div className="pills-helper-text">
                                    Click any of these popular tools to instantly toggle/add them to your stack context:
                                </div>
                                <div className="tech-stack-pills">
                                    {['React', 'Vite', 'Supabase', 'Stripe', 'Tailwind', 'Clerk', 'Framer Motion', 'Resend', 'Prisma', 'PostgreSQL', 'MongoDB', 'Redis', 'Lucide Icons', 'Recharts'].map((tool) => {
                                        const toolsList = localTechStack.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
                                        const isActive = toolsList.includes(tool.toLowerCase());
                                        return (
                                            <button 
                                                key={tool}
                                                className={`tech-stack-pill ${isActive ? 'active' : ''}`}
                                                onClick={() => {
                                                    let nextStack = localTechStack.split(',').map(s => s.trim()).filter(Boolean);
                                                    if (isActive) {
                                                        nextStack = nextStack.filter(s => s.toLowerCase() !== tool.toLowerCase());
                                                    } else {
                                                        nextStack.push(tool);
                                                    }
                                                    const val = nextStack.join(', ');
                                                    setLocalTechStack(val);
                                                    localStorage.setItem('flash_ui_tech_stack', val);
                                                }}
                                            >
                                                {isActive ? '✓ ' : '+ '} {tool}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Live Query Grounding Section */}
                            <div className="grounding-section" style={{ marginTop: '20px' }}>
                                <div className="grounding-section-title">
                                    🔍 Live Web & Real-Time AI Search Query
                                </div>
                                <p className="grounding-subtitle-helper">
                                    Enter a targeted concept. Gemini will query the live web with Google Search Grounding to construct bespoke, integration-accurate elements for your project.
                                </p>
                                <div className="realtime-search-container" style={{ marginTop: '10px' }}>
                                    <div className="realtime-search-field">
                                        <input 
                                            type="text" 
                                            placeholder="Type key term, e.g., 'Stripe payment flow', 'Supabase realtime chat', 'Kanban Board'..."
                                            value={realtimeSearch}
                                            onChange={(e) => setRealtimeSearch(e.target.value)}
                                            className="realtime-search-input-box"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && realtimeSearch.trim()) {
                                                    handleAITailorRecommendations(realtimeSearch);
                                                }
                                            }}
                                        />
                                        <button 
                                            onClick={() => {
                                                if (realtimeSearch.trim()) {
                                                    handleAITailorRecommendations(realtimeSearch);
                                                }
                                            }}
                                            disabled={isTailoring || !realtimeSearch.trim()}
                                            className="realtime-ground-btn"
                                            title="Trigger live grounding query"
                                            style={{ padding: '0 20px', minHeight: '42px' }}
                                        >
                                            {isTailoring ? <ThinkingIcon /> : "Ground Live"}
                                        </button>
                                    </div>
                                </div>

                                <div className="pills-helper-text" style={{ marginTop: '14px' }}>
                                    Popular Grounded Queries (Click to instantly search):
                                </div>
                                <div className="recommended-queries-grid">
                                    {[
                                        { label: '💳 Stripe Checkout Overlay', query: 'Stripe premium billing portal checkout form' },
                                        { label: '💬 Realtime Supabase Chat', query: 'Supabase realtime chat socket channel' },
                                        { label: '📊 Recharts Stats Dashboard', query: 'Recharts visual analytic dashboards interactive grid' },
                                        { label: '🔒 Clerk Authentication', query: 'Clerk enterprise authentication user management form' },
                                        { label: '📥 Resend Email Forms', query: 'Resend API transactional mail dispatcher' },
                                        { label: '🧱 Interactive Kanban Drag-n-Drop', query: 'Kanban board complete stencils with active drag events' }
                                    ].map((rq, idx) => (
                                        <button 
                                            key={idx}
                                            className="recommended-query-button"
                                            onClick={() => {
                                                setRealtimeSearch(rq.query);
                                                handleAITailorRecommendations(rq.query);
                                            }}
                                            disabled={isTailoring}
                                        >
                                            <span style={{ marginRight: '6px' }}>⚡</span>
                                            {rq.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Overview / Feedback State */}
                            <div className="grounding-recap-section">
                                <div className="recap-header">🎯 Suggestions Overview & Recap</div>
                                <div className="recap-stats-row">
                                    <div className="recap-stat-card">
                                        <span className="stat-num">{customComponents.length + 13}</span>
                                        <span className="stat-lbl">Components Available</span>
                                    </div>
                                    <div className="recap-stat-card">
                                        <span className="stat-num">{customIntegrations.length + 11}</span>
                                        <span className="stat-lbl">AI Integrations Available</span>
                                    </div>
                                    <div className="recap-stat-card">
                                        <span className="stat-num">{customAPIs.length + 11}</span>
                                        <span className="stat-lbl">Actions & APIs Available</span>
                                    </div>
                                </div>

                                <div className="selection-recap-summary">
                                    <strong>Selected for injection:</strong> {checkedComponents.size} components, {checkedIntegrations.size} integrations, {checkedAPIs.size} APIs.
                                </div>

                                <button 
                                    className="inject-blueprints-btn pulsing"
                                    onClick={handleInjectSelectedBlueprints}
                                    disabled={isInjecting || isTailoring}
                                    style={{ marginTop: '16px' }}
                                >
                                    {isInjecting ? <ThinkingIcon /> : '⚡ Inject All Selected Requirements'}
                                </button>
                            </div>
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
                        <div className="library-sections">
                            {allSavedAndFavorites.length > 0 && (
                                <div className="library-section">
                                    <div className="library-section-header">
                                        <BookmarkIcon /> Saved & Favorites
                                    </div>
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
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
