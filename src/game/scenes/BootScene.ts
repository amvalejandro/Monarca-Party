import Phaser from 'phaser';
import { generateGameTextures } from '../sprites';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Generate all procedural pixel textures into Phaser's TextureManager
    generateGameTextures(this);
  }

  create() {
    // Start initial game stage or standby for menu
    this.scene.start('CaterpillarScene');
  }
}
