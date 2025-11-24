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
        version: "2.0",  // Updated version to include draw mode
        timestamp: new Date().toISOString(),
        numStrings: strings.length,
        strings: strings.map(s => ({
            index: s.index,
            lowerCapoMm: s.lowerCapoMm,
            upperCapoMm: s.upperCapoMm,
            targetMidiNote: s.targetMidiNote,
            actualFrequency: s.actualFrequency,
            noteName: s.noteName,
            // Draw mode properties
            drawMode: s.drawMode,
            startX: s.startX,
            startY: s.startY,
            endX: s.endX,
            endY: s.endY,
            material: s.material,
            gauge: s.gauge,
            tension: s.tension
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

        // Apply configuration data
        config.strings.forEach((stringData, index) => {
            if (strings[index]) {
                // Apply capo positions (for backward compatibility with v1.0)
                strings[index].setStringData(stringData);

                // Apply draw mode data (v2.0+)
                if (stringData.drawMode !== undefined) {
                    strings[index].drawMode = stringData.drawMode;
                    strings[index].startX = stringData.startX;
                    strings[index].startY = stringData.startY;
                    strings[index].endX = stringData.endX;
                    strings[index].endY = stringData.endY;

                    // Apply material properties if available
                    if (stringData.material) strings[index].material = stringData.material;
                    if (stringData.gauge) strings[index].gauge = stringData.gauge;
                    if (stringData.tension) strings[index].tension = stringData.tension;

                    // Recalculate with new data
                    strings[index].updateCalculations();
                }
            }
        });

        console.log("Configuration imported successfully (version " + config.version + ")");
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

// ===== DRAW MODE COLLISION DETECTION =====

/**
 * Check if two line segments intersect
 * Uses standard line intersection algorithm
 * @param {object} line1 - {x1, y1, x2, y2}
 * @param {object} line2 - {x1, y1, x2, y2}
 * @returns {boolean} - True if segments intersect
 */
function doLinesIntersect(line1, line2) {
    const { x1: x1, y1: y1, x2: x2, y2: y2 } = line1;
    const { x1: x3, y1: y3, x2: x4, y2: y4 } = line2;

    // Calculate the direction of the lines
    const denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));

    // Lines are parallel if denominator is 0
    if (Math.abs(denominator) < 0.0001) {
        return false;
    }

    const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
    const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;

    // Intersection occurs if both ua and ub are between 0 and 1
    return (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1);
}

/**
 * Check if a string overlaps with any other strings
 * @param {HarpString} string - String to check
 * @param {Array<HarpString>} allStrings - All strings
 * @returns {boolean} - True if overlap detected
 */
function checkStringOverlap(string, allStrings) {
    if (!string.drawMode || string.startX === null || string.endX === null) {
        return false;
    }

    const line1 = {
        x1: string.startX,
        y1: string.startY,
        x2: string.endX,
        y2: string.endY
    };

    for (let other of allStrings) {
        // Skip self and non-draw-mode strings
        if (other === string || !other.drawMode) continue;

        // Skip if other string not yet placed
        if (other.startX === null || other.endX === null) continue;

        const line2 = {
            x1: other.startX,
            y1: other.startY,
            x2: other.endX,
            y2: other.endY
        };

        if (doLinesIntersect(line1, line2)) {
            return true;
        }
    }

    return false;
}

/**
 * Calculate distance from point to line segment
 * @param {number} px - Point X
 * @param {number} py - Point Y
 * @param {number} x1 - Line start X
 * @param {number} y1 - Line start Y
 * @param {number} x2 - Line end X
 * @param {number} y2 - Line end Y
 * @returns {number} - Distance in pixels
 */
function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
}

// ===== DRAW MODE QUANTIZATION =====

/**
 * Generate array of allowed MIDI notes for a given scale
 * @param {string} scaleType - Scale name from SCALES constant
 * @param {number} rootMidi - Root MIDI note
 * @param {number} numOctaves - Number of octaves to generate
 * @returns {Array<number>} - Array of allowed MIDI notes
 */
function generateScaleNotes(scaleType, rootMidi, numOctaves = 6) {
    if (!SCALES[scaleType]) {
        console.error('Unknown scale type:', scaleType);
        return [];
    }

    const scale = SCALES[scaleType];
    const notes = [];

    // Generate notes across multiple octaves
    for (let octave = -1; octave < numOctaves + 1; octave++) {
        for (let interval of scale.intervals) {
            notes.push(rootMidi + interval + (octave * 12));
        }
    }

    return notes.sort((a, b) => a - b);
}

/**
 * Find nearest MIDI note from allowed scale notes
 * @param {number} currentMidi - Current MIDI note (can be fractional)
 * @param {Array<number>} allowedNotes - Array of allowed MIDI notes
 * @returns {number} - Nearest allowed MIDI note
 */
function findNearestScaleNote(currentMidi, allowedNotes) {
    if (allowedNotes.length === 0) {
        return Math.round(currentMidi);
    }

    let nearest = allowedNotes[0];
    let minDistance = Math.abs(currentMidi - nearest);

    for (let note of allowedNotes) {
        const distance = Math.abs(currentMidi - note);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = note;
        }
    }

    return nearest;
}

/**
 * Quantize a drawn string to nearest perfect pitch
 * @param {HarpString} string - String object to quantize
 * @param {string} scaleFilter - Scale filter ('none' or scale name)
 * @param {number} rootNote - Root MIDI note for scale
 * @returns {boolean} - True if quantized successfully
 */
function quantizeStringPitch(string, scaleFilter = 'none', rootNote = 48) {
    if (!string.drawMode || string.startX === null || string.endX === null) {
        console.warn('Cannot quantize: string not in draw mode or not placed');
        return false;
    }

    // Calculate current frequency and MIDI note
    const currentFreq = string.actualFrequency;
    if (!currentFreq || currentFreq <= 0) {
        console.warn('Cannot quantize: invalid frequency');
        return false;
    }

    // Convert frequency to MIDI note (fractional)
    const currentMidi = frequencyToMidi(currentFreq);

    // Find target MIDI note
    let targetMidi;
    if (scaleFilter === 'none' || !SCALES[scaleFilter]) {
        // No filter - snap to nearest chromatic semitone
        targetMidi = Math.round(currentMidi);
    } else {
        // Generate allowed notes for scale
        const allowedNotes = generateScaleNotes(scaleFilter, rootNote);
        targetMidi = findNearestScaleNote(currentMidi, allowedNotes);
    }

    // Convert target MIDI back to frequency
    const targetFreq = midiToFrequency(targetMidi);

    // Calculate required string length for target frequency
    // f = (v / 2L) where v = wave speed, L = length
    const waveSpeed = PHYSICS_CONSTANTS.calculateWaveSpeed(
        string.material,
        string.gauge,
        string.tension
    );
    const requiredLengthMeters = waveSpeed / (2 * targetFreq);
    const requiredLengthMm = requiredLengthMeters * 1000;

    // Calculate current string length in mm
    const dx = string.endX - string.startX;
    const dy = string.endY - string.startY;
    const currentLengthPixels = Math.sqrt(dx * dx + dy * dy);

    // Get canvas dimensions to convert pixels to mm
    const canvasWidth = VISUAL_CONSTANTS.CANVAS_WIDTH;
    const canvasHeight = VISUAL_CONSTANTS.CANVAS_HEIGHT;
    const wallWidthMm = PHYSICS_CONSTANTS.WALL_WIDTH;
    const wallHeightMm = PHYSICS_CONSTANTS.FULL_STRING_LENGTH;

    // Calculate scale factor (pixels to mm)
    const scaleX = wallWidthMm / canvasWidth;
    const scaleY = wallHeightMm / canvasHeight;
    const avgScale = (scaleX + scaleY) / 2;

    const currentLengthMm = currentLengthPixels * avgScale;

    // Calculate scaling factor
    const scaleFactor = requiredLengthMm / currentLengthMm;

    // Calculate string center point
    const centerX = (string.startX + string.endX) / 2;
    const centerY = (string.startY + string.endY) / 2;

    // Scale string endpoints around center
    const halfDx = dx / 2;
    const halfDy = dy / 2;

    string.startX = centerX - (halfDx * scaleFactor);
    string.startY = centerY - (halfDy * scaleFactor);
    string.endX = centerX + (halfDx * scaleFactor);
    string.endY = centerY + (halfDy * scaleFactor);

    // Update string calculations
    string.updateCalculations();

    console.log(`Quantized string ${string.index}: ${currentFreq.toFixed(2)}Hz → ${targetFreq.toFixed(2)}Hz (MIDI ${targetMidi})`);

    return true;
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
