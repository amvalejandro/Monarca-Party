import Phaser from 'phaser';
import { GameManager } from '../GameManager';
import { SFX } from '../audio';
import { generateGameTextures } from '../sprites';

interface ButterflyEntity {
  id: number;
  sprite: Phaser.GameObjects.Sprite;
  yVelocity: number;
  stamina: number;
  isAlive: boolean;
  rank: number | null;
  nameText: Phaser.GameObjects.Text;
}

interface ObstacleSprite extends Phaser.GameObjects.Sprite {
  obsType: 'calandria' | 'branch' | 'nectar';
  baseY: number;
  sinOffset: number;
}

export class ButterflyScene extends Phaser.Scene {
  private butterflies: ButterflyEntity[] = [];
  private obstaclesGroup!: Phaser.GameObjects.Group;
  private gameEnded: boolean = false;
  private isCountingDown: boolean = true;
  private countdownValue: number = 3;
  private scrollSpeed: number = 190;
  private gameTime: number = 0; // seconds elapsed

  private bgSky!: Phaser.GameObjects.Graphics;
  private clouds: Phaser.GameObjects.Arc[] = [];
  private mountainBackdrop!: Phaser.GameObjects.Graphics;
  private windWarning!: Phaser.GameObjects.Graphics;
  private hudText!: Phaser.GameObjects.Text;
  private aliveCountText!: Phaser.GameObjects.Text;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private windTimer!: Phaser.Time.TimerEvent;

  private eliminatedOrder: number[] = []; // player IDs in order of death

  constructor() {
    super({ key: 'ButterflyScene' });
  }

  create() {
    generateGameTextures(this);
    this.gameEnded = false;
    this.isCountingDown = true;
    this.countdownValue = 3;
    this.scrollSpeed = 190;
    this.gameTime = 0;
    this.eliminatedOrder = [];

    // 1. Mountain Sky Panorama (Tenjo, Sabana de Bogotá)
    this.createSkyAndMountains();

    // 2. Obstacles Group
    this.obstaclesGroup = this.add.group();

    // 3. Butterflies (Flappy style)
    this.createButterflies();

    // 4. HUD
    this.createHUD();

    // 5. Inputs
    this.setupInputs();

    // 6. Countdown
    this.startCountdown();
  }

  private createSkyAndMountains() {
    // Beautiful Colombian mountain sky gradient
    this.bgSky = this.add.graphics();
    this.bgSky.fillGradientStyle(0x4FC3F7, 0x4FC3F7, 0x81D4FA, 0x81D4FA, 1);
    this.bgSky.fillRect(0, 0, 800, 800);

    // Fluffy parallax clouds
    this.clouds = [];
    for (let i = 0; i < 9; i++) {
      const cloud = this.add.circle(
        Phaser.Math.Between(0, 800),
        Phaser.Math.Between(70, 320),
        Phaser.Math.Between(35, 65),
        0xFFFFFF,
        0.55
      );
      this.clouds.push(cloud);
    }

    // Mountain silhouettes of Peña de Juaica / Tenjo
    this.mountainBackdrop = this.add.graphics();
    this.drawMountains();

    // Wind gust flash overlay
    this.windWarning = this.add.graphics();
    this.windWarning.fillStyle(0x00E5FF, 0.25);
    this.windWarning.fillRect(0, 0, 800, 800);
    this.windWarning.setVisible(false);
  }

  private drawMountains() {
    this.mountainBackdrop.clear();
    // Distant mountain
    this.mountainBackdrop.fillStyle(0x2E7D32, 0.4);
    this.mountainBackdrop.beginPath();
    this.mountainBackdrop.moveTo(0, 800);
    this.mountainBackdrop.lineTo(0, 620);
    this.mountainBackdrop.lineTo(220, 520);
    this.mountainBackdrop.lineTo(440, 640);
    this.mountainBackdrop.lineTo(660, 490);
    this.mountainBackdrop.lineTo(800, 580);
    this.mountainBackdrop.lineTo(800, 800);
    this.mountainBackdrop.closePath();
    this.mountainBackdrop.fill();

    // Near mountain hill
    this.mountainBackdrop.fillStyle(0x1B5E20, 0.7);
    this.mountainBackdrop.beginPath();
    this.mountainBackdrop.moveTo(0, 800);
    this.mountainBackdrop.lineTo(0, 710);
    this.mountainBackdrop.lineTo(260, 660);
    this.mountainBackdrop.lineTo(540, 720);
    this.mountainBackdrop.lineTo(800, 680);
    this.mountainBackdrop.lineTo(800, 800);
    this.mountainBackdrop.closePath();
    this.mountainBackdrop.fill();

    // Forest canopy base line (floor danger zone)
    this.mountainBackdrop.fillStyle(0x0D3810, 1);
    this.mountainBackdrop.fillRect(0, 760, 800, 40);
  }

  private createButterflies() {
    this.butterflies = [];

    // Arranged in organized vertical column near the left side
    const startX = 140;
    const startYSpacing = 110;

    GameManager.players.forEach((player, idx) => {
      let colorKey = `p${idx}`;
      if (player.id === 0 && GameManager.selectedSkinId === 'gold') colorKey = 'gold';
      if (player.id === 0 && GameManager.selectedSkinId === 'emerald') colorKey = 'emerald';

      const y = 200 + idx * startYSpacing;
      const spr = this.add.sprite(startX, y, `butterfly_${colorKey}_0`);
      spr.setScale(1.5);
      spr.setDepth(20);

      const nameTxt = this.add.text(startX, y - 28, player.name.slice(0, 8), {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: player.hexColor,
      }).setOrigin(0.5);
      nameTxt.setShadow(1, 1, '#000000', 3);

      this.butterflies.push({
        id: player.id,
        sprite: spr,
        yVelocity: 0,
        stamina: 100,
        isAlive: true,
        rank: null,
        nameText: nameTxt,
      });

      // Flapping frame animation cycle
      this.time.addEvent({
        delay: 160,
        loop: true,
        callback: () => {
          if (!spr.active) return;
          const currentTex = spr.texture.key;
          const next = currentTex.endsWith('_0') ? 1 : 0;
          spr.setTexture(`butterfly_${colorKey}_${next}`);
        },
      });
    });
  }

  private createHUD() {
    const header = this.add.graphics();
    header.fillStyle(0x0A1926, 0.85);
    header.fillRect(0, 0, 800, 75);

    this.add.text(16, 12, 'ETAPA 3: LA MIGRACIÓN FINAL (FLAPPY)', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '13px',
      color: '#FFD700',
    });

    this.hudText = this.add.text(16, 32, '¡Pulsa para aletear y esquiva las calandrias!', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#E1F5FE',
    });

    this.aliveCountText = this.add.text(780, 20, `VIVOS: ${GameManager.players.length}/${GameManager.players.length}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#00E676',
    }).setOrigin(1, 0);
  }

  private setupInputs() {
    const flap = (idx: number) => {
      if (this.isCountingDown || this.gameEnded) return;
      const b = this.butterflies.find(item => item.id === idx);
      if (!b || !b.isAlive) return;

      // Vertical flap impulse (flappy bird mechanic)
      b.yVelocity = -290;
      SFX.play('flap');

      // Little tilt up
      this.tweens.add({
        targets: b.sprite,
        angle: -20,
        duration: 80,
        onComplete: () => {
          this.tweens.add({
            targets: b.sprite,
            angle: 15,
            duration: 350,
          });
        },
      });
    };

    // Keyboard bindings
    const handleKey = (playerIdx: number) => {
      const p = GameManager.players[playerIdx];
      if (p && !p.isBot) {
        flap(playerIdx);
      }
    };

    // P1: W, Space
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W).on('down', () => handleKey(0));
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on('down', () => handleKey(0));
    // P2: UP ARROW
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP).on('down', () => handleKey(1));
    // P3: C
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.C).on('down', () => handleKey(2));
    // P4: M
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => handleKey(3));

    // Touch event listener
    const touchHandler = (e: CustomEvent<{ playerIndex: number }>) => {
      handleKey(e.detail.playerIndex);
    };
    window.addEventListener('monarca-player-action', touchHandler as EventListener);
    this.events.once('shutdown', () => {
      window.removeEventListener('monarca-player-action', touchHandler as EventListener);
    });
  }

  private startCountdown() {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, 800, 800);

    const countText = this.add.text(400, 400, '3', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '64px',
      color: '#FFD700',
    }).setOrigin(0.5);

    SFX.play('countdown');

    const countdownTimer = this.time.addEvent({
      delay: 1000,
      repeat: 3,
      callback: () => {
        this.countdownValue--;
        if (this.countdownValue === 2) {
          countText.setText('2');
          SFX.play('countdown');
        } else if (this.countdownValue === 1) {
          countText.setText('1');
          SFX.play('countdown');
        } else if (this.countdownValue === 0) {
          countText.setText('¡A VOLAR!');
          countText.setColor('#00E676');
          countText.setFontSize(44);
          SFX.play('go');
        } else {
          countdownTimer.remove();
          overlay.destroy();
          countText.destroy();
          this.isCountingDown = false;
          this.startFlightMechanics();
        }
      },
    });
  }

  private startFlightMechanics() {
    // 1. Spawner for obstacles (Calandrias, branches, nectar flowers)
    this.scheduleNextObstacle();

    // 2. Wind gust events every 10 seconds
    this.windTimer = this.time.addEvent({
      delay: 9500,
      loop: true,
      callback: () => this.triggerWindGust(),
    });

    // 3. Second timer tick (increases game speed over time)
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.gameEnded) return;
        this.gameTime++;
        // Gradually speed up
        this.scrollSpeed = Math.min(360, 190 + this.gameTime * 3.5);
      },
    });
  }

  private scheduleNextObstacle() {
    if (this.gameEnded) return;
    // Faster spawns as fewer butterflies survive!
    const aliveCount = this.butterflies.filter(b => b.isAlive).length;
    const baseDelay = aliveCount <= 2 ? 1400 : 2100;
    const randomized = Phaser.Math.Between(baseDelay - 300, baseDelay + 400);

    this.spawnTimer = this.time.delayedCall(randomized, () => {
      this.spawnObstacle();
      this.scheduleNextObstacle();
    });
  }

  private spawnObstacle() {
    if (this.gameEnded) return;

    const roll = Math.random();
    let obsType: 'calandria' | 'branch' | 'nectar' = 'calandria';
    let texture = 'calandria';

    if (roll < 0.65) {
      obsType = 'calandria';
      texture = 'calandria';
    } else if (roll < 0.82) {
      obsType = 'nectar';
      texture = 'nectar_flower';
    } else {
      obsType = 'branch';
      texture = 'leaf_algodoncillo';
    }

    const y = Phaser.Math.Between(130, 680);
    const obs = this.add.sprite(840, y, texture) as ObstacleSprite;
    obs.obsType = obsType;
    obs.baseY = y;
    obs.sinOffset = Math.random() * Math.PI * 2;
    obs.setScale(obsType === 'calandria' ? 1.4 : obsType === 'nectar' ? 1.3 : 1.5);
    this.obstaclesGroup.add(obs);
  }

  private triggerWindGust() {
    if (this.gameEnded) return;
    SFX.play('wind');

    // Warning flash
    this.windWarning.setVisible(true);
    this.hudText.setText('¡RÁFAGA DE VIENTO EN LA SABANA!');
    this.hudText.setColor('#00E5FF');

    this.time.delayedCall(500, () => {
      this.windWarning.setVisible(false);
      this.hudText.setText('¡Esquiva las calandrias y mantén el vuelo!');
      this.hudText.setColor('#E1F5FE');

      // Displace butterflies with wind
      this.butterflies.forEach(b => {
        if (b.isAlive) {
          const push = Phaser.Math.Between(-140, 160);
          b.yVelocity += push;
        }
      });
    });
  }

  update(time: number, delta: number) {
    if (this.isCountingDown || this.gameEnded) return;

    const dt = delta / 1000;
    const gravity = 520; // px/s²

    // 1. Move Background clouds
    this.clouds.forEach(cloud => {
      cloud.x -= this.scrollSpeed * 0.25 * dt;
      if (cloud.x < -60) {
        cloud.x = 860;
        cloud.y = Phaser.Math.Between(70, 320);
      }
    });

    // 2. Move Obstacles
    const obstacles = this.obstaclesGroup.getChildren() as ObstacleSprite[];
    obstacles.forEach(obs => {
      obs.x -= this.scrollSpeed * dt;

      // Calandrias have sinusoidal flight pattern
      if (obs.obsType === 'calandria') {
        obs.y = obs.baseY + Math.sin(time / 260 + obs.sinOffset) * 45;
      }

      if (obs.x < -50) {
        obs.destroy();
      }
    });

    // 3. Update Butterflies
    let aliveCount = 0;
    this.butterflies.forEach(b => {
      if (!b.isAlive) return;
      aliveCount++;

      // Apply gravity
      b.yVelocity += gravity * dt;
      b.sprite.y += b.yVelocity * dt;

      // Update name label
      b.nameText.y = b.sprite.y - 28;

      // Check floor and ceiling boundaries
      if (b.sprite.y >= 750 || b.sprite.y <= 85) {
        this.eliminateButterfly(b, '¡Cayó al suelo o voló muy alto!');
        return;
      }

      // Check collision with obstacles
      obstacles.forEach(obs => {
        if (!obs.active) return;
        const dist = Phaser.Math.Distance.Between(b.sprite.x, b.sprite.y, obs.x, obs.y);
        if (dist < 36) {
          if (obs.obsType === 'nectar') {
            // Nectar bonus
            b.stamina = Math.min(100, b.stamina + 25);
            SFX.play('gold');
            this.showFloatingText(obs.x, obs.y, '+NÉCTAR', '#FFD700');
            obs.destroy();
          } else {
            // Hit calandria or branch!
            this.eliminateButterfly(b, '¡Atrapado por una Calandria!');
          }
        }
      });

      // 4. BOT AI FLAPPING
      const playerConfig = GameManager.players.find(p => p.id === b.id);
      if (playerConfig?.isBot && b.isAlive) {
        this.updateBotButterfly(b, playerConfig, obstacles);
      }
    });

    this.aliveCountText.setText(`VIVOS: ${aliveCount}/${GameManager.players.length}`);

    // Check if 1 or 0 butterflies remain
    if (aliveCount <= 1 && GameManager.players.length > 1) {
      this.concludeStage3();
    } else if (aliveCount === 0 && GameManager.players.length === 1) {
      // Solo mode ended
      this.concludeStage3();
    }
  }

  private updateBotButterfly(b: ButterflyEntity, player: any, obstacles: ObstacleSprite[]) {
    // Find imminent calandria in front
    const oncoming = obstacles.filter(o => o.active && o.x > b.sprite.x && o.x < b.sprite.x + 220);

    let targetY = 400;
    if (oncoming.length > 0) {
      const nearest = oncoming[0];
      if (nearest.obsType === 'nectar') {
        targetY = nearest.y; // try to aim for nectar
      } else {
        // Fly over or under
        targetY = nearest.y > 400 ? nearest.y - 120 : nearest.y + 120;
      }
    }

    // Flap when below target or falling too fast
    const errorChance = GameManager.difficulty === 'hard' ? 0.03 : GameManager.difficulty === 'easy' ? 0.22 : 0.1;
    const shouldFlap = b.sprite.y > targetY + 20 || b.yVelocity > 160;

    if (shouldFlap && b.yVelocity > 40 && Math.random() > errorChance) {
      b.yVelocity = -280;
    }
  }

  private eliminateButterfly(b: ButterflyEntity, reason: string) {
    b.isAlive = false;
    this.eliminatedOrder.push(b.id);
    SFX.play('hit');

    // Death spiral tween
    this.tweens.add({
      targets: [b.sprite, b.nameText],
      y: b.sprite.y + 120,
      alpha: 0,
      angle: 180,
      duration: 600,
      onComplete: () => {
        b.sprite.setVisible(false);
        b.nameText.setVisible(false);
      },
    });

    this.showFloatingText(b.sprite.x, b.sprite.y, '¡ELIMINADO!', '#FF1744');
    this.cameras.main.shake(160, 0.007);

    // Dynamic difficulty: as players are eliminated, speed increases!
    this.scrollSpeed += 30;
  }

  private showFloatingText(x: number, y: number, msg: string, color: string) {
    const txt = this.add.text(x, y, msg, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: color,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: txt,
      y: y - 30,
      alpha: 0,
      duration: 650,
      onComplete: () => txt.destroy(),
    });
  }

  private concludeStage3() {
    if (this.gameEnded) return;
    this.gameEnded = true;
    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.windTimer) this.windTimer.remove();

    SFX.play('win');

    // Add any remaining survivor to eliminatedOrder as 1st place
    this.butterflies.forEach(b => {
      if (b.isAlive && !this.eliminatedOrder.includes(b.id)) {
        this.eliminatedOrder.push(b.id);
      }
    });

    // Invert to build ranks: The last player in eliminatedOrder is Rank 1!
    const ranks: { [id: number]: number } = {};
    const reversed = [...this.eliminatedOrder].reverse();
    reversed.forEach((id, rankIdx) => {
      ranks[id] = rankIdx + 1; // 1 = 1st place, 2 = 2nd place, etc.
    });

    // Record in GameManager
    GameManager.recordStage3Scores(ranks);

    // Banner
    const banner = this.add.graphics();
    banner.fillStyle(0x000000, 0.85);
    banner.fillRect(0, 320, 800, 160);

    const title = this.add.text(400, 370, '¡MIGRACIÓN FINALIZADA!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: '#FFD700',
    }).setOrigin(0.5);

    this.add.text(400, 420, 'Calculando el Gran Campeón del Bioparque Monarca...', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '18px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: 1.1,
      yoyo: true,
      repeat: 3,
      duration: 350,
    });

    this.time.delayedCall(2800, () => {
      this.scene.start('FinalPodiumScene');
    });
  }
}
