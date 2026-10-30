import { GameMode, Difficulty, PlayerConfig, TournamentScore, Skin } from './types';

export const INITIAL_SKINS: Skin[] = [
  {
    id: 'default',
    name: 'Monarca Clásica',
    description: 'La legendaria mariposa naranja con venas negras del Bioparque Monarca.',
    primaryColor: '#FF6F00',
    secondaryColor: '#FFA000',
    unlocked: true,
    unlockCondition: 'Desbloqueado por defecto',
    icon: '🦋',
  },
  {
    id: 'gold',
    name: 'Monarca Dorada Solar',
    description: 'Brilla con la energía solar de los cielos andinos de Tenjo.',
    primaryColor: '#FFD700',
    secondaryColor: '#FFF59D',
    unlocked: false,
    unlockCondition: 'Supera el Modo 1 Jugador en cualquier dificultad',
    icon: '✨',
  },
  {
    id: 'emerald',
    name: 'Monarca Esmeralda Boscosa',
    description: 'Homenaje a los bosques nativos y cerros tutelares de Cundinamarca.',
    primaryColor: '#00E676',
    secondaryColor: '#B9F6CA',
    unlocked: false,
    unlockCondition: 'Gana un Torneo Multijugador con al menos 2 humanos',
    icon: '🍃',
  },
  {
    id: 'purple_royal',
    name: 'Monarca Real Púrpura',
    description: 'Inspirada en el néctar de las flores silvestres de la sabana.',
    primaryColor: '#8E24AA',
    secondaryColor: '#E1BEE7',
    unlocked: false,
    unlockCondition: 'Consigue 300 Puntos de Conservación',
    icon: '👑',
  },
];

class GameManagerService {
  public mode: GameMode = 'multiplayer';
  public difficulty: Difficulty = 'normal';
  public soloStageSelected: number = 1;
  public botFill: boolean = true;
  public humanCount: number = 1;
  public currentStageIndex: number = 0; // 0: Caterpillar, 1: Chrysalis, 2: Butterfly
  public conservationPoints: number = 0;
  public skins: Skin[] = INITIAL_SKINS;
  public selectedSkinId: string = 'default';

  public players: PlayerConfig[] = [];
  public scores: TournamentScore[] = [];

  private listeners: Array<() => void> = [];

  constructor() {
    this.loadState();
    this.setupPlayers(1, true);
  }

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  public notify() {
    this.listeners.forEach(cb => cb());
  }

  public loadState() {
    try {
      const savedPC = localStorage.getItem('monarchfest_pc');
      if (savedPC) this.conservationPoints = parseInt(savedPC, 10) || 0;

      const savedSkins = localStorage.getItem('monarchfest_unlocked_skins');
      if (savedSkins) {
        const unlockedIds: string[] = JSON.parse(savedSkins);
        this.skins = this.skins.map(skin => ({
          ...skin,
          unlocked: skin.unlocked || unlockedIds.includes(skin.id),
        }));
      }

      const activeSkin = localStorage.getItem('monarchfest_active_skin');
      if (activeSkin) this.selectedSkinId = activeSkin;
    } catch {
      // Ignore localStorage restrictions
    }
  }

  public saveState() {
    try {
      localStorage.setItem('monarchfest_pc', this.conservationPoints.toString());
      const unlockedIds = this.skins.filter(s => s.unlocked).map(s => s.id);
      localStorage.setItem('monarchfest_unlocked_skins', JSON.stringify(unlockedIds));
      localStorage.setItem('monarchfest_active_skin', this.selectedSkinId);
    } catch {
      // Ignore
    }
  }

  public addConservationPoints(amount: number) {
    this.conservationPoints += amount;
    if (this.conservationPoints >= 300) {
      this.unlockSkin('purple_royal');
    }
    this.saveState();
    this.notify();
  }

  public unlockSkin(skinId: string): boolean {
    const skin = this.skins.find(s => s.id === skinId);
    if (skin && !skin.unlocked) {
      skin.unlocked = true;
      this.saveState();
      this.notify();
      return true;
    }
    return false;
  }

  public setSkin(skinId: string) {
    const skin = this.skins.find(s => s.id === skinId);
    if (skin && skin.unlocked) {
      this.selectedSkinId = skinId;
      this.saveState();
      this.notify();
    }
  }

  public setupPlayers(humanCount: number, botFill: boolean, mode: GameMode = 'multiplayer') {
    this.mode = mode;
    this.humanCount = humanCount;
    this.botFill = botFill;

    const baseConfigs: Array<Omit<PlayerConfig, 'isBot' | 'botPersonality'>> = [
      { id: 0, name: 'Jugador 1', color: 0xFF6F00, hexColor: '#FF6F00', keyName: 'W / Espacio', keyCode: 'KeyW', skinId: this.selectedSkinId },
      { id: 1, name: 'Jugador 2', color: 0x1976D2, hexColor: '#1976D2', keyName: 'Flecha Arriba ↑', keyCode: 'ArrowUp', skinId: 'default' },
      { id: 2, name: 'Jugador 3', color: 0x388E3C, hexColor: '#388E3C', keyName: 'Tecla C', keyCode: 'KeyC', skinId: 'default' },
      { id: 3, name: 'Jugador 4', color: 0x7B1FA2, hexColor: '#7B1FA2', keyName: 'Tecla M', keyCode: 'KeyM', skinId: 'default' },
    ];

    const botPersonalities: Array<'aggressive' | 'interceptor' | 'chaotic'> = [
      'aggressive', // Hormiga Guerrera
      'interceptor', // Calandria Astuta
      'chaotic', // Avispa Caótica
    ];

    const botNames = ['Hormiga Guerrera', 'Calandria Astuta', 'Avispa Caótica'];

    const newPlayers: PlayerConfig[] = [];
    const totalSlots = (mode === 'solo') ? (botFill ? 4 : 1) : (botFill ? 4 : humanCount);

    for (let i = 0; i < totalSlots; i++) {
      const isHuman = (mode === 'solo' && i === 0) || (mode === 'multiplayer' && i < humanCount);
      const personality = !isHuman ? botPersonalities[(i - humanCount + 3) % 3] : undefined;
      const displayName = isHuman ? baseConfigs[i].name : `Bot (${botNames[(i - 1) % botNames.length]})`;

      newPlayers.push({
        ...baseConfigs[i],
        name: displayName,
        isBot: !isHuman,
        botPersonality: personality,
        skinId: i === 0 ? this.selectedSkinId : 'default',
      });
    }

    this.players = newPlayers;
    this.resetTournamentScores();
    this.notify();
  }

  public resetTournamentScores() {
    this.scores = this.players.map(p => ({
      playerId: p.id,
      stage1Points: 0,
      stage1TournamentPts: 0,
      stage2Points: 0,
      stage2TournamentPts: 0,
      stage3Points: 0,
      stage3TournamentPts: 0,
      totalTournamentPts: 0,
    }));
  }

  public recordStage1Scores(rawPoints: { [id: number]: number }) {
    // Sort players by leaf count descending
    const sorted = [...this.players].sort((a, b) => (rawPoints[b.id] || 0) - (rawPoints[a.id] || 0));
    const tournamentPointsDist = [3, 2, 1, 0];

    sorted.forEach((p, rank) => {
      const scoreObj = this.scores.find(s => s.playerId === p.id);
      if (scoreObj) {
        scoreObj.stage1Points = rawPoints[p.id] || 0;
        scoreObj.stage1TournamentPts = tournamentPointsDist[rank] || 0;
        scoreObj.totalTournamentPts = scoreObj.stage1TournamentPts + scoreObj.stage2TournamentPts + scoreObj.stage3TournamentPts;
      }
    });
    this.notify();
  }

  public recordStage2Scores(roundWins: { [id: number]: number }) {
    // Sort players by chrysalis round wins
    const sorted = [...this.players].sort((a, b) => (roundWins[b.id] || 0) - (roundWins[a.id] || 0));
    const tournamentPointsDist = [3, 2, 1, 0];

    sorted.forEach((p, rank) => {
      const scoreObj = this.scores.find(s => s.playerId === p.id);
      if (scoreObj) {
        scoreObj.stage2Points = roundWins[p.id] || 0;
        scoreObj.stage2TournamentPts = tournamentPointsDist[rank] || 0;
        scoreObj.totalTournamentPts = scoreObj.stage1TournamentPts + scoreObj.stage2TournamentPts + scoreObj.stage3TournamentPts;
      }
    });
    this.notify();
  }

  public recordStage3Scores(survivalRanks: { [id: number]: number }) {
    // survivalRanks: 1st place gets rank 1, 2nd gets rank 2, etc.
    const sorted = [...this.players].sort((a, b) => (survivalRanks[a.id] || 4) - (survivalRanks[b.id] || 4));
    const tournamentPointsDist = [5, 3, 2, 1];

    sorted.forEach((p, rank) => {
      const scoreObj = this.scores.find(s => s.playerId === p.id);
      if (scoreObj) {
        scoreObj.stage3Points = 4 - rank;
        scoreObj.stage3TournamentPts = tournamentPointsDist[rank] || 0;
        scoreObj.totalTournamentPts = scoreObj.stage1TournamentPts + scoreObj.stage2TournamentPts + scoreObj.stage3TournamentPts;
      }
    });

    // Check reward skin unlocks
    if (this.mode === 'solo') {
      this.unlockSkin('gold');
    } else if (this.humanCount >= 2) {
      this.unlockSkin('emerald');
    }

    // Award conservation points: +200 if human winner, +60 otherwise
    const overallWinner = this.getOverallWinner();
    if (overallWinner && !overallWinner.isBot) {
      this.addConservationPoints(200);
    } else {
      this.addConservationPoints(60);
    }

    this.notify();
  }

  public getOverallWinner(): PlayerConfig | null {
    if (this.scores.length === 0) return null;
    const sortedScores = [...this.scores].sort((a, b) => b.totalTournamentPts - a.totalTournamentPts);
    const topScore = sortedScores[0];
    return this.players.find(p => p.id === topScore.playerId) || null;
  }
}

export const GameManager = new GameManagerService();
