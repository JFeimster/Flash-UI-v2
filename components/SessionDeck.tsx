
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useState } from 'react';
import ArtifactCard from './ArtifactCard';
import { SparklesIcon, SearchIcon } from './Icons';
import { Session, Attachment } from '../types';
import { UploadCloud, Paperclip } from 'lucide-react';
import SiteGeneratorMenu from './SiteGeneratorMenu';

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
    onRecoverArtifact?: (artifactId: string) => void;
}

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
    setAttachments,
    onRecoverArtifact
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
                     <div className="empty-header-hero text-center mb-1 animate-in">
                         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium mb-2.5 select-none">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                             AI-Powered Architecture &amp; Component Engine
                         </div>
                         <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-1.5 font-sans">
                             Generate <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Curated Web Experiences</span>
                         </h1>
                         <p className="text-xs sm:text-sm text-stone-400 max-w-lg mx-auto leading-relaxed">
                             Configure archetype, visual persona, stack, and physics &mdash; or let adaptive recommendation orchestrate the code.
                         </p>
                     </div>
                     
                     <SiteGeneratorMenu 
                         onGenerate={(prompt) => onRecommendationClick?.(prompt)}
                         isLoading={isLoading}
                     />

                     <div 
                         className={`empty-dropzone ${isDragging ? 'dragging' : ''} !mt-2 !py-3.5 !px-4 !max-w-xl`}
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
                         <UploadCloud size={20} className="mb-1 text-cyan-400" />
                         <div className="dropzone-text !text-xs !mb-0.5 text-cyan-400">Ground with Reference Design or Specs</div>
                         <div className="dropzone-sub !text-[11px] text-stone-400">Drag &amp; drop files or click to load (.png, .json, .csv, .txt, .zip) as context</div>
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
                                    const isFocused = sIndex === currentSessionIndex && focusedArtifactIndex === aIndex;
                                    
                                    return (
                                        <ArtifactCard 
                                            key={artifact.id}
                                            artifact={artifact}
                                            isFocused={isFocused}
                                            onClick={() => setFocusedArtifactIndex(aIndex)}
                                            onRecover={onRecoverArtifact}
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
