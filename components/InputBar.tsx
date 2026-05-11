
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { LayoutIcon, ThinkingIcon, ArrowUpIcon, AttachmentIcon, XIcon, SparklesIcon, MagicWandIcon } from './Icons';
import { INITIAL_PLACEHOLDERS } from '../constants';
import { SuggestedComponent, Attachment } from '../types';
import { FileText, FileJson, FileCode, FileArchive, File as FileIcon, FileSpreadsheet, FileImage } from 'lucide-react';
import JSZip from 'jszip';

interface InputBarProps {
    inputValue: string;
    setInputValue: (val: string) => void;
    isLoading: boolean;
    currentPrompt?: string;
    onSend: (attachments?: Attachment[], contextUrl?: string) => void;
    onTemplateClick: () => void;
    inputRef: React.RefObject<HTMLTextAreaElement>;
    suggestions: SuggestedComponent[];
    onSuggestionClick: (suggestion: SuggestedComponent) => void;
    isRevisionMode?: boolean;
    artifactName?: string;
}

export default function InputBar({ 
    inputValue, 
    setInputValue, 
    isLoading, 
    currentPrompt,
    onSend, 
    onTemplateClick,
    inputRef,
    suggestions,
    onSuggestionClick,
    isRevisionMode,
    artifactName
}: InputBarProps) {
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [placeholders, setPlaceholders] = useState<string[]>(INITIAL_PLACEHOLDERS);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [contextUrl, setContextUrl] = useState('');
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cycle placeholders
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [placeholders.length]);

    // Dynamic placeholder generation on load
    useEffect(() => {
        const fetchDynamicPlaceholders = async () => {
            try {
                const apiKey = process.env.API_KEY;
                if (!apiKey) return;
                const ai = new GoogleGenAI({ apiKey });
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: { 
                        role: 'user', 
                        parts: [{ 
                            text: 'Generate 20 creative, short, diverse UI component prompts (e.g. "bioluminescent task list"). Return ONLY a raw JSON array of strings. IP SAFEGUARD: Avoid referencing specific famous artists, movies, or brands.' 
                        }] 
                    }
                });
                const text = response.text || '[]';
                const jsonMatch = text.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const newPlaceholders = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(newPlaceholders) && newPlaceholders.length > 0) {
                        const shuffled = newPlaceholders.sort(() => 0.5 - Math.random()).slice(0, 10);
                        setPlaceholders(prev => [...prev, ...shuffled]);
                    }
                }
            } catch (e) {
                console.warn("Silently failed to fetch dynamic placeholders", e);
            }
        };
        setTimeout(fetchDynamicPlaceholders, 1000);
    }, []);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter') {
          if (event.shiftKey) {
            // Allow new line
            return;
          }
          if (!isLoading) {
            event.preventDefault();
            handleSend();
          }
        } else if (event.key === 'Tab' && !inputValue && !isLoading) {
            event.preventDefault();
            setInputValue(placeholders[placeholderIndex]);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await processFiles(Array.from(e.target.files));
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const processFiles = async (files: File[]) => {
        const newAttachments: Attachment[] = [];
        for (const file of files) {
            // Check for folders (webkitdirectory) or zip files
            if (file.name.endsWith('.zip')) {
                try {
                    const zip = new JSZip();
                    const contents = await zip.loadAsync(file);
                    for (const [path, zipFile] of Object.entries(contents.files)) {
                        if (!zipFile.dir) {
                            const data = await zipFile.async('base64');
                            const mimeType = getMimeType(path);
                            if (isReadableFile(path)) {
                                newAttachments.push({
                                    id: Math.random().toString(36).substring(7),
                                    name: `${file.name}/${path}`,
                                    mimeType: mimeType,
                                    data: data,
                                    size: (zipFile as any)._data.uncompressedSize || 0
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to process zip file:", e);
                }
            } else {
                const reader = new FileReader();
                const promise = new Promise<void>((resolve) => {
                    reader.onload = (event) => {
                        const base64 = (event.target?.result as string).split(',')[1];
                        newAttachments.push({
                            id: Math.random().toString(36).substring(7),
                            name: file.webkitRelativePath || file.name,
                            mimeType: file.type || getMimeType(file.name),
                            data: base64,
                            size: file.size
                        });
                        resolve();
                    };
                    reader.readAsDataURL(file);
                });
                await promise;
            }
        }
        setAttachments(prev => [...prev, ...newAttachments]);
    };

    const getMimeType = (path: string) => {
        const p = path.toLowerCase();
        if (p.endsWith('.html')) return 'text/html';
        if (p.endsWith('.css')) return 'text/css';
        if (p.endsWith('.js')) return 'text/javascript';
        if (p.endsWith('.ts') || p.endsWith('.tsx')) return 'text/typescript';
        if (p.endsWith('.json')) return 'application/json';
        if (p.endsWith('.csv')) return 'text/csv';
        if (p.endsWith('.md')) return 'text/markdown';
        if (p.endsWith('.pdf')) return 'application/pdf';
        if (p.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        if (p.endsWith('.png')) return 'image/png';
        if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
        if (p.endsWith('.txt')) return 'text/plain';
        return 'application/octet-stream';
    };

    const isReadableFile = (path: string) => {
        const readableExts = ['.html', '.css', '.js', '.ts', '.tsx', '.json', '.csv', '.md', '.txt', '.png', '.jpg', '.jpeg', '.svg', '.pdf', '.docx'];
        return readableExts.some(ext => path.toLowerCase().endsWith(ext));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processFiles(Array.from(e.dataTransfer.files));
        }
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const getFileIcon = (mime: string, name: string) => {
        const m = mime.toLowerCase();
        const n = name.toLowerCase();
        if (m.startsWith('image/')) return <FileImage className="w-4 h-4 text-pink-400" />;
        if (m.includes('pdf')) return <FileText className="w-4 h-4 text-red-400" />;
        if (m.includes('word') || n.endsWith('.docx')) return <FileText className="w-4 h-4 text-blue-500" />;
        if (m.includes('csv') || m.includes('spreadsheet') || n.endsWith('.csv')) return <FileSpreadsheet className="w-4 h-4 text-green-400" />;
        if (m.includes('json') || n.endsWith('.json')) return <FileJson className="w-4 h-4 text-yellow-400" />;
        if (m.includes('zip') || m.includes('archive') || n.endsWith('.zip')) return <FileArchive className="w-4 h-4 text-blue-400" />;
        if (n.endsWith('.js') || n.endsWith('.ts') || n.endsWith('.tsx') || n.endsWith('.html') || n.endsWith('.css')) {
            return <FileCode className="w-4 h-4 text-cyan-400" />;
        }
        if (n.endsWith('.md') || n.endsWith('.txt')) return <FileText className="w-4 h-4 text-gray-300" />;
        return <FileIcon className="w-4 h-4 text-gray-400" />;
    };

    const handleSend = () => {
        onSend(attachments, contextUrl);
        setAttachments([]);
        setContextUrl('');
        setShowUrlInput(false);
    };

    return (
        <div className="input-dashboard-wrapper">
            <div className="control-strip">
                <div className={`status-indicator ${isLoading ? 'loading' : ''}`}>
                    <div className="dot" />
                    <span>{isLoading ? 'System Processing...' : 'System Ready'}</span>
                </div>
                <div className="dashboard-labels">
                    <div className="mini-label">Session: LIVE_NODE_01</div>
                    <div className="mini-label">Vibe: MAX_CREATIVE</div>
                </div>
            </div>

            <div className="input-bar-container" onDragOver={handleDragOver} onDrop={handleDrop}>
                {isRevisionMode && (
                    <div className="revision-mode-badge animate-pulse">
                        <MagicWandIcon /> REVISING: {artifactName || 'CURRENT_GENERATION'}
                    </div>
                )}

                {suggestions.length > 0 && !isLoading && (
                    <div className="suggestions-row">
                        <div className="suggestions-label">
                            <SparklesIcon /> SUGGESTED_MODES:
                        </div>
                        <div className="suggestions-list">
                            {suggestions.map((s, i) => (
                                <button 
                                    key={i} 
                                    className="suggestion-chip"
                                    onClick={() => onSuggestionClick(s)}
                                >
                                    <span className="suggestion-icon">{s.icon}</span>
                                    <span className="suggestion-name">{s.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {attachments.length > 0 && (
                    <div className="attachment-list-header flex justify-between items-center px-4 pt-2">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                            {attachments.length} context file(s) loaded
                        </span>
                        <button 
                            className="text-[10px] font-mono text-pink-500 hover:text-pink-400 underline uppercase tracking-widest"
                            onClick={() => setAttachments([])}
                        >
                            Clear All
                        </button>
                    </div>
                )}
                {attachments.length > 0 && (
                    <div className="attachment-preview-list">
                        {attachments.map((att) => (
                            <div key={att.id} className={`attachment-preview-card ${att.mimeType.startsWith('image/') ? 'is-image' : ''}`}>
                                {att.mimeType.startsWith('image/') ? (
                                    <img src={`data:${att.mimeType};base64,${att.data}`} alt="attachment" />
                                ) : (
                                    <div className="file-preview-content">
                                        {getFileIcon(att.mimeType, att.name)}
                                        <div className="file-info">
                                            <span className="file-name">{att.name}</span>
                                            <span className="file-size">{(att.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                    </div>
                                )}
                                <button className="attachment-remove" onClick={() => removeAttachment(att.id)}>
                                    <XIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="input-dashboard-main">
                    <div className="styled-input-wrapper">
                        <div className="input-prefix-actions">
                            <button 
                                className="layout-button" 
                                onClick={onTemplateClick}
                                disabled={isLoading}
                                title="Templates"
                            >
                                <LayoutIcon />
                            </button>

                            <button 
                                className="attachment-button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                title="Add Source Files"
                            >
                                <AttachmentIcon />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                accept="image/*,.pdf,.txt,.html,.css,.js,.ts,.tsx,.json,.csv,.docx,.zip,.md" 
                                multiple
                                {...({ webkitdirectory: "", directory: "" } as any)}
                                onChange={handleFileSelect}
                            />

                            <button 
                                className={`expand-button ${isExpanded ? 'active' : ''}`}
                                onClick={() => setIsExpanded(!isExpanded)}
                                title={isExpanded ? "Collapse" : "Expand"}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    {isExpanded ? <path d="M4 14l8-8 8 8" /> : <path d="M4 10l8 8 8-8" />}
                                </svg>
                            </button>

                            <button 
                                className={`attachment-button ${showUrlInput ? 'active' : ''}`}
                                onClick={() => setShowUrlInput(!showUrlInput)}
                                disabled={isLoading}
                                title="Reference URL"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                </svg>
                            </button>
                        </div>

                        <div className={`input-field-container flex flex-col ${isExpanded ? 'expanded' : ''}`}>
                            {showUrlInput && (
                                <div className="url-input-container animate-in fade-in slide-in-from-top-2 duration-300">
                                    <input 
                                        type="url"
                                        className="url-context-input"
                                        placeholder="Paste site or template URL for reference..."
                                        value={contextUrl}
                                        onChange={(e) => setContextUrl(e.target.value)}
                                        autoFocus
                                    />
                                    {contextUrl && (
                                        <button className="url-clear" onClick={() => setContextUrl('')}>
                                            <XIcon />
                                        </button>
                                    )}
                                </div>
                            )}
                            
                            <div className="relative w-full">
                                {(!inputValue && !isLoading && attachments.length === 0 && !contextUrl) && (
                                    <div className="animated-placeholder" key={placeholderIndex}>
                                        <span className="placeholder-text">{placeholders[placeholderIndex]}</span>
                                        <span className="tab-hint">Tab</span>
                                    </div>
                                )}
                                
                                {!isLoading ? (
                                    <textarea 
                                        ref={inputRef}
                                        className="styled-input styled-textarea"
                                        value={inputValue} 
                                        onChange={(e) => setInputValue(e.target.value)} 
                                        onKeyDown={handleKeyDown} 
                                        disabled={isLoading} 
                                        placeholder=""
                                        rows={isExpanded ? 6 : 1}
                                    />
                                ) : (
                                    <div className="input-generating-label">
                                        <span className="generating-prompt-text">{currentPrompt}</span>
                                        <ThinkingIcon />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="input-actions-fixed">
                            <button 
                                className="technical-btn glitch-hover" 
                                onClick={handleSend} 
                                disabled={isLoading || (!inputValue.trim() && attachments.length === 0)}
                            >
                                {isLoading ? <ThinkingIcon /> : <ArrowUpIcon />}
                                <span className="btn-text">{isLoading ? 'BUSY' : 'EXECUTE'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
