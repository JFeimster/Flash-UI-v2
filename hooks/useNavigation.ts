
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useEffect, useCallback } from 'react';
import { Session } from '../types';

export function useNavigation(sessions: Session[]) {
    const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(() => {
        const savedId = localStorage.getItem('flash_ui_active_session_id');
        if (savedId && sessions.length > 0) {
            const idx = sessions.findIndex(s => s.id === savedId);
            if (idx !== -1) return idx;
        }
        return -1;
    });

    const [focusedArtifactIndex, setFocusedArtifactIndex] = useState<number | null>(() => {
        const savedFocus = localStorage.getItem('flash_ui_focused_artifact_index');
        return savedFocus !== null ? parseInt(savedFocus, 10) : null;
    });

    // Sync session index when sessions load or are updated
    useEffect(() => {
        if (sessions.length === 0) {
            setCurrentSessionIndex(-1);
            return;
        }

        const savedId = localStorage.getItem('flash_ui_active_session_id');
        if (savedId) {
            const idx = sessions.findIndex(s => s.id === savedId);
            if (idx !== -1) {
                setCurrentSessionIndex(idx);
                return;
            }
        }

        if (currentSessionIndex === -1) {
            setCurrentSessionIndex(0);
        } else if (sessions.length > currentSessionIndex + 1) {
            setCurrentSessionIndex(sessions.length - 1);
        }
    }, [sessions]);

    // Persist current session selection to localStorage
    useEffect(() => {
        if (currentSessionIndex >= 0 && currentSessionIndex < sessions.length) {
            const currentSess = sessions[currentSessionIndex];
            if (currentSess) {
                localStorage.setItem('flash_ui_active_session_id', currentSess.id);
            }
        }
    }, [currentSessionIndex, sessions]);

    // Persist focused artifact index to localStorage
    useEffect(() => {
        if (focusedArtifactIndex !== null) {
            localStorage.setItem('flash_ui_focused_artifact_index', focusedArtifactIndex.toString());
        } else {
            localStorage.removeItem('flash_ui_focused_artifact_index');
        }
    }, [focusedArtifactIndex]);

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
