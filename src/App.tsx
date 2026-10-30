import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { CaterpillarScene } from './game/scenes/CaterpillarScene';
import { ChrysalisScene } from './game/scenes/ChrysalisScene';
import { ButterflyScene } from './game/scenes/ButterflyScene';
import { RoundResultsScene } from './game/scenes/RoundResultsScene';
import { FinalPodiumScene } from './game/scenes/FinalPodiumScene';
import { TouchOverlay } from './components/TouchOverlay';
import { GameMenuModal } from './components/GameMenuModal';
import { PauseModal } from './components/PauseModal';
import { GameManager } from './game/GameManager';
import { SFX } from './game/audio';
import { Pause } from 'lucide-react';

export default function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [currentStage, setCurrentStage] = useState<string>('CaterpillarScene');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(true); // Open on initial load
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showTouchPads, setShowTouchPads] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(SFX.getMuted());
  const [, setRerender] = useState(0);

  // Initialize Phaser 3 Game
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 800,
      height: 800,
      backgroundColor: '#0D1C0E',
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 800,
      },
      input: {
        activePointers: 4, // 4-finger multi-touch for 4 players on mobile!
      },
      scene: [
        BootScene,
        CaterpillarScene,
        ChrysalisScene,
        ButterflyScene,
        RoundResultsScene,
        FinalPodiumScene,
      ],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Track active scene
    const checkActiveScene = () => {
      const activeScenes = game.scene.getScenes(true);
      if (activeScenes.length > 0) {
        const key = activeScenes[0].scene.key;
        if (key !== 'BootScene') {
          setCurrentStage(key);
        }
      }
    };

    const sceneInterval = setInterval(checkActiveScene, 400);

    const handleOpenMenu = () => {
      setIsMenuOpen(true);
    };
    window.addEventListener('monarca-open-menu', handleOpenMenu);

    const unsubManager = GameManager.subscribe(() => {
      setRerender(r => r + 1);
    });

    return () => {
      clearInterval(sceneInterval);
      window.removeEventListener('monarca-open-menu', handleOpenMenu);
      unsubManager();
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Keyboard shortcut for Pause (Escape or P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (!isMenuOpen) {
          togglePause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, isMenuOpen, currentStage]);

  const togglePause = () => {
    if (!gameRef.current) return;
    const game = gameRef.current;
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);

    const activeScenes = game.scene.getScenes(true);
    if (nextPaused) {
      activeScenes.forEach(s => s.scene.pause());
    } else {
      activeScenes.forEach(s => s.scene.resume());
    }
  };

  const resumeGame = () => {
    if (gameRef.current) {
      const activeScenes = gameRef.current.scene.getScenes(false);
      activeScenes.forEach(s => s.scene.resume());
    }
    setIsPaused(false);
  };

  const restartCurrentStage = () => {
    if (!gameRef.current) return;
    const game = gameRef.current;
    const activeScenes = game.scene.getScenes(true);
    activeScenes.forEach(s => game.scene.stop(s.scene.key));
    game.scene.start(currentStage);
    setIsPaused(false);
  };

  const switchStage = (stageKey: string) => {
    if (!gameRef.current) return;
    const game = gameRef.current;
    const activeScenes = game.scene.getScenes(true);
    activeScenes.forEach(s => game.scene.stop(s.scene.key));

    game.scene.start(stageKey);
    setCurrentStage(stageKey);
    setIsPaused(false);
    setIsMenuOpen(false);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    SFX.setMuted(next);
  };

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-[#070F08] select-none touch-none">
      {/* Immersive Full Screen Game Viewport */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden p-0">
        {/* Responsive Canvas Frame */}
        <div className="relative w-full h-full max-w-[800px] max-h-[800px] aspect-square flex items-center justify-center bg-black overflow-hidden shadow-2xl">
          {/* Phaser Canvas */}
          <div
            id="phaser-game-container"
            ref={containerRef}
            className="w-full h-full flex items-center justify-center pixelated"
          />

          {/* On-Screen Touch Pads */}
          <TouchOverlay visible={showTouchPads} />
        </div>

        {/* Minimal Floating Pause Button (Top-Right of game arena) */}
        {!isMenuOpen && (
          <button
            onClick={() => {
              SFX.play('click');
              togglePause();
            }}
            className="absolute top-2.5 right-2.5 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 border border-green-700/80 text-green-300 hover:text-white shadow-lg backdrop-blur-sm transition-all active:scale-95"
            title="Pausar Juego (Escape / P)"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span className="text-[10px] font-bold tracking-wider pixel-font">PAUSA</span>
          </button>
        )}
      </main>

      {/* Pause Modal (Shows when game is paused) */}
      <PauseModal
        isOpen={isPaused}
        onResume={resumeGame}
        onRestart={restartCurrentStage}
        onOpenMainMenu={() => {
          setIsPaused(false);
          setIsMenuOpen(true);
        }}
        onSelectStage={switchStage}
        currentStage={currentStage}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        showTouchPads={showTouchPads}
        onToggleTouchPads={() => setShowTouchPads(p => !p)}
      />

      {/* Main Menu Modal (1 Player, Multiplayer, Skins) */}
      <GameMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onStartStage={switchStage}
      />
    </div>
  );
}
