# CARNAGE: DEATH METAL (web)

Gesture-controlled melee in the browser. Hold up fingers to pick a chord, swipe to swing the
glaive — or play the whole thing on the keyboard.
You play an ink silhouette fighter carrying a crescent glaive: every chord swings it,
and the blade carries the hit. A dusk woodland arena: fir ridges, hanging canopy,
fireflies and drifting leaves, four dodgeable attack patterns, shield phases,
power-up charms and endless waves.

## Run
Serve the folder (the camera needs HTTPS or localhost), then open it in desktop Chrome or Edge:

    python -m http.server 8000      # then visit http://localhost:8000

Or push the folder to GitHub Pages. Press SPACE or click to start.

## Phones and tablets

The same page plays on a phone: there is no separate build and no second URL.

- On a touch screen the first tap opens a **PLAY** gate that requests fullscreen and asks the
  OS to lock the screen to landscape. If the phone is still upright a **ROTATE YOUR PHONE**
  prompt covers the game until it is turned; rotating back hides it again.
- **No camera on phones.** Webcam hand tracking and the MediaPipe download are desktop only,
  so a phone never asks for camera permission. Desktops keep the full gesture controls.
- On-screen controls appear when a fight starts (the menu cards stay clear):
  - **Joystick** bottom left: drag left / right to walk, the ring is the thumb pad.
  - **DASH** round button: the same burst dash as `SHIFT`.
  - **▼ ATTACK / ▲ STRUM**: hold to keep strumming at the song tempo.
  - **E A D G C** note row: picks the chord, exactly like the `1`-`5` keys.
  - **SUPER**: lights up and pulses when the meter is full; tap it to fire the cutscene.
- Touch the screen on the win / lose cards to go into endless mode or start again.

## Files
    index.html       page shell, loads everything below in order
    css/style.css    page layout and the woodland page frame
    js/config.js     every tunable number, and the palette
    js/enemies.js    the enemy roster + endless wave generator  <- add your own enemies here
    js/game.js       combat, projectiles, shields, power-ups, levels
    js/gestures.js   finger states -> chord, wrist speed -> strum (scale independent)
    js/input.js      webcam (MediaPipe) and keyboard sources, movement and dash
    js/audio.js      synthesised guitar, sound effects, drums, mute
    js/voice.js      Jarvis voice commands
    js/fx.js         leaves, pollen, dust, wind arcs, ripples, hit-stop, beat pulse
    js/render.js     the woodland backdrop, the ink fighter and glaive, enemies, HUD, hologram
    js/main.js       keys and the main loop
    assets/          goblin, skull, demon, drummer, carnage (.webp) and arena.jpg
    tests/smoke.js   node tests/smoke.js

## Controls

Short version: **move with A/D or your left hand, pick a chord with 1-5 or your fingers,
swing with the strum keys or a hand swipe, and press Q (or clench both fists) when the
super meter is full.** Everything below is the same thing in more detail.

### Movement

| What you want | Keyboard | Camera |
| --- | --- | --- |
| Walk left / right | `A` / `D` or `LEFT` / `RIGHT` | slide your **left hand** left or right |
| Dash (short burst, 0.75 s cooldown, brief invulnerability) | tap `SHIFT` (dashes the way you are walking, or the way you face) | `SHIFT` (same dash, in the direction the hand is steering) |

- The fighter only walks left and right along one ground line — there is no jump and no
  vertical movement.
- Your hand position steers with a small dead zone, so a hand resting in the middle of the
  frame does not drag him around.
- Walking is how you get close enough to hit anything: see **Melee reach** below.

### Attacking

| What you want | Keyboard | Camera |
| --- | --- | --- |
| Pick a chord (E A D G C) | `1` `2` `3` `4` `5` | hold up 1-5 fingers on your left hand |
| Strum = swing the glaive | `DOWN` or `J` or `S` (down), `UP` or `K` or `W` (up) | swipe either hand up or down |
| Keep strumming | hold the strum key | keep swiping |
| Super attack (when the meter is full) | `Q` | clench both fists for half a second |

- Every strum swings the crescent glaive. The swing that connects is the one that does damage.
- You do **not** have to match the enemy's weak chord to land a hit — the weak chord just does
  double damage (and 3x against shields).
- You can change chord between swings. On camera a closed hand keeps the chord you already
  had, so you never end up unable to attack.
- Swinging from too far away is a whiff: you still see and hear the swing, but no damage is
  done and a quiet "OUT OF REACH" appears over the fighter.

### Camera controls, in plain words

- **Chord = how many fingers you hold up on your left hand.** 1 = E, 2 = A, 3 = D, 4 = G, 5 = C.
  The count is measured against the size of your hand, so it works standing close to or far
  from the camera, and it has to stay the same for two frames so one shaky finger does not
  change your chord. A closed hand keeps the chord you already had.
- **Attack = swipe a hand up or down.** The right hand is used if the camera sees it,
  otherwise your left hand's swipe counts, so **one hand is enough to play**.
- **Move = move your left hand left or right.** The same hand that picks the chord steers.
- **Super = clench both fists** for half a second, once the meter is full.
- Swipe speed is measured in hand-heights per second and the trigger calibrates to your own
  swing, so a fast flick and a slow heavy swing both work.
- The small preview in the corner shows the finger count and the chord the camera is reading.
- **Starting a run on desktop opens a camera check page first**, camera or keyboard alike:
  the preview, the finger count and chord it reads, the whole control sheet, the input
  status and a countdown. Swipe (or press `SPACE`) to begin at once, or let the countdown
  finish. With no camera it says `NO CAMERA`, offers `F2` to retry, and `SPACE` starts
  keyboard play. `R` restarts skip the page.
- `SHIFT` still dashes while you are in camera mode, and `F2` switches between keyboard and
  camera at any time.

### Menus and settings

| Key | What it does |
| --- | --- |
| `SPACE` | start a run (on the camera this skips the check and begins at once), or begin endless mode after the win |
| `R` | restart the campaign from level 1 |
| `ESC` | back to the menu |
| `P` | pause / unpause |
| `M` | mute / unmute |
| `V` | toggle the Jarvis voice |
| `H` | hologram view (the scene drawn four ways) |
| `F1` | debug readout: hands seen, finger count, swing speed, strum threshold |
| `F2` | switch keyboard <-> camera input |
| `X` | swap which hand counts as your left hand |
| `[` / `]` | lower / raise the strum sensitivity |

## Melee reach
- The glaive is melee: a chord only damages the enemy when the two of you are within
  `C.REACH` of each other. Anything else is a whiff - the swing, the sound, no damage,
  and a quiet "OUT OF REACH" over the player.
- So you get hits in two ways: walk the guitarist into the enemy's patch of ground, or
  catch it when it lunges in. The enemy stalks its own stretch of the arena and every few
  seconds closes to just inside glaive range, then backs off again.
- The super is the exception: the cutscene hits wherever the enemy stands.

## Super attack
- Landing hits fills the SUPER meter in the bottom left. A weak chord fills it faster.
- When it is full the game says so: the meter pulses, a "SUPER READY" card appears and a
  sting plays.
- Fire it with **Q**, or on the camera by clenching **both fists** for half a second.
- The fight freezes for a cutscene — ink spokes, the title slam, three glaive cuts — then
  the enemy takes **500** damage and loses its shield. It is the biggest hit in the game.

## Gameplay
- The fighter is drawn as a bold ink silhouette with a crescent glaive. Each chord sets off
  a full blade swing (ghosted afterimages included); the blade is what lands the damage.
- Five levels. Clear one enemy and the next level begins; beating CARNAGE opens ENDLESS mode.
- Enemies attack in patterns: aimed embers, thorn walls with one gap, telegraphed
  sunbeams and ground slams. Move out of the way; a dodge scores points.
- Enemies periodically raise a shield phase. Damage goes to the shield instead of the enemy,
  and your weak chord does 3x to shields. Break one and the enemy is stunned.
- Power-up charms fall from above: HEAL, OVERDRIVE (2x), FURY (+40%), GUARD (absorbs hits) and SLOW-MO.
- Each enemy has a weak chord (shown top right): 2x damage.
- Chain hits for a streak bonus (+5% each, up to +50%). Getting hit resets it.
- Land a hit on the 110 BPM beat for an ON BEAT bonus.
- Clearing a level gives points and heals you. Best score is saved in your browser.
- Each enemy tints the arena light with its own colour, and the scene pulses with the drums.

## Add an enemy
Append an object to `ENEMIES` in `js/enemies.js`:

    {name:'FEEDBACK FIEND',hp:450,every:1.6,dmg:11,weak:'D',color:'#8a5a2e',eyes:2,horns:true,fangs:true,
     moves:['notes','beam','slam'],shield:{every:8,dur:4,hp:120}}

`moves` is the attack rotation: `notes`, `wall`, `beam`, `spread`, `slam`.
For your own art, drop `myenemy.webp` (transparent background) into `assets/` and add
`img:'myenemy',h:450,aura:'#7fa653'` to the enemy. Leave `img` out to get the drawn body instead.

---

Developed by **[Atishay](https://github.com/Atixshay)** — [github.com/Atixshay](https://github.com/Atixshay)
