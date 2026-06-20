import React, { useState, useMemo } from 'react';
import { useVault } from '../context/VaultContext';
import { VaultPassword, VaultCategory } from '../types';
import { 
  Key, Plus, Edit, Trash2, Copy, Check, Eye, EyeOff, Globe, 
  ExternalLink, Search, Tag, Sparkles, Filter, X, CornerRightDown 
} from 'lucide-react';
import { PasswordGenerator } from '../components/PasswordGenerator';
import { checkPasswordStrength } from '../utils/crypto';

interface PasswordVaultViewProps {
  onQuickAddTrigger?: boolean;
}

export const PasswordVaultView: React.FC<PasswordVaultViewProps> = () => {
  const { 
    passwords, 
    addPassword, 
    updatePassword, 
    removePassword, 
    searchQuery,
    decryptItem,
    encryptItem
  } = useVault();

  // Selected Category filter
  const [selectedCategory, setSelectedCategory] = useState<VaultCategory>('All');
  
  // Decrypted password cache for session visual reveals
  // format: { [id]: decrypted_string }
  const [revealedPasswords, setRevealedPasswords] = useState<{ [key: string]: string }>({});
  const [decryptionLoading, setDecryptionLoading] = useState<{ [key: string]: boolean }>({});
  
  // Copy indicators
  const [copiedId, setCopiedId] = useState<{ [key: string]: boolean }>({});

  // CRUD Forms Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultPassword | null>(null);
  
  const [formTitle, setFormTitle] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formCategory, setFormCategory] = useState<VaultCategory>('Logins');
  const [formNotes, setFormNotes] = useState('');

  // Password Generator inner drawer helper inside forms
  const [showGenDrawer, setShowGenDrawer] = useState(false);

  // Filter passwords based on search query AND category tabs
  const filteredPasswords = useMemo(() => {
    return passwords.filter(item => {
      // 1. Matches Category Filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      // 2. Matches Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.website.toLowerCase().includes(query) ||
          item.username.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [passwords, selectedCategory, searchQuery]);

  const categoriesList: VaultCategory[] = ['All', 'Logins', 'Social', 'Finance', 'Work', 'Personal', 'Other'];

  // Handle password reveal / on-demand decryption
  const handleToggleReveal = async (item: VaultPassword) => {
    if (revealedPasswords[item.id]) {
      // Hide
      setRevealedPasswords(prev => {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      });
    } else {
      // Reveal & Decrypt
      setDecryptionLoading(prev => ({ ...prev, [item.id]: true }));
      try {
        const decrypted = await decryptItem(item.encryptedPassword);
        setRevealedPasswords(prev => ({ ...prev, [item.id]: decrypted }));
      } catch (err) {
        alert('Decryption failed. Memory key is locked or invalidated.');
      } finally {
        setDecryptionLoading(prev => ({ ...prev, [item.id]: false }));
      }
    }
  };

  // Copy password value to clipboard
  const handleCopyPassword = async (item: VaultPassword) => {
    try {
      let pwd = revealedPasswords[item.id];
      if (!pwd) {
        pwd = await decryptItem(item.encryptedPassword);
      }
      navigator.clipboard.writeText(pwd);
      setCopiedId(prev => ({ ...prev, [item.id + '_pwd']: true }));
      setTimeout(() => {
        setCopiedId(prev => ({ ...prev, [item.id + '_pwd']: false }));
      }, 2000);
    } catch (_) {
      alert('Failed to copy. Security lock detected.');
    }
  };

  const handleCopyUsername = (item: VaultPassword) => {
    navigator.clipboard.writeText(item.username);
    setCopiedId(prev => ({ ...prev, [item.id + '_user']: true }));
    setTimeout(() => {
      setCopiedId(prev => ({ ...prev, [item.id + '_user']: false }));
    }, 2000);
  };

  // Submit Password registration
  const handleSaveCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formUsername || !formPassword) {
      alert('Please compile all necessary fields.');
      return;
    }

    try {
      const encryptedPassword = await encryptItem(formPassword);
      const encryptedNotes = formNotes ? await encryptItem(formNotes) : '';

      if (editingItem) {
        // Edit entry
        await updatePassword(editingItem.id, {
          title: formTitle,
          website: formWebsite,
          username: formUsername,
          encryptedPassword,
          category: formCategory,
          notes: encryptedNotes
        });
      } else {
        // Create brand new
        await addPassword({
          title: formTitle,
          website: formWebsite,
          username: formUsername,
          encryptedPassword,
          category: formCategory,
          notes: encryptedNotes
        });
      }

      // Close modal
      handleCloseFormModal();
    } catch (err) {
      console.error(err);
      alert('Failed to encrypt or write credentials to secure database.');
    }
  };

  const handleOpenEdit = async (item: VaultPassword) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormWebsite(item.website);
    setFormUsername(item.username);
    setFormCategory(item.category as VaultCategory);
    
    // Pre-decrypt to edit
    try {
      const decryptedPwd = await decryptItem(item.encryptedPassword);
      setFormPassword(decryptedPwd);
      
      const decryptedNotes = item.notes ? await decryptItem(item.notes) : '';
      setFormNotes(decryptedNotes);
    } catch (_) {
      setFormPassword('');
      setFormNotes('');
    }
    
    setShowAddModal(true);
  };

  const handleCloseFormModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setFormTitle('');
    setFormWebsite('');
    setFormUsername('');
    setFormPassword('');
    setFormCategory('Logins');
    setFormNotes('');
    setShowGenDrawer(false);
  };

  const strength = useMemo(() => {
    return checkPasswordStrength(formPassword);
  }, [formPassword]);

  // Clean URL formats to display nice website links
  const formatURL = (url: string) => {
    if (!url) return '';
    let clean = url.replace(/^(https?:\/\/)?(www\.)?/, '');
    if (clean.length > 24) return clean.substring(0, 22) + '...';
    return clean;
  };

  return (
    <div className="space-y-6 text-zinc-100 animate-fadeIn">
      
      {/* 1. Header with Fast Search controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-400" />
            <span>Passwords Manager</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Safely encrypt, audit, and auto-generate web logins inside our secure database.</p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
          }}
          className="self-start sm:self-center py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-550/10 cursor-pointer active:scale-98 border-none"
        >
          <Plus className="w-4 h-4" />
          <span>Add Credentials</span>
        </button>
      </div>

      {/* 2. Unified Filtering Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-white/10">
        {categoriesList.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap cursor-pointer transition-all border shrink-0 ${selectedCategory === cat ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. Credentials Grid List */}
      {filteredPasswords.length === 0 ? (
        <div className="text-center py-16 rounded-3xl bg-white/5 border border-white/10 border-dashed backdrop-blur-md">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Key className="text-zinc-500 w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-300">No Credentials Found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
            {searchQuery ? `No records matched search query "${searchQuery}" under ${selectedCategory}.` : `Your ${selectedCategory !== 'All' ? selectedCategory : 'passwords'} folder is completely empty. Create a strong login credential now!`}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-3.5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-zinc-200 hover:text-white rounded-xl cursor-pointer"
            >
              Construct first item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPasswords.map((item) => {
            const isRevealed = !!revealedPasswords[item.id];
            const displayValue = isRevealed ? revealedPasswords[item.id] : '••••••••••••••••';
            
            return (
              <div 
                key={item.id}
                className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 shadow-sm relative group transition-all duration-200 flex flex-col justify-between gap-4 backdrop-blur-md"
              >
                {/* Upper section */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm tracking-tight">{item.title}</h3>
                      {item.website ? (
                        <a 
                          href={item.website.startsWith('http') ? item.website : `https://${item.website}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[11px] text-zinc-400 hover:text-blue-400 inline-flex items-center gap-1 mt-0.5 leading-none transition-colors"
                        >
                          <Globe className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span>{formatURL(item.website)}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-zinc-500 italic">No web link provided</span>
                      )}
                    </div>
                    {/* Category Label badge */}
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-400 flex items-center gap-1 select-none">
                      <Tag className="w-2.5 h-2.5 shrink-0 text-blue-400" />
                      <span>{item.category}</span>
                    </span>
                  </div>

                  {/* Username/Email fields */}
                  <div className="grid grid-cols-1 gap-2 pt-3">
                    <div className="p-2.5 bg-black/25 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono">
                      <div className="truncate pr-4">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mr-2.5">User:</span>
                        <span className="text-zinc-300 select-all">{item.username}</span>
                      </div>
                      <button
                        onClick={() => handleCopyUsername(item)}
                        className="p-1 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                        title="Copy Username"
                      >
                        {copiedId[item.id + '_user'] ? (
                          <Check className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="p-2.5 bg-black/25 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono relative">
                      <div className="truncate pr-16">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mr-2.5">Pass:</span>
                        <span className={`text-zinc-350 select-all ${isRevealed ? 'text-blue-400 font-bold' : ''}`}>{displayValue}</span>
                      </div>
                      <div className="absolute right-2.5 top-1.5 flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleReveal(item)}
                          disabled={decryptionLoading[item.id]}
                          className="p-1 px-1.5 bg-white/10 border border-white/10 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
                          title="Decrypt inline / Reveal"
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopyPassword(item)}
                          className="p-1 px-1.5 bg-white/10 border border-white/10 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
                          title="Copy Password"
                        >
                          {copiedId[item.id + '_pwd'] ? (
                            <Check className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lower Action buttons */}
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">
                    Last modified: {new Date(item.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-all"
                      title="Edit Account Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Permanently remove ${item.title} credentials?`)) {
                          removePassword(item.id);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-950/20 border border-transparent hover:border-red-900/30 text-zinc-400 hover:text-red-400 cursor-pointer transition-all"
                      title="Delete profile"
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

      {/* 4. CRUD Credentials Modal (Add & Edit combined) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-xl bg-zinc-900/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-md">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                {editingItem ? 'Edit Credential Profile' : 'Generate New Credentials'}
              </h2>
              <button
                onClick={handleCloseFormModal}
                className="p-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-350 hover:text-zinc-250 transition-all font-mono text-xs uppercase tracking-tight cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveCredential} className="p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Profile Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google Account, Wells Fargo"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full text-sm bg-black/25 border border-white/10 rounded-xl px-3 py-2 text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as VaultCategory)}
                    className="w-full text-xs bg-black/25 border border-white/10 rounded-xl px-3 py-2 text-zinc-250 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  >
                    <option>Logins</option>
                    <option>Social</option>
                    <option>Finance</option>
                    <option>Work</option>
                    <option>Personal</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Website Address</label>
                  <input
                    type="text"
                    placeholder="e.g. accounts.google.com"
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    className="w-full text-sm bg-black/25 border border-white/10 rounded-xl px-3 py-2 text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Username / Email ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. user@gmail.com"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full text-sm bg-black/25 border border-white/10 rounded-xl px-3 py-2 text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Password credentials layout */}
              <div className="border-t border-white/10 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Secret Password</label>
                  <button
                    type="button"
                    onClick={() => setShowGenDrawer(!showGenDrawer)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-semibold select-none"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Generate Strong Password</span>
                  </button>
                </div>

                {showGenDrawer && (
                  <div className="mb-2 animate-fadeIn">
                    <PasswordGenerator onSelectPassword={(pw) => {
                      setFormPassword(pw);
                      setShowGenDrawer(false);
                    }} inline />
                  </div>
                )}

                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Provide website password..."
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full text-sm bg-black/25 border border-white/10 rounded-xl px-3 py-2.5 text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  />
                </div>

                {formPassword && (
                  <div className="p-3.5 rounded-xl bg-black/25 border border-white/5 space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-500 uppercase">Password strength audit</span>
                      <span className="font-semibold text-blue-400 uppercase tracking-wider">{strength.text}</span>
                    </div>
                    <div className="h-1 bg-black/35 rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} transition-all`} style={{ width: `${(strength.score + 1) * 20}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Extra notes */}
              <div className="border-t border-white/10 pt-4">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Secure Notes (Plain-text or code-snippet, Encrypted)</label>
                <textarea
                  placeholder="Insert secure metadata like recovery keys, PIN backups, security pin codes..."
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full text-sm bg-black/25 border border-white/10 rounded-xl p-3 text-zinc-250 placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Footer Save actions */}
              <div className="flex justify-end gap-3.5 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCloseFormModal}
                  className="py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-350 text-xs font-semibold cursor-pointer border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-blue-500/10 border-none cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  <span>{editingItem ? 'Save Updates' : 'Add Credential Profile'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
