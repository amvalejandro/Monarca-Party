import Phaser from 'phaser';
import { GameManager } from '../GameManager';
import { SFX } from '../audio';
import { generateGameTextures } from '../sprites';

type PlayerHoldState = {
  isHolding: boolean;
  hasReleased: boolean;
  isDisqualified: boolean;
  releaseTime: number | null; // timestamp
  reactionMs: number | null; // delta from target cue
};

export class ChrysalisScene extends Phaser.Scene {
  private currentSubRound: number = 1;
  private maxSubRounds: number = 3;
  private roundWins: { [id: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0 };

  private playerStates: { [id: number]: PlayerHoldState } = {};
  private chrysalisSprites: Phaser.GameObjects.Sprite[] = [];
  private playerStatusTexts: Phaser.GameObjects.Text[] = [];
  private roundIndicatorText!: Phaser.GameObjects.Text;
  private mainInstructionText!: Phaser.GameObjects.Text;

  private allHolding: boolean = false;
  private cueTriggered: boolean = false;
  private cueTimestamp: number = 0;
  private roundResolved: boolean = false;
  private pulseCircle!: Phaser.GameObjects.Arc;
  private targetRing!: Phaser.GameObjects.Arc;
  private heartbeatTimer: Phaser.Time.TimerEvent | null = null;
  private cueTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'ChrysalisScene' });
  }

  create() {
    generateGameTextures(this);
    this.currentSubRound = 1;
    this.roundWins = { 0: 0, 1: 0, 2: 0, 3: 0 };
    GameManager.players.forEach(p => {
      this.roundWins[p.id] = 0;
    });

    // 1. Natural Background (Dark Cocoon Chamber with bioluminescent particles)
    this.createBackground();

    // 2. Chrysalis layout (4 silk branches)
    this.createChrysalises();

    // 3. Central Pulse Rings
    this.createPulseRings();

    // 4. UI & Instructions
    this.createUI();

    // 5. Input Listeners
    this.setupInputs();

    // 6. Start Sub-Round 1
    this.startSubRound();
  }

  private createBackground() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0E2412, 0x0E2412, 0x061108, 0x061108, 1);
    bg.fillRect(0, 0, 800, 800);

    // Glowing organic spores floating in air
    for (let i = 0; i < 24; i++) {
      const spore = this.add.circle(
        Phaser.Math.Between(40, 760),
        Phaser.Math.Between(60, 740),
        Phaser.Math.Between(2, 4),
        0x81C784,
        0.35
      );
      this.tweens.add({
        targets: spore,
        y: spore.y - Phaser.Math.Between(30, 80),
        alpha: { from: 0.1, to: 0.6 },
        yoyo: true,
        repeat: -1,
        duration: Phaser.Math.Between(2000, 4000),
      });
    }

    // Branch from top
    const branch = this.add.graphics();
    branch.lineStyle(14, 0x3E2723, 0.9);
    branch.beginPath();
    branch.moveTo(0, 110);
    branch.lineTo(800, 110);
    branch.stroke();
  }

  private createChrysalises() {
    this.chrysalisSprites = [];
    const positions = [130, 310, 490, 670];

    GameManager.players.forEach((player, idx) => {
      const x = positions[idx];
      const y = 220;

      // Silk thread hanging
      const thread = this.add.graphics();
      thread.lineStyle(2, 0xE0E0E0, 0.8);
      thread.beginPath();
      thread.moveTo(x, 110);
      thread.lineTo(x, y - 40);
      thread.stroke();

      // Chrysalis sprite
      const sprite = this.add.sprite(x, y, 'chrysalis');
      sprite.setScale(1.2);
      this.chrysalisSprites.push(sprite);

      // Player Name & Color Underneath
      const nameTag = this.add.text(x, y + 80, player.name, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color: player.hexColor,
      }).setOrigin(0.5);
      nameTag.setShadow(1, 1, '#000000', 3);

      // Key cue
      this.add.text(x, y + 96, `[${player.keyName}]`, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        color: '#A5D6A7',
      }).setOrigin(0.5);

      // Status text (Ready / Holding / False start)
      const statusTxt = this.add.text(x, y + 120, 'ESPERANDO...', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#B0BEC5',
      }).setOrigin(0.5);
      this.playerStatusTexts.push(statusTxt);
    });
  }

  private createPulseRings() {
    // Target Sweet-spot ring (gold)
    this.targetRing = this.add.circle(400, 520, 110);
    this.targetRing.setStrokeStyle(4, 0xFFD700, 0.8);
    this.targetRing.setVisible(false);

    // Dynamic Expanding Pulse Circle
    this.pulseCircle = this.add.circle(400, 520, 20);
    this.pulseCircle.setStrokeStyle(5, 0x00E676, 0.9);
    this.pulseCircle.setVisible(false);
  }

  private createUI() {
    // Header
    const header = this.add.graphics();
    header.fillStyle(0x050D06, 0.85);
    header.fillRect(0, 0, 800, 85);

    this.add.text(16, 14, 'ETAPA 2: EL RITMO DE LA METAMORFOSIS', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '13px',
      color: '#81C784',
    });

    this.roundIndicatorText = this.add.text(780, 16, `RONDA 1/3`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '15px',
      color: '#FFD700',
    }).setOrigin(1, 0);

    this.mainInstructionText = this.add.text(400, 50, '¡TODOS DEBEN MANTENER PRESIONADO SU BOTÓN PARA INICIAR!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#FFF176',
    }).setOrigin(0.5);
  }

  private setupInputs() {
    const handlePress = (idx: number) => {
      if (this.roundResolved) return;
      const state = this.playerStates[idx];
      if (!state || state.isDisqualified || state.hasReleased) return;

      if (!state.isHolding) {
        state.isHolding = true;
        this.updatePlayerVisuals(idx);
        this.checkAllHolding();
      }
    };

    const handleRelease = (idx: number) => {
      if (this.roundResolved) return;
      const state = this.playerStates[idx];
      if (!state || !state.isHolding || state.hasReleased) return;

      state.isHolding = false;
      state.hasReleased = true;
      state.releaseTime = this.time.now;

      if (!this.cueTriggered) {
        // FALSE START! Released too early
        state.isDisqualified = true;
        state.reactionMs = null;
        SFX.play('falseStart');
        const txt = this.playerStatusTexts[idx];
        if (txt) {
          txt.setText('¡SALIDA EN FALSO!');
          txt.setColor('#FF1744');
        }
        // Jolt chrysalis
        this.shakeChrysalis(idx);
      } else {
        // Valid release after cue!
        const reaction = Math.round(state.releaseTime - this.cueTimestamp);
        state.reactionMs = reaction;
        SFX.play('pop');
        const txt = this.playerStatusTexts[idx];
        if (txt) {
          txt.setText(`+${reaction} ms`);
          txt.setColor('#00E676');
        }
      }

      this.checkRoundCompletion();
    };

    // Keyboard bindings:
    // P1: W, Space
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W)
      .on('down', () => handlePress(0))
      .on('up', () => handleRelease(0));

    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      .on('down', () => handlePress(0))
      .on('up', () => handleRelease(0));

    // P2: UP ARROW
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP)
      .on('down', () => handlePress(1))
      .on('up', () => handleRelease(1));

    // P3: C
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.C)
      .on('down', () => handlePress(2))
      .on('up', () => handleRelease(2));

    // P4: M
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.M)
      .on('down', () => handlePress(3))
      .on('up', () => handleRelease(3));

    // Touch custom events from UI
    const touchDown = (e: CustomEvent<{ playerIndex: number }>) => {
      handlePress(e.detail.playerIndex);
    };
    const touchUp = (e: CustomEvent<{ playerIndex: number }>) => {
      handleRelease(e.detail.playerIndex);
    };

    window.addEventListener('monarca-player-down', touchDown as EventListener);
    window.addEventListener('monarca-player-up', touchUp as EventListener);

    this.events.once('shutdown', () => {
      window.removeEventListener('monarca-player-down', touchDown as EventListener);
      window.removeEventListener('monarca-player-up', touchUp as EventListener);
    });
  }

  private startSubRound() {
    this.allHolding = false;
    this.cueTriggered = false;
    this.roundResolved = false;
    this.pulseCircle.setVisible(false);
    this.targetRing.setVisible(false);

    this.roundIndicatorText.setText(`RONDA ${this.currentSubRound}/${this.maxSubRounds}`);
    this.mainInstructionText.setText('¡MANTÉN PRESIONADO TU BOTÓN! (El juego espera a todos)');
    this.mainInstructionText.setColor('#FFF176');

    // Reset player states
    GameManager.players.forEach(p => {
      this.playerStates[p.id] = {
        isHolding: false,
        hasReleased: false,
        isDisqualified: false,
        releaseTime: null,
        reactionMs: null,
      };
      const txt = this.playerStatusTexts[p.id];
      if (txt) {
        txt.setText(p.isBot ? 'BOT PREPARANDO...' : '¡OPRIME Y MANTÉN!');
        txt.setColor(p.isBot ? '#90A4AE' : '#FFB74D');
      }
    });

    // Make bots press and hold their button naturally
    GameManager.players.forEach((p, idx) => {
      if (p.isBot) {
        const delay = Phaser.Math.Between(400, 1100);
        this.time.delayedCall(delay, () => {
          if (!this.roundResolved && this.playerStates[idx]) {
            this.playerStates[idx].isHolding = true;
            this.updatePlayerVisuals(idx);
            this.checkAllHolding();
          }
        });
      }
    });
  }

  private updatePlayerVisuals(idx: number) {
    const txt = this.playerStatusTexts[idx];
    if (txt) {
      txt.setText('LISTO ✓');
      txt.setColor('#00E676');
    }

    // Glow effect on chrysalis
    const sprite = this.chrysalisSprites[idx];
    if (sprite) {
      this.tweens.add({
        targets: sprite,
        scale: 1.35,
        duration: 150,
        yoyo: true,
      });
    }
  }

  private checkAllHolding() {
    if (this.allHolding || this.roundResolved) return;

    // Check if every active player is holding
    const allReady = GameManager.players.every(p => this.playerStates[p.id]?.isHolding);

    if (allReady) {
      this.allHolding = true;
      this.mainInstructionText.setText('¡TODOS LISTOS! Siente los latidos... ¡Suelta al ver la señal!');
      this.mainInstructionText.setColor('#80D8FF');

      // Start Metamorphosis Heartbeat and Rings
      this.startHeartbeatTension();
    }
  }

  private startHeartbeatTension() {
    this.pulseCircle.setVisible(true);
    this.targetRing.setVisible(true);
    this.pulseCircle.setRadius(20);

    // Play heartbeat sounds every 600ms
    let beats = 0;
    this.heartbeatTimer = this.time.addEvent({
      delay: 550,
      repeat: 5,
      callback: () => {
        if (this.roundResolved) return;
        SFX.play('heartbeat');
        beats++;

        // Pulse the chrysalises
        this.chrysalisSprites.forEach(spr => {
          this.tweens.add({
            targets: spr,
            scaleY: 1.3,
            duration: 100,
            yoyo: true,
          });
        });
      },
    });

    // Expanding pulse circle tween
    const delayBeforeCue = Phaser.Math.Between(2600, 4200);

    this.tweens.add({
      targets: this.pulseCircle,
      radius: 110,
      duration: delayBeforeCue,
      ease: 'Sine.easeInOut',
    });

    // Schedule bot early mistakes (Avispa caótica sometimes gets impatient)
    GameManager.players.forEach((p, idx) => {
      if (p.isBot && p.botPersonality === 'chaotic' && Math.random() < 0.22) {
        const earlyReleaseTime = Phaser.Math.Between(1200, delayBeforeCue - 300);
        this.time.delayedCall(earlyReleaseTime, () => {
          if (!this.cueTriggered && !this.roundResolved) {
            // Trigger false start for this chaotic bot
            const state = this.playerStates[idx];
            if (state && state.isHolding) {
              state.isHolding = false;
              state.hasReleased = true;
              state.isDisqualified = true;
              SFX.play('falseStart');
              const txt = this.playerStatusTexts[idx];
              if (txt) {
                txt.setText('¡SALIDA EN FALSO!');
                txt.setColor('#FF1744');
              }
              this.shakeChrysalis(idx);
            }
          }
        });
      }
    });

    // TRIGGER CUE
    this.cueTimer = this.time.delayedCall(delayBeforeCue, () => {
      this.triggerCue();
    });
  }

  private triggerCue() {
    this.cueTriggered = true;
    this.cueTimestamp = this.time.now;
    SFX.play('ding');

    // Flash screen gold
    const flash = this.add.graphics();
    flash.fillStyle(0xFFD700, 0.45);
    flash.fillRect(0, 0, 800, 800);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 350,
      onComplete: () => flash.destroy(),
    });

    this.mainInstructionText.setText('¡¡¡SUELTA AHORA MISMO!!!');
    this.mainInstructionText.setColor('#FF1744');
    this.mainInstructionText.setFontSize(14);

    // Trigger Bot Releases according to personality & difficulty
    GameManager.players.forEach((p, idx) => {
      if (p.isBot) {
        const state = this.playerStates[idx];
        if (!state || state.isDisqualified) return;

        let baseReaction = 180;
        if (p.botPersonality === 'aggressive') baseReaction = 120;
        if (p.botPersonality === 'interceptor') baseReaction = 140;
        if (p.botPersonality === 'chaotic') baseReaction = 240;

        if (GameManager.difficulty === 'hard') baseReaction *= 0.8;
        if (GameManager.difficulty === 'easy') baseReaction *= 1.4;

        const jitter = Phaser.Math.Between(-25, 45);
        const botReactionTime = Math.max(70, baseReaction + jitter);

        this.time.delayedCall(botReactionTime, () => {
          if (!this.roundResolved && state.isHolding) {
            state.isHolding = false;
            state.hasReleased = true;
            state.releaseTime = this.time.now;
            state.reactionMs = botReactionTime;
            const txt = this.playerStatusTexts[idx];
            if (txt) {
              txt.setText(`+${botReactionTime} ms`);
              txt.setColor('#00E676');
            }
            this.checkRoundCompletion();
          }
        });
      }
    });

    // Auto-timeout after 1200ms if someone forgot to release
    this.time.delayedCall(1200, () => {
      if (!this.roundResolved) {
        GameManager.players.forEach(p => {
          const state = this.playerStates[p.id];
          if (state && state.isHolding) {
            state.isHolding = false;
            state.hasReleased = true;
            state.reactionMs = 9999; // Very late
            const txt = this.playerStatusTexts[p.id];
            if (txt) {
              txt.setText('MUY TARDE');
              txt.setColor('#FF5252');
            }
          }
        });
        this.resolveSubRound();
      }
    });
  }

  private checkRoundCompletion() {
    if (this.roundResolved) return;
    const allFinished = GameManager.players.every(p => {
      const state = this.playerStates[p.id];
      return state?.hasReleased || state?.isDisqualified;
    });

    if (allFinished) {
      this.resolveSubRound();
    }
  }

  private shakeChrysalis(idx: number) {
    const spr = this.chrysalisSprites[idx];
    if (spr) {
      this.tweens.add({
        targets: spr,
        x: spr.x + 8,
        yoyo: true,
        repeat: 4,
        duration: 40,
      });
    }
  }

  private resolveSubRound() {
    this.roundResolved = true;
    if (this.heartbeatTimer) this.heartbeatTimer.remove();
    if (this.cueTimer) this.cueTimer.remove();

    // Determine sub-round winner
    // Winner is qualified player with lowest positive reactionMs
    let bestTime = Infinity;
    let winnerId: number | null = null;

    GameManager.players.forEach(p => {
      const state = this.playerStates[p.id];
      if (state && !state.isDisqualified && state.reactionMs !== null && state.reactionMs > 0) {
        if (state.reactionMs < bestTime) {
          bestTime = state.reactionMs;
          winnerId = p.id;
        }
      }
    });

    if (winnerId !== null) {
      this.roundWins[winnerId] = (this.roundWins[winnerId] || 0) + 1;
      const winnerPlayer = GameManager.players.find(p => p.id === winnerId);
      SFX.play('gold');

      this.mainInstructionText.setText(`¡GANADOR RONDA ${this.currentSubRound}: ${winnerPlayer?.name} (+${bestTime}ms)!`);
      this.mainInstructionText.setColor(winnerPlayer?.hexColor || '#FFD700');

      // Highlight winning chrysalis with golden trophy
      const spr = this.chrysalisSprites[winnerId];
      if (spr) {
        const trophy = this.add.sprite(spr.x, spr.y - 70, 'trophy');
        trophy.setScale(1.2);
        this.tweens.add({
          targets: trophy,
          y: spr.y - 85,
          yoyo: true,
          repeat: -1,
          duration: 350,
        });
      }
    } else {
      SFX.play('falseStart');
      this.mainInstructionText.setText('¡TODOS DESCALIFICADOS POR SALIDA EN FALSO!');
      this.mainInstructionText.setColor('#FF1744');
    }

    // Advance to next sub-round or conclude Stage 2
    this.time.delayedCall(3000, () => {
      if (this.currentSubRound < this.maxSubRounds) {
        this.currentSubRound++;
        // Clear trophies and restart
        this.children.getAll().forEach(c => {
          if (c instanceof Phaser.GameObjects.Sprite && c.texture.key === 'trophy') {
            c.destroy();
          }
        });
        this.startSubRound();
      } else {
        this.concludeStage2();
      }
    });
  }

  private concludeStage2() {
    SFX.play('win');
    // Save Stage 2 scores in GameManager
    GameManager.recordStage2Scores(this.roundWins);

    const banner = this.add.graphics();
    banner.fillStyle(0x000000, 0.85);
    banner.fillRect(0, 320, 800, 160);

    const endTxt = this.add.text(400, 370, '¡METAMORFOSIS COMPLETADA!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '22px',
      color: '#00E676',
    }).setOrigin(0.5);

    this.add.text(400, 420, 'Las crisálidas se han transformado en mariposas...', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '18px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    this.time.delayedCall(2500, () => {
      this.scene.start('RoundResultsScene', {
        stageIndex: 1,
        stageName: 'El Ritmo de la Metamorfosis',
        rawScores: this.roundWins,
        nextStageKey: 'ButterflyScene',
      });
    });
  }
}
