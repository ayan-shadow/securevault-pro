import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import { 
  Palette, Check, Eye, RefreshCw, Sparkles, AlertCircle, 
  HelpCircle, Sliders, Type, Contrast} from 'lucide-react';

export const ThemeStudioView: React.FC = () => {
  const { authConfig, updateSettings } = useVault();
  
  // Local settings reference (fallback defaults)
  const currentTheme = authConfig?.settings?.theme || 'dark';
  const customAccent = authConfig?.settings?.customAccent || '#3b82f6';
  const customBackground = authConfig?.settings?.customBackground || 'ambient';
  const largeTextMode = authConfig?.settings?.largeTextMode || false;
  const highContrastMode = authConfig?.settings?.highContrastMode || false;
  const reducedMotionMode = authConfig?.settings?.reducedMotionMode || false;

  // Static Theme definitions with descriptions
  const themeOptions = [
    { id: 'dark', name: 'Classic Dark Space', desc: 'Premium deep navy and dark gray canvas for night environments.', styleBg: 'bg-zinc-900 border-zinc-700' },
    { id: 'light', name: 'Alabaster Light', desc: 'Clean, professional day-mode theme with high-contrast elements.', styleBg: 'bg-zinc-100 border-zinc-300' },
    { id: 'amoled', name: 'AMOLED Midnight', desc: 'Absolute pitch black for ultimate power savings on OLED displays.', styleBg: 'bg-black border-zinc-800' },
    { id: 'blue', name: 'Cobalt Ocean', desc: 'Serene sea blue and deep sapphire background accents.', styleBg: 'bg-blue-950 border-blue-800' },
    { id: 'purple', name: 'Cyber Orchid', desc: 'Futuristic styling fueled by warm amethyst and violet shades.', styleBg: 'bg-purple-950 border-purple-800' },
    { id: 'green', name: 'Emerald Forest', desc: 'An eco-inspired rich green visual suite with comforting levels.', styleBg: 'bg-[#062419] border-emerald-800' },
    { id: 'red', name: 'Vulcan Ruby', desc: 'A volcanic burgundy profile conveying strength and urgency.', styleBg: 'bg-[#29050b] border-red-800' },
    { id: 'orange', name: 'Tangerine Amber', desc: 'Vibrant, warm clay and copper aesthetic elements.', styleBg: 'bg-[#211103] border-orange-850' }
  ] as const;

  // Quick Preset Accents
  const accentPresets = [
    { hex: '#3b82f6', label: 'Classic Blue' },
    { hex: '#10b981', label: 'Emerald' },
    { hex: '#8b5cf6', label: 'Cyber Violet' },
    { hex: '#f97316', label: 'Sunset' },
    { hex: '#ec4899', label: 'Cerise Rose' },
    { hex: '#14b8a6', label: 'Tidal Cyan' }
  ];

  // Background Ambients Option
  const backgroundOptions = [
    { id: 'ambient', name: 'Visual Glow Circles', desc: 'Dynamic background with floating blurred radial spheres.' },
    { id: 'solid', name: 'Clean Minimal Solid', desc: 'Absolute plain backdrop for distraction-free security.' },
    { id: 'mesh', name: 'Tech Pixel Matrix', desc: 'Subtle technical scan mesh grid overlay effect.' }
  ] as const;

  const handleUpdateTheme = async (themeId: typeof currentTheme) => {
    await updateSettings({ theme: themeId });
  };

  const handleUpdateAccent = async (hex: string) => {
    await updateSettings({ customAccent: hex });
  };

  const handleUpdateBg = async (bgId: typeof customBackground) => {
    await updateSettings({ customBackground: bgId });
  };

  const handleToggleAccessibility = async (key: 'largeTextMode' | 'highContrastMode' | 'reducedMotionMode', val: boolean) => {
    await updateSettings({ [key]: val });
  };

  return (
    <div className="space-y-6 text-zinc-100 animate-fadeIn min-h-screen pb-16">
      
      {/* 1. Upper Header Header */}
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute right-[-10%] top-[-10%] w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold tracking-tight text-white uppercase">
              SecureVault Pro Theme Studio
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Configure premium commercial skins, edit core highlights, pick hex accents, or customize workspace backgrounds.
          </p>
        </div>

        <div className="shadow-inner px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-450 uppercase flex items-center gap-1.5 z-10 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>V2.0 Custom Styles Active</span>
        </div>
      </div>

      {/* Grid containing Style Selection Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Columns (Skins & Accents) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Themes Selection */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Select Product Skin</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleUpdateTheme(opt.id)}
                  className={`p-4 rounded-xl text-left border cursor-pointer transition-all hover:scale-[1.01] flex items-start gap-3 bg-[#0c0d12]/60 ${currentTheme === opt.id ? 'border-blue-500 ring-1 ring-blue-500/40 shadow-md' : 'border-white/10'}`}
                >
                  <div className={`w-8 h-8 rounded-lg ${opt.styleBg} flex items-center justify-center shrink-0 border`}>
                    {currentTheme === opt.id && <Check className="w-4 h-4 text-blue-400 font-bold" />}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white capitalize">{opt.name}</h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color Customizer and Presets */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Highlight Accent Customizer</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* Presets Grid */}
              <div className="space-y-3">
                <span className="text-[10px] text-zinc-550 uppercase tracking-widest block font-bold">ACCENT PRESETS</span>
                <div className="grid grid-cols-3 gap-2">
                  {accentPresets.map((preset) => (
                    <button
                      key={preset.hex}
                      onClick={() => handleUpdateAccent(preset.hex)}
                      className={`p-2 rounded-xl text-center border text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${customAccent.toLowerCase() === preset.hex.toLowerCase() ? 'bg-white/10 border-blue-550 text-white' : 'bg-transparent border-white/5 text-zinc-400 hover:text-white'}`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: preset.hex }} />
                      <span>{preset.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hex Picker Box */}
              <div className="p-4 rounded-xl bg-black/25 border border-white/5 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Hex Color Picker</h4>
                  <p className="text-[11px] text-zinc-500 mt-1">Select any custom hue using this picker block.</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customAccent}
                    onChange={(e) => handleUpdateAccent(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none outline-none"
                  />
                  <div>
                    <span className="text-xs font-mono font-bold uppercase text-white bg-white/5 px-2.5 py-1 rounded border border-white/10 select-all block">
                      {customAccent}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Columns (Background Option & Accessibility Settings) */}
        <div className="space-y-6">
          
          {/* Custom Background Ambient Options */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Custom Ambient Background Options</h3>
            <div className="space-y-3">
              {backgroundOptions.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => handleUpdateBg(bg.id)}
                  className={`w-full text-left p-3.5 rounded-xl border flex justify-between items-center bg-[#0c0d12]/50 cursor-pointer transition-all ${customBackground === bg.id ? 'border-blue-500 text-white font-semibold' : 'border-white/10 text-zinc-401'}`}
                >
                  <div className="space-y-0.5 text-left">
                    <div className="text-xs font-bold">{bg.name}</div>
                    <p className="text-[10px] text-zinc-500 pr-2 leading-tight">{bg.desc}</p>
                  </div>
                  {customBackground === bg.id && <Check className="w-4 h-4 text-blue-400 shrink-0 font-bold" />}
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility Enablers */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Accessibility Integration</h3>
            
            <div className="space-y-4">
              
              {/* Large Text */}
              <div className="flex justify-between items-center text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-zinc-205 flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-blue-400" />
                    <span>Large Text Mode</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">Increases base font size indicators of details.</p>
                </div>
                <button
                  onClick={() => handleToggleAccessibility('largeTextMode', !largeTextMode)}
                  className={`w-10 h-6 rounded-full p-1 transition-all ${largeTextMode ? 'bg-blue-600' : 'bg-zinc-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${largeTextMode ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* High Contrast */}
              <div className="flex justify-between items-center text-xs pt-4 border-t border-white/5">
                <div className="space-y-0.5">
                  <div className="font-bold text-zinc-205 flex items-center gap-1.5">
                    <Contrast className="w-4 h-4 text-blue-400" />
                    <span>High Contrast Mode</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">Intensifies card borders and contrasts text details.</p>
                </div>
                <button
                  onClick={() => handleToggleAccessibility('highContrastMode', !highContrastMode)}
                  className={`w-10 h-6 rounded-full p-1 transition-all ${highContrastMode ? 'bg-blue-600' : 'bg-zinc-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${highContrastMode ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Reduced Motion */}
              <div className="flex justify-between items-center text-xs pt-4 border-t border-white/5">
                <div className="space-y-0.5">
                  <div className="font-bold text-zinc-205 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    <span>Reduced Motion Mode</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">Dampens transition animations inside directories.</p>
                </div>
                <button
                  onClick={() => handleToggleAccessibility('reducedMotionMode', !reducedMotionMode)}
                  className={`w-10 h-6 rounded-full p-1 transition-all ${reducedMotionMode ? 'bg-blue-600' : 'bg-zinc-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${reducedMotionMode ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
