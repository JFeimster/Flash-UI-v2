
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { Artifact } from '../types';
import { StarIcon, StarFilledIcon, SmartphoneIcon, TabletIcon, MonitorIcon } from './Icons';

interface ArtifactCardProps {
    artifact: Artifact;
    isFocused: boolean;
    onClick: () => void;
}

const ArtifactCard = React.memo(({ 
    artifact, 
    isFocused, 
    onClick
}: ArtifactCardProps) => {
    const codeRef = useRef<HTMLPreElement>(null);
    const [previewWidth, setPreviewWidth] = useState<'100%' | '768px' | '375px'>('100%');

    // Auto-scroll logic for this specific card
    useEffect(() => {
        if (codeRef.current) {
            codeRef.current.scrollTop = codeRef.current.scrollHeight;
        }
    }, [artifact.html]);

    // Reset width when focus changes
    useEffect(() => {
        if (!isFocused) setPreviewWidth('100%');
    }, [isFocused]);

    const isBlurring = artifact.status === 'streaming';
    const isError = artifact.status === 'error';

    return (
        <div 
            className={`artifact-card ${isFocused ? 'focused' : ''} ${isBlurring ? 'generating' : ''} ${isError ? 'errored' : ''}`}
            onClick={onClick}
        >
            <div className="artifact-header">
                <span className={`artifact-style-tag ${isError ? 'bg-red-500/20 text-red-400 border-red-500/30' : ''}`}>
                    {isError ? 'Generation Alert' : artifact.styleName}
                </span>
            </div>
            
            <div className="artifact-card-inner relative overflow-hidden">
                {isBlurring && (
                    <div className="generating-overlay">
                        <pre ref={codeRef} className="code-stream-preview">
                            {artifact.html}
                        </pre>
                    </div>
                )}

                {isError && (
                    <div className="absolute inset-0 bg-[#09090b]/95 flex flex-col items-center justify-center p-6 text-center z-20 backdrop-blur-sm border border-red-500/20 rounded-lg">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500 text-2xl font-bold animate-pulse">
                            ⚠️
                        </div>
                        <h4 className="text-sm font-semibold text-white mb-2 uppercase tracking-wider">
                            API Quota or Limit Blocked
                        </h4>
                        <p className="text-xs text-stone-400 max-w-[280px] leading-relaxed mb-4">
                            The development key has encountered a Billing limit (Dunning Decision Denied). To continue seamlessly:
                        </p>
                        <div className="text-[10px] bg-white/[0.03] border border-white/5 rounded px-3 py-2 text-stone-300 font-mono text-left max-w-[320px] mb-3">
                            🔑 Click the <strong className="text-indigo-400">Settings Icon</strong> or <strong className="text-pink-400">AI Tools</strong> panel in the top-right toolbar and configure your own custom Google Gemini API Key.
                        </div>
                    </div>
                )}
                
                <div className="iframe-container" style={{ width: previewWidth, margin: '0 auto', transition: 'width 0.3s ease', display: isError ? 'none' : 'block' }}>
                    <iframe 
                        srcDoc={artifact.html} 
                        title={artifact.id} 
                        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
                        className="artifact-iframe"
                    />
                </div>

                {isFocused && (
                    <div className="responsive-controls" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className={`responsive-btn ${previewWidth === '375px' ? 'active' : ''}`}
                            onClick={() => setPreviewWidth('375px')}
                            title="Mobile View"
                        >
                            <SmartphoneIcon />
                        </button>
                        <button 
                            className={`responsive-btn ${previewWidth === '768px' ? 'active' : ''}`}
                            onClick={() => setPreviewWidth('768px')}
                            title="Tablet View"
                        >
                            <TabletIcon />
                        </button>
                        <button 
                            className={`responsive-btn ${previewWidth === '100%' ? 'active' : ''}`}
                            onClick={() => setPreviewWidth('100%')}
                            title="Desktop View"
                        >
                            <MonitorIcon />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

export default ArtifactCard;
