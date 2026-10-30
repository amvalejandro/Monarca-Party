import React, { useEffect, useState } from 'react';
import { GameManager } from '../game/GameManager';

interface TouchOverlayProps {
  visible: boolean;
}

export const TouchOverlay: React.FC<TouchOverlayProps> = ({ visible }) => {
  const [holding, setHolding] = useState<{ [id: number]: boolean }>({});
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = GameManager.subscribe(() => setTick(t => t + 1));
    return unsub;
  }, []);

  const triggerAction = (playerIdx: number) => {
    window.dispatchEvent(
      new CustomEvent('monarca-player-action', {
        detail: { playerIndex: playerIdx },
      })
    );
  };

  const handlePointerDown = (playerIdx: number, e: React.PointerEvent) => {
    e.preventDefault();
    setHolding(prev => ({ ...prev, [playerIdx]: true }));
    window.dispatchEvent(
      new CustomEvent('monarca-player-down', {
        detail: { playerIndex: playerIdx },
      })
    );
    triggerAction(playerIdx);
  };

  const handlePointerUp = (playerIdx: number, e: React.PointerEvent) => {
    e.preventDefault();
    setHolding(prev => ({ ...prev, [playerIdx]: false }));
    window.dispatchEvent(
      new CustomEvent('monarca-player-up', {
        detail: { playerIndex: playerIdx },
      })
    );
  };

  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-1.5 sm:p-3 select-none">
      {/* Top row: P1 (Left) and P2 (Right) */}
      <div className="flex justify-between items-start w-full">
        {/* Player 1 Button */}
        {GameManager.players[0] && (
          <button
            onPointerDown={e => handlePointerDown(0, e)}
            onPointerUp={e => handlePointerUp(0, e)}
            onPointerLeave={e => handlePointerUp(0, e)}
            className={`pointer-events-auto transition-all active:scale-90 select-none rounded-2xl border-2 sm:border-3 px-2.5 sm:px-4 py-2 sm:py-2.5 shadow-xl flex flex-col items-center justify-center min-w-[85px] sm:min-w-[125px] backdrop-blur-sm ${
              holding[0]
                ? 'bg-amber-600/95 border-amber-300 ring-2 sm:ring-4 ring-amber-400/50'
                : 'bg-amber-600/70 hover:bg-amber-600/90 border-amber-400/80'
            }`}
          >
            <span className="text-[8px] sm:text-[10px] font-bold text-amber-100 uppercase tracking-wider pixel-font">
              {GameManager.players[0].name.slice(0, 7)}
            </span>
            <span className="text-sm sm:text-lg font-black text-white mt-0.5">
              [ W / Esp ]
            </span>
            <span className="text-[8px] text-amber-200 mt-0.5 font-mono hidden sm:inline">
              {holding[0] ? 'PULSADO' : 'Toca / Mantén'}
            </span>
          </button>
        )}

        {/* Player 2 Button */}
        {GameManager.players[1] && (
          <button
            onPointerDown={e => handlePointerDown(1, e)}
            onPointerUp={e => handlePointerUp(1, e)}
            onPointerLeave={e => handlePointerUp(1, e)}
            disabled={GameManager.players[1].isBot}
            className={`pointer-events-auto transition-all active:scale-90 select-none rounded-2xl border-2 sm:border-3 px-2.5 sm:px-4 py-2 sm:py-2.5 shadow-xl flex flex-col items-center justify-center min-w-[85px] sm:min-w-[125px] backdrop-blur-sm ${
              GameManager.players[1].isBot
                ? 'opacity-35 bg-blue-950/60 border-blue-800 cursor-not-allowed'
                : holding[1]
                ? 'bg-blue-600/95 border-blue-300 ring-2 sm:ring-4 ring-blue-400/50'
                : 'bg-blue-600/70 hover:bg-blue-600/90 border-blue-400/80'
            }`}
          >
            <span className="text-[8px] sm:text-[10px] font-bold text-blue-100 uppercase tracking-wider pixel-font">
              {GameManager.players[1].name.slice(0, 7)}
            </span>
            <span className="text-sm sm:text-lg font-black text-white mt-0.5">
              [ ↑ Flecha ]
            </span>
            <span className="text-[8px] text-blue-200 mt-0.5 font-mono hidden sm:inline">
              {GameManager.players[1].isBot ? 'IA BOT' : holding[1] ? 'PULSADO' : 'Toca / Mantén'}
            </span>
          </button>
        )}
      </div>

      {/* Bottom row: P3 (Left) and P4 (Right) */}
      <div className="flex justify-between items-end w-full">
        {/* Player 3 Button */}
        {GameManager.players[2] && (
          <button
            onPointerDown={e => handlePointerDown(2, e)}
            onPointerUp={e => handlePointerUp(2, e)}
            onPointerLeave={e => handlePointerUp(2, e)}
            disabled={GameManager.players[2].isBot}
            className={`pointer-events-auto transition-all active:scale-90 select-none rounded-2xl border-2 sm:border-3 px-2.5 sm:px-4 py-2 sm:py-2.5 shadow-xl flex flex-col items-center justify-center min-w-[85px] sm:min-w-[125px] backdrop-blur-sm ${
              GameManager.players[2].isBot
                ? 'opacity-35 bg-emerald-950/60 border-emerald-800 cursor-not-allowed'
                : holding[2]
                ? 'bg-emerald-600/95 border-emerald-300 ring-2 sm:ring-4 ring-emerald-400/50'
                : 'bg-emerald-600/70 hover:bg-emerald-600/90 border-emerald-400/80'
            }`}
          >
            <span className="text-[8px] sm:text-[10px] font-bold text-emerald-100 uppercase tracking-wider pixel-font">
              {GameManager.players[2].name.slice(0, 7)}
            </span>
            <span className="text-sm sm:text-lg font-black text-white mt-0.5">
              [ Tecla C ]
            </span>
            <span className="text-[8px] text-emerald-200 mt-0.5 font-mono hidden sm:inline">
              {GameManager.players[2].isBot ? 'IA BOT' : holding[2] ? 'PULSADO' : 'Toca / Mantén'}
            </span>
          </button>
        )}

        {/* Player 4 Button */}
        {GameManager.players[3] && (
          <button
            onPointerDown={e => handlePointerDown(3, e)}
            onPointerUp={e => handlePointerUp(3, e)}
            onPointerLeave={e => handlePointerUp(3, e)}
            disabled={GameManager.players[3].isBot}
            className={`pointer-events-auto transition-all active:scale-90 select-none rounded-2xl border-2 sm:border-3 px-2.5 sm:px-4 py-2 sm:py-2.5 shadow-xl flex flex-col items-center justify-center min-w-[85px] sm:min-w-[125px] backdrop-blur-sm ${
              GameManager.players[3].isBot
                ? 'opacity-35 bg-purple-950/60 border-purple-800 cursor-not-allowed'
                : holding[3]
                ? 'bg-purple-600/95 border-purple-300 ring-2 sm:ring-4 ring-purple-400/50'
                : 'bg-purple-600/70 hover:bg-purple-600/90 border-purple-400/80'
            }`}
          >
            <span className="text-[8px] sm:text-[10px] font-bold text-purple-100 uppercase tracking-wider pixel-font">
              {GameManager.players[3].name.slice(0, 7)}
            </span>
            <span className="text-sm sm:text-lg font-black text-white mt-0.5">
              [ Tecla M ]
            </span>
            <span className="text-[8px] text-purple-200 mt-0.5 font-mono hidden sm:inline">
              {GameManager.players[3].isBot ? 'IA BOT' : holding[3] ? 'PULSADO' : 'Toca / Mantén'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
