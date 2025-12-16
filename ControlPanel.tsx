import React, { useState } from 'react';
import { FractalState, FractalType, Palette } from './types';
import { PALETTES } from './constants';
import { Settings, Image, X, Menu, Loader, Sliders, RotateCw, Hash, Layers } from 'lucide-react';

interface ControlPanelProps {
  state: FractalState;
  updateState: (updates: Partial<FractalState>) => void;
  onSave: () => void;
  isSaving: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ state, updateState, onSave, isSaving }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSliderChange = (key: keyof FractalState, value: number) => {
    updateState({ [key]: value });
  };

  const handleComplexChange = (part: 're' | 'im', value: number) => {
    updateState({
      juliaConstant: {
        ...state.juliaConstant,
        [part]: value
      }
    });
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-black/40 backdrop-blur-md rounded-full shadow-lg border border-white/10 text-white hover:bg-black/60 transition-all active:scale-95"
      >
        <Menu size={24} />
      </button>
    );
  }

  // Determine if constant controls are needed
  const showConstants = state.type === FractalType.JULIA || state.type === FractalType.PHOENIX;
  const constantLabel = state.type === FractalType.PHOENIX ? "凤凰参数 (C & P)" : "朱利亚常数 (C)";
  const showExponent = state.type === FractalType.MULTIBROT;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 bg-slate-900/60 backdrop-blur-sm border-t border-white/10 rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 drop-shadow-md">
          <Settings size={20} className="text-blue-400" />
          分形设置
        </h2>
        <button 
          onClick={() => setIsOpen(false)} 
          className="p-2 bg-white/10 rounded-full text-gray-200 hover:bg-white/20 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6 pb-6">
        {/* Fractal Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 shadow-sm">分形类别</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(FractalType).map((type) => (
              <button
                key={type}
                onClick={() => updateState({ type })}
                className={`px-2 py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-colors truncate border ${
                  state.type === type 
                    ? 'bg-blue-600/80 border-blue-400 text-white shadow-lg shadow-blue-900/50' 
                    : 'bg-slate-800/40 border-white/5 text-gray-400 hover:bg-slate-700/60'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Global Params */}
        <div className="space-y-4">
             {/* Iterations (Renamed to Detail Level) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Layers size={14} /> 细节级别
                </label>
                <span className="text-xs text-blue-400 font-mono bg-black/40 px-2 rounded">{state.iterations}</span>
              </div>
              <input
                type="range"
                min="20"
                max="1000"
                step="10"
                value={state.iterations}
                onChange={(e) => handleSliderChange('iterations', parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

             {/* Rotation */}
             <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <RotateCw size={14} /> 视图旋转
                </label>
                <span className="text-xs text-blue-400 font-mono bg-black/40 px-2 rounded">{state.rotation}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={state.rotation}
                onChange={(e) => handleSliderChange('rotation', parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

             {/* Exponent (Multibrot Only) */}
             {showExponent && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Hash size={14} /> 分形指数
                    </label>
                    <span className="text-xs text-blue-400 font-mono bg-black/40 px-2 rounded">{state.exponent.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="0.1"
                    value={state.exponent}
                    onChange={(e) => handleSliderChange('exponent', parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>
             )}

            {/* Escape Threshold */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-300">边缘厚度</label>
                <span className="text-xs text-blue-400 font-mono bg-black/40 px-2 rounded">{state.escapeThreshold.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="2"
                max="20"
                step="0.1"
                value={state.escapeThreshold}
                onChange={(e) => handleSliderChange('escapeThreshold', parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
        </div>

        {/* Palette Section */}
        <div className="p-4 bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/10 space-y-4">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Sliders size={12} />
            色彩控制
          </h3>
          
          <div className="space-y-2">
             <div className="grid grid-cols-2 gap-2">
              {PALETTES.map((palette) => (
                <button
                  key={palette.id}
                  onClick={() => updateState({ paletteId: palette.id })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    state.paletteId === palette.id
                      ? 'border-blue-500 bg-blue-600/30'
                      : 'border-transparent bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm ring-1 ring-white/20"
                    style={{ background: `linear-gradient(135deg, rgb(${palette.colors[1].join(',')}), rgb(${palette.colors[3].join(',')}))` }}
                  />
                  <span className="text-xs text-gray-200">{palette.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>色彩循环偏移</span>
              <span>{(state.colorShift * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={state.colorShift}
              onChange={(e) => handleSliderChange('colorShift', parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none accent-pink-500"
            />
          </div>
        </div>

        {/* Dynamic Constants Controls (Julia / Phoenix) */}
        {showConstants && (
          <div className="p-4 bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">{constantLabel}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Real: {state.juliaConstant.re.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.01"
                value={state.juliaConstant.re}
                onChange={(e) => handleComplexChange('re', parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none accent-purple-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Imag: {state.juliaConstant.im.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.01"
                value={state.juliaConstant.im}
                onChange={(e) => handleComplexChange('im', parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none accent-purple-500"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600/90 to-purple-600/90 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader className="animate-spin" size={20} /> : <Image size={20} />}
            保存高清大图
          </button>
        </div>
      </div>
    </div>
  );
};