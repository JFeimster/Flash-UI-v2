import { useState, useEffect, useCallback } from 'react';

export interface McpRequest {
    id: string;
    prompt: string;
    context?: string;
    timestamp: number;
    source: string;
}

export function useMcp(onIncomingRequest?: (request: McpRequest) => void) {
    const [history, setHistory] = useState<any[]>([]);

    const fetchHistory = useCallback(async () => {
        try {
            const response = await fetch('/api/mcp/history');
            if (response.ok) {
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    setHistory(data);
                } catch (e) {
                    console.error("MCP History Fetch Error: Invalid JSON:", text.substring(0, 100));
                }
            }
        } catch (error) {
            console.error("MCP History Fetch Error:", error);
        }
    }, []);

    useEffect(() => {
        const pollRequests = async () => {
            try {
                const response = await fetch('/api/mcp/pending');
                if (!response.ok) return;
                const text = await response.text();
                let data: McpRequest[] = [];
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error("MCP Pending Fetch Error: Invalid JSON:", text.substring(0, 100));
                    return;
                }
                
                if (data.length > 0 && onIncomingRequest) {
                    onIncomingRequest(data[0]);
                }
            } catch (error) {
                // Silently fail to avoid console noise during server restarts
            }
        };

        const interval = setInterval(pollRequests, 3000);
        const historyInterval = setInterval(fetchHistory, 10000);
        fetchHistory(); // Initial fetch

        return () => {
            clearInterval(interval);
            clearInterval(historyInterval);
        };
    }, [onIncomingRequest, fetchHistory]);

    const clearPendingRequest = useCallback(async (id: string) => {
        try {
            await fetch('/api/mcp/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
        } catch (error) {
            console.error("MCP Clear Error:", error);
        }
    }, []);

    const deleteHistoryItem = useCallback(async (id: string) => {
        try {
            await fetch('/api/mcp/delete-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            fetchHistory();
        } catch (error) {
            console.error("MCP Delete Error:", error);
        }
    }, [fetchHistory]);

    return { clearPendingRequest, history, deleteHistoryItem, fetchHistory };
}
