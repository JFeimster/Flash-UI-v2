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
    ChevronDown
} from 'lucide-react';

export interface SiteGeneratorMenuProps {
    onGenerate: (prompt: string) => void;
    isLoading?: boolean;
}

export const SITE_TYPES = [
    { id: 'Landing page', label: 'Landing Page', icon: '🚀', desc: 'High-conversion SaaS & product landing page with hero, features & CTA' },
    { id: 'Dashboard', label: 'Dashboard', icon: '📊', desc: 'Analytics & operational metrics with charts, data cards & live controls' },
    { id: 'Portfolio', label: 'Portfolio', icon: '🎨', desc: 'Creative showcase for studios, designers & engineers with case studies' },
    { id: 'Ecommerce', label: 'Ecommerce', icon: '🛍️', desc: 'Modern product storefront, catalog, price filters & checkout drawer' },
    { id: 'Embed widget', label: 'Embed Widget', icon: '🧩', desc: 'Compact, self-contained interactive micro-tool or calculator widget' },
    { id: 'Auth flow', label: 'Auth Flow', icon: '🔐', desc: 'Split-screen authentication, social sign-in & onboarding cards' },
    { id: 'Documentation', label: 'Documentation', icon: '📚', desc: 'Interactive developer documentation with code blocks & search' }
];

export const DESIGN_STYLES = [
    { id: 'Neobrutalist', label: 'Neobrutalist', icon: '⚡', desc: 'High contrast, bold borders, brutal drop shadows, raw vibrant pops' },
    { id: 'Luxury bento', label: 'Luxury Bento', icon: '💎', desc: 'Deep obsidian dark, frosted glass, subtle borders, refined grid' },
    { id: 'Cyberpunk', label: 'Cyberpunk', icon: '🌆', desc: 'Neon cyan/pink glows, dark matrix grid, HUD telemetry & scanlines' },
    { id: 'Futuristic', label: 'Futuristic Minimal', icon: '🛸', desc: 'Ultra-clean monochrome, titanium accents, subtle spatial micro-glows' },
    { id: 'Bioluminescent', label: 'Bioluminescent', icon: '🌊', desc: 'Deep ocean midnight, glowing cyan/emerald organic nodes' },
    { id: 'Retro CRT', label: 'Retro CRT', icon: '📺', desc: 'Amber phosphor glow, scanline textures, analog industrial meters' }
];

export const FRAMEWORKS = [
    { id: 'Static HTML', label: 'Static HTML', icon: '🌐', desc: 'Zero-config standalone HTML5 + Tailwind CSS CDN, ready to deploy' },
    { id: 'Next.js web app', label: 'Next.js Web App', icon: '▲', desc: 'Next.js 15 App Router, React 19, TypeScript & Tailwind CSS' },
    { id: 'React Component', label: 'React Component', icon: '⚛️', desc: 'Modular React TSX component with interactive state & Tailwind classes' },
    { id: 'Embed widget', label: 'Embed Widget', icon: '📦', desc: 'Self-contained embed snippet for any website or iframe' }
];

export const QUICK_PRESETS = [
    { 
        name: 'SaaS Bento', 
        type: 'Landing page', 
        design: 'Luxury bento', 
        framework: 'Next.js web app', 
        topic: 'AI Workflow Automation & Agent Orchestration' 
    },
    { 
        name: 'Cyber Cockpit', 
        type: 'Dashboard', 
        design: 'Cyberpunk', 
        framework: 'Static HTML', 
        topic: 'Global Satellite Telemetry & Drone Ops' 
    },
    { 
        name: 'Brutalist Store', 
        type: 'Ecommerce', 
        design: 'Neobrutalist', 
        framework: 'React Component', 
        topic: 'Limited-Edition Mechanical Keyboards & Keycaps' 
    },
    { 
        name: 'Minimal Portfolio', 
        type: 'Portfolio', 
        design: 'Futuristic', 
        framework: 'Next.js web app', 
        topic: 'Spatial Computing & Generative Architecture Studio' 
    },
    { 
        name: 'Liquidity Widget', 
        type: 'Embed widget', 
        design: 'Bioluminescent', 
        framework: 'Embed widget', 
        topic: 'DeFi Staking Pool Yield Calculator' 
    }
];

export default function SiteGeneratorMenu({ onGenerate, isLoading }: SiteGeneratorMenuProps) {
    const [selectedType, setSelectedType] = useState<string>(SITE_TYPES[0].id);
    const [selectedDesign, setSelectedDesign] = useState<string>(DESIGN_STYLES[1].id);
    const [selectedFramework, setSelectedFramework] = useState<string>(FRAMEWORKS[0].id);
    const [customTopic, setCustomTopic] = useState<string>('');

    const handleShuffle = () => {
        const randomType = SITE_TYPES[Math.floor(Math.random() * SITE_TYPES.length)].id;
        const randomDesign = DESIGN_STYLES[Math.floor(Math.random() * DESIGN_STYLES.length)].id;
        const randomFramework = FRAMEWORKS[Math.floor(Math.random() * FRAMEWORKS.length)].id;
        
        const sampleTopics = [
            'Autonomous Drone Fleet Navigation & Telemetry',
            'Bioluminescent Deep-Sea Research Station',
            'High-Yield Real Estate Debt Crowdfunding',
            'Vintage Analog Audio Synthesizer Studio',
            'Next-Gen Developer Webhook Observability',
            'Artisanal Tokyo Coffee Roaster & Micro-Lot Subscriptions',
            'Algorithmic Crypto Order Book Liquidity Pool'
        ];
        const randomTopic = sampleTopics[Math.floor(Math.random() * sampleTopics.length)];

        setSelectedType(randomType);
        setSelectedDesign(randomDesign);
        setSelectedFramework(randomFramework);
        setCustomTopic(randomTopic);
    };

    const handleApplyPreset = (preset: typeof QUICK_PRESETS[0]) => {
        setSelectedType(preset.type);
        setSelectedDesign(preset.design);
        setSelectedFramework(preset.framework);
        setCustomTopic(preset.topic);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        const typeObj = SITE_TYPES.find(t => t.id === selectedType) || SITE_TYPES[0];
        const designObj = DESIGN_STYLES.find(d => d.id === selectedDesign) || DESIGN_STYLES[0];
        const frameworkObj = FRAMEWORKS.find(f => f.id === selectedFramework) || FRAMEWORKS[0];
        
        const subject = customTopic.trim() || `Modern ${typeObj.label}`;

        const compiledPrompt = `Design a high-fidelity ${typeObj.label} for "${subject}".
VISUAL STYLE: ${designObj.label} aesthetic (${designObj.desc}).
FRAMEWORK / ARCHITECTURE: ${frameworkObj.label} (${frameworkObj.desc}).

KEY REQUIREMENTS:
- Complete standalone production-grade component with modern Tailwind CSS.
- Highly interactive UI with working interactive buttons, filters, sliders, and realistic demo content.
- Faithful execution of the ${designObj.label} visual language (typography, colors, contrast, elevation).
- Clean, responsive layout that looks breathtaking across desktop, tablet, and mobile.`;

        onGenerate(compiledPrompt);
    };

    return (
        <div className="w-full max-w-2xl mx-auto my-5 text-left relative z-20">
            {/* Main Configurator Card */}
            <div className="bg-[#121217]/90 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                
                {/* Header Badge & Title */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                            <SlidersHorizontal size={15} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white tracking-wide">
                                Site Generator Studio
                            </h3>
                            <p className="text-[11px] text-stone-400">
                                Choose type, design aesthetic, and framework to build
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

                {/* 3 Core Dropdowns Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    {/* 1. Type Dropdown */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 flex items-center gap-1.5 font-semibold">
                            <Layout size={12} className="text-cyan-400" />
                            <span>Type</span>
                        </label>
                        <div className="relative">
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                disabled={isLoading}
                                className="w-full bg-zinc-900/90 border border-white/15 hover:border-white/30 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-xs text-white appearance-none cursor-pointer focus:outline-none transition-all pr-8"
                            >
                                {SITE_TYPES.map((t) => (
                                    <option key={t.id} value={t.id} className="bg-zinc-900 text-white py-1">
                                        {t.icon} {t.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                <ChevronDown size={14} />
                            </div>
                        </div>
                    </div>

                    {/* 2. Design Dropdown */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 flex items-center gap-1.5 font-semibold">
                            <Palette size={12} className="text-fuchsia-400" />
                            <span>Design</span>
                        </label>
                        <div className="relative">
                            <select
                                value={selectedDesign}
                                onChange={(e) => setSelectedDesign(e.target.value)}
                                disabled={isLoading}
                                className="w-full bg-zinc-900/90 border border-white/15 hover:border-white/30 focus:border-fuchsia-400 rounded-xl px-3 py-2.5 text-xs text-white appearance-none cursor-pointer focus:outline-none transition-all pr-8"
                            >
                                {DESIGN_STYLES.map((d) => (
                                    <option key={d.id} value={d.id} className="bg-zinc-900 text-white py-1">
                                        {d.icon} {d.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                <ChevronDown size={14} />
                            </div>
                        </div>
                    </div>

                    {/* 3. Framework Dropdown */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 flex items-center gap-1.5 font-semibold">
                            <Code2 size={12} className="text-emerald-400" />
                            <span>Framework</span>
                        </label>
                        <div className="relative">
                            <select
                                value={selectedFramework}
                                onChange={(e) => setSelectedFramework(e.target.value)}
                                disabled={isLoading}
                                className="w-full bg-zinc-900/90 border border-white/15 hover:border-white/30 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-xs text-white appearance-none cursor-pointer focus:outline-none transition-all pr-8"
                            >
                                {FRAMEWORKS.map((f) => (
                                    <option key={f.id} value={f.id} className="bg-zinc-900 text-white py-1">
                                        {f.icon} {f.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                <ChevronDown size={14} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Custom Topic / Subject Input */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-1.5">
                            <Layers size={12} className="text-amber-400" />
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

                {/* Primary Generate Button */}
                <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Sparkles size={15} />
                    <span>Generate {selectedType} ({selectedDesign})</span>
                    <ArrowRight size={14} />
                </button>

                {/* Quick Presets Row */}
                <div className="mt-4 pt-3 border-t border-white/5">
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
