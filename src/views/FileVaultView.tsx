import React, { useState, useMemo, useRef } from 'react';
import { useVault } from '../context/VaultContext';
import { VaultFile, FileCategory } from '../types';
import { 
  FolderOpen, Plus, Search, Upload, File, FileText, Image as ImageIcon, 
  Film, Music, Clipboard, Trash2, Download, Share2, Edit, X, ArrowUpRight, 
  CheckCircle, Loader2, Sparkles 
} from 'lucide-react';

export const FileVaultView: React.FC = () => {
  const { 
    files, 
    addFile, 
    renameFile, 
    removeFile, 
    searchQuery,
    decryptItem,
    encryptItem
  } = useVault();

  // Active subfolder filter
  const [selectedFolder, setSelectedFolder] = useState<FileCategory>('All');
  
  // Drag-and-drop indicator
  const [dragActive, setDragActive] = useState(false);
  const dragRef = useRef<HTMLDivElement | null>(null);

  // File Upload states
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Rename Modals
  const [renamingItem, setRenamingItem] = useState<VaultFile | null>(null);
  const [newNameInput, setNewNameInput] = useState('');

  // Active Previews lightbox
  const [previewingItem, setPreviewingItem] = useState<VaultFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Map MIME categories
  const getFileCategory = (mimeType: string): FileCategory => {
    if (!mimeType) return 'Other';
    if (mimeType.startsWith('image/')) return 'Images';
    if (mimeType.startsWith('video/')) return 'Videos';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (
      mimeType.startsWith('text/') || 
      mimeType.includes('pdf') || 
      mimeType.includes('document') || 
      mimeType.includes('spreadsheet') || 
      mimeType.includes('msword')
    ) {
      return 'Documents';
    }
    return 'Other';
  };

  // Filter files by search + folder categories
  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      // 1. Match Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!f.name.toLowerCase().includes(query)) return false;
      }
      // 2. Match Category Directory
      if (selectedFolder !== 'All') {
        const cat = getFileCategory(f.type);
        if (cat !== selectedFolder) return false;
      }
      return true;
    });
  }, [files, selectedFolder, searchQuery]);

  // Handle drag hover activations
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle dropping files
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Trigger from standard input change click
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Process selected native JS file
  const handleFileUpload = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      alert('Local file limit is capped at 20MB per upload for memory efficiency.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10); // start loading indicator

    try {
      const reader = new FileReader();
      
      // Promisified reading
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = (evt) => {
          setUploadProgress(40);
          resolve(evt.target?.result as string);
        };
        reader.onerror = () => reject('Reading payload crashed.');
        reader.readAsDataURL(file); // Reads file to secure base64 DataURL representation
      });

      setUploadProgress(70);
      // Encrypt the resulting DataURL string content using AES-GCM 256-bit
      const encryptedDataUrl = await encryptItem(fileDataUrl);
      
      setUploadProgress(90);
      await addFile({
        name: file.name,
        type: file.type,
        size: file.size,
        encryptedData: encryptedDataUrl,
        folder: getFileCategory(file.type)
      });

      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(null);
      }, 400);

    } catch (err) {
      console.error(err);
      alert('Encryption upload failed. Verify master pass state');
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Trigger visual previews
  const handleTriggerPreview = async (item: VaultFile) => {
    setPreviewLoading(true);
    setPreviewingItem(item);
    try {
      // 1. Decrypt raw DataURL payload
      const decryptedDataUrl = await decryptItem(item.encryptedData);
      
      // 2. Handle conversion for download / direct HTML display
      setPreviewUrl(decryptedDataUrl);
    } catch (e) {
      alert('Failed to decrypt and preview file.');
      setPreviewingItem(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Initiate direct file download stream
  const handleDownloadFile = async (item: VaultFile) => {
    try {
      // Decrypt base64 data structure
      const decryptedDataUrl = await decryptItem(item.encryptedData);
      
      // Reconstruct blob downloader links
      const link = document.createElement('a');
      link.href = decryptedDataUrl;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (_) {
      alert('Failed to construct secure download links.');
    }
  };

  // Trigger native share popup when available, else copy mock links
  const handleShareFile = async (item: VaultFile) => {
    if (navigator.share) {
      try {
        // Try sharing metadata or decrypted data blob
        await navigator.share({
          title: item.name,
          text: `Encrypted file shared locally from SecureVault Pro.`,
        });
      } catch (err) {
        console.error('Sharing failed', err);
      }
    } else {
      // share link alert message
      alert(`[SecureVault Pro Local Share Protocol]\nFile ID: ${item.id}\nName: ${item.name}\nSize: ${(item.size / 1024).toFixed(1)} KB\n- Direct peer-to-peer distribution requires a shared sync key.`);
    }
  };

  const handleSaveRename = async () => {
    if (!renamingItem || !newNameInput) return;
    await renameFile(renamingItem.id, newNameInput);
    setRenamingItem(null);
    setNewNameInput('');
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-blue-400" />;
    if (type.startsWith('video/')) return <Film className="w-6 h-6 text-indigo-400" />;
    if (type.startsWith('audio/')) return <Music className="w-6 h-6 text-sky-405" />;
    if (type.startsWith('text/') || type.includes('pdf')) return <FileText className="w-6 h-6 text-blue-400 animate-pulse animate-duration-1500" />;
    return <File className="w-6 h-6 text-zinc-450" />;
  };

  const categories: FileCategory[] = ['All', 'Documents', 'Images', 'Videos', 'Audio', 'Other'];

  return (
    <div className="space-y-6 text-zinc-105 animate-fadeIn relative">
      
      {/* Header instructions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-400 font-bold" />
            <span>Encrypted File Vault</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Upload private PDFs, media, and images. All chunks undergo AES-GCM hashing on upload.</p>
        </div>
      </div>

      {/* Directory Directories tab switches */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-white/5 scrollbar-none shrink-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedFolder(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap cursor-pointer transition-all border shrink-0 ${selectedFolder === cat ? 'bg-blue-600 text-white border-blue-500' : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Primary drag selector field */}
      <div 
        ref={dragRef}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative overflow-hidden ${dragActive ? 'border-blue-500 bg-blue-500/5 scale-99' : 'border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10'}`}
      >
        <input 
          id="vault_drag_input"
          type="file" 
          onChange={handleFileChange}
          className="hidden" 
        />
        
        {isUploading ? (
          <div className="space-y-4 animate-pulse">
            <div className="relative flex justify-center">
              <Loader2 className="w-10 h-10 text-blue-405 animate-spin" />
              <div className="absolute top-2.5 text-[9px] font-mono font-bold text-blue-400">{uploadProgress}%</div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Cryptographically Compacting Payload...</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Performing AES-256 GCM salt cycles</p>
            </div>
          </div>
        ) : (
          <label htmlFor="vault_drag_input" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 shadow-sm text-zinc-400 mb-3 group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-sm font-bold text-zinc-200">Drag & Drop Secure Personal Files</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              Supporting Images, PDFs, Videos, or Documents (up to 20MB). Encrypted chunks reside local on-device.
            </p>
            <div className="mt-4 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase text-zinc-300 hover:text-white tracking-wider transition-colors select-none">
              Choose Local File
            </div>
          </label>
        )}
      </div>

      {/* Encrypted Files grid catalog */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-12 rounded-3xl bg-white/5 border border-white/10 text-xs text-zinc-400 backdrop-blur-md">
          No files matching under folder category "{selectedFolder}". Initiate file uploads above.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredFiles.map((item) => (
            <div 
              key={item.id}
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 shadow-md backdrop-blur-md relative group transition-all flex flex-col justify-between gap-4"
            >
              {/* Top indicators */}
              <div className="flex justify-between items-start">
                <div className="p-2 bg-black/30 rounded-xl border border-white/5">
                  {getFileIcon(item.type)}
                </div>
                {/* Delete and Edit dropdown buttons */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={() => {
                      setRenamingItem(item);
                      setNewNameInput(item.name);
                    }}
                    className="p-1 rounded bg-black/40 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
                    title="Rename File"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Permanently wipeout secure backup file "${item.name}"?`)) {
                        removeFile(item.id);
                      }
                    }}
                    className="p-1 rounded bg-black/40 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-white/10 cursor-pointer"
                    title="Delete File"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Names and metadata */}
              <div className="space-y-1">
                <h4 className="font-semibold text-xs text-white truncate group-hover:text-blue-400 transition-colors" title={item.name}>
                  {item.name}
                </h4>
                <div className="flex justify-between text-[9px] text-zinc-400 font-mono">
                  <span>{(item.size / 1024).toFixed(1)} KB</span>
                  <span className="uppercase">{item.type.split('/')[1]?.substring(0, 4) || 'FILE'}</span>
                </div>
              </div>

              {/* Lower Actions trigger elements */}
              <div className="pt-2 border-t border-white/5 grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => handleTriggerPreview(item)}
                  className="py-1 px-1.5 bg-black/20 hover:bg-white/10 rounded-lg text-[10px] text-zinc-400 hover:text-white font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors border border-white/5"
                >
                  <FolderOpen className="w-3 h-3 text-blue-400" />
                  <span>View</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleDownloadFile(item)}
                  className="py-1 px-1.5 bg-black/20 hover:bg-white/10 rounded-lg text-[10px] text-zinc-400 hover:text-white font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors border border-white/5"
                >
                  <Download className="w-3 h-3 text-blue-400" />
                  <span>Get</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareFile(item)}
                  className="py-1 px-1.5 bg-black/20 hover:bg-white/10 rounded-lg text-[10px] text-zinc-400 hover:text-white font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors border border-white/5"
                >
                  <Share2 className="w-3 h-3 text-indigo-400" />
                  <span>Share</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* 5. Rename file overlays */}
      {renamingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-sm bg-zinc-950/80 border border-white/10 p-6 rounded-2xl space-y-4 shadow-xl backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Rename Encrypted File</h3>
            <input
              type="text"
              value={newNameInput}
              onChange={(e) => setNewNameInput(e.target.value)}
              className="w-full text-sm bg-black/25 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRenamingItem(null)}
                className="py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRename}
                className="py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold border-none cursor-pointer"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. IMMERSIVE LIGHTBOX FILE PREVIEW MODALS */}
      {previewingItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-2xl bg-zinc-950/80 border border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl relative backdrop-blur-lg">
            
            {/* Upper control elements */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
              <div className="truncate pr-8">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">DECRYPTED PREVIEW</span>
                <span className="text-xs font-bold text-white truncate max-w-sm block mt-0.5">{previewingItem.name}</span>
              </div>
              <button
                onClick={() => {
                  setPreviewingItem(null);
                  setPreviewUrl(null);
                }}
                className="p-1 px-3.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-mono text-xs uppercase cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>

            {/* Main view stages */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col items-center justify-center bg-transparent">
              {previewLoading ? (
                <div className="space-y-2 text-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                  <p className="text-xs text-zinc-500 font-mono tracking-widest">DECRYPTING AES CHUNKS...</p>
                </div>
              ) : previewUrl ? (
                /* Dynamic rendering based on MIME classifications */
                previewingItem.type.startsWith('image/') ? (
                  <img 
                    src={previewUrl} 
                    alt={previewingItem.name}
                    referrerPolicy="no-referrer"
                    className="max-h-[50vh] max-w-full rounded-lg object-contain shadow-md"
                  />
                ) : previewingItem.type.startsWith('video/') ? (
                  <video 
                    src={previewUrl} 
                    controls 
                    className="max-h-[50vh] max-w-full rounded-lg shadow-md"
                  />
                ) : previewingItem.type.startsWith('audio/') ? (
                  <div className="p-8 w-full max-w-md rounded-2xl bg-white/5 border border-white/10 text-center space-y-4 backdrop-blur-md">
                    <Music className="w-10 h-10 text-blue-400 mx-auto animate-bounce animate-duration-1000" />
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">SECURE AUDIO TRANSCRIPT</h4>
                      <p className="text-xs text-zinc-505 mt-0.5">{previewingItem.name}</p>
                    </div>
                    <audio src={previewUrl} controls className="w-full mt-4" />
                  </div>
                ) : previewingItem.type.startsWith('text/') ? (
                  <iframe 
                    src={previewUrl} 
                    title={previewingItem.name}
                    className="w-full h-[50vh] bg-white rounded-lg"
                  />
                ) : (
                  <div className="text-center p-8 space-y-4">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl inline-block">
                      <File className="w-10 h-10 text-zinc-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-300">Preview Unsupported for this extension format</h4>
                      <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                        This document cannot be parsed in-browser ({previewingItem.type}). Download securely to read.
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownloadFile(previewingItem)}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 border-none text-xs font-bold text-white rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4 text-white" />
                      <span>Download File</span>
                    </button>
                  </div>
                )
              ) : (
                <div className="text-xs text-red-400">Failed to reconstruct preview wrapper.</div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
