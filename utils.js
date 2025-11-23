/**
 * WALL HARP SIMULATOR - UTILITIES
 * Export/import, coordinate conversion, and helper functions
 */

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

        if (!config.version || !config.strings) {
            console.error("Invalid configuration format");
            return false;
        }

        if (config.numStrings !== strings.length) {
            console.error("String count mismatch: config has " + config.numStrings + ", current has " + strings.length);
            return false;
        }

        // Apply capo positions from config
        config.strings.forEach((stringData, index) => {
            if (strings[index]) {
                strings[index].setStringData(stringData);
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
 *
 * @param {Array<HarpString>} strings - Array of string objects
 */
function downloadConfiguration(strings) {
    const json = exportConfiguration(strings);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = 'wall-harp-config-' + timestamp + '.json';

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    console.log("Configuration downloaded: " + filename);
}

/**
 * Load configuration from file upload
 *
 * @param {File} file - File object from input
 * @param {Array<HarpString>} strings - String array to update
 * @returns {Promise<boolean>} - Success status
 */
function loadConfigurationFromFile(file, strings) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const success = importConfiguration(e.target.result, strings);
            if (success) {
                console.log("Configuration loaded from file successfully");
            }
            resolve(success);
        };

        reader.onerror = (e) => {
            console.error("Failed to read file:", e);
            reject(e);
        };

        reader.readAsText(file);
    });
}

/**
 * Format frequency for display
 *
 * @param {number} frequency - Frequency in Hz
 * @returns {string} - Formatted frequency string
 */
function formatFrequency(frequency) {
    return frequency.toFixed(2) + ' Hz';
}

/**
 * Format length for display (mm and feet)
 *
 * @param {number} lengthMm - Length in millimeters
 * @returns {string} - Formatted length string
 */
function formatLength(lengthMm) {
    const feet = lengthMm / 304.8;
    return lengthMm.toFixed(0) + ' mm (' + feet.toFixed(2) + ' ft)';
}

/**
 * Format cents deviation for display
 *
 * @param {number} cents - Cents deviation
 * @returns {string} - Formatted cents string with sign
 */
function formatCents(cents) {
    const sign = cents >= 0 ? '+' : '';
    return sign + cents.toFixed(1) + ' cents';
}

/**
 * Get tuning status text and color
 *
 * @param {number} cents - Cents deviation
 * @returns {object} - {text: string, color: string}
 */
function getTuningStatus(cents) {
    const absCents = Math.abs(cents);

    if (absCents < 5) {
        return { text: 'IN TUNE', color: '#ffffff' };
    } else if (absCents < 10) {
        return { text: 'SLIGHTLY OFF (' + formatCents(cents) + ')', color: '#b0b0b0' };
    } else {
        return { text: 'OUT OF TUNE (' + formatCents(cents) + ')', color: '#808080' };
    }
}

/**
 * Generate a chromatic scale starting from root note
 *
 * @param {number} rootMidi - Root MIDI note
 * @param {number} numNotes - Number of notes to generate
 * @returns {Array<number>} - Array of MIDI notes
 */
function generateChromaticScale(rootMidi, numNotes) {
    const notes = [];
    for (let i = 0; i < numNotes; i++) {
        notes.push(rootMidi + i);
    }
    return notes;
}

/**
 * Generate scale from intervals
 *
 * @param {number} rootMidi - Root MIDI note
 * @param {Array<number>} intervals - Scale intervals
 * @param {number} numOctaves - Number of octaves
 * @returns {Array<number>} - Array of MIDI notes
 */
function generateScaleFromIntervals(rootMidi, intervals, numOctaves) {
    const notes = [];

    for (let octave = 0; octave < numOctaves; octave++) {
        for (let interval of intervals) {
            notes.push(rootMidi + interval + (octave * 12));
        }
    }

    return notes;
}

/**
 * Calculate optimal canvas size based on window
 *
 * @param {number} containerWidth - Available width
 * @param {number} containerHeight - Available height
 * @returns {object} - {width: number, height: number}
 */
function calculateCanvasSize(containerWidth, containerHeight) {
    const aspectRatio = VISUAL_CONSTANTS.CANVAS_WIDTH / VISUAL_CONSTANTS.CANVAS_HEIGHT;

    let width = containerWidth;
    let height = width / aspectRatio;

    if (height > containerHeight) {
        height = containerHeight;
        width = height * aspectRatio;
    }

    return {
        width: Math.floor(width),
        height: Math.floor(height)
    };
}

/**
 * Debounce function for performance optimization
 *
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for performance optimization
 *
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Linear interpolation
 *
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} - Interpolated value
 */
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

/**
 * Map value from one range to another
 *
 * @param {number} value - Input value
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number} - Mapped value
 */
function mapRange(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

/**
 * Set theme (light or dark)
 *
 * @param {string} theme - 'light' or 'dark'
 */
function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('theme-dark');
        localStorage.setItem('wallHarpTheme', 'dark');
    } else {
        document.body.classList.remove('theme-dark');
        localStorage.setItem('wallHarpTheme', 'light');
    }
}

/**
 * Get current theme from localStorage
 *
 * @returns {string} - 'light' or 'dark'
 */
function getTheme() {
    return localStorage.getItem('wallHarpTheme') || 'light';
}

/**
 * Initialize theme from localStorage
 */
function initializeTheme() {
    const savedTheme = getTheme();
    setTheme(savedTheme);
}

/**
 * Log system information for debugging
 */
function logSystemInfo() {
    console.log("=== WALL HARP SIMULATOR - SYSTEM INFO ===");
    console.log("Version: 1.0");
    console.log("Physics Constants:", PHYSICS_CONSTANTS);
    console.log("Visual Constants:", VISUAL_CONSTANTS);
    console.log("Audio Constants:", AUDIO_CONSTANTS);
    console.log("Interaction Constants:", INTERACTION_CONSTANTS);
    console.log("Available Scales:", Object.keys(SCALES));
    console.log("=== END SYSTEM INFO ===");
}

// Export for ES6 modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        exportConfiguration,
        importConfiguration,
        downloadConfiguration,
        loadConfigurationFromFile,
        formatFrequency,
        formatLength,
        formatCents,
        getTuningStatus,
        generateChromaticScale,
        generateScaleFromIntervals,
        calculateCanvasSize,
        debounce,
        throttle,
        lerp,
        mapRange,
        logSystemInfo
    };
}
