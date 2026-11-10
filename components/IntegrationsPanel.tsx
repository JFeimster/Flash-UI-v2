import React, { useState } from 'react';
import { 
    Plug, 
    Check, 
    Copy, 
    ChevronDown, 
    ChevronUp, 
    Key, 
    Code2, 
    ExternalLink, 
    Sparkles, 
    CheckCircle2, 
    Settings,
    FileCode,
    SlidersHorizontal,
    Layers
} from 'lucide-react';
import { 
    AVAILABLE_INTEGRATIONS, 
    INTEGRATION_CATEGORIES, 
    INTEGRATION_PRESETS, 
    IntegrationService 
} from '../integrationsData';

export interface IntegrationsPanelProps {
    isOpen: boolean;
    onToggleOpen: () => void;
    selectedIntegrations: string[];
    onToggleIntegration: (id: string) => void;
    onSelectPreset: (ids: string[]) => void;
    customApiKeys: Record<string, Record<string, string>>;
    onUpdateApiKey: (integId: string, keyName: string, val: string) => void;
}

export default function IntegrationsPanel({
    isOpen,
    onToggleOpen,
    selectedIntegrations,
    onToggleIntegration,
    onSelectPreset,
    customApiKeys,
    onUpdateApiKey
}: IntegrationsPanelProps) {
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [previewBoilerplateId, setPreviewBoilerplateId] = useState<string | null>(null);
    const [editingKeysIntegId, setEditingKeysIntegId] = useState<string | null>(null);
    const [copyToast, setCopyToast] = useState<string | null>(null);

    const filteredIntegrations = AVAILABLE_INTEGRATIONS.filter(item => {
        if (activeCategory === 'all') return true;
        return item.category === activeCategory;
    });

    const activeServices = AVAILABLE_INTEGRATIONS.filter(item => 
        selectedIntegrations.includes(item.id)
    );

    const handleCopyEnv = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIntegrations.length === 0) return;

        let content = `# ========================================================\n# Generated .env.local - External Services Configuration\n# Injected via Site Generator Studio\n# ========================================================\n\n`;
        activeServices.forEach(service => {
            content += `# --- ${service.name} (${service.badge}) ---\n`;
            const userKeys = customApiKeys[service.id] || {};
            const merged = { ...service.defaultEnvKeys, ...userKeys };
            Object.entries(merged).forEach(([k, v]) => {
                content += `${k}="${v}"\n`;
            });
            content += `\n`;
        });

        navigator.clipboard.writeText(content);
        setCopyToast('env_all');
        setTimeout(() => setCopyToast(null), 2500);
    };

    const handleCopyCode = (e: React.MouseEvent, code: string, id: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(code);
        setCopyToast(`code_${id}`);
        setTimeout(() => setCopyToast(null), 2500);
    };

    return (
        <div className="mb-4 pt-1">
            {/* Header Accordion Button */}
            <div
                onClick={onToggleOpen}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${
                    isOpen 
                        ? 'bg-zinc-950/90 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.06)]' 
                        : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 text-stone-300'
                }`}
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                        <Plug size={13} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-white tracking-wide">
                                External Integrations &amp; Boilerplate
                            </span>
                            {selectedIntegrations.length > 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                                    {selectedIntegrations.length} Active ({activeServices.map(s => s.name).slice(0, 3).join(', ')}{activeServices.length > 3 ? '...' : ''})
                                </span>
                            ) : (
                                <span className="text-[10px] font-mono text-stone-500 hidden sm:inline">
                                    (Click to inject Stripe, Supabase, Auth0, etc.)
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {selectedIntegrations.length > 0 && (
                        <button
                            type="button"
                            onClick={handleCopyEnv}
                            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono text-stone-300 border border-white/10 transition-colors"
                            title="Copy combined .env.local file"
                        >
                            {copyToast === 'env_all' ? (
                                <>
                                    <Check size={11} className="text-emerald-400" />
                                    <span className="text-emerald-400">.env Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy size={11} />
                                    <span>Copy .env.local</span>
                                </>
                            )}
                        </button>
                    )}
                    <div className="text-stone-400">
                        {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                </div>
            </div>

            {/* Expanded Content Panel */}
            {isOpen && (
                <div className="mt-2.5 p-4 rounded-xl bg-zinc-950/85 border border-white/10 space-y-4 animate-in fade-in duration-200">
                    
                    {/* Top Description & Instructions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                        <div>
                            <p className="text-xs text-stone-300 font-medium">
                                Select services to automatically inject client SDK setup, boilerplate hooks, and placeholder environment variables into the generated output.
                            </p>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                                The generated UI will include working checkout triggers, auth states, and an interactive integration inspection console.
                            </p>
                        </div>
                        {selectedIntegrations.length > 0 && (
                            <button
                                type="button"
                                onClick={() => onSelectPreset([])}
                                className="text-[11px] font-mono text-stone-400 hover:text-red-400 self-start sm:self-center transition-colors underline cursor-pointer shrink-0"
                            >
                                Clear All ({selectedIntegrations.length})
                            </button>
                        )}
                    </div>

                    {/* Quick Stack Presets */}
                    <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-semibold mb-2 flex items-center gap-1.5">
                            <Sparkles size={11} className="text-amber-400" />
                            <span>Popular Stack Presets:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {INTEGRATION_PRESETS.map((preset) => {
                                const isCurrent = preset.ids.length === selectedIntegrations.length &&
                                    preset.ids.every(id => selectedIntegrations.includes(id));
                                return (
                                    <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => onSelectPreset(preset.ids)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border cursor-pointer ${
                                            isCurrent
                                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                                                : 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-300 hover:text-white'
                                        }`}
                                        title={preset.desc}
                                    >
                                        {preset.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {INTEGRATION_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap transition-all cursor-pointer ${
                                    activeCategory === cat.id
                                        ? 'bg-white/15 text-white font-semibold border border-white/20'
                                        : 'text-stone-400 hover:text-stone-200 hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Integrations Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredIntegrations.map((service) => {
                            const isSelected = selectedIntegrations.includes(service.id);
                            const isPreviewOpen = previewBoilerplateId === service.id;
                            const isEditingKeys = editingKeysIntegId === service.id;
                            const userKeys = customApiKeys[service.id] || {};
                            const mergedKeys = { ...service.defaultEnvKeys, ...userKeys };

                            return (
                                <div
                                    key={service.id}
                                    className={`relative rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
                                        isSelected 
                                            ? 'bg-zinc-900/90 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.06)]' 
                                            : 'bg-zinc-950/60 border-white/10 hover:border-white/20'
                                    }`}
                                >
                                    <div>
                                        {/* Top Checkbox + Title Row */}
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div 
                                                className="flex items-center gap-2 cursor-pointer select-none"
                                                onClick={() => onToggleIntegration(service.id)}
                                            >
                                                <div 
                                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                                        isSelected 
                                                            ? 'bg-emerald-500 border-emerald-400 text-zinc-950' 
                                                            : 'border-white/20 bg-black/40'
                                                    }`}
                                                >
                                                    {isSelected && <Check size={12} strokeWidth={3} />}
                                                </div>
                                                <span className="text-base select-none">{service.icon}</span>
                                                <div>
                                                    <h4 className="text-xs font-bold text-white font-mono tracking-wide">
                                                        {service.name}
                                                    </h4>
                                                </div>
                                            </div>

                                            <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-stone-400 shrink-0">
                                                {service.badge}
                                            </span>
                                        </div>

                                        {/* Description */}
                                        <p className="text-[11px] text-stone-400 leading-relaxed mb-3">
                                            {service.desc}
                                        </p>

                                        {/* Features List */}
                                        <div className="space-y-1 mb-3">
                                            {service.features.slice(0, 2).map((feat, idx) => (
                                                <div key={idx} className="flex items-center gap-1.5 text-[10px] text-stone-400 font-mono">
                                                    <span className="text-emerald-400 text-[12px]">&bull;</span>
                                                    <span className="truncate">{feat}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Links & Preview Controls */}
                                    <div className="pt-2 border-t border-white/5 space-y-2">
                                        <div className="flex items-center justify-between text-[10px] font-mono">
                                            <button
                                                type="button"
                                                onClick={() => setPreviewBoilerplateId(isPreviewOpen ? null : service.id)}
                                                className="text-stone-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                                            >
                                                <Code2 size={11} />
                                                <span>{isPreviewOpen ? 'Hide Boilerplate' : 'View Boilerplate'}</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setEditingKeysIntegId(isEditingKeys ? null : service.id)}
                                                className={`flex items-center gap-1 transition-colors cursor-pointer ${
                                                    isSelected ? 'text-emerald-400 hover:text-emerald-300' : 'text-stone-500 hover:text-stone-400'
                                                }`}
                                            >
                                                <Key size={11} />
                                                <span>{isEditingKeys ? 'Close Keys' : 'API Keys'}</span>
                                            </button>
                                        </div>

                                        {/* In-Card API Key Config Section */}
                                        {isEditingKeys && (
                                            <div className="mt-2 p-2.5 rounded-lg bg-black/60 border border-white/10 space-y-2 animate-in fade-in duration-150">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-mono uppercase text-stone-400 font-semibold flex items-center gap-1">
                                                        <Key size={9} /> Placeholder API Keys
                                                    </span>
                                                    <span className="text-[9px] text-stone-500">Auto-injected into .env.local</span>
                                                </div>
                                                {Object.entries(mergedKeys).map(([keyName, keyVal]) => (
                                                    <div key={keyName} className="space-y-0.5">
                                                        <label className="text-[9px] font-mono text-stone-400 block truncate" title={keyName}>
                                                            {keyName}:
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={keyVal}
                                                            onChange={(e) => onUpdateApiKey(service.id, keyName, e.target.value)}
                                                            className="w-full bg-zinc-900 border border-white/15 focus:border-emerald-400 rounded px-2 py-1 text-[10px] font-mono text-stone-200 placeholder-stone-600 focus:outline-none"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* In-Card Boilerplate Snippet Preview */}
                                        {isPreviewOpen && (
                                            <div className="mt-2 p-2.5 rounded-lg bg-black/70 border border-white/10 space-y-2 animate-in fade-in duration-150">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-mono text-cyan-400 font-semibold flex items-center gap-1">
                                                        <FileCode size={10} /> SDK Boilerplate Snippet
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleCopyCode(e, service.boilerplateSnippet, service.id)}
                                                        className="text-[9px] font-mono text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer"
                                                    >
                                                        {copyToast === `code_${service.id}` ? (
                                                            <>
                                                                <Check size={9} className="text-emerald-400" />
                                                                <span className="text-emerald-400">Copied!</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy size={9} />
                                                                <span>Copy</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                                <pre className="text-[10px] font-mono text-stone-300 p-2 bg-zinc-950 rounded border border-white/5 overflow-x-auto max-h-40 leading-snug">
                                                    {service.boilerplateSnippet}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer Summary & .env.local Generator */}
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 text-xs font-mono text-stone-300">
                            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                            <span>
                                {selectedIntegrations.length > 0
                                    ? `${selectedIntegrations.length} service(s) configured. Automatic SDK client code and placeholder keys will be injected into project output.`
                                    : 'No external services selected. Pick services above or use a quick stack preset.'}
                            </span>
                        </div>

                        {selectedIntegrations.length > 0 && (
                            <button
                                type="button"
                                onClick={handleCopyEnv}
                                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                            >
                                {copyToast === 'env_all' ? (
                                    <>
                                        <Check size={12} className="text-emerald-400" />
                                        <span>.env.local Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={12} />
                                        <span>Copy Combined .env.local</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}
