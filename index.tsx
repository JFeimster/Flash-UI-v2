
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

//Vibe coded by ammaar@google.com

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// Silence benign WebSocket errors from Vite HMR
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalDebug = console.debug;

  const isBenignViteError = (msg: any) => {
    if (typeof msg !== 'string') return false;
    return (
      msg.includes('[vite] failed to connect to websocket') ||
      msg.includes('WebSocket closed without opened') ||
      msg.includes('[vite] connecting...')
    );
  };

  console.error = (...args: any[]) => {
    if (args.some(isBenignViteError)) return;
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    if (args.some(isBenignViteError)) return;
    originalWarn.apply(console, args);
  };

  console.debug = (...args: any[]) => {
    if (args.some(isBenignViteError)) return;
    originalDebug.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || (typeof event.reason === 'string' ? event.reason : '');
    if (isBenignViteError(msg)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

import { useGenAI } from './hooks/useGenAI';
import { useNavigation } from './hooks/useNavigation';
import { INITIAL_PLACEHOLDERS } from './constants';
import { SuggestedComponent, Attachment, Artifact } from './types';

import DottedGlowBackground from './components/DottedGlowBackground';
import SideDrawer from './components/SideDrawer';
import InputBar from './components/InputBar';
import SessionDeck from './components/SessionDeck';
import DrawerContent from './components/DrawerContent';
import { 
    CodeIcon, 
    SparklesIcon, 
    ArrowLeftIcon, 
    ArrowRightIcon, 
    GridIcon,
    HomeIcon,
    LayoutIcon,
    MagicWandIcon,
    StarIcon,
    StarFilledIcon,
    BookmarkIcon,
    BookmarkFilledIcon,
    HeartIcon,
    HeartFilledIcon
} from './components/Icons';

import FeaturesList from './components/FeaturesList';
import SemanticRouter from './components/SemanticRouter';

export const AttachmentIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
    </svg>
);

export const XIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

function App() {
  const { 
    currentUser,
    authLoading,
    loginWithGoogle,
    logoutUser,
    sessions, 
    savedArtifacts,
    userApiKey,
    setUserApiKey,
    validateApiKey,
    apiKeyStatus,
    isLoading, 
    componentVariations, 
    sendMessage, 
    reviseArtifact,
    generateVariations, 
    updateSessionArtifact,
    addVariationToSession,
    updateSessionArtifactFiles,
    setComponentVariations,
    resetSessions,
    toggleFavorite,
    toggleSave,
    removeSaved,
    explainCode,
    refactorCode,
    generateRecommendedPages,
    applyAnimation,
    suggestComponents,
    generateAdditionalFile,
    generateTailoredRecommendations
  } = useGenAI();

  const {
      currentSessionIndex,
      focusedArtifactIndex,
      setFocusedArtifactIndex,
      currentSession,
      nextItem,
      prevItem,
      canGoBack,
      canGoForward,
  } = useNavigation(sessions);

  const [inputValue, setInputValue] = useState<string>('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedComponent[]>([]);
  const [showFeatures, setShowFeatures] = useState(false);
  const [isPromptCollapsed, setIsPromptCollapsed] = useState(false);
  const [isImmersiveModalOpen, setIsImmersiveModalOpen] = useState(false);
  const [popoutWidth, setPopoutWidth] = useState<'100%' | '768px' | '375px'>('100%');
  const [isRouterActive, setIsRouterActive] = useState(false);

  const prevSessionsLength = useRef(sessions.length);
  useEffect(() => {
      if (sessions.length > prevSessionsLength.current && sessions.length > 0) {
          setIsPromptCollapsed(true);
      }
      prevSessionsLength.current = sessions.length;
  }, [sessions.length]);
  
  const [drawerState, setDrawerState] = useState<{
      isOpen: boolean;
      mode: 'code' | 'variations' | 'templates' | 'recommended' | 'animations' | 'ai-tools' | 'library' | null;
      title: string;
      data: any; 
  }>({ isOpen: false, mode: null, title: '', data: null });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      inputRef.current?.focus();
  }, []);

  const handleShowLibrary = useCallback(() => {
    setDrawerState({
        isOpen: true,
        mode: 'library',
        title: 'Your Library',
        data: null
    });
  }, []);

  const handleSendMessage = useCallback((passedAttachments: Attachment[] = [], contextUrl?: string) => {
    const finalAttachments = passedAttachments.length > 0 ? passedAttachments : attachments;
    if (inputValue.trim() || finalAttachments.length > 0 || contextUrl) {
        if (currentSession && focusedArtifactIndex !== null) {
            // Revision Mode
            const artifact = currentSession.artifacts[focusedArtifactIndex];
            reviseArtifact(currentSession.id, artifact.id, inputValue, finalAttachments, contextUrl);
        } else {
            // New generation
            sendMessage(inputValue, finalAttachments, contextUrl);
            setFocusedArtifactIndex(null); 
        }
        setSuggestions([]); // Clear suggestions on new send
        setInputValue('');
        setAttachments([]);
    }
  }, [inputValue, sendMessage, reviseArtifact, currentSession, focusedArtifactIndex, setFocusedArtifactIndex, attachments]);

  const handleSuggestionClick = useCallback((suggestion: SuggestedComponent) => {
      setInputValue(suggestion.prompt);
      sendMessage(suggestion.prompt);
      setSuggestions([]);
      setFocusedArtifactIndex(null);
  }, [sendMessage, setFocusedArtifactIndex]);

  // Fetch suggestions when a session is active or focused
  useEffect(() => {
      if (currentSession && !isLoading && suggestions.length === 0) {
          const fetchSuggestions = async () => {
              const newSuggestions = await suggestComponents(currentSession.prompt);
              setSuggestions(newSuggestions);
          };
          fetchSuggestions();
      }
  }, [currentSession, isLoading, suggestComponents, suggestions.length]);

  const handleReset = useCallback(() => {
      resetSessions();
      setFocusedArtifactIndex(null);
      setInputValue('');
      setSuggestions([]);
  }, [resetSessions, setFocusedArtifactIndex]);

  const handleGenerateVariationsClick = useCallback(() => {
    if (currentSession && focusedArtifactIndex !== null) {
        setComponentVariations([]); // Clear previous
        setDrawerState({ isOpen: true, mode: 'variations', title: 'Variations', data: currentSession.artifacts[focusedArtifactIndex].id });
        generateVariations(currentSession, focusedArtifactIndex);
    }
  }, [currentSession, focusedArtifactIndex, generateVariations, setComponentVariations]);

  const handleApplyVariation = useCallback((code: string) => {
      if (currentSession && focusedArtifactIndex !== null) {
          const originalArtifact = currentSession.artifacts[focusedArtifactIndex];
          const newArtifact: Artifact = {
              id: Math.random().toString(36).substring(7),
              html: code,
              styleName: `${originalArtifact.styleName} (Variant)`,
              status: 'complete'
          };
          addVariationToSession(currentSessionIndex, newArtifact);
          setFocusedArtifactIndex(currentSession.artifacts.length);
          setDrawerState(s => ({ ...s, isOpen: false }));
      }
  }, [currentSession, currentSessionIndex, focusedArtifactIndex, addVariationToSession]);

  const handleShowCode = useCallback(() => {
      if (currentSession && focusedArtifactIndex !== null) {
          const artifact = currentSession.artifacts[focusedArtifactIndex];
          setDrawerState({ 
              isOpen: true, 
              mode: 'code', 
              title: 'Source Code', 
              data: { 
                  html: artifact.html, 
                  additionalFiles: artifact.additionalFiles,
                  sessionId: currentSession.id, 
                  artifactId: artifact.id,
                  prompt: currentSession.prompt
              } 
          });
      }
  }, [currentSession, focusedArtifactIndex]);

  const handleShowRecommended = useCallback(() => {
      if (currentSession && focusedArtifactIndex !== null) {
          const artifact = currentSession.artifacts[focusedArtifactIndex];
          setDrawerState({ 
              isOpen: true, 
              mode: 'recommended', 
              title: 'Recommended Pages', 
              data: { 
                  html: artifact.html, 
                  additionalFiles: artifact.additionalFiles,
                  sessionId: currentSession.id, 
                  artifactId: artifact.id,
                  prompt: currentSession.prompt
              } 
          });
      }
  }, [currentSession, focusedArtifactIndex]);

  const handleUpdateArtifactFiles = useCallback((sessionId: string, artifactId: string, files: Record<string, string>) => {
      updateSessionArtifactFiles(sessionId, artifactId, files);
      setDrawerState(prev => {
          if (prev.data?.sessionId === sessionId && prev.data?.artifactId === artifactId) {
              return {
                  ...prev,
                  data: {
                      ...prev.data,
                      additionalFiles: { ...(prev.data.additionalFiles || {}), ...files }
                  }
              };
          }
          return prev;
      });
  }, [updateSessionArtifactFiles]);

  const handleShowAnimations = useCallback(() => {
      if (currentSession && focusedArtifactIndex !== null) {
          const artifact = currentSession.artifacts[focusedArtifactIndex];
          setDrawerState({ isOpen: true, mode: 'animations', title: 'Sizzling Animations', data: artifact.html });
      }
  }, [currentSession, focusedArtifactIndex]);

  const handleShowAITools = useCallback(() => {
      if (currentSession && focusedArtifactIndex !== null) {
          const artifact = currentSession.artifacts[focusedArtifactIndex];
          setDrawerState({ 
              isOpen: true, 
              mode: 'ai-tools', 
              title: 'AI Magic Tools', 
              data: { 
                  html: artifact.html, 
                  prompt: currentSession.prompt,
                  sessionId: currentSession.id,
                  artifactId: artifact.id
              } 
          });
      }
  }, [currentSession, focusedArtifactIndex]);

  const handleTemplateClick = useCallback((prompt: string) => {
      setDrawerState(prev => ({...prev, isOpen: false}));
      setInputValue(prompt.split('\n')[0]);
      sendMessage(prompt);
      setFocusedArtifactIndex(null);
  }, [sendMessage, setFocusedArtifactIndex]);

  const handleSurpriseMe = useCallback(() => {
      const randomPrompt = INITIAL_PLACEHOLDERS[Math.floor(Math.random() * INITIAL_PLACEHOLDERS.length)];
      setInputValue(randomPrompt);
      sendMessage(randomPrompt);
      setFocusedArtifactIndex(null);
  }, [sendMessage, setFocusedArtifactIndex]);

  const hasStarted = sessions.length > 0 || isLoading;

  useEffect(() => {
      if (!hasStarted) {
          setIsPromptCollapsed(false);
      }
  }, [hasStarted]);

  return (
    <>
        <div className="nav-menu">
            {focusedArtifactIndex !== null ? (
                <div className="flex items-center gap-3">
                    <button 
                        className="nav-btn font-semibold flex items-center gap-1.5 hover:text-white transition-all bg-[#ec4899]/10 text-white border border-[#ec4899]/20"
                        onClick={() => setFocusedArtifactIndex(null)}
                        title="Return to grid view"
                    >
                        <ArrowLeftIcon /> Grid View
                    </button>
                    {currentSession && currentSession.artifacts[focusedArtifactIndex] && (
                        <div className="focused-page-indicator font-mono hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-stone-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ec4899] animate-pulse"></span>
                            Editing: <span className="text-white font-medium">{currentSession.artifacts[focusedArtifactIndex].styleName}</span>
                        </div>
                    )}
                    {!authLoading && currentUser && (
                         <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] text-emerald-400 font-mono select-none">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>
                              Cloud Synced
                         </div>
                    )}
                </div>
            ) : (
                <>
                    <button 
                        className="nav-btn"
                        onClick={() => setShowFeatures(true)}
                        title="Planned Features"
                    >
                        Features
                    </button>

                    <button 
                        className="nav-btn"
                        onClick={() => setDrawerState({ isOpen: true, mode: 'templates', title: 'Templates', data: null })}
                        title="Browse Templates"
                    >
                        Templates
                    </button>

                    <button 
                        className="nav-btn"
                        onClick={handleShowLibrary}
                        title="Your Library"
                    >
                        <BookmarkFilledIcon /> Library
                    </button>

                    {hasStarted && sessions.some(s => s.artifacts.some(a => a.html && a.status === 'complete')) && (
                        <button 
                            className={`nav-btn font-semibold flex items-center gap-1 bg-[#ec4899]/10 text-white hover:bg-[#ec4899]/25 border border-[#ec4899]/25 transition-all duration-300 ${isRouterActive ? 'glow-active active' : ''}`}
                            onClick={() => setIsRouterActive(!isRouterActive)}
                            title="Orchestrate and link independent pages together in real-time"
                            style={{
                                boxShadow: isRouterActive ? '0 0 12px rgba(255, 0, 128, 0.4)' : undefined,
                                borderColor: isRouterActive ? '#ff4b91' : undefined
                            }}
                        >
                            🖥️ State Router Map
                        </button>
                    )}

                    {hasStarted && (
                        <button 
                            className="nav-btn reset-btn-small" 
                            onClick={handleReset}
                            title="Start Over"
                        >
                            <HomeIcon />
                        </button>
                    )}

                    {/* Firebase Authentication Sync Controls */}
                    <div className="flex items-center gap-2 border-l border-white/10 pl-3 ml-2">
                        {authLoading ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-stone-400 select-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                <span className="font-mono text-[10px]">Checking Sync...</span>
                            </div>
                        ) : currentUser ? (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400 select-none">
                                    {currentUser.photoURL ? (
                                        <img 
                                            src={currentUser.photoURL} 
                                            alt={currentUser.displayName || 'User'} 
                                            className="w-4 h-4 rounded-full border border-emerald-400/30 object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[9px] uppercase border border-emerald-400/30">
                                            {currentUser.email?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                    <span className="font-mono text-[10px] hidden md:inline max-w-[120px] truncate">
                                        {currentUser.displayName || currentUser.email}
                                    </span>
                                </div>
                                <button 
                                    onClick={logoutUser}
                                    className="p-1.5 px-3 rounded-full bg-stone-900 border border-white/15 hover:border-red-500/40 text-stone-300 hover:text-red-400 text-xs font-mono font-medium hover:bg-red-500/10 transition-all cursor-pointer"
                                    title="Sign Out of Cloud Session"
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={loginWithGoogle}
                                className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-indigo-500/25 to-pink-500/25 hover:from-indigo-500/40 hover:to-pink-500/40 border border-white/15 hover:border-pink-500/40 text-white rounded-full text-xs font-semibold shadow-md hover:shadow-indigo-500/15 transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                                title="Sign In with Google to sync sessions and saved elements securely in Cloud Firestore"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.6-4.53-3.85-4.53z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                                </svg>
                                <span>Sign In & Sync</span>
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>

        {showFeatures && <FeaturesList onClose={() => setShowFeatures(false)} />}

        <SideDrawer 
            isOpen={drawerState.isOpen} 
            onClose={() => setDrawerState(s => ({...s, isOpen: false}))} 
            title={drawerState.title}
        >
            <DrawerContent 
                mode={drawerState.mode}
                data={drawerState.data}
                isLoading={isLoading}
                componentVariations={componentVariations}
                savedArtifacts={savedArtifacts}
                sessions={sessions}
                userApiKey={userApiKey}
                setUserApiKey={setUserApiKey}
                validateApiKey={validateApiKey}
                apiKeyStatus={apiKeyStatus}
                onApplyVariation={handleApplyVariation}
                onTemplateClick={handleTemplateClick}
                toggleFavorite={toggleFavorite}
                toggleSave={toggleSave}
                removeSaved={removeSaved}
                explainCode={explainCode}
                refactorCode={refactorCode}
                generateRecommendedPages={generateRecommendedPages}
                applyAnimation={applyAnimation}
                generateAdditionalFile={generateAdditionalFile}
                onUpdateArtifactFiles={handleUpdateArtifactFiles}
                generateTailoredRecommendations={generateTailoredRecommendations}
                onRefactorApply={(newHtml) => {
                    if (focusedArtifactIndex !== null) {
                        updateSessionArtifact(currentSessionIndex, focusedArtifactIndex, newHtml);
                        setDrawerState(s => ({ ...s, data: { ...s.data, html: newHtml } }));
                    }
                }}
                onSwitchMode={(newMode) => setDrawerState(s => ({ ...s, mode: newMode, title: newMode === 'recommended' ? 'Recommended Pages' : 'Source Code' }))}
            />
        </SideDrawer>

        <div className="immersive-app">
            <div className="scanline"></div>
            <DottedGlowBackground 
                gap={24} 
                radius={1.5} 
                color="rgba(255, 255, 255, 0.02)" 
                glowColor="rgba(107, 33, 255, 0.4)" 
                speedScale={0.5} 
            />

            <SessionDeck 
                sessions={sessions}
                currentSessionIndex={currentSessionIndex}
                focusedArtifactIndex={focusedArtifactIndex}
                setFocusedArtifactIndex={setFocusedArtifactIndex}
                hasStarted={hasStarted}
                isLoading={isLoading}
                onSurpriseMe={handleSurpriseMe}
                onRecommendationClick={handleTemplateClick}
                attachments={attachments}
                setAttachments={setAttachments}
            />

            {isRouterActive && (
                <div className="absolute inset-0 p-6 pt-16 bg-[#050507] flex flex-col backdrop-blur-md" style={{ zIndex: 10100 }}>
                    <SemanticRouter 
                        sessions={sessions}
                        onUpdateArtifactHtml={(sessId, artId, newHtml) => {
                            const sIdx = sessions.findIndex(s => s.id === sessId);
                            if (sIdx !== -1) {
                                const aIdx = sessions[sIdx].artifacts.findIndex(a => a.id === artId);
                                if (aIdx !== -1) {
                                    updateSessionArtifact(sIdx, aIdx, newHtml);
                                }
                            }
                        }}
                        refactorCode={refactorCode}
                        generateTailoredRecommendations={generateTailoredRecommendations}
                        onClose={() => setIsRouterActive(false)}
                    />
                </div>
            )}

             {canGoBack && (
                <button className="nav-handle left" onClick={prevItem} aria-label="Previous">
                    <ArrowLeftIcon />
                </button>
             )}
             {canGoForward && (
                <button className="nav-handle right" onClick={nextItem} aria-label="Next">
                    <ArrowRightIcon />
                </button>
             )}

            <div className={`action-bar ${focusedArtifactIndex !== null && !isRouterActive ? 'visible' : ''}`}>
                 <div className="action-buttons">
                     {/* Step 1: Compact Pagination controls */}
                     <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-0.5 gap-0.5 select-none" style={{ pointerEvents: 'auto' }}>
                         <button 
                             onClick={prevItem} 
                             disabled={!canGoBack} 
                             className="p-1 px-2.5 rounded-full hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center text-stone-300"
                             title="Previous Page"
                             style={{ background: 'none', border: 'none', boxShadow: 'none' }}
                         >
                             <ArrowLeftIcon />
                         </button>
                         <span className="text-[11px] font-mono font-bold px-1 text-stone-400">
                             {(focusedArtifactIndex ?? 0) + 1} / {currentSession?.artifacts.length || 1}
                         </span>
                         <button 
                             onClick={nextItem} 
                             disabled={!canGoForward} 
                             className="p-1 px-2.5 rounded-full hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center text-stone-350"
                             title="Next Page"
                             style={{ background: 'none', border: 'none', boxShadow: 'none' }}
                         >
                             <ArrowRightIcon />
                         </button>
                     </div>

                     {/* Step 2: Document State Icons (Favorite, Save, Full Popout) */}
                     {currentSession && focusedArtifactIndex !== null && (
                         <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-0.5" style={{ pointerEvents: 'auto' }}>
                             <button 
                                 onClick={() => toggleFavorite(currentSession.id, currentSession.artifacts[focusedArtifactIndex].id)}
                                 className={`p-1.5 rounded-full hover:bg-white/10 transition-all flex items-center justify-center ${currentSession.artifacts[focusedArtifactIndex].isFavorite ? 'text-yellow-400 bg-yellow-400/15' : 'text-stone-400'}`}
                                 title={currentSession.artifacts[focusedArtifactIndex].isFavorite ? 'Favorited' : 'Add to Favorites'}
                                 style={{ background: 'none', border: 'none', boxShadow: 'none' }}
                             >
                                 {currentSession.artifacts[focusedArtifactIndex].isFavorite ? <StarFilledIcon /> : <StarIcon />}
                             </button>

                             <button 
                                 onClick={() => toggleSave(currentSession.id, currentSession.artifacts[focusedArtifactIndex].id)}
                                 className={`p-1.5 rounded-full hover:bg-white/10 transition-all flex items-center justify-center ${currentSession.artifacts[focusedArtifactIndex].isSaved ? 'text-pink-400 bg-pink-400/15' : 'text-stone-400'}`}
                                 title={currentSession.artifacts[focusedArtifactIndex].isSaved ? 'Saved to Library' : 'Save to Library'}
                                 style={{ background: 'none', border: 'none', boxShadow: 'none' }}
                             >
                                 {currentSession.artifacts[focusedArtifactIndex].isSaved ? <BookmarkFilledIcon /> : <BookmarkIcon />}
                             </button>

                             <div className="w-[1px] h-4 bg-white/10 mx-0.5"></div>

                             <button 
                                 onClick={() => setIsImmersiveModalOpen(true)} 
                                 className="p-1.5 rounded-full hover:bg-white/10 text-stone-300 transition-all flex items-center justify-center"
                                 title="Open Full Popout View"
                                 style={{ background: 'none', border: 'none', boxShadow: 'none' }}
                             >
                                 <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                     <path d="M15 3h6v6" />
                                     <path d="M9 21H3v-6" />
                                     <path d="M21 3l-7 7" />
                                     <path d="M3 21l7-7" />
                                 </svg>
                             </button>
                         </div>
                     )}

                     {/* Step 3: Powerful AI Wizards & Creators */}
                     <button onClick={handleGenerateVariationsClick} disabled={isLoading} title="Generate style/content variations">
                         <SparklesIcon /> Variations
                     </button>
                     <button onClick={handleShowAITools} disabled={isLoading} title="Trigger custom AI refactors / enhancements">
                         <MagicWandIcon /> AI Tools
                     </button>
                     <button onClick={handleShowAnimations} disabled={isLoading} title="Inject transition animations">
                         <SparklesIcon /> Animate
                     </button>
                     <button onClick={handleShowRecommended} disabled={isLoading} title="Get related layout blueprints">
                         <LayoutIcon /> Layouts
                     </button>
                     <button onClick={handleShowCode} className="font-semibold text-white bg-[#ec4899]/15 border-[#ec4899]/30 hover:bg-[#ec4899]/30" title="Inspect page markup & styling">
                         <CodeIcon /> Source
                     </button>
                  </div>
            </div>

            {isPromptCollapsed && hasStarted && (
                <button 
                    className="floating-prompt-trigger" 
                    onClick={() => setIsPromptCollapsed(false)}
                    title="Show Prompt Panel"
                >
                    <MagicWandIcon /> <span>✎ Edit / Revise Prompt</span>
                </button>
            )}

            <InputBar 
                inputValue={inputValue}
                setInputValue={setInputValue}
                isLoading={isLoading}
                currentPrompt={currentSession?.prompt}
                onSend={handleSendMessage}
                onTemplateClick={() => setDrawerState({ isOpen: true, mode: 'templates', title: 'Templates', data: null })}
                inputRef={inputRef as any}
                suggestions={suggestions}
                onSuggestionClick={handleSuggestionClick}
                isRevisionMode={currentSession !== null && focusedArtifactIndex !== null}
                artifactName={currentSession && focusedArtifactIndex !== null ? currentSession.artifacts[focusedArtifactIndex].styleName : undefined}
                hasStarted={hasStarted}
                isCollapsed={isPromptCollapsed}
                onCollapse={() => setIsPromptCollapsed(true)}
                attachments={attachments}
                setAttachments={setAttachments}
            />
        </div>

        {/* Immersive Fullscreen Popout Modal */}
        {isImmersiveModalOpen && currentSession && focusedArtifactIndex !== null && (
            <div className="fullscreen-popout-overlay" onClick={() => setIsImmersiveModalOpen(false)}>
                <div className="fullscreen-popout-content" onClick={(e) => e.stopPropagation()}>
                    <div className="fullscreen-popout-header">
                        <div className="flex items-center gap-4">
                            <span className="popout-title">{currentSession.artifacts[focusedArtifactIndex].styleName}</span>
                            <span className="popout-subtitle font-mono">Full-Scale Popout View</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                className={`responsive-btn-pill ${popoutWidth === '375px' ? 'active' : ''}`}
                                onClick={() => setPopoutWidth('375px')}
                                title="Mobile Preview"
                            >
                                Mobile
                            </button>
                            <button 
                                className={`responsive-btn-pill ${popoutWidth === '768px' ? 'active' : ''}`}
                                onClick={() => setPopoutWidth('768px')}
                                title="Tablet Preview"
                            >
                                Tablet
                            </button>
                            <button 
                                className={`responsive-btn-pill ${popoutWidth === '100%' ? 'active' : ''}`}
                                onClick={() => setPopoutWidth('100%')}
                                title="Desktop Preview"
                            >
                                Desktop
                            </button>

                            <button 
                                className="close-fullscreen-btn font-bold"
                                onClick={() => setIsImmersiveModalOpen(false)}
                            >
                                Exit Popout
                            </button>
                        </div>
                    </div>
                    <div className="fullscreen-iframe-container" style={{ width: popoutWidth }}>
                        <iframe 
                            srcDoc={currentSession.artifacts[focusedArtifactIndex].html} 
                            title="fullscreen-preview"
                            sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
                            className="fullscreen-iframe"
                        />
                    </div>
                </div>
            </div>
        )}
    </>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
