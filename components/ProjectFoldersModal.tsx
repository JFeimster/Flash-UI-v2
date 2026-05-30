import React, { useState } from 'react';
import { 
    X, FolderPlus, Trash2, Edit3, FolderKanban, 
    Plus, Copy, Eye, FileCode, Check, FolderOpen,
    Download, Tag, Filter
} from 'lucide-react';
import { Folder, Session } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ProjectFoldersModalProps {
    isOpen: boolean;
    onClose: () => void;
    folders: Folder[];
    sessions: Session[];
    createFolder: (name: string) => Promise<string>;
    deleteFolder: (folderId: string) => void;
    renameFolder: (folderId: string, name: string) => void;
    moveArtifactToFolder: (sessionId: string, artifactId: string, folderId: string) => void;
    removeArtifactFromFolder: (folderId: string, sessionId: string, artifactId: string) => void;
    updateArtifactTags: (folderId: string, sessionId: string, artifactId: string, tags: string[]) => void;
    updateFolderTags: (folderId: string, tags: string[]) => void;
    onViewArtifact: (html: string, styleName: string) => void;
}

const SUGGESTED_TAGS = ['Client', 'Style', 'Internal', 'Production', 'Draft', 'Feedback'];

export default function ProjectFoldersModal({
    isOpen,
    onClose,
    folders,
    sessions,
    createFolder,
    deleteFolder,
    renameFolder,
    moveArtifactToFolder,
    removeArtifactFromFolder,
    updateArtifactTags,
    updateFolderTags,
    onViewArtifact
}: ProjectFoldersModalProps) {
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
        folders.length > 0 ? folders[0].id : null
    );
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // List of all artifacts in sessions that are NOT already in the active folder
    const [selectedSourceSessionId, setSelectedSourceSessionId] = useState('');
    const [selectedSourceArtifactId, setSelectedSourceArtifactId] = useState('');

    // Tags States
    const [activeTagEditorId, setActiveTagEditorId] = useState<string | null>(null);
    const [customTagInputs, setCustomTagInputs] = useState<Record<string, string>>({});
    const [newFolderTag, setNewFolderTag] = useState('');
    const [filterTag, setFilterTag] = useState<string | null>(null);
    const [isExportingZip, setIsExportingZip] = useState(false);

    if (!isOpen) return null;

    const activeFolder = folders.find(f => f.id === (selectedFolderId || (folders[0]?.id)));

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        const id = await createFolder(newFolderName.trim());
        setNewFolderName('');
        setSelectedFolderId(id);
    };

    const handleStartRename = (folder: Folder) => {
        setEditingFolderId(folder.id);
        setEditingName(folder.name);
    };

    const handleSaveRename = (folderId: string) => {
        if (!editingName.trim()) return;
        renameFolder(folderId, editingName.trim());
        setEditingFolderId(null);
    };

    const handleCopy = (id: string, html: string) => {
        navigator.clipboard.writeText(html);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const availableArtifacts = sessions.flatMap(s => 
        (s.artifacts || []).map(a => ({
            sessionId: s.id,
            sessionPrompt: s.prompt,
            artifactId: a.id,
            styleName: a.styleName,
            html: a.html
        }))
    );

    const handleAddArtifactToActiveFolder = () => {
        if (!activeFolder || !selectedSourceSessionId || !selectedSourceArtifactId) return;
        moveArtifactToFolder(selectedSourceSessionId, selectedSourceArtifactId, activeFolder.id);
        setSelectedSourceArtifactId('');
    };

    // Synchronized project downlader ZIP
    const handleDownloadFolderZip = async () => {
        if (!activeFolder || !activeFolder.artifactRefs || activeFolder.artifactRefs.length === 0) return;
        
        setIsExportingZip(true);
        try {
            const zip = new JSZip();
            // Generate clean root folder in zip
            const cleanFolderName = activeFolder.name.trim().replace(/\s+/g, '_').toLowerCase();
            const rootFolder = zip.folder(cleanFolderName);
            
            // Loop and add all artifacts
            activeFolder.artifactRefs.forEach(ref => {
                const safeStyleName = ref.styleName.trim().replace(/\s+/g, '_').toLowerCase();
                const artifactDirName = `${safeStyleName || 'style'}_${ref.artifactId.substring(0, 5)}`;
                const artifactFolder = rootFolder?.folder(artifactDirName);
                
                // Add main HTML file
                artifactFolder?.file('index.html', ref.html);
                
                // Resolve matching session & artifact from parent sessions list
                const matchedSession = sessions.find(s => s.id === ref.sessionId);
                const matchedArtifact = matchedSession?.artifacts?.find(a => a.id === ref.artifactId);
                const additionalFiles = matchedArtifact?.additionalFiles || {};
                
                // Package additional dynamic files
                Object.entries(additionalFiles).forEach(([filePath, content]) => {
                    artifactFolder?.file(filePath, content as string);
                });
            });
            
            const blob = await zip.generateAsync({ type: 'blob' });
            saveAs(blob, `${cleanFolderName}_project.zip`);
        } catch (error) {
            console.error('Error generating folder ZIP:', error);
            alert('Failed to generate project ZIP. Please try again.');
        } finally {
            setIsExportingZip(false);
        }
    };

    // Filtered Refs
    const filteredRefs = activeFolder?.artifactRefs?.filter(ref => {
        if (!filterTag) return true;
        return (ref.tags || []).includes(filterTag);
    }) || [];

    // All Unique Tags in Active Folder
    const allUniqueTags = Array.from(new Set(
        (activeFolder?.artifactRefs || []).flatMap(ref => ref.tags || [])
    ));

    return (
        <div className="fixed inset-0 z-[50000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-5xl h-[85vh] flex flex-col bg-[#0b0c10] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0e1017]">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                            <FolderKanban className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-white tracking-wide uppercase font-sans">Project Organizer</h2>
                            <p className="text-[10px] text-stone-400 font-mono">Create collections, manage tag labels & sync codebase modules</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1 px-3 text-stone-400 hover:text-white rounded-md hover:bg-white/5 transition-all outline-none font-mono text-[10px] uppercase cursor-pointer border border-white/5"
                    >
                        Close [ESC]
                    </button>
                </div>

                {/* Body Split */}
                <div className="flex-1 flex overflow-hidden">
                    
                    {/* Left Column: Folders Manager */}
                    <div className="w-80 border-r border-white/10 bg-[#07080c] flex flex-col p-4 overflow-y-auto">
                        <h3 className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-2 font-mono">My Folders</h3>
                        
                        {/* Create Folder Form */}
                        <form onSubmit={handleCreateFolder} className="flex gap-2 mb-4">
                            <input 
                                type="text"
                                placeholder="Folder Name..."
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="flex-1 px-3 py-1.5 text-xs text-white bg-white/5 border border-white/10 rounded-md placeholder-stone-500 focus:outline-none focus:border-indigo-500/50 transition-all font-sans"
                            />
                            <button 
                                type="submit" 
                                className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-all cursor-pointer flex items-center justify-center"
                                title="Create Folder"
                            >
                                <FolderPlus className="w-4 h-4" />
                            </button>
                        </form>

                        {/* Folders List */}
                        <div className="flex-1 space-y-1.5">
                            {folders.length === 0 ? (
                                <div className="text-center py-8 text-stone-500 font-mono text-[10px]">
                                    No folders found.<br/>Create one above to begin.
                                </div>
                            ) : (
                                folders.map(folder => {
                                    const isActive = activeFolder?.id === folder.id;
                                    const isEditing = editingFolderId === folder.id;

                                    return (
                                        <div 
                                            key={folder.id}
                                            onClick={() => !isEditing && setSelectedFolderId(folder.id)}
                                            className={`group relative flex flex-col p-3 rounded-lg border transition-all cursor-pointer ${
                                                isActive 
                                                    ? 'bg-gradient-to-r from-indigo-950/30 to-slate-900/40 border-indigo-500/30 text-white shadow-md' 
                                                    : 'bg-white/[0.02] border-white/5 text-stone-400 hover:text-stone-200 hover:border-white/10'
                                            }`}
                                        >
                                            {isEditing ? (
                                                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                                    <input 
                                                        type="text"
                                                        value={editingName}
                                                        onChange={(e) => setEditingName(e.target.value)}
                                                        className="flex-1 px-2 py-0.5 text-xs text-white bg-black/40 border border-white/10 rounded focus:outline-none font-sans"
                                                        autoFocus
                                                    />
                                                    <button 
                                                        onClick={() => handleSaveRename(folder.id)}
                                                        className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded cursor-pointer"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 max-w-[80%]">
                                                        <FolderOpen className={`w-3.5 h-3.5 flex-none ${isActive ? 'text-indigo-400' : 'text-stone-500'}`} />
                                                        <span className="text-xs font-semibold truncate font-sans">{folder.name}</span>
                                                    </div>
                                                    
                                                    {/* Actions */}
                                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStartRename(folder);
                                                            }}
                                                            className="p-1 text-stone-400 hover:text-white rounded hover:bg-white/5 cursor-pointer"
                                                            title="Rename Folder"
                                                        >
                                                            <Edit3 className="w-3 h-3" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm("Are you sure you want to delete this folder? Grouped items references will be removed.")) {
                                                                    deleteFolder(folder.id);
                                                                    if (selectedFolderId === folder.id) {
                                                                        setSelectedFolderId(null);
                                                                    }
                                                                }
                                                            }}
                                                            className="p-1 text-stone-500 hover:text-red-400 rounded hover:bg-white/5 cursor-pointer"
                                                            title="Delete Folder"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Folder Tags indicator */}
                                            {folder.tags && folder.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1.5 select-none pointer-events-none">
                                                    {folder.tags.map(t => (
                                                        <span key={t} className="px-1 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded font-mono text-[80%]" style={{ fontSize: '8px' }}>
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-2 flex items-center justify-between font-mono text-[9px] text-stone-500 select-none">
                                                <span>Items: {folder.artifactRefs?.length || 0}</span>
                                                <span>{new Date(folder.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Column: Folder Contents Drawer */}
                    <div className="flex-1 bg-[#090a0f] flex flex-col p-5 overflow-y-auto">
                        {activeFolder ? (
                            <>
                                <div className="border-b border-white/5 pb-3 mb-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-semibold text-white font-sans">{activeFolder.name}</h3>
                                            
                                            {/* Folder ZIP Downloader Button */}
                                            {activeFolder.artifactRefs && activeFolder.artifactRefs.length > 0 && (
                                                <button
                                                    onClick={handleDownloadFolderZip}
                                                    disabled={isExportingZip}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 text-white text-[9px] font-bold font-mono uppercase tracking-wide rounded hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-indigo-950/40"
                                                    title="Download Folder ZIP synchronized with all additional files"
                                                >
                                                    {isExportingZip ? (
                                                        <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                    ) : (
                                                        <Download className="w-3 h-3" />
                                                    )}
                                                    <span>{isExportingZip ? 'Packaging...' : 'Download ZIP'}</span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Folder own tags management */}
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                            <span className="text-[8px] text-stone-500 font-mono uppercase tracking-wider select-none font-bold mr-0.5">Folder Tags:</span>
                                            {(activeFolder.tags || []).map(t => (
                                                <span key={t} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-mono text-indigo-300">
                                                    <span>{t}</span>
                                                    <button 
                                                        onClick={() => {
                                                            const newTags = (activeFolder.tags || []).filter(tag => tag !== t);
                                                            updateFolderTags(activeFolder.id, newTags);
                                                        }}
                                                        className="hover:text-red-400 transition-colors ml-0.5 font-bold cursor-pointer text-[10px]"
                                                        title="Remove tag"
                                                    >
                                                        &times;
                                                    </button>
                                                </span>
                                            ))}
                                            
                                            {/* Add tag form */}
                                            <form 
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    if (!newFolderTag.trim()) return;
                                                    const tagVal = newFolderTag.trim();
                                                    const currentTags = activeFolder.tags || [];
                                                    if (!currentTags.includes(tagVal)) {
                                                        updateFolderTags(activeFolder.id, [...currentTags, tagVal]);
                                                    }
                                                    setNewFolderTag('');
                                                }}
                                                className="inline-flex items-center gap-1"
                                            >
                                                <input 
                                                    type="text" 
                                                    placeholder="+ New Tag..." 
                                                    value={newFolderTag}
                                                    onChange={(e) => setNewFolderTag(e.target.value)}
                                                    className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-stone-300 focus:outline-none focus:border-indigo-500/50 w-20"
                                                />
                                            </form>

                                            {/* Folder tags suggestions */}
                                            {SUGGESTED_TAGS.filter(t => !(activeFolder.tags || []).includes(t)).slice(0, 3).map(tagSuggestion => (
                                                <button
                                                    key={tagSuggestion}
                                                    onClick={() => {
                                                        const current = activeFolder.tags || [];
                                                        updateFolderTags(activeFolder.id, [...current, tagSuggestion]);
                                                    }}
                                                    className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-stone-500 hover:text-stone-300 text-[8px] font-mono uppercase cursor-pointer border border-transparent hover:border-white/5"
                                                >
                                                    + {tagSuggestion}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick Link/Add form */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-stone-500 uppercase font-mono hidden lg:inline">Link Artifact:</span>
                                        <select 
                                            value={`${selectedSourceSessionId}:${selectedSourceArtifactId}`}
                                            onChange={(e) => {
                                                const parts = e.target.value.split(':');
                                                setSelectedSourceSessionId(parts[0] || '');
                                                setSelectedSourceArtifactId(parts[1] || '');
                                            }}
                                            className="px-2 py-1 text-xs text-stone-300 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:border-indigo-500 font-sans max-w-[200px]"
                                        >
                                            <option value="" className="bg-[#0b0c10] text-[#71717a]">Select one from history...</option>
                                            {availableArtifacts.map((art, idx) => {
                                                const promptShort = art.sessionPrompt.length > 25 
                                                    ? art.sessionPrompt.substring(0, 25) + '...' 
                                                    : art.sessionPrompt;
                                                return (
                                                    <option 
                                                        key={idx} 
                                                        value={`${art.sessionId}:${art.artifactId}`}
                                                        className="bg-[#0b0c10]"
                                                    >
                                                        {art.styleName} ({promptShort})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <button 
                                            onClick={handleAddArtifactToActiveFolder}
                                            disabled={!selectedSourceArtifactId}
                                            className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md text-[10px] font-semibold h-7 transition-all cursor-pointer flex items-center gap-1 font-mono uppercase"
                                        >
                                            <Plus className="w-3 h-3" />
                                            <span>Add</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Unique Tags filtering bar inside right content */}
                                {allUniqueTags.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2 mb-4 px-3 py-1.5 bg-[#0e1017] border border-white/5 rounded-xl">
                                        <span className="flex items-center gap-1 text-[9px] text-stone-500 font-mono uppercase font-bold select-none mr-1">
                                            <Filter className="w-3 h-3 text-stone-500" />
                                            <span>Filter:</span>
                                        </span>
                                        <button
                                            onClick={() => setFilterTag(null)}
                                            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                                                !filterTag 
                                                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold' 
                                                    : 'bg-white/5 border border-transparent text-stone-400 hover:text-stone-300'
                                            }`}
                                        >
                                            ALL ({activeFolder.artifactRefs?.length || 0})
                                        </button>
                                        {allUniqueTags.map(tag => {
                                            const count = (activeFolder.artifactRefs || []).filter(ref => (ref.tags || []).includes(tag)).length;
                                            return (
                                                <button
                                                    key={tag}
                                                    onClick={() => setFilterTag(tag)}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                                                        filterTag === tag 
                                                            ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-400/35 font-bold' 
                                                            : 'bg-white/5 border border-transparent text-stone-400 hover:text-stone-300'
                                                    }`}
                                                >
                                                    #{tag} ({count})
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Content Grid */}
                                {!activeFolder.artifactRefs || activeFolder.artifactRefs.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                                        <FileCode className="w-8 h-8 text-stone-600 mb-2 animate-bounce" />
                                        <p className="text-xs text-stone-400 font-medium font-sans">No artifacts grouped herein yet.</p>
                                        <p className="text-[10px] text-stone-500 font-mono mt-1">Use the "Link Artifact" selector above, or use the Folder action directly inside the main UI screen.</p>
                                    </div>
                                ) : filteredRefs.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-white/5 rounded-xl bg-white/[0.01]">
                                        <Filter className="w-8 h-8 text-stone-650 mb-2" />
                                        <p className="text-xs text-stone-400 font-medium font-sans">No artifacts match tag "#{filterTag}".</p>
                                        <button 
                                            onClick={() => setFilterTag(null)}
                                            className="text-[10px] text-indigo-400 hover:underline font-mono mt-2"
                                        >
                                            Clear Filter
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredRefs.map((ref) => {
                                            const uniqueRefId = `${ref.sessionId}:${ref.artifactId}`;
                                            const isEditingTags = activeTagEditorId === uniqueRefId;

                                            // Lookup matched session and see if has additionalFiles
                                            const resolvedSession = sessions.find(s => s.id === ref.sessionId);
                                            const resolvedArtifact = resolvedSession?.artifacts?.find(a => a.id === ref.artifactId);
                                            const additionalFilesCount = resolvedArtifact?.additionalFiles 
                                                ? Object.keys(resolvedArtifact.additionalFiles).length 
                                                : 0;

                                            return (
                                                <div 
                                                    key={uniqueRefId}
                                                    className="relative group flex flex-col bg-[#0e1017] border border-white/5 rounded-xl overflow-hidden p-3 hover:border-white/10 transition-all hover:shadow-indigo-950/10 shadow-lg"
                                                >
                                                    {/* Header Style Metadata */}
                                                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-mono leading-none rounded font-semibold">
                                                                {ref.styleName}
                                                            </span>
                                                            {additionalFilesCount > 0 && (
                                                                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-mono leading-none rounded">
                                                                    +{additionalFilesCount} files
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[9px] text-stone-500 font-mono select-none">
                                                            {new Date(ref.timestamp || Date.now()).toLocaleTimeString()}
                                                        </span>
                                                    </div>

                                                    {/* Minimap preview (iframe) */}
                                                    <div className="relative aspect-video w-full border border-white/5 rounded-md bg-stone-950/90 overflow-hidden mt-3 shadow-inner">
                                                        <iframe 
                                                            srcDoc={ref.html} 
                                                            title={ref.artifactId} 
                                                            sandbox="allow-scripts allow-same-origin"
                                                            className="absolute inset-0 w-[400%] h-[400%] scale-[0.25] origin-top-left pointer-events-none opacity-80"
                                                        />
                                                    </div>

                                                    {/* Dynamic Tags Area inside Card */}
                                                    <div className="mt-3.5 pt-2.5 border-t border-white/5 flex flex-col gap-1.5">
                                                        <div className="flex flex-wrap items-center gap-1">
                                                            <Tag className="w-3 h-3 text-stone-500 select-none mr-0.5" />
                                                            {(!ref.tags || ref.tags.length === 0) ? (
                                                                <span className="text-[9px] text-stone-500 italic font-mono select-none leading-none mr-1">Untagged</span>
                                                            ) : (
                                                                (ref.tags || []).map(t => (
                                                                    <span key={t} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-stone-500/10 text-[9px] font-mono text-stone-400">
                                                                        <span>{t}</span>
                                                                        <button
                                                                            onClick={() => {
                                                                                const updated = (ref.tags || []).filter(tag => tag !== t);
                                                                                updateArtifactTags(activeFolder.id, ref.sessionId, ref.artifactId, updated);
                                                                            }}
                                                                            className="hover:text-red-400 transition-colors font-bold text-[9px] ml-0.5 leading-none cursor-pointer"
                                                                            title="Delete tag"
                                                                        >
                                                                            &times;
                                                                        </button>
                                                                    </span>
                                                                ))
                                                            )}
                                                            
                                                            {/* Edit tags switcher */}
                                                            <button
                                                                onClick={() => setActiveTagEditorId(isEditingTags ? null : uniqueRefId)}
                                                                className={`p-1 px-1.5 rounded transition-all cursor-pointer font-mono text-[8px] uppercase font-bold leading-none ${
                                                                    isEditingTags 
                                                                        ? 'bg-indigo-600 text-white' 
                                                                        : 'bg-white/5 text-stone-500 hover:text-stone-300'
                                                                }`}
                                                            >
                                                                Tags Edit
                                                            </button>
                                                        </div>

                                                        {/* Expanded Inline Tag Setter */}
                                                        {isEditingTags && (
                                                            <div className="flex flex-col gap-1.5 p-2 bg-black/40 border border-white/5 rounded-lg mt-1 text-stone-300">
                                                                <span className="text-[8px] font-mono text-stone-500 font-bold uppercase tracking-wider">Suggestions:</span>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {SUGGESTED_TAGS.map(t => {
                                                                        const isSelected = (ref.tags || []).includes(t);
                                                                        return (
                                                                            <button
                                                                                key={t}
                                                                                onClick={() => {
                                                                                    const exist = (ref.tags || []).includes(t);
                                                                                    const updated = exist 
                                                                                        ? (ref.tags || []).filter(tag => tag !== t) 
                                                                                        : [...(ref.tags || []), t];
                                                                                    updateArtifactTags(activeFolder.id, ref.sessionId, ref.artifactId, updated);
                                                                                }}
                                                                                className={`px-1.5 py-0.5 rounded text-[8px] font-mono transition-all cursor-pointer ${
                                                                                    isSelected 
                                                                                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                                                                                        : 'bg-white/5 text-stone-500 hover:text-stone-300 border border-transparent'
                                                                                }`}
                                                                            >
                                                                                {isSelected ? '✓ ' : ''}{t}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                                
                                                                {/* Custom label tag enter */}
                                                                <form
                                                                    onSubmit={(e) => {
                                                                        e.preventDefault();
                                                                        const inputVal = customTagInputs[uniqueRefId] || '';
                                                                        if (!inputVal.trim()) return;
                                                                        const tagVal = inputVal.trim();
                                                                        const current = ref.tags || [];
                                                                        if (!current.includes(tagVal)) {
                                                                            updateArtifactTags(activeFolder.id, ref.sessionId, ref.artifactId, [...current, tagVal]);
                                                                        }
                                                                        setCustomTagInputs(prev => ({ ...prev, [uniqueRefId]: '' }));
                                                                    }}
                                                                    className="flex items-center gap-1 mt-1"
                                                                >
                                                                    <input
                                                                        type="text"
                                                                        placeholder="New custom label..."
                                                                        value={customTagInputs[uniqueRefId] || ''}
                                                                        onChange={(e) => {
                                                                            setCustomTagInputs(prev => ({ ...prev, [uniqueRefId]: e.target.value }));
                                                                        }}
                                                                        className="flex-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-indigo-500 text-[10px] font-mono text-stone-300 h-6"
                                                                    />
                                                                    <button
                                                                        type="submit"
                                                                        className="px-2 h-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[9px] font-bold transition-all cursor-pointer font-mono uppercase"
                                                                    >
                                                                        Add
                                                                    </button>
                                                                </form>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Toolbar row inside Card */}
                                                    <div className="mt-3 flex items-center justify-between gap-1">
                                                        <button 
                                                            onClick={() => onViewArtifact(ref.html, ref.styleName)}
                                                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-md text-[10px] text-indigo-300 font-medium transition-all font-mono uppercase cursor-pointer"
                                                            title="Load this design artifact in core viewer"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            <span>Explore View</span>
                                                        </button>

                                                        <div className="flex items-center gap-1.5">
                                                            <button 
                                                                onClick={() => handleCopy(ref.artifactId, ref.html)}
                                                                className={`p-1.5 rounded-md transition-all border cursor-pointer ${
                                                                    copiedId === ref.artifactId 
                                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                                                        : 'bg-white/5 border-white/5 text-stone-400 hover:text-white hover:border-white/10'
                                                                }`}
                                                                title="Copy HTML Source Code"
                                                            >
                                                                {copiedId === ref.artifactId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    if (confirm("Remove this design artifact from this project folder?")) {
                                                                        removeArtifactFromFolder(activeFolder.id, ref.sessionId, ref.artifactId);
                                                                    }
                                                                }}
                                                                className="p-1.5 bg-red-950/20 hover:bg-red-500/20 border border-red-500/10 hover:border-red-500/30 rounded-md text-stone-500 hover:text-red-400 transition-all cursor-pointer"
                                                                title="Remove reference from folder"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-stone-500">
                                <FolderKanban className="w-10 h-10 text-stone-700 mb-3 animate-pulse" />
                                <h4 className="text-xs font-semibold text-white font-sans">No Folder Selected</h4>
                                <p className="text-[10px] text-stone-400 font-mono mt-1 max-w-sm">Select one of your design folders on the left panel, or create a new one to start grouping codebases.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
