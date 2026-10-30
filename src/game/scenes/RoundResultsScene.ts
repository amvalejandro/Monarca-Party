import Phaser from 'phaser';
import { GameManager } from '../GameManager';
import { SFX } from '../audio';

interface RoundResultsData {
  stageIndex: number;
  stageName: string;
  rawScores: { [id: number]: number };
  nextStageKey: string;
}

export class RoundResultsScene extends Phaser.Scene {
  private dataPayload!: RoundResultsData;
  private autoAdvanceTimer: number = 5; // seconds
  private autoTimerText!: Phaser.GameObjects.Text;
  private autoTimerEvent!: Phaser.Time.TimerEvent;
  private progressBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'RoundResultsScene' });
  }

  init(data: RoundResultsData) {
    this.dataPayload = data;
    this.autoAdvanceTimer = 5;
  }

  create() {
    SFX.play('win');

    // 1. Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x112415, 0x112415, 0x071109, 0x071109, 1);
    bg.fillRect(0, 0, 800, 800);

    // Decorative floating spores
    for (let i = 0; i < 20; i++) {
      const p = this.add.circle(Phaser.Math.Between(40, 760), Phaser.Math.Between(40, 760), 3, 0xFFD700, 0.4);
      this.tweens.add({
        targets: p,
        alpha: { from: 0.2, to: 0.8 },
        scale: { from: 0.8, to: 1.5 },
        yoyo: true,
        repeat: -1,
        duration: Phaser.Math.Between(1000, 2500),
      });
    }

    // 2. Title & Header
    const stageNum = (this.dataPayload?.stageIndex ?? 0) + 1;
    this.add.text(400, 48, `RESULTADOS ETAPA ${stageNum}/3`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#FFD700',
    }).setOrigin(0.5);

    this.add.text(400, 78, this.dataPayload?.stageName || '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#81C784',
    }).setOrigin(0.5);

    // 3. Educational Fact Box from Bioparque Monarca
    this.createEducationalFact(stageNum);

    // 4. Animate Stage Results in Order
    this.animateScoresList();

    // 5. Automatic Advance Timer Bar & Button
    this.createAutoAdvanceUI();
  }

  private createEducationalFact(stageNum: number) {
    const facts = [
      '🌱 En el Bioparque Monarca de Tenjo, la oruga se alimenta exclusivamente de algodoncillo (Asclepias), acumulando toxinas defensivas.',
      '✨ La crisálida de la monarca posee puntos dorados brillantes que funcionan como válvulas respiratorias e hidrostáticas.',
      '🦋 Las mariposas monarca vuelan miles de kilómetros navegando con la posición del sol y el campo magnético terrestre.',
    ];

    const factBox = this.add.graphics();
    factBox.fillStyle(0x000000, 0.45);
    factBox.fillRoundedRect(60, 115, 680, 50, 8);
    factBox.lineStyle(2, 0x2E7D32, 0.7);
    factBox.strokeRoundedRect(60, 115, 680, 50, 8);

    this.add.text(400, 140, facts[stageNum - 1] || facts[0], {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#C8E6C9',
      align: 'center',
      wordWrap: { width: 650 },
    }).setOrigin(0.5);
  }

  private animateScoresList() {
    const stageIdx = this.dataPayload?.stageIndex ?? 0;
    const sorted = [...GameManager.players].sort((a, b) => {
      const sA = GameManager.scores.find(s => s.playerId === a.id);
      const sB = GameManager.scores.find(s => s.playerId === b.id);
      const ptsA = stageIdx === 0 ? sA?.stage1TournamentPts || 0 : sA?.stage2TournamentPts || 0;
      const ptsB = stageIdx === 0 ? sB?.stage1TournamentPts || 0 : sB?.stage2TournamentPts || 0;
      return ptsB - ptsA;
    });

    const medals = ['🥇 1°', '🥈 2°', '🥉 3°', '🎖 4°'];

    sorted.forEach((player, rank) => {
      const y = 195 + rank * 88;
      const scoreObj = GameManager.scores.find(s => s.playerId === player.id);
      const stagePts = stageIdx === 0 ? scoreObj?.stage1TournamentPts || 0 : scoreObj?.stage2TournamentPts || 0;
      const rawVal = stageIdx === 0 ? scoreObj?.stage1Points || 0 : scoreObj?.stage2Points || 0;
      const rawUnit = stageIdx === 0 ? 'pts carrera' : 'victorias';

      const card = this.add.graphics();
      card.fillStyle(0x1B2E1D, 0.75);
      card.fillRoundedRect(70, y, 660, 75, 10);
      card.lineStyle(2, player.color, 0.9);
      card.strokeRoundedRect(70, y, 660, 75, 10);

      // Medal & Rank
      this.add.text(105, y + 38, medals[rank], {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '15px',
        color: rank === 0 ? '#FFD700' : '#ECEFF1',
      }).setOrigin(0, 0.5);

      // Player Name
      this.add.text(220, y + 26, player.name, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
        color: player.hexColor,
      });

      // Raw stage stat
      this.add.text(220, y + 50, `${rawVal} ${rawUnit} obtenidos`, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '13px',
        color: '#A5D6A7',
      });

      // Stage Points Awarded (+X 🏆)
      this.add.text(560, y + 30, `+${stagePts} 🏆`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '16px',
        color: '#FFD700',
      }).setOrigin(0, 0.5);

      // Cumulative Total
      this.add.text(560, y + 52, `Total: ${scoreObj?.totalTournamentPts || 0} pts`, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '13px',
        color: '#CFD8DC',
      });

      // Staggered slide in animation
      card.x = -600;
      this.tweens.add({
        targets: card,
        x: 0,
        duration: 400,
        delay: rank * 140,
        ease: 'Back.easeOut',
      });
    });
  }

  private createAutoAdvanceUI() {
    // Progress Bar Background
    const barBg = this.add.graphics();
    barBg.fillStyle(0x0A160A, 0.9);
    barBg.fillRoundedRect(160, 640, 480, 12, 6);
    barBg.lineStyle(2, 0x2E7D32, 0.8);
    barBg.strokeRoundedRect(160, 640, 480, 12, 6);

    this.progressBar = this.add.graphics();
    this.updateProgressBar(1);

    // Auto-advance indicator
    this.autoTimerText = this.add.text(400, 665, `▶ Siguiente etapa automática en ${this.autoAdvanceTimer}s...`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#FFD700',
    }).setOrigin(0.5);

    // Manual Skip Button
    const btnContainer = this.add.container(400, 720);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x00C853, 1);
    btnBg.fillRoundedRect(-140, -22, 280, 44, 10);
    btnBg.lineStyle(2, 0xB9F6CA, 1);
    btnBg.strokeRoundedRect(-140, -22, 280, 44, 10);

    const btnText = this.add.text(0, 0, 'SALTAR AHORA ▶', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    btnContainer.add([btnBg, btnText]);
    btnContainer.setSize(280, 44);
    btnContainer.setInteractive({ useHandCursor: true });

    const proceedNext = () => {
      if (this.autoTimerEvent) this.autoTimerEvent.remove();
      SFX.play('click');
      this.scene.start(this.dataPayload.nextStageKey);
    };

    btnContainer.on('pointerdown', proceedNext);
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).once('down', proceedNext);
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).once('down', proceedNext);

    // 1-second interval counting down automatically to next stage
    const totalDuration = this.autoAdvanceTimer;
    this.autoTimerEvent = this.time.addEvent({
      delay: 1000,
      repeat: totalDuration - 1,
      callback: () => {
        this.autoAdvanceTimer--;
        this.autoTimerText.setText(`▶ Siguiente etapa automática en ${this.autoAdvanceTimer}s...`);
        this.updateProgressBar(this.autoAdvanceTimer / totalDuration);

        if (this.autoAdvanceTimer <= 0) {
          proceedNext();
        }
      },
    });
  }

  private updateProgressBar(ratio: number) {
    this.progressBar.clear();
    this.progressBar.fillStyle(0x00E676, 1);
    const width = Math.max(0, 476 * ratio);
    this.progressBar.fillRoundedRect(162, 642, width, 8, 4);
  }
}
