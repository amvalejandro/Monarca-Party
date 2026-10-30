import Phaser from 'phaser';
import confetti from 'canvas-confetti';
import { GameManager } from '../GameManager';
import { SFX } from '../audio';

export class FinalPodiumScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FinalPodiumScene' });
  }

  create() {
    SFX.play('win');

    // Confetti celebration explosion!
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#FF6F00', '#FFD700', '#00E676', '#81C784', '#1976D2'],
      });
      // Second burst
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
        });
      }, 500);
    } catch {
      // Safe fallback
    }

    // 1. Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1B3814, 0x1B3814, 0x061108, 0x061108, 1);
    bg.fillRect(0, 0, 800, 800);

    // 2. Grand Header
    this.add.text(400, 45, '🏆 GRAN FINAL DEL TORNEO 🏆', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '22px',
      color: '#FFD700',
    }).setOrigin(0.5);

    this.add.text(400, 78, 'Bioparque Monarca - Tenjo, Cundinamarca', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '16px',
      color: '#C8E6C9',
    }).setOrigin(0.5);

    // 3. Sort players by total tournament points
    const sorted = [...GameManager.players].sort((a, b) => {
      const sA = GameManager.scores.find(s => s.playerId === a.id);
      const sB = GameManager.scores.find(s => s.playerId === b.id);
      return (sB?.totalTournamentPts || 0) - (sA?.totalTournamentPts || 0);
    });

    const winner = sorted[0];

    // 4. Podium Graphic (1st, 2nd, 3rd)
    this.createPodium(sorted);

    // 5. Crown Winner Banner
    this.createWinnerBanner(winner);

    // 6. Final Scores Table
    this.createScoresTable(sorted);

    // 7. Navigation Buttons
    this.createActionButtons();
  }

  private createPodium(sorted: any[]) {
    const podiumGfx = this.add.graphics();

    // 1st place center pedestal (x: 400, y: 310, w: 140, h: 140)
    podiumGfx.fillStyle(0xFFB300, 1);
    podiumGfx.fillRoundedRect(330, 240, 140, 140, 8);
    podiumGfx.lineStyle(3, 0xFFD700, 1);
    podiumGfx.strokeRoundedRect(330, 240, 140, 140, 8);
    this.add.text(400, 310, '1°', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '32px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    // 2nd place left pedestal (x: 230, y: 340, w: 120, h: 100)
    if (sorted[1]) {
      podiumGfx.fillStyle(0x78909C, 1);
      podiumGfx.fillRoundedRect(170, 280, 120, 100, 8);
      podiumGfx.lineStyle(3, 0xCFD8DC, 1);
      podiumGfx.strokeRoundedRect(170, 280, 120, 100, 8);
      this.add.text(230, 330, '2°', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '24px',
        color: '#FFFFFF',
      }).setOrigin(0.5);
    }

    // 3rd place right pedestal (x: 570, y: 360, w: 120, h: 80)
    if (sorted[2]) {
      podiumGfx.fillStyle(0x8D6E63, 1);
      podiumGfx.fillRoundedRect(510, 300, 120, 80, 8);
      podiumGfx.lineStyle(3, 0xBCAAA4, 1);
      podiumGfx.strokeRoundedRect(510, 300, 120, 80, 8);
      this.add.text(570, 340, '3°', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '22px',
        color: '#FFFFFF',
      }).setOrigin(0.5);
    }

    // Place Butterfly Sprites on Pedestals
    if (sorted[0]) {
      const p1Sprite = this.add.sprite(400, 185, `butterfly_p${sorted[0].id}_0`);
      p1Sprite.setScale(2.2);
      this.tweens.add({ targets: p1Sprite, y: 175, yoyo: true, repeat: -1, duration: 400 });

      // Golden Trophy above champion
      const trophy = this.add.sprite(400, 120, 'trophy');
      trophy.setScale(1.6);
      this.tweens.add({ targets: trophy, y: 112, yoyo: true, repeat: -1, duration: 500 });
    }

    if (sorted[1]) {
      const p2Sprite = this.add.sprite(230, 235, `butterfly_p${sorted[1].id}_0`);
      p2Sprite.setScale(1.7);
      this.tweens.add({ targets: p2Sprite, y: 228, yoyo: true, repeat: -1, duration: 450 });
    }

    if (sorted[2]) {
      const p3Sprite = this.add.sprite(570, 255, `butterfly_p${sorted[2].id}_0`);
      p3Sprite.setScale(1.7);
      this.tweens.add({ targets: p3Sprite, y: 248, yoyo: true, repeat: -1, duration: 450 });
    }
  }

  private createWinnerBanner(winner: any) {
    const banner = this.add.graphics();
    banner.fillStyle(0x000000, 0.6);
    banner.fillRoundedRect(140, 395, 520, 52, 10);
    banner.lineStyle(2, winner ? winner.color : 0xFFD700, 1);
    banner.strokeRoundedRect(140, 395, 520, 52, 10);

    this.add.text(400, 421, `¡CAMPEÓN: ${winner?.name.toUpperCase()}!`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '15px',
      color: winner?.hexColor || '#FFD700',
    }).setOrigin(0.5);
  }

  private createScoresTable(sorted: any[]) {
    const tableBg = this.add.graphics();
    tableBg.fillStyle(0x0C1C0F, 0.85);
    tableBg.fillRoundedRect(80, 460, 640, 180, 10);
    tableBg.lineStyle(2, 0x2E7D32, 0.8);
    tableBg.strokeRoundedRect(80, 460, 640, 180, 10);

    // Table Header
    this.add.text(100, 475, 'JUGADOR', { fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#90A4AE' });
    this.add.text(320, 475, 'ORUGA', { fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#81C784' });
    this.add.text(430, 475, 'CRISÁLIDA', { fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#CE93D8' });
    this.add.text(560, 475, 'MARIPOSA', { fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#81D4FA' });
    this.add.text(670, 475, 'TOTAL', { fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#FFD700' });

    sorted.forEach((p, idx) => {
      const y = 505 + idx * 30;
      const s = GameManager.scores.find(item => item.playerId === p.id);

      this.add.text(100, y, `${idx + 1}. ${p.name.slice(0, 11)}`, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: p.hexColor,
      });

      this.add.text(340, y, `+${s?.stage1TournamentPts || 0}🏆`, { fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#C8E6C9' });
      this.add.text(460, y, `+${s?.stage2TournamentPts || 0}🏆`, { fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#E1BEE7' });
      this.add.text(580, y, `+${s?.stage3TournamentPts || 0}🏆`, { fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#B3E5FC' });
      this.add.text(675, y, `${s?.totalTournamentPts || 0} pts`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '11px',
        color: '#FFD700',
      });
    });
  }

  private createActionButtons() {
    // 1. REPETIR TORNEO
    const retryBtn = this.add.container(260, 680);
    const retryBg = this.add.graphics();
    retryBg.fillStyle(0x00C853, 1);
    retryBg.fillRoundedRect(-140, -25, 280, 50, 10);
    retryBg.lineStyle(2, 0xB9F6CA, 1);
    retryBg.strokeRoundedRect(-140, -25, 280, 50, 10);
    const retryTxt = this.add.text(0, 0, '🔄 JUGAR DE NUEVO', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#FFFFFF',
    }).setOrigin(0.5);
    retryBtn.add([retryBg, retryTxt]);
    retryBtn.setSize(280, 50);
    retryBtn.setInteractive({ useHandCursor: true });
    retryBtn.on('pointerdown', () => {
      SFX.play('click');
      GameManager.resetTournamentScores();
      this.scene.start('CaterpillarScene');
    });

    // 2. VOLVER AL MENÚ
    const menuBtn = this.add.container(540, 680);
    const menuBg = this.add.graphics();
    menuBg.fillStyle(0x37474F, 1);
    menuBg.fillRoundedRect(-140, -25, 280, 50, 10);
    menuBg.lineStyle(2, 0x78909C, 1);
    menuBg.strokeRoundedRect(-140, -25, 280, 50, 10);
    const menuTxt = this.add.text(0, 0, '🏠 MENÚ PRINCIPAL', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#FFFFFF',
    }).setOrigin(0.5);
    menuBtn.add([menuBg, menuTxt]);
    menuBtn.setSize(280, 50);
    menuBtn.setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => {
      SFX.play('click');
      // Trigger UI menu open
      window.dispatchEvent(new CustomEvent('monarca-open-menu'));
    });
  }
}
