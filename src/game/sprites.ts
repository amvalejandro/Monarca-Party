import Phaser from 'phaser';

/**
 * Programmatic Pixel Art Texture Generator for Phaser 3.
 * Generates all game sprites on HTML5 canvases without relying on external image files.
 */

// Helper to draw a pixel matrix
function drawPixelMatrix(
  ctx: CanvasRenderingContext2D,
  matrix: string[],
  palette: Record<string, string>,
  pixelSize: number = 2
) {
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    for (let c = 0; c < row.length; c++) {
      const char = row[c];
      if (char !== '.' && palette[char]) {
        ctx.fillStyle = palette[char];
        ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
      }
    }
  }
}

export function generateGameTextures(scene: Phaser.Scene) {
  const textures = scene.textures;

  // 1. CATERPILLAR TEXTURES (4 colors x 2 animation frames: crawl_1, crawl_2)
  const caterpillarColors: Record<string, { main: string; light: string; dark: string; stripe: string }> = {
    p0: { main: '#FF6F00', light: '#FFA726', dark: '#E65100', stripe: '#212121' }, // Orange
    p1: { main: '#1E88E5', light: '#64B5F6', dark: '#0D47A1', stripe: '#1A237E' }, // Blue
    p2: { main: '#43A047', light: '#81C784', dark: '#1B5E20', stripe: '#004D40' }, // Green
    p3: { main: '#8E24AA', light: '#BA68C8', dark: '#4A148C', stripe: '#311B92' }, // Purple
    gold: { main: '#FFD700', light: '#FFF59D', dark: '#FFA000', stripe: '#FF6F00' }, // Skin
    emerald: { main: '#00E676', light: '#B9F6CA', dark: '#00C853', stripe: '#004D40' }, // Skin
  };

  const caterpillarMatrixFrame1 = [
    "....MMMM................",
    "...MMLLMM...............",
    "..MMWWBMMM...MMMM...MMMM",
    "..MMWWBMMM..MMSSMM.MMSSM",
    ".MMMLLMMM..MMSSSSMMMSSSS",
    "MMMMMMMMMMMMMMMMMMMMMMMM",
    "MMMMSSSSMMMMSSSSMMMMSSSS",
    ".MMDDDDMMMMDDDDMMMMDDDD.",
    "...LL..LL...LL..LL..LL..",
  ];

  const caterpillarMatrixFrame2 = [
    "....MMMM................",
    "...MMLLMM....MMMM...MMMM",
    "..MMWWBMMM..MMSSMM.MMSSM",
    "..MMWWBMMM.MMSSSSMMMSSSS",
    ".MMMLLMMMMMMMMMMMMMMMMMM",
    "MMMMSSSSMMMMSSSSMMMMSSSS",
    ".MMDDDDMMMMDDDDMMMMDDDD.",
    "..LL....LL...LL....LL...",
  ];

  Object.entries(caterpillarColors).forEach(([colorKey, colors]) => {
    const palette: Record<string, string> = {
      M: colors.main,
      L: colors.light,
      D: colors.dark,
      S: colors.stripe,
      W: '#FFFFFF',
      B: '#000000',
    };

    // Frame 1
    const c1 = document.createElement('canvas');
    c1.width = 48;
    c1.height = 24;
    const ctx1 = c1.getContext('2d')!;
    drawPixelMatrix(ctx1, caterpillarMatrixFrame1, palette, 2);
    if (!textures.exists(`caterpillar_${colorKey}_0`)) {
      textures.addCanvas(`caterpillar_${colorKey}_0`, c1);
    }

    // Frame 2
    const c2 = document.createElement('canvas');
    c2.width = 48;
    c2.height = 24;
    const ctx2 = c2.getContext('2d')!;
    drawPixelMatrix(ctx2, caterpillarMatrixFrame2, palette, 2);
    if (!textures.exists(`caterpillar_${colorKey}_1`)) {
      textures.addCanvas(`caterpillar_${colorKey}_1`, c2);
    }
  });

  // 2. CHRYSALIS (JADE-GREEN WITH GOLD RIM AND SPOTS)
  if (!textures.exists('chrysalis')) {
    const chrysalisCanvas = document.createElement('canvas');
    chrysalisCanvas.width = 80;
    chrysalisCanvas.height = 120;
    const ctx = chrysalisCanvas.getContext('2d')!;

    // Silk thread anchor at the top
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(40, 20);
    ctx.stroke();

    // Black cremaster tip
    ctx.fillStyle = '#111111';
    ctx.fillRect(36, 18, 8, 8);

    // Chrysalis smooth body (Green jade gradient)
    const bodyGrad = ctx.createRadialGradient(34, 55, 5, 40, 65, 38);
    bodyGrad.addColorStop(0, '#81C784');
    bodyGrad.addColorStop(0.5, '#4CAF50');
    bodyGrad.addColorStop(0.9, '#2E7D32');
    bodyGrad.addColorStop(1, '#1B5E20');

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(40, 65, 30, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Golden coronal rim dots (typical Danaus plexippus)
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFE082';
    ctx.shadowBlur = 6;
    for (let i = 0; i < 7; i++) {
      const angle = (Math.PI * 0.2) + (i * (Math.PI * 0.6) / 6);
      const x = 40 + Math.cos(angle) * 26;
      const y = 52 + Math.sin(angle) * 10;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Gilded bottom dots
    ctx.beginPath();
    ctx.arc(32, 90, 2, 0, Math.PI * 2);
    ctx.arc(48, 90, 2, 0, Math.PI * 2);
    ctx.arc(40, 98, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    textures.addCanvas('chrysalis', chrysalisCanvas);
  }

  // 3. BUTTERFLY TEXTURES (4 colors + special skins x 2 frames: wings open & wings folded)
  const butterflyWingColors: Record<string, { main: string; pattern: string; edge: string }> = {
    p0: { main: '#FF6F00', pattern: '#FFB300', edge: '#111111' }, // Orange Monarch
    p1: { main: '#1976D2', pattern: '#64B5F6', edge: '#0D47A1' }, // Blue
    p2: { main: '#388E3C', pattern: '#81C784', edge: '#1B5E20' }, // Green
    p3: { main: '#8E24AA', pattern: '#CE93D8', edge: '#4A148C' }, // Purple
    gold: { main: '#FFD700', pattern: '#FFF9C4', edge: '#E65100' }, // Golden Skin
    emerald: { main: '#00E676', pattern: '#A7FFEB', edge: '#004D40' }, // Emerald Skin
  };

  const butterflyOpenMatrix = [
    "..EEEE..............EEEE..",
    ".EEMMMEE..........EEMMMEE.",
    "EMMMMPMEE........EEMPMMEE.",
    "EMMPPPPMME......EMMPPPMEE.",
    "EMMMMPPMMME....EMMMPPMMEE.",
    "EEMMMPMMMEE.BB.EEMMMPMMEE.",
    ".EEMMMMEEE.BBBB.EEEMMMMEE.",
    "..EEMMEEE..BBBB..EEEMMEE..",
    "...EEEE.....BB.....EEEE...",
    "....EE......BB......EE....",
  ];

  const butterflyFoldedMatrix = [
    "....EEEE..........EEEE....",
    "...EEMMMEE......EEMMMEE...",
    "..EMMMMPMEE....EEMPMMEE...",
    "..EMMPPPPMME..EMMPPPMEE...",
    "..EMMMMPPMMEEEMMMPPMMEE...",
    "...EEMMMPMEEBBEEEMMMPMEE..",
    "....EEMMMEEBBBBEEEMMMEE...",
    ".....EEEE..BBBB..EEEE.....",
    "............BB............",
    "............BB............",
  ];

  Object.entries(butterflyWingColors).forEach(([colorKey, colors]) => {
    const palette: Record<string, string> = {
      M: colors.main,
      P: colors.pattern,
      E: colors.edge,
      B: '#111111',
      W: '#FFFFFF',
    };

    // Frame 0 (open)
    const c0 = document.createElement('canvas');
    c0.width = 52;
    c0.height = 36;
    const ctx0 = c0.getContext('2d')!;
    drawPixelMatrix(ctx0, butterflyOpenMatrix, palette, 2);
    // Draw white spots on black margin
    ctx0.fillStyle = '#FFFFFF';
    ctx0.fillRect(4, 8, 2, 2);
    ctx0.fillRect(46, 8, 2, 2);
    ctx0.fillRect(2, 14, 2, 2);
    ctx0.fillRect(48, 14, 2, 2);
    if (!textures.exists(`butterfly_${colorKey}_0`)) {
      textures.addCanvas(`butterfly_${colorKey}_0`, c0);
    }

    // Frame 1 (folded)
    const c1 = document.createElement('canvas');
    c1.width = 52;
    c1.height = 36;
    const ctx1 = c1.getContext('2d')!;
    drawPixelMatrix(ctx1, butterflyFoldedMatrix, palette, 2);
    ctx1.fillStyle = '#FFFFFF';
    ctx1.fillRect(8, 10, 2, 2);
    ctx1.fillRect(42, 10, 2, 2);
    if (!textures.exists(`butterfly_${colorKey}_1`)) {
      textures.addCanvas(`butterfly_${colorKey}_1`, c1);
    }
  });

  // 4. ALGODONCILLO LEAF (Asclepias curassavica leaf)
  if (!textures.exists('leaf_algodoncillo')) {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d')!;
    const leafMatrix = [
      "..............GG................",
      ".............GGGG...............",
      "............GGGGGG..............",
      "...........GGGLGGGG.............",
      "..........GGGGLLGGGG............",
      ".........GGGGGLGGGGGG...........",
      "........GGGGGGLLGGGGGG..........",
      ".......GGGGGGGGLGGGGGGG.........",
      "......GGGGGGGGGLLGGGGGGG........",
      ".....GGGGGGGGGGGLGGGGGGGG.......",
      "....GGGGGGGGGGGGLLGGGGGGGG......",
      "...GGGGGGGGGGGGGGLGGGGGGGGG.....",
      "...DDGGGGGGGGGGGLLGGGGGGGDD.....",
      "....DDDGGGGGGGGGLGGGGGGDDD......",
      "......DDDDDDDDDDBBDDDDDDD.......",
      "...............BB...............",
    ];
    drawPixelMatrix(ctx, leafMatrix, {
      G: '#4CAF50',
      L: '#81C784',
      D: '#2E7D32',
      B: '#3E2723',
    }, 2);
    textures.addCanvas('leaf_algodoncillo', c);
  }

  // 5. GOLDEN LEAF (Hoja dorada mística)
  if (!textures.exists('leaf_golden')) {
    const c = document.createElement('canvas');
    c.width = 36;
    c.height = 36;
    const ctx = c.getContext('2d')!;
    const goldMatrix = [
      "..............YY................",
      ".............YYYY...............",
      "............YYYYYY..............",
      "...........YYYWYYYY.............",
      "..........YYYYWWYYYY............",
      ".........YYYYYWYWWYYY...........",
      "........YYYYYYWWYYYYYY..........",
      ".......YYYYYYYYWYYYYYYY.........",
      "......YYYYYYYYYWYYYYYYYY........",
      ".....YYYYYYYYYYWWYYYYYYYY.......",
      "....YYYYYYYYYYYWWYYYYYYYYY......",
      "...YYYYYYYYYYYYWWYYYYYYYYYY.....",
      "...OOYYYYYYYYYYWWYYYYYYYYOO.....",
      "....OOOYYYYYYYYWWYYYYYYOOO......",
      "......OOOOOOOOOZZOOOOOOOO.......",
      "...............ZZ...............",
    ];
    drawPixelMatrix(ctx, goldMatrix, {
      Y: '#FFD700',
      W: '#FFFDE7',
      O: '#FFA000',
      Z: '#E65100',
    }, 2);
    textures.addCanvas('leaf_golden', c);
  }

  // 6. ANT (Hormiga)
  if (!textures.exists('ant')) {
    const c = document.createElement('canvas');
    c.width = 36;
    c.height = 36;
    const ctx = c.getContext('2d')!;
    const antMatrix = [
      "...R..........R...",
      "....R........R....",
      ".....R......R.....",
      "......BBBBBB......",
      ".....BBBEBBB......",
      "......BBBBBB......",
      "..R....BBBB....R..",
      "..R...BBBBBB...R..",
      "...R..BBBBBB..R...",
      "....R.BBBBBB.R....",
      ".....BBBBBBBB.....",
      "....BBBBBBBBBB....",
      "...BBBBBBBBBBBB...",
      "..R.BBBBBBBBBB.R..",
      ".R...BBBBBBBB...R.",
      "R................R",
    ];
    drawPixelMatrix(ctx, antMatrix, {
      B: '#212121',
      E: '#FF1744', // Red menacing eye
      R: '#B71C1C', // Red-tinted legs
    }, 2);
    textures.addCanvas('ant', c);
  }

  // 7. TOXIC DROPLET (Látex tóxico protector)
  if (!textures.exists('toxic_drop')) {
    const c = document.createElement('canvas');
    c.width = 28;
    c.height = 28;
    const ctx = c.getContext('2d')!;
    const dropMatrix = [
      "......PP......",
      ".....PPPP.....",
      "....PPLPPP....",
      "...PPLLPPPP...",
      "..PPLLLLPPPP..",
      ".PPLLLLLLPPPP.",
      ".PPLWWLLLLPPP.",
      "PPLLWWLLLLPPPP",
      "PPLLLLLLLLPPPP",
      ".PPLLLLLLPPPP.",
      "..PPPPPPPPPP..",
      "....PPPPPP....",
    ];
    drawPixelMatrix(ctx, dropMatrix, {
      P: '#7B1FA2',
      L: '#BA68C8',
      W: '#FFFFFF',
    }, 2);
    textures.addCanvas('toxic_drop', c);
  }

  // 8. CALANDRIA (Predator Bird / Pájaro)
  if (!textures.exists('calandria')) {
    const c = document.createElement('canvas');
    c.width = 56;
    c.height = 40;
    const ctx = c.getContext('2d')!;
    const birdMatrix = [
      "......................YYYY..............",
      "....................YYYYYYYY............",
      "...................YYBBBEEYYY...........",
      ".....FFFF.........YYBBBBBYYYY...........",
      "...FFFFFFFF......YYYYYYYYYYYYYYOOO......",
      ".FFFFFFFFFFFF..GGGGYYYYYYYYYYOOOO.......",
      "FFFFFFFFFFFFFFGGGGGYYYYYYYYYY...........",
      ".FFFFFFFFFFFF..GGGGYYYYYYY..............",
      "...FFFFFFFF.....GGGYYYYYY...............",
      ".....FFFF........GGYYY..................",
      "..................LL....................",
      "..................LL....................",
    ];
    drawPixelMatrix(ctx, birdMatrix, {
      F: '#616161', // Feather grey
      G: '#9E9E9E',
      Y: '#FBC02D', // Yellow belly (Calandria/Tyrannus)
      B: '#212121', // Dark head cap
      E: '#FFFFFF', // Eye
      O: '#E65100', // Orange-yellow sharp beak
      L: '#4E342E', // Legs
    }, 2);
    textures.addCanvas('calandria', c);
  }

  // 9. NECTAR FLOWER (Flor de algodoncillo)
  if (!textures.exists('nectar_flower')) {
    const c = document.createElement('canvas');
    c.width = 30;
    c.height = 30;
    const ctx = c.getContext('2d')!;
    const flowerMatrix = [
      "....OO....OO....",
      "...OOOO..OOOO...",
      "..OOOOOOOOOOOO..",
      "....YYYYYYYY....",
      "..YYYYWWWWYYYY..",
      "..YYYYWWWWYYYY..",
      "....YYYYYYYY....",
      "..OOOOOOOOOOOO..",
      "...OOOO..OOOO...",
      "....OO....OO....",
    ];
    drawPixelMatrix(ctx, flowerMatrix, {
      O: '#FF5722',
      Y: '#FFC107',
      W: '#FFFDE7',
    }, 2);
    textures.addCanvas('nectar_flower', c);
  }

  // 10. TROPHY (Trofeo)
  if (!textures.exists('trophy')) {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d')!;
    const trophyMatrix = [
      "...YYYYYYYYYYYY...",
      ".YYYWWWWWWWWYYYY.",
      "YYYYWWWWWWWWYYYY",
      "YYYYYYYYYYYYYYYY",
      "YYYY...YYYY...YYYY",
      ".YY....YYYY....YY.",
      ".......YYYY.......",
      ".......YYYY.......",
      "......YYYYYY......",
      ".....YYYYYYYY.....",
      "....DDDDDDDDDD....",
      "...DDDDDDDDDDDD...",
    ];
    drawPixelMatrix(ctx, trophyMatrix, {
      Y: '#FFD700',
      W: '#FFF9C4',
      D: '#795548',
    }, 2);
    textures.addCanvas('trophy', c);
  }

  // 11. THORNY BRANCH (Obstáculo de espinas)
  if (!textures.exists('thorny_branch')) {
    const c = document.createElement('canvas');
    c.width = 36;
    c.height = 36;
    const ctx = c.getContext('2d')!;
    const thornMatrix = [
      "....TT..........TT....",
      "...TTTT........TTTT...",
      "....TTTT......TTTT....",
      ".....TTTT....TTTT.....",
      "......BBBBBBBBBB......",
      ".....BBBBBBBBBBBB.....",
      "....BBBDDDBBDDDBBB....",
      "....BBBDDDBBDDDBBB....",
      ".....BBBBBBBBBBBB.....",
      "......BBBBBBBBBB......",
      ".....TTTT....TTTT.....",
      "....TTTT......TTTT....",
      "...TTTT........TTTT...",
      "....TT..........TT....",
    ];
    drawPixelMatrix(ctx, thornMatrix, {
      B: '#5D4037', // Bark brown
      D: '#3E2723', // Dark wood
      T: '#D32F2F', // Red thorns
    }, 2);
    textures.addCanvas('thorny_branch', c);
  }

  // 12. ALGODÓN PUFF (Copo de algodón de algodoncillo)
  if (!textures.exists('algodon_puff')) {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d')!;
    const cottonMatrix = [
      ".......WWWW.......",
      ".....WWWWWWWW.....",
      "...WWWWWWWWWWWW...",
      "..WWWWGGWWWWGGWW..",
      ".WWWWGGGGWWGGGGWW.",
      ".WWWWGGGGWWGGGGWW.",
      "WWWWWWWWWWWWWWWWWW",
      "WWWWWWWWSSWWWWWWWW",
      ".WWWWWWSSSSWWWWWW.",
      "..WWWWWWSSWWWWWW..",
      "....WWWWWWWWWW....",
      ".......WWWW.......",
    ];
    drawPixelMatrix(ctx, cottonMatrix, {
      W: '#FFFFFF',
      G: '#ECEFF1',
      S: '#3E2723', // Seed center
    }, 2);
    textures.addCanvas('algodon_puff', c);
  }
}

