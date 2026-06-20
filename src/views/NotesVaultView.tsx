import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useVault } from '../context/VaultContext';
import { VaultNote } from '../types';
import { 
  FileText, Plus, Search, Tag, Eye, EyeOff, Pin, Edit, Trash2, 
  Save, Check, Sparkles, FolderOpen, AlertCircle, FileEdit, FileCode, CheckSquare
} from 'lucide-react';

export const NotesVaultView: React.FC = () => {
  const { 
    notes, 
    addNote, 
    updateNote, 
    removeNote, 
    searchQuery,
    decryptItem,
    encryptItem
  } = useVault();

  // Active loaded note ID
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  
  // Decrypted cache for active note
  const [decryptedBodies, setDecryptedBodies] = useState<{ [id: string]: string }>({});
  const [decryptedTitles, setDecryptedTitles] = useState<{ [id: string]: string }>({});
  const [decryptionLoading, setDecryptionLoading] = useState<string | null>(null);

  // Creator state
  const [showCreatorTab, setShowCreatorTab] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState('Personal');
  const [newNoteTags, setNewNoteTags] = useState('');

  // Auto-save debounce parameters
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter notes based on general query matching tags, title, categories, or text content
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(query) ||
          n.category.toLowerCase().includes(query) ||
          n.tags.some(t => t.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [notes, searchQuery]);

  // Sort notes so Pinned notes always rise to top
  const sortedNotes = useMemo(() => {
    const list = [...filteredNotes];
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [filteredNotes]);

  // Set first note active if list changes and nothing is active
  useEffect(() => {
    if (sortedNotes.length > 0 && !activeNoteId && !showCreatorTab) {
      handleSetNoteActive(sortedNotes[0].id);
    }
  }, [sortedNotes, activeNoteId, showCreatorTab]);

  // Load and decrypt note on selection
  const handleSetNoteActive = async (id: string) => {
    setShowCreatorTab(false);
    setActiveNoteId(id);
    if (decryptedBodies[id]) return; // already decrypted

    setDecryptionLoading(id);
    try {
      const parent = notes.find(n => n.id === id);
      if (parent) {
        const dBody = await decryptItem(parent.encryptedContent);
        setDecryptedBodies(prev => ({ ...prev, [id]: dBody }));
        setDecryptedTitles(prev => ({ ...prev, [id]: parent.title }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDecryptionLoading(null);
    }
  };

  // Perform active text modification auto-saves
  const handleActiveContentChange = (newBodyText: string) => {
    if (!activeNoteId) return;
    
    // 1. Instantly set draft in local UI cache so response is fast!
    setDecryptedBodies(prev => ({ ...prev, [activeNoteId]: newBodyText }));
    setAutoSaveStatus('saving');

    // 2. Debounce database encryption write transaction
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(async () => {
      try {
        const titleText = decryptedTitles[activeNoteId] || 'Untitled Note';
        const encryptedContent = await encryptItem(newBodyText);
        
        await updateNote(activeNoteId, {
          title: titleText,
          encryptedContent
        });
        
        setAutoSaveStatus('saved');
      } catch (err) {
        setAutoSaveStatus('error');
        console.error('Auto save failure', err);
      }
    }, 1200); // 1.2 second debounce
  };

  // Handle manual title edits inside notes
  const handleActiveTitleChange = (newTitle: string) => {
    if (!activeNoteId) return;
    setDecryptedTitles(prev => ({ ...prev, [activeNoteId]: newTitle }));
    setAutoSaveStatus('saving');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(async () => {
      try {
        const bodyText = decryptedBodies[activeNoteId] || '';
        const currentNote = notes.find(n => n.id === activeNoteId);
        if (!currentNote) return;

        await updateNote(activeNoteId, {
          title: newTitle,
          updatedAt: Date.now()
        });

        setAutoSaveStatus('saved');
      } catch (err) {
        setAutoSaveStatus('error');
      }
    }, 1200);
  };

  // Compose formatting helpers inside text editor
  const applyTextFormat = (formatType: 'bold' | 'italic' | 'list' | 'code') => {
    if (!activeNoteId) return;
    const textarea = document.getElementById('note_editor_area') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = decryptedBodies[activeNoteId] || '';
    const selected = text.substring(start, end);
    let formatted = '';

    switch (formatType) {
      case 'bold':
        formatted = `**${selected || 'bold text'}**`;
        break;
      case 'italic':
        formatted = `*${selected || 'italic text'}*`;
        break;
      case 'list':
        formatted = `\n- ${selected || 'list item'}`;
        break;
      case 'code':
        formatted = `\`\`\`\n${selected || 'code blocks'}\n\`\`\``;
        break;
    }

    const value = text.substring(0, start) + formatted + text.substring(end);
    handleActiveContentChange(value);
    
    // Return cursor focus to select
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formatted.length, start + formatted.length);
    }, 100);
  };

  // Submit Note Creator Form
  const handleCreateNewNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle) {
      alert('Provide note title credentials.');
      return;
    }

    try {
      const encryptedContent = await encryptItem('Start writing secure notes here...');
      const tagsList = newNoteTags
        ? newNoteTags.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
        : [];
      
      await addNote({
        title: newNoteTitle,
        category: newNoteCategory,
        tags: tagsList,
        pinned: false,
        encryptedContent
      });

      // Clear creator
      setNewNoteTitle('');
      setNewNoteCategory('Personal');
      setNewNoteTags('');
      setShowCreatorTab(false);
    } catch (_) {
      alert('Failed to initialize secure notes encryption process.');
    }
  };

  const handleTogglePinNote = async (item: VaultNote) => {
    await updateNote(item.id, {
      pinned: !item.pinned
    });
  };

  const handleDeleteActiveNote = async () => {
    if (!activeNoteId) return;
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;
    
    if (confirm(`Permanently wipeout Secure Note "${note.title}"?`)) {
      await removeNote(activeNoteId);
      
      // Clean states
      setDecryptedBodies(prev => { const copy = { ...prev }; delete copy[activeNoteId]; return copy; });
      setDecryptedTitles(prev => { const copy = { ...prev }; delete copy[activeNoteId]; return copy; });
      setActiveNoteId(null);
    }
  };

  const activeNoteItem = useMemo(() => {
    return notes.find(n => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  return (
    <div className="space-y-6 text-zinc-100 animate-fadeIn h-[calc(100vh-180px)] xl:h-[calc(100vh-140px)] flex flex-col">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>Secure Notes Vault</span>
          </h2>
          <p className="text-xs text-zinc-400">Draft classified notes, lists, code keys. Automatic background AES-GCM encryption is triggered inline.</p>
        </div>

        <button
          onClick={() => {
            setShowCreatorTab(true);
            setActiveNoteId(null);
          }}
          className="self-start sm:self-center py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer border-none"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Main Dual Pane Canvas */}
      <div className="flex-1 min-h-0 bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex backdrop-blur-md">
        
        {/* PANEL LEFT: NOTE CORNER DIRECTORY */}
        <div className="w-full md:w-[320px] lg:w-[360px] border-r border-white/10 flex flex-col shrink-0 bin-hidden md:flex">
          
          <div className="p-4 border-b border-white/10 bg-white/5 shrink-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">DIRECTORY OUTLINE ({sortedNotes.length})</span>
            <div className="relative text-xs">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search notes tags titles..."
                className="w-full text-xs bg-black/25 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-zinc-200 placeholder:text-zinc-650 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
            {sortedNotes.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs">No secure notes saved.</div>
            ) : (
              sortedNotes.map((item) => {
                const isActive = item.id === activeNoteId;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSetNoteActive(item.id)}
                    className={`p-3.5 rounded-xl text-left cursor-pointer transition-all border outline-none select-none flex flex-col gap-2 relative group ${isActive ? 'bg-white/15 border-blue-500/30 text-white' : 'bg-transparent border-transparent hover:bg-white/10 text-zinc-350 hover:text-zinc-200'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="truncate pr-5 font-semibold text-sm">
                        {item.title}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePinNote(item);
                          }}
                          className={`p-1 rounded hover:bg-white/10 transition-colors ${item.pinned ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-400'}`}
                          title={item.pinned ? 'Unpin' : 'Pin note'}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 uppercase tracking-wide">
                        {item.category}
                      </span>
                      <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                    </div>

                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.tags.map((t, idx) => (
                          <span key={idx} className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded-full uppercase">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL RIGHT: RICH TEXT TEXT EDITOR / NOTE CREATOR COMPOSER */}
        <div className="flex-1 bg-black/20 flex flex-col relative">
          
          {/* STATE A: ACTIVE NOTES LOADED */}
          {activeNoteId && activeNoteItem && (
            <div className="absolute inset-0 flex flex-col">
              
              {/* Header toolbars controls */}
              <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {/* Category Pill Tag */}
                  <span className="text-[10px] uppercase font-bold bg-white/5 border border-white/10 px-2.5 py-0.5 rounded text-zinc-300">
                    {activeNoteItem.category}
                  </span>
 
                  {/* Auto-save toaster ticks */}
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 select-none">
                    {autoSaveStatus === 'saving' && (
                      <>
                        <div className="w-2 h-2 rounded-full border-t-2 border-blue-400 animate-spin" />
                        <span>Encrypting & Syncing...</span>
                      </>
                    )}
                    {autoSaveStatus === 'saved' && (
                      <>
                        <Check className="w-3.5 h-3.5 text-blue-405 font-bold" />
                        <span className="text-zinc-500">Securely Saved to Device</span>
                      </>
                    )}
                    {autoSaveStatus === 'error' && (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-red-400">Sync Error</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Manual Trash Action */}
                <button
                  type="button"
                  onClick={handleDeleteActiveNote}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-all cursor-pointer"
                  title="Wipe note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
 
              {/* Dynamic Rich Text Helper Toolbar */}
              <div className="px-4 py-2 border-b border-white/10 bg-white/5 flex items-center gap-2 flex-wrap shrink-0">
                <button
                  onClick={() => applyTextFormat('bold')}
                  className="p-1 px-2.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-black cursor-pointer uppercase"
                  title="Bold"
                >B</button>
                <button
                  onClick={() => applyTextFormat('italic')}
                  className="p-1 px-2.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white text-xs italic font-serif cursor-pointer"
                  title="Italics"
                >I</button>
                <button
                  onClick={() => applyTextFormat('list')}
                  className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                  title="Add List Item"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => applyTextFormat('code')}
                  className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                  title="Insert Code block"
                >
                  <FileCode className="w-3.5 h-3.5" />
                </button>
              </div>
 
              {/* Note Content Blocks */}
              <div className="flex-1 p-6 flex flex-col gap-4 min-h-0 overflow-hidden">
                <input
                  type="text"
                  placeholder="Set Note Title..."
                  value={decryptedTitles[activeNoteId] || ''}
                  onChange={(e) => handleActiveTitleChange(e.target.value)}
                  className="w-full text-base bg-transparent font-bold border-none placeholder:text-zinc-600 focus:outline-none focus:ring-0 text-white tracking-tight"
                />
 
                {decryptionLoading === activeNoteId ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
                    <span className="text-xs text-zinc-500 font-mono tracking-widest">DECRYPTING MEMORY BLOCKS...</span>
                  </div>
                ) : (
                  <textarea
                    id="note_editor_area"
                    placeholder="Provide encrypted note content... Format supports Markdowns!"
                    value={decryptedBodies[activeNoteId] || ''}
                    onChange={(e) => handleActiveContentChange(e.target.value)}
                    className="flex-1 w-full text-sm leading-relaxed bg-transparent border-none placeholder:text-zinc-500 text-zinc-300 focus:outline-none focus:ring-0 resize-none font-mono focus:border-transparent select-text"
                  />
                )}
              </div>
            </div>
          )}

          {/* STATE B: NOTE CREATION BLOCKS */}
          {showCreatorTab && (
            <div className="absolute inset-0 p-6 overflow-y-auto space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Create New secure note</h3>
                <p className="text-xs text-zinc-400 mt-1">Configure categories and tagging structures first. Encryption will initialize automatically on Save.</p>
              </div>

              <form onSubmit={handleCreateNewNote} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Note Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Server recovery codes, Personal diary"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="w-full text-sm bg-black/25 border border-white/10 rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Note Category</label>
                    <select
                      value={newNoteCategory}
                      onChange={(e) => setNewNoteCategory(e.target.value)}
                      className="w-full text-xs bg-black/25 border border-white/10 rounded-xl px-3 py-2.5 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option>Personal</option>
                      <option>Work</option>
                      <option>Finance</option>
                      <option>Auth Key</option>
                      <option>Draft</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Tags (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. servers, aws, backup"
                      value={newNoteTags}
                      onChange={(e) => setNewNoteTags(e.target.value)}
                      className="w-full text-sm bg-black/25 border border-white/10 rounded-xl px-4 py-2 text-zinc-205 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3.5 pt-4">
                  <button
                    type="submit"
                    className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs uppercase flex items-center justify-center gap-1 border-none cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span>Initialize and Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreatorTab(false);
                      if (sortedNotes.length > 0) {
                        handleSetNoteActive(sortedNotes[0].id);
                      }
                    }}
                    className="py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
 
          {/* STATE C: IDLE/EMPTY WATERMARK */}
          {!activeNoteId && !showCreatorTab && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-transparent">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-zinc-500 animate-pulse" />
              </div>
              <h3 className="text-small font-bold text-zinc-400">Secured Note Workspace</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Select an existing encrypted item from column index left or instantiate a new draft block.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
