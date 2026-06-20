import React, { useState, useEffect } from 'react';
import { Shield, Copy, Check, RefreshCw, Key, Sparkles } from 'lucide-react';
import { generateStrongPassword, checkPasswordStrength } from '../utils/crypto';

interface PasswordGeneratorProps {
  onSelectPassword?: (password: string) => void;
  inline?: boolean;
}

export const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ onSelectPassword, inline = false }) => {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const pw = generateStrongPassword(length, options);
    setGeneratedPassword(pw);
    setCopied(false);
  };

  useEffect(() => {
    handleGenerate();
  }, [length, options]);

  const handleCopy = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const strength = checkPasswordStrength(generatedPassword);

  return (
    <div className={`p-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 ${inline ? '' : 'shadow-2xl'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Key className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-lg text-zinc-100">Smart Generator</h3>
        </div>
        <button
          onClick={handleGenerate}
          title="Regenerate"
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="relative mb-5">
        <input
          type="text"
          readOnly
          value={generatedPassword}
          className="w-full font-mono text-base md:text-lg bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 pr-24 focus:outline-none focus:ring-1 focus:ring-zinc-700 text-zinc-100 selection:bg-zinc-800"
        />
        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Password Strength Indicator */}
      <div className="mb-5 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-zinc-400 tracking-wider">STRENGTH RATING</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${strength.color}/10 ${strength.color === 'bg-red-500' ? 'text-red-400' : strength.color === 'bg-orange-500' ? 'text-orange-400' : strength.color === 'bg-yellow-500' ? 'text-yellow-400' : strength.color === 'bg-emerald-500' ? 'text-emerald-400' : 'text-blue-400'}`}>
            {strength.text}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full mb-3">
          {[0, 1, 2, 3].map((step) => {
            const isFilled = strength.score > step;
            let barColor = 'bg-zinc-800';
            if (isFilled) {
              if (strength.score === 1) barColor = 'bg-red-500';
              else if (strength.score === 2) barColor = 'bg-orange-500';
              else if (strength.score === 3) barColor = 'bg-yellow-500';
              else barColor = 'bg-emerald-500';
            }
            return (
              <div key={step} className={`h-full rounded-full transition-all duration-300 ${barColor}`} />
            );
          })}
        </div>
        
        {strength.suggestions.length > 0 && generatedPassword && (
          <div className="text-zinc-500 text-[11px] leading-relaxed flex items-start gap-1">
            <Sparkles className="w-3 h-3 text-yellow-500 mt-0.5 shrink-0" />
            <span>{strength.suggestions[0]}</span>
          </div>
        )}
      </div>

      {/* Length selector */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Length: {length}</label>
          <span className="text-xs text-zinc-500">(Recommended: 14+)</span>
        </div>
        <input
          type="range"
          min="8"
          max="32"
          value={length}
          onChange={(e) => setLength(parseInt(e.target.value))}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>

      {/* Options Checkboxes */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <label className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl cursor-pointer hover:bg-zinc-900 transition-colors select-none text-zinc-300 text-xs font-medium">
          <input
            type="checkbox"
            checked={options.uppercase}
            onChange={(e) => setOptions({ ...options, uppercase: e.target.checked })}
            className="rounded border-zinc-800 text-emerald-500 focus:ring-emerald-500/20 bg-zinc-950 w-4 h-4 cursor-pointer"
          />
          <span>A-Z Uppercase</span>
        </label>

        <label className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl cursor-pointer hover:bg-zinc-900 transition-colors select-none text-zinc-300 text-xs font-medium">
          <input
            type="checkbox"
            checked={options.lowercase}
            onChange={(e) => setOptions({ ...options, lowercase: e.target.checked })}
            className="rounded border-zinc-800 text-emerald-500 focus:ring-emerald-500/20 bg-zinc-950 w-4 h-4 cursor-pointer"
          />
          <span>a-z Lowercase</span>
        </label>

        <label className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl cursor-pointer hover:bg-zinc-900 transition-colors select-none text-zinc-300 text-xs font-medium">
          <input
            type="checkbox"
            checked={options.numbers}
            onChange={(e) => setOptions({ ...options, numbers: e.target.checked })}
            className="rounded border-zinc-800 text-emerald-500 focus:ring-emerald-500/20 bg-zinc-950 w-4 h-4 cursor-pointer"
          />
          <span>0-9 Numbers</span>
        </label>

        <label className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl cursor-pointer hover:bg-zinc-900 transition-colors select-none text-zinc-300 text-xs font-medium">
          <input
            type="checkbox"
            checked={options.symbols}
            onChange={(e) => setOptions({ ...options, symbols: e.target.checked })}
            className="rounded border-zinc-800 text-emerald-500 focus:ring-emerald-500/20 bg-zinc-950 w-4 h-4 cursor-pointer"
          />
          <span>!@# Special</span>
        </label>
      </div>

      {onSelectPassword && (
        <button
          onClick={() => onSelectPassword(generatedPassword)}
          type="button"
          className="w-full mt-5 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-650 active:scale-98 text-zinc-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 tracking-wide transition-all shadow-lg hover:shadow-emerald-555/10 cursor-pointer"
        >
          <Shield className="w-4 h-4" />
          <span>Apply Generated Password</span>
        </button>
      )}
    </div>
  );
};
