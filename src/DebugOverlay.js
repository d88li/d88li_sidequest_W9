// src/DebugOverlay.js
// Debug overlay (VIEW tool, driven by SYSTEM events).
//
// Responsibilities:
// - Render debug info in screen-space (camera.off())
// - Toggle visibility (typically via InputManager signal)
// - Log events from EventBus (including wildcard "*")
// - Display real-time player/world state
// - Inspect collisions and physics
// - Allow on-the-fly tuning value adjustments
// - Show entity states and transitions
//
// Non-goals:
// - Does NOT change world state, physics, or outcomes
// - Does NOT own input polling (InputManager does)
// - Does NOT subscribe to events directly (Game wires it)
//
// Architectural notes:
// - Game owns the EventBus and forwards events to DebugOverlay.log().
// - This file exists to support iteration + teaching architecture boundaries.

export class DebugOverlay {
  constructor() {
    this.enabled = false;
    this.lines = [];
    this.maxLines = 8;

    // Navigation state
    this.page = 0; // 0: stats, 1: collisions, 2: events, 3: tuning
    this.tuningIndex = 0; // which tuning param to edit
    this.tuningParams = [];

    // Collision visualization
    this.showCollisions = false;

    // Event log
    this.eventLog = {};
    this.eventCount = 0;
  }

  toggle() {
    this.enabled = !this.enabled;
  }

  /**
   * Handle debug input (called each frame from main.js draw loop)
   * Requires input snapshot to be passed in
   */
  handleInput(input) {
    if (!this.enabled || !input) return;

    // Tab/Q/E to navigate pages
    if (input.debugPageNext) this.page = (this.page + 1) % 4;
    if (input.debugPagePrev) this.page = (this.page - 1 + 4) % 4;

    // Page 3: Tuning value adjustment
    if (this.page === 3 && this.tuningParams.length > 0) {
      if (input.debugTuneUp) this.tuningIndex = (this.tuningIndex - 1 + this.tuningParams.length) % this.tuningParams.length;
      if (input.debugTuneDown) this.tuningIndex = (this.tuningIndex + 1) % this.tuningParams.length;
      if (input.debugTuneIncrease) this._incrTuning(0.1);
      if (input.debugTuneDecrease) this._incrTuning(-0.1);
    }

    // C to toggle collision visualization
    if (input.debugToggleCollisions) this.showCollisions = !this.showCollisions;
  }

  _incrTuning(delta) {
    if (this.tuningIndex >= this.tuningParams.length) return;
    const p = this.tuningParams[this.tuningIndex];
    p.value += delta;
    if (p.step) {
      p.value = Math.round(p.value / p.step) * p.step;
    }
  }

  /**
   * Initialize tuning params from PlayerEntity/Level config
   */
  initTuningParams(playerCtrl, level) {
    if (!playerCtrl || !playerCtrl.player) return;

    const p = playerCtrl.player;
    this.tuningParams = [
      { name: "Move Speed", obj: p, key: "MOVE_SPEED", value: p.MOVE_SPEED, step: 0.1 },
      { name: "Jump Strength", obj: p, key: "JUMP_STRENGTH", value: p.JUMP_STRENGTH, step: 0.1 },
      { name: "Invuln Frames", obj: p, key: "INVULN_FRAMES", value: p.INVULN_FRAMES, step: 1 },
      { name: "Knock Frames", obj: p, key: "KNOCK_FRAMES", value: p.KNOCK_FRAMES, step: 1 },
      { name: "Knockback X", obj: p, key: "KNOCKBACK_X", value: p.KNOCKBACK_X, step: 0.1 },
      { name: "Knockback Y", obj: p, key: "KNOCKBACK_Y", value: p.KNOCKBACK_Y, step: 0.1 },
      { name: "Attack Start Frame", obj: p, key: "ATTACK_START", value: p.ATTACK_START, step: 1 },
      { name: "Attack End Frame", obj: p, key: "ATTACK_END", value: p.ATTACK_END, step: 1 },
    ];

    if (level) {
      this.tuningParams.push(
        { name: "Gravity", obj: level, key: "GRAVITY", value: level.GRAVITY, step: 0.5 },
        { name: "Win Score", obj: level, key: "WIN_SCORE", value: level.WIN_SCORE, step: 1 }
      );
    }
  }

  /**
   * Apply tuning change to object
   */
  applyTuning() {
    if (this.tuningIndex >= this.tuningParams.length) return;
    const p = this.tuningParams[this.tuningIndex];
    if (p.obj && p.key) {
      p.obj[p.key] = p.value;
    }
  }

  log(evt) {
    // evt is { name, payload } from EventBus wildcard
    if (!evt) return;
    const msg = `${evt.name}`;
    this.lines.unshift(msg);
    if (this.lines.length > this.maxLines) this.lines.length = this.maxLines;

    // Track event frequency
    this.eventLog[evt.name] = (this.eventLog[evt.name] ?? 0) + 1;
    this.eventCount++;
  }

  draw({ game } = {}) {
    if (!this.enabled) return;

    const lvl = game?.level || null;
    const playerCtrl = lvl?.playerCtrl || null;

    // Init tuning params on first draw
    if (this.tuningParams.length === 0) {
      this.initTuningParams(playerCtrl, lvl);
    }

    camera.off();

    // Draw based on current page
    if (this.page === 0) this._drawStatsPage(playerCtrl, lvl);
    else if (this.page === 1) this._drawCollisionsPage(playerCtrl, lvl);
    else if (this.page === 2) this._drawEventsPage();
    else if (this.page === 3) this._drawTuningPage();

    // Draw collision shapes if enabled
    if (this.showCollisions) this._drawCollisionShapes(lvl);

    camera.on();
  }

  _drawStatsPage(playerCtrl, lvl) {
    const p = playerCtrl?.player;
    if (!p || !p.sprite) return;

    push();
    noStroke();
    fill(0, 200);
    rect(6, 6, 400, 200, 6);
    pop();

    fill(255);
    textSize(10);
    let y = 18;

    // Page indicator
    fill(100, 255, 100);
    text("[Page 0/3] STATS | Tab/Q/E to navigate", 12, y);
    y += 12;

    fill(255);
    // Player position
    text(`Pos: (${p.sprite.x.toFixed(1)}, ${p.sprite.y.toFixed(1)})`, 12, y);
    y += 10;

    // Velocity
    text(`Vel: (${p.sprite.vx.toFixed(2)}, ${p.sprite.vy.toFixed(2)})`, 12, y);
    y += 10;

    // Health
    text(`Health: ${p.health}/${p.maxHealth}`, 12, y);
    y += 10;

    // State flags
    text(`Dead: ${p.dead}  Attacking: ${p.attacking}  Invuln: ${p.invulnTimer > 0}`, 12, y);
    y += 10;

    // Timers
    text(`InvulnTimer: ${p.invulnTimer}/${p.INVULN_FRAMES}`, 12, y);
    y += 10;
    text(`KnockTimer: ${p.knockTimer}/${p.KNOCK_FRAMES}`, 12, y);
    y += 10;

    // Animation state
    const aniName = p.sprite.ani?.name ?? "none";
    const aniFrame = p.sprite.ani?.frame ?? 0;
    text(`Animation: ${aniName} [${aniFrame}]`, 12, y);
    y += 10;

    // World state
    const score = lvl?.score ?? 0;
    const won = lvl?.won ?? false;
    text(`Score: ${score}  Won: ${won}`, 12, y);
    y += 10;
    text(`Elapsed: ${(lvl?.elapsedMs ?? 0).toFixed(0)}ms`, 12, y);
    y += 10;

    // Ground sensor info
    const isGrounded = p.sensor ? p.sensor.overlapping(lvl?.ground) : false;
    text(`Grounded: ${isGrounded}`, 12, y);
    y += 12;

    // Event log
    text("Recent Events:", 12, y);
    y += 10;
    for (let i = 0; i < Math.min(this.lines.length, 4); i++) {
      fill(200, 200, 100);
      text(this.lines[i], 12, y);
      y += 9;
      fill(255);
    }
  }

  _drawCollisionsPage(playerCtrl, lvl) {
    const p = playerCtrl?.player;
    if (!p || !p.sprite) return;

    push();
    noStroke();
    fill(0, 200);
    rect(6, 6, 400, 220, 6);
    pop();

    fill(255);
    textSize(10);
    let y = 18;

    fill(100, 100, 255);
    text("[Page 1/3] COLLISIONS | Tab/Q/E to navigate | C to show boxes", 12, y);
    y += 12;

    fill(255);
    // Collision info
    text(`Sprite bounds: (${p.sprite.x.toFixed(1)}, ${p.sprite.y.toFixed(1)})`, 12, y);
    y += 10;
    text(`  Size: ${p.sprite.w.toFixed(1)}x${p.sprite.h.toFixed(1)}`, 12, y);
    y += 10;

    if (p.sensor) {
      text(`Sensor bounds: (${p.sensor.x.toFixed(1)}, ${p.sensor.y.toFixed(1)})`, 12, y);
      y += 10;
      text(`  Size: ${p.sensor.w.toFixed(1)}x${p.sensor.h.toFixed(1)}`, 12, y);
      y += 10;
    }

    // Ground collision
    const groundGroup = lvl?.ground;
    if (groundGroup) {
      const overlapping = p.sensor?.overlapping(groundGroup) ?? false;
      text(`Ground collision: ${overlapping ? "YES" : "NO"}`, 12, y);
      y += 10;
    }

    // Platform collisions
    const platformL = lvl?.platformsL;
    const platformR = lvl?.platformsR;
    const onPlatL = p.sensor?.overlapping(platformL) ?? false;
    const onPlatR = p.sensor?.overlapping(platformR) ?? false;
    text(`Platform L: ${onPlatL ? "YES" : "NO"}  Platform R: ${onPlatR ? "YES" : "NO"}`, 12, y);
    y += 10;

    // Wall collisions
    const wallL = lvl?.wallsL;
    const wallR = lvl?.wallsR;
    const touchingWallL = p.sprite.overlapping(wallL) ?? false;
    const touchingWallR = p.sprite.overlapping(wallR) ?? false;
    text(`Wall L: ${touchingWallL ? "YES" : "NO"}  Wall R: ${touchingWallR ? "YES" : "NO"}`, 12, y);
    y += 10;

    // Attack range
    if (p.attacking) {
      text(`Attack ACTIVE (frame ${p.attackFrameCounter})`, 12, y);
      y += 10;
      text(`  Active window: ${p.ATTACK_START}-${p.ATTACK_END} frames`, 12, y);
      y += 10;
    }

    // Boar state
    const boarGrp = lvl?.boar;
    if (boarGrp && boarGrp.length >= 0) {
      text(`Boars in level: ${boarGrp.length}`, 12, y);
      y += 10;

      let boarColliding = false;
      if (boarGrp.length > 0) {
        boarColliding = p.sprite.overlapping(boarGrp);
      }
      text(`  Colliding with player: ${boarColliding ? "YES" : "NO"}`, 12, y);
      y += 10;
    }

    // Visualize collision boxes toggle state
    fill(100, 200, 100);
    text(`Collision shapes: ${this.showCollisions ? "ON" : "OFF"} (press C)`, 12, y);
  }

  _drawEventsPage() {
    push();
    noStroke();
    fill(0, 200);
    rect(6, 6, 400, 220, 6);
    pop();

    fill(255);
    textSize(10);
    let y = 18;

    fill(255, 100, 100);
    text("[Page 2/3] EVENTS | Tab/Q/E to navigate", 12, y);
    y += 12;

    fill(255);
    text(`Total events fired: ${this.eventCount}`, 12, y);
    y += 10;
    text(`Unique event types: ${Object.keys(this.eventLog).length}`, 12, y);
    y += 12;

    // Show top events
    const sorted = Object.entries(this.eventLog)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    for (const [name, count] of sorted) {
      const barLen = Math.min(count, 30);
      text(`${name.padEnd(25)} ${count.toString().padStart(3)} [${"=".repeat(barLen)}]`, 12, y);
      y += 9;
    }
  }

  _drawTuningPage() {
    push();
    noStroke();
    fill(0, 200);
    rect(6, 6, 450, 240, 6);
    pop();

    fill(255);
    textSize(10);
    let y = 18;

    fill(100, 255, 100);
    text("[Page 3/3] TUNING | ↑↓ UP/DOWN arrows, +/- to change | Tab/Q/E to navigate", 12, y);
    y += 12;

    if (this.tuningParams.length === 0) {
      fill(200, 100, 100);
      text("No tuning params available yet.", 12, y);
      return;
    }

    fill(255);
    text(`Parameters: ${this.tuningIndex + 1}/${this.tuningParams.length}`, 12, y);
    y += 12;

    // Show all params with highlight on selected
    for (let i = 0; i < this.tuningParams.length; i++) {
      const p = this.tuningParams[i];
      if (i === this.tuningIndex) {
        push();
        fill(255, 255, 100);
        rect(10, y - 9, 280, 10);
        pop();
      }

      fill(i === this.tuningIndex ? 0 : 255);
      text(`${(i + 1).toString().padStart(2)}. ${p.name.padEnd(18)}: ${p.value.toFixed(2)}`, 12, y);
      y += 10;
    }

    // Instructions
    y += 5;
    fill(150, 200, 150);
    text("Use UP/DOWN to select, then + - keys to adjust", 12, y);
  }

  _drawCollisionShapes(lvl) {
    if (!lvl) return;

    push();
    strokeWeight(1);

    // Draw player sprite bounds
    if (lvl.playerCtrl?.player?.sprite) {
      const p = lvl.playerCtrl.player.sprite;
      stroke(0, 255, 0);
      noFill();
      rect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
    }

    // Draw player sensor bounds
    if (lvl.playerCtrl?.player?.sensor) {
      const s = lvl.playerCtrl.player.sensor;
      stroke(0, 255, 255);
      noFill();
      rect(s.x - s.w / 2, s.y - s.h / 2, s.w, s.h);
    }

    // Draw ground tiles
    if (lvl.ground && lvl.ground.length > 0) {
      stroke(100, 100, 255);
      noFill();
      for (const tile of lvl.ground) {
        rect(tile.x - tile.w / 2, tile.y - tile.h / 2, tile.w, tile.h);
      }
    }

    // Draw boars
    if (lvl.boar && lvl.boar.length > 0) {
      stroke(255, 100, 100);
      noFill();
      for (const boar of lvl.boar) {
        rect(boar.x - boar.w / 2, boar.y - boar.h / 2, boar.w, boar.h);
      }
    }

    pop();
  }
}