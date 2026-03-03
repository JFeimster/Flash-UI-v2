
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { generateId, withRetry } from '../utils';
import { Session, Artifact, ComponentVariation, SuggestedComponent } from '../types';

const STORAGE_KEY = 'flash_ui_sessions_v1';

export const useGenAI = () => {
    // Initialize state from localStorage
    const [sessions, setSessions] = useState<Session[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Failed to load sessions from local storage', e);
            return [];
        }
    });

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [componentVariations, setComponentVariations] = useState<ComponentVariation[]>([]);

    // Persist sessions to localStorage with debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
            } catch (e) {
                console.warn('Failed to save sessions to local storage', e);
            }
        }, 1000); // Debounce save by 1s

        return () => clearTimeout(handler);
    }, [sessions]);

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
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API_KEY is not configured.");
            const ai = new GoogleGenAI({ apiKey });

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

    const sendMessage = useCallback(async (promptText: string) => {
        const trimmedInput = promptText.trim();
        if (!trimmedInput) return;

        setIsLoading(true);
        
        const baseTime = Date.now();
        const sessionId = generateId();

        const placeholderArtifacts: Artifact[] = Array(3).fill(null).map((_, i) => ({
            id: `${sessionId}_${i}`,
            styleName: 'Designing...',
            html: '',
            status: 'streaming',
        }));

        const newSession: Session = {
            id: sessionId,
            prompt: trimmedInput,
            timestamp: baseTime,
            artifacts: placeholderArtifacts
        };

        setSessions(prev => [...prev, newSession]);

        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API_KEY is not configured.");
            const ai = new GoogleGenAI({ apiKey });

            const stylePrompt = `Generate 3 distinct visual names for: "${trimmedInput}". Return ONLY a JSON array of strings. e.g. ["Cyber Grid", "Glass Echo", "Paper Grain"]. No trademarks.`;

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
                    const prompt = `Create a high-fidelity UI component for: "${trimmedInput}". Style: ${styleInstruction}. Return ONLY raw HTML/CSS. No Markdown.`;
                    
                    // Wrap stream connection with retry logic
                    const responseStream = await withRetry(() => ai.models.generateContentStream({
                        model: 'gemini-3-flash-preview',
                        contents: [{ parts: [{ text: prompt }], role: "user" }],
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

    const resetSessions = useCallback(() => {
        setSessions([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.warn('Failed to clear sessions from local storage', e);
        }
    }, []);

    const explainCode = useCallback(async (code: string) => {
        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API_KEY is not configured.");
            const ai = new GoogleGenAI({ apiKey });

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
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API_KEY is not configured.");
            const ai = new GoogleGenAI({ apiKey });

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

    const generateRecommendedPages = useCallback(async (sessionId: string, artifactId: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return [];
        
        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API_KEY is not configured.");
            const ai = new GoogleGenAI({ apiKey });

            const prompt = `
Analyze this UI component prompt: "${session.prompt}".
Suggest 5 complementary pages to build out a full application based on this component.
For each page, provide:
1. A title.
2. A detailed description of its purpose.
3. A suggested file structure (list of files).

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
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API_KEY is not configured.");
            const ai = new GoogleGenAI({ apiKey });

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
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API_KEY is not configured.");
            const ai = new GoogleGenAI({ apiKey });

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

    return {
        sessions,
        isLoading,
        componentVariations,
        sendMessage,
        generateVariations,
        updateSessionArtifact,
        setComponentVariations,
        resetSessions,
        toggleFavorite,
        explainCode,
        refactorCode,
        generateRecommendedPages,
        applyAnimation,
        suggestComponents
    };
}
