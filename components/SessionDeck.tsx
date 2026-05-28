
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useState } from 'react';
import ArtifactCard from './ArtifactCard';
import { SparklesIcon, SearchIcon } from './Icons';
import { Session, Attachment } from '../types';
import { UploadCloud, Paperclip } from 'lucide-react';

interface SessionDeckProps {
    sessions: Session[];
    currentSessionIndex: number;
    focusedArtifactIndex: number | null;
    setFocusedArtifactIndex: (idx: number | null) => void;
    hasStarted: boolean;
    isLoading: boolean;
    onSurpriseMe: () => void;
    onRecommendationClick?: (prompt: string) => void;
    attachments: Attachment[];
    setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
}

const RECOMMENDATIONS = [
    { label: "SaaS Landing Page", prompt: "A modern high-conversion SaaS landing page with hero section, features grid, and pricing table." },
    { label: "Dashboard Analytics", prompt: "A dark-mode analytics dashboard with data visualization widgets, sidebar navigation, and user profile." },
    { label: "E-commerce Product", prompt: "A minimalist e-commerce product detail page with image gallery, size selector, and add to cart interaction." },
    { label: "Auth Flow", prompt: "A split-screen authentication page with login form, social auth buttons, and testimonial slider." },
    { label: "Portfolio Grid", prompt: "A masonry grid portfolio layout for a photographer with hover effects and lightbox modal." }
];

export default function SessionDeck({
    sessions,
    currentSessionIndex,
    focusedArtifactIndex,
    setFocusedArtifactIndex,
    hasStarted,
    isLoading,
    onSurpriseMe,
    onRecommendationClick,
    attachments,
    setAttachments
}: SessionDeckProps) {
    const gridScrollRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const emptyFileInputRef = useRef<HTMLInputElement>(null);

    const handleEmptyStateFiles = async (files: File[]) => {
        const newAttachments: Attachment[] = [];
        for (const file of files) {
            const reader = new FileReader();
            const promise = new Promise<void>((resolve) => {
                reader.onload = (event) => {
                    const base64 = (event.target?.result as string).split(',')[1];
                    newAttachments.push({
                        id: Math.random().toString(36).substring(7),
                        name: file.name,
                        mimeType: file.type || 'application/octet-stream',
                        data: base64,
                        size: file.size
                    });
                    resolve();
                };
                reader.readAsDataURL(file);
            });
            await promise;
        }
        setAttachments(prev => [...prev, ...newAttachments]);
        
        const ta = document.querySelector('.styled-textarea') as HTMLTextAreaElement;
        if (ta) {
            ta.focus();
        }
    };

    // Fix for mobile: reset scroll when focusing an item
    useEffect(() => {
        if (focusedArtifactIndex !== null && window.innerWidth <= 1024) {
            if (gridScrollRef.current) {
                gridScrollRef.current.scrollTop = 0;
            }
            window.scrollTo(0, 0);
        }
    }, [focusedArtifactIndex]);

    // Search Logic
    const filteredArtifacts = sessions.flatMap(session => 
        session.artifacts.map(artifact => ({
            ...artifact,
            sessionPrompt: session.prompt,
            sessionId: session.id
        }))
    ).filter(item => {
        const query = searchQuery.toLowerCase();
        return item.sessionPrompt.toLowerCase().includes(query) || 
               item.styleName.toLowerCase().includes(query);
    });

    return (
        <div className={`stage-container ${focusedArtifactIndex !== null ? 'mode-focus' : 'mode-split'}`}>
             
             {/* Search Bar */}
             {hasStarted && focusedArtifactIndex === null && (
                 <div className={`search-container ${hasStarted ? 'visible' : ''}`}>
                     <div className="search-input-wrapper">
                         <SearchIcon />
                         <input 
                            type="text" 
                            className="search-input" 
                            placeholder="Search history..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                         />
                     </div>
                 </div>
             )}

             {/* Empty State */}
             <div className={`empty-state ${hasStarted ? 'fade-out' : ''}`}>
                 <div className="empty-content">
                     <h1 data-text="FLASH UI" className="glitch-hover">FLASH UI</h1>
                     <p style={{fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '4px', opacity: 0.6, textShadow: '0 0 10px var(--neon-glow)'}}>CORE_ENGINE_v1.0</p>
                     
                     <div className="recommendations-grid">
                        {RECOMMENDATIONS.map((rec, i) => (
                            <button 
                                key={i} 
                                className="recommendation-chip"
                                onClick={() => onRecommendationClick?.(rec.prompt)}
                                disabled={isLoading}
                                title={rec.prompt}
                            >
                                {rec.label}
                            </button>
                        ))}
                     </div>

                     <button className="surprise-button" onClick={onSurpriseMe} disabled={isLoading} title="Generate a random UI">
                         <SparklesIcon /> Surprise Me
                     </button>

                     <div 
                         className={`empty-dropzone ${isDragging ? 'dragging' : ''}`}
                         onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                         onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                         onDrop={async (e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             setIsDragging(false);
                             if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                  await handleEmptyStateFiles(Array.from(e.dataTransfer.files));
                             }
                         }}
                         onClick={() => emptyFileInputRef.current?.click()}
                     >
                         <input 
                             type="file"
                             ref={emptyFileInputRef}
                             style={{ display: 'none' }}
                             multiple
                             onChange={async (e) => {
                                 if (e.target.files && e.target.files.length > 0) {
                                     await handleEmptyStateFiles(Array.from(e.target.files));
                                 }
                             }}
                         />
                         <UploadCloud size={24} style={{ marginBottom: '8px', color: 'var(--neon-pink)' }} />
                         <div className="dropzone-text">GROUND WITH REFERENCE DATA OR DESIGN REFERENCE</div>
                         <div className="dropzone-sub">Drag & Drop files or click to load (.png, .json, .csv, .txt, .zip) as context</div>
                     </div>

                     {attachments && attachments.length > 0 && (
                         <div className="empty-attachments-list">
                             {attachments.map((file) => (
                                 <div key={file.id} className="empty-attachment-tag">
                                     <Paperclip size={12} />
                                     <span className="file-name">{file.name}</span>
                                     <button 
                                         className="remove-btn"
                                         onClick={(e) => {
                                             e.stopPropagation();
                                             setAttachments(prev => prev.filter(f => f.id !== file.id));
                                         }}
                                     >
                                         &times;
                                     </button>
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
             </div>

            {/* Search Results View */}
            {searchQuery ? (
                <div className="search-results-grid">
                    {filteredArtifacts.map((artifact) => (
                        <ArtifactCard 
                            key={artifact.id}
                            artifact={artifact}
                            isFocused={false} 
                            onClick={() => {}}
                        />
                    ))}
                    {filteredArtifacts.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', gridColumn: '1/-1', marginTop: '40px' }}>
                            {`No results found for "${searchQuery}"`}
                        </div>
                    )}
                </div>
            ) : (
                /* Standard Deck View */
                sessions.map((session, sIndex) => {
                    let positionClass = 'hidden';
                    if (sIndex === currentSessionIndex) positionClass = 'active-session';
                    else if (sIndex < currentSessionIndex) positionClass = 'past-session';
                    else if (sIndex > currentSessionIndex) positionClass = 'future-session';
                    
                    return (
                        <div key={session.id} className={`session-group ${positionClass}`}>
                            <div className="artifact-grid" ref={sIndex === currentSessionIndex ? gridScrollRef : null}>
                                {session.artifacts.map((artifact, aIndex) => {
                                    const isFocused = focusedArtifactIndex === aIndex;
                                    
                                    return (
                                        <ArtifactCard 
                                            key={artifact.id}
                                            artifact={artifact}
                                            isFocused={isFocused}
                                            onClick={() => setFocusedArtifactIndex(aIndex)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
