/**
 * WALL HARP SIMULATOR - STRING CLASS
 */

class HarpString {
    constructor(index, totalStrings, targetMidiNote, material, gauge, tension) {
        this.index = index;
        this.totalStrings = totalStrings;
        this.targetMidiNote = targetMidiNote;

        // Material properties
        this.material = material || PHYSICS_CONSTANTS.DEFAULT_MATERIAL;
        this.gauge = gauge || PHYSICS_CONSTANTS.DEFAULT_GAUGE;
        this.tension = tension || PHYSICS_CONSTANTS.DEFAULT_TENSION;

        // Calculate target frequency and length
        this.targetFrequency = midiToFrequency(targetMidiNote);
        this.targetLengthMm = this.calculateLengthFromFrequency(this.targetFrequency);

        // Initialize capo positions
        this.initializeCapoPositions();

        // Visual properties
        this.xPos = (index + 0.5) * (PHYSICS_CONSTANTS.WALL_WIDTH / totalStrings);

        // String color based on material - copy array to ensure uniqueness
        const matColor = STRING_MATERIALS[this.material].color;
        this.color = [matColor[0], matColor[1], matColor[2]];

        // State flags
        this.isPlaying = false;
        this.playingAmplitude = 0;
        this.isSelected = false;
        this.isDraggingLowerCapo = false;
        this.isDraggingUpperCapo = false;

        // Draw mode properties (2D free-form positioning)
        this.drawMode = false;           // Is this string in draw mode?
        this.startX = null;              // Start point X (pixels)
        this.startY = null;              // Start point Y (pixels)
        this.endX = null;                // End point X (pixels)
        this.endY = null;                // End point Y (pixels)
        this.isDraggingStart = false;    // Is user dragging start point?
        this.isDraggingEnd = false;      // Is user dragging end point?
    }

    calculateLengthFromFrequency(frequency) {
        // Use material-specific wave speed
        const waveSpeed = PHYSICS_CONSTANTS.calculateWaveSpeed(this.material, this.gauge, this.tension);
        // f = v / (2L)  =>  L = v / (2f)
        const lengthMeters = waveSpeed / (2 * frequency);
        return lengthMeters * 1000; // Convert to mm
    }

    calculateFrequencyFromLength(lengthMm) {
        // Use material-specific wave speed
        const waveSpeed = PHYSICS_CONSTANTS.calculateWaveSpeed(this.material, this.gauge, this.tension);
        const lengthMeters = lengthMm / 1000;
        // f = v / (2L)
        return waveSpeed / (2 * lengthMeters);
    }

    setMaterial(material, gauge, tension) {
        this.material = material;
        this.gauge = gauge;
        this.tension = tension;

        // Copy the color array to ensure each string has its own instance
        const matColor = STRING_MATERIALS[material].color;
        this.color = [matColor[0], matColor[1], matColor[2]];

        // Recalculate length for current frequency
        this.targetLengthMm = this.calculateLengthFromFrequency(this.targetFrequency);
        this.initializeCapoPositions();

        const matName = STRING_MATERIALS[material].name;
        console.log(`✓ String #${this.index + 1} material: ${matName} → Color RGB: [${this.color[0]}, ${this.color[1]}, ${this.color[2]}]`);
    }

    initializeCapoPositions() {
        // Clamp to valid range
        const clampedLength = clamp(
            this.targetLengthMm,
            PHYSICS_CONSTANTS.MIN_PLAYABLE_LENGTH,
            PHYSICS_CONSTANTS.MAX_PLAYABLE_LENGTH
        );

        // Center in string
        const centerOfString = PHYSICS_CONSTANTS.FULL_STRING_LENGTH / 2;
        this.lowerCapoMm = centerOfString - (clampedLength / 2);
        this.upperCapoMm = centerOfString + (clampedLength / 2);

        // Ensure within bounds
        if (this.lowerCapoMm < PHYSICS_CONSTANTS.MIN_CAPO_DISTANCE) {
            this.lowerCapoMm = PHYSICS_CONSTANTS.MIN_CAPO_DISTANCE;
            this.upperCapoMm = this.lowerCapoMm + clampedLength;
        }

        if (this.upperCapoMm > PHYSICS_CONSTANTS.FULL_STRING_LENGTH - PHYSICS_CONSTANTS.MIN_CAPO_DISTANCE) {
            this.upperCapoMm = PHYSICS_CONSTANTS.FULL_STRING_LENGTH - PHYSICS_CONSTANTS.MIN_CAPO_DISTANCE;
            this.lowerCapoMm = this.upperCapoMm - clampedLength;
        }

        this.updateCalculations();
    }

    updateCalculations() {
        // If in draw mode, calculate length from 2D endpoints
        if (this.drawMode && this.startX !== null && this.endX !== null) {
            this.playableLengthMm = this.calculateDrawLength();
        } else {
            // Normal vertical mode
            this.playableLengthMm = this.upperCapoMm - this.lowerCapoMm;
        }

        this.actualFrequency = this.calculateFrequencyFromLength(this.playableLengthMm);
        this.actualMidiNote = frequencyToMidi(this.actualFrequency);
        this.noteName = midiToNoteName(this.actualMidiNote);
        this.centsDeviation = getCentsDeviation(this.actualMidiNote);

        this.playableLengthFeet = this.playableLengthMm / 304.8;
        this.lowerCapoFeet = this.lowerCapoMm / 304.8;
        this.upperCapoFeet = this.upperCapoMm / 304.8;
    }

    /**
     * Calculate string length from 2D endpoints (in draw mode)
     * Converts pixel distance to mm based on canvas height
     * @param {number} canvasHeight - Canvas height in pixels (optional, uses default if not provided)
     * @returns {number} - Length in mm
     */
    calculateDrawLength(canvasHeight) {
        if (!this.drawMode || this.startX === null || this.endX === null) {
            return this.playableLengthMm;
        }

        // Get Euclidean distance in pixels
        const dx = this.endX - this.startX;
        const dy = this.endY - this.startY;
        const pixelLength = Math.sqrt(dx * dx + dy * dy);

        // Convert to mm (scale based on canvas height representing full string length)
        // Assuming canvas height corresponds to FULL_STRING_LENGTH
        const heightReference = canvasHeight || VISUAL_CONSTANTS.CANVAS_HEIGHT;
        let lengthMm = pixelLength * (PHYSICS_CONSTANTS.FULL_STRING_LENGTH / heightReference);

        // Clamp to minimum playable length to avoid infinity frequency
        lengthMm = Math.max(lengthMm, PHYSICS_CONSTANTS.MIN_PLAYABLE_LENGTH);

        return lengthMm;
    }

    /**
     * Enable draw mode for this string
     * @param {number} startX - Starting X position in pixels
     * @param {number} startY - Starting Y position in pixels
     * @param {number} endX - Ending X position in pixels
     * @param {number} endY - Ending Y position in pixels
     */
    enableDrawMode(startX, startY, endX, endY) {
        this.drawMode = true;
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.updateCalculations();
        console.log(`String #${this.index + 1} enabled draw mode: (${startX},${startY}) → (${endX},${endY})`);
    }

    /**
     * Disable draw mode and revert to vertical mode
     */
    disableDrawMode() {
        this.drawMode = false;
        this.startX = null;
        this.startY = null;
        this.endX = null;
        this.endY = null;
        this.isDraggingStart = false;
        this.isDraggingEnd = false;
        this.initializeCapoPositions();
        console.log(`String #${this.index + 1} disabled draw mode`);
    }

    /**
     * Set draw mode endpoint positions
     * @param {number} startX - Start X
     * @param {number} startY - Start Y
     * @param {number} endX - End X
     * @param {number} endY - End Y
     */
    setDrawEndpoints(startX, startY, endX, endY) {
        if (!this.drawMode) return;

        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.updateCalculations();
    }

    setLowerCapoPosition(positionMm) {
        this.lowerCapoMm = clamp(
            positionMm,
            PHYSICS_CONSTANTS.MIN_CAPO_DISTANCE,
            this.upperCapoMm - PHYSICS_CONSTANTS.MIN_PLAYABLE_LENGTH
        );
        this.updateCalculations();
    }

    setUpperCapoPosition(positionMm) {
        const maxPos = PHYSICS_CONSTANTS.FULL_STRING_LENGTH - PHYSICS_CONSTANTS.MIN_CAPO_DISTANCE;
        this.upperCapoMm = clamp(
            positionMm,
            this.lowerCapoMm + PHYSICS_CONSTANTS.MIN_PLAYABLE_LENGTH,
            maxPos
        );
        this.updateCalculations();
    }

    async pluck(duration, velocity) {
        duration = duration || AUDIO_CONSTANTS.DEFAULT_DURATION;
        velocity = velocity || AUDIO_CONSTANTS.DEFAULT_VELOCITY;

        if (!audioEngine || !audioEngine.initialized) {
            console.warn("Audio not initialized");
            return;
        }

        audioEngine.pluckString(this.index, this.actualFrequency, duration, velocity);

        this.isPlaying = true;
        this.playingAmplitude = 1.0;

        setTimeout(() => {
            this.isPlaying = false;
        }, duration * 1000);
    }

    updatePlaying(deltaTime) {
        if (this.isPlaying) {
            this.playingAmplitude *= INTERACTION_CONSTANTS.VIBRATION_DECAY;
            if (this.playingAmplitude < INTERACTION_CONSTANTS.MIN_AMPLITUDE) {
                this.isPlaying = false;
                this.playingAmplitude = 0;
            }
        }
    }

    getStringData() {
        return {
            stringNumber: this.index + 1,
            index: this.index,
            noteName: this.noteName,
            frequency: this.actualFrequency.toFixed(2),
            midiNote: this.actualMidiNote.toFixed(2),
            midiNoteRounded: Math.round(this.actualMidiNote),
            centsDeviation: this.centsDeviation.toFixed(1),
            playableLengthMm: this.playableLengthMm.toFixed(0),
            playableLengthFeet: this.playableLengthFeet.toFixed(3),
            lowerCapoMm: this.lowerCapoMm.toFixed(1),
            upperCapoMm: this.upperCapoMm.toFixed(1),
            lowerCapoFeet: this.lowerCapoFeet.toFixed(3),
            upperCapoFeet: this.upperCapoFeet.toFixed(3),
            targetMidiNote: this.targetMidiNote,
            targetFrequency: this.targetFrequency.toFixed(2),
            material: this.material,
            gauge: this.gauge,
            tension: this.tension
        };
    }

    setStringData(data) {
        if (data.lowerCapoMm !== undefined) {
            this.lowerCapoMm = parseFloat(data.lowerCapoMm);
        }
        if (data.upperCapoMm !== undefined) {
            this.upperCapoMm = parseFloat(data.upperCapoMm);
        }
        if (data.targetMidiNote !== undefined) {
            this.targetMidiNote = data.targetMidiNote;
        }
        if (data.material !== undefined && data.gauge !== undefined && data.tension !== undefined) {
            this.setMaterial(data.material, data.gauge, data.tension);
        }
        this.updateCalculations();
    }
}

// Create chromatic strings starting from C2 (MIDI 36) spanning 6 octaves
function createChromaticStrings(numStrings, material, gauge, tension) {
    const strings = [];
    const startMidi = 36; // C2 (2nd octave)

    // Use defaults if not specified
    material = material || PHYSICS_CONSTANTS.DEFAULT_MATERIAL;
    gauge = gauge || PHYSICS_CONSTANTS.DEFAULT_GAUGE;
    tension = tension || PHYSICS_CONSTANTS.DEFAULT_TENSION;

    for (let i = 0; i < numStrings; i++) {
        const midiNote = startMidi + i;
        strings.push(new HarpString(i, numStrings, midiNote, material, gauge, tension));
    }

    const waveSpeed = PHYSICS_CONSTANTS.calculateWaveSpeed(material, gauge, tension);
    console.log("Created chromatic strings from MIDI " + startMidi + " to " + (startMidi + numStrings - 1));
    console.log("Range: " + midiToNoteName(startMidi) + " to " + midiToNoteName(startMidi + numStrings - 1));
    console.log(`Material: ${STRING_MATERIALS[material].name}, Gauge: ${STRING_GAUGES[gauge].name}, Tension: ${tension}N`);
    console.log(`Wave Speed: ${waveSpeed.toFixed(2)} m/s`);

    return strings;
}

function applyScale(strings, scaleName, rootMidi) {
    rootMidi = rootMidi || 36; // Default to C2

    const scale = SCALES[scaleName];
    if (!scale) {
        console.error("Unknown scale:", scaleName);
        return;
    }

    const intervals = scale.intervals;
    console.log("\n=== APPLYING SCALE: " + scale.name + " (Root: " + midiToNoteName(rootMidi) + " / MIDI " + rootMidi + ") ===");

    // Define playable MIDI range (typically 6 octaves)
    const OCTAVE_RANGE = 6; // 6 octaves = 72 semitones
    const maxMidi = rootMidi + (OCTAVE_RANGE * 12);

    strings.forEach((string, index) => {
        const scaleIndex = index % intervals.length;
        const octave = Math.floor(index / intervals.length);
        let targetMidi = rootMidi + intervals[scaleIndex] + (octave * 12);

        // Loop octaves to keep within playable range
        while (targetMidi >= maxMidi) {
            targetMidi -= (OCTAVE_RANGE * 12);
        }

        // Calculate new length using string's material properties
        const targetFreq = midiToFrequency(targetMidi);
        const idealLength = string.calculateLengthFromFrequency(targetFreq);

        // Validate playable length
        const isPlayable = idealLength >= PHYSICS_CONSTANTS.MIN_PLAYABLE_LENGTH &&
                          idealLength <= PHYSICS_CONSTANTS.MAX_PLAYABLE_LENGTH;

        if (!isPlayable) {
            console.warn("String " + (index + 1) + ": Length " + idealLength.toFixed(0) + "mm is outside playable range, clamping");
        }

        console.log("String " + (index + 1) + ": " + midiToNoteName(targetMidi) + " (MIDI " + targetMidi + ") = " +
                    targetFreq.toFixed(2) + "Hz → " + idealLength.toFixed(0) + "mm");

        // Update string
        string.targetMidiNote = targetMidi;
        string.targetFrequency = targetFreq;
        string.targetLengthMm = idealLength;

        // Reinitialize capos
        string.initializeCapoPositions();
    });

    console.log("=== SCALE APPLIED ===\n");
}

// Export to CSV
function exportToCSV(strings) {
    const headers = [
        'String Number',
        'Note Name',
        'Target MIDI',
        'Actual MIDI',
        'Frequency (Hz)',
        'Cents Deviation',
        'Playable Length (mm)',
        'Playable Length (ft)',
        'Lower Capo (mm)',
        'Upper Capo (mm)',
        'Lower Capo (ft)',
        'Upper Capo (ft)',
        'Material',
        'Gauge',
        'Tension (N)',
        'Draw Mode',
        'Draw Start X',
        'Draw Start Y',
        'Draw End X',
        'Draw End Y'
    ];

    const rows = strings.map(s => {
        const data = s.getStringData();
        return [
            data.stringNumber,
            data.noteName,
            data.targetMidiNote,
            data.midiNoteRounded,
            data.frequency,
            data.centsDeviation,
            data.playableLengthMm,
            data.playableLengthFeet,
            data.lowerCapoMm,
            data.upperCapoMm,
            data.lowerCapoFeet,
            data.upperCapoFeet,
            s.material,
            s.gauge,
            s.tension,
            s.drawMode,
            s.startX || '',
            s.startY || '',
            s.endX || '',
            s.endY || ''
        ];
    });

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.join(',') + '\n';
    });

    return csv;
}

function downloadCSV(strings) {
    const csv = exportToCSV(strings);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = 'wall-harp-strings-' + timestamp + '.csv';

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    console.log("CSV downloaded:", filename);
}

// Apply waveform pattern to capo positions
function applyWaveform(strings, waveformType, amplitude, offset) {
    const waveformFunc = WAVEFORMS[waveformType];
    if (!waveformFunc) {
        console.error("Unknown waveform:", waveformType);
        return;
    }

    amplitude = amplitude || 400; // mm
    offset = offset || PHYSICS_CONSTANTS.FULL_STRING_LENGTH / 2; // Center

    console.log("Applying waveform:", waveformType);

    strings.forEach((string, index) => {
        // Calculate capo position based on waveform
        const centerPosition = waveformFunc(index, strings.length, amplitude, offset);

        // Use a default playable length
        const playableLength = 500; // mm

        string.lowerCapoMm = centerPosition - playableLength / 2;
        string.upperCapoMm = centerPosition + playableLength / 2;

        // Clamp to valid range
        string.lowerCapoMm = clamp(
            string.lowerCapoMm,
            PHYSICS_CONSTANTS.MIN_CAPO_DISTANCE,
            PHYSICS_CONSTANTS.FULL_STRING_LENGTH - PHYSICS_CONSTANTS.MIN_CAPO_DISTANCE - playableLength
        );

        string.upperCapoMm = string.lowerCapoMm + playableLength;

        string.updateCalculations();
    });

    console.log("Waveform applied:", waveformType);
}

// Set string to specific note
function setStringToNote(string, noteName) {
    // Parse note name (e.g., "C4", "F#5")
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    const match = noteName.match(/^([A-G]#?)(\d+)$/i);
    if (!match) {
        console.error("Invalid note name:", noteName);
        return false;
    }

    const note = match[1].toUpperCase();
    const octave = parseInt(match[2]);

    const noteIndex = noteNames.indexOf(note);
    if (noteIndex === -1) {
        console.error("Invalid note:", note);
        return false;
    }

    const midiNote = (octave + 1) * 12 + noteIndex;

    // Update string
    string.targetMidiNote = midiNote;
    string.targetFrequency = midiToFrequency(midiNote);
    string.targetLengthMm = calculateLengthFromFrequency(string.targetFrequency);
    string.initializeCapoPositions();

    console.log("String " + (string.index + 1) + " set to " + noteName + " (MIDI " + midiNote + ")");
    return true;
}

// Set string to specific frequency
function setStringToFrequency(string, frequency) {
    if (frequency < 20 || frequency > 20000) {
        console.error("Invalid frequency:", frequency);
        return false;
    }

    string.targetFrequency = frequency;
    string.targetMidiNote = frequencyToMidi(frequency);
    string.targetLengthMm = calculateLengthFromFrequency(frequency);
    string.initializeCapoPositions();

    console.log("String " + (string.index + 1) + " set to " + frequency.toFixed(2) + " Hz");
    return true;
}

// Parse Scala (.scl) file format
function parseScalaFile(scalaText) {
    const lines = scalaText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('!'));

    if (lines.length < 2) {
        throw new Error("Invalid Scala file: too few lines");
    }

    const description = lines[0];
    const numNotes = parseInt(lines[1]);

    if (isNaN(numNotes) || numNotes < 1) {
        throw new Error("Invalid number of notes");
    }

    const intervals = [0]; // Start with unison (0 cents)

    for (let i = 2; i < Math.min(2 + numNotes, lines.length); i++) {
        const line = lines[i];

        if (line.includes('.')) {
            // Cents format (e.g., "100.0")
            intervals.push(parseFloat(line));
        } else if (line.includes('/')) {
            // Ratio format (e.g., "9/8")
            const [num, den] = line.split('/').map(x => parseFloat(x));
            const cents = 1200 * Math.log2(num / den);
            intervals.push(cents);
        } else {
            // Integer cents
            intervals.push(parseFloat(line));
        }
    }

    console.log("Scala scale loaded:", description, "with", intervals.length, "notes");
    return { description, intervals };
}

// Apply Scala scale to strings
function applyScalaScale(strings, scalaData, rootFreq) {
    rootFreq = rootFreq || 65.41; // Default to C2

    console.log("\n=== APPLYING SCALA SCALE: " + scalaData.description + " ===");
    console.log("Root frequency:", rootFreq.toFixed(2) + " Hz");

    const intervals = scalaData.intervals;

    strings.forEach((string, index) => {
        const scaleIndex = index % intervals.length;
        const octave = Math.floor(index / intervals.length);

        // Calculate frequency using cents
        const totalCents = intervals[scaleIndex] + (octave * 1200);
        const targetFreq = rootFreq * Math.pow(2, totalCents / 1200);

        // Update string
        string.targetFrequency = targetFreq;
        string.targetMidiNote = frequencyToMidi(targetFreq);
        string.targetLengthMm = calculateLengthFromFrequency(targetFreq);
        string.initializeCapoPositions();

        console.log("String " + (index + 1) + ": " + targetFreq.toFixed(2) + "Hz (" + totalCents.toFixed(1) + " cents)");
    });

    console.log("=== SCALA SCALE APPLIED ===\n");
}

// Shift string by semitones
function shiftStringSemitones(string, semitones) {
    const newMidi = string.targetMidiNote + semitones;
    string.targetMidiNote = newMidi;
    string.targetFrequency = midiToFrequency(newMidi);
    string.targetLengthMm = string.calculateLengthFromFrequency(string.targetFrequency);
    string.initializeCapoPositions();

    console.log("String " + (string.index + 1) + " shifted " + semitones + " semitones to " + midiToNoteName(newMidi));
}
