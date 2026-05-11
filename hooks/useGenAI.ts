
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { generateId, withRetry } from '../utils';
import { Session, Artifact, ComponentVariation, SuggestedComponent, Attachment } from '../types';

const STORAGE_KEY = 'flash_ui_sessions_v1';
const SAVED_KEY = 'flash_ui_saved_v1';
const API_KEY_STORAGE_KEY = 'flash_ui_user_api_key';

export const useGenAI = () => {
    // Initialize state from localStorage
    const [userApiKey, setUserApiKey] = useState<string>(() => {
        try {
            return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
        } catch {
            return '';
        }
    });

    const [sessions, setSessions] = useState<Session[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Failed to load sessions from local storage', e);
            return [];
        }
    });

    const [savedArtifacts, setSavedArtifacts] = useState<Artifact[]>(() => {
        try {
            const saved = localStorage.getItem(SAVED_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Failed to load saved artifacts from local storage', e);
            return [];
        }
    });

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [componentVariations, setComponentVariations] = useState<ComponentVariation[]>([]);

    const [apiKeyStatus, setApiKeyStatus] = useState<{
        isValid: boolean | null;
        error: string | null;
        quotaInfo?: string;
    }>({ isValid: null, error: null });

    // Persist to localStorage with debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
                localStorage.setItem(SAVED_KEY, JSON.stringify(savedArtifacts));
                if (userApiKey) {
                    localStorage.setItem(API_KEY_STORAGE_KEY, userApiKey);
                } else {
                    localStorage.removeItem(API_KEY_STORAGE_KEY);
                }
            } catch (e) {
                console.warn('Failed to save state to local storage', e);
            }
        }, 1000);

        return () => clearTimeout(handler);
    }, [sessions, savedArtifacts, userApiKey]);

    const validateApiKey = useCallback(async (key: string) => {
        if (!key) {
            setApiKeyStatus({ isValid: false, error: 'API Key is required.' });
            return false;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: key });
            
            // Simple validation call using the SDK's existing pattern
            const result = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
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
                model: 'gemini-3-flash-preview',
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
            status: 'streaming',
        }));

        const newSession: Session = {
            id: sessionId,
            prompt: trimmedInput || (contextUrl ? `UI based on ${contextUrl}` : (attachments.length > 0 ? `Generate UI using ${attachments.length} attachment(s)` : "")),
            timestamp: baseTime,
            artifacts: placeholderArtifacts,
            attachments: attachments,
            contextUrl: contextUrl
        };

        setSessions(prev => [...prev, newSession]);

        try {
            const ai = getAiClient();

            const stylePrompt = `Based on this request: "${trimmedInput || 'UI from attachments'}", suggest 3 distinct visual names/styles. Return ONLY a JSON array of strings. e.g. ["Cyber Grid", "Glass Echo", "Paper Grain"]. No trademarks.`;

            // Wrap style generation with retry logic
            const styleResponse = await withRetry(() => ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: { role: 'user', parts: [{ text: stylePrompt }] }
            })) as GenerateContentResponse;

            let generatedStyles: string[] = ["Dynamic Edge", "Core Flow", "Prism Logic"];
            try {
                const match = styleResponse.text?.match(/\[.*\]/);
                if (match) generatedStyles = JSON.parse(match[0]);
            } catch (e) {}

            setSessions(prev => prev.map(s => s.id === sessionId ? {
                ...s,
                artifacts: s.artifacts.map((art, i) => ({...art, styleName: generatedStyles[i] || art.styleName}))
            } : s));

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
                    
                    // Add all attachments as inlineData parts
                    attachments.forEach(att => {
                        parts.push({
                            inlineData: {
                                mimeType: att.mimeType,
                                data: att.data
                            }
                        });
                    });

                    // Wrap stream connection with retry logic
                    const responseStream = await withRetry(() => ai.models.generateContentStream({
                        model: 'gemini-3-flash-preview',
                        contents: [{ parts, role: 'user' }],
                    })) as any;

                    let accumulatedHtml = '';
                    for await (const chunk of responseStream) {
                        accumulatedHtml += chunk.text || '';
                        setSessions(prev => prev.map(sess => sess.id === sessionId ? {
                            ...sess,
                            artifacts: sess.artifacts.map(art => art.id === artifact.id ? { ...art, html: accumulatedHtml } : art)
                        } : sess));
                    }

                    setSessions(prev => prev.map(sess => sess.id === sessionId ? {
                        ...sess,
                        artifacts: sess.artifacts.map(art => art.id === artifact.id ? { ...art, status: 'complete' } : art)
                    } : sess));
                } catch (e) {
                    console.error(`Artifact generation failed for ${artifact.id}:`, e);
                    setSessions(prev => prev.map(sess => sess.id === sessionId ? {
                        ...sess,
                        artifacts: sess.artifacts.map(art => art.id === artifact.id ? { ...art, status: 'error' } : art)
                    } : sess));
                }
            };

            await Promise.all(placeholderArtifacts.map((art, i) => generateArtifact(art, generatedStyles[i])));

        } catch (e) {
            console.error("Session generation failed:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateSessionArtifact = (sessionIndex: number, artifactIndex: number, html: string) => {
         setSessions(prev => prev.map((sess, i) => 
            i === sessionIndex ? {
                ...sess,
                artifacts: sess.artifacts.map((art, j) => 
                  j === artifactIndex ? { ...art, html, status: 'complete' } : art
                )
            } : sess
        ));
    };

    const updateSessionArtifactFiles = (sessionId: string, artifactId: string, files: Record<string, string>) => {
        setSessions(prev => prev.map(sess => 
            sess.id === sessionId ? {
                ...sess,
                artifacts: sess.artifacts.map(art => 
                    art.id === artifactId ? { 
                        ...art, 
                        additionalFiles: { ...(art.additionalFiles || {}), ...files } 
                    } : art
                )
            } : sess
        ));
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
                model: 'gemini-3-flash-preview',
                contents: [{ parts: [{ text: prompt }], role: 'user' }],
            })) as GenerateContentResponse;

            return result.text;
        } catch (e) {
            console.error("Error generating additional file:", e);
            return "";
        }
    }, []);

    const toggleFavorite = useCallback((sessionId: string, artifactId: string) => {
        setSessions(prev => prev.map(s => 
            s.id === sessionId ? {
                ...s,
                artifacts: s.artifacts.map(a => 
                    a.id === artifactId ? { ...a, isFavorite: !a.isFavorite } : a
                )
            } : s
        ));
    }, []);

    const toggleSave = useCallback((sessionId: string, artifactId: string) => {
        const session = sessions.find(s => s.id === sessionId);
        const artifact = session?.artifacts.find(a => a.id === artifactId);
        
        if (!artifact) return;

        setSessions(prev => prev.map(s => 
            s.id === sessionId ? {
                ...s,
                artifacts: s.artifacts.map(a => 
                    a.id === artifactId ? { ...a, isSaved: !a.isSaved } : a
                )
            } : s
        ));

        setSavedArtifacts(prev => {
            const exists = prev.find(a => a.id === artifactId);
            if (exists) {
                return prev.filter(a => a.id !== artifactId);
            } else {
                return [...prev, { ...artifact, isSaved: true }];
            }
        });
    }, [sessions]);

    const removeSaved = useCallback((artifactId: string) => {
        setSavedArtifacts(prev => prev.filter(a => a.id !== artifactId));
        setSessions(prev => prev.map(s => ({
            ...s,
            artifacts: s.artifacts.map(a => 
                a.id === artifactId ? { ...a, isSaved: false } : a
            )
        })));
    }, []);

    const resetSessions = useCallback(() => {
        setSessions([]);
        setIsLoading(false);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.warn('Failed to clear sessions from local storage', e);
        }
    }, []);

    const explainCode = useCallback(async (code: string) => {
        try {
            const ai = getAiClient();

            const prompt = `Explain the following code snippet in a concise and clear way. Focus on the main functionality and key design choices:\n\n\`\`\`html\n${code}\n\`\`\``;
            
            const result = await withRetry(() => ai.models.generateContent({
                model: 'gemini-3-flash-preview',
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
                model: 'gemini-3-flash-preview',
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
                model: 'gemini-3-flash-preview',
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
                model: 'gemini-3-flash-preview',
                contents: [{ parts: [{ text: prompt }], role: 'user' }],
            })) as GenerateContentResponse;

            return result.text;
        } catch (e) {
            console.error("Error applying animation:", e);
            return code;
        }
    }, []);

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
                model: 'gemini-3-flash-preview',
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

        // Update status to streaming/processing
        setSessions(prev => prev.map(s => s.id === sessionId ? {
            ...s,
            artifacts: s.artifacts.map(a => a.id === artifactId ? { ...a, status: 'streaming' } : a)
        } : s));

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
                parts.push({
                    inlineData: {
                        mimeType: att.mimeType,
                        data: att.data
                    }
                });
            });

            const responseStream = await withRetry(() => ai.models.generateContentStream({
                model: 'gemini-3-flash-preview',
                contents: [{ parts, role: 'user' }],
            })) as any;

            let accumulatedHtml = '';
            for await (const chunk of responseStream) {
                accumulatedHtml += chunk.text || '';
                setSessions(prev => prev.map(sess => sess.id === sessionId ? {
                    ...sess,
                    artifacts: sess.artifacts.map(art => art.id === artifactId ? { ...art, html: accumulatedHtml } : art)
                } : sess));
            }

            setSessions(prev => prev.map(sess => sess.id === sessionId ? {
                ...sess,
                artifacts: sess.artifacts.map(art => art.id === artifactId ? { ...art, status: 'complete' } : art)
            } : sess));

        } catch (e) {
            console.error("Revision failed:", e);
            setSessions(prev => prev.map(sess => sess.id === sessionId ? {
                ...sess,
                artifacts: sess.artifacts.map(art => art.id === artifactId ? { ...art, status: 'error' } : art)
            } : sess));
        } finally {
            setIsLoading(false);
        }
    }, [getAiClient, sessions]);

    return {
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
        generateAdditionalFile
    };
}
