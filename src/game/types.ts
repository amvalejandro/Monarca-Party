export type GameMode = 'solo' | 'multiplayer' | 'practice';

export type StageId = 'caterpillar' | 'chrysalis' | 'butterfly';

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface PlayerConfig {
  id: number; // 0, 1, 2, 3
  name: string;
  color: number;
  hexColor: string;
  isBot: boolean;
  botPersonality?: 'aggressive' | 'interceptor' | 'chaotic';
  keyName: string; // 'W', '↑', 'C', 'M'
  keyCode: string;
  skinId: string;
}

export interface TournamentScore {
  playerId: number;
  stage1Points: number; // Algodoncillo leaves
  stage1TournamentPts: number;
  stage2Points: number; // Chrysalis round wins
  stage2TournamentPts: number;
  stage3Points: number; // Butterfly survival rank
  stage3TournamentPts: number;
  totalTournamentPts: number;
}

export interface Skin {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  unlocked: boolean;
  unlockCondition: string;
  icon: string;
}

export interface ChrysalisRoundResult {
  round: number;
  winnerId: number | null;
  reactionTimes: { [playerId: number]: number | 'early' | 'late' };
}
