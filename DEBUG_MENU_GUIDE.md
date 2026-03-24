# Debug Menu Guide

A comprehensive debugging tool to inspect game state, verify collisions, and tune values in real-time without restarting the game.

## Quick Start

**Press `T` to toggle the debug menu on/off**

Once enabled, use these shortcuts:
- **Tab, Q, or E**: Navigate between pages
- **↑↓ Arrow keys**: Select tuning parameters (on tuning page)
- **+ or - keys**: Adjust selected parameter
- **C**: Toggle collision box visualization

## Pages Overview

### Page 0: STATS
Real-time game state inspection including:
- **Position**: Player sprite coordinates (x, y)
- **Velocity**: Current movement speed in both axes (vx, vy)
- **Health**: Current health / maximum health
- **State Flags**: Dead status, attacking status, invulnerability status
- **Timers**: Invulnerability frames remaining, knockback frames remaining
- **Animation**: Current animation name and frame number
- **World State**: Score, win status, elapsed time
- **Ground Status**: Whether player is grounded
- **Recent Events**: Last 4 events fired (jump, attack, collect, damage, etc.)

### Page 1: COLLISIONS
Collision debugging and physics information:
- **Sprite Bounds**: Main player collision box position and size
- **Sensor Bounds**: Ground detection sensor position and size
- **Ground Collision**: Yes/No indicator for ground contact
- **Platform Collision**: Separate checks for left and right platforms
- **Wall Collision**: Contact with level walls
- **Attack Range**: When attacking, shows active attack window
- **Boar State**: Number of boars in level and collision status
- **Collision Visualization**: Toggle for showing all collision boxes (press C)

### Page 2: EVENTS
Event frequency and system activity tracking:
- **Total Events Fired**: Cumulative count since level start
- **Unique Event Types**: How many different event types have fired
- **Event Histogram**: Top events with frequency counts and visual bars

Useful for:
- Verifying events are firing correctly
- Detecting event spam or loops
- Confirming state transitions are being triggered

### Page 3: TUNING
On-the-fly parameter adjustment for quick iteration:

#### Player Tuning Parameters
- **Move Speed**: How fast the player moves left/right
- **Jump Strength**: Initial vertical velocity when jumping
- **Invuln Frames**: Duration of invulnerability after taking damage (frames)
- **Knock Frames**: Duration of knockback after damage (frames)
- **Knockback X**: Horizontal knockback magnitude
- **Knockback Y**: Vertical knockback magnitude
- **Attack Start Frame**: First frame of attack hitbox window
- **Attack End Frame**: Last frame of attack hitbox window

#### World Tuning Parameters
- **Gravity**: World gravity strength
- **Win Score**: Target score to complete level

**How to use:**
1. Navigate to Page 3 (Tuning)
2. Use ↑↓ arrow keys to select parameter (highlighted in yellow)
3. Use +/- keys to adjust the value
4. Changes apply immediately - perfect for finding the "feel"
5. No restart needed!

## Collision Visualization (All Pages)

Press **C** to toggle collision box rendering:
- **Green boxes**: Player main collider
- **Cyan boxes**: Ground sensor
- **Blue boxes**: Ground tiles
- **Red boxes**: Boar colliders

This helps verify:
- If hitboxes are the right size
- If level geometry is placed correctly
- If overlaps are happening as expected
- Boar positioning and spacing

## Common Workflows

### "My player can't jump high enough"
1. Press T to open debug menu
2. Go to Page 0 (Stats) to verify velocity when jumping
3. Navigate to Page 3 (Tuning)
4. Find "Jump Strength" and press + several times
5. Jump and watch Page 0 velocity change in real-time
6. Once it feels right, note the value and update `data/tuning.json`

### "Player collision feels wrong"
1. Press C to see collision boxes
2. Go to Page 1 (Collisions) to verify sensor positioning
3. Check if ground sensor is actually touching ground
4. Adjust KNOCK_FRAMES if knockback feels too long/short
5. Use collision visualization to debug clipping issues

### "One enemy feels slower to hit"
1. Press T and go to Page 1
2. Check "Boars in level" count
3. Look at attack window: Attack Start Frame / Attack End Frame
4. Go to Page 3 and adjust these values
5. Verify in Page 1 that hitbox timing is right

### "The game feels too easy"
1. Page 3: Increase "Win Score" to require more apples
2. Decrease "Jump Strength" or "Move Speed" for harder controls
3. Increase "Knock Frames" so damage is more punishing

## Tips & Tricks

1. **Quick parameter comparison**: Use + and - keys rapidly to feel the difference in real-time
2. **Finding the sweet spot**: Start with big changes (e.g., +/-1.0), then fine-tune with smaller steps
3. **Event debugging**: Watch Page 2 to spot if certain events aren't firing
4. **Grounded detection**: Page 1 shows exact ground contact status - helps diagnose jump issues
5. **Recording values**: When you find good tuning values, screenshot page 3 before updating `tuning.json`

## Technical Details

- Debug info is rendered in screen-space (always on top)
- Collision visualization doesn't affect game physics
- Tuning changes apply to the running instance only
- To save tuning parameters permanently, update `data/tuning.json`
- Event log is cumulative per level instance
- All debug features have zero performance impact when disabled

## Input Reference

| Key | Action |
|-----|--------|
| T | Toggle debug menu on/off |
| Tab / E / Q | Navigate pages (next/next/prev) |
| ↑ ↓ | Select tuning parameter |
| + - | Adjust selected parameter |
| C | Toggle collision box display |

## See Also

- `src/DebugOverlay.js` - Debug rendering and state inspection
- `src/InputManager.js` - Input handling (debug shortcuts defined here)
- `data/tuning.json` - Default tuning values for the level
- `src/Game.js` - Where debug is wired into the game loop
