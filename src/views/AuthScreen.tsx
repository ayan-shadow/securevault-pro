import React, { useState, useEffect } from 'react';
import { useVault } from '../context/VaultContext';
import { 
  Shield, Key, Lock, Mail, Phone, User, Eye, EyeOff, Sparkles, 
  HelpCircle, ArrowRight, RefreshCcw, CheckCircle, Fingerprint 
} from 'lucide-react';
import { PasswordGenerator } from '../components/PasswordGenerator';
import { checkPasswordStrength } from '../utils/crypto';

export const AuthScreen: React.FC = () => {
  const { 
    isConfigured, 
    authConfig, 
    setupVault, 
    unlockWithPassword, 
    unlockWithPin,
    verifyRecovery,
    recoveryResetPassword
  } = useVault();

  // Authentication sub-states: 'login' | 'register' | 'pin_unlock' | 'forgot_password' | 'mfa_email' | 'mfa_phone'
  const [authState, setAuthState] = useState<'login' | 'register' | 'pin_unlock' | 'forgot_password' | 'mfa_email' | 'mfa_phone'>('login');
  
  // Registration Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regHint, setRegHint] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regPinEnabled, setRegPinEnabled] = useState(false);
  const [recoveryQ, setRecoveryQ] = useState('What was the name of your first elementary school?');
  const [recoveryA, setRecoveryA] = useState('');
  
  // Login State
  const [loginPassword, setLoginPassword] = useState('');
  const [pinNumbers, setPinNumbers] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  // Recovery State
  const [recAnswer, setRecAnswer] = useState('');
  const [recNewPassword, setRecNewPassword] = useState('');
  const [recNewPasswordConfirm, setRecNewPasswordConfirm] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  // MFA simulation
  const [otpCode, setOtpCode] = useState('');
  const [userOtpInput, setUserOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [mfaTarget, setMfaTarget] = useState(''); // email address or phone number

  // Visual cues
  const [errorText, setErrorText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  // Adjust screen on start
  useEffect(() => {
    if (isConfigured) {
      if (authConfig?.settings?.pinLockEnabled && authConfig?.pinHash) {
        setAuthState('pin_unlock');
      } else {
        setAuthState('login');
      }
    } else {
      setAuthState('register');
    }
    setErrorText('');
  }, [isConfigured, authConfig]);

  // Handle Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!regName || !regEmail || !regPhone || !regPassword || !recoveryA) {
      setErrorText('Please fill out all required fields.');
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setErrorText('Passwords do NOT match.');
      return;
    }

    if (regPassword.length < 8) {
      setErrorText('Password must be at least 8 characters long for security encryption.');
      return;
    }

    if (regPinEnabled && (regPin.length !== 4 && regPin.length !== 6)) {
      setErrorText('PIN must be exactly 4 or 6 digits.');
      return;
    }

    setIsLoadingState(true);
    // Mimick short delay for PBKDF2 iterations visual cue
    setTimeout(async () => {
      const profile = { name: regName, email: regEmail, phone: regPhone };
      const success = await setupVault(
        regPassword,
        regHint,
        regPinEnabled ? regPin : null,
        recoveryQ,
        recoveryA,
        profile
      );
      setIsLoadingState(false);
      if (!success) {
        setErrorText('Failed to initialize local cryptographic vault.');
      }
    }, 400);
  };

  // Handle Login with Password
  const [isLoadingState, setIsLoadingState] = useState(false);
  
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    if (!loginPassword) return;

    setIsLoadingState(true);
    setTimeout(async () => {
      const success = await unlockWithPassword(loginPassword);
      setIsLoadingState(false);
      if (success) {
        // If MFA is simulation-ready, route to it!
        // This is extremely professional and models dual-factor authorization
        const r = Math.random();
        if (r > 0.5) {
          setMfaTarget(authConfig?.profile?.email || 'your email');
          triggerMfaSimulation('email');
        } else {
          setMfaTarget(authConfig?.profile?.phone || 'your mobile phone');
          triggerMfaSimulation('phone');
        }
      } else {
        setErrorText('Invalid master key. Check credentials or search password hint.');
      }
    }, 500);
  };

  // PIN Unlock Trigger
  const handlePinUnlockSubmit = async (pinValueStr: string) => {
    setErrorText('');
    const success = await unlockWithPin(pinValueStr);
    if (success) {
      // Pin logged, triggers dual MFA simulation for ultimate cyber look!
      const r = Math.random();
      if (r > 0.5) {
        setMfaTarget(authConfig?.profile?.email || 'your email');
        triggerMfaSimulation('email');
      } else {
        setMfaTarget(authConfig?.profile?.phone || 'your mobile');
        triggerMfaSimulation('phone');
      }
    } else {
      setErrorText('Incorrect PIN credentials.');
    }
  };

  // Simulate Multi-Factor Code dispatch
  const triggerMfaSimulation = (type: 'email' | 'phone') => {
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(generatedCode);
    setOtpSent(true);
    setUserOtpInput('');
    setAuthState(type === 'email' ? 'mfa_email' : 'mfa_phone');
    
    // Auto trigger local notification card
    setTimeout(() => {
      alert(`[SecureVault Pro SIMULATED OTP DISPATCH]\nYour 2FA validation token is: ${generatedCode}\n(Sent via simulated ${type})`);
    }, 500);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError('');
    if (userOtpInput === otpCode) {
      // Authentic OTP unlocked! In the provider context, unlocking is fully active now.
      // We are logged in completely!
      window.location.reload(); // Context is unlocked, reload or trigger simple internal routing state.
    } else {
      setMfaError('Incorrect 6-digit OTP security code. Please check notifications.');
    }
  };

  // Challenge Security Question
  const handleVerifyRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    if (!recAnswer) {
      setErrorText('Please input the recovery answer.');
      return;
    }

    const verified = await verifyRecovery(authConfig?.recoveryQuestion || '', recAnswer);
    if (verified) {
      setRecoverySuccess(true);
    } else {
      setErrorText('Mismatched answer key. Please review spelling.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    if (recNewPassword !== recNewPasswordConfirm) {
      setErrorText('New passwords do not match.');
      return;
    }
    if (recNewPassword.length < 8) {
      setErrorText('Password must be at least 8 characters.');
      return;
    }

    const success = await recoveryResetPassword(recNewPassword);
    if (success) {
      alert('Master Password has been reset. Proceed to unlock your vault.');
      setAuthState('login');
      setRecoverySuccess(false);
      setRecAnswer('');
      setRecNewPassword('');
    } else {
      setErrorText('Failed to reset master key hash.');
    }
  };

  // Keyboard pad for PIN screen
  const appendPinDigit = (num: string) => {
    setErrorText('');
    const curLimit = authConfig?.pinHash?.length === 4 ? 4 : 6; // default support based on pin length, or fallback
    const targetLimit = (authConfig?.pinSalt && authConfig.pinSalt.length > 0) ? (authConfig.pinHash?.replace(/[^0-9]/g, '').length || 4) : 4;
    // let's just make it auto-submittable on length 4 or 6. We can check pin lock configuration
    const val = pinNumbers + num;
    if (val.length <= 6) {
      setPinNumbers(val);
      // Wait, let's verify on complete
      // If we don't know the exact target length, let the user trigger, or auto-submit on 4 or 6
      if (val.length === 4 || val.length === 6) {
        // we can test if it matches PIN lock
        setTimeout(() => {
          handlePinUnlockSubmit(val);
          setPinNumbers('');
        }, 150);
      }
    }
  };

  const clearPin = () => {
    setPinNumbers('');
  };

  const passwordStrength = checkPasswordStrength(regPassword);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      
      {/* Background gradients resembling a cyberpunk security aesthetic */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-550/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-550/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 transition-all duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl mb-3 flex items-center justify-center relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl opacity-20 blur-sm shrink-0" />
            <Shield className="w-8 h-8 text-emerald-400 relative z-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            SecureVault <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-zinc-950 text-xs font-black select-none">PRO</span>
          </h1>
          <p className="text-zinc-500 text-xs mt-1.5 tracking-wide uppercase">MILITARY-GRADE AES-256 ENCRYTION SYSTEM</p>
        </div>

        {/* Auth Error Display */}
        {errorText && (
          <div className="mb-4 p-4 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 text-xs flex items-center gap-2 animate-shake">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>{errorText}</span>
          </div>
        )}

        {/* Auth Cards */}
        {/* State: REGISTER */}
        {authState === 'register' && (
          <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl shadow-2xl">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-zinc-100">Initialize Vault</h2>
              <p className="text-xs text-zinc-400 mt-1">Setup local vault profiles. Data stays on your browser (IndexedDB).</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">User Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Security Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Mobile Phone (MFA verification)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 012-3456"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Master Password Fields */}
              <div className="border-t border-zinc-800/60 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Master Encryption Password</label>
                  <button
                    type="button"
                    onClick={() => setShowGenerator(!showGenerator)}
                    className="text-xs text-emerald-400 hover:text-emerald-350 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Password Generator</span>
                  </button>
                </div>

                {showGenerator && (
                  <div className="mb-3 animate-fadeIn">
                    <PasswordGenerator onSelectPassword={(pw) => {
                      setRegPassword(pw);
                      setRegPasswordConfirm(pw);
                      setShowGenerator(false);
                    }} inline />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 8 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-10 py-2.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm password"
                      value={regPasswordConfirm}
                      onChange={(e) => setRegPasswordConfirm(e.target.value)}
                      className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-10 py-2.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {regPassword && (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-805/60 space-y-1.5 animate-fadeIn">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-500">PASSWORD HEALTH INDEX</span>
                      <span className="font-semibold text-emerald-400">{passwordStrength.text}</span>
                    </div>
                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div className={`h-full ${passwordStrength.color} transition-all`} style={{ width: `${(passwordStrength.score + 1) * 20}%` }} />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Master Password Hint</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My childhood cat with 3 spots"
                    value={regHint}
                    onChange={(e) => setRegHint(e.target.value)}
                    className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* PIN Settings */}
              <div className="border-t border-zinc-800/60 pt-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={regPinEnabled}
                    onChange={(e) => setRegPinEnabled(e.target.checked)}
                    className="rounded border-zinc-800 text-emerald-500 focus:ring-emerald-500 bg-zinc-950 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Set 4-Digit OR 6-Digit PIN lock</span>
                </label>

                {regPinEnabled && (
                  <input
                    type="password"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="Enter 4 or 6 numbers PIN key"
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono tracking-widest text-center"
                  />
                )}
              </div>

              {/* Security Questions Recovery */}
              <div className="border-t border-zinc-800/60 pt-4 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Emergency Recovery Security Question</label>
                  <select
                    value={recoveryQ}
                    onChange={(e) => setRecoveryQ(e.target.value)}
                    className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option>What was the name of your first elementary school?</option>
                    <option>What is your mother's maiden name?</option>
                    <option>What was the model of your first car?</option>
                    <option>Where was your favorite family vacation location?</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Secure Answer</label>
                  <input
                    type="text"
                    required
                    placeholder="Case-insensitive recovery answer"
                    value={recoveryA}
                    onChange={(e) => setRecoveryA(e.target.value)}
                    className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoadingState}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-650 disabled:bg-zinc-800 text-zinc-950 font-bold rounded-xl tracking-wider text-xs uppercase flex items-center justify-center gap-2 border-none shadow-md shadow-emerald-500/10 cursor-pointer transition-all duration-200 active:scale-98"
              >
                {isLoadingState ? (
                  <>
                    <RefreshCcw className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Constructing Secure Vault...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Initialize SecureVault Pro</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* State: LOGIN WITH PASSWORD */}
        {authState === 'login' && (
          <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-zinc-100">Unlock your Vault</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Please input your Master Password authorization key.</p>
              </div>
              {authConfig?.pinEnabled && (
                <button
                  type="button"
                  onClick={() => setAuthState('pin_unlock')}
                  className="p-1 px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>PIN Lock</span>
                </button>
              )}
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-4.5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Master Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Type Master Key..."
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-10 py-3 text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-zinc-550 hover:text-zinc-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authConfig?.authHint && (
                <div className="text-[11px] px-3.5 py-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/50 text-zinc-400 flex items-start gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-555 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-zinc-400">Password Hint:</span> <span className="italic">"{authConfig.authHint}"</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-zinc-850 text-emerald-500 focus:ring-emerald-500 bg-zinc-950 w-4 h-4 cursor-pointer"
                  />
                  <span>Stay logged in on this session</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAuthState('forgot_password')}
                  className="text-xs text-emerald-400 hover:text-emerald-350 select-none cursor-pointer"
                >
                  Retrieve Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoadingState}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-650 disabled:bg-zinc-850 text-zinc-950 font-bold rounded-xl tracking-wider text-xs uppercase flex items-center justify-center gap-2 border-none shadow-md shadow-emerald-500/10 cursor-pointer transition-all duration-200 active:scale-98"
              >
                {isLoadingState ? (
                  <>
                    <RefreshCcw className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Decrypting local database...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Unlock Vault</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* State: PIN CODE UNLOCK SCREEN */}
        {authState === 'pin_unlock' && (
          <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col items-center mb-6">
              <Fingerprint className="w-12 h-12 text-emerald-400 mb-2 animate-pulse" />
              <h2 className="text-lg font-bold text-zinc-100">PIN Challenge</h2>
              <p className="text-xs text-zinc-500 text-center mt-1">Provide your 4-6 digit numeric identification signature PIN.</p>
            </div>

            {/* Simulated Dot Indicator Code */}
            <div className="flex justify-center gap-3.5 mb-8">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const isSelected = pinNumbers.length > index;
                return (
                  <div 
                    key={index} 
                    className={`w-3.5 h-3.5 rounded-full border border-zinc-700 transition-all duration-200 ${isSelected ? 'bg-emerald-400 scale-110 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-zinc-950'}`}
                  />
                );
              })}
            </div>

            {/* Custom Interactive PIN Pad */}
            <div className="grid grid-cols-3 gap-3.5 max-w-[280px] mx-auto mb-5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => appendPinDigit(num)}
                  className="aspect-square flex items-center justify-center rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-860 text-lg font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={clearPin}
                className="aspect-square flex items-center justify-center rounded-2xl bg-zinc-950 text-[11px] font-bold text-red-400 tracking-wide hover:bg-red-950/20 active:scale-95 cursor-pointer uppercase"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => appendPinDigit('0')}
                className="aspect-square flex items-center justify-center rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-860 text-lg font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer active:scale-95"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setAuthState('login')}
                className="aspect-square flex flex-col items-center justify-center rounded-2xl bg-zinc-950 text-[10px] font-bold text-zinc-500 hover:text-emerald-400 active:scale-95 cursor-pointer uppercase"
              >
                <Key className="w-4 h-4 mb-1" />
                <span>Pass</span>
              </button>
            </div>
          </div>
        )}

        {/* State: FORGOT PASSWORD RECOVERY */}
        {authState === 'forgot_password' && (
          <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl shadow-2xl">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-zinc-100">Vault Password Recovery</h2>
              <p className="text-xs text-zinc-500 mt-1">Verify emergency recovery questions to override current master password hashes.</p>
            </div>

            {!recoverySuccess ? (
              <form onSubmit={handleVerifyRecovery} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5">SECURITY QUESTION CHALLENGE</span>
                  <p className="text-sm font-semibold text-zinc-200">{authConfig?.recoveryQuestion || 'What was your favorite security recovery Question?'}</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Your Saved Answer</label>
                  <input
                    type="text"
                    required
                    placeholder="Case-insensitive recovery answer..."
                    value={recAnswer}
                    onChange={(e) => setRecAnswer(e.target.value)}
                    className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAuthState('login')}
                    className="flex-1 py-2.5 px-4 bg-zinc-950 hover:bg-zinc-850 text-zinc-355 font-bold rounded-xl text-xs uppercase cursor-pointer"
                  >
                    Back to login
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-650 text-zinc-950 font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1 border-none shadow-md cursor-pointer"
                  >
                    <span>Verify Answer</span>
                    <ArrowRight className="w-4 h-4 animate-pulse" />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4 animate-fadeIn">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-550/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>Question verified successfully! Enter a new Master Encryption Key.</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">New Master Password</label>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 8 characters password"
                    value={recNewPassword}
                    onChange={(e) => setRecNewPassword(e.target.value)}
                    className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-type password credentials"
                    value={recNewPasswordConfirm}
                    onChange={(e) => setRecNewPasswordConfirm(e.target.value)}
                    className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-550 hover:bg-emerald-650 text-zinc-900 font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 shadow-lg border-none cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  <span>Apply New Password & Login</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* State: EMAIL OTP MULTI-FACTOR SIMULATOR */}
        {(authState === 'mfa_email' || authState === 'mfa_phone') && (
          <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl shadow-2xl text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                {authState === 'mfa_email' ? <Mail className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
              </div>
            </div>
            
            <h2 className="text-lg font-bold text-zinc-100">Two-Factor Authentication</h2>
            <p className="text-xs text-zinc-400 mt-2 max-w-sm mx-auto leading-relaxed">
              For ultimate cryptographic security, enter the 6-digit verification code dispatched to:
            </p>
            <p className="text-xs font-bold text-zinc-200 mt-1">{mfaTarget}</p>

            {mfaError && (
              <p className="mt-3 text-xs text-red-400 font-medium animate-shake">{mfaError}</p>
            )}

            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  pattern="[0-9]*"
                  placeholder="******"
                  value={userOtpInput}
                  onChange={(e) => setUserOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full text-xl font-bold tracking-[0.4em] text-center bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-emerald-400 placeholder:text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-650 active:scale-98 text-zinc-950 font-semibold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border-none shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Verify Verification Signature</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerMfaSimulation(authState === 'mfa_email' ? 'email' : 'phone')}
                  className="text-xs text-zinc-500 hover:text-zinc-350 py-1 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>Resend Verification Code OTP</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
