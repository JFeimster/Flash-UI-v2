
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

    return (
        <div 
            className={`artifact-card ${isFocused ? 'focused' : ''} ${isBlurring ? 'generating' : ''}`}
            onClick={onClick}
        >
            <div className="artifact-header">
                <span className="artifact-style-tag">{artifact.styleName}</span>
            </div>
            
            <div className="artifact-card-inner">
                {isBlurring && (
                    <div className="generating-overlay">
                        <pre ref={codeRef} className="code-stream-preview">
                            {artifact.html}
                        </pre>
                    </div>
                )}
                
                <div className="iframe-container" style={{ width: previewWidth, margin: '0 auto', transition: 'width 0.3s ease' }}>
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
