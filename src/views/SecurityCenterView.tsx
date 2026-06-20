import React, { useState, useMemo, useEffect } from 'react';
import { useVault } from '../context/VaultContext';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Play, Shield, 
  Trash2, RefreshCw, Key, ShieldX, Smartphone, Clock, Database, Lock,
  ChevronDown, ChevronUp, Download, CheckCircle2, User, HelpCircle, HardDrive
} from 'lucide-react';
import { checkPasswordStrength } from '../utils/crypto';

export const SecurityCenterView: React.FC = () => {
  const { 
    passwords, 
    notes, 
    files, 
    activities, 
    authConfig, 
    decryptItem, 
    lockVault 
  } = useVault();

  const [isAuditing, setIsAuditing] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  
  // Decrypted states for diagnostic analysis
  const [decryptedPasswords, setDecryptedPasswords] = useState<Array<{ id: string; title: string; decryptedPass: string; score: number; text: string; color: string; website: string; username: string }>>([]);
  const [reusedPassList, setReusedPassList] = useState<Array<{ passwordValue: string; accounts: string[]; count: number }>>([]);
  const [weakPassList, setWeakPassList] = useState<Array<{ id: string; title: string; score: number; reason: string }>>([]);

  // Mock scan trigger
  const runSecurityAudit = async () => {
    setIsAuditing(true);
    setScanStatus('Initializing Cryptographic Scanners...');
    
    // Simulate real calculations
    await new Promise(resolve => setTimeout(resolve, 500));
    setScanStatus('Scanning IndexedDB Vault Keys...');
    
    const auditedList: typeof decryptedPasswords = [];
    const weakList: typeof weakPassList = [];
    const passwordsMapping: { [plainVal: string]: string[] } = {};

    // Decrypt passwords safely in memory for audit
    for (let i = 0; i < passwords.length; i++) {
      const p = passwords[i];
      setScanStatus(`Decrypting Credentials ${i + 1}/${passwords.length}...`);
      try {
        const pPlain = p.encryptedPassword ? await decryptItem(p.encryptedPassword) : '';
        const strength = checkPasswordStrength(pPlain);
        
        auditedList.push({
          id: p.id,
          title: p.title,
          decryptedPass: pPlain,
          score: strength.score,
          text: strength.text,
          color: strength.color,
          website: p.website,
          username: p.username
        });

        // Track weak
        if (strength.score < 3) {
          weakList.push({
            id: p.id,
            title: p.title,
            score: strength.score,
            reason: strength.suggestions[0] || 'Short password length.'
          });
        }

        // Track reused
        if (pPlain) {
          if (!passwordsMapping[pPlain]) {
            passwordsMapping[pPlain] = [];
          }
          passwordsMapping[pPlain].push(p.title);
        }
      } catch (err) {
        console.error('Core Auditor Decrypt error:', err);
      }
    }

    setScanStatus('Analyzing Password Reuse Vectors...');
    await new Promise(resolve => setTimeout(resolve, 300));

    // Compiling reused list
    const reusedListCompiled: typeof reusedPassList = [];
    Object.keys(passwordsMapping).forEach(pass => {
      if (passwordsMapping[pass].length > 1) {
        reusedListCompiled.push({
          passwordValue: '••••••••', // Mask value for visual safety
          accounts: passwordsMapping[pass],
          count: passwordsMapping[pass].length
        });
      }
    });

    setDecryptedPasswords(auditedList);
    setWeakPassList(weakList);
    setReusedPassList(reusedListCompiled);
    setIsAuditing(false);
    setHasScanned(true);
  };

  // Auto audit if scans was never completed and passwords are zero or simple
  useEffect(() => {
    if (passwords.length === 0) {
      setHasScanned(true);
    }
  }, [passwords]);

  // Calculate detailed security score budget (0-100)
  const securityScore = useMemo(() => {
    let score = 40; // Default base starting points

    // Add weights for robust config
    if (authConfig?.settings?.autoLockEnabled) score += 15;
    if (authConfig?.settings?.pinLockEnabled) score += 15;
    if (authConfig?.settings?.securityRecoveryEnabled) score += 15;
    if (authConfig?.settings?.securityLevel === 'high') score += 15;

    // Password auditing parameters
    if (hasScanned && passwords.length > 0) {
      // Deduct points for weak accounts
      const weakRatio = weakPassList.length / passwords.length;
      score -= Math.round(weakRatio * 35);

      // Deduct points for reuse
      const reuseRatio = reusedPassList.length / passwords.length;
      score -= Math.round(reuseRatio * 25);
    }

    return Math.max(0, Math.min(100, score));
  }, [authConfig, hasScanned, weakPassList, reusedPassList, passwords]);

  // Generate dynamic recommendations list
  const securityRecommendations = useMemo(() => {
    const list: Array<{ title: string; desc: string; type: 'critical' | 'warn' | 'optimal' }> = [];

    if (!authConfig?.settings?.pinLockEnabled) {
      list.push({
        title: 'Configure Secure Unlock PIN',
        desc: 'Activating a 4/6-digit PIN lock speeds up vault entry while preserving GCM-AES memory segments.',
        type: 'warn'
      });
    }

    if (!authConfig?.settings?.autoLockEnabled || authConfig?.settings?.autoLockMinutes === 0) {
      list.push({
        title: 'Enable Auto-Lock Timer Limit',
        desc: 'Your vault is configured to stay decrypted indefinitely. Prevent physical intrusions by enabling short auto-lock cycles (e.g. 5 mins).',
        type: 'critical'
      });
    }

    if (authConfig?.settings?.securityLevel !== 'high') {
      list.push({
        title: 'Upgrade Global Security Level',
        desc: 'Switch your default catalog protection to High and enforce mandatory secondary validations before views.',
        type: 'optimal'
      });
    }

    if (hasScanned && weakPassList.length > 0) {
      list.push({
        title: `Replace ${weakPassList.length} Weak Credentials`,
        desc: 'Audit discovers weak master keys under severe hazard checks. Regenerate utilizing the Key Generator.',
        type: 'critical'
      });
    }

    if (hasScanned && reusedPassList.length > 0) {
      list.push({
        title: `Mitigate ${reusedPassList.length} Reused Passwords`,
        desc: 'Multiple credential cards share exact decrypted sequences. Create exclusive unique strings for credit safety.',
        type: 'warn'
      });
    }

    if (list.length === 0) {
      list.push({
        title: 'All Core Safeguards Optimal',
        desc: 'Your cryptographic score is pristine. You maintain high standards of digital credentials safety.',
        type: 'optimal'
      });
    }

    return list;
  }, [authConfig, hasScanned, weakPassList, reusedPassList]);

  // Emergency instant wipe functions
  const handleImmediateReset = () => {
    if (confirm('🚨 EMERGENCY WARNING! This will completely destroy the local memory cache and redirect to the login screen immediately! Do you wish to lock?')) {
      lockVault();
    }
  };

  return (
    <div className="space-y-6 text-zinc-100 animate-fadeIn min-h-screen pb-16">
      
      {/* Upper header banner containing scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Dynamic Security Score Card */}
        <div className="md:col-span-1 p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col justify-between relative overflow-hidden backdrop-blur-md">
          <div className="absolute right-[-10%] top-[-10%] w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-1.5 z-10">
            <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">SECURITY SHIELD CAPACITY</span>
            <h3 className="text-sm font-bold text-white">Dynamic Cryptographic Score</h3>
          </div>

          {/* Graphical Score Meter */}
          <div className="my-6 flex items-center justify-center relative">
            <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-4 border-white/5 bg-black/10">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin opacity-20" />
              <div className="text-center">
                <span className="text-4xl font-extrabold text-white tracking-tight">{securityScore}</span>
                <span className="text-[10px] block text-zinc-500 uppercase tracking-widest font-mono mt-0.5">out of 100</span>
              </div>
            </div>
          </div>

          <div className="text-center z-10">
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${securityScore >= 80 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : securityScore >= 50 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {securityScore >= 80 ? 'Fortress Optimal Security' : securityScore >= 50 ? 'Medium Shield Health' : 'Critical Hazard Vulnerabilities'}
            </span>
          </div>
        </div>

        {/* Audit Dashboard summary scanner */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col justify-between backdrop-blur-md relative">
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <span>Password Health Dashboard Scanner</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Verify credentials status on-demand. SecureVault Pro computes PBKDF2 hash cycles locally, evaluates length complexity, detects weak character structures, and warns you of credential sharing duplicates.
            </p>
          </div>

          {/* Progress display and action */}
          <div className="my-4">
            {isAuditing ? (
              <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
                <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">{scanStatus}</p>
              </div>
            ) : hasScanned ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                  <div className="text-[9px] text-zinc-500 uppercase">Weak Secrets</div>
                  <div className="text-base font-bold text-red-400 mt-1">{weakPassList.length} Accounts</div>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                  <div className="text-[9px] text-zinc-500 uppercase">Reused Keys</div>
                  <div className="text-base font-bold text-orange-400 mt-1">{reusedPassList.length} Sequences</div>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                  <div className="text-[9px] text-zinc-500 uppercase">Strong/Excellent</div>
                  <div className="text-base font-bold text-blue-400 mt-1">
                    {decryptedPasswords.filter(p => p.score >= 3).length} Accounts
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-black/15 border border-white/5 text-center text-xs text-zinc-500">
                Audit scanner idle. Trigger live analysis below.
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={runSecurityAudit}
              disabled={isAuditing}
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{hasScanned ? 'Run New Security Audit' : 'Scan Password Health'}</span>
            </button>
            <button
              onClick={handleImmediateReset}
              className="py-2.5 px-4 bg-red-950/40 hover:bg-red-900 border border-red-500/20 text-red-400 hover:text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer ml-auto transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>EMERGENCY LOCK WALLET</span>
            </button>
          </div>
        </div>

      </div>

      {/* Security Levels Information Grid */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Dynamic Vault Security Levels</h3>
        <p className="text-xs text-zinc-400">
          Enforce different guard levels across credential entities, files, and notes. Highlight protection structures inside sub-tabs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-black/25 border border-white/5 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-xs font-bold text-zinc-100">Low Security</span>
              <span className="text-[10px] uppercase font-bold text-zinc-400">Score 1/5</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Optimal for public website references or unsensitive documents requiring quick loading schedules. No additional locks enforced.
            </p>
            <div className="text-[10px] font-mono text-zinc-500">
              <strong>Features:</strong> Standard decryption, instant previews.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/25 border border-white/5 bg-blue-500/5 border-blue-500/10 space-y-3 animate-pulse-slow">
            <div className="flex justify-between items-center pb-2 border-b border-blue-500/10">
              <span className="text-xs font-bold text-blue-400">Medium Security</span>
              <span className="text-[10px] uppercase font-bold text-blue-405">Score 3/5</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Standard shield settings. Enforces automatic inactivity logs timeout operations. Fits corporate portals, email clients, and documents.
            </p>
            <div className="text-[10px] font-mono text-zinc-500">
              <strong>Features:</strong> Delay metrics, in-memory obfuscation lists.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/25 border border-white/5 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-xs font-bold text-indigo-400">High Security</span>
              <span className="text-[10px] uppercase font-bold text-indigo-455">Score 5/5</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Maximum armor checks. Prohibits direct indexing previews. Demands typing of Master Passcode and validation checks constantly.
            </p>
            <div className="text-[10px] font-mono text-zinc-500">
              <strong>Features:</strong> Dual-Key locks, no temporary caching logs.
            </div>
          </div>
        </div>
      </div>

      {/* Dual Panel layouts: Weak & Reused credentials lists vs Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column Diagnostic Cards */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Weak List */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Weak Password Detection</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono font-bold">
                {weakPassList.length} Found
              </span>
            </div>

            {weakPassList.length === 0 ? (
              <div className="text-zinc-500 text-xs py-8 text-center bg-black/10 rounded-xl">
                {hasScanned ? 'Zero weak passwords detected. Cryptographic credentials optimal.' : 'Execute Security Scan above to parse account levels.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-thin">
                {weakPassList.map((weak) => (
                  <div key={weak.id} className="p-3 bg-black/25 rounded-xl border border-white/5 flex justify-between items-center animate-fadeIn">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-zinc-200">{weak.title}</div>
                      <div className="text-[10px] text-zinc-500">{weak.reason}</div>
                    </div>
                    <div className="text-[10px] font-bold text-red-400 bg-red-500/15 border border-red-500/20 rounded-md px-2 py-1 uppercase tracking-wide">
                      Risk Level
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reused List */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Reused Password Detection</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono font-bold">
                {reusedPassList.length} Violations
              </span>
            </div>

            {reusedPassList.length === 0 ? (
              <div className="text-zinc-500 text-xs py-8 text-center bg-black/10 rounded-xl">
                {hasScanned ? 'Unique sequences verified across saved vaults profiles.' : 'Execute Security Scan above to audit duplications.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-thin">
                {reusedPassList.map((re, index) => (
                  <div key={index} className="p-3 bg-black/25 rounded-xl border border-white/5 space-y-2 animate-fadeIn">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-200 font-mono">{re.passwordValue}</span>
                      <span className="text-[10px] font-bold text-orange-400">{re.count} Accounts share this</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {re.accounts.map(acc => (
                        <span key={acc} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-medium">
                          {acc}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column Action Recommendations */}
        <div className="space-y-6">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Security Recommendations</h3>
            
            <div className="space-y-3">
              {securityRecommendations.map((rec, index) => (
                <div 
                  key={index} 
                  className={`p-3.5 rounded-xl border space-y-1.5 ${rec.type === 'critical' ? 'bg-red-500/5 border-red-500/20 text-zinc-200' : rec.type === 'warn' ? 'bg-orange-500/5 border-orange-500/20 text-zinc-200' : 'bg-blue-500/5 border-blue-500/25 text-zinc-200'}`}
                >
                  <h4 className="text-xs font-bold flex items-center gap-1.5">
                    {rec.type === 'critical' ? (
                      <ShieldX className="w-4 h-4 text-red-500 shrink-0" />
                    ) : rec.type === 'warn' ? (
                      <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                    <span>{rec.title}</span>
                  </h4>
                  <p className="text-[11px] text-zinc-450 leading-relaxed font-sans">{rec.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Simulated Active Device Activity Indicators */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Device Activity Monitoring</span>
            </h3>
            
            <div className="space-y-3 text-xs text-zinc-400">
              <div className="p-3 bg-black/25 rounded-xl border border-white/5 space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-white">Active Session Platform</span>
                  <span className="text-blue-400 font-bold">ONLINE</span>
                </div>
                <div className="text-[10px] space-y-1 text-zinc-500 font-mono">
                  <div>Browser agent: {navigator.userAgent.substring(0, 48)}...</div>
                  <div>IP Address: Local Loopback Index</div>
                  <div>System: Local Crypto Core v1.2</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
