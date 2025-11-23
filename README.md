# Wall Harp Simulator - Professional Tuning System

A browser-based physics simulator and tuning calculator for a 144-string wall harp with dual-capo tuning system.

## Features

### Core Functionality
- **Physics-Accurate String Calculations**: Uses wave equation `f = v / (2L)` with wave speed = 229.6 m/s
- **Dual-Capo System**: Adjustable upper and lower capos for precise pitch control
- **Real-Time Audio**: Pluck strings to hear actual pitch with realistic harp sound (reverb, chorus, delay)
- **Interactive Visualization**: Click, drag, and zoom to explore the instrument

### Tuning Tools
- **12+ Scale Presets**: Chromatic, Major, Minor, Pentatonic, Blues, Dorian, Lydian, etc.
- **Scala File Import** (.scl): Load custom temperaments and microtonal scales
- **Direct Note Input**: Type note names (C4, F#5) or frequencies (440 Hz)
- **Semitone Adjustment**: Quick +1/-1 semitone buttons
- **Waveform Patterns**: Apply sine/sawtooth/triangle/square/random patterns to capos

### Display & Export
- **String Data Panel**: Frequency, MIDI note, cents deviation, capo positions
- **String Spacing Labels**: Physical distances between strings (in feet)
- **CSV Export**: Full measurements for all strings
- **JSON Export/Import**: Save and load complete configurations
- **Light/Dark Themes**: Professional monochrome palettes

## Quick Start

1. **Initialize Audio**
   - Click "Initialize Audio System" button
   - Wait for confirmation message

2. **Select Strings**
   - Click any string to select it
   - String data appears in right panel

3. **Tune**
   - **Pluck Mode**: Click to hear sound
   - **Adjust Mode**: Drag blue capos to change pitch
   - Hear pitch change in real-time while dragging

4. **Apply Scales**
   - Click preset buttons (Major, Minor, etc.)
   - Or import Scala files for custom temperaments

## Scala File Format

The simulator supports standard Scala (.scl) files:

```
! filename.scl
!
Description of scale
 N
!
interval1
interval2
...
intervalN
```

**Supported formats:**
- Cents: `100.0`, `203.91`
- Ratios: `9/8`, `5/4`, `3/2`
- Integer cents: `100`, `200`

### Example Scala Files Included

1. **test-just-intonation.scl**: 5-limit Just Intonation major scale
2. **pythagorean.scl**: Pythagorean tuning with pure fifths
3. **quarter-comma-meantone.scl**: 1/4-comma meantone temperament
4. **bohlen-pierce.scl**: 13-tone equal division of 3/1

## Keyboard Shortcuts

- **1**: Pluck mode
- **2**: Adjust mode
- **3**: Pattern mode
- **Arrow Left/Right**: Select adjacent strings
- **Space**: Pluck selected string
- **T**: Test audio system

*Note: Shortcuts disabled when typing in text fields*

## Controls Reference

### Left Panel

**System Controls**
- String Count Slider: 12-144 strings
- Zoom In/Out/Reset View
- Interaction Modes: Pluck, Adjust, Pattern

**Tuning Presets**
- 12 built-in scales
- Scala file import button

**Sound Settings**
- Reverb Decay: 0.5s - 8s
- Reverb Amount: 0% - 100%
- Attack: 0.5 - 3.0
- Resonance: 0.90 - 0.99

**Export Data**
- Export to CSV (measurements)
- Export Config (JSON)
- Import Config

### Right Panel

**String Data**
- String number
- Note name
- Frequency (Hz)
- MIDI note
- Tuning status (cents deviation)
- Capo positions (mm and feet)

**Direct Tuning**
- Note/Frequency input field
- +1/-1 Semitone buttons

**Waveform Patterns**
- Pattern type dropdown
- Amplitude slider
- Apply button

**Appearance**
- Dark/Light theme toggle

## Technical Details

### Physical Specifications
- **Total String Length**: 2134 mm (7.0 ft)
- **Wall Width**: 7830 mm (25.7 ft)
- **Wave Speed**: 229.6 m/s
- **String Range**: MIDI 36-107 (C2 to B7, 6 octaves)
- **Min Playable Length**: 50 mm
- **Max Playable Length**: 2000 mm

### Audio Engine
- **Synthesis**: Tone.js PluckSynth (Karplus-Strong algorithm)
- **Effects Chain**: Chorus → Delay → Reverb → Master
- **Auto-Pluck**: 100ms interval while dragging capos

### Tuning Reference
- **Standard Pitch**: A4 = 440 Hz
- **Temperament**: 12-TET (12-tone equal temperament) by default
- **Cents Deviation**: Measured from nearest 12-TET semitone
  - <5 cents: IN TUNE
  - 5-10 cents: SLIGHTLY OFF
  - >10 cents: OUT OF TUNE

## Usage Examples

### Example 1: Tune to Just Intonation
1. Click "Initialize Audio System"
2. Click "Import Scala Scale"
3. Select `test-just-intonation.scl`
4. Listen to pure intervals!

### Example 2: Create Custom Pattern
1. Set string count to 36
2. Select "Waveform Patterns"
3. Choose "Sine Wave"
4. Set amplitude to 600mm
5. Click "Apply Pattern"
6. Switch to Adjust mode and drag capos to hear the pattern

### Example 3: Fine-Tune Individual String
1. Click string #10 to select
2. Type "A4" in note input
3. Click "Apply to Selected String"
4. Verify frequency shows 440.00 Hz
5. Click "+1 Semitone" to shift to A#4

## Browser Compatibility

Tested on:
- Chrome 120+ ✓
- Firefox 121+ ✓
- Safari 17+ ✓
- Edge 120+ ✓

**Requirements:**
- Modern browser with Web Audio API support
- JavaScript enabled
- Minimum 1280x800 resolution recommended

## Development

### Running Locally
```bash
cd "wall harp"
python3 -m http.server 8000
open http://localhost:8000/index.html
```

### File Structure
```
wall harp/
├── index.html          # Main HTML structure
├── styles.css          # Professional monochrome styling
├── constants.js        # Physics, visual, audio constants
├── physics.js          # Wave equation calculations
├── string.js           # HarpString class, Scala parser
├── audio.js            # Tone.js audio engine
├── visualization.js    # p5.js rendering
├── interaction.js      # Mouse/keyboard handling
├── ui.js               # Event handlers, notifications
├── utils.js            # Export/import, helpers
├── main.js             # WallHarpSimulator main class
└── *.scl               # Scala scale files
```

## Physics Formulas

### Frequency from Length
```
f = v / (2L)
```
- `f`: frequency (Hz)
- `v`: wave speed (229.6 m/s)
- `L`: string length (meters)

### Length from Frequency
```
L = v / (2f)
```

### MIDI to Frequency
```
f = 440 × 2^((m - 69) / 12)
```
- `m`: MIDI note number (69 = A4)

### Cents Deviation
```
cents = 1200 × log₂(f_actual / f_target)
```

## Known Issues

- Maximum 144 strings recommended for performance
- Very high notes (>2000 Hz) may have slight tuning drift
- Mobile touch support is limited (use desktop)

## Credits

**Created with:**
- [p5.js](https://p5js.org/) - Creative coding visualization
- [Tone.js](https://tonejs.github.io/) - Web Audio framework
- Claude AI - Development assistance

**Scala Format:**
- Manuel Op de Coul - Scala scale archive

## License

Educational/Research use. See LICENSE file.

---

**Version**: 1.0
**Last Updated**: 2025-01-22
**Status**: Production Ready ✓
