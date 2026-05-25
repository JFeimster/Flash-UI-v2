
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
        <a href="https://x.com/ammaar" target="_blank" rel="noreferrer" className={`creator-credit ${hasStarted ? 'hide-on-mobile' : ''}`}>
            created by @ammaar
        </a>

        <div className="nav-menu">
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

            {hasStarted && (
                <button 
                    className="nav-btn reset-btn-small" 
                    onClick={handleReset}
                    title="Start Over"
                >
                    <HomeIcon />
                </button>
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

            <div className={`action-bar ${focusedArtifactIndex !== null ? 'visible' : ''}`}>
                 <div className="action-buttons">
                    <button onClick={prevItem} disabled={!canGoBack}>
                        <ArrowLeftIcon /> Back
                    </button>
                    <button onClick={() => setFocusedArtifactIndex(null)}>
                        <GridIcon /> Grid View
                    </button>
                    {currentSession && focusedArtifactIndex !== null && (
                        <button onClick={() => setIsImmersiveModalOpen(true)} className="popout-trigger-btn font-bold">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                <path d="M15 3h6v6" />
                                <path d="M9 21H3v-6" />
                                <path d="M21 3l-7 7" />
                                <path d="M3 21l7-7" />
                            </svg> 
                            Full Popout
                        </button>
                    )}

                    {currentSession && focusedArtifactIndex !== null && (
                        <>
                            <button 
                                onClick={() => toggleFavorite(currentSession.id, currentSession.artifacts[focusedArtifactIndex].id)}
                                className={currentSession.artifacts[focusedArtifactIndex].isFavorite ? 'active' : ''}
                            >
                                {currentSession.artifacts[focusedArtifactIndex].isFavorite ? <StarFilledIcon /> : <StarIcon />}
                                {currentSession.artifacts[focusedArtifactIndex].isFavorite ? 'Favorited' : 'Favorite'}
                            </button>

                            <button 
                                onClick={() => toggleSave(currentSession.id, currentSession.artifacts[focusedArtifactIndex].id)}
                                className={currentSession.artifacts[focusedArtifactIndex].isSaved ? 'active' : ''}
                            >
                                {currentSession.artifacts[focusedArtifactIndex].isSaved ? <BookmarkFilledIcon /> : <BookmarkIcon />}
                                {currentSession.artifacts[focusedArtifactIndex].isSaved ? 'Saved' : 'Save'}
                            </button>
                        </>
                    )}

                    <button onClick={handleGenerateVariationsClick} disabled={isLoading}>
                        <SparklesIcon /> Variations
                    </button>
                    <button onClick={handleShowAITools} disabled={isLoading}>
                        <MagicWandIcon /> AI Tools
                    </button>
                    <button onClick={handleShowAnimations} disabled={isLoading}>
                        <SparklesIcon /> Animate
                    </button>
                    <button onClick={handleShowRecommended} disabled={isLoading}>
                        <LayoutIcon /> Recommended
                    </button>
                    <button onClick={handleShowCode}>
                        <CodeIcon /> Source
                    </button>
                    <button onClick={nextItem} disabled={!canGoForward}>
                        Next <ArrowRightIcon />
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
        </div>
    </>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
