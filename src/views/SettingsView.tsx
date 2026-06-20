import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import { 
  Settings, User, Lock, Key, Shield, HardDrive, HelpCircle, AlertTriangle, 
  Trash2, Download, Upload, Check, RefreshCw, Smartphone, Eye, EyeOff, Layout, Globe
} from 'lucide-react';
import { checkPasswordStrength } from '../utils/crypto';

export const SettingsView: React.FC = () => {
  const { 
    authConfig, 
    updateSettings, 
    updateProfile, 
    changePassword, 
    changePin, 
    exportVault, 
    importVault, 
    factoryReset 
  } = useVault();

  // Profile Form States
  const [profName, setProfName] = useState(authConfig?.profile?.name || '');
  const [profEmail, setProfEmail] = useState(authConfig?.profile?.email || '');
  const [profPhone, setProfPhone] = useState(authConfig?.profile?.phone || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password Rotation states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // PIN Rotation States
  const [oldPinValue, setOldPinValue] = useState('');
  const [newPinValue, setNewPinValue] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  // Backup & Import states
  const [isExporting, setIsExporting] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [showImportPassword, setShowImportPassword] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2>(1); // 1: upload json, 2: unlock password
  const [importError, setImportError] = useState('');

  // Save Settings Indicators
  const [prefsSuccess, setPrefsSuccess] = useState(false);

  // Handle profile saves
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(false);
    if (!profName || !profEmail || !profPhone) return;

    await updateProfile({
      name: profName,
      email: profEmail,
      phone: profPhone
    });
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 2000);
  };

  // Change master password
  const handleChangeMasterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== newPasswordConfirm) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    const success = await changePassword(oldPassword, newPassword);
    if (success) {
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } else {
      setPasswordError('Mismatched old password key. Verification failed.');
    }
  };

  // Configure fast PIN unlock
  const handleSavePinSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinSuccess(false);
    
    // validation
    if (newPinValue && (newPinValue.length !== 4 && newPinValue.length !== 6)) {
      alert('PIN must be exactly 4 or 6 numeric digits.');
      return;
    }

    const success = await changePin(newPinValue || null);
    if (success) {
      setPinSuccess(true);
      setNewPinValue('');
      setOldPinValue('');
      setTimeout(() => setPinSuccess(false), 2000);
    }
  };

  // Trigger JSON file downloads
  const handleTriggerExport = async () => {
    setIsExporting(true);
    try {
      const payload = await exportVault();
      
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `securevault_pro_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (_) {
      alert('Failed to construct secure output archives.');
    } finally {
      setIsExporting(false);
    }
  };

  // Process selected backup files
  const handleImportFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const contents = evt.target?.result as string;
          // check if parseable json
          JSON.parse(contents);
          setImportJson(contents);
          setImportStep(2); // move onwards to password unlock
        } catch (_) {
          setImportError('Invalid backup file. Extension formatting must be clean JSON.');
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  const handleExecuteImportRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    if (!importJson || !importPassword) return;

    try {
      const success = await importVault(importJson, importPassword);
      if (success) {
        alert('Vault imported successfully! All modules have synced.');
        setImportJson('');
        setImportPassword('');
        setImportStep(1);
        // hard reload to fresh setup
        window.location.reload();
      } else {
        setImportError('Mismatched Master Password for this backup. Decryption failed.');
      }
    } catch (_) {
      setImportError('Corruption detected inside file backup structures.');
    }
  };

  // Wipe IndexedDB
  const handleTriggerWipeout = async () => {
    if (confirm('CRITICAL WARNING!\nThis will permanently wipeout and erase all encrypt credentials, notes, documents, and files stored inside this browser vault.\nThis action is absolute and IRREVERSIBLE.\n\nAre you sure you want to run a complete factory reset?')) {
      const code = prompt('To confirm factory wipeout, please type: "RESET VAULT"');
      if (code === 'RESET VAULT') {
        await factoryReset();
        alert('Vault factory reset successfully completed.');
        window.location.reload();
      } else {
        alert('Reset aborted.');
      }
    }
  };

  const passStrengthConfig = checkPasswordStrength(newPassword);

  return (
    <div className="space-y-6 text-zinc-105 animate-fadeIn max-w-4xl mx-auto pb-12">
      
      {/* Upper header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-405 font-bold" />
          <span>Settings & Security Center</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-1">Configure profile details, rotate encryption keys, manage fast PIN locks, and export offline backup modules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT NAV PANEL TAB LINKS - FOR CLEAN NAVIGATION SCROLL */}
        <div className="space-y-2 border-r border-white/10 pr-4 hidden md:block">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">CONFIGURATION DIRECTORIES</span>
          <a href="#vault-profile" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-zinc-350 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all select-none">
            <User className="w-4 h-4 text-blue-400" />
            <span>Profile Identity</span>
          </a>
          <a href="#vault-keys" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-zinc-350 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all select-none">
            <Lock className="w-4 h-4 text-blue-400" />
            <span>Key Rotation</span>
          </a>
          <a href="#vault-pin" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-zinc-350 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all select-none">
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span>Unlock PIN lock</span>
          </a>
          <a href="#vault-backup" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-zinc-350 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all select-none">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span>Backups & Restores</span>
          </a>
          <a href="#vault-advanced" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-red-400 hover:text-red-300 hover:bg-white/5 border border-transparent hover:border-white/5 transition-all select-none col-span-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span>Advanced Wipeout</span>
          </a>
        </div>

        {/* SECURE VIEW FORMS CONTAINER */}
        <div className="md:col-span-2 space-y-6">
          
          {/* 1. Profile management */}
          <div id="vault-profile" className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 shadow-md backdrop-blur-md scroll-mt-6 hover:bg-white/10 transition-all">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-4.5 h-4.5 text-blue-400" />
              <span>Security Profile</span>
            </h3>

            {profileSuccess && (
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-450 text-xs flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 text-blue-400" />
                <span>Profile metadata modified successfully. Sync complete.</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">User Name</label>
                  <input
                    type="text"
                    required
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    className="w-full text-sm bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={profPhone}
                    onChange={(e) => setProfPhone(e.target.value)}
                    className="w-full text-sm bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Security Email Address</label>
                <input
                  type="email"
                  required
                  value={profEmail}
                  onChange={(e) => setProfEmail(e.target.value)}
                  className="w-full text-sm bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white border-none rounded-xl text-xs font-semibold cursor-pointer transition-all uppercase"
              >
                Update Profile details
              </button>
            </form>
          </div>

          {/* 2. Key rotation changer */}
          <div id="vault-keys" className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 shadow-md backdrop-blur-md scroll-mt-6 hover:bg-white/10 transition-all">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4.5 h-4.5 text-blue-400" />
              <span>Rotate Master Encryption password</span>
            </h3>

            {passwordSuccess && (
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 text-blue-400" />
                <span>Rotation code complete! All stored log, note, directory files have been encrypted using the fresh key.</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3.5 rounded-xl bg-red-955/40 border border-red-900/50 text-red-400 text-xs animate-shake">
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangeMasterPassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Current Master Password</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full text-sm bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">New Master Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-sm bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    className="w-full text-sm bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>

              {newPassword && (
                <div className="p-3 bg-black/25 border border-white/10 rounded-xl space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-550 lowercase">Fresh Key entropy health</span>
                    <span className="font-semibold text-blue-400">{passStrengthConfig.text}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${passStrengthConfig.color}`} style={{ width: `${(passStrengthConfig.score + 1) * 20}%` }} />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 uppercase transition-colors border-none"
              >
                <Key className="w-3.5 h-3.5 text-white" />
                <span>Trigger Safe Rotation</span>
              </button>
            </form>
          </div>

          {/* 3. PIN Lock setup */}
          <div id="vault-pin" className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 shadow-md backdrop-blur-md scroll-mt-6 hover:bg-white/10 transition-all">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4.5 h-4.5 text-indigo-400" />
              <span>Unlock PIN lock</span>
            </h3>

            {pinSuccess && (
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-400" />
                <span>Unlock PIN config altered successfully.</span>
              </div>
            )}

            <form onSubmit={handleSavePinSetup} className="space-y-4">
              <p className="text-xs text-zinc-400">Configure a 4 OR 6 digit PIN lock for fast session resume. If left blank, PIN unlock will deactivate.</p>
              
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">New PIN value (Only Numbers)</label>
                <input
                  type="password"
                  maxLength={6}
                  pattern="[0-9]*"
                  placeholder="Leave empty to disable PIN"
                  value={newPinValue}
                  onChange={(e) => setNewPinValue(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full text-sm bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-zinc-205 focus:outline-none placeholder:text-zinc-650 tracking-widest text-center max-w-[200px]"
                />
              </div>

              <button
                type="submit"
                className="py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Save PIN Lock settings
              </button>
            </form>
          </div>

          {/* 4. Complete backup exports & imports */}
          <div id="vault-backup" className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 shadow-md backdrop-blur-md scroll-mt-6 hover:bg-white/10 transition-all">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-4.5 h-4.5 text-blue-400 font-bold" />
              <span>Encrypted Backup & Recovery</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* EXPORT DIRECT */}
              <div className="p-4 rounded-xl bg-black/25 border border-white/10 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Export Entire Vault</h4>
                  <p className="text-[11px] text-zinc-405 mt-1 leading-relaxed">
                    Downloads a secure `.json` file containing all passwords, directories, metadata codes, and files protected by your Master password. Keep this file incredibly safe!
                  </p>
                </div>
                <button
                  onClick={handleTriggerExport}
                  disabled={isExporting}
                  className="w-full py-2.5 px-3.5 bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors border-none"
                >
                  {isExporting ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Download className="w-4 h-4 text-white" />}
                  <span>Download Backup File</span>
                </button>
              </div>

              {/* IMPORT DIRECT */}
              <div className="p-4 rounded-xl bg-black/25 border border-white/10 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Restore backup package</h4>
                  <p className="text-[11px] text-zinc-405 mt-1 leading-relaxed">
                    Recover previous data by uploading your secure backup file. Decryption and restoration will verify and prompt on-demand.
                  </p>
                </div>

                {importError && (
                  <p className="text-[11px] text-red-400 font-semibold leading-normal animate-shake">{importError}</p>
                )}

                {importStep === 1 ? (
                  <label className="w-full py-2.5 px-3.5 bg-zinc-800 hover:bg-zinc-705 text-xs font-bold text-zinc-200 hover:text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-white/5">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>Upload backup (.json)</span>
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleImportFileSelected}
                      className="hidden" 
                    />
                  </label>
                ) : (
                  <form onSubmit={handleExecuteImportRestore} className="space-y-2 animate-fadeIn">
                    <div className="relative">
                      <input
                        type={showImportPassword ? 'text' : 'password'}
                        required
                        placeholder="Master password of backup..."
                        value={importPassword}
                        onChange={(e) => setImportPassword(e.target.value)}
                        className="w-full text-xs bg-black/30 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowImportPassword(!showImportPassword)}
                        className="absolute right-2 top-2 text-zinc-400 hover:text-white"
                      >
                        {showImportPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setImportStep(1);
                          setImportJson('');
                          setImportPassword('');
                        }}
                        className="py-1.5 px-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg border border-white/10 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg border-none cursor-pointer"
                      >
                        Unlock & Import
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* 5. Complete Wipeout Factory controls */}
          <div id="vault-advanced" className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-4 shadow-md backdrop-blur-md scroll-mt-6 hover:bg-red-500/10 transition-all duration-300">
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-red-550" />
              <span>Advanced Factory Wipeout</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Erases and deletes every record in IndexedDB completely. This can only be recovered if you maintain external unencrypted backup files. This deactivates your credentials totally.
            </p>
            <button
              onClick={handleTriggerWipeout}
              className="py-2.5 px-4 bg-red-950/40 border border-red-500/30 hover:bg-red-900 text-red-250 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Wipe Vault Databases Completely</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
