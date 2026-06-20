import React, { useState } from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import { AuthScreen } from './views/AuthScreen';
import { DashboardView } from './views/DashboardView';
import { PasswordVaultView } from './views/PasswordVaultView';
import { NotesVaultView } from './views/NotesVaultView';
import { FileVaultView } from './views/FileVaultView';
import { SettingsView } from './views/SettingsView';
import { SecurityCenterView } from './views/SecurityCenterView';
import { ThemeStudioView } from './views/ThemeStudioView';
import { UserManualView } from './views/UserManualView';
import { 
  Shield, Key, FileText, FolderOpen, Settings, LogOut, Lock, Menu, X, 
  Search, Sparkles, User, HelpCircle, HardDrive, BellRing, ChevronRight,
  BookOpen, Palette, ShieldAlert
} from 'lucide-react';
import { PasswordGenerator } from './components/PasswordGenerator';

// Inner wrapper consuming the loaded Context
const AppContent: React.FC = () => {
  const { 
    isConfigured, 
    isUnlocked, 
    authConfig, 
    lockVault, 
    searchQuery, 
    setSearchQuery, 
    isLoading,
    passwords,
    notes,
    files
  } = useVault();

  // Selected tab: 'dashboard' | 'passwords' | 'notes' | 'files' | 'settings' | 'security' | 'themes' | 'manual'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'passwords' | 'notes' | 'files' | 'settings' | 'security' | 'themes' | 'manual'>('dashboard');
  
  // Mobile drawer panel toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Floating Password Generator sidebar drawer toggle
  const [isGenDrawerOpen, setIsGenDrawerOpen] = useState(false);

  // Quick Action adding states
  const [triggerPasswordAdd, setTriggerPasswordAdd] = useState(false);

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center font-sans"
        style={{
          backgroundColor: "#050507",
          backgroundImage: "radial-gradient(circle at 0% 0%, #101428 0%, #040406 60%), radial-gradient(circle at 100% 100%, #0b152d 0%, #040406 60%)"
        }}
      >
        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl relative flex flex-col items-center justify-center mb-4 backdrop-blur-md">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl opacity-15 blur animate-pulse" />
          <Shield className="w-8 h-8 text-blue-400 relative z-10" />
        </div>
        <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-zinc-300">Initializing Core Keys...</h2>
        <p className="text-[10px] text-zinc-550 mt-1 uppercase tracking-widest font-mono">Verifying cryptography modules</p>
      </div>
    );
  }

  // Not Unlocked -> Route to authentication flow!
  // Configured check is handled directly inside the AuthScreen
  if (!isUnlocked) {
    return <AuthScreen />;
  }

  const handleQuickAdd = (type: 'password' | 'note' | 'file') => {
    if (type === 'password') {
      setActiveTab('passwords');
      // Briefly trigger adding modal
      setTimeout(() => {
        const btn = document.querySelector('[title="Add credentials"]') as HTMLButtonElement;
        if (btn) btn.click();
      }, 100);
    } else if (type === 'note') {
      setActiveTab('notes');
      setTimeout(() => {
        const btn = document.querySelector('[title="New note"]') as HTMLButtonElement;
        if (btn) btn.click();
      }, 100);
    } else if (type === 'file') {
      setActiveTab('files');
      setTimeout(() => {
        const inp = document.getElementById('vault_drag_input') as HTMLInputElement;
        if (inp) inp.click();
      }, 100);
    }
  };

  const currentTheme = authConfig?.settings?.theme || 'dark';
  const customAccent = authConfig?.settings?.customAccent || '#3b82f6';
  const customBackground = authConfig?.settings?.customBackground || 'ambient';
  const largeTextMode = authConfig?.settings?.largeTextMode || false;
  const highContrastMode = authConfig?.settings?.highContrastMode || false;
  const reducedMotionMode = authConfig?.settings?.reducedMotionMode || false;

  const navItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: <Shield className="w-4 h-4" /> },
    { id: 'passwords', label: 'Passwords Vault', icon: <Key className="w-4 h-4" />, count: passwords.length },
    { id: 'notes', label: 'Secure Notes', icon: <FileText className="w-4 h-4" />, count: notes.length },
    { id: 'files', label: 'Encrypted Files', icon: <FolderOpen className="w-4 h-4" />, count: files.length },
    { id: 'security', label: 'Security Center', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'themes', label: 'Theme Studio', icon: <Palette className="w-4 h-4" /> },
    { id: 'manual', label: 'User Manual', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'settings', label: 'Control Center', icon: <Settings className="w-4 h-4" /> },
  ] as const;

  const getBackgroundStyles = () => {
    switch (currentTheme) {
      case 'light':
        return {
          backgroundColor: '#f4f4f5',
          backgroundImage: 'none',
          color: '#18181b'
        };
      case 'amoled':
        return {
          backgroundColor: '#000000',
          backgroundImage: 'none',
          color: '#f4f4f5'
        };
      case 'blue':
        return {
          backgroundColor: '#020617',
          backgroundImage: 'radial-gradient(circle at top left, #0f172a 0%, #020617 70%)',
          color: '#f4f4f5'
        };
      case 'purple':
        return {
          backgroundColor: '#0a0516',
          backgroundImage: 'radial-gradient(circle at top left, #17092b 0%, #0a0516 70%)',
          color: '#f4f4f5'
        };
      case 'green':
        return {
          backgroundColor: '#01140e',
          backgroundImage: 'radial-gradient(circle at top left, #022217 0%, #01140e 70%)',
          color: '#f4f4f5'
        };
      case 'red':
        return {
          backgroundColor: '#120204',
          backgroundImage: 'radial-gradient(circle at top left, #200408 0%, #120204 70%)',
          color: '#f4f4f5'
        };
      case 'orange':
        return {
          backgroundColor: '#140801',
          backgroundImage: 'radial-gradient(circle at top left, #211103 0%, #140801 70%)',
          color: '#f4f4f5'
        };
      case 'dark':
      default:
        return {
          backgroundColor: '#050507',
          backgroundImage: 'radial-gradient(circle at 0% 0%, #101428 0%, #040406 60%), radial-gradient(circle at 100% 100%, #0b152d 0%, #040406 60%)',
          color: '#f4f4f5'
        };
    }
  };

  const getTextColor = () => {
    return currentTheme === 'light' ? 'text-zinc-800' : 'text-zinc-100';
  };

  const renderBackgroundEffects = () => {
    if (customBackground === 'mesh') {
      return (
        <div key="mesh-grid" className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-40 z-0" />
      );
    }
    
    if (customBackground !== 'ambient' || currentTheme === 'amoled') return null;

    let bubbleColorPrimary = 'bg-blue-500/5';
    let bubbleColorSecondary = 'bg-indigo-500/5';

    if (currentTheme === 'blue') {
      bubbleColorPrimary = 'bg-blue-600/10';
      bubbleColorSecondary = 'bg-cyan-600/5';
    } else if (currentTheme === 'purple') {
      bubbleColorPrimary = 'bg-purple-650/10';
      bubbleColorSecondary = 'bg-pink-650/5';
    } else if (currentTheme === 'green') {
      bubbleColorPrimary = 'bg-emerald-600/15';
      bubbleColorSecondary = 'bg-teal-600/10';
    } else if (currentTheme === 'red') {
      bubbleColorPrimary = 'bg-red-650/10';
      bubbleColorSecondary = 'bg-rose-650/5';
    } else if (currentTheme === 'orange') {
      bubbleColorPrimary = 'bg-orange-650/10';
      bubbleColorSecondary = 'bg-yellow-550/5';
    } else if (currentTheme === 'light') {
      bubbleColorPrimary = 'bg-zinc-300/40';
      bubbleColorSecondary = 'bg-indigo-200/30';
    }

    return (
      <>
        <div key="bub-1" className={`absolute top-[-10%] right-[-10%] w-[600px] h-[600px] ${bubbleColorPrimary} rounded-full blur-[150px] pointer-events-none`} />
        <div key="bub-2" className={`absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] ${bubbleColorSecondary} rounded-full blur-[150px] pointer-events-none`} />
      </>
    );
  };

  const dynamicBodyStyles = {
    ...getBackgroundStyles(),
    fontSize: largeTextMode ? '1.05rem' : '0.95rem'
  };

  return (
    <div 
      className={`min-h-screen font-sans flex relative overflow-hidden ${getTextColor()} ${highContrastMode ? 'high-contrast-active' : ''} ${reducedMotionMode ? 'reduced-motion-active' : ''}`}
      style={dynamicBodyStyles}
    >
      
      {/* Dynamic theme background configurations */}
      {renderBackgroundEffects()}

      {/* ===================== SIDEBAR: DESKTOP WORKSPACE NAVIGATION ===================== */}
      <aside className="w-[260px] border-r border-white/10 bg-white/5 backdrop-blur-xl hidden lg:flex flex-col justify-between shrink-0 h-screen sticky top-0 z-20">
        
        {/* Brand layout */}
        <div className="space-y-6 flex-1 flex flex-col p-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/10 flex-shrink-0">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative">
              <Shield className="w-5 h-5 text-blue-400 relative z-10" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5 leading-none">
                <span>SecureVault</span>
                <span className="text-[10px] bg-blue-600 text-white rounded px-1.5 py-0.5 font-bold select-none">PRO</span>
              </div>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">v2.0 Premium Upgrade</span>
            </div>
          </div>

          {/* Quick Search controls in sidebar */}
          <div className="relative text-xs">
            <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Instant query hub..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Navigation link directories */}
          <nav className="space-y-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">SECURITY VAULTS</span>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSearchQuery('');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all select-none cursor-pointer border ${item.id === activeTab ? 'bg-white/10 border-white/15 text-white shadow-lg backdrop-blur-sm' : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`${item.id === activeTab ? 'text-blue-400' : 'text-zinc-500'}`}>
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </div>
                {'count' in item && (item.count ?? 0) > 0 && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${item.id === activeTab ? 'bg-blue-600 text-white' : 'bg-white/5 text-zinc-500 border border-white/5'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* User Identity profile and session terminators */}
        <div className="p-5 border-t border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-blue-400 font-bold text-xs shrink-0 select-none">
                {authConfig?.profile?.name?.substring(0, 2).toUpperCase() || 'SA'}
              </div>
              <div className="truncate pr-1">
                <h4 className="text-xs font-bold text-zinc-200 truncate leading-none">{authConfig?.profile?.name || 'Local User'}</h4>
                <span className="text-[10px] text-zinc-550 truncate block mt-1">Authorized Profile</span>
              </div>
            </div>
            
            <button
              onClick={() => setIsGenDrawerOpen(true)}
              title="Launch Password Generator Drawer"
              className="p-1 px-1.5 rounded-md hover:bg-white/5 text-zinc-500 hover:text-blue-400 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              if (confirm('Lock local vault credentials session?')) {
                lockVault();
              }
            }}
            className="w-full py-2.5 px-4 bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 font-semibold border border-white/10 hover:border-red-500/20 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Database</span>
          </button>
        </div>
      </aside>

      {/* ===================== CANVAS FRAME: MAIN LAYOUT CONTAINER ===================== */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
        
        {/* Upper responsive Top Bar */}
        <header className="h-[64px] border-b border-white/10 px-4 md:px-6 flex items-center justify-between bg-white/5 backdrop-blur-md shrink-0 relative z-10 select-none">
          {/* Mobile drawer toggle */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-zinc-350 hover:text-white cursor-pointer"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>SecureVault</span>
              <span className="text-[10px] bg-blue-600 text-white rounded px-1.5 py-0.5 font-bold select-none">PRO</span>
            </h1>
          </div>

          {/* Tab titles breadcrumbs layout */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs text-zinc-550 uppercase tracking-widest">Workspace Directory</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-white capitalize">{activeTab}</span>
          </div>

          {/* Header controls sidebar flags */}
          <div className="flex items-center gap-3">
            
            {/* Quick launcher key generators */}
            <button
              onClick={() => setIsGenDrawerOpen(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-blue-400 cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Key className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Generator</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Lock local vault?')) {
                  lockVault();
                }
              }}
              title="Lock Vault"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-red-400 cursor-pointer transition-colors"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic sub-view container */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
          {activeTab === 'dashboard' && (
            <DashboardView 
              onNavigate={(tab) => setActiveTab(tab as any)} 
              onQuickAdd={handleQuickAdd}
              openPasswordGenerator={() => setIsGenDrawerOpen(true)}
            />
          )}
          {activeTab === 'passwords' && <PasswordVaultView />}
          {activeTab === 'notes' && <NotesVaultView />}
          {activeTab === 'files' && <FileVaultView />}
          {activeTab === 'security' && <SecurityCenterView />}
          {activeTab === 'themes' && <ThemeStudioView />}
          {activeTab === 'manual' && <UserManualView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>

      </div>

      {/* ===================== DRAWER: RESPONSIVE MOBILE ACCESSIBILITY ===================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden animate-fadeIn select-none">
          {/* Backdrop screen lock mask */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          />
          
          <div className="absolute top-0 left-0 w-[260px] h-full bg-[#05060d]/95 border-r border-white/10 p-5 flex flex-col justify-between backdrop-blur-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-bold text-white">SecureVault Pro</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 px-2 text-[10px] font-mono border border-white/10 rounded-lg text-zinc-500 hover:text-white"
                >
                  Close
                </button>
              </div>

              {/* Mobile links directories */}
              <nav className="space-y-1.5">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide border ${item.id === activeTab ? 'bg-white/10 border-white/15 text-white' : 'bg-transparent border-transparent text-zinc-400'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`${item.id === activeTab ? 'text-blue-400' : 'text-zinc-500'}`}>
                        {item.icon}
                      </div>
                      <span>{item.label}</span>
                    </div>
                    {'count' in item && (item.count ?? 0) > 0 && (
                      <span className="text-[10px] font-mono font-bold bg-white/5 text-zinc-500 border border-white/5 px-1.5 py-0.2 rounded-full">
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Mobile Footer identity indices */}
            <div className="space-y-4">
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-white/5 border border-white/10 font-bold font-sans text-xs flex items-center justify-center text-blue-400 inline-block select-none leading-none shrink-0">
                  {authConfig?.profile?.name?.substring(0, 2).toUpperCase() || 'SA'}
                </div>
                <div className="truncate shrink-0 max-w-[130px]">
                  <h4 className="text-xs font-bold text-white leading-none truncate">{authConfig?.profile?.name || 'Local User'}</h4>
                  <span className="text-[9px] text-zinc-550 truncate block mt-1">{authConfig?.profile?.email}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  lockVault();
                }}
                className="w-full py-2.5 bg-white/5 border border-white/10 text-zinc-400 hover:text-red-400 font-bold rounded-xl text-xs uppercase"
              >
                Lock Database Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SLIDING BAR DRAWER: FLOATING GENERAL PASSWORD GENERATOR ===================== */}
      {isGenDrawerOpen && (
        <div className="fixed inset-0 z-40 animate-fadeIn select-none">
          <div 
            onClick={() => setIsGenDrawerOpen(false)}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm" 
          />
          <div className="absolute top-0 right-0 w-full sm:w-[380px] h-full bg-zinc-900 border-l border-zinc-800 p-6 shadow-2xl flex flex-col max-h-screen">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-805 shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Cryptosec Key Generator</h3>
              <button
                onClick={() => setIsGenDrawerOpen(false)}
                className="p-1 px-3 text-[10px] font-mono border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300"
              >
                Close Drawer
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6">
              <div className="mb-4 text-xs text-zinc-555 leading-relaxed">
                Need a robust password immediately? Generate complex key patterns and copy them to your clipboard instantly from this floating drawer widget.
              </div>
              <PasswordGenerator />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default function App() {
  return (
    <VaultProvider>
      <AppContent />
    </VaultProvider>
  );
}
