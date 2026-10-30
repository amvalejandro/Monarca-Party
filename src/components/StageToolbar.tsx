import React from 'react';
import { GameManager } from '../game/GameManager';
import { SFX } from '../game/audio';
import { Play, RotateCcw, Volume2, VolumeX, Smartphone, Monitor, Menu, Sparkles, Trophy } from 'lucide-react';

interface StageToolbarProps {
  currentStage: string;
  onSelectStage: (stageKey: string) => void;
  onOpenMenu: () => void;
  showTouchPads: boolean;
  onToggleTouchPads: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const StageToolbar: React.FC<StageToolbarProps> = ({
  currentStage,
  onSelectStage,
  onOpenMenu,
  showTouchPads,
  onToggleTouchPads,
  isMuted,
  onToggleMute,
}) => {
  return (
    <header className="w-full bg-[#0D1C0E]/95 border-b border-green-800/80 px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-40 select-none shadow-md">
      {/* Brand & Menu button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { SFX.play('click'); onOpenMenu(); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md active:scale-95 transition-transform"
        >
          <Menu className="w-4 h-4" />
          <span className="hidden sm:inline">MENÚ Y MODOS</span>
        </button>

        <span className="text-xs font-black text-amber-400 pixel-font hidden md:inline">
          MONARCA PARTY
        </span>
      </div>

      {/* Simulator Quick Stage Switcher */}
      <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-green-900/80 overflow-x-auto max-w-full">
        <span className="text-[10px] text-green-300 font-bold uppercase px-2 hidden lg:inline">
          Simulador:
        </span>

        <button
          onClick={() => { SFX.play('click'); onSelectStage('CaterpillarScene'); }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
            currentStage === 'CaterpillarScene'
              ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400/50'
              : 'text-amber-300/80 hover:text-white hover:bg-amber-950/40'
          }`}
          title="Etapa 1: Oruga - Carrera del Algodoncillo"
        >
          <span>🐛</span>
          <span className="hidden sm:inline">1. Oruga</span>
        </button>

        <button
          onClick={() => { SFX.play('click'); onSelectStage('ChrysalisScene'); }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
            currentStage === 'ChrysalisScene'
              ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-400/50'
              : 'text-purple-300/80 hover:text-white hover:bg-purple-950/40'
          }`}
          title="Etapa 2: Crisálida - El Ritmo de la Metamorfosis"
        >
          <span>✨</span>
          <span className="hidden sm:inline">2. Crisálida</span>
        </button>

        <button
          onClick={() => { SFX.play('click'); onSelectStage('ButterflyScene'); }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
            currentStage === 'ButterflyScene'
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/50'
              : 'text-blue-300/80 hover:text-white hover:bg-blue-950/40'
          }`}
          title="Etapa 3: Mariposa - La Migración Final"
        >
          <span>🦋</span>
          <span className="hidden sm:inline">3. Mariposa</span>
        </button>

        <button
          onClick={() => { SFX.play('click'); onSelectStage('FinalPodiumScene'); }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
            currentStage === 'FinalPodiumScene'
              ? 'bg-amber-500 text-black shadow-sm ring-2 ring-amber-300'
              : 'text-amber-300/80 hover:text-white hover:bg-amber-950/40'
          }`}
          title="Podio Final del Torneo"
        >
          <Trophy className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Podio</span>
        </button>
      </div>

      {/* Utility Controls (Restart, Touch/PC toggle, Audio) */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => { SFX.play('click'); onSelectStage(currentStage); }}
          className="p-1.5 rounded-lg bg-green-950 border border-green-800 text-green-300 hover:text-white hover:bg-green-900 transition-colors"
          title="Reiniciar Etapa Actual"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleTouchPads}
          className={`p-1.5 rounded-lg border transition-colors ${
            showTouchPads
              ? 'bg-green-700 border-green-400 text-white'
              : 'bg-green-950 border-green-800 text-green-300 hover:text-white'
          }`}
          title={showTouchPads ? 'Ocultar Botones Táctiles' : 'Mostrar Botones Táctiles'}
        >
          {showTouchPads ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
        </button>

        <button
          onClick={onToggleMute}
          className="p-1.5 rounded-lg bg-green-950 border border-green-800 text-green-300 hover:text-white transition-colors"
          title={isMuted ? 'Activar Sonido' : 'Silenciar'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-300" />}
        </button>
      </div>
    </header>
  );
};
