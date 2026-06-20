import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Search, HelpCircle, Code, ShieldCheck, 
  RefreshCw, Sliders, PlayCircle, Key, FileText, FolderSync, Info
} from 'lucide-react';

interface ManualArticle {
  id: string;
  category: 'beginner' | 'advanced' | 'tutorials' | 'security' | 'backup' | 'faq';
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
}

export const UserManualView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState('getting-started');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const articles: ManualArticle[] = [
    {
      id: 'getting-started',
      category: 'beginner',
      title: 'Beginner Guide: Getting Started with SecureVault Pro',
      excerpt: 'Learn the core concepts of cryptography, setting up your master key, and logging in securely.',
      content: `### Welcome to SecureVault Pro V2.0
SecureVault Pro is an advanced on-device, local-first credentials and file vault designed to protect your sensitive digital identity. Unlike cloud servers that are prone to data breaches, SecureVault Pro encrypts all information locally inside your browser's IndexedDB engine. 

#### Step 1: Your Master Password is the Safe Key
When you configure the vault for the first time, you define a **Master Password**. 
- This password is ran through **PBKDF2** (Password-Based Key Derivation Function 2) with 100,000 iterations and a dynamic unique random salt.
- This creates an in-memory **256-bit AES-GCM CryptoKey**.
- **CRITICAL ADVICE:** We do not store your password anywhere. If you lose or forget your master password, your encrypted database cannot be retrieved by us, as there are no backend servers. Complete an export of your vault as an offline backup file and store your password safely.

#### Step 2: Accessing elements quickly with PIN Lock
Tired of typing forty-character master passwords continuously? Enable the **PIN Lock**. You can define a four or six-digit code that lets you unlock credentials instantly. If the tab stays open and locks automatically, a simple PIN is all that is required to resume, keeping the secure AES key cached safely in standard private state.

#### Step 3: Managing Directories and Categories
Organize passwords under standard labels such as **Logins**, **Finance**, **Social**, **Work**, and **Personal** to filter entries in milliseconds.`,
      tags: ['setup', 'pin', 'master', 'credentials']
    },
    {
      id: 'advanced-rekeying',
      category: 'advanced',
      title: 'Advanced User Guide: Cryptographic Key Rotation',
      excerpt: 'Understand how SecureVault Pro executes re-keying on your whole local database during password rotations.',
      content: `### Dynamic Key Rotation System
In premium security suites, rotating keys is essential. SecureVault Pro performs a live, offline re-keying process on every saved password card, secure memo, and encrypted file within milliseconds.

#### How Password Rotations Work Cryptographically:
1. **Plain-Text Retrieval:** When you trigger a Key Rotation from the Security settings, the application temporarily decrypts all saved records in browser memory using your current active memory-cached **AES-GCM Key**.
2. **Key Derivation (PBKDF2):** It requests a fresh unique random **16-byte cryptographic salt** and runs your new chosen Master Password through PBKDF2 with 100,000 hashing rounds.
3. **Re-Encryption:** The engine iterates through the plain-text credentials, generates a new 12-byte random IV (Initialization Vector) for each item, encrypts them using the fresh GCM key, and updates the local IndexedDB entries.
4. **Key Activation:** The old key is immediately garbage-collected, and the new key becomes the active credentials key.

This ensures you can update your Master Passwords safely without corrupting any previous items.`,
      tags: ['rotation', 'crypto', 'pbkdf2', 'gcm']
    },
    {
      id: 'security-levels',
      category: 'security',
      title: 'Security Guide: Protection Levels and Custom Locks',
      excerpt: 'Learn how to assign individual High, Medium, and Low security levels and protect directories with locks.',
      content: `### Multi-Tiered Security Levels
SecureVault Pro introduces customizable security levels (**Low, Medium, High**) for notes, credentials, and uploaded documents.

| Security level | Suggested Usage | Enforced Protection Features |
| :--- | :--- | :--- |
| **Low Security** | Non-sensitive accounts, public bookmarks, simple general notes. | Standard read locks, instant searching, simple local classification. |
| **Medium Security** | Corporate accounts, utility systems, general work attachments. | Secondary AES-GCM verification prompts, standard automatic lock. |
| **High Security** | Financial portals, crypto keys, identity files, private photos. | Dual PIN + Password prompt, fast inactivity timeouts, masked fields. |

#### File & Folder Protection
You can assign specific lock states to files, photos, videos, or documents:
1. **No Protection:** Quick-viewing on simple clicks.
2. **Password Protection:** Demands typing your Master Password and verifies integrity hashes before revealing.
3. **PIN Protection:** Demands your quick 4/6-digit unlock PIN.
4. **Password + PIN Protection:** Implements two factors of protection, demanding both keys.
5. **Biometric simulation lock:** Mimics physical token/fingerprint authorization to unlock maximum defensive capabilities.

#### Hiding & Secret Folders
Want to hide critical dossiers from plain view? Mark folders as **Secret** or **Hidden**. Hidden folders vanish from the main category catalog unless you click the specific "Reveal Hidden Categories" command in settings or the File Vault and type your credential details.`,
      tags: ['locks', 'high security', 'folders', 'protection']
    },
    {
      id: 'backups-guide',
      category: 'backup',
      title: 'Backup & Recovery: Off-Chain JSON Portability',
      excerpt: 'How to export uncorrupted backups of your vault and verify their file integrity.',
      content: `### Encrypted Local Backups
Because SecureVault Pro respects your absolute right to digital privacy, your data remains 100% on your device. Consequently, keeping an external backup is the user's responsibility.

#### Exporting backup files:
- Go to the **Settings** or the **Backup Center**.
- Tap **Download Backup File**. 
- This bundles all encrypted passwords, private notes, file binary base64 strings, log histories, and profiles.
- An **Integrity check hash vector** (your verified Master Password hash) is prepended inside the JSON.
- **Tip:** Because the backup file itself is fully encrypted with your master key, even if you lose the JSON file or it falls into external hands, no one can parse or read the contents without your master password.

#### Importing and Restoring:
- Tap **Upload backup (.json)**.
- Input the Master Password matching that backup package.
- The engine computes PBKDF2 checks to verify if the integrity check complies.
- If verified, the engine clears current IndexedDB rows and imports all history smoothly.`,
      tags: ['export', 'import', 'json', 'restore']
    },
    {
      id: 'failed-logins-timout',
      category: 'security',
      title: 'Security System: Failed Logins & Emergency Erase',
      excerpt: 'Configure anti-brute force delay locks and the emergency instant-wipe factory button.',
      content: `### Safeguarding Against On-Devices Intrusion
SecureVault Pro maintains a local audit trails log detailing device logins, failed attempts, and lock rotations.

#### Failed Login Safeguards:
- **Delay Controls:** If someone inputs an incorrect Master Password, the system logs a ** failed_login ** activity with detailed timestamps.
- **Consecutive Failures:** After 3 consecutive incorrect entries, the screen initiates an automatic **10-second defensive lock**. After 5 failures, the wait stretches to **60 seconds**, protecting from automation scripts.

#### Emergency Vault Lock
To instantly secure your files from physical compromise, click **Emergency Lock** on the dashboard. It immediately clears all cryptographic key salts from browser memory, de-allocates key buffers, and redirects to the locked login frame. 

If selected, the **Automatic Wipeout on consecutive intrusion** feature completely clears your IndexedDB instantly after 10 failed pin attempts, wiping all records to prevent offline dictionary search.`,
      tags: ['brute force', 'emergency', 'wipeout', 'audit']
    },
    {
      id: 'troubleshooting-pwa',
      category: 'faq',
      title: 'Troubleshooting: Browsing memory & IndexedDB storage',
      excerpt: 'Resolve decryption failures, out-of-storage limits, and offline capability constraints.',
      content: `### Common Troubleshooting Steps

#### Q: I see an "AES Decryption Failed" flag on an imported item. Why?
**A:** This happens if you successfully restore a backup using a password that differs from the one originally used to make that specific backup. The key derivation becomes out-of-sync. Re-import and declare the matching password.

#### Q: How can I access SecureVault Pro offline?
**A:** SecureVault Pro is designed as a standalone SPA template. Once loaded in your browser, it is 100% self-sufficient. Every button click, search query, encryption algorithm, and file downloader works in complete isolation without calling web servers.

#### Q: I hit a storage limit when uploading large UHD videos.
**A:** Browsers limit IndexedDB storage quotas based on your local memory. By default, you can store up to several hundred Megabytes. For premium performance, keep file uploads under 10MB each or compress documents beforehand. Utilize the local Storage Analytics view to prune duplicates.`,
      tags: ['limits', 'offline', 'failures', 'indexeddb']
    }
  ];

  // Filters by search query and category
  const filteredArticles = useMemo(() => {
    return articles.filter(art => {
      const matchQuery = searchQuery.trim() === '' || 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchCategory = selectedCategory === 'All' || art.category === selectedCategory;

      return matchQuery && matchCategory;
    });
  }, [searchQuery, selectedCategory]);

  const selectedArticle = articles.find(a => a.id === selectedArticleId) || articles[0];

  const categories = [
    { id: 'All', label: 'All Manuals' },
    { id: 'beginner', label: 'Beginner Manual' },
    { id: 'advanced', label: 'Advanced User Manual' },
    { id: 'security', label: 'Security Guides' },
    { id: 'backup', label: 'Backup & Restore' },
    { id: 'faq', label: 'Troubleshooting & FAQ' }
  ];

  return (
    <div className="space-y-6 text-zinc-100 animate-fadeIn min-h-screen pb-16">
      
      {/* 1. Header with search functionality */}
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute right-0 top-0 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold tracking-tight text-white uppercase">
              SecureVault Pro User Manual Center
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Learn cryptographic security protocols, rotating master databases, and setting folder level lock permissions.
          </p>
        </div>

        {/* Manual search bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search guides, codes or errors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-black/25 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 2. Main content split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Column Navigation List */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Categories Selector */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1 backdrop-blur-md">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">MANUAL SECTIONS</span>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${selectedCategory === c.id ? 'bg-blue-600 border-none text-white font-bold' : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-white/5'}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Filtered Articles Matching Search */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md space-y-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1 px-1">GUIDES AVAILABLE</span>
            
            {filteredArticles.length === 0 ? (
              <div className="text-[11px] text-zinc-500 text-center py-4">No results matching query.</div>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-thin">
                {filteredArticles.map((art) => (
                  <button
                    key={art.id}
                    onClick={() => setSelectedArticleId(art.id)}
                    className={`w-full text-left p-2 rounded-xl transition-all block text-xs border ${selectedArticleId === art.id ? 'bg-white/10 border-white/15 text-white font-semibold' : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
                  >
                    <div className="truncate mb-0.5">{art.title}</div>
                    <div className="text-[9px] text-zinc-500 truncate">{art.excerpt}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column Detailed Article Reader */}
        <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-6">
          
          {/* Article Info Header */}
          <div className="pb-4 border-b border-white/10 space-y-1.5">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full">
                {selectedArticle.category}
              </span>
              {selectedArticle.tags.map(t => (
                <span key={t} className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">
                  #{t}
                </span>
              ))}
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mt-1">{selectedArticle.title}</h1>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed italic">{selectedArticle.excerpt}</p>
          </div>

          {/* Render article markdown context elegantly */}
          <div className="text-xs text-zinc-300 leading-relaxed font-sans space-y-4">
            {selectedArticle.content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-sm font-bold text-white uppercase tracking-wider mt-4 pt-1 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>{paragraph.replace('### ', '')}</span>
                  </h3>
                );
              }
              if (paragraph.startsWith('#### ')) {
                return (
                  <h4 key={index} className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-2">{paragraph.replace('#### ', '')}</h4>
                );
              }
              if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                return (
                  <ul key={index} className="list-disc pl-5 space-y-1">
                    {paragraph.split('\n').map((li, liIndex) => (
                      <li key={liIndex}>{li.replace(/^[\s-*]+/, '')}</li>
                    ))}
                  </ul>
                );
              }
              if (paragraph.startsWith('|')) {
                // Render table
                const rows = paragraph.split('\n');
                return (
                  <div key={index} className="overflow-x-auto rounded-xl border border-white/10 my-4 bg-black/20">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10 text-zinc-400 font-bold uppercase tracking-wider">
                          <th className="p-3">Level / Scope</th>
                          <th className="p-3">Scenario</th>
                          <th className="p-3">Mechanism</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.filter(r => r.includes('|') && !r.includes(':---')).map((row, rowIndex) => {
                          const cols = row.split('|').map(c => c.trim()).filter(c => c);
                          if (rowIndex === 0) return null; // headers handled above
                          return (
                            <tr key={rowIndex} className="border-b border-white/5 hover:bg-white/5">
                              <td className="p-3 font-semibold text-white">{cols[0]}</td>
                              <td className="p-3 text-zinc-300">{cols[1]}</td>
                              <td className="p-3 text-zinc-400">{cols[2]}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              }
              return <p key={index} className="whitespace-pre-line">{paragraph}</p>;
            })}
          </div>

          {/* Quick FAQ summary guide */}
          <div className="pt-6 border-t border-white/10 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Frequently Asked Questions</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-black/25 border border-white/5">
                <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>Is my master key stored on any servers?</span>
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Absolutely not! SecureVault Pro was built around offline local privacy rules. Keys are derived dynamically in-memory and de-allocated when locking. We cannot restore your databases if you lose your password.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-black/25 border border-white/5">
                <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>Can I decrypt files on another device?</span>
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Yes, but you must first export your backup .json package and transfer it securely to that device. Then, load SecureVault Pro on that browser, upload the backup, and supply the identical Master Password to restore encryption arrays.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
