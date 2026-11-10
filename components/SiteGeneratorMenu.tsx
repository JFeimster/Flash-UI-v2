import React, { useState } from 'react';
import { 
    Layout, 
    Palette, 
    Code2, 
    Sparkles, 
    Shuffle, 
    ArrowRight,
    SlidersHorizontal,
    Layers,
    ChevronDown,
    ChevronUp,
    Film,
    Briefcase,
    Compass
} from 'lucide-react';

export interface SiteGeneratorMenuProps {
    onGenerate: (prompt: string) => void;
    isLoading?: boolean;
}

export const SITE_TYPES = [
    { id: 'recommend', label: '✨ Recommend / Auto-Detect', icon: '✨', desc: 'AI recommends the optimal archetype (landing page, dashboard, tool, widget) based on topic' },
    { id: 'Landing page', label: 'Landing Page', icon: '🚀', desc: 'High-conversion SaaS & product landing page with hero, features & CTA' },
    { id: 'Dashboard', label: 'Dashboard', icon: '📊', desc: 'Analytics & operational metrics with charts, data cards & live controls' },
    { id: 'Portfolio', label: 'Portfolio', icon: '🎨', desc: 'Creative showcase for studios, designers & engineers with case studies' },
    { id: 'Ecommerce', label: 'Ecommerce', icon: '🛍️', desc: 'Modern product storefront, catalog, price filters & checkout drawer' },
    { id: 'Embed widget', label: 'Embed Widget', icon: '🧩', desc: 'Compact, self-contained interactive micro-tool or calculator widget' },
    { id: 'Auth flow', label: 'Auth Flow', icon: '🔐', desc: 'Split-screen authentication, social sign-in & onboarding cards' },
    { id: 'Documentation', label: 'Documentation', icon: '📚', desc: 'Interactive developer documentation with code blocks & search' },
    { id: 'Mobile app', label: 'Mobile Web App', icon: '📱', desc: 'Mobile-first responsive app with tab navigation & touch cards' },
    { id: 'Pricing table', label: 'Pricing Table', icon: '💳', desc: 'Interactive tiered subscription matrix with billing toggles' },
    { id: 'Data calculator', label: 'Data Calculator', icon: '🧮', desc: 'Breakeven simulator, ROI decision engine, or fiscal audit' },
    { id: 'Event conference', label: 'Event & Conference', icon: '🎟️', desc: 'Keynote schedule timeline, speakers, and pass checkout' },
    { id: 'custom', label: '✏️ Custom / Specify...', icon: '✏️', desc: 'Specify a custom application format or archetype' }
];

export const DESIGN_STYLES = [
    { id: 'recommend', label: '✨ Recommend / Adaptive', icon: '✨', desc: 'AI recommends the most fitting, distinctive aesthetic for this subject' },
    { id: 'Luxury bento', label: 'Luxury Bento', icon: '💎', desc: 'Deep obsidian dark, frosted glass, subtle borders, refined grid' },
    { id: 'Neobrutalist', label: 'Neobrutalist', icon: '⚡', desc: 'High contrast, bold borders, brutal drop shadows, raw vibrant pops' },
    { id: 'Cyberpunk', label: 'Cyberpunk', icon: '🌆', desc: 'Neon cyan/pink glows, dark matrix grid, HUD telemetry & scanlines' },
    { id: 'Futuristic', label: 'Futuristic Minimal', icon: '🛸', desc: 'Ultra-clean monochrome, titanium accents, subtle spatial micro-glows' },
    { id: 'Bioluminescent', label: 'Bioluminescent', icon: '🌊', desc: 'Deep ocean midnight, glowing cyan/emerald organic nodes' },
    { id: 'Retro CRT', label: 'Retro CRT', icon: '📺', desc: 'Amber phosphor glow, scanline textures, analog industrial meters' },
    { id: 'Grainy risograph', label: 'Grainy Risograph', icon: '📜', desc: 'Translucent ink overprinting, dithered textures, raw paper grain' },
    { id: 'Industrial blueprint', label: 'Industrial Blueprint', icon: '📐', desc: 'Technical CAD blue, precision grid, steel & safety orange accents' },
    { id: 'Cinematic dark luxe', label: 'Cinematic Dark Luxe', icon: '👑', desc: 'Deep black, gold spotlight accents, high-end authority layout' },
    { id: 'Volumetric spectral', label: 'Volumetric Spectral', icon: '🌈', desc: 'Generative morphing gradients, soft-focus diffusion, chromatic glow' },
    { id: 'custom', label: '✏️ Custom / Specify...', icon: '✏️', desc: 'Specify a custom visual style or aesthetic persona' }
];

export const FRAMEWORKS = [
    { id: 'recommend', label: '✨ Recommend / Best Fit', icon: '✨', desc: 'AI recommends the optimal framework architecture for this component' },
    { id: 'Static HTML', label: 'Static HTML', icon: '🌐', desc: 'Zero-config standalone HTML5 + Tailwind CSS CDN, ready to deploy' },
    { id: 'Next.js web app', label: 'Next.js Web App', icon: '▲', desc: 'Next.js 15 App Router, React 19, TypeScript & Tailwind CSS' },
    { id: 'React Component', label: 'React Component', icon: '⚛️', desc: 'Modular React TSX component with interactive state & Tailwind classes' },
    { id: 'Vue component', label: 'Vue 3 (SFC)', icon: '💚', desc: 'Single File Component with <script setup> & scoped styling' },
    { id: 'Svelte component', label: 'Svelte Component', icon: '🧡', desc: 'Ultra-lightweight reactive component with zero virtual DOM' },
    { id: 'Wix Velo', label: 'Wix Velo', icon: '🟦', desc: 'Standalone JavaScript structure & bindings for Wix Studio' },
    { id: 'Notion embed', label: 'Notion Embed', icon: '📝', desc: 'Markdown-friendly HTML block format for Notion' },
    { id: 'Embed widget', label: 'Embed Widget', icon: '📦', desc: 'Self-contained embed snippet for any website or iframe' },
    { id: 'custom', label: '✏️ Custom / Specify...', icon: '✏️', desc: 'Specify a custom framework or target environment' }
];

export const ANIMATION_STYLES = [
    { id: 'recommend', label: '✨ Recommend / Balanced', icon: '✨', desc: 'AI recommends tasteful micro-interactions and transitions tailored to the design' },
    { id: 'Hover glow', label: 'Hover Glow & Scale', icon: '✨', desc: 'Interactive button lifts with soft vibrant outer color glows' },
    { id: 'Dramatic entrance', label: 'Dramatic Entrance', icon: '🎬', desc: 'Smooth blur-to-clear slide-in with cubic-bezier physics' },
    { id: 'Floating motion', label: 'Floating Motion', icon: '🎈', desc: 'Gentle continuous vertical oscillation for spatial depth' },
    { id: 'Glass shimmer', label: 'Glass Shimmer', icon: '🪞', desc: 'Periodic diagonal light sweep highlighting glass textures' },
    { id: 'Magnetic pull', label: 'Magnetic Interaction', icon: '🧲', desc: 'Weighted elastic transitions with physical momentum' },
    { id: 'Rhythmic pulse', label: 'Rhythmic Pulse', icon: '💓', desc: 'Soft ambient pulsing borders & breathing highlights' },
    { id: 'Minimal none', label: 'Zero Motion / Minimal', icon: '⚡', desc: 'Instant snappy transitions for high-density data tools' },
    { id: 'custom', label: '✏️ Custom / Specify...', icon: '✏️', desc: 'Specify custom animation requirements or physics' }
];

export const INDUSTRY_DOMAINS = [
    { id: 'recommend', label: '✨ Auto-Detect (Recommend)', icon: '✨', desc: 'AI infers domain context, authentic metrics, and realistic copy' },
    { id: 'General', label: 'General / Multi-Discipline', icon: '🌐', desc: 'Flexible universal domain and layout components' },
    { id: 'Fintech & Capital', label: 'FinTech & Capital Flow', icon: '💰', desc: 'Solvency indicators, invoice factoring, ledger tables, APY tickers' },
    { id: 'B2B SaaS & DevTools', label: 'B2B SaaS & DevTools', icon: '🛠️', desc: 'Sub-10ms SLAs, API playgrounds, webhook logs, auth gates' },
    { id: 'E-Commerce & DTC', label: 'E-Commerce & DTC Retail', icon: '🏷️', desc: 'Limited drops, inventory velocity, flash sales, cart drawer' },
    { id: 'Industrial & Logistics', label: 'Industrial & Logistics', icon: '🚚', desc: 'Fleet tracking, spot market cockpits, equipment ROI' },
    { id: 'Creative Studio & Agency', label: 'Creative Studio & Agency', icon: '🎨', desc: 'Kinetic typography, case study reels, visual branding' },
    { id: 'Healthcare & Clinical', label: 'Healthcare & Clinical', icon: '🩺', desc: 'Patient queue management, intake wizards, calming forms' },
    { id: 'AI & Frontier Tech', label: 'AI & Frontier Tech', icon: '🤖', desc: 'Autonomous agent workbenches, prompt engineering labs' },
    { id: 'Real Estate & Property', label: 'Real Estate & Property', icon: '🏡', desc: 'Wholesaler deal room, proof of funds, property cards' },
    { id: 'custom', label: '✏️ Custom / Specify...', icon: '✏️', desc: 'Specify a custom industry vertical or niche' }
];

export const LAYOUT_STANCES = [
    { id: 'recommend', label: '✨ Recommend / Optimal Grid', icon: '✨', desc: 'AI recommends the best layout hierarchy and spatial balance' },
    { id: 'Bento Grid', label: 'Bento Grid Matrix', icon: '🗂️', desc: 'Asynchronous multi-card layout with variable card hierarchy' },
    { id: 'Split-Screen', label: 'Split-Screen Command', icon: '🪟', desc: 'Side-by-side terminal/preview or form/document viewer' },
    { id: 'Centered Hero', label: 'Centered Conversion Flow', icon: '🎯', desc: 'High-impact single-column conversion hero and CTA' },
    { id: 'Full-Width HUD', label: 'Full-Width Dashboard HUD', icon: '🖥️', desc: 'Multi-metric HUD with left-rail navigation and filter bar' },
    { id: 'Step Wizard', label: 'Guided Step Wizard', icon: '🪜', desc: 'Guided multi-stage progress wizard with verification states' },
    { id: 'custom', label: '✏️ Custom / Specify...', icon: '✏️', desc: 'Specify a custom layout structure or wireframe flow' }
];

export const QUICK_PRESETS = [
    { 
        name: '✨ Full AI Recommend', 
        type: 'recommend', 
        design: 'recommend', 
        framework: 'recommend', 
        animation: 'recommend',
        domain: 'recommend',
        topic: 'Autonomous Multi-Agent Workflow Orchestrator' 
    },
    { 
        name: 'SaaS Bento', 
        type: 'Landing page', 
        design: 'Luxury bento', 
        framework: 'Next.js web app', 
        animation: 'Hover glow',
        domain: 'B2B SaaS & DevTools',
        topic: 'AI Workflow Automation & Agent Orchestration' 
    },
    { 
        name: 'Cyber Cockpit', 
        type: 'Dashboard', 
        design: 'Cyberpunk', 
        framework: 'Static HTML', 
        animation: 'Glass shimmer',
        domain: 'Industrial & Logistics',
        topic: 'Global Satellite Telemetry & Drone Fleet' 
    },
    { 
        name: 'Brutalist Store', 
        type: 'Ecommerce', 
        design: 'Neobrutalist', 
        framework: 'React Component', 
        animation: 'Magnetic pull',
        domain: 'E-Commerce & DTC',
        topic: 'Limited-Edition Mechanical Keyboards & Keycaps' 
    },
    { 
        name: 'Risograph Studio', 
        type: 'Portfolio', 
        design: 'Grainy risograph', 
        framework: 'Next.js web app', 
        animation: 'Dramatic entrance',
        domain: 'Creative Studio & Agency',
        topic: 'Kinetic Typography & Editorial Print House' 
    },
    { 
        name: 'DeFi Yield Widget', 
        type: 'Embed widget', 
        design: 'Bioluminescent', 
        framework: 'Embed widget', 
        animation: 'Floating motion',
        domain: 'Fintech & Capital',
        topic: 'Multi-Chain Liquidity Staking Pool' 
    }
];

export default function SiteGeneratorMenu({ onGenerate, isLoading }: SiteGeneratorMenuProps) {
    const [selectedType, setSelectedType] = useState<string>(SITE_TYPES[0].id);
    const [selectedDesign, setSelectedDesign] = useState<string>(DESIGN_STYLES[0].id);
    const [selectedFramework, setSelectedFramework] = useState<string>(FRAMEWORKS[0].id);
    const [selectedAnimation, setSelectedAnimation] = useState<string>(ANIMATION_STYLES[0].id);
    
    // Custom freeform values when "Custom" is selected
    const [customType, setCustomType] = useState<string>('');
    const [customDesign, setCustomDesign] = useState<string>('');
    const [customFramework, setCustomFramework] = useState<string>('');
    const [customAnimation, setCustomAnimation] = useState<string>('');
    const [customDomain, setCustomDomain] = useState<string>('');
    const [customLayoutStance, setCustomLayoutStance] = useState<string>('');

    // Advanced / Fine-tune state
    const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
    const [selectedDomain, setSelectedDomain] = useState<string>(INDUSTRY_DOMAINS[0].id);
    const [selectedLayoutStance, setSelectedLayoutStance] = useState<string>(LAYOUT_STANCES[0].id);

    const [customTopic, setCustomTopic] = useState<string>('');

    const handleShuffle = () => {
        // Exclude 'recommend' and 'custom' when rolling random presets
        const types = SITE_TYPES.filter(t => t.id !== 'recommend' && t.id !== 'custom');
        const designs = DESIGN_STYLES.filter(d => d.id !== 'recommend' && d.id !== 'custom');
        const frameworks = FRAMEWORKS.filter(f => f.id !== 'recommend' && f.id !== 'custom');
        const animations = ANIMATION_STYLES.filter(a => a.id !== 'recommend' && a.id !== 'custom');
        const domains = INDUSTRY_DOMAINS.filter(d => d.id !== 'recommend' && d.id !== 'custom');
        const layouts = LAYOUT_STANCES.filter(l => l.id !== 'recommend' && l.id !== 'custom');

        const randomType = types[Math.floor(Math.random() * types.length)].id;
        const randomDesign = designs[Math.floor(Math.random() * designs.length)].id;
        const randomFramework = frameworks[Math.floor(Math.random() * frameworks.length)].id;
        const randomAnimation = animations[Math.floor(Math.random() * animations.length)].id;
        const randomDomain = domains[Math.floor(Math.random() * domains.length)].id;
        const randomLayout = layouts[Math.floor(Math.random() * layouts.length)].id;
        
        const sampleTopics = [
            'Autonomous Drone Fleet Navigation & Telemetry',
            'Bioluminescent Deep-Sea Oceanographic Lab',
            'Institutional Crypto Order Book Liquidity Pool',
            'Vintage Analog Vacuum Tube Synthesizer Console',
            'Real-Time Developer Webhook Observability',
            'Artisanal Tokyo Coffee Roaster & Micro-Lot Subscriptions',
            'Crisis Factoring & Contractor Cashflow Runway'
        ];
        const randomTopic = sampleTopics[Math.floor(Math.random() * sampleTopics.length)];

        setSelectedType(randomType);
        setSelectedDesign(randomDesign);
        setSelectedFramework(randomFramework);
        setSelectedAnimation(randomAnimation);
        setSelectedDomain(randomDomain);
        setSelectedLayoutStance(randomLayout);
        setCustomTopic(randomTopic);
    };

    const handleApplyPreset = (preset: typeof QUICK_PRESETS[0]) => {
        setSelectedType(preset.type);
        setSelectedDesign(preset.design);
        setSelectedFramework(preset.framework);
        setSelectedAnimation(preset.animation);
        if (preset.domain) setSelectedDomain(preset.domain);
        setCustomTopic(preset.topic);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        const typeObj = SITE_TYPES.find(t => t.id === selectedType) || SITE_TYPES[0];
        const designObj = DESIGN_STYLES.find(d => d.id === selectedDesign) || DESIGN_STYLES[0];
        const frameworkObj = FRAMEWORKS.find(f => f.id === selectedFramework) || FRAMEWORKS[0];
        const animationObj = ANIMATION_STYLES.find(a => a.id === selectedAnimation) || ANIMATION_STYLES[0];
        const domainObj = INDUSTRY_DOMAINS.find(d => d.id === selectedDomain) || INDUSTRY_DOMAINS[0];
        const layoutObj = LAYOUT_STANCES.find(l => l.id === selectedLayoutStance) || LAYOUT_STANCES[0];
        
        const typePrompt = selectedType === 'recommend'
            ? 'Recommend the most impactful and effective application archetype (such as a high-conversion landing page, analytics dashboard, creative portfolio, or interactive widget) based on the subject'
            : selectedType === 'custom'
            ? (customType.trim() || 'Custom bespoke application')
            : `${typeObj.label} (${typeObj.desc})`;

        const designPrompt = selectedDesign === 'recommend'
            ? 'Recommend a distinctive, non-generic, high-craft visual aesthetic tailored specifically to the subject and industry (typography, contrast, elevation, and palette)'
            : selectedDesign === 'custom'
            ? (customDesign.trim() || 'Custom bespoke design language')
            : `${designObj.label} (${designObj.desc})`;

        const frameworkPrompt = selectedFramework === 'recommend'
            ? 'Recommend the most suitable modern component architecture (e.g., Next.js 15 / React 19 with Tailwind CSS, or standalone HTML5)'
            : selectedFramework === 'custom'
            ? (customFramework.trim() || 'Custom architecture')
            : `${frameworkObj.label} (${frameworkObj.desc})`;

        const animationPrompt = selectedAnimation === 'recommend'
            ? 'Recommend tasteful, context-aware micro-interactions, subtle hover physics, and smooth state transitions that enhance usability without distraction'
            : selectedAnimation === 'custom'
            ? (customAnimation.trim() || 'Custom motion physics')
            : `${animationObj.label} (${animationObj.desc})`;

        const domainPrompt = selectedDomain === 'recommend'
            ? 'Auto-detect industry domain and inject authentic domain-specific terminology, KPIs, and realistic data structures'
            : selectedDomain === 'custom'
            ? (customDomain.trim() || 'Custom vertical')
            : `${domainObj.label} (${domainObj.desc})`;

        const layoutPrompt = selectedLayoutStance === 'recommend'
            ? 'Recommend the most compelling spatial hierarchy and layout composition (e.g. bento grid, split-screen, or command HUD) for this use case'
            : selectedLayoutStance === 'custom'
            ? (customLayoutStance.trim() || 'Custom layout structure')
            : `${layoutObj.label} (${layoutObj.desc})`;

        const typeLabel = selectedType === 'recommend' ? 'Curated Interface' : selectedType === 'custom' ? (customType.trim() || 'Custom Application') : typeObj.label;
        const subject = customTopic.trim() || `Modern ${typeLabel}`;

        const compiledPrompt = `Design a high-fidelity application for "${subject}".
APPLICATION TYPE: ${typePrompt}.
VISUAL STYLE: ${designPrompt}.
FRAMEWORK / ARCHITECTURE: ${frameworkPrompt}.
MOTION & ANIMATION: ${animationPrompt}.
INDUSTRY DOMAIN: ${domainPrompt}.
LAYOUT STANCE: ${layoutPrompt}.

KEY REQUIREMENTS:
- Complete standalone production-grade component with modern Tailwind CSS.
- Highly interactive UI with working interactive buttons, filters, sliders, and realistic domain-native data.
- Faithful execution of the visual language (typography, colors, contrast, elevation).
- Embed smooth CSS transitions and interactive feedback.
- Clean, responsive layout that looks breathtaking across desktop, tablet, and mobile.`;

        onGenerate(compiledPrompt);
    };

    return (
        <div className="w-full max-w-4xl mx-auto my-2 text-left relative z-20">
            {/* Main Configurator Card */}
            <div className="bg-[#101015]/90 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_50px_rgba(16,185,129,0.06)] backdrop-blur-2xl">
                
                {/* Header Badge & Title */}
                <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                            <SlidersHorizontal size={15} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white tracking-wide">
                                Site Generator Studio
                            </h3>
                            <p className="text-[11px] text-stone-400">
                                Configure type, design aesthetic, framework, and motion physics
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleShuffle}
                        disabled={isLoading}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs font-mono flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
                        title="Randomize options"
                    >
                        <Shuffle size={13} className="text-violet-400" />
                        <span className="hidden sm:inline text-[11px]">Shuffle</span>
                    </button>
                </div>

                {/* 4 Core Dropdowns in Menu Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3.5">
                    {/* 1. Type Dropdown */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 flex items-center gap-1.5 font-semibold">
                                <Layout size={12} className="text-cyan-400" />
                                <span>Type</span>
                            </label>
                            {selectedType === 'recommend' && (
                                <span className="text-[9px] font-mono text-cyan-400 flex items-center gap-0.5">
                                    <Sparkles size={9} /> Auto
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                disabled={isLoading}
                                className={`w-full bg-zinc-900/90 border ${selectedType === 'recommend' ? 'border-cyan-500/50 text-cyan-300 font-medium' : selectedType === 'custom' ? 'border-amber-500/50 text-amber-300 font-medium' : 'border-white/15 text-white'} hover:border-white/30 focus:border-cyan-400 rounded-xl px-2.5 py-2 text-xs appearance-none cursor-pointer focus:outline-none transition-all pr-7 truncate`}
                            >
                                {SITE_TYPES.map((t) => (
                                    <option key={t.id} value={t.id} className="bg-zinc-900 text-white py-1">
                                        {t.icon} {t.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                <ChevronDown size={13} />
                            </div>
                        </div>
                        {selectedType === 'custom' && (
                            <input
                                type="text"
                                value={customType}
                                onChange={(e) => setCustomType(e.target.value)}
                                placeholder="Specify custom archetype..."
                                className="w-full mt-1.5 bg-zinc-950/90 border border-amber-500/40 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-stone-500 focus:outline-none transition-all font-mono"
                            />
                        )}
                        <p 
                            className="text-[10px] text-stone-400 truncate block mt-1 transition-colors"
                            title={SITE_TYPES.find(t => t.id === selectedType)?.desc}
                        >
                            {SITE_TYPES.find(t => t.id === selectedType)?.desc}
                        </p>
                    </div>

                    {/* 2. Design Dropdown */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 flex items-center gap-1.5 font-semibold">
                                <Palette size={12} className="text-fuchsia-400" />
                                <span>Design</span>
                            </label>
                            {selectedDesign === 'recommend' && (
                                <span className="text-[9px] font-mono text-fuchsia-400 flex items-center gap-0.5">
                                    <Sparkles size={9} /> Auto
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <select
                                value={selectedDesign}
                                onChange={(e) => setSelectedDesign(e.target.value)}
                                disabled={isLoading}
                                className={`w-full bg-zinc-900/90 border ${selectedDesign === 'recommend' ? 'border-fuchsia-500/50 text-fuchsia-300 font-medium' : selectedDesign === 'custom' ? 'border-amber-500/50 text-amber-300 font-medium' : 'border-white/15 text-white'} hover:border-white/30 focus:border-fuchsia-400 rounded-xl px-2.5 py-2 text-xs appearance-none cursor-pointer focus:outline-none transition-all pr-7 truncate`}
                            >
                                {DESIGN_STYLES.map((d) => (
                                    <option key={d.id} value={d.id} className="bg-zinc-900 text-white py-1">
                                        {d.icon} {d.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                <ChevronDown size={13} />
                            </div>
                        </div>
                        {selectedDesign === 'custom' && (
                            <input
                                type="text"
                                value={customDesign}
                                onChange={(e) => setCustomDesign(e.target.value)}
                                placeholder="Specify custom style persona..."
                                className="w-full mt-1.5 bg-zinc-950/90 border border-amber-500/40 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-stone-500 focus:outline-none transition-all font-mono"
                            />
                        )}
                        <p 
                            className="text-[10px] text-stone-400 truncate block mt-1 transition-colors"
                            title={DESIGN_STYLES.find(d => d.id === selectedDesign)?.desc}
                        >
                            {DESIGN_STYLES.find(d => d.id === selectedDesign)?.desc}
                        </p>
                    </div>

                    {/* 3. Framework Dropdown */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 flex items-center gap-1.5 font-semibold">
                                <Code2 size={12} className="text-emerald-400" />
                                <span>Framework</span>
                            </label>
                            {selectedFramework === 'recommend' && (
                                <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5">
                                    <Sparkles size={9} /> Auto
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <select
                                value={selectedFramework}
                                onChange={(e) => setSelectedFramework(e.target.value)}
                                disabled={isLoading}
                                className={`w-full bg-zinc-900/90 border ${selectedFramework === 'recommend' ? 'border-emerald-500/50 text-emerald-300 font-medium' : selectedFramework === 'custom' ? 'border-amber-500/50 text-amber-300 font-medium' : 'border-white/15 text-white'} hover:border-white/30 focus:border-emerald-400 rounded-xl px-2.5 py-2 text-xs appearance-none cursor-pointer focus:outline-none transition-all pr-7 truncate`}
                            >
                                {FRAMEWORKS.map((f) => (
                                    <option key={f.id} value={f.id} className="bg-zinc-900 text-white py-1">
                                        {f.icon} {f.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                <ChevronDown size={13} />
                            </div>
                        </div>
                        {selectedFramework === 'custom' && (
                            <input
                                type="text"
                                value={customFramework}
                                onChange={(e) => setCustomFramework(e.target.value)}
                                placeholder="Specify custom framework..."
                                className="w-full mt-1.5 bg-zinc-950/90 border border-amber-500/40 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-stone-500 focus:outline-none transition-all font-mono"
                            />
                        )}
                        <p 
                            className="text-[10px] text-stone-400 truncate block mt-1 transition-colors"
                            title={FRAMEWORKS.find(f => f.id === selectedFramework)?.desc}
                        >
                            {FRAMEWORKS.find(f => f.id === selectedFramework)?.desc}
                        </p>
                    </div>

                    {/* 4. Animation Dropdown */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 flex items-center gap-1.5 font-semibold">
                                <Film size={12} className="text-amber-400" />
                                <span>Animation</span>
                            </label>
                            {selectedAnimation === 'recommend' && (
                                <span className="text-[9px] font-mono text-amber-400 flex items-center gap-0.5">
                                    <Sparkles size={9} /> Auto
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <select
                                value={selectedAnimation}
                                onChange={(e) => setSelectedAnimation(e.target.value)}
                                disabled={isLoading}
                                className={`w-full bg-zinc-900/90 border ${selectedAnimation === 'recommend' ? 'border-amber-500/50 text-amber-300 font-medium' : selectedAnimation === 'custom' ? 'border-amber-500/50 text-amber-300 font-medium' : 'border-white/15 text-white'} hover:border-white/30 focus:border-amber-400 rounded-xl px-2.5 py-2 text-xs appearance-none cursor-pointer focus:outline-none transition-all pr-7 truncate`}
                            >
                                {ANIMATION_STYLES.map((a) => (
                                    <option key={a.id} value={a.id} className="bg-zinc-900 text-white py-1">
                                        {a.icon} {a.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                <ChevronDown size={13} />
                            </div>
                        </div>
                        {selectedAnimation === 'custom' && (
                            <input
                                type="text"
                                value={customAnimation}
                                onChange={(e) => setCustomAnimation(e.target.value)}
                                placeholder="Specify custom animation..."
                                className="w-full mt-1.5 bg-zinc-950/90 border border-amber-500/40 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-stone-500 focus:outline-none transition-all font-mono"
                            />
                        )}
                        <p 
                            className="text-[10px] text-stone-400 truncate block mt-1 transition-colors"
                            title={ANIMATION_STYLES.find(a => a.id === selectedAnimation)?.desc}
                        >
                            {ANIMATION_STYLES.find(a => a.id === selectedAnimation)?.desc}
                        </p>
                    </div>
                </div>

                {/* Custom Topic / Subject Input */}
                <div className="mb-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-1.5">
                            <Layers size={12} className="text-stone-300" />
                            <span>Subject / Niche <span className="text-stone-500 font-normal lowercase">(optional)</span></span>
                        </label>
                        {customTopic && (
                            <button
                                type="button"
                                onClick={() => setCustomTopic('')}
                                className="text-[10px] text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <input
                        type="text"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                        disabled={isLoading}
                        placeholder="e.g., AI video studio, luxury watchmaker, contractor cashflow, crypto ledger..."
                        className="w-full bg-zinc-900/90 border border-white/10 hover:border-white/20 focus:border-emerald-400/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:outline-none transition-all"
                    />
                </div>

                {/* Advanced / Fine-Tune Expandable Accordion */}
                <div className="mb-4 pt-1">
                    <button
                        type="button"
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-stone-300 text-xs font-mono transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal size={12} className="text-violet-400" />
                            <span className="font-semibold">Advanced / Fine-Tune Options</span>
                            <span className="text-[10px] text-stone-500 hidden sm:inline">
                                ({selectedDomain === 'recommend' ? 'Auto-Domain' : selectedDomain} &bull; {selectedLayoutStance === 'recommend' ? 'Auto-Grid' : selectedLayoutStance})
                            </span>
                        </div>
                        <div className="text-stone-400">
                            {isAdvancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                    </button>

                    {isAdvancedOpen && (
                        <div className="mt-2.5 p-3.5 rounded-xl bg-zinc-950/70 border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-in fade-in duration-200">
                            {/* Industry Domain Selector */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-1.5">
                                        <Briefcase size={12} className="text-emerald-400" />
                                        <span>Industry Domain Sector</span>
                                    </label>
                                    {selectedDomain === 'recommend' && (
                                        <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5">
                                            <Sparkles size={9} /> Auto
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <select
                                        value={selectedDomain}
                                        onChange={(e) => setSelectedDomain(e.target.value)}
                                        disabled={isLoading}
                                        className={`w-full bg-zinc-900 border ${selectedDomain === 'recommend' ? 'border-emerald-500/50 text-emerald-300 font-medium' : selectedDomain === 'custom' ? 'border-amber-500/50 text-amber-300 font-medium' : 'border-white/15 text-white'} hover:border-white/30 focus:border-emerald-400 rounded-lg px-2.5 py-2 text-xs appearance-none cursor-pointer focus:outline-none transition-all pr-7 truncate`}
                                    >
                                        {INDUSTRY_DOMAINS.map((dom) => (
                                            <option key={dom.id} value={dom.id} className="bg-zinc-900 text-white py-1">
                                                {dom.icon} {dom.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                        <ChevronDown size={13} />
                                    </div>
                                </div>
                                {selectedDomain === 'custom' && (
                                    <input
                                        type="text"
                                        value={customDomain}
                                        onChange={(e) => setCustomDomain(e.target.value)}
                                        placeholder="Specify custom industry..."
                                        className="w-full mt-1.5 bg-zinc-950/90 border border-amber-500/40 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-stone-500 focus:outline-none transition-all font-mono"
                                    />
                                )}
                                <p 
                                    className="text-[10px] text-stone-400 truncate block mt-1 transition-colors"
                                    title={INDUSTRY_DOMAINS.find(d => d.id === selectedDomain)?.desc}
                                >
                                    {INDUSTRY_DOMAINS.find(d => d.id === selectedDomain)?.desc}
                                </p>
                            </div>

                            {/* Component Layout Stance */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-1.5">
                                        <Compass size={12} className="text-cyan-400" />
                                        <span>Layout Stance / Grid</span>
                                    </label>
                                    {selectedLayoutStance === 'recommend' && (
                                        <span className="text-[9px] font-mono text-cyan-400 flex items-center gap-0.5">
                                            <Sparkles size={9} /> Auto
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <select
                                        value={selectedLayoutStance}
                                        onChange={(e) => setSelectedLayoutStance(e.target.value)}
                                        disabled={isLoading}
                                        className={`w-full bg-zinc-900 border ${selectedLayoutStance === 'recommend' ? 'border-cyan-500/50 text-cyan-300 font-medium' : selectedLayoutStance === 'custom' ? 'border-amber-500/50 text-amber-300 font-medium' : 'border-white/15 text-white'} hover:border-white/30 focus:border-cyan-400 rounded-lg px-2.5 py-2 text-xs appearance-none cursor-pointer focus:outline-none transition-all pr-7 truncate`}
                                    >
                                        {LAYOUT_STANCES.map((lay) => (
                                            <option key={lay.id} value={lay.id} className="bg-zinc-900 text-white py-1">
                                                {lay.icon} {lay.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                        <ChevronDown size={13} />
                                    </div>
                                </div>
                                {selectedLayoutStance === 'custom' && (
                                    <input
                                        type="text"
                                        value={customLayoutStance}
                                        onChange={(e) => setCustomLayoutStance(e.target.value)}
                                        placeholder="Specify custom layout..."
                                        className="w-full mt-1.5 bg-zinc-950/90 border border-amber-500/40 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-stone-500 focus:outline-none transition-all font-mono"
                                    />
                                )}
                                <p 
                                    className="text-[10px] text-stone-400 truncate block mt-1 transition-colors"
                                    title={LAYOUT_STANCES.find(l => l.id === selectedLayoutStance)?.desc}
                                >
                                    {LAYOUT_STANCES.find(l => l.id === selectedLayoutStance)?.desc}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Primary Generate Button */}
                <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Sparkles size={15} />
                    <span>
                        Generate {selectedType === 'recommend' ? 'Curated Site' : selectedType === 'custom' ? (customType || 'Custom Site') : selectedType} ({selectedDesign === 'recommend' ? 'Adaptive Style' : selectedDesign === 'custom' ? (customDesign || 'Custom Style') : selectedDesign})
                    </span>
                    <ArrowRight size={14} />
                </button>

                {/* Quick Presets Row */}
                <div className="mt-3.5 pt-3 border-t border-white/5">
                    <div className="text-[10px] font-mono uppercase text-stone-500 mb-2 font-medium">
                        Popular Presets:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {QUICK_PRESETS.map((preset) => {
                            const isMatch = selectedType === preset.type && selectedDesign === preset.design;
                            return (
                                <button
                                    key={preset.name}
                                    type="button"
                                    onClick={() => handleApplyPreset(preset)}
                                    disabled={isLoading}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                                        isMatch
                                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                            : 'bg-white/5 border-white/5 text-stone-400 hover:bg-white/10 hover:text-stone-200'
                                    }`}
                                >
                                    {preset.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
