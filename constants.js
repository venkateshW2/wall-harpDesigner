/**
 * WALL HARP SIMULATOR - CONSTANTS
 */

// ===== STRING MATERIAL PROPERTIES =====
const STRING_MATERIALS = {
    steel: {
        name: 'Steel',
        density: 7850,           // kg/m³
        tensionRange: [80, 150], // Newtons
        defaultTension: 120,
        color: [100, 140, 200],  // Bright steel blue
        description: 'Bright, sustained tone with high tension'
    },
    nylon: {
        name: 'Nylon',
        density: 1140,           // kg/m³
        tensionRange: [40, 80],
        defaultTension: 60,
        color: [255, 200, 0],    // Bright golden yellow
        description: 'Warm, mellow tone with lower tension'
    },
    gut: {
        name: 'Gut',
        density: 1300,           // kg/m³
        tensionRange: [50, 90],
        defaultTension: 70,
        color: [200, 150, 100],  // Natural tan/brown
        description: 'Rich, organic tone with medium tension'
    },
    bronze: {
        name: 'Bronze (80/20)',
        density: 8800,           // kg/m³
        tensionRange: [70, 130],
        defaultTension: 100,
        color: [220, 120, 40],   // Bright bronze/orange
        description: 'Bright, crisp tone with good sustain'
    },
    phosphorBronze: {
        name: 'Phosphor Bronze',
        density: 8900,           // kg/m³
        tensionRange: [75, 135],
        defaultTension: 105,
        color: [180, 80, 30],    // Deep reddish bronze
        description: 'Warm, balanced tone with excellent sustain'
    }
};

// String gauge/diameter presets (in mm)
const STRING_GAUGES = {
    extraLight: { name: 'Extra Light', diameter: 0.25, description: 'Higher pitch, easier to play' },
    light: { name: 'Light', diameter: 0.35, description: 'Standard light gauge' },
    medium: { name: 'Medium', diameter: 0.50, description: 'Balanced tone and tension' },
    heavy: { name: 'Heavy', diameter: 0.70, description: 'Fuller tone, higher tension' },
    extraHeavy: { name: 'Extra Heavy', diameter: 0.90, description: 'Maximum volume and sustain' }
};

// ===== PHYSICS CONSTANTS =====
const PHYSICS_CONSTANTS = {
    FULL_STRING_LENGTH: 2134,    // mm (default ~7 feet)
    WALL_WIDTH: 7830,            // mm (default ~25.7 feet)

    // Default wall dimensions in feet (converted to mm)
    DEFAULT_WALL_WIDTH_FT: 25.7,
    DEFAULT_WALL_HEIGHT_FT: 7.0,

    // Minimum spacing for playable strings
    MIN_STRING_SPACING: 10,      // mm (1cm minimum for playability)

    // Reference calibration (default steel, medium gauge)
    REFERENCE_FREQ: 114.8,
    REFERENCE_LENGTH: 1000,

    // Default material and gauge
    DEFAULT_MATERIAL: 'steel',
    DEFAULT_GAUGE: 'medium',
    DEFAULT_TENSION: 120,        // Newtons

    // Physical limits
    MIN_CAPO_DISTANCE: 50,
    MIN_PLAYABLE_LENGTH: 50,
    MAX_PLAYABLE_LENGTH: 2000,

    // Calculate wave speed from material properties
    // v = sqrt(T / μ) where μ = (π * r² * ρ)
    calculateWaveSpeed: function(material, gauge, tension) {
        const mat = STRING_MATERIALS[material];
        const g = STRING_GAUGES[gauge];

        const radius = (g.diameter / 2) / 1000; // Convert mm to meters
        const linearDensity = Math.PI * radius * radius * mat.density; // kg/m
        const waveSpeed = Math.sqrt(tension / linearDensity); // m/s

        return waveSpeed;
    }
};

// ===== VISUAL CONSTANTS =====
const VISUAL_CONSTANTS = {
    CANVAS_WIDTH: 1000,
    CANVAS_HEIGHT: 700,

    TOP_MARGIN: 60,
    BOTTOM_MARGIN: 80,
    SIDE_MARGIN: 30,

    STRING_ZONE_TOP: 60,
    STRING_ZONE_BOTTOM: 600,
    STRING_ZONE_HEIGHT: 540,

    SOUNDBOX_HEIGHT: 100,
    TOP_BRIDGE_HEIGHT: 50,
    CAPO_WIDTH: 24,
    CAPO_HEIGHT: 10,

    // Zoom
    DEFAULT_ZOOM: 1.0,
    MIN_ZOOM: 0.3,
    MAX_ZOOM: 4.0,
    ZOOM_SPEED: 0.1,

    // Professional Monochrome Palette - LIGHT THEME
    COLORS_LIGHT: {
        background: [250, 250, 250],
        backgroundSecondary: [240, 240, 240],
        soundbox: [200, 200, 200],        // Light grey
        soundboxStroke: [180, 180, 180],  // Light grey stroke
        topBridge: [200, 200, 200],       // Light grey
        bridgeStroke: [180, 180, 180],    // Light grey stroke
        resonator: [230, 230, 230, 60],
        stringInactive: [100, 100, 100],
        stringSelected: [0, 0, 0],
        stringPlaying: [50, 50, 50],
        stringFull: [180, 180, 180, 100],
        capo: [0, 100, 200],           // Blue capos
        capoDragging: [0, 150, 255],   // Bright blue when dragging
        capoStroke: [220, 220, 220],
        capoPad: [0, 80, 160],         // Dark blue pad
        capoScrew: [100, 150, 200],    // Light blue screw
        text: [40, 40, 40],
        textDim: [120, 120, 120],
        gridLine: [220, 220, 220],
        measurementLine: [180, 180, 180],
        hover: [0, 0, 0, 30],
        vibrationGlow: [0, 0, 0, 100]
    },

    // DARK THEME
    COLORS_DARK: {
        background: [10, 10, 10],
        backgroundSecondary: [26, 26, 26],
        soundbox: [58, 58, 58],
        soundboxStroke: [80, 80, 80],
        topBridge: [70, 70, 70],
        bridgeStroke: [100, 100, 100],
        resonator: [40, 40, 40, 40],
        stringInactive: [120, 120, 120],
        stringSelected: [255, 255, 255],
        stringPlaying: [200, 200, 200],
        stringFull: [60, 60, 60, 80],
        capo: [50, 150, 255],          // Blue capos
        capoDragging: [100, 200, 255], // Bright blue when dragging
        capoStroke: [40, 40, 40],
        capoPad: [30, 100, 180],       // Dark blue pad
        capoScrew: [150, 200, 255],    // Light blue screw
        text: [180, 180, 180],
        textDim: [100, 100, 100],
        gridLine: [50, 50, 50],
        measurementLine: [80, 80, 80],
        hover: [255, 255, 255, 30],
        vibrationGlow: [255, 255, 255, 100]
    },

    COLORS: null, // Will be set based on theme

    FONT_SIZES: {
        title: 28,      // Main titles
        label: 22,      // Labels and shortcuts
        value: 24,      // Values and info
        small: 18,      // String numbers and notes
        stringNote: 14, // Note names on canvas
        stringNumber: 12 // String numbers on canvas
    }
};

// Set default theme to dark
VISUAL_CONSTANTS.COLORS = VISUAL_CONSTANTS.COLORS_DARK;

// ===== WAVEFORM GENERATORS =====
const WAVEFORMS = {
    sine: (index, total, amplitude, offset) => {
        return Math.sin((index / total) * Math.PI * 2) * amplitude + offset;
    },
    sawtooth: (index, total, amplitude, offset) => {
        return ((index / total) * 2 - 1) * amplitude + offset;
    },
    triangle: (index, total, amplitude, offset) => {
        const t = (index / total) * 2;
        return (t < 1 ? t : 2 - t) * 2 * amplitude - amplitude + offset;
    },
    square: (index, total, amplitude, offset) => {
        return (index / total < 0.5 ? amplitude : -amplitude) + offset;
    },
    random: (index, total, amplitude, offset) => {
        return (Math.random() * 2 - 1) * amplitude + offset;
    }
};

// ===== SCALE DEFINITIONS =====
const SCALES = {
    chromatic: {
        name: 'Chromatic',
        intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    },
    major: {
        name: 'Major',
        intervals: [0, 2, 4, 5, 7, 9, 11]
    },
    minor: {
        name: 'Natural Minor',
        intervals: [0, 2, 3, 5, 7, 8, 10]
    },
    pentatonicMajor: {
        name: 'Pentatonic Major',
        intervals: [0, 2, 4, 7, 9]
    },
    pentatonicMinor: {
        name: 'Pentatonic Minor',
        intervals: [0, 3, 5, 7, 10]
    },
    blues: {
        name: 'Blues',
        intervals: [0, 3, 5, 6, 7, 10]
    },
    wholeTone: {
        name: 'Whole Tone',
        intervals: [0, 2, 4, 6, 8, 10]
    },
    harmonicMinor: {
        name: 'Harmonic Minor',
        intervals: [0, 2, 3, 5, 7, 8, 11]
    },
    dorian: {
        name: 'Dorian',
        intervals: [0, 2, 3, 5, 7, 9, 10]
    },
    phrygian: {
        name: 'Phrygian',
        intervals: [0, 1, 3, 5, 7, 8, 10]
    },
    lydian: {
        name: 'Lydian',
        intervals: [0, 2, 4, 6, 7, 9, 11]
    },
    mixolydian: {
        name: 'Mixolydian',
        intervals: [0, 2, 4, 5, 7, 9, 10]
    },
    locrian: {
        name: 'Locrian',
        intervals: [0, 1, 3, 5, 6, 8, 10]
    },
    harmonicSeries: {
        name: 'Harmonic Series',
        intervals: [0, 12, 19, 24, 28, 31, 34, 36, 38, 40]
    }
};

// ===== INTERACTION CONSTANTS =====
const INTERACTION_CONSTANTS = {
    CLICK_THRESHOLD: 10,
    CAPO_GRAB_THRESHOLD: 30,  // Increased from 15 to 30 for easier grabbing
    DOUBLE_CLICK_TIME: 300,
    MODES: {
        PLUCK: 'pluck',
        ADJUST: 'adjust',
        PATTERN: 'pattern'
    },
    VIBRATION_DECAY: 0.95,
    MIN_AMPLITUDE: 0.01,
    DRAG_PLUCK_INTERVAL: 100  // ms between auto-plucks while dragging
};

// ===== AUDIO ENGINE TYPES =====
const AUDIO_ENGINES = {
    karplus: {
        name: 'Karplus-Strong (Plucked)',
        description: 'Physical modeling of plucked strings',
        attackNoise: 1.5,
        dampening: 4000,
        resonance: 0.97
    },
    piano: {
        name: 'Piano',
        description: 'Rich harmonic piano tone',
        attack: 0.005,
        decay: 0.3,
        sustain: 0.1,
        release: 1.5
    },
    sine: {
        name: 'Sine Wave',
        description: 'Pure sine wave tone',
        attack: 0.01,
        release: 0.5
    },
    saw: {
        name: 'Sawtooth',
        description: 'Bright sawtooth wave',
        attack: 0.01,
        release: 0.5
    },
    square: {
        name: 'Square Wave',
        description: 'Hollow square wave',
        attack: 0.01,
        release: 0.5
    },
    triangle: {
        name: 'Triangle Wave',
        description: 'Soft triangle wave',
        attack: 0.01,
        release: 0.5
    }
};

// ===== AUDIO CONSTANTS =====
const AUDIO_CONSTANTS = {
    DEFAULT_ENGINE: 'karplus',
    ATTACK_NOISE: 1.5,
    DAMPENING: 4000,
    RESONANCE: 0.97,
    MASTER_VOLUME: -6,
    REVERB_DECAY: 3.5,
    REVERB_WET: 0.4,
    REVERB_PREDELAY: 0.01,
    DEFAULT_DURATION: 4,
    DEFAULT_VELOCITY: 0.7,
    ARPEGGIO_INTERVAL: 0.15
};

// Theme switcher
function setTheme(themeName) {
    if (themeName === 'light') {
        VISUAL_CONSTANTS.COLORS = VISUAL_CONSTANTS.COLORS_LIGHT;
    } else {
        VISUAL_CONSTANTS.COLORS = VISUAL_CONSTANTS.COLORS_DARK;
    }
}
