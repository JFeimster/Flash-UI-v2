
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { generateId, withRetry } from '../utils';
import { Session, Artifact, ComponentVariation, SuggestedComponent, Attachment } from '../types';
import { db, auth, loginWithGoogle, logoutUser, handleFirestoreError, OperationType } from '../utils/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection, getDocFromServer } from 'firebase/firestore';

const STORAGE_KEY = 'flash_ui_sessions_v1';
const SAVED_KEY = 'flash_ui_saved_v1';
const API_KEY_STORAGE_KEY = 'flash_ui_user_api_key';

const decodeBase64ToText = (base64: string): string => {
    try {
        return decodeURIComponent(
            window.atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
    } catch (e) {
        try {
            return window.atob(base64);
        } catch {
            return '[Binary / Undecodable Content]';
        }
    }
};

const shouldSendAsText = (mimeType: string, filename: string): boolean => {
    const m = mimeType ? mimeType.toLowerCase() : '';
    const name = filename ? filename.toLowerCase() : '';
    if (m.startsWith('text/')) return true;
    if (m === 'application/json' || m === 'application/javascript' || m === 'application/typescript' || m === 'application/x-javascript') return true;
    const textExtensions = ['.html', '.css', '.js', '.ts', '.tsx', '.json', '.csv', '.md', '.txt', '.svg', '.xml', '.yaml', '.yml', '.ini', '.conf'];
    return textExtensions.some(ext => name.endsWith(ext));
};

export const cleanHtmlString = (html: string): string => {
    if (!html) return '';
    let cleaned = html.trim();
    // Remove starting ```html or ```xml or ```Markdown or ```
    cleaned = cleaned.replace(/^```(?:html|xml|markdown)?\s*\n?/i, '');
    // Remove ending ```
    cleaned = cleaned.replace(/\s*\n?```$/i, '');
    return cleaned;
};

const saveSessionDoc = async (userId: string, sessionId: string, sessionData: any) => {
    // Sanitize to prevent large payload size errors
    const sanitizedAttachments = sessionData.attachments?.map((att: any) => ({
        id: att.id,
        name: att.name,
        mimeType: att.mimeType,
        size: att.size,
        data: "" // Clear large base64 data to keep Firestore within 1MB limit
    })) || [];

    const sanitizedSession = {
        ...sessionData,
        attachments: sanitizedAttachments,
        userId
    };

    return setDoc(doc(db, 'users', userId, 'sessions', sessionId), sanitizedSession);
};

export const useGenAI = () => {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState<boolean>(true);

    // Initialize state
    const [userApiKey, setUserApiKey] = useState<string>('');
    const [sessions, setSessions] = useState<Session[]>([]);
    const [savedArtifacts, setSavedArtifacts] = useState<Artifact[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [componentVariations, setComponentVariations] = useState<ComponentVariation[]>([]);

    const [apiKeyStatus, setApiKeyStatus] = useState<{
        isValid: boolean | null;
        error: string | null;
        quotaInfo?: string;
    }>({ isValid: null, error: null });

    // === Firebase Connection Validation and Auth Monitor ===
    useEffect(() => {
        const testConnection = async () => {
            try {
                await getDocFromServer(doc(db, 'test', 'connection'));
            } catch (error) {
                if (error instanceof Error && error.message.includes('the client is offline')) {
                    console.error("Please check your Firebase configuration.");
                }
            }
        };
        testConnection();

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setCurrentUser(user);
            if (user) {
                setAuthLoading(true);
                try {
                    // Load or init user document
                    const userDocRef = doc(db, 'users', user.uid);
                    let userDoc;
                    try {
                        userDoc = await getDoc(userDocRef);
                    } catch (error) {
                        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
                        throw error;
                    }

                    if (!userDoc.exists()) {
                        try {
                            await setDoc(userDocRef, {
                                id: user.uid,
                                email: user.email,
                                createdAt: new Date().toISOString()
                            });
                        } catch (error) {
                            handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
                            throw error;
                        }
                    } else {
                        const userData = userDoc.data();
                        if (userData && userData.userApiKey) {
                            setUserApiKey(userData.userApiKey);
                        }
                    }

                    // Load user sessions
                    let sessionsSnap;
                    try {
                        sessionsSnap = await getDocs(collection(db, 'users', user.uid, 'sessions'));
                    } catch (error) {
                        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/sessions`);
                        throw error;
                    }

                    const loadedSessions: Session[] = [];
                    sessionsSnap.forEach((docSnap) => {
                        loadedSessions.push(docSnap.data() as Session);
                    });
                    loadedSessions.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                    setSessions(loadedSessions);

                    // Load user saved artifacts
                    let savedSnap;
                    try {
                        savedSnap = await getDocs(collection(db, 'users', user.uid, 'savedArtifacts'));
                    } catch (error) {
                        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/savedArtifacts`);
                        throw error;
                    }

                    const loadedSaved: Artifact[] = [];
                    savedSnap.forEach((docSnap) => {
                        loadedSaved.push(docSnap.data() as Artifact);
                    });
                    setSavedArtifacts(loadedSaved);
                } catch (e) {
                    console.error("Failed to load user data from Firestore:", e);
                } finally {
                    setAuthLoading(false);
                }
            } else {
                // Not authenticated, fallback to local storage
                try {
                    const localApiKey = localStorage.getItem(API_KEY_STORAGE_KEY) || '';
                    setUserApiKey(localApiKey);

                    const localSessions = localStorage.getItem(STORAGE_KEY);
                    setSessions(localSessions ? JSON.parse(localSessions) : []);

                    const localSaved = localStorage.getItem(SAVED_KEY);
                    setSavedArtifacts(localSaved ? JSON.parse(localSaved) : []);
                } catch (e) {
                    console.warn('Failed to load state from local storage', e);
                }
                setAuthLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Persist to localStorage only when user is NOT logged in or debounce userApiKey write
    useEffect(() => {
        const handler = setTimeout(async () => {
            try {
                if (!auth.currentUser) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
                    localStorage.setItem(SAVED_KEY, JSON.stringify(savedArtifacts));
                    if (userApiKey) {
                        localStorage.setItem(API_KEY_STORAGE_KEY, userApiKey);
                    } else {
                        localStorage.removeItem(API_KEY_STORAGE_KEY);
                    }
                } else {
                    const user = auth.currentUser;
                    const userDocRef = doc(db, 'users', user.uid);
                    await updateDoc(userDocRef, {
                        userApiKey: userApiKey
                    }).catch(() => {});
                }
            } catch (e) {
                console.warn('Failed to sync settings', e);
            }
        }, 1000);

        return () => clearTimeout(handler);
    }, [sessions, savedArtifacts, userApiKey, currentUser]);

    const validateApiKey = useCallback(async (key: string) => {
        if (!key) {
            setApiKeyStatus({ isValid: false, error: 'API Key is required.' });
            return false;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: key });
            
            // Simple validation call using the SDK's existing pattern
            const result = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: [{ parts: [{ text: 'ping' }], role: 'user' }]
            }) as GenerateContentResponse;

            if (result) {
                setApiKeyStatus({ 
                    isValid: true, 
                    error: null,
                    quotaInfo: 'Key is functional. Status: Active'
                });
                return true;
            }
            return false;
        } catch (e: any) {
            setApiKeyStatus({ isValid: false, error: e.message || 'Invalid API Key or network error.' });
            return false;
        }
    }, []);

    const getAiClient = useCallback(() => {
        const key = userApiKey || process.env.API_KEY || (process.env as any).GEMINI_API_KEY;
        if (!key) throw new Error("No Gemini API key found. Please configure one in AI Tools.");
        return new GoogleGenAI({ apiKey: key });
    }, [userApiKey]);

    const parseJsonStream = async function* (responseStream: any) {
        let buffer = '';
        for await (const chunk of responseStream) {
            const text = chunk.text;
            if (typeof text !== 'string') continue;
            buffer += text;
            let braceCount = 0;
            let start = buffer.indexOf('{');
            while (start !== -1) {
                braceCount = 0;
                let end = -1;
                for (let i = start; i < buffer.length; i++) {
                    if (buffer[i] === '{') braceCount++;
                    else if (buffer[i] === '}') braceCount--;
                    if (braceCount === 0 && i > start) {
                        end = i;
                        break;
                    }
                }
                if (end !== -1) {
                    const jsonString = buffer.substring(start, end + 1);
                    try {
                        yield JSON.parse(jsonString);
                        buffer = buffer.substring(end + 1);
                        start = buffer.indexOf('{');
                    } catch (e) {
                        start = buffer.indexOf('{', start + 1);
                    }
                } else {
                    break; 
                }
            }
        }
    };

    const generateVariations = useCallback(async (currentSession: Session, focusedArtifactIndex: number) => {
        if (!currentSession || focusedArtifactIndex === null) return;
        
        setIsLoading(true);
        setComponentVariations([]);

        try {
            const ai = getAiClient();

            const prompt = `
You are a master UI/UX designer. Generate 3 RADICAL CONCEPTUAL VARIATIONS of: "${currentSession.prompt}".

**STRICT IP SAFEGUARD:**
No names of artists. 
Instead, describe the *Physicality* and *Material Logic* of the UI.

**CREATIVE GUIDANCE (Use these as EXAMPLES of how to describe style, but INVENT YOUR OWN):**
1. Example: "Asymmetrical Primary Grid" (Heavy black strokes, rectilinear structure, flat primary pigments, high-contrast white space).
2. Example: "Suspended Kinetic Mobile" (Delicate wire-thin connections, floating organic primary shapes, slow-motion balance, white-void background).
3. Example: "Grainy Risograph Press" (Overprinted translucent inks, dithered grain textures, monochromatic color depth, raw paper substrate).
4. Example: "Volumetric Spectral Fluid" (Generative morphing gradients, soft-focus diffusion, bioluminescent light sources, spectral chromatic aberration).

**YOUR TASK:**
For EACH variation:
- Invent a unique design persona name based on a NEW physical metaphor.
- Rewrite the prompt to fully adopt that metaphor's visual language.
- Generate high-fidelity HTML/CSS.

Required JSON Output Format (stream ONE object per line):
\`{ "name": "Persona Name", "html": "..." }\`
            `.trim();

            const responseStream = await withRetry(() => ai.models.generateContentStream({
                model: 'gemini-3.5-flash',
                contents: [{ parts: [{ text: prompt }], role: 'user' }],
                config: { temperature: 1.2 }
            })) as any;

            for await (const variation of parseJsonStream(responseStream)) {
                if (variation.name && variation.html) {
                    setComponentVariations(prev => [...prev, variation]);
                }
            }
        } catch (e: any) {
            console.error("Error generating variations:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const sendMessage = useCallback(async (promptText: string, attachments: Attachment[] = [], contextUrl?: string) => {
        const trimmedInput = promptText.trim();
        if (!trimmedInput && attachments.length === 0 && !contextUrl) return;

        setIsLoading(true);
        
        const baseTime = Date.now();
        const sessionId = generateId();

        let fetchedContext = '';
        if (contextUrl) {
            try {
                const response = await fetch('/api/proxy/fetch-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: contextUrl })
                });
                const data = await response.json();
                if (data.content) {
                    fetchedContext = data.content;
                }
            } catch (e) {
                console.error("Failed to fetch context URL:", e);
            }
        }

        const placeholderArtifacts: Artifact[] = Array(3).fill(null).map((_, i) => ({
            id: `${sessionId}_${i}`,
            styleName: 'Designing...',
            html: '',
            status: 'streaming' as const,
        }));

        const newSession: Session = {
            id: sessionId,
            prompt: trimmedInput || (contextUrl ? `UI based on ${contextUrl}` : (attachments.length > 0 ? `Generate UI using ${attachments.length} attachment(s)` : "")),
            timestamp: baseTime,
            artifacts: placeholderArtifacts,
            attachments: attachments,
            contextUrl: contextUrl || ""
        };

        setSessions(prev => [...prev, newSession]);

        const user = auth.currentUser;
        if (user) {
            saveSessionDoc(user.uid, sessionId, newSession)
                .catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/sessions/${sessionId}`));
        }

        try {
            const ai = getAiClient();

            const stylePrompt = `Based on this request: "${trimmedInput || 'UI from attachments'}", suggest 3 distinct visual names/styles. Return ONLY a JSON array of strings. e.g. ["Cyber Grid", "Glass Echo", "Paper Grain"]. No trademarks.`;

            // Wrap style generation with retry logic
            const styleResponse = await withRetry(() => ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: { role: 'user', parts: [{ text: stylePrompt }] }
            })) as GenerateContentResponse;

            let generatedStyles: string[] = ["Dynamic Edge", "Core Flow", "Prism Logic"];
            try {
                const match = styleResponse.text?.match(/\[.*\]/);
                if (match) generatedStyles = JSON.parse(match[0]);
            } catch (e) {}

            setSessions(prev => {
                const updated = prev.map(s => s.id === sessionId ? {
                    ...s,
                    artifacts: s.artifacts.map((art, i) => ({...art, styleName: generatedStyles[i] || art.styleName}))
                } : s);

                if (user) {
                    const matched = updated.find(x => x.id === sessionId);
                    if (matched) {
                        saveSessionDoc(user.uid, sessionId, matched)
                            .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/sessions/${sessionId}`));
                    }
                }
                return updated;
            });

            const generateArtifact = async (artifact: Artifact, styleInstruction: string) => {
                try {
                    const prompt = `
You are a master UI Engineer. Create a high-fidelity, production-ready UI component.

USER REQUEST: "${trimmedInput || (contextUrl ? `Replicate or take inspiration from the site at ${contextUrl}` : 'Create a UI based on the attached files')}"
STYLE INSPIRATION: ${styleInstruction}

${fetchedContext ? `REFERENCE SITE CONTENT (MARKKDOWN/TEXT):
${fetchedContext}
` : ''}

ATTACHED SOURCE FILES CONTEXT:
${attachments.length > 0 ? `The user has attached ${attachments.length} files to provide context. 
These files may include images for layout inspiration, text files for content, data files (CSV/JSON) for sample data, or source code (HTML/CSS/JS) for functional requirements.
Analyze all provided parts and integrate their essence into the final component.` : 'No additional files attached.'}

STRICT REQUIREMENTS:
- Return ONLY raw HTML/CSS. 
- Ensure it is a complete, standalone component.
- Match the visual vibe of the Style Inspiration.
- No Markdown, no explanations, no chat commentary.
`.trim();
                    
                    const parts: any[] = [{ text: prompt }];
                    
                    // Route attachments either as inlineData (multimodal) or text blocks (source files)
                    attachments.forEach(att => {
                        if (shouldSendAsText(att.mimeType, att.name)) {
                            parts.push({
                                text: `=== FILE ATTACHMENT: ${att.name} (${att.mimeType}) ===\n${decodeBase64ToText(att.data)}\n=== END FILE ATTACHMENT ===`
                            });
                        } else {
                            parts.push({
                                inlineData: {
                                    mimeType: att.mimeType,
                                    data: att.data
                                }
                            });
                        }
                    });

                    // Wrap stream connection with retry logic
                    const responseStream = await withRetry(() => ai.models.generateContentStream({
                        model: 'gemini-3.5-flash',
                        contents: [{ parts, role: 'user' }],
                    })) as any;

                    let accumulatedHtml = '';
                    for await (const chunk of responseStream) {
                        accumulatedHtml += chunk.text || '';
                        setSessions(prev => prev.map(sess => sess.id === sessionId ? {
                            ...sess,
                            artifacts: sess.artifacts.map(art => art.id === artifact.id ? { ...art, html: cleanHtmlString(accumulatedHtml) } : art)
                        } : sess));
                    }

                    const finalHtml = cleanHtmlString(accumulatedHtml);
                    setSessions(prev => {
                        const updated = prev.map(sess => sess.id === sessionId ? {
                            ...sess,
                            artifacts: sess.artifacts.map(art => art.id === artifact.id ? { ...art, html: finalHtml, status: 'complete' as const } : art)
                        } : sess);

                        if (user) {
                            const matched = updated.find(x => x.id === sessionId);
                            if (matched) {
                                saveSessionDoc(user.uid, sessionId, matched)
                                    .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/sessions/${sessionId}`));
                            }
                        }
                        return updated;
                    });
                } catch (e) {
                    console.error(`Artifact generation failed for ${artifact.id}:`, e);
                    setSessions(prev => {
                        const updated = prev.map(sess => sess.id === sessionId ? {
                            ...sess,
                            artifacts: sess.artifacts.map(art => art.id === artifact.id ? { ...art, status: 'error' as const } : art)
                        } : sess);

                        if (user) {
                            const matched = updated.find(x => x.id === sessionId);
                            if (matched) {
                                saveSessionDoc(user.uid, sessionId, matched)
                                    .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/sessions/${sessionId}`));
                            }
                        }
                        return updated;
                    });
                }
            };

            await Promise.all(placeholderArtifacts.map((art, i) => generateArtifact(art, generatedStyles[i])));

        } catch (e) {
            console.error("Session generation failed:", e);
        } finally {
            setIsLoading(false);
        }
    }, [getAiClient]);

    const updateSessionArtifact = (sessionIndex: number, artifactIndex: number, html: string) => {
         const finalHtml = cleanHtmlString(html);
         setSessions(prev => {
             const updated = prev.map((sess, i) => 
                i === sessionIndex ? {
                    ...sess,
                    artifacts: sess.artifacts.map((art, j) => 
                      j === artifactIndex ? { ...art, html: finalHtml, status: 'complete' as const } : art
                    )
                } : sess
             );

             const user = auth.currentUser;
             const targetSess = updated[sessionIndex];
             if (user && targetSess) {
                 saveSessionDoc(user.uid, targetSess.id, targetSess)
                     .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/sessions/${targetSess.id}`));
             }
             return updated;
         });
    };

    const addVariationToSession = (sessionIndex: number, newArtifact: Artifact) => {
        setSessions(prev => {
            const updated = prev.map((sess, i) => 
                i === sessionIndex ? {
                    ...sess,
                    artifacts: [...sess.artifacts, newArtifact]
                } : sess
            );

            const user = auth.currentUser;
            const targetSess = updated[sessionIndex];
            if (user && targetSess) {
                saveSessionDoc(user.uid, targetSess.id, targetSess)
                    .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/sessions/${targetSess.id}`));
            }
            return updated;
        });
    };

    const updateSessionArtifactFiles = (sessionId: string, artifactId: string, files: Record<string, string>) => {
        setSessions(prev => {
            const updated = prev.map(sess => 
                sess.id === sessionId ? {
                    ...sess,
                    artifacts: sess.artifacts.map(art => 
                        art.id === artifactId ? { 
                            ...art, 
                            additionalFiles: { ...(art.additionalFiles || {}), ...files } 
                        } : art
                    )
                } : sess
            );

            const user = auth.currentUser;
            const targetSess = updated.find(s => s.id === sessionId);
            if (user && targetSess) {
                saveSessionDoc(user.uid, sessionId, targetSess)
                    .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/sessions/${sessionId}`));
            }
            return updated;
        });
    };

    const generateAdditionalFile = useCallback(async (baseHtml: string, filename: string, description: string, outputFormat?: string) => {
        try {
            const ai = getAiClient();

            const prompt = `
You are building an addition to an existing UI component.
BASE COMPONENT CODE:
\`\`\`html
${baseHtml}
\`\`\`

THE TARGET OUTPUT FORMAT IS: ${outputFormat || 'Standard HTML'}

YOUR TASK:
Generate the code for a new file named "${filename}".
PURPOSE: ${description}

STRICT REQUIREMENTS:
- Return ONLY the raw code for this file.
- If it's an HTML file, provide a full valid HTML document.
- If it's a CSS or JS file, provide only that content.
- Ensure it visually matches the BASE COMPONENT.
- OPTIMIZE the code for the ${outputFormat || 'selected'} format.
- No Markdown, no explanations.
            `.trim();

            const result = await withRetry(() => ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: [{ parts: [{ text: prompt }], role: 'user' }],
            })) as GenerateContentResponse;

            return result.text;
        } catch (e) {
            console.error("Error generating additional file:", e);
            return "";
        }
    }, []);

    const toggleFavorite = useCallback((sessionId: string, artifactId: string) => {
        setSessions(prev => {
            const updated = prev.map(s => 
                s.id === sessionId ? {
                    ...s,
                    artifacts: s.artifacts.map(a => 
                        a.id === artifactId ? { ...a, isFavorite: !a.isFavorite } : a
                    )
                } : s
            );
            const user = auth.currentUser;
            if (user) {
                const matched = updated.find(x => x.id === sessionId);
                if (matched) {
                    saveSessionDoc(user.uid, sessionId, matched)
                        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/sessions/${sessionId}`));
                }
            }
            return updated;
        });
    }, []);

    const toggleSave = useCallback((sessionId: string, artifactId: string) => {
        const session = sessions.find(s => s.id === sessionId);
        const artifact = session?.artifacts.find(a => a.id === artifactId);
        
        if (!artifact) return;

        setSessions(prev => {
            const updated = prev.map(s => 
                s.id === sessionId ? {
                    ...s,
                    artifacts: s.artifacts.map(a => 
                        a.id === artifactId ? { ...a, isSaved: !a.isSaved } : a
                    )
                } : s
            );
            const user = auth.currentUser;
            if (user) {
                const matched = updated.find(x => x.id === sessionId);
                if (matched) {
                    saveSessionDoc(user.uid, sessionId, matched)
                        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/sessions/${sessionId}`));
                }
            }
            return updated;
        });

        setSavedArtifacts(prev => {
            const exists = prev.find(a => a.id === artifactId);
            const user = auth.currentUser;
            if (exists) {
                if (user) {
                    deleteDoc(doc(db, 'users', user.uid, 'savedArtifacts', artifactId))
                        .catch(err => handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/savedArtifacts/${artifactId}`));
                }
                return prev.filter(a => a.id !== artifactId);
            } else {
                const newArtifact = { ...artifact, isSaved: true };
                if (user) {
                    setDoc(doc(db, 'users', user.uid, 'savedArtifacts', artifactId), newArtifact)
                        .catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/savedArtifacts/${artifactId}`));
                }
                return [...prev, newArtifact];
            }
        });
    }, [sessions]);

    const removeSaved = useCallback((artifactId: string) => {
        const user = auth.currentUser;
        setSavedArtifacts(prev => {
            if (user) {
                deleteDoc(doc(db, 'users', user.uid, 'savedArtifacts', artifactId))
                    .catch(err => handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/savedArtifacts/${artifactId}`));
            }
            return prev.filter(a => a.id !== artifactId);
        });
        setSessions(prev => {
            const updated = prev.map(s => ({
                ...s,
                artifacts: s.artifacts.map(a => 
                    a.id === artifactId ? { ...a, isSaved: false } : a
                )
            }));
            if (user) {
                const sessionWithArt = updated.find(s => s.artifacts.some(a => a.id === artifactId));
                if (sessionWithArt) {
                    saveSessionDoc(user.uid, sessionWithArt.id, sessionWithArt)
                        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/sessions/${sessionWithArt.id}`));
                }
            }
            return updated;
        });
    }, []);

    const resetSessions = useCallback(() => {
        setSessions([]);
        setIsLoading(false);
        const user = auth.currentUser;
        if (user) {
            getDocs(collection(db, 'users', user.uid, 'sessions')).then((snap) => {
                snap.forEach((docSnap) => {
                    deleteDoc(doc(db, 'users', user.uid, 'sessions', docSnap.id))
                        .catch(() => {});
                });
            }).catch(() => {});
        } else {
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (e) {
                console.warn('Failed to clear sessions from local storage', e);
            }
        }
    }, []);

    const explainCode = useCallback(async (code: string) => {
        try {
            const ai = getAiClient();

            const prompt = `Explain the following code snippet in a concise and clear way. Focus on the main functionality and key design choices:\n\n\`\`\`html\n${code}\n\`\`\``;
            
            const result = await withRetry(() => ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: [{ parts: [{ text: prompt }], role: 'user' }],
            })) as GenerateContentResponse;

            return result.text;
        } catch (e) {
            console.error("Error explaining code:", e);
            return "Failed to explain code.";
        }
    }, []);

    const refactorCode = useCallback(async (code: string, instruction: string, onChunk?: (chunk: string) => void) => {
        try {
            const ai = getAiClient();

            const prompt = `Refactor the following code snippet based on this instruction: "${instruction}". Return ONLY the refactored raw HTML/CSS. No Markdown.\n\n\`\`\`html\n${code}\n\`\`\``;
            
            const responseStream = await withRetry(() => ai.models.generateContentStream({
                model: 'gemini-3.5-flash',
                contents: [{ parts: [{ text: prompt }], role: 'user' }],
            })) as any;

            let accumulatedHtml = '';
            for await (const chunk of responseStream) {
                const text = chunk.text || '';
                accumulatedHtml += text;
                onChunk?.(accumulatedHtml);
            }

            return accumulatedHtml;
        } catch (e) {
            console.error("Error refactoring code:", e);
            return code; // Return original code on failure
        }
    }, []);

    const generateRecommendedPages = useCallback(async (sessionId: string, artifactId: string, outputFormat?: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return [];
        
        try {
            const ai = getAiClient();

            const prompt = `
Analyze this UI component prompt: "${session.prompt}".
The user has selected an output format of: ${outputFormat || 'Standard HTML'}.

Suggest 5 complementary pages to build out a full application based on this component.
For each page, provide:
1. A title.
2. A detailed description of its purpose.
3. A suggested file structure (list of files) - OPTIMIZE these for the ${outputFormat || 'selected'} format.

Return ONLY a JSON array of objects with the following structure:
[
  {
    "title": "...",
    "description": "...",
    "fileStructure": ["...", "..."]
  }
]
            `.trim();

            const response = await withRetry(() => ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: [{ parts: [{ text: prompt }], role: 'user' }],
                config: { responseMimeType: 'application/json' }
            })) as GenerateContentResponse;

            const pages = JSON.parse(response.text || '[]');
            return pages;
        } catch (e) {
            console.error("Error generating recommended pages:", e);
            return [];
        }
    }, [sessions]);

    const applyAnimation = useCallback(async (code: string, animationPrompt: string) => {
        try {
            const ai = getAiClient();

            const prompt = `Enhance the following UI component with this animation style: "${animationPrompt}". 
Ensure the animations are "sizzling", modern, and highly engaging. 
Return ONLY the complete updated raw HTML/CSS. No Markdown, no explanations.\n\n\`\`\`html\n${code}\n\`\`\``;
            
            const result = await withRetry(() => ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: [{ parts: [{ text: prompt }], role: 'user' }],
            })) as GenerateContentResponse;

            return result.text;
        } catch (e) {
            console.error("Error applying animation:", e);
            return code;
        }
    }, []);

    const generateTailoredRecommendations = useCallback(async (currentPrompt: string, html: string, techStack?: string, searchQuery?: string) => {
        try {
            const ai = getAiClient();
            let prompt = `Analyze this UI component design: "${currentPrompt}" with code "${html.substring(0, 1500)}...".\n\n`;
            
            if (techStack) {
                prompt += `CRITICAL TECH STACK & INTEGRATION CONTEXT:\nThe project utilizes the following tech stack, tools, and existing apps: "${techStack}". Make sure EVERY suggestion matches and integrates easily into this exact tech environment.\n\n`;
            }
            
            if (searchQuery) {
                prompt += `REAL-TIME LIVE SELECTION SEARCH / CRITERIA MATCH WITH GOOGLE SEARCH GROUNDING:\nThe user is specifically searching for or wanting recommendations related to: "${searchQuery}". Ensure standard suggestions are heavily focused, enriched, and grounded around this search criteria with easy-to-integrate options. Use your real-time search capabilities to locate up-to-date SDK packages, API endpoints, or npm dependencies and represent them accurately.\n\n`;
            }
            
            prompt += `Suggest:
1. Three customized UI components, modes, or design layout ideas specifically matching this project context.
2. Two custom AI features/integrations.
3. Two specific REST API triggers, services, or webhooks.

Return ONLY a JSON object with this exact schema:
{
  "components": ["Component Name with brief feature title", "another...", "another..."],
  "integrations": ["AI Integration Title: short description of capability", "another..."],
  "apis": ["Endpoint Trigger: short description of action", "another..."]
}`;
            
            const config: any = {
                responseMimeType: 'application/json'
            };

            if (searchQuery) {
                config.tools = [{ googleSearch: {} }];
            }

            const result = await withRetry(() => ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: [{ parts: [{ text: prompt }], role: 'user' }],
                config
            })) as GenerateContentResponse;

            const parsed = JSON.parse(result.text || '{}');
            return parsed;
        } catch (e) {
            console.error("Error generating tailored recommendations:", e);
            return { components: [], integrations: [], apis: [] };
        }
    }, [getAiClient]);

    const generateIdeaSuggestions = useCallback(async (ideaInput: string, techStack?: string) => {
        try {
            const ai = getAiClient();
            let prompt = `You are an elite Product Strategist & Tech Lead. Sourced from the user's concept idea or input: "${ideaInput}".\n\n`;
            
            if (techStack) {
                prompt += `THE ACTIVE TECH STACK & LOCAL ENVIRONMENT:\nThe project operates in the following tech environment: "${techStack}". Recommendations must fully align with this.\n\n`;
            }
            
            prompt += `Search the live web with Google Search Grounding to find relevant current trends, competitor services, best-practice packages, API integration schemes, or workflows related to this concept.
Suggest:
1. Three modern, validated SaaS/product concepts or extensions based on the input that are highly feasible and valuable.
2. A list of 4 highly recommended tech stack dependencies or local packages (e.g., matching the user's stack) that should be used, with a brief explanation of why.
3. Three custom integration pathways or workflows using automation platforms (Notion databases, n8n webhook routes, Make.com triggers, Wix Velo widgets, ChatGPT API agents, Vertex AI models, Tally Forms automation) that would amplify the product's capability.

Return ONLY a JSON object with this exact structure:
{
  "concepts": [
    { "title": "Concept Name", "desc": "Grounded concept explanation, citing modern trends if applicable.", "advantages": "Why it's a solid solution." }
  ],
  "dependencies": [
    { "name": "npm-or-sdk-package-name", "reason": "Why it is needed and how it adds magic." }
  ],
  "integrations": [
    { "tool": "Notion | n8n | Make | Wix | ChatGPT | Vertex AI | Tally", "route": "How it is set up", "outcome": "What value it brings." }
  ]
}`;

            const config: any = {
                responseMimeType: 'application/json',
                tools: [{ googleSearch: {} }]
            };

            const result = await withRetry(() => ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: [{ parts: [{ text: prompt }], role: 'user' }],
                config
            })) as GenerateContentResponse;

            const parsed = JSON.parse(result.text || '{}');
            return parsed;
        } catch (e) {
            console.error("Error generating idea suggestions:", e);
            return { concepts: [], dependencies: [], integrations: [] };
        }
    }, [getAiClient]);

    const suggestComponents = useCallback(async (currentPrompt: string) => {
        try {
            const ai = getAiClient();

            const prompt = `
Based on the user's current UI design request: "${currentPrompt}", suggest 4 relevant UI components that would complement this design.
For each component, provide:
1. A short name (e.g., "Line Chart").
2. A single emoji icon that represents it.
3. A specific prompt to generate that component (e.g., "Create a modern line chart with interactive tooltips").

Return ONLY a JSON array of objects with the following structure:
[
  {
    "name": "...",
    "icon": "...",
    "prompt": "..."
  }
]
            `.trim();
            
            const result = await withRetry(() => ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: [{ parts: [{ text: prompt }], role: 'user' }],
                config: { responseMimeType: 'application/json' }
            })) as GenerateContentResponse;

            const suggestions = JSON.parse(result.text || '[]');
            return suggestions as SuggestedComponent[];
        } catch (e) {
            console.error("Error suggesting components:", e);
            return [];
        }
    }, []);

    const reviseArtifact = useCallback(async (sessionId: string, artifactId: string, instruction: string, attachments: Attachment[] = [], contextUrl?: string) => {
        const session = sessions.find(s => s.id === sessionId);
        const artifact = session?.artifacts.find(a => a.id === artifactId);
        if (!session || !artifact) return;

        setIsLoading(true);

        const user = auth.currentUser;

        // Update status to streaming/processing
        setSessions(prev => {
            const updated = prev.map(s => s.id === sessionId ? {
                ...s,
                artifacts: s.artifacts.map(a => a.id === artifactId ? { ...a, status: 'streaming' as const } : a)
            } : s);

            if (user) {
                const matched = updated.find(x => x.id === sessionId);
                if (matched) {
                    saveSessionDoc(user.uid, sessionId, matched)
                        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/sessions/${sessionId}`));
                }
            }
            return updated;
        });

        try {
            let fetchedContext = '';
            if (contextUrl) {
                try {
                    const response = await fetch('/api/proxy/fetch-url', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: contextUrl })
                    });
                    const data = await response.json();
                    if (data.content) {
                        fetchedContext = data.content;
                    }
                } catch (e) {
                    console.error("Failed to fetch context URL:", e);
                }
            }

            const ai = getAiClient();
            const prompt = `
You are revising an existing UI component.

BASE CODE:
\`\`\`html
${artifact.html}
\`\`\`

USER INSTRUCTION: "${instruction || (contextUrl ? `Update the component using the reference site at ${contextUrl} as inspiration` : 'See attached files for revision details')}"

${fetchedContext ? `REFERENCE SITE CONTENT:
${fetchedContext}
` : ''}

ATTACHED CONTEXT FILES:
${attachments.length > 0 ? `The user has provided ${attachments.length} additional files to guide this revision. 
Analyze these files (images, documents, or code) and apply the requested changes to the BASE CODE while maintaining visual and functional consistency.` : 'No additional files provided.'}

STRICT REQUIREMENTS:
- Return ONLY raw updated HTML/CSS. 
- No Markdown, no explanations, no chat commentary.
`.trim();

            const parts: any[] = [{ text: prompt }];
            attachments.forEach(att => {
                if (shouldSendAsText(att.mimeType, att.name)) {
                    parts.push({
                        text: `=== FILE ATTACHMENT: ${att.name} (${att.mimeType}) ===\n${decodeBase64ToText(att.data)}\n=== END FILE ATTACHMENT ===`
                    });
                } else {
                    parts.push({
                        inlineData: {
                            mimeType: att.mimeType,
                            data: att.data
                        }
                    });
                }
            });

            const responseStream = await withRetry(() => ai.models.generateContentStream({
                model: 'gemini-3.5-flash',
                contents: [{ parts, role: 'user' }],
            })) as any;

            let accumulatedHtml = '';
            for await (const chunk of responseStream) {
                accumulatedHtml += chunk.text || '';
                setSessions(prev => prev.map(sess => sess.id === sessionId ? {
                    ...sess,
                    artifacts: sess.artifacts.map(art => art.id === artifactId ? { ...art, html: cleanHtmlString(accumulatedHtml) } : art)
                } : sess));
            }

            const finalHtml = cleanHtmlString(accumulatedHtml);
            setSessions(prev => {
                const updated = prev.map(sess => sess.id === sessionId ? {
                    ...sess,
                    artifacts: sess.artifacts.map(art => art.id === artifactId ? { ...art, html: finalHtml, status: 'complete' as const } : art)
                } : sess);

                if (user) {
                    const matched = updated.find(x => x.id === sessionId);
                    if (matched) {
                        saveSessionDoc(user.uid, sessionId, matched)
                            .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/sessions/${sessionId}`));
                    }
                }
                return updated;
            });

        } catch (e) {
            console.error("Revision failed:", e);
            setSessions(prev => {
                const updated = prev.map(sess => sess.id === sessionId ? {
                    ...sess,
                    artifacts: sess.artifacts.map(art => art.id === artifactId ? { ...art, status: 'error' as const } : art)
                } : sess);

                if (user) {
                    const matched = updated.find(x => x.id === sessionId);
                    if (matched) {
                        saveSessionDoc(user.uid, sessionId, matched)
                            .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/sessions/${sessionId}`));
                    }
                }
                return updated;
            });
        } finally {
            setIsLoading(false);
        }
    }, [getAiClient, sessions]);

    return {
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
        generateTailoredRecommendations,
        generateIdeaSuggestions
    };
}
