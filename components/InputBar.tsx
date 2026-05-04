
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { LayoutIcon, ThinkingIcon, ArrowUpIcon, AttachmentIcon, XIcon, SparklesIcon } from './Icons';
import { INITIAL_PLACEHOLDERS } from '../constants';
import { SuggestedComponent } from '../types';

interface InputBarProps {
    inputValue: string;
    setInputValue: (val: string) => void;
    isLoading: boolean;
    currentPrompt?: string;
    onSend: (attachments?: { mimeType: string, data: string }[]) => void;
    onTemplateClick: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
    suggestions: SuggestedComponent[];
    onSuggestionClick: (suggestion: SuggestedComponent) => void;
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
    onSuggestionClick
}: InputBarProps) {
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [placeholders, setPlaceholders] = useState<string[]>(INITIAL_PLACEHOLDERS);
    const [attachments, setAttachments] = useState<{ mimeType: string, data: string }[]>([]);
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

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !isLoading) {
          event.preventDefault();
          handleSend();
        } else if (event.key === 'Tab' && !inputValue && !isLoading) {
            event.preventDefault();
            setInputValue(placeholders[placeholderIndex]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = (event.target?.result as string).split(',')[1];
                setAttachments(prev => [...prev, { mimeType: file.type, data: base64 }]);
            };
            reader.readAsDataURL(file);
        }
        // Reset input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = () => {
        onSend(attachments);
        setAttachments([]);
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

            <div className="input-bar-container">
                {suggestions.length > 0 && !isLoading && (
                    <div className="suggestions-row" style={{marginBottom: '4px'}}>
                        <div className="suggestions-label" style={{fontFamily: 'Roboto Mono, monospace', fontSize: '10px'}}>
                            <SparklesIcon /> SUGGESTED_MODES:
                        </div>
                        {suggestions.map((s, i) => (
                            <button 
                                key={i} 
                                className="suggestion-chip"
                                onClick={() => onSuggestionClick(s)}
                                style={{borderRadius: '4px', textTransform: 'uppercase', fontSize: '10px'}}
                            >
                                <span className="suggestion-icon">{s.icon}</span>
                                <span className="suggestion-name">{s.name}</span>
                            </button>
                        ))}
                    </div>
                )}

                {attachments.length > 0 && (
                    <div className="attachment-preview-list" style={{padding: '0 0 12px 0'}}>
                        {attachments.map((att, i) => (
                            <div key={i} className="attachment-preview" style={{width: '60px', height: '60px', borderRadius: '4px'}}>
                                <img src={`data:${att.mimeType};base64,${att.data}`} alt="attachment" />
                                <button className="attachment-remove" onClick={() => removeAttachment(i)}>
                                    <XIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="input-dashboard-main">
                    <div className="styled-input-wrapper">
                        <button 
                            className="layout-button" 
                            onClick={onTemplateClick}
                            disabled={isLoading}
                            style={{color: 'rgba(255,255,255,0.4)'}}
                        >
                            <LayoutIcon />
                        </button>

                        <button 
                            className="attachment-button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            style={{color: 'rgba(255,255,255,0.4)', padding: 0, width: 'auto'}}
                        >
                            <AttachmentIcon />
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            accept="image/*" 
                            onChange={handleFileSelect}
                        />

                        <div style={{position: 'relative', flex: 1, display: 'flex', alignItems: 'center'}}>
                            {(!inputValue && !isLoading && attachments.length === 0) && (
                                <div className="animated-placeholder" key={placeholderIndex} style={{position: 'absolute', left: 0, pointerEvents: 'none', background: 'transparent', width: '100%'}}>
                                    <span className="placeholder-text" style={{fontSize: '0.9rem', color: 'rgba(255,255,255,0.2)'}}>{placeholders[placeholderIndex]}</span>
                                    <span className="tab-hint" style={{marginLeft: 'auto', fontSize: '9px', padding: '2px 4px'}}>Tab</span>
                                </div>
                            )}
                            
                            {!isLoading ? (
                                <input 
                                    ref={inputRef}
                                    type="text" 
                                    className="styled-input"
                                    value={inputValue} 
                                    onChange={(e) => setInputValue(e.target.value)} 
                                    onKeyDown={handleKeyDown} 
                                    disabled={isLoading} 
                                    placeholder=""
                                />
                            ) : (
                                <div className="input-generating-label" style={{background: 'transparent', padding: 0, width: '100%'}}>
                                    <span className="generating-prompt-text" style={{color: 'rgba(255,255,255,0.5)'}}>{currentPrompt}</span>
                                    <ThinkingIcon />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="input-actions">
                        <button 
                            className="technical-btn" 
                            onClick={handleSend} 
                            disabled={isLoading || (!inputValue.trim() && attachments.length === 0)}
                        >
                            <ArrowUpIcon /> {isLoading ? 'BUSY' : 'EXECUTE'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
