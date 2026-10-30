import Phaser from 'phaser';
import { GameManager } from '../GameManager';
import { SFX } from '../audio';
import { generateGameTextures } from '../sprites';

interface CaterpillarEntity {
  id: number;
  name: string;
  color: number;
  hexColor: string;
  isBot: boolean;
  botPersonality?: 'aggressive' | 'interceptor' | 'chaotic';
  sprite: Phaser.GameObjects.Sprite;
  nameTag: Phaser.GameObjects.Text;
  speedTag: Phaser.GameObjects.Text;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravityDir: number; // 1 = falling down, -1 = falling up (toggled on single press!)
  cottonBoostPercent: number; // 0 to 5% (+1% per algodoncillo, -1% on obstacle hit)
  isAlive: boolean;
  eliminatedReason?: string;
  invulnerableUntil: number;
  leavesCollected: number;
  finishRank: number | null;
}

interface WorldItem {
  sprite: Phaser.GameObjects.Sprite;
  itemType: 'algodon' | 'leaf' | 'gold_leaf' | 'toxic';
  active: boolean;
}

interface ObstacleHazard {
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  active: boolean;
}

interface AntHazard {
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  vx: number;
  active: boolean;
}

export class CaterpillarScene extends Phaser.Scene {
  private caterpillars: CaterpillarEntity[] = [];
  private ants: AntHazard[] = [];
  private obstacles: ObstacleHazard[] = [];
  private items: WorldItem[] = [];

  private isCountingDown: boolean = true;
  private countdownValue: number = 3;
  private gameEnded: boolean = false;

  private worldWidth: number = 5500;
  private worldHeight: number = 800;
  private startLineX: number = 180;
  private finishLineX: number = 5000;

  private leaderId: number = 0;
  private leaderBadge!: Phaser.GameObjects.Container;

  // UI HUD elements (fixed to screen)
  private hudContainer!: Phaser.GameObjects.Container;
  private leaderText!: Phaser.GameObjects.Text;
  private aliveText!: Phaser.GameObjects.Text;
  private distanceBar!: Phaser.GameObjects.Graphics;

  private antSpawnTimer!: Phaser.Time.TimerEvent;
  private obstacleSpawnTimer!: Phaser.Time.TimerEvent;
  private itemSpawnTimer!: Phaser.Time.TimerEvent;

  private eliminatedOrder: number[] = [];

  constructor() {
    super({ key: 'CaterpillarScene' });
  }

  create() {
    generateGameTextures(this);

    this.isCountingDown = true;
    this.countdownValue = 3;
    this.gameEnded = false;
    this.caterpillars = [];
    this.ants = [];
    this.obstacles = [];
    this.items = [];
    this.eliminatedOrder = [];
    this.leaderId = 0;

    // Reset camera bounds
    this.cameras.main.scrollX = 0;
    this.cameras.main.scrollY = 0;
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

    // 1. Natural Scrolling Landscape
    this.createWorldBackground();

    // 2. Starting Gate (All start at the EXACT same point)
    this.createStartingGate();

    // 3. Finish Line Monument
    this.createFinishLine();

    // 4. Spawn All Caterpillars at identical Start Line X
    this.spawnCaterpillarsAtStartLine();

    // 5. Fixed Camera HUD
    this.createFixedHUD();

    // 6. Setup Inputs (Single Press = Gravity Flip!)
    this.setupInputs();

    // 7. Start Countdown ("3 2 1 ¡¡¡YAAAA!!!")
    this.startRaceCountdown();
  }

  private createWorldBackground() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1B3814, 0x1B3814, 0x0A1608, 0x0A1608, 1);
    bg.fillRect(0, 0, this.worldWidth, this.worldHeight);

    // Continuous thick branch paths
    const branches = this.add.graphics();
    branches.lineStyle(22, 0x3E2723, 0.85);

    for (let x = 0; x < this.worldWidth; x += 280) {
      const y1 = 440 + Math.sin(x / 380) * 120;
      const y2 = 440 + Math.sin((x + 280) / 380) * 120;
      branches.beginPath();
      branches.moveTo(x, y1);
      branches.lineTo(x + 280, y2);
      branches.stroke();

      // Top vine network
      branches.lineStyle(10, 0x2E7D32, 0.6);
      branches.beginPath();
      branches.moveTo(x, 110 + Math.cos(x / 460) * 50);
      branches.lineTo(x + 280, 110 + Math.cos((x + 280) / 460) * 50);
      branches.stroke();
      branches.lineStyle(22, 0x3E2723, 0.85);
    }

    // Top and bottom boundaries
    const border = this.add.graphics();
    border.fillStyle(0x7F0000, 0.35);
    border.fillRect(0, 0, this.worldWidth, 35);
    border.fillRect(0, 765, this.worldWidth, 35);
  }

  private createStartingGate() {
    // Starting Gate Tower at X = 180
    const gate = this.add.graphics();
    gate.fillStyle(0x4E342E, 0.9);
    gate.fillRect(this.startLineX - 8, 40, 16, 720);

    // Green start arch pattern
    for (let y = 40; y < 760; y += 32) {
      gate.fillStyle(0x00E676, 1);
      gate.fillRect(this.startLineX - 8, y, 16, 16);
      gate.fillStyle(0xFFFFFF, 1);
      gate.fillRect(this.startLineX - 8, y + 16, 16, 16);
    }

    const startLabel = this.add.text(this.startLineX - 25, 120, '🚦 LÍNEA DE SALIDA', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#00E676',
    });
    startLabel.setAngle(90);
    startLabel.setShadow(2, 2, '#000000', 3);
  }

  private createFinishLine() {
    const arch = this.add.graphics();
    arch.fillStyle(0xFFD700, 0.85);
    arch.fillRect(this.finishLineX, 40, 18, 720);

    for (let y = 40; y < 760; y += 32) {
      arch.fillStyle(0x000000, 1);
      arch.fillRect(this.finishLineX, y, 18, 16);
      arch.fillStyle(0xFFFFFF, 1);
      arch.fillRect(this.finishLineX, y + 16, 18, 16);
    }

    const finishLabel = this.add.text(this.finishLineX - 35, 180, '🏁 META: BIOPARQUE MONARCA', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#FFD700',
    });
    finishLabel.setAngle(90);
    finishLabel.setShadow(2, 2, '#000000', 4);
  }

  private spawnCaterpillarsAtStartLine() {
    this.caterpillars = [];

    // All start at identical X = 180, spaced vertically
    const startYPositions = [280, 360, 440, 520];

    GameManager.players.forEach((player, idx) => {
      let colorKey = `p${idx}`;
      if (player.id === 0 && GameManager.selectedSkinId === 'gold') colorKey = 'gold';
      if (player.id === 0 && GameManager.selectedSkinId === 'emerald') colorKey = 'emerald';

      const startX = this.startLineX;
      const startY = startYPositions[idx] || (300 + idx * 70);

      const sprite = this.add.sprite(startX, startY, `caterpillar_${colorKey}_0`);
      sprite.setScale(1.5);
      sprite.setDepth(20);

      const nameTag = this.add.text(startX, startY - 26, player.name.slice(0, 8), {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: player.hexColor,
      }).setOrigin(0.5);
      nameTag.setShadow(1, 1, '#000000', 3);
      nameTag.setDepth(21);

      const speedTag = this.add.text(startX, startY + 22, '+0%', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#E0E0E0',
      }).setOrigin(0.5);
      speedTag.setShadow(1, 1, '#000000', 2);
      speedTag.setDepth(21);

      this.caterpillars.push({
        id: player.id,
        name: player.name,
        color: player.color,
        hexColor: player.hexColor,
        isBot: player.isBot,
        botPersonality: player.botPersonality,
        sprite,
        nameTag,
        speedTag,
        x: startX,
        y: startY,
        vx: 205, // base speed
        vy: 0,
        gravityDir: 1, // Start falling down automatically!
        cottonBoostPercent: 0, // 0 to 5%
        isAlive: true,
        invulnerableUntil: 0,
        leavesCollected: 0,
        finishRank: null,
      });

      // Leg crawling animation frame toggle
      this.time.addEvent({
        delay: 170,
        loop: true,
        callback: () => {
          if (!sprite.active) return;
          const curr = sprite.texture.key;
          const next = curr.endsWith('_0') ? 1 : 0;
          sprite.setTexture(`caterpillar_${colorKey}_${next}`);
        },
      });
    });

    // Leader badge
    this.leaderBadge = this.add.container(0, 0);
    const crown = this.add.text(0, 0, '👑', { fontSize: '18px' }).setOrigin(0.5);
    this.leaderBadge.add(crown);
    this.leaderBadge.setDepth(25);
  }

  private createFixedHUD() {
    this.hudContainer = this.add.container(0, 0);
    this.hudContainer.setScrollFactor(0);
    this.hudContainer.setDepth(100);

    // Clean top banner
    const bg = this.add.graphics();
    bg.fillStyle(0x0A140A, 0.85);
    bg.fillRect(0, 0, 800, 68);
    bg.lineStyle(2, 0x2E7D32, 0.8);
    bg.beginPath();
    bg.moveTo(0, 68);
    bg.lineTo(800, 68);
    bg.stroke();
    this.hudContainer.add(bg);

    // Title & Instructions
    const title = this.add.text(14, 10, 'CARRERA DE ORUGAS: GRAVEDAD INVERTIBLE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#81C784',
    });
    this.hudContainer.add(title);

    const sub = this.add.text(14, 28, '¡Pulsa 1 vez para invertir caída (arriba/abajo)! Algodón: +1% vel (máx 5%). Obstáculo: -1%.', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#E8F5E9',
    });
    this.hudContainer.add(sub);

    // Leader
    this.leaderText = this.add.text(14, 48, '👑 LÍDER: Jugador 1', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#FFD700',
    });
    this.hudContainer.add(this.leaderText);

    // Alive Count
    this.aliveText = this.add.text(780, 16, `VIVAS: ${this.caterpillars.length}/${this.caterpillars.length}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#00E676',
    }).setOrigin(1, 0);
    this.hudContainer.add(this.aliveText);

    // Mini Track Progress Bar at bottom
    const barBg = this.add.graphics();
    barBg.fillStyle(0x000000, 0.75);
    barBg.fillRoundedRect(220, 765, 360, 16, 8);
    barBg.lineStyle(2, 0x388E3C, 0.8);
    barBg.strokeRoundedRect(220, 765, 360, 16, 8);
    this.hudContainer.add(barBg);

    this.distanceBar = this.add.graphics();
    this.hudContainer.add(this.distanceBar);
  }

  private setupInputs() {
    // Single Press / Tap = Invert Gravity!
    const triggerGravityFlip = (playerIdx: number) => {
      if (this.isCountingDown || this.gameEnded) return;
      const c = this.caterpillars.find(item => item.id === playerIdx);
      if (c && !c.isBot && c.isAlive) {
        // Invert gravity!
        c.gravityDir *= -1;
        SFX.play('pop');

        // Tactile squeeze animation
        this.tweens.add({
          targets: c.sprite,
          scaleX: 1.8,
          scaleY: 1.2,
          duration: 90,
          yoyo: true,
          onComplete: () => c.sprite.setScale(1.5),
        });
      }
    };

    // Keyboard bindings (down triggers 1 single flip!)
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W).on('down', () => triggerGravityFlip(0));
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on('down', () => triggerGravityFlip(0));
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP).on('down', () => triggerGravityFlip(1));
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.C).on('down', () => triggerGravityFlip(2));
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => triggerGravityFlip(3));

    // Touch event listener (down triggers 1 flip!)
    const touchHandler = (e: CustomEvent<{ playerIndex: number }>) => {
      triggerGravityFlip(e.detail.playerIndex);
    };

    window.addEventListener('monarca-player-down', touchHandler as EventListener);

    this.events.once('shutdown', () => {
      window.removeEventListener('monarca-player-down', touchHandler as EventListener);
    });
  }

  private startRaceCountdown() {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, 800, 800);
    overlay.setScrollFactor(0);
    overlay.setDepth(99);

    const countText = this.add.text(400, 400, '3', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '64px',
      color: '#FFD700',
    }).setOrigin(0.5);
    countText.setScrollFactor(0);
    countText.setDepth(100);

    SFX.play('countdown');

    const timer = this.time.addEvent({
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
          // As requested: "321 YAAAA"
          countText.setText('¡¡¡YAAAA!!!');
          countText.setColor('#00E676');
          countText.setFontSize(44);
          SFX.play('go');
          this.cameras.main.shake(180, 0.007);
        } else {
          timer.remove();
          overlay.destroy();
          countText.destroy();
          this.isCountingDown = false;
          this.startWorldSpawners();
        }
      },
    });
  }

  private startWorldSpawners() {
    // 1. Spawner for oncoming horizontal Ants (from right to left)
    this.antSpawnTimer = this.time.addEvent({
      delay: 1400,
      loop: true,
      callback: () => this.spawnAnt(),
    });

    // 2. Spawner for Obstacles (thorny branches on path)
    this.obstacleSpawnTimer = this.time.addEvent({
      delay: 1700,
      loop: true,
      callback: () => this.spawnObstacle(),
    });

    // 3. Spawner for Algodón & Leaves ahead
    this.itemSpawnTimer = this.time.addEvent({
      delay: 750,
      loop: true,
      callback: () => this.spawnAlgodonAndItems(),
    });
  }

  private spawnAnt() {
    if (this.gameEnded) return;

    const spawnX = this.cameras.main.scrollX + 880;
    const spawnY = Phaser.Math.Between(110, 680);

    const antSprite = this.add.sprite(spawnX, spawnY, 'ant');
    antSprite.setScale(1.4);
    antSprite.setDepth(15);

    this.tweens.add({
      targets: antSprite,
      scaleY: 1.15,
      yoyo: true,
      repeat: -1,
      duration: 160,
    });

    const speed = Phaser.Math.Between(190, 250);
    this.ants.push({
      sprite: antSprite,
      x: spawnX,
      y: spawnY,
      vx: -speed,
      active: true,
    });
  }

  private spawnObstacle() {
    if (this.gameEnded) return;

    const spawnX = this.cameras.main.scrollX + 920;
    const spawnY = Phaser.Math.Between(130, 660);

    const obsSprite = this.add.sprite(spawnX, spawnY, 'thorny_branch');
    obsSprite.setScale(1.3);
    obsSprite.setDepth(14);

    this.obstacles.push({
      sprite: obsSprite,
      x: spawnX,
      y: spawnY,
      active: true,
    });
  }

  private spawnAlgodonAndItems() {
    if (this.gameEnded) return;

    const spawnX = this.cameras.main.scrollX + 900;
    const spawnY = Phaser.Math.Between(120, 670);

    const roll = Math.random();
    let type: 'algodon' | 'leaf' | 'gold_leaf' | 'toxic' = 'algodon';
    let texture = 'algodon_puff';

    if (roll < 0.55) {
      type = 'algodon';
      texture = 'algodon_puff';
    } else if (roll < 0.75) {
      type = 'leaf';
      texture = 'leaf_algodoncillo';
    } else if (roll < 0.90) {
      type = 'gold_leaf';
      texture = 'leaf_golden';
    } else {
      type = 'toxic';
      texture = 'toxic_drop';
    }

    const itemSprite = this.add.sprite(spawnX, spawnY, texture);
    itemSprite.setScale(type === 'gold_leaf' ? 1.4 : 1.3);
    itemSprite.setDepth(12);

    if (type === 'gold_leaf') {
      this.tweens.add({
        targets: itemSprite,
        scale: 1.6,
        yoyo: true,
        repeat: -1,
        duration: 300,
      });
    }

    this.items.push({
      sprite: itemSprite,
      itemType: type,
      active: true,
    });
  }

  update(time: number, delta: number) {
    if (this.isCountingDown || this.gameEnded) return;

    const dt = delta / 1000;
    const verticalAcceleration = 440; // px/s²

    // 1. UPDATE CATERPILLAR INVERTED GRAVITY & SPEED
    this.caterpillars.forEach(c => {
      if (!c.isAlive) return;

      // Apply inverted or downward gravity according to gravityDir!
      c.vy += c.gravityDir * verticalAcceleration * dt;
      c.vy = Phaser.Math.Clamp(c.vy, -290, 290);

      // Speed calculation: Base Speed * (1 + cottonBoostPercent * 0.01)
      const currentSpeed = c.vx * (1 + c.cottonBoostPercent * 0.01);
      c.x += currentSpeed * dt;
      c.y += c.vy * dt;

      // Bounce at world boundaries
      if (c.y <= 65) {
        c.y = 65;
        c.vy = Math.abs(c.vy) * 0.5;
        c.gravityDir = 1; // flip down if hitting ceiling
      } else if (c.y >= 735) {
        c.y = 735;
        c.vy = -Math.abs(c.vy) * 0.5;
        c.gravityDir = -1; // flip up if hitting floor
      }

      // Sync Sprite positions
      c.sprite.x = c.x;
      c.sprite.y = c.y;
      c.nameTag.x = c.x;
      c.nameTag.y = c.y - 26;
      c.speedTag.x = c.x;
      c.speedTag.y = c.y + 22;

      // Update speed readout
      c.speedTag.setText(`+${c.cottonBoostPercent}%`);
      c.speedTag.setColor(c.cottonBoostPercent >= 5 ? '#FFD700' : c.cottonBoostPercent > 0 ? '#00E676' : '#B0BEC5');

      // Visual tilt
      c.sprite.setAngle(Phaser.Math.Clamp(c.vy * 0.08, -25, 25));

      // Invulnerability flicker
      if (time < c.invulnerableUntil) {
        c.sprite.setAlpha(Math.sin(time / 40) > 0 ? 0.9 : 0.4);
      } else {
        c.sprite.setAlpha(1);
      }

      // Check finish line crossing
      if (c.x >= this.finishLineX && c.finishRank === null) {
        this.reachFinishLine(c);
      }

      // Bot AI
      if (c.isBot) {
        this.updateBotAI(c);
      }
    });

    // 2. CATERPILLAR-TO-CATERPILLAR PHYSICAL COLLISIONS & STACKING
    this.handleCaterpillarInteractions();

    // 3. LEADER TRACKING CAMERA
    this.updateLeaderAndCamera(dt);

    // 4. CHECK OFF-SCREEN ELIMINATION (LAGGING BEHIND CAMERA)
    this.checkOffScreenEliminations();

    // 5. UPDATE ONCOMING ANTS (LETHAL OBSTACLES)
    this.updateAnts(dt, time);

    // 6. UPDATE THORNY BRANCH OBSTACLES (-1% SPEED PENALTY)
    this.updateObstacles();

    // 7. UPDATE ITEMS & ALGODON (+1% SPEED BOOST, MAX 5%)
    this.updateItemCollections(time);

    // 8. UPDATE PROGRESS BAR
    this.updateHUDProgress();
  }

  private handleCaterpillarInteractions() {
    const alive = this.caterpillars.filter(c => c.isAlive);

    for (let i = 0; i < alive.length; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        const cA = alive[i];
        const cB = alive[j];

        const dx = cB.x - cA.x;
        const dy = cB.y - cA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 36 && dist > 0) {
          const overlap = 36 - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          cA.x -= nx * overlap * 0.5;
          cA.y -= ny * overlap * 0.5;
          cB.x += nx * overlap * 0.5;
          cB.y += ny * overlap * 0.5;

          // SPECIAL RULE:
          // "si de casualidad 2 jugadores quedan en direcciones opuestas y estan apoyados uno del otro,
          // el que este cayendo abajo sera mas pesado y sera levemente sostenido por la oruga que sube"
          const aFalling = cA.gravityDir === 1 && cA.y < cB.y;
          const bClimbing = cB.gravityDir === -1 && cB.y > cA.y;

          const bFalling = cB.gravityDir === 1 && cB.y < cA.y;
          const aClimbing = cA.gravityDir === -1 && cA.y > cB.y;

          if (aFalling && bClimbing) {
            // A is supported by B!
            cA.vy *= 0.2;
            cB.vy *= 0.45;
            SFX.play('pop');
          } else if (bFalling && aClimbing) {
            cB.vy *= 0.2;
            cA.vy *= 0.45;
            SFX.play('pop');
          } else {
            const tempVy = cA.vy;
            cA.vy = cB.vy * 0.5;
            cB.vy = tempVy * 0.5;
          }
        }
      }
    }
  }

  private updateLeaderAndCamera(dt: number) {
    const alive = this.caterpillars.filter(c => c.isAlive);
    if (alive.length === 0) return;

    let frontrunner = alive[0];
    for (let i = 1; i < alive.length; i++) {
      if (alive[i].x > frontrunner.x) {
        frontrunner = alive[i];
      }
    }

    if (frontrunner.id !== this.leaderId) {
      this.leaderId = frontrunner.id;
      this.leaderText.setText(`👑 LÍDER: ${frontrunner.name.toUpperCase()} (+${frontrunner.cottonBoostPercent}%)`);
      this.leaderText.setColor(frontrunner.hexColor);
    }

    this.leaderBadge.x = frontrunner.x;
    this.leaderBadge.y = frontrunner.y - 42;

    const targetScrollX = Math.max(0, frontrunner.x - 480);
    this.cameras.main.scrollX += (targetScrollX - this.cameras.main.scrollX) * Math.min(1, 8 * dt);
  }

  private checkOffScreenEliminations() {
    const leftBound = this.cameras.main.scrollX - 30;

    this.caterpillars.forEach(c => {
      if (c.isAlive && c.x < leftBound) {
        this.eliminateCaterpillar(c, '¡SE QUEDÓ ATRÁS!');
      }
    });
  }

  private updateAnts(dt: number, time: number) {
    const leftCamBound = this.cameras.main.scrollX - 80;

    for (let i = this.ants.length - 1; i >= 0; i--) {
      const ant = this.ants[i];
      if (!ant.active) continue;

      ant.x += ant.vx * dt;
      ant.sprite.x = ant.x;

      this.caterpillars.forEach(c => {
        if (!c.isAlive) return;
        const dist = Phaser.Math.Distance.Between(c.x, c.y, ant.x, ant.y);

        if (dist < 34) {
          if (time < c.invulnerableUntil) {
            ant.active = false;
            ant.sprite.destroy();
            c.leavesCollected += 2;
            SFX.play('gold');
            this.showFloatingText(ant.x, ant.y, '+2 DEFENSA', '#CE93D8');
          } else {
            // Lethal ant collision!
            ant.active = false;
            ant.sprite.destroy();
            this.eliminateCaterpillar(c, '¡CHOCÓ CON UNA HORMIGA!');
          }
        }
      });

      if (ant.x < leftCamBound) {
        ant.active = false;
        ant.sprite.destroy();
        this.ants.splice(i, 1);
      }
    }
  }

  private updateObstacles() {
    const leftCamBound = this.cameras.main.scrollX - 80;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (!obs.active) continue;

      this.caterpillars.forEach(c => {
        if (!c.isAlive) return;
        const dist = Phaser.Math.Distance.Between(c.x, c.y, obs.x, obs.y);

        if (dist < 34) {
          obs.active = false;
          obs.sprite.destroy();
          SFX.play('hit');

          // PENALTY: Obstacle hit reduces speed boost by -1%!
          c.cottonBoostPercent = Math.max(0, c.cottonBoostPercent - 1);
          this.showFloatingText(obs.x, obs.y, '-1% VELOCIDAD 💥', '#FF5252');
          this.cameras.main.shake(100, 0.004);
        }
      });

      if (obs.x < leftCamBound) {
        obs.active = false;
        obs.sprite.destroy();
        this.obstacles.splice(i, 1);
      }
    }
  }

  private updateItemCollections(time: number) {
    const leftCamBound = this.cameras.main.scrollX - 80;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (!item.active) continue;

      this.caterpillars.forEach(c => {
        if (!c.isAlive) return;
        const dist = Phaser.Math.Distance.Between(c.x, c.y, item.sprite.x, item.sprite.y);

        if (dist < 34) {
          item.active = false;
          const ix = item.sprite.x;
          const iy = item.sprite.y;

          if (item.itemType === 'algodon' || item.itemType === 'leaf') {
            c.leavesCollected += 1;
            // RULE: +1% speed boost per cotton, up to max 5%!
            if (c.cottonBoostPercent < 5) {
              c.cottonBoostPercent += 1;
              SFX.play('pop');
              this.showFloatingText(ix, iy, `+1% VEL 🍃 (${c.cottonBoostPercent}%)`, '#81C784');
            } else {
              SFX.play('pop');
              this.showFloatingText(ix, iy, '+1 🍃 (VEL MÁX 5%)', '#FFD700');
            }
          } else if (item.itemType === 'gold_leaf') {
            c.leavesCollected += 5;
            c.cottonBoostPercent = Math.min(5, c.cottonBoostPercent + 2);
            SFX.play('gold');
            this.showFloatingText(ix, iy, `+2% VEL ⭐ DORADA (${c.cottonBoostPercent}%)`, '#FFD700');
          } else if (item.itemType === 'toxic') {
            c.invulnerableUntil = time + 3000;
            SFX.play('gold');
            this.showFloatingText(ix, iy, '¡ESCUDO TÓXICO 3s!', '#CE93D8');
          }

          item.sprite.destroy();
          this.items.splice(i, 1);
        }
      });

      if (item.sprite.x < leftCamBound) {
        item.active = false;
        item.sprite.destroy();
        this.items.splice(i, 1);
      }
    }
  }

  private updateBotAI(bot: CaterpillarEntity) {
    const oncomingAnts = this.ants.filter(a => a.active && a.x > bot.x && a.x < bot.x + 220);
    const oncomingObs = this.obstacles.filter(o => o.active && o.x > bot.x && o.x < bot.x + 200);
    const nearbyCotton = this.items.filter(it => it.active && it.sprite.x > bot.x && it.sprite.x < bot.x + 200);

    const mistakeChance = GameManager.difficulty === 'hard' ? 0.03 : GameManager.difficulty === 'easy' ? 0.28 : 0.12;

    // 1. Dodge oncoming lethal ants
    if (oncomingAnts.length > 0 && Math.random() > mistakeChance) {
      const nearestAnt = oncomingAnts[0];
      const yDiff = nearestAnt.y - bot.y;
      if (Math.abs(yDiff) < 42) {
        // If ant is below and we are falling down, invert up!
        if (yDiff > 0 && bot.gravityDir === 1) {
          bot.gravityDir = -1;
        } else if (yDiff < 0 && bot.gravityDir === -1) {
          bot.gravityDir = 1;
        }
        return;
      }
    }

    // 2. Dodge thorny obstacles
    if (oncomingObs.length > 0 && Math.random() > mistakeChance) {
      const nearestObs = oncomingObs[0];
      const yDiff = nearestObs.y - bot.y;
      if (Math.abs(yDiff) < 38) {
        if (yDiff > 0 && bot.gravityDir === 1) bot.gravityDir = -1;
        else if (yDiff < 0 && bot.gravityDir === -1) bot.gravityDir = 1;
        return;
      }
    }

    // 3. Aim for cotton puffs
    if (nearbyCotton.length > 0 && Math.random() > mistakeChance) {
      const target = nearbyCotton[0];
      if (target.sprite.y < bot.y && bot.gravityDir === 1) {
        bot.gravityDir = -1;
      } else if (target.sprite.y > bot.y && bot.gravityDir === -1) {
        bot.gravityDir = 1;
      }
    }
  }

  private eliminateCaterpillar(c: CaterpillarEntity, reason: string) {
    c.isAlive = false;
    c.eliminatedReason = reason;
    this.eliminatedOrder.push(c.id);
    SFX.play('hit');

    this.tweens.add({
      targets: [c.sprite, c.nameTag, c.speedTag],
      y: c.y + 140,
      angle: 180,
      alpha: 0,
      duration: 600,
      onComplete: () => {
        c.sprite.setVisible(false);
        c.nameTag.setVisible(false);
        c.speedTag.setVisible(false);
      },
    });

    this.showFloatingText(c.x, c.y, reason, '#FF1744');
    this.cameras.main.shake(140, 0.006);

    const aliveCount = this.caterpillars.filter(item => item.isAlive).length;
    this.aliveText.setText(`VIVAS: ${aliveCount}/${this.caterpillars.length}`);

    // If 1 survivor or all eliminated, conclude race!
    if (aliveCount <= 1 && this.caterpillars.length > 1) {
      this.concludeRace();
    } else if (aliveCount === 0 && this.caterpillars.length === 1) {
      this.concludeRace();
    }
  }

  private reachFinishLine(c: CaterpillarEntity) {
    const finishedCount = this.caterpillars.filter(item => item.finishRank !== null).length;
    c.finishRank = finishedCount + 1;
    SFX.play('gold');
    this.showFloatingText(c.x, c.y, `¡LLEGÓ A LA META! #${c.finishRank}`, '#FFD700');

    this.time.delayedCall(1200, () => {
      this.concludeRace();
    });
  }

  private updateHUDProgress() {
    const progress = Math.min(1, Math.max(0, this.cameras.main.scrollX / (this.finishLineX - 480)));
    this.distanceBar.clear();
    this.distanceBar.fillStyle(0x00E676, 1);
    this.distanceBar.fillRoundedRect(222, 767, 356 * progress, 12, 6);
  }

  private showFloatingText(x: number, y: number, msg: string, color: string) {
    const txt = this.add.text(x, y, msg, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: color,
    }).setOrigin(0.5);
    txt.setDepth(30);

    this.tweens.add({
      targets: txt,
      y: y - 35,
      alpha: 0,
      duration: 750,
      onComplete: () => txt.destroy(),
    });
  }

  private concludeRace() {
    if (this.gameEnded) return;
    this.gameEnded = true;
    if (this.antSpawnTimer) this.antSpawnTimer.remove();
    if (this.obstacleSpawnTimer) this.obstacleSpawnTimer.remove();
    if (this.itemSpawnTimer) this.itemSpawnTimer.remove();

    SFX.play('win');

    const survivors = this.caterpillars
      .filter(c => c.isAlive && !this.eliminatedOrder.includes(c.id))
      .sort((a, b) => b.x - a.x);

    survivors.forEach(s => {
      this.eliminatedOrder.push(s.id);
    });

    const reversed = [...this.eliminatedOrder].reverse();
    const finalScores: { [id: number]: number } = {};

    reversed.forEach((id, rankIdx) => {
      const c = this.caterpillars.find(item => item.id === id);
      const rankBonus = [15, 10, 6, 2][rankIdx] || 2;
      const totalStagePoints = rankBonus + (c ? c.leavesCollected : 0);
      finalScores[id] = totalStagePoints;
    });

    GameManager.recordStage1Scores(finalScores);

    const banner = this.add.graphics();
    banner.fillStyle(0x000000, 0.85);
    banner.fillRect(0, 320, 800, 160);
    banner.setScrollFactor(0);
    banner.setDepth(150);

    const winnerId = reversed[0];
    const winnerPlayer = this.caterpillars.find(c => c.id === winnerId);

    const finishTitle = this.add.text(400, 365, '¡CARRERA FINALIZADA!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '22px',
      color: '#FFD700',
    }).setOrigin(0.5);
    finishTitle.setScrollFactor(0);
    finishTitle.setDepth(151);

    const winnerSub = this.add.text(400, 415, `Ganador: ${winnerPlayer?.name || 'Jugador'}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: winnerPlayer?.hexColor || '#00E676',
    }).setOrigin(0.5);
    winnerSub.setScrollFactor(0);
    winnerSub.setDepth(151);

    this.time.delayedCall(2400, () => {
      this.scene.start('RoundResultsScene', {
        stageIndex: 0,
        stageName: 'La Gran Carrera de Orugas',
        rawScores: finalScores,
        nextStageKey: 'ChrysalisScene',
      });
    });
  }
}
