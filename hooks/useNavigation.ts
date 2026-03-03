
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useEffect, useCallback } from 'react';
import { Session } from '../types';

export function useNavigation(sessions: Session[]) {
    const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(-1);
    const [focusedArtifactIndex, setFocusedArtifactIndex] = useState<number | null>(null);

    // Sync session index when new sessions are added
    useEffect(() => {
        if (sessions.length > 0 && currentSessionIndex === -1) {
            setCurrentSessionIndex(0);
        } else if (sessions.length > currentSessionIndex + 1) {
            setCurrentSessionIndex(sessions.length - 1);
        }
    }, [sessions.length]);

    const nextItem = useCallback(() => {
        if (focusedArtifactIndex !== null) {
            if (focusedArtifactIndex < 2) setFocusedArtifactIndex(focusedArtifactIndex + 1);
        } else {
            if (currentSessionIndex < sessions.length - 1) setCurrentSessionIndex(currentSessionIndex + 1);
        }
    }, [currentSessionIndex, sessions.length, focusedArtifactIndex]);

    const prevItem = useCallback(() => {
        if (focusedArtifactIndex !== null) {
            if (focusedArtifactIndex > 0) setFocusedArtifactIndex(focusedArtifactIndex - 1);
        } else {
            if (currentSessionIndex > 0) setCurrentSessionIndex(currentSessionIndex - 1);
        }
    }, [currentSessionIndex, focusedArtifactIndex]);

    const currentSession = sessions[currentSessionIndex];
    
    let canGoBack = false;
    let canGoForward = false;

    if (sessions.length > 0) {
        if (focusedArtifactIndex !== null) {
            canGoBack = focusedArtifactIndex > 0;
            canGoForward = focusedArtifactIndex < (currentSession?.artifacts.length || 0) - 1;
        } else {
            canGoBack = currentSessionIndex > 0;
            canGoForward = currentSessionIndex < sessions.length - 1;
        }
    }

    return {
        currentSessionIndex,
        setCurrentSessionIndex,
        focusedArtifactIndex,
        setFocusedArtifactIndex,
        currentSession,
        nextItem,
        prevItem,
        canGoBack,
        canGoForward
    };
}
