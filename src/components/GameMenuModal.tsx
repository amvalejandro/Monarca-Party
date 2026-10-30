import React, { useState } from 'react';
import { GameManager } from '../game/GameManager';
import { Difficulty, GameMode } from '../game/types';
import { SFX } from '../game/audio';
import { Trophy, Users, User, Settings, Sparkles, Volume2, VolumeX, Play, ShieldAlert, Award, Compass } from 'lucide-react';

interface GameMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartStage: (stageKey: string) => void;
}

export const GameMenuModal: React.FC<GameMenuModalProps> = ({
  isOpen,
  onClose,
  onStartStage,
}) => {
  const [activeTab, setActiveTab] = useState<'solo' | 'multiplayer' | 'skins' | 'about'>('multiplayer');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');
  const [humanPlayers, setHumanPlayers] = useState<number>(2);
  const [enableBots, setEnableBots] = useState<boolean>(true);
  const [selectedSoloStage, setSelectedSoloStage] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(SFX.getMuted());

  if (!isOpen) return null;

  const handleStartSolo = (stageNum: number) => {
    SFX.play('click');
    GameManager.difficulty = selectedDifficulty;
    GameManager.setupPlayers(1, enableBots, 'solo');

    let stageKey = 'CaterpillarScene';
    if (stageNum === 2) stageKey = 'ChrysalisScene';
    if (stageNum === 3) stageKey = 'ButterflyScene';

    onStartStage(stageKey);
    onClose();
  };

  const handleStartMultiplayer = () => {
    SFX.play('click');
    GameManager.difficulty = 'normal';
    GameManager.setupPlayers(humanPlayers, enableBots, 'multiplayer');
    onStartStage('CaterpillarScene');
    onClose();
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    SFX.setMuted(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#1B3814] to-[#0A1608] border-4 border-[#4CAF50] rounded-3xl p-6 text-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-green-800/80 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🦋</span>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-amber-400 tracking-wide pixel-font">
                MONARCA PARTY
              </h2>
              <p className="text-xs text-green-300 font-medium">
                Bioparque Monarca • Tenjo, Cundinamarca • 1-4 Jugadores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl bg-green-900/60 hover:bg-green-800 text-green-200 transition-colors"
              title={isMuted ? 'Activar Sonido' : 'Silenciar'}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-green-300" />}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs"
            >
              CERRAR ✕
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-4 gap-2 mb-4 bg-black/40 p-1.5 rounded-2xl border border-green-900">
          <button
            onClick={() => { SFX.play('click'); setActiveTab('solo'); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'solo'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-green-300 hover:text-white hover:bg-green-950/40'
            }`}
          >
            <User className="w-4 h-4" /> 1 Jugador
          </button>

          <button
            onClick={() => { SFX.play('click'); setActiveTab('multiplayer'); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'multiplayer'
                ? 'bg-green-600 text-white shadow-md'
                : 'text-green-300 hover:text-white hover:bg-green-950/40'
            }`}
          >
            <Users className="w-4 h-4" /> Varios Jugadores
          </button>

          <button
            onClick={() => { SFX.play('click'); setActiveTab('skins'); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'skins'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-green-300 hover:text-white hover:bg-green-950/40'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Skins & PC
          </button>

          <button
            onClick={() => { SFX.play('click'); setActiveTab('about'); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'about'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-green-300 hover:text-white hover:bg-green-950/40'
            }`}
          >
            <Compass className="w-4 h-4" /> Bioparque
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* TAB 1: MODO 1 JUGADOR (SOLITARIO) */}
          {activeTab === 'solo' && (
            <div className="space-y-4">
              <div className="bg-amber-950/40 border border-amber-800/60 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <Award className="w-4 h-4" /> Recompensa de Conservación
                  </h4>
                  <p className="text-xs text-amber-100/80">
                    ¡Completa las etapas en solitario para desbloquear la skin <strong>"Monarca Dorada Solar"</strong>!
                  </p>
                </div>
                <span className="text-2xl">✨</span>
              </div>

              {/* Difficulty selector */}
              <div>
                <label className="text-xs font-bold text-green-300 uppercase tracking-wider block mb-2">
                  Dificultad de la Partida:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'normal', 'hard'] as Difficulty[]).map(diff => (
                    <button
                      key={diff}
                      onClick={() => { SFX.play('click'); setSelectedDifficulty(diff); }}
                      className={`py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                        selectedDifficulty === diff
                          ? 'bg-amber-600 border-amber-400 text-white shadow-lg'
                          : 'bg-green-950/50 border-green-900 text-green-300 hover:bg-green-900/60'
                      }`}
                    >
                      {diff === 'easy' ? '🌱 Fácil' : diff === 'normal' ? '⚖️ Normal' : '🔥 Difícil'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bots Toggle */}
              <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-green-900">
                <span className="text-xs text-green-200">
                  Rellenar rivales con Bots IA (3 bots):
                </span>
                <button
                  onClick={() => setEnableBots(!enableBots)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    enableBots ? 'bg-green-600 text-white' : 'bg-neutral-700 text-neutral-300'
                  }`}
                >
                  {enableBots ? 'SÍ (Activados)' : 'NO (Solo Yo)'}
                </button>
              </div>

              {/* 3 Stages list */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-green-300 uppercase tracking-wider block">
                  Elige la Etapa a Jugar:
                </label>

                {/* Stage 1 */}
                <div className="p-3.5 bg-black/40 border border-green-800 rounded-2xl flex items-center justify-between hover:border-green-500 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🐛</span>
                    <div>
                      <h4 className="font-bold text-sm text-amber-300">Etapa 1: La Carrera del Algodoncillo</h4>
                      <p className="text-xs text-green-200/80">
                        Oruga: recolecta hojas (+1pt), esquiva hormigas (-1pt). Pulsa tu botón para invertir dirección.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartSolo(1)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5" /> JUGAR
                  </button>
                </div>

                {/* Stage 2 */}
                <div className="p-3.5 bg-black/40 border border-green-800 rounded-2xl flex items-center justify-between hover:border-green-500 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✨</span>
                    <div>
                      <h4 className="font-bold text-sm text-purple-300">Etapa 2: El Ritmo de la Metamorfosis</h4>
                      <p className="text-xs text-green-200/80">
                        Crisálida: mantén oprimido tu botón y suelta exactamente en la señal. Quien se acerque más gana 1pt (3 rondas).
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartSolo(2)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5" /> JUGAR
                  </button>
                </div>

                {/* Stage 3 */}
                <div className="p-3.5 bg-black/40 border border-green-800 rounded-2xl flex items-center justify-between hover:border-green-500 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🦋</span>
                    <div>
                      <h4 className="font-bold text-sm text-blue-300">Etapa 3: La Migración Final</h4>
                      <p className="text-xs text-green-200/80">
                        Mariposa estilo Flappy: aletea para esquivar calandrias predatorias y ráfagas de viento. ¡El último en pie gana!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartSolo(3)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5" /> JUGAR
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MODO VARIOS JUGADORES (TORNEO) */}
          {activeTab === 'multiplayer' && (
            <div className="space-y-4">
              {/* Human Player Selector */}
              <div>
                <label className="text-xs font-bold text-green-300 uppercase tracking-wider block mb-2">
                  1. Cantidad de Jugadores Humanos:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      onClick={() => { SFX.play('click'); setHumanPlayers(num); }}
                      className={`py-3 rounded-2xl border flex flex-col items-center justify-center font-bold text-sm transition-all ${
                        humanPlayers === num
                          ? 'bg-green-600 border-green-300 text-white ring-4 ring-green-500/40 shadow-lg'
                          : 'bg-green-950/40 border-green-900 text-green-300 hover:bg-green-900/60'
                      }`}
                    >
                      <span>{num} {num === 1 ? 'Jugador' : 'Jugadores'}</span>
                      <span className="text-[10px] text-green-200 mt-0.5">
                        {num === 1 ? 'P1' : num === 2 ? 'P1 y P2' : num === 3 ? 'P1, P2 y P3' : 'P1 a P4'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bots Option */}
              <div className="p-3.5 bg-black/40 rounded-2xl border border-green-900 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-green-300">
                    2. Activar Bots IA:
                  </h4>
                  <p className="text-xs text-green-200/80">
                    {enableBots
                      ? `Rellena automáticamente las plazas restantes hasta 4 competidores (${4 - humanPlayers} bot${4 - humanPlayers === 1 ? '' : 's'}).`
                      : `Sin bots: solo competirán los ${humanPlayers} jugadores humanos seleccionados.`}
                  </p>
                </div>
                <button
                  onClick={() => { SFX.play('click'); setEnableBots(!enableBots); }}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                    enableBots ? 'bg-amber-600 text-white' : 'bg-neutral-700 text-neutral-300'
                  }`}
                >
                  {enableBots ? 'ACTIVADOS ✓' : 'DESACTIVADOS ✕'}
                </button>
              </div>

              {/* Controls Map Card */}
              <div className="p-3.5 bg-black/50 rounded-2xl border border-green-950">
                <h4 className="text-xs font-bold text-amber-300 mb-2 uppercase tracking-wide">
                  🎮 Asignación de Teclas y Controles PC:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800 text-center">
                    <span className="font-bold text-amber-400 block">P1 (Naranja)</span>
                    <span className="text-white font-mono mt-1 block">W / Espacio</span>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-950/40 border border-blue-800 text-center">
                    <span className="font-bold text-blue-400 block">P2 (Azul)</span>
                    <span className="text-white font-mono mt-1 block">Flecha Arriba ↑</span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800 text-center">
                    <span className="font-bold text-emerald-400 block">P3 (Verde)</span>
                    <span className="text-white font-mono mt-1 block">Tecla C</span>
                  </div>
                  <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-800 text-center">
                    <span className="font-bold text-purple-400 block">P4 (Púrpura)</span>
                    <span className="text-white font-mono mt-1 block">Tecla M</span>
                  </div>
                </div>
                <p className="text-[11px] text-green-300/70 mt-2 text-center">
                  📱 En móviles o pantallas táctiles: Cada jugador toca o mantiene su cuadrante correspondiente en pantalla.
                </p>
              </div>

              {/* Start Tournament Button */}
              <button
                onClick={handleStartMultiplayer}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-green-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white font-black text-sm md:text-base rounded-2xl shadow-xl transition-all transform active:scale-98 flex items-center justify-center gap-2 pixel-font"
              >
                <Play className="w-5 h-5" /> ¡INICIAR TORNEO COMPLETO (3 RONDAS)!
              </button>
            </div>
          )}

          {/* TAB 3: SKINS & PUNTOS DE CONSERVACIÓN */}
          {activeTab === 'skins' && (
            <div className="space-y-4">
              <div className="p-3 bg-gradient-to-r from-purple-900/60 to-green-900/60 border border-purple-500/40 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-purple-200 uppercase font-bold block">
                    Puntos de Conservación Acumulados:
                  </span>
                  <span className="text-2xl font-black text-amber-300 pixel-font">
                    🌱 {GameManager.conservationPoints} PC
                  </span>
                </div>
                <p className="text-[11px] text-green-200/80 max-w-[200px] text-right">
                  Gana torneos en el Bioparque para obtener más puntos y desbloquear mariposas raras.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-green-300 uppercase tracking-wider block">
                  Skins de Mariposa Desbloqueables:
                </label>
                {GameManager.skins.map(skin => {
                  const isSelected = GameManager.selectedSkinId === skin.id;
                  return (
                    <div
                      key={skin.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-purple-950/60 border-purple-400 ring-2 ring-purple-400/50'
                          : skin.unlocked
                          ? 'bg-black/40 border-green-800 hover:border-green-600'
                          : 'bg-black/30 border-neutral-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{skin.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white">{skin.name}</h4>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-600 text-[10px] font-bold">
                                EQUIPADA
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-green-200/80">{skin.description}</p>
                          <p className="text-[10px] text-amber-300 mt-0.5">
                            {skin.unlocked ? '✓ Desbloqueada' : `🔒 ${skin.unlockCondition}`}
                          </p>
                        </div>
                      </div>

                      {skin.unlocked ? (
                        <button
                          onClick={() => {
                            SFX.play('click');
                            GameManager.setSkin(skin.id);
                          }}
                          disabled={isSelected}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                            isSelected
                              ? 'bg-purple-800/60 text-purple-200 cursor-default'
                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                          }`}
                        >
                          {isSelected ? 'ACTIVA' : 'EQUIPAR'}
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-400 font-mono px-2 py-1 bg-black/40 rounded-lg">
                          BLOQUEADA
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: BIOPARQUE MONARCA & EDUCACIÓN */}
          {activeTab === 'about' && (
            <div className="space-y-3 text-xs text-green-100">
              <div className="p-4 bg-green-950/60 border border-green-800 rounded-2xl space-y-2">
                <h4 className="font-bold text-base text-amber-300 flex items-center gap-2">
                  🌿 Bioparque Monarca - Tenjo, Cundinamarca
                </h4>
                <p>
                  El Bioparque Monarca es un centro de educación ambiental y conservación ubicado en el municipio de Tenjo, Colombia, en la cordillera oriental de los Andes.
                </p>
                <p>
                  Su misión es proteger los corredores biológicos de polinizadores nativos y educar sobre la asombrosa metamorfosis de la mariposa monarca (<em>Danaus plexippus</em>) y su planta nutricia el algodoncillo (<em>Asclepias curassavica</em>).
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-black/40 border border-green-900 rounded-xl text-center">
                  <span className="text-xl block mb-1">🐛</span>
                  <span className="font-bold text-amber-300 block">Oruga</span>
                  <span className="text-[11px] text-green-200">Come algodoncillo para asimilar toxinas defensivas.</span>
                </div>
                <div className="p-3 bg-black/40 border border-green-900 rounded-xl text-center">
                  <span className="text-xl block mb-1">✨</span>
                  <span className="font-bold text-purple-300 block">Crisálida</span>
                  <span className="text-[11px] text-green-200">Estructura jade con puntos de oro reales para respirar.</span>
                </div>
                <div className="p-3 bg-black/40 border border-green-900 rounded-xl text-center">
                  <span className="text-xl block mb-1">🦋</span>
                  <span className="font-bold text-blue-300 block">Adulto</span>
                  <span className="text-[11px] text-green-200">Vuela y poliniza néctar en la sabana de Tenjo.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
