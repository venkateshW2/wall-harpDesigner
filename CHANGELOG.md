# Wall Harp Simulator - Version 2.0 Changelog

## Major Redesign - January 2025

### 🎨 **FULL-SCREEN CANVAS**
- **White background** for maximum clarity and contrast
- **Responsive canvas** that fills the entire viewport
- **Auto-resizes** with window changes
- Removed problematic zoom-scroll conflicts
- Normal page scrolling works properly
- Ctrl/Cmd + Scroll for optional zoom

### 🎻 **MATERIAL PHYSICS SYSTEM**
Added 5 realistic string materials with proper physics:
- **STEEL** (7850 kg/m³) - Bright, high tension (80-150N)
- **NYLON** (1140 kg/m³) - Warm, low tension (40-80N)
- **GUT** (1300 kg/m³) - Rich, medium tension (50-90N)
- **BRONZE** (8800 kg/m³) - Crisp, bright tone (70-130N)
- **PHOSPHOR BRONZE** (8900 kg/m³) - Warm, sustained (75-135N)

### 📏 **STRING GAUGE SYSTEM**
5 diameter options affecting pitch and playability:
- Extra Light (0.25mm)
- Light (0.35mm)
- **Medium (0.50mm)** [Default]
- Heavy (0.70mm)
- Extra Heavy (0.90mm)

### 🎵 **AUDIO ENGINES**
6 synthesis options:
- **Karplus-Strong** (Plucked string physical model) [Default]
- Piano (Rich harmonic tone)
- Sine Wave (Pure tone)
- Sawtooth (Bright)
- Square Wave (Hollow)
- Triangle (Soft)

### 🎛️ **IMPROVED UI**
- **Collapsible sidebar sections** with [ + ] / [ - ] indicators
- Click any section title to expand/collapse
- Cleaner layout with better organization
- Improved readability with larger fonts
- Better contrast and visual hierarchy

### ⚙️ **TENSION CONTROL**
- Adjustable string tension (40-150 Newtons)
- Real-time physics recalculation
- Affects wave speed: v = √(T/μ)
- Material-specific tension ranges

### 📐 **PROPER PHYSICS**
Wave speed calculation:
```
v = √(T / μ)
where μ = π × r² × ρ

f = v / (2L)
```
- **T** = Tension (Newtons)
- **r** = String radius (meters)
- **ρ** = Material density (kg/m³)
- **L** = Vibrating length (meters)

### 🔄 **OCTAVE LOOPING**
- Scales automatically repeat across octaves
- Example: Major scale (7 notes) on 36 strings = 5+ octaves
- Clear indication in UI: "CHROMATIC (12 notes/octave)"
- Works with all presets and Scala files

### 📊 **CANVAS OVERLAY**
Real-time info display at bottom:
- `STEEL 0.50mm @ 120N` - Current material settings
- `MODE: PLUCK` - Interaction mode
- `SELECT A STRING` - Current selection

### 📖 **DOCUMENTATION**
- Created **STRING_MATERIALS.md** with detailed physics info
- Formulas, examples, and recommendations
- Material property tables
- Usage guidelines by music style

### 🎹 **EXISTING FEATURES PRESERVED**
- ✅ 12+ scale presets (Chromatic, Major, Minor, Pentatonic, etc.)
- ✅ Scala file import (.scl)
- ✅ Direct note/frequency tuning
- ✅ Waveform pattern generator
- ✅ CSV/JSON export
- ✅ Dark/Light themes
- ✅ Real-time audio synthesis
- ✅ Interactive capo adjustment
- ✅ Keyboard shortcuts

---

## Technical Details

### Files Modified
1. **constants.js** - Added STRING_MATERIALS, STRING_GAUGES, AUDIO_ENGINES
2. **string.js** - Updated HarpString class with material properties
3. **main.js** - Added material methods, responsive canvas
4. **ui.js** - Added collapsible sections, material controls
5. **index.html** - Complete restructure with new controls
6. **styles.css** - Full-screen layout, collapsible sections
7. **STRING_MATERIALS.md** - NEW comprehensive documentation

### Physics Improvements
- Material-specific wave speed calculation
- Proper tension/density/diameter relationships
- Realistic frequency calculations
- String color based on material

### Performance
- Canvas now truly full-screen
- Efficient rendering
- Smooth scrolling
- No zoom conflicts

---

## How to Use New Features

### Change String Material
1. Open **STRING PROPERTIES** section
2. Select material from dropdown
3. Select gauge (diameter)
4. Adjust tension slider
5. Click **APPLY TO ALL STRINGS**

### Change Audio Engine
1. Open **AUDIO** section
2. Select engine from dropdown
3. Reinitialize audio if needed

### Collapse Sections
- Click any section title (e.g., **SOUND SETTINGS**)
- Click again to expand
- Saves sidebar space

### View Material Info
- See **STRING_MATERIALS.MD** for detailed physics
- Check canvas overlay for current settings
- Tooltips show descriptions

---

## Known Behaviors

1. **Canvas is always white** - Intentional for maximum contrast
2. **Sidebar theme independent** - Dark/Light only affects sidebar
3. **Material change recalculates** - All strings update together
4. **Octave looping automatic** - No manual configuration needed

---

## Version History

### v2.0 (January 2025)
- Complete UI redesign
- Material physics system
- Full-screen canvas
- Collapsible sections
- Multiple audio engines

### v1.0 (January 2025)
- Initial release
- Basic physics
- Single material
- Fixed canvas size

---

**Developed with:** p5.js, Tone.js, Physics Modeling, JavaScript
**License:** Educational/Research Use
