# WALL HARP SIMULATOR - COMPLETE DEVELOPMENT SPECIFICATION
## Detailed Task List for Claude Code Implementation

---

## PROJECT OVERVIEW

Build an interactive browser-based Wall Harp Simulator that accurately models the physics of a 144-string instrument with double-capo tuning system. Users should be able to:
1. Pluck strings and hear realistic sound
2. Drag capos to change string length and pitch in real-time
3. See accurate frequency, note name, and MIDI calculations
4. Export/import tuning configurations
5. Design melodic patterns

---

## CRITICAL ISSUES TO FIX

### Issue 1: Incorrect Frequency Calculations
**Problem:** String showing E8 when it should show much lower note based on length
**Root Cause:** Not properly calculating frequency from actual string length
**Solution Required:** Implement proper string physics formula

### Issue 2: Audio Not Working
**Problem:** PluckSynth not producing sound
**Root Cause:** Tone.js initialization issues, improper synth triggering
**Solution Required:** Proper async initialization and synth management

### Issue 3: Capo Physics Wrong
**Problem:** Capo position doesn't correctly affect pitch
**Root Cause:** Formula relating length to frequency is incorrect
**Solution Required:** Use proper wave equation: f = (1/2L) × √(T/μ)

---

## TASK 1: IMPLEMENT ACCURATE STRING PHYSICS

### 1.1 Define Physical Constants

```javascript
// All measurements in mm unless specified
const PHYSICS_CONSTANTS = {
    // String dimensions
    FULL_STRING_LENGTH: 2134,      // 7 feet in mm
    WALL_WIDTH: 7830,               // 25 feet in mm
    
    // Material properties (for reference - we'll use simplified model)
    MATERIALS: {
        BRONZE_WOUND: {
            diameter: 2.0,           // mm
            density: 8000,           // kg/m³
            tensionRange: [180, 220] // Newtons
        },
        STEEL: {
            diameter: 1.0,           // mm
            density: 7850,           // kg/m³
            tensionRange: [120, 160] // Newtons
        },
        FLUOROCARBON: {
            diameter: 0.8,           // mm
            density: 1780,           // kg/m³
            tensionRange: [60, 90]   // Newtons
        }
    },
    
    // For simplified calculation, we'll use reference values
    // Bass string reference: C2 (65.41 Hz) at 1755mm length
    REFERENCE_FREQ: 65.41,           // Hz (C2)
    REFERENCE_LENGTH: 1755,          // mm
    
    // Speed factor relates length to frequency
    // Derived from: f = v / (2L) where v is wave speed
    // For our purposes: v = reference_freq × 2 × reference_length
    WAVE_SPEED: 65.41 * 2 * 1.755    // m/s (calculated: ~229.6 m/s)
};
```

### 1.2 Frequency Calculation Function

**CRITICAL: This is the correct formula**

```javascript
/**
 * Calculate frequency from string length using wave equation
 * 
 * Formula: f = v / (2L)
 * where:
 *   f = frequency (Hz)
 *   v = wave speed in string (constant for given tension/density)
 *   L = vibrating length (meters)
 * 
 * For string instruments: v = √(T/μ)
 * But we simplify using reference calibration:
 * If we know one string's freq and length, we can calculate others
 * 
 * @param {number} lengthMm - Playable string length in millimeters
 * @returns {number} - Frequency in Hertz
 */
function calculateFrequencyFromLength(lengthMm) {
    // Convert mm to meters
    const lengthM = lengthMm / 1000;
    
    // Use wave equation: f = v / (2L)
    const frequency = PHYSICS_CONSTANTS.WAVE_SPEED / (2 * lengthM);
    
    return frequency;
}

/**
 * Alternative: Calculate using ratio to reference
 * This is more intuitive and ensures consistency
 * 
 * If reference string at length L1 produces frequency f1,
 * then string at length L2 produces frequency f2 where:
 * f2 / f1 = L1 / L2  (inverse relationship)
 * 
 * @param {number} lengthMm - Playable string length in millimeters
 * @returns {number} - Frequency in Hertz
 */
function calculateFrequencyFromLengthRatio(lengthMm) {
    const ratio = PHYSICS_CONSTANTS.REFERENCE_LENGTH / lengthMm;
    const frequency = PHYSICS_CONSTANTS.REFERENCE_FREQ * ratio;
    return frequency;
}

// TESTING THESE FUNCTIONS:
// Bass string (C2): 1755mm should give ~65.41 Hz ✓
// Half that length: 877.5mm should give ~130.82 Hz (C3, one octave up) ✓
// Treble string: 600mm should give ~191.4 Hz (roughly F#3) ✓
```

### 1.3 MIDI Note Conversion Functions

```javascript
/**
 * Convert frequency to MIDI note number (can be fractional)
 * 
 * @param {number} frequency - Frequency in Hz
 * @returns {number} - MIDI note number (can have decimals)
 */
function frequencyToMidi(frequency) {
    // Formula: MIDI = 69 + 12 × log2(f/440)
    return 69 + 12 * Math.log2(frequency / 440);
}

/**
 * Convert MIDI note to frequency
 * 
 * @param {number} midiNote - MIDI note number
 * @returns {number} - Frequency in Hz
 */
function midiToFrequency(midiNote) {
    // Formula: f = 440 × 2^((midi - 69)/12)
    return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Convert MIDI note to note name with octave
 * 
 * @param {number} midiNote - MIDI note number (will be rounded)
 * @returns {string} - Note name like "C4", "F#5", etc.
 */
function midiToNoteName(midiNote) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rounded = Math.round(midiNote);
    const octave = Math.floor(rounded / 12) - 1;
    const noteName = noteNames[rounded % 12];
    return `${noteName}${octave}`;
}

/**
 * Get cents deviation from nearest semitone
 * (useful for showing if string is slightly out of tune)
 * 
 * @param {number} midiNote - MIDI note (fractional)
 * @returns {number} - Cents deviation (-50 to +50)
 */
function getCentsDeviation(midiNote) {
    const rounded = Math.round(midiNote);
    const cents = (midiNote - rounded) * 100;
    return cents;
}
```

---

## TASK 2: FIX STRING CLASS WITH CORRECT PHYSICS

### 2.1 Revised String Class Structure

```javascript
class HarpString {
    constructor(index, totalStrings, targetMidiNote) {
        this.index = index;
        this.totalStrings = totalStrings;
        
        // Target MIDI note for this string (starting tuning)
        // For chromatic: C2=36, C#2=37, D2=38, ... B7=95
        this.targetMidiNote = targetMidiNote;
        
        // Calculate ideal playable length for target note
        this.targetFrequency = midiToFrequency(targetMidiNote);
        this.targetLengthMm = this.calculateIdealLength(this.targetFrequency);
        
        // Initialize capo positions to achieve target length
        this.initializeCapoPositions();
        
        // Visual properties
        this.xPos = (index + 0.5) * (PHYSICS_CONSTANTS.WALL_WIDTH / totalStrings);
        this.isPlaying = false;
        this.playingAmplitude = 0;
        this.isSelected = false;
        this.isDraggingLowerCapo = false;
        this.isDraggingUpperCapo = false;
    }
    
    /**
     * Calculate ideal string length to produce target frequency
     * Using: L = v / (2f)
     */
    calculateIdealLength(frequency) {
        const lengthM = PHYSICS_CONSTANTS.WAVE_SPEED / (2 * frequency);
        return lengthM * 1000; // Convert to mm
    }
    
    /**
     * Initialize capo positions to center the playable zone
     * at a comfortable playing height
     */
    initializeCapoPositions() {
        // We want the playable zone centered in the 7-foot string
        // Playable zone should be in the middle ~3-5 feet of the string
        
        const playableLengthMm = this.targetLengthMm;
        
        // Clamp playable length to reasonable range (300mm to 1800mm)
        const clampedLength = Math.max(300, Math.min(1800, playableLengthMm));
        
        // Center this in the string height
        const centerOfString = PHYSICS_CONSTANTS.FULL_STRING_LENGTH / 2;
        
        this.lowerCapoMm = centerOfString - (clampedLength / 2);
        this.upperCapoMm = centerOfString + (clampedLength / 2);
        
        // Ensure capos are within valid range (50mm from ends minimum)
        this.lowerCapoMm = Math.max(50, this.lowerCapoMm);
        this.upperCapoMm = Math.min(PHYSICS_CONSTANTS.FULL_STRING_LENGTH - 50, this.upperCapoMm);
        
        // Recalculate actual values
        this.updateCalculations();
    }
    
    /**
     * CRITICAL FUNCTION: Update all calculations based on current capo positions
     * This is called whenever capos are moved
     */
    updateCalculations() {
        // Calculate playable length
        this.playableLengthMm = this.upperCapoMm - this.lowerCapoMm;
        
        // Calculate actual frequency from playable length
        // THIS IS THE KEY CALCULATION - MUST BE CORRECT
        this.actualFrequency = calculateFrequencyFromLengthRatio(this.playableLengthMm);
        
        // Convert frequency to MIDI note
        this.actualMidiNote = frequencyToMidi(this.actualFrequency);
        
        // Get note name (rounded to nearest semitone)
        this.noteName = midiToNoteName(this.actualMidiNote);
        
        // Get cents deviation (how far from perfect pitch)
        this.centsDeviation = getCentsDeviation(this.actualMidiNote);
        
        // Calculate physical string length in feet for display
        this.playableLengthFeet = this.playableLengthMm / 304.8;
        this.lowerCapoFeet = this.lowerCapoMm / 304.8;
        this.upperCapoFeet = this.upperCapoMm / 304.8;
    }
    
    /**
     * Move lower capo to specific position (in mm from soundbox)
     * Ensures capo stays within valid bounds
     */
    setLowerCapoPosition(positionMm) {
        // Ensure lower capo doesn't go below 50mm or above upper capo - 100mm
        this.lowerCapoMm = Math.max(50, Math.min(this.upperCapoMm - 100, positionMm));
        this.updateCalculations();
    }
    
    /**
     * Move upper capo to specific position (in mm from soundbox)
     * Ensures capo stays within valid bounds
     */
    setUpperCapoPosition(positionMm) {
        // Ensure upper capo doesn't go above max length or below lower capo + 100mm
        const maxPos = PHYSICS_CONSTANTS.FULL_STRING_LENGTH - 50;
        this.upperCapoMm = Math.min(maxPos, Math.max(this.lowerCapoMm + 100, positionMm));
        this.updateCalculations();
    }
    
    /**
     * Get string data for export/display
     */
    getStringData() {
        return {
            index: this.index,
            noteName: this.noteName,
            frequency: this.actualFrequency.toFixed(2),
            midiNote: this.actualMidiNote.toFixed(2),
            midiNoteRounded: Math.round(this.actualMidiNote),
            centsDeviation: this.centsDeviation.toFixed(1),
            playableLengthMm: this.playableLengthMm.toFixed(0),
            playableLengthFeet: this.playableLengthFeet.toFixed(2),
            lowerCapoMm: this.lowerCapoMm.toFixed(0),
            upperCapoMm: this.upperCapoMm.toFixed(0),
            lowerCapoFeet: this.lowerCapoFeet.toFixed(2),
            upperCapoFeet: this.upperCapoFeet.toFixed(2)
        };
    }
}
```

### 2.2 String Initialization for Different Configurations

```javascript
/**
 * Create array of strings with chromatic tuning (C2 to B7)
 * 
 * @param {number} numStrings - Total number of strings (12, 24, 72, 144, etc.)
 * @returns {Array<HarpString>} - Array of initialized string objects
 */
function createChromaticStrings(numStrings) {
    const strings = [];
    const startMidi = 36; // C2
    
    for (let i = 0; i < numStrings; i++) {
        // For chromatic: cycle through 12 semitones, incrementing octave
        const midiNote = startMidi + i;
        strings.push(new HarpString(i, numStrings, midiNote));
    }
    
    return strings;
}

/**
 * Create strings with pentatonic tuning
 * Uses only notes: C, D, F, G, A (and their octaves)
 */
function createPentatonicStrings(numStrings) {
    const strings = [];
    const pentatonicIntervals = [0, 2, 5, 7, 9]; // Relative to C
    const startMidi = 36; // C2
    
    for (let i = 0; i < numStrings; i++) {
        const octaveOffset = Math.floor(i / pentatonicIntervals.length) * 12;
        const intervalIndex = i % pentatonicIntervals.length;
        const midiNote = startMidi + pentatonicIntervals[intervalIndex] + octaveOffset;
        strings.push(new HarpString(i, numStrings, midiNote));
    }
    
    return strings;
}

/**
 * Create strings with custom MIDI note assignments
 */
function createCustomStrings(numStrings, midiNoteArray) {
    const strings = [];
    
    for (let i = 0; i < numStrings; i++) {
        const midiNote = midiNoteArray[i % midiNoteArray.length];
        const octaveOffset = Math.floor(i / midiNoteArray.length) * 12;
        strings.push(new HarpString(i, numStrings, midiNote + octaveOffset));
    }
    
    return strings;
}
```

---

## TASK 3: IMPLEMENT PROPER AUDIO ENGINE

### 3.1 Audio System Architecture

```javascript
/**
 * Audio Engine using Tone.js with proper Karplus-Strong synthesis
 */
class HarpAudioEngine {
    constructor() {
        this.initialized = false;
        this.synths = [];
        this.masterVolume = new Tone.Volume(-6).toDestination();
        this.reverb = new Tone.Reverb({
            decay: 3,
            wet: 0.3
        }).connect(this.masterVolume);
    }
    
    /**
     * Initialize audio context and create synths
     * MUST be called after user interaction (browser requirement)
     */
    async initialize(numStrings = 144) {
        if (this.initialized) {
            console.log("Audio already initialized");
            return;
        }
        
        try {
            // Start Tone.js audio context
            await Tone.start();
            console.log("Tone.js audio context started");
            
            // Create synth for each string
            this.synths = [];
            for (let i = 0; i < numStrings; i++) {
                const synth = this.createPluckSynth();
                this.synths.push(synth);
            }
            
            this.initialized = true;
            console.log(`Created ${numStrings} pluck synths`);
            
        } catch (error) {
            console.error("Failed to initialize audio:", error);
            throw error;
        }
    }
    
    /**
     * Create a single Karplus-Strong synth with proper settings
     */
    createPluckSynth() {
        const synth = new Tone.PluckSynth({
            attackNoise: 1.5,      // Amount of noise at attack (pluck harshness)
            dampening: 3000,       // Dampening frequency (lower = more damped)
            resonance: 0.95        // Resonance (0-1, higher = longer sustain)
        }).connect(this.reverb);
        
        return synth;
    }
    
    /**
     * Play a string with given frequency
     * 
     * @param {number} stringIndex - Which string to play (0-143)
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in seconds (default 2)
     * @param {number} velocity - Volume (0-1, default 0.8)
     */
    pluckString(stringIndex, frequency, duration = 2, velocity = 0.8) {
        if (!this.initialized) {
            console.warn("Audio not initialized. Call initialize() first.");
            return;
        }
        
        if (stringIndex < 0 || stringIndex >= this.synths.length) {
            console.error(`Invalid string index: ${stringIndex}`);
            return;
        }
        
        try {
            // Trigger the synth with frequency
            // Note: PluckSynth can accept frequency directly
            this.synths[stringIndex].triggerAttackRelease(frequency, duration, undefined, velocity);
            
            console.log(`Plucked string ${stringIndex}: ${frequency.toFixed(2)} Hz`);
            
        } catch (error) {
            console.error(`Error playing string ${stringIndex}:`, error);
        }
    }
    
    /**
     * Play multiple strings in sequence (arpeggio)
     */
    async playSequence(stringIndices, frequencies, interval = 0.1) {
        for (let i = 0; i < stringIndices.length; i++) {
            this.pluckString(stringIndices[i], frequencies[i], 1.5);
            await new Promise(resolve => setTimeout(resolve, interval * 1000));
        }
    }
    
    /**
     * Play chord (multiple strings simultaneously)
     */
    playChord(stringIndices, frequencies, duration = 2) {
        stringIndices.forEach((stringIndex, i) => {
            this.pluckString(stringIndex, frequencies[i], duration);
        });
    }
    
    /**
     * Stop all currently playing sounds
     */
    stopAll() {
        this.synths.forEach(synth => {
            synth.releaseAll();
        });
    }
    
    /**
     * Set master volume
     * @param {number} volumeDb - Volume in decibels (-60 to 0)
     */
    setVolume(volumeDb) {
        this.masterVolume.volume.value = volumeDb;
    }
    
    /**
     * Cleanup - call when destroying the app
     */
    dispose() {
        this.synths.forEach(synth => synth.dispose());
        this.reverb.dispose();
        this.masterVolume.dispose();
        this.initialized = false;
    }
}

// Global audio engine instance
let audioEngine = null;

/**
 * Initialize audio engine (call on first user click)
 */
async function initAudio(numStrings = 144) {
    if (!audioEngine) {
        audioEngine = new HarpAudioEngine();
    }
    await audioEngine.initialize(numStrings);
}
```

### 3.2 Audio Integration with String Class

```javascript
/**
 * Add to HarpString class:
 */
class HarpString {
    // ... existing code ...
    
    /**
     * Play this string's current note
     */
    async pluck(duration = 2, velocity = 0.8) {
        if (!audioEngine || !audioEngine.initialized) {
            console.warn("Audio not initialized");
            // Try to initialize
            await initAudio(this.totalStrings);
        }
        
        // Trigger sound
        audioEngine.pluckString(this.index, this.actualFrequency, duration, velocity);
        
        // Set visual state
        this.isPlaying = true;
        this.playingAmplitude = 1.0;
        
        // Auto-reset playing state after duration
        setTimeout(() => {
            this.isPlaying = false;
        }, duration * 1000);
    }
    
    /**
     * Update visual playing animation
     * Call this in draw loop
     */
    updatePlaying(deltaTime) {
        if (this.isPlaying) {
            // Decay amplitude exponentially
            this.playingAmplitude *= 0.95;
            
            if (this.playingAmplitude < 0.01) {
                this.isPlaying = false;
                this.playingAmplitude = 0;
            }
        }
    }
}
```

---

## TASK 4: P5.JS VISUALIZATION WITH CORRECT RENDERING

### 4.1 Canvas Setup and Coordinate System

```javascript
/**
 * Visual constants for rendering
 */
const VISUAL_CONSTANTS = {
    CANVAS_WIDTH: 1400,
    CANVAS_HEIGHT: 800,
    
    // Margins
    TOP_MARGIN: 60,
    BOTTOM_MARGIN: 120,
    SIDE_MARGIN: 20,
    
    // String zone (where strings are drawn)
    STRING_ZONE_TOP: 60,
    STRING_ZONE_BOTTOM: 680,
    STRING_ZONE_HEIGHT: 620,
    
    // Colors
    COLORS: {
        background: [245, 245, 250],
        soundbox: [210, 180, 140],
        topBridge: [120, 100, 80],
        resonator: [230, 200, 170],
        stringInactive: [180, 180, 180],
        stringSelected: [255, 200, 0],
        stringPlaying: [100, 200, 255],
        capo: [70, 130, 230],
        capoDragging: [100, 150, 255],
        text: [80, 80, 80]
    }
};

/**
 * Convert mm position to screen Y coordinate
 * Note: Screen Y goes down, but string measurements go up from soundbox
 * 
 * @param {number} positionMm - Position in mm from soundbox (0 = soundbox, 2134 = top)
 * @returns {number} - Screen Y coordinate
 */
function mmToScreenY(positionMm) {
    const { STRING_ZONE_TOP, STRING_ZONE_BOTTOM, STRING_ZONE_HEIGHT } = VISUAL_CONSTANTS;
    
    // Calculate percentage (0 = bottom/soundbox, 1 = top/bridge)
    const percent = positionMm / PHYSICS_CONSTANTS.FULL_STRING_LENGTH;
    
    // Convert to screen Y (inverted because screen Y increases downward)
    const screenY = STRING_ZONE_BOTTOM - (percent * STRING_ZONE_HEIGHT);
    
    return screenY;
}

/**
 * Convert screen Y coordinate to mm position
 * 
 * @param {number} screenY - Screen Y coordinate
 * @returns {number} - Position in mm from soundbox
 */
function screenYToMm(screenY) {
    const { STRING_ZONE_TOP, STRING_ZONE_BOTTOM, STRING_ZONE_HEIGHT } = VISUAL_CONSTANTS;
    
    // Calculate percentage (0 = bottom, 1 = top)
    const percent = (STRING_ZONE_BOTTOM - screenY) / STRING_ZONE_HEIGHT;
    
    // Convert to mm
    const positionMm = percent * PHYSICS_CONSTANTS.FULL_STRING_LENGTH;
    
    return positionMm;
}
```

### 4.2 String Drawing Function

```javascript
/**
 * Draw a single string with proper capo visualization
 * 
 * @param {p5} p - p5.js instance
 * @param {HarpString} string - String object to draw
 * @param {boolean} isSelected - Whether this string is selected
 */
function drawString(p, string, isSelected) {
    const x = string.xPos; // Already calculated in constructor
    
    // Calculate Y positions
    const soundboxY = mmToScreenY(0);
    const topBridgeY = mmToScreenY(PHYSICS_CONSTANTS.FULL_STRING_LENGTH);
    const lowerCapoY = mmToScreenY(string.lowerCapoMm);
    const upperCapoY = mmToScreenY(string.upperCapoMm);
    
    // Draw full string (dimmed)
    p.stroke(200, 200, 200, 100);
    p.strokeWeight(1);
    p.line(x, soundboxY, x, topBridgeY);
    
    // Draw playable section
    if (string.isPlaying) {
        // Animated vibration
        const vibrationAmount = string.playingAmplitude * 5;
        const vibrationX = x + p.sin(p.frameCount * 0.3) * vibrationAmount;
        
        p.stroke(VISUAL_CONSTANTS.COLORS.stringPlaying);
        p.strokeWeight(3);
        p.line(vibrationX, lowerCapoY, vibrationX, upperCapoY);
        
        // Glow effect
        p.stroke(100, 200, 255, 100);
        p.strokeWeight(8);
        p.line(vibrationX, lowerCapoY, vibrationX, upperCapoY);
        
    } else {
        // Static string
        const color = isSelected ? 
            VISUAL_CONSTANTS.COLORS.stringSelected : 
            VISUAL_CONSTANTS.COLORS.stringInactive;
        
        p.stroke(color);
        p.strokeWeight(isSelected ? 2.5 : 1.5);
        p.line(x, lowerCapoY, x, upperCapoY);
    }
    
    // Draw capos
    drawCapo(p, x, lowerCapoY, string.isDraggingLowerCapo);
    drawCapo(p, x, upperCapoY, string.isDraggingUpperCapo);
    
    // Draw anchor points
    p.noStroke();
    p.fill(80);
    p.circle(x, soundboxY, 4);
    p.circle(x, topBridgeY, 4);
}

/**
 * Draw a capo mechanism
 */
function drawCapo(p, x, y, isDragging) {
    const color = isDragging ? 
        VISUAL_CONSTANTS.COLORS.capoDragging : 
        VISUAL_CONSTANTS.COLORS.capo;
    
    // Capo body
    p.fill(color);
    p.stroke(50);
    p.strokeWeight(1);
    p.rect(x - 12, y - 5, 24, 10, 2);
    
    // Pressure pad (black)
    p.fill(30);
    p.noStroke();
    p.rect(x - 10, y - 2, 20, 4, 1);
    
    // Thumbscrew
    p.fill(200);
    p.stroke(100);
    p.strokeWeight(0.5);
    p.circle(x + 10, y, 5);
    p.line(x + 8, y, x + 12, y);
}
```

---

## TASK 5: INTERACTION HANDLING

### 5.1 Mouse Interaction System

```javascript
/**
 * Mouse interaction manager
 */
class InteractionManager {
    constructor(strings, canvasWidth, canvasHeight) {
        this.strings = strings;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        this.mode = 'pluck'; // 'pluck', 'adjust', 'pattern'
        this.selectedStringIndex = 0;
        this.hoveredStringIndex = -1;
        this.draggedString = null;
        this.draggedCapo = null; // 'lower' or 'upper'
    }
    
    /**
     * Handle mouse press event
     */
    handleMousePressed(mouseX, mouseY) {
        // Find string under cursor
        const stringIndex = this.findStringAtX(mouseX);
        if (stringIndex === -1) return;
        
        const string = this.strings[stringIndex];
        this.selectedStringIndex = stringIndex;
        
        if (this.mode === 'pluck') {
            // Pluck the string
            string.pluck();
            
        } else if (this.mode === 'adjust') {
            // Check if clicking on a capo
            const lowerCapoY = mmToScreenY(string.lowerCapoMm);
            const upperCapoY = mmToScreenY(string.upperCapoMm);
            
            const distToLower = Math.abs(mouseY - lowerCapoY);
            const distToUpper = Math.abs(mouseY - upperCapoY);
            
            if (distToLower < 15 && distToLower < distToUpper) {
                string.isDraggingLowerCapo = true;
                this.draggedString = string;
                this.draggedCapo = 'lower';
            } else if (distToUpper < 15) {
                string.isDraggingUpperCapo = true;
                this.draggedString = string;
                this.draggedCapo = 'upper';
            }
        }
    }
    
    /**
     * Handle mouse drag event
     */
    handleMouseDragged(mouseX, mouseY) {
        if (!this.draggedString || this.mode !== 'adjust') return;
        
        const newPositionMm = screenYToMm(mouseY);
        
        if (this.draggedCapo === 'lower') {
            this.draggedString.setLowerCapoPosition(newPositionMm);
        } else if (this.draggedCapo === 'upper') {
            this.draggedString.setUpperCapoPosition(newPositionMm);
        }
    }
    
    /**
     * Handle mouse release event
     */
    handleMouseReleased() {
        if (this.draggedString) {
            this.draggedString.isDraggingLowerCapo = false;
            this.draggedString.isDraggingUpperCapo = false;
            this.draggedString = null;
            this.draggedCapo = null;
        }
    }
    
    /**
     * Handle mouse move event (for hover effects)
     */
    handleMouseMoved(mouseX, mouseY) {
        this.hoveredStringIndex = this.findStringAtX(mouseX);
    }
    
    /**
     * Find which string is at given X coordinate
     * @returns {number} - String index, or -1 if none
     */
    findStringAtX(x) {
        let closestIndex = -1;
        let minDist = Infinity;
        
        this.strings.forEach((string, index) => {
            const dist = Math.abs(x - string.xPos);
            if (dist < minDist && dist < 10) { // Within 10px
                minDist = dist;
                closestIndex = index;
            }
        });
        
        return closestIndex;
    }
    
    /**
     * Get currently selected string
     */
    getSelectedString() {
        return this.strings[this.selectedStringIndex];
    }
}
```

---

## TASK 6: UI CONTROLS AND DATA DISPLAY

### 6.1 Information Panel Updates

```javascript
/**
 * Update the information panel with current string data
 * 
 * @param {HarpString} string - String to display info for
 */
function updateInfoPanel(string) {
    if (!string) return;
    
    const data = string.getStringData();
    
    // Update DOM elements
    document.getElementById('currentNote').textContent = data.noteName;
    document.getElementById('currentFreq').textContent = `${data.frequency} Hz`;
    document.getElementById('midiNote').textContent = 
        `${data.midiNoteRounded} (${data.noteName})`;
    document.getElementById('playableLength').textContent = 
        `${data.playableLengthMm} mm (${data.playableLengthFeet} ft)`;
    document.getElementById('lowerCapo').textContent = 
        `${data.lowerCapoMm} mm (${data.lowerCapoFeet} ft from bottom)`;
    document.getElementById('upperCapo').textContent = 
        `${data.upperCapoMm} mm (${data.upperCapoFeet} ft from bottom)`;
    
    // Show cents deviation if significant
    if (Math.abs(parseFloat(data.centsDeviation)) > 5) {
        const sign = parseFloat(data.centsDeviation) > 0 ? '+' : '';
        document.getElementById('centsDeviation').textContent = 
            `${sign}${data.centsDeviation} cents`;
        document.getElementById('centsDeviation').style.color = '#ff6b6b';
    } else {
        document.getElementById('centsDeviation').textContent = 'In tune ✓';
        document.getElementById('centsDeviation').style.color = '#51cf66';
    }
}
```

### 6.2 Export/Import Functionality

```javascript
/**
 * Export current tuning configuration to JSON
 * 
 * @param {Array<HarpString>} strings - Array of string objects
 * @returns {string} - JSON string of configuration
 */
function exportConfiguration(strings) {
    const config = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        numStrings: strings.length,
        strings: strings.map(s => ({
            index: s.index,
            lowerCapoMm: s.lowerCapoMm,
            upperCapoMm: s.upperCapoMm,
            targetMidiNote: s.targetMidiNote,
            actualFrequency: s.actualFrequency,
            noteName: s.noteName
        }))
    };
    
    return JSON.stringify(config, null, 2);
}

/**
 * Import tuning configuration from JSON
 * 
 * @param {string} jsonString - JSON configuration
 * @param {Array<HarpString>} strings - Existing string array to update
 * @returns {boolean} - Success status
 */
function importConfiguration(jsonString, strings) {
    try {
        const config = JSON.parse(jsonString);
        
        if (config.numStrings !== strings.length) {
            console.error(`String count mismatch: config has ${config.numStrings}, current has ${strings.length}`);
            return false;
        }
        
        // Apply capo positions from config
        config.strings.forEach((stringData, index) => {
            if (strings[index]) {
                strings[index].setLowerCapoPosition(stringData.lowerCapoMm);
                strings[index].setUpperCapoPosition(stringData.upperCapoMm);
            }
        });
        
        console.log("Configuration imported successfully");
        return true;
        
    } catch (error) {
        console.error("Failed to import configuration:", error);
        return false;
    }
}

/**
 * Download configuration as JSON file
 */
function downloadConfiguration(strings) {
    const json = exportConfiguration(strings);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `wall-harp-config-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

/**
 * Load configuration from file upload
 */
function loadConfigurationFromFile(file, strings) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const success = importConfiguration(e.target.result, strings);
        if (success) {
            alert("Configuration loaded successfully!");
        } else {
            alert("Failed to load configuration. Check console for errors.");
        }
    };
    
    reader.readAsText(file);
}
```

---

## TASK 7: PRESET PATTERNS AND SCALES

### 7.1 Scale Generation Functions

```javascript
/**
 * Scale definitions (intervals from root note)
 */
const SCALES = {
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonicMajor: [0, 2, 4, 7, 9],
    pentatonicMinor: [0, 3, 5, 7, 10],
    blues: [0, 3, 5, 6, 7, 10],
    wholeTone: [0, 2, 4, 6, 8, 10],
    harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10],
    harmonicSeries: [0, 12, 19, 24, 28, 31, 34, 36, 38, 40] // Overtone series
};

/**
 * Apply scale pattern to all strings
 * 
 * @param {Array<HarpString>} strings - String array
 * @param {string} scaleName - Name of scale from SCALES object
 * @param {number} rootMidi - Root note MIDI number (default 36 = C2)
 */
function applyScale(strings, scaleName, rootMidi = 36) {
    const intervals = SCALES[scaleName];
    if (!intervals) {
        console.error(`Unknown scale: ${scaleName}`);
        return;
    }
    
    strings.forEach((string, index) => {
        // Calculate which note in the scale
        const scaleIndex = index % intervals.length;
        const octave = Math.floor(index / intervals.length);
        
        // Calculate target MIDI note
        const targetMidi = rootMidi + intervals[scaleIndex] + (octave * 12);
        
        // Calculate ideal string length for this note
        const targetFreq = midiToFrequency(targetMidi);
        const idealLength = (PHYSICS_CONSTANTS.WAVE_SPEED / (2 * targetFreq)) * 1000; // mm
        
        // Adjust capos to achieve this length (centered in string)
        const centerPos = PHYSICS_CONSTANTS.FULL_STRING_LENGTH / 2;
        const clampedLength = Math.max(300, Math.min(1800, idealLength));
        
        string.setLowerCapoPosition(centerPos - clampedLength / 2);
        string.setUpperCapoPosition(centerPos + clampedLength / 2);
    });
}
```

---

## TASK 8: TESTING AND VALIDATION

### 8.1 Unit Tests for Physics Functions

```javascript
/**
 * Test suite for string physics calculations
 */
function runPhysicsTests() {
    console.log("Running physics tests...");
    
    // Test 1: Reference frequency calculation
    const refFreq = calculateFrequencyFromLengthRatio(1755);
    console.assert(
        Math.abs(refFreq - 65.41) < 0.1,
        `Reference freq test failed: expected 65.41, got ${refFreq}`
    );
    
    // Test 2: Octave relationship (half length = double frequency)
    const halfLengthFreq = calculateFrequencyFromLengthRatio(1755 / 2);
    console.assert(
        Math.abs(halfLengthFreq - 130.82) < 1,
        `Octave test failed: expected ~130.82, got ${halfLengthFreq}`
    );
    
    // Test 3: MIDI conversion round-trip
    const testMidi = 60; // Middle C
    const freq = midiToFrequency(testMidi);
    const backToMidi = frequencyToMidi(freq);
    console.assert(
        Math.abs(backToMidi - testMidi) < 0.01,
        `MIDI round-trip failed: ${testMidi} -> ${freq} -> ${backToMidi}`
    );
    
    // Test 4: Note name correctness
    console.assert(midiToNoteName(60) === "C4", "Middle C should be C4");
    console.assert(midiToNoteName(69) === "A4", "A440 should be A4");
    console.assert(midiToNoteName(36) === "C2", "Bass C should be C2");
    
    console.log("All physics tests passed! ✓");
}

/**
 * Test audio system
 */
async function testAudioSystem() {
    console.log("Testing audio system...");
    
    try {
        await initAudio(12);
        
        // Play a simple chromatic scale
        const testFreqs = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23];
        
        for (let i = 0; i < testFreqs.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 300));
            audioEngine.pluckString(i, testFreqs[i], 0.5);
        }
        
        console.log("Audio test completed ✓");
        
    } catch (error) {
        console.error("Audio test failed:", error);
    }
}
```

---

## TASK 9: COMPLETE APPLICATION STRUCTURE

### 9.1 Main Application Class

```javascript
/**
 * Main application class that ties everything together
 */
class WallHarpSimulator {
    constructor() {
        this.strings = [];
        this.numStrings = 72;
        this.audioEngine = null;
        this.interactionManager = null;
        this.p5Instance = null;
        this.selectedStringIndex = 0;
    }
    
    /**
     * Initialize the entire application
     */
    async init() {
        // Create strings
        this.strings = createChromaticStrings(this.numStrings);
        
        // Create audio engine
        this.audioEngine = new HarpAudioEngine();
        
        // Create interaction manager
        this.interactionManager = new InteractionManager(
            this.strings,
            VISUAL_CONSTANTS.CANVAS_WIDTH,
            VISUAL_CONSTANTS.CANVAS_HEIGHT
        );
        
        // Set up p5.js
        this.initP5();
        
        // Set up UI event listeners
        this.initUI();
        
        // Run tests
        runPhysicsTests();
        
        console.log("Wall Harp Simulator initialized");
    }
    
    /**
     * Initialize p5.js sketch
     */
    initP5() {
        const sketch = (p) => {
            p.setup = () => {
                const canvas = p.createCanvas(
                    VISUAL_CONSTANTS.CANVAS_WIDTH,
                    VISUAL_CONSTANTS.CANVAS_HEIGHT
                );
                canvas.parent('canvasContainer');
            };
            
            p.draw = () => {
                this.draw(p);
            };
            
            p.mousePressed = () => {
                this.handleMousePressed(p);
            };
            
            p.mouseDragged = () => {
                this.handleMouseDragged(p);
            };
            
            p.mouseReleased = () => {
                this.handleMouseReleased(p);
            };
            
            p.mouseMoved = () => {
                this.handleMouseMoved(p);
            };
        };
        
        this.p5Instance = new p5(sketch);
    }
    
    /**
     * Main draw function
     */
    draw(p) {
        // Background
        p.background(VISUAL_CONSTANTS.COLORS.background);
        
        // Draw soundbox
        this.drawSoundbox(p);
        
        // Draw top bridge
        this.drawTopBridge(p);
        
        // Draw resonator panel
        this.drawResonator(p);
        
        // Draw all strings
        this.strings.forEach((string, index) => {
            // Update playing animation
            string.updatePlaying(p.deltaTime / 1000);
            
            // Draw string
            const isSelected = index === this.selectedStringIndex;
            drawString(p, string, isSelected);
        });
        
        // Draw UI overlays
        this.drawUIOverlay(p);
    }
    
    /**
     * Draw soundbox component
     */
    drawSoundbox(p) {
        const y = mmToScreenY(0);
        const height = VISUAL_CONSTANTS.BOTTOM_MARGIN - 20;
        
        p.fill(VISUAL_CONSTANTS.COLORS.soundbox);
        p.stroke(100);
        p.strokeWeight(2);
        p.rect(0, y, VISUAL_CONSTANTS.CANVAS_WIDTH, height);
        
        p.fill(80);
        p.noStroke();
        p.textAlign(p.CENTER);
        p.textSize(16);
        p.text('SOUNDBOX', VISUAL_CONSTANTS.CANVAS_WIDTH / 2, y + height / 2 + 5);
    }
    
    /**
     * Draw top bridge
     */
    drawTopBridge(p) {
        const y = mmToScreenY(PHYSICS_CONSTANTS.FULL_STRING_LENGTH);
        const height = 40;
        
        p.fill(VISUAL_CONSTANTS.COLORS.topBridge);
        p.stroke(100);
        p.strokeWeight(2);
        p.rect(0, y - height / 2, VISUAL_CONSTANTS.CANVAS_WIDTH, height);
        
        p.fill(80);
        p.noStroke();
        p.textAlign(p.CENTER);
        p.textSize(14);
        p.text('TOP BRIDGE', VISUAL_CONSTANTS.CANVAS_WIDTH / 2, y + 5);
    }
    
    /**
     * Draw resonator panel
     */
    drawResonator(p) {
        const topY = mmToScreenY(PHYSICS_CONSTANTS.FULL_STRING_LENGTH) + 20;
        const bottomY = mmToScreenY(0);
        
        p.fill(...VISUAL_CONSTANTS.COLORS.resonator, 30);
        p.noStroke();
        p.rect(0, topY, VISUAL_CONSTANTS.CANVAS_WIDTH, bottomY - topY);
    }
    
    /**
     * Draw UI overlay (mode indicator, etc.)
     */
    drawUIOverlay(p) {
        // Mode indicator
        p.fill(VISUAL_CONSTANTS.COLORS.text);
        p.textAlign(p.LEFT);
        p.textSize(14);
        const modeText = {
            'pluck': '🎸 Pluck Mode - Click strings to play',
            'adjust': '🔧 Adjust Mode - Drag capos to tune',
            'pattern': '🎨 Pattern Mode - Create melodies'
        }[this.interactionManager.mode];
        
        p.text(modeText, 10, 20);
        
        // String count
        p.textAlign(p.RIGHT);
        p.text(`${this.numStrings} strings`, VISUAL_CONSTANTS.CANVAS_WIDTH - 10, 20);
    }
    
    /**
     * Handle mouse interactions
     */
    handleMousePressed(p) {
        this.interactionManager.handleMousePressed(p.mouseX, p.mouseY);
        this.selectedStringIndex = this.interactionManager.selectedStringIndex;
        updateInfoPanel(this.strings[this.selectedStringIndex]);
    }
    
    handleMouseDragged(p) {
        this.interactionManager.handleMouseDragged(p.mouseX, p.mouseY);
        if (this.interactionManager.draggedString) {
            updateInfoPanel(this.interactionManager.draggedString);
        }
    }
    
    handleMouseReleased(p) {
        this.interactionManager.handleMouseReleased();
    }
    
    handleMouseMoved(p) {
        this.interactionManager.handleMouseMoved(p.mouseX, p.mouseY);
    }
    
    /**
     * Initialize UI controls
     */
    initUI() {
        // Audio init button
        document.getElementById('initAudio').addEventListener('click', async () => {
            await this.audioEngine.initialize(this.numStrings);
            alert("Audio initialized! You can now play strings.");
        });
        
        // String count slider
        document.getElementById('stringCount').addEventListener('input', (e) => {
            this.numStrings = parseInt(e.target.value);
            this.strings = createChromaticStrings(this.numStrings);
            this.interactionManager.strings = this.strings;
            document.getElementById('stringCountValue').textContent = this.numStrings;
        });
        
        // Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.interactionManager.mode = mode;
                
                // Update button states
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        // Scale presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const scale = e.target.dataset.scale;
                applyScale(this.strings, scale);
                updateInfoPanel(this.strings[this.selectedStringIndex]);
            });
        });
        
        // Export/Import
        document.getElementById('exportBtn').addEventListener('click', () => {
            downloadConfiguration(this.strings);
        });
        
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        document.getElementById('fileInput').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                loadConfigurationFromFile(e.target.files[0], this.strings);
                updateInfoPanel(this.strings[this.selectedStringIndex]);
            }
        });
    }
}

// Initialize application when page loads
let app;
window.addEventListener('DOMContentLoaded', async () => {
    app = new WallHarpSimulator();
    await app.init();
});
```

---

## TASK 10: TESTING CHECKLIST

### 10.1 Physics Validation Tests

- [ ] Bass string (C2, 1755mm) produces 65.41 Hz ± 0.5 Hz
- [ ] Octave jump works: 1755mm → 877mm doubles frequency
- [ ] Moving capo 1mm changes frequency predictably
- [ ] MIDI note name matches expected value for frequency
- [ ] Cents deviation shows correct tuning accuracy

### 10.2 Audio Tests

- [ ] Audio initializes without errors on first click
- [ ] Each string plays distinct frequency
- [ ] Karplus-Strong algorithm produces plucked string sound
- [ ] No audio glitches or crackling
- [ ] Multiple strings can play simultaneously
- [ ] Volume controls work properly

### 10.3 Interaction Tests

- [ ] Clicking string in pluck mode plays sound
- [ ] Dragging capo updates note in real-time
- [ ] Capos cannot be dragged past limits
- [ ] Selected string highlights correctly
- [ ] Hover effects work
- [ ] Mouse cursor shows correct state

### 10.4 Visual Tests

- [ ] All 144 strings render without performance issues
- [ ] Capos appear at correct Y positions based on mm values
- [ ] Playing animation shows string vibration
- [ ] String colors match state (playing/selected/normal)
- [ ] Zoom doesn't break positioning

### 10.5 Data Export/Import Tests

- [ ] Export creates valid JSON
- [ ] Import loads capo positions correctly
- [ ] Scale presets apply correct tunings
- [ ] Configuration persists across sessions

---

## IMPLEMENTATION NOTES FOR CLAUDE CODE

1. **Start with physics functions** - Get calculations 100% correct first
2. **Test each function independently** before integrating
3. **Use console.log extensively** to verify calculations
4. **Check every coordinate conversion** (mm ↔ screen pixels)
5. **Initialize audio properly** with user gesture
6. **Validate MIDI note ranges** (36-96 for C2-B7)
7. **Clamp all values** to prevent out-of-bounds errors
8. **Test with different string counts** (12, 24, 72, 144)

---

## FILES TO CREATE

1. `index.html` - Main HTML structure
2. `styles.css` - All styling
3. `constants.js` - PHYSICS_CONSTANTS, VISUAL_CONSTANTS, SCALES
4. `physics.js` - All calculation functions
5. `audio.js` - HarpAudioEngine class
6. `string.js` - HarpString class
7. `interaction.js` - InteractionManager class
8. `visualization.js` - All drawing functions
9. `ui.js` - UI control handlers
10. `main.js` - WallHarpSimulator main application class
11. `utils.js` - Export/import, coordinate conversion utilities

---

## CRITICAL SUCCESS FACTORS

✓ **Correct physics calculations** - frequency MUST match string length
✓ **Working audio** - Tone.js must initialize and play properly
✓ **Real-time updates** - Dragging capos updates frequency immediately
✓ **Accurate measurements** - Display values match calculations exactly
✓ **Smooth performance** - 144 strings render at 60fps
✓ **Intuitive interaction** - Users understand how to use immediately

---

This specification provides everything needed to build a working, accurate Wall Harp Simulator.
Use Claude Code to implement each task systematically, testing thoroughly at each step.
