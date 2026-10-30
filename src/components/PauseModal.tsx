import React from 'react';
import { SFX } from '../game/audio';
import { Play, RotateCcw, Home, Volume2, VolumeX, Smartphone, Monitor, Trophy } from 'lucide-react';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenMainMenu: () => void;
  onSelectStage: (stageKey: string) => void;
  currentStage: string;
  isMuted: boolean;
  onToggleMute: () => void;
  showTouchPads: boolean;
  onToggleTouchPads: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onOpenMainMenu,
  onSelectStage,
  currentStage,
  isMuted,
  onToggleMute,
  showTouchPads,
  onToggleTouchPads,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#162B17] to-[#0A1608] border-3 border-green-500 rounded-3xl p-6 text-white shadow-2xl flex flex-col items-center">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">⏸</span>
          <h2 className="text-xl font-black text-amber-400 pixel-font tracking-wide">
            JUEGO EN PAUSA
          </h2>
        </div>
        <p className="text-xs text-green-300 font-medium mb-5 text-center">
          Bioparque Monarca • Tenjo, Colombia
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          {/* Reanudar */}
          <button
            onClick={() => {
              SFX.play('click');
              onResume();
            }}
            className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 pixel-font"
          >
            <Play className="w-4 h-4 fill-white" /> CONTINUAR PARTIDA
          </button>

          {/* Reiniciar */}
          <button
            onClick={() => {
              SFX.play('click');
              onRestart();
            }}
            className="w-full py-3 bg-green-950/80 hover:bg-green-900 border border-green-700 text-green-200 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Reiniciar Etapa Actual
          </button>

          {/* Menú Principal */}
          <button
            onClick={() => {
              SFX.play('click');
              onOpenMainMenu();
            }}
            className="w-full py-3 bg-green-950/80 hover:bg-green-900 border border-green-700 text-green-200 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Menú Principal y Modos
          </button>
        </div>

        {/* Setting Toggles Row */}
        <div className="grid grid-cols-2 gap-2 w-full mt-4 pt-4 border-t border-green-900/80">
          <button
            onClick={onToggleMute}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-black/40 border border-green-900 text-xs font-bold text-green-200 hover:bg-black/60 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
            <span>{isMuted ? 'Silenciado' : 'Sonido ON'}</span>
          </button>

          <button
            onClick={onToggleTouchPads}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-black/40 border border-green-900 text-xs font-bold text-green-200 hover:bg-black/60 transition-colors"
          >
            {showTouchPads ? <Smartphone className="w-4 h-4 text-amber-400" /> : <Monitor className="w-4 h-4 text-blue-400" />}
            <span>{showTouchPads ? 'Táctil ON' : 'Teclado PC'}</span>
          </button>
        </div>

        {/* Quick Simulator Jump (For testing any stage) */}
        <div className="w-full mt-4 pt-3 border-t border-green-950">
          <span className="text-[10px] text-green-400/80 uppercase font-bold block mb-1.5 text-center">
            Salto Rápido a Etapa (Simulador):
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => onSelectStage('CaterpillarScene')}
              className={`py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                currentStage === 'CaterpillarScene'
                  ? 'bg-amber-600 border-amber-300 text-white'
                  : 'bg-black/40 border-neutral-800 text-amber-300/80 hover:bg-neutral-800'
              }`}
            >
              🐛 Oruga
            </button>
            <button
              onClick={() => onSelectStage('ChrysalisScene')}
              className={`py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                currentStage === 'ChrysalisScene'
                  ? 'bg-purple-600 border-purple-300 text-white'
                  : 'bg-black/40 border-neutral-800 text-purple-300/80 hover:bg-neutral-800'
              }`}
            >
              ✨ Crisálida
            </button>
            <button
              onClick={() => onSelectStage('ButterflyScene')}
              className={`py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                currentStage === 'ButterflyScene'
                  ? 'bg-blue-600 border-blue-300 text-white'
                  : 'bg-black/40 border-neutral-800 text-blue-300/80 hover:bg-neutral-800'
              }`}
            >
              🦋 Mariposa
            </button>
            <button
              onClick={() => onSelectStage('FinalPodiumScene')}
              className={`py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                currentStage === 'FinalPodiumScene'
                  ? 'bg-amber-500 border-amber-200 text-black'
                  : 'bg-black/40 border-neutral-800 text-amber-300/80 hover:bg-neutral-800'
              }`}
            >
              🏆 Podio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
