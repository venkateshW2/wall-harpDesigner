/**
 * WALL HARP SIMULATOR - PHYSICS ENGINE
 * String physics calculations based on wave equation: f = v / (2L)
 */

/**
 * Calculate frequency from string length using wave equation
 * Formula: f = v / (2L)
 * NOTE: This uses default material properties for testing only
 */
function calculateFrequencyFromLength(lengthMm, material, gauge, tension) {
    material = material || PHYSICS_CONSTANTS.DEFAULT_MATERIAL;
    gauge = gauge || PHYSICS_CONSTANTS.DEFAULT_GAUGE;
    tension = tension || PHYSICS_CONSTANTS.DEFAULT_TENSION;

    const waveSpeed = PHYSICS_CONSTANTS.calculateWaveSpeed(material, gauge, tension);
    const lengthM = lengthMm / 1000;
    const frequency = waveSpeed / (2 * lengthM);
    return frequency;
}

/**
 * Calculate string length from target frequency
 * Formula: L = v / (2f)
 * NOTE: This uses default material properties for testing only
 */
function calculateLengthFromFrequency(frequency, material, gauge, tension) {
    material = material || PHYSICS_CONSTANTS.DEFAULT_MATERIAL;
    gauge = gauge || PHYSICS_CONSTANTS.DEFAULT_GAUGE;
    tension = tension || PHYSICS_CONSTANTS.DEFAULT_TENSION;

    const waveSpeed = PHYSICS_CONSTANTS.calculateWaveSpeed(material, gauge, tension);
    const lengthM = waveSpeed / (2 * frequency);
    return lengthM * 1000; // Convert to mm
}

/**
 * Convert frequency to MIDI note number
 */
function frequencyToMidi(frequency) {
    return 69 + 12 * Math.log2(frequency / 440);
}

/**
 * Convert MIDI note to frequency
 */
function midiToFrequency(midiNote) {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Convert MIDI note to note name
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
 */
function getCentsDeviation(midiNote) {
    const rounded = Math.round(midiNote);
    const cents = (midiNote - rounded) * 100;
    return cents;
}

/**
 * Get detailed note info
 */
function getDetailedNoteInfo(midiNote) {
    const noteName = midiToNoteName(midiNote);
    const cents = getCentsDeviation(midiNote);
    const isInTune = Math.abs(cents) < 5;

    return { noteName, cents, isInTune };
}

/**
 * Clamp value between min and max
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Test physics calculations
 */
function runPhysicsTests() {
    console.log("=== PHYSICS TESTS ===");

    let passed = 0;
    let failed = 0;

    // Test 1: 1000mm should give ~114.8 Hz
    const freq1000 = calculateFrequencyFromLength(1000);
    if (Math.abs(freq1000 - 114.8) < 0.5) {
        console.log("✓ Test 1 PASSED: 1000mm = " + freq1000.toFixed(2) + " Hz");
        passed++;
    } else {
        console.error("✗ Test 1 FAILED: 1000mm = " + freq1000.toFixed(2) + " Hz (expected ~114.8)");
        failed++;
    }

    // Test 2: 500mm should give ~229.6 Hz (double frequency)
    const freq500 = calculateFrequencyFromLength(500);
    if (Math.abs(freq500 - 229.6) < 1) {
        console.log("✓ Test 2 PASSED: 500mm = " + freq500.toFixed(2) + " Hz");
        passed++;
    } else {
        console.error("✗ Test 2 FAILED: 500mm = " + freq500.toFixed(2) + " Hz (expected ~229.6)");
        failed++;
    }

    // Test 3: C4 (261.63 Hz) should need ~438mm
    const lengthC4 = calculateLengthFromFrequency(261.63);
    if (Math.abs(lengthC4 - 438) < 5) {
        console.log("✓ Test 3 PASSED: C4 needs " + lengthC4.toFixed(0) + " mm");
        passed++;
    } else {
        console.error("✗ Test 3 FAILED: C4 needs " + lengthC4.toFixed(0) + " mm (expected ~438)");
        failed++;
    }

    // Test 4: MIDI conversion round-trip
    const testMidi = 60;
    const freq = midiToFrequency(testMidi);
    const backToMidi = frequencyToMidi(freq);
    if (Math.abs(backToMidi - testMidi) < 0.01) {
        console.log("✓ Test 4 PASSED: MIDI round-trip");
        passed++;
    } else {
        console.error("✗ Test 4 FAILED: MIDI round-trip");
        failed++;
    }

    // Test 5: Note names
    if (midiToNoteName(60) === "C4" && midiToNoteName(69) === "A4") {
        console.log("✓ Test 5 PASSED: Note names correct");
        passed++;
    } else {
        console.error("✗ Test 5 FAILED: Note names incorrect");
        failed++;
    }

    console.log("\nResults: " + passed + "/" + (passed + failed) + " passed");

    if (failed === 0) {
        console.log("✓ ALL TESTS PASSED!");
    } else {
        console.error("✗ SOME TESTS FAILED");
    }

    return failed === 0;
}
