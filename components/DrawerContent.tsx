
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { ThinkingIcon, DownloadIcon, BotIcon, SparklesIcon, LayoutIcon, CodeIcon, CopyIcon } from './Icons';
import { ComponentVariation, RecommendedPage, AnimationStyle } from '../types';
import { TEMPLATES } from '../templates';
import { ANIMATION_STYLES } from '../animations';
import { downloadCode, downloadZip, getExportedFiles, ExportedFiles } from '../utils/export';

interface DrawerContentProps {
    mode: 'code' | 'variations' | 'templates' | 'recommended' | 'animations' | null;
    data: any;
    isLoading: boolean;
    componentVariations: ComponentVariation[];
    onApplyVariation: (html: string) => void;
    onTemplateClick: (prompt: string) => void;
    explainCode?: (code: string) => Promise<string | undefined>;
    refactorCode?: (code: string, instruction: string, onChunk?: (chunk: string) => void) => Promise<string | undefined>;
    onRefactorApply?: (newHtml: string) => void;
    generateRecommendedPages?: (sessionId: string, artifactId: string) => Promise<RecommendedPage[]>;
    onSwitchMode?: (mode: 'code' | 'recommended') => void;
    applyAnimation?: (code: string, animationPrompt: string) => Promise<string | undefined>;
    generateAdditionalFile?: (baseHtml: string, filename: string, description: string) => Promise<string>;
    onUpdateArtifactFiles?: (sessionId: string, artifactId: string, files: Record<string, string>) => void;
}

export default function DrawerContent({
    mode,
    data,
    isLoading,
    componentVariations,
    onApplyVariation,
    onTemplateClick,
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

    const formats = [
        { id: 'static', label: 'Static HTML', desc: 'Direct browser use' },
        { id: 'nextjs', label: 'Next.js', desc: 'Modern App Router' },
        { id: 'react', label: 'React', desc: 'Best Single Component' },
        { id: 'vue', label: 'Vue', desc: 'SFC Version' },
        { id: 'svelte', label: 'Svelte', desc: 'Reactive Component' },
        { id: 'wix', label: 'Wix Velo', desc: 'For Wix Sites' },
        { id: 'notion', label: 'Notion', desc: 'Markdown Embed' },
    ];

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
    }, [data?.html, data?.prompt]);
    
    // AI Assistant state
    const [assistantMode, setAssistantMode] = useState<'none' | 'explain' | 'refactor'>('none');
    const [assistantResponse, setAssistantResponse] = useState<string>('');
    const [isAssistantLoading, setIsAssistantLoading] = useState(false);
    const [refactorInstruction, setRefactorInstruction] = useState('');

    // Recommended Pages state
    const [recommendedPages, setRecommendedPages] = useState<RecommendedPage[]>([]);
    const [isRecommendedLoading, setIsRecommendedLoading] = useState(false);

    // Animations state
    const [isAnimating, setIsAnimating] = useState(false);

    // Multi-file state
    const [activeFile, setActiveFile] = useState<string>('');
    const [generatingFiles, setGeneratingFiles] = useState<Set<string>>(new Set());
    const [exportedFiles, setExportedFiles] = useState<ExportedFiles>({});

    const isLoadingVariations = isLoading && mode === 'variations' && componentVariations.length === 0;

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
        const pages = await generateRecommendedPages(data.sessionId, data.artifactId);
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
            const fileContent = await generateAdditionalFile(data.html, filename, description);
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
                            {formats.map((f) => (
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
                        </div>
                    </div>

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

                    <pre className="code-block"><code>{exportedFiles[activeFile]}</code></pre>
                </div>
            )}

            {mode === 'recommended' && (
                <div className="recommended-pages-wrapper">
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
                <div className="sexy-grid">
                    {TEMPLATES.map((t, i) => (
                        <div key={i} className="sexy-card template-card" onClick={() => onTemplateClick(t.prompt)}>
                            <div className="sexy-label" style={{borderTop: 'none', background: 'transparent', textAlign: 'left', padding: '20px'}}>
                                <div style={{fontSize: '1rem', marginBottom: '6px', color: '#fff', fontWeight: 600}}>{t.title}</div>
                                <div style={{fontSize: '0.85rem', opacity: 0.7, lineHeight: 1.4}}>{t.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
