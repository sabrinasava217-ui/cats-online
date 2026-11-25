const COLOR = {
  cream: 0xfff3d6, peach: 0xffcc99, orange: 0xff9a3c, brown: 0x6d4028,
  pink: 0xf48fb1, green: 0x81c784
};

class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    this.makeTextures();
    this.solids = [];
    this.hasKey = false;
    this.won = false;

    this.buildLevel();

    // Dua kucing: pink & hijau (Tahap 1: satu pemain mengendalikan keduanya, tombol Ganti)
    this.spawns = { pink: { x: 70, y: 440 }, green: { x: 125, y: 440 } };
    this.cats = [this.makeCat('pink'), this.makeCat('green')];
    this.activeIndex = 0;
    this.cats.forEach((cat) => {
      this.solids.forEach((s) => this.physics.add.collider(cat, s));
      this.physics.add.overlap(cat, this.spikes, () => this.respawn(cat));
      this.physics.add.overlap(cat, this.keyItem, () => this.collectKey());
    });
    this.marker = this.add.text(0, 0, '▼', { fontSize: '18px', color: '#e8782a' }).setOrigin(0.5).setDepth(10);

    // Input
    this.keys = this.input.keyboard.addKeys({
      left: 'LEFT', right: 'RIGHT', up: 'UP', a: 'A', d: 'D', w: 'W', space: 'SPACE', q: 'Q', r: 'R'
    });
    this.keys.q.on('down', () => this.switchCat());
    this.keys.r.on('down', () => this.scene.restart());
    CONTROLS.onSwitch = () => this.switchCat();

    // HUD
    this.hud = this.add.text(16, 12, '', { fontSize: '18px', color: '#7a3b10', fontStyle: 'bold' }).setDepth(10);
    this.add.text(944, 12, 'Q / Ganti = pindah kucing • R = ulang', { fontSize: '13px', color: '#b8793f' })
      .setOrigin(1, 0).setDepth(10);
  }

  // ---------- Tekstur (digambar lewat kode, tanpa file aset) ----------
  makeTextures() {
    if (this.textures.exists('cat_pink')) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    const cat = (key, col) => {
      g.clear();
      g.fillStyle(col); g.lineStyle(3, COLOR.brown);
      g.fillTriangle(6, 14, 8, 2, 17, 10); g.strokeTriangle(6, 14, 8, 2, 17, 10);   // telinga kiri
      g.fillTriangle(30, 14, 28, 2, 19, 10); g.strokeTriangle(30, 14, 28, 2, 19, 10); // telinga kanan
      g.fillRoundedRect(3, 8, 30, 27, 11); g.strokeRoundedRect(3, 8, 30, 27, 11);     // badan/kepala
      g.fillStyle(0x3e2723);
      g.fillCircle(13, 20, 2.6); g.fillCircle(23, 20, 2.6);                             // mata
      g.fillStyle(0xffffff); g.fillCircle(13.8, 19.2, 0.9); g.fillCircle(23.8, 19.2, 0.9);
      g.fillStyle(0xd84a73); g.fillTriangle(16, 25, 20, 25, 18, 28);                    // hidung
      g.lineStyle(1.5, COLOR.brown);
      g.lineBetween(4, 24, 10, 25); g.lineBetween(32, 24, 26, 25);                      // kumis
      g.generateTexture(key, 36, 36);
    };
    cat('cat_pink', COLOR.pink);
    cat('cat_green', COLOR.green);

    g.clear(); g.fillStyle(0xe53935); g.fillTriangle(0, 16, 6, 0, 12, 16); g.fillTriangle(12, 16, 18, 0, 24, 16);
    g.generateTexture('spike', 24, 16);

    g.clear(); g.lineStyle(4, 0xf9a825); g.strokeCircle(9, 9, 7); g.lineBetween(15, 14, 26, 25);
    g.lineBetween(21, 21, 25, 17); g.generateTexture('key', 28, 28);

    g.clear(); g.fillStyle(0xc2703a); g.fillRoundedRect(0, 0, 44, 70, { tl: 22, tr: 22, bl: 0, br: 0 });
    g.fillStyle(0xffd54f); g.fillCircle(34, 40, 3); g.generateTexture('door_closed', 44, 70);

    g.clear(); g.fillStyle(0xffe082); g.fillRoundedRect(0, 0, 44, 70, { tl: 22, tr: 22, bl: 0, br: 0 });
    g.fillStyle(0xfff8e1); g.fillRoundedRect(8, 10, 28, 60, { tl: 14, tr: 14, bl: 0, br: 0 });
    g.generateTexture('door_open', 44, 70);
    g.destroy();
  }

  // ---------- Level ----------
  plat(x, y, w, h) {
    // Blok peach dengan garis oranye di atas
    const r = this.add.rectangle(x + w / 2, y + h / 2, w, h, COLOR.peach).setStrokeStyle(2, COLOR.orange);
    this.add.rectangle(x + w / 2, y + 3, w, 6, COLOR.orange);
    this.physics.add.existing(r, true);
    this.solids.push(r);
    return r;
  }

  buildLevel() {
    this.plat(0, 500, 960, 40);     // lantai
    this.plat(140, 410, 160, 20);   // A
    this.plat(380, 340, 160, 20);   // B (kunci)
    this.plat(640, 270, 160, 20);   // C
    this.plat(740, 170, 220, 20);   // platform atas (pintu)

    // Duri (rintangan)
    this.spikes = this.physics.add.staticGroup();
    [330, 354, 600, 624].forEach((x) => this.spikes.create(x, 492, 'spike').setSize(20, 10).refreshBody());

    // Tombol injak -> membuka gerbang (butuh kerja sama)
    this.plateRect = new Phaser.Geom.Rectangle(70, 492, 60, 8);
    this.add.rectangle(100, 496, 60, 8, 0x8e24aa);
    this.add.text(100, 470, 'TAHAN', { fontSize: '11px', color: '#8e24aa', fontStyle: 'bold' }).setOrigin(0.5);

    // Gerbang
    this.gate = this.add.rectangle(828, 85, 16, 170, 0x8e24aa);
    this.physics.add.existing(this.gate, true);
    this.solids.push(this.gate);

    // Kunci & pintu keluar
    this.keyItem = this.physics.add.staticImage(460, 312, 'key');
    this.door = this.add.image(910, 135, 'door_closed');
    this.doorRect = new Phaser.Geom.Rectangle(888, 100, 44, 70);
  }

  makeCat(name) {
    const c = this.physics.add.sprite(this.spawns[name].x, this.spawns[name].y, 'cat_' + name);
    c.setCollideWorldBounds(true).setDragX(1200);
    c.body.setSize(28, 30).setOffset(4, 6);
    c.catName = name;
    return c;
  }

  get active() { return this.cats[this.activeIndex]; }
  switchCat() { this.activeIndex = 1 - this.activeIndex; }

  respawn(cat) {
    cat.setPosition(this.spawns[cat.catName].x, this.spawns[cat.catName].y).setVelocity(0, 0);
    this.cameras.main.shake(120, 0.004);
  }

  collectKey() {
    if (this.hasKey) return;
    this.hasKey = true;
    this.keyItem.destroy();
    this.door.setTexture('door_open');
  }

  // ---------- Loop ----------
  update() {
    if (this.won) return;
    const k = this.keys;

    this.cats.forEach((cat, i) => {
      if (i !== this.activeIndex) { cat.setVelocityX(0); return; }
      const left = CONTROLS.left || k.left.isDown || k.a.isDown;
      const right = CONTROLS.right || k.right.isDown || k.d.isDown;
      const jump = CONTROLS.jump || k.up.isDown || k.w.isDown || k.space.isDown;
      if (left) { cat.setVelocityX(-190); cat.setFlipX(true); }
      else if (right) { cat.setVelocityX(190); cat.setFlipX(false); }
      else cat.setVelocityX(0);
      if (jump && cat.body.blocked.down) cat.setVelocityY(-520);
    });

    // Tombol injak membuka gerbang selama ada kucing di atasnya
    const pressed = this.cats.some((c) => Phaser.Geom.Intersects.RectangleToRectangle(c.getBounds(), this.plateRect));
    this.gate.body.enable = !pressed;
    this.gate.setAlpha(pressed ? 0.15 : 1);

    // Penanda kucing aktif
    this.marker.setPosition(this.active.x, this.active.y - 28);

    // Menang: kunci diambil & kedua kucing di pintu
    const both = this.cats.every((c) => Phaser.Geom.Intersects.RectangleToRectangle(c.getBounds(), this.doorRect));
    if (this.hasKey && both) this.win();

    this.hud.setText(
      (this.hasKey ? '🔑 Kunci didapat — bawa KEDUA kucing ke pintu' : '🔑 Cari kunci') +
      '   |   Kucing: ' + (this.active.catName === 'pink' ? 'PINK' : 'HIJAU')
    );
  }

  win() {
    this.won = true;
    this.physics.pause();
    this.add.rectangle(480, 270, 960, 540, 0xfff3d6, 0.85).setDepth(20);
    this.add.text(480, 240, 'LEVEL SELESAI! 🐱🐱', { fontSize: '44px', color: '#e8782a', fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(21);
    this.add.text(480, 300, 'Ketuk layar untuk main lagi', { fontSize: '22px', color: '#7a3b10' })
      .setOrigin(0.5).setDepth(21);
    this.time.delayedCall(400, () => this.input.once('pointerdown', () => this.scene.restart()));
  }
}
