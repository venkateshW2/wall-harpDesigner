/**
 * WALL HARP SIMULATOR - SEQUENCER
 * Plays strings in sequence with adjustable tempo
 */

class Sequencer {
    constructor() {
        this.sequence = []; // Array of string indices
        this.tempo = 120; // BPM
        this.isPlaying = false;
        this.currentStep = 0;
        this.loopEnabled = false;
        this.intervalId = null;
        this.appReference = null; // Reference to main app
    }

    /**
     * Set reference to main app
     * @param {object} app - Main application instance
     */
    setApp(app) {
        this.appReference = app;
    }

    /**
     * Parse sequence string into array of string indices
     * @param {string} sequenceString - Comma-separated string numbers (1-based)
     * @returns {boolean} - True if valid
     */
    setSequence(sequenceString) {
        if (!sequenceString || sequenceString.trim() === '') {
            this.sequence = [];
            return false;
        }

        try {
            // Split by comma and parse to integers
            const numbers = sequenceString.split(',').map(s => parseInt(s.trim()));

            // Validate all numbers
            const invalid = numbers.filter(n => isNaN(n) || n < 1);
            if (invalid.length > 0) {
                console.error('Invalid string numbers:', invalid);
                return false;
            }

            // Convert to 0-based indices
            this.sequence = numbers.map(n => n - 1);
            console.log('Sequencer: Set sequence to', this.sequence.map(i => i + 1));
            return true;
        } catch (error) {
            console.error('Failed to parse sequence:', error);
            return false;
        }
    }

    /**
     * Set tempo in BPM
     * @param {number} bpm - Beats per minute
     */
    setTempo(bpm) {
        this.tempo = Math.max(40, Math.min(240, bpm));

        // If already playing, restart with new tempo
        if (this.isPlaying) {
            this.stop();
            this.play();
        }
    }

    /**
     * Enable or disable looping
     * @param {boolean} enabled - Loop enabled
     */
    setLoop(enabled) {
        this.loopEnabled = enabled;
        console.log('Sequencer: Loop', enabled ? 'ON' : 'OFF');
    }

    /**
     * Start playback
     */
    play() {
        if (!this.appReference) {
            console.error('Sequencer: No app reference set');
            return;
        }

        if (this.sequence.length === 0) {
            console.warn('Sequencer: No sequence set');
            return;
        }

        if (this.isPlaying) {
            console.warn('Sequencer: Already playing');
            return;
        }

        this.isPlaying = true;
        this.currentStep = 0;

        // Calculate interval in milliseconds
        // 60000 ms per minute / BPM = ms per beat
        const intervalMs = 60000 / this.tempo;

        console.log(`Sequencer: Playing ${this.sequence.length} steps at ${this.tempo} BPM (${intervalMs.toFixed(0)}ms per step)`);

        // Play first note immediately
        this._playStep();

        // Set up interval for subsequent notes
        this.intervalId = setInterval(() => {
            this._playStep();
        }, intervalMs);
    }

    /**
     * Stop playback
     */
    stop() {
        if (!this.isPlaying) {
            return;
        }

        this.isPlaying = false;
        this.currentStep = 0;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        console.log('Sequencer: Stopped');
    }

    /**
     * Play current step
     * @private
     */
    _playStep() {
        if (!this.appReference || !this.appReference.strings) {
            this.stop();
            return;
        }

        // Get string index for current step
        const stringIndex = this.sequence[this.currentStep];

        // Validate index
        if (stringIndex < 0 || stringIndex >= this.appReference.strings.length) {
            console.warn(`Sequencer: Invalid string index ${stringIndex + 1}`);
        } else {
            // Pluck the string
            const string = this.appReference.strings[stringIndex];
            string.pluck();
            console.log(`Sequencer: Step ${this.currentStep + 1}/${this.sequence.length} - String ${stringIndex + 1}`);
        }

        // Advance to next step
        this.currentStep++;

        // Check if sequence is complete
        if (this.currentStep >= this.sequence.length) {
            if (this.loopEnabled) {
                // Loop back to start
                this.currentStep = 0;
            } else {
                // Stop playback
                this.stop();
                console.log('Sequencer: Sequence complete');
            }
        }
    }

    /**
     * Get current playback state
     * @returns {object} - {isPlaying, currentStep, sequenceLength, tempo, loopEnabled}
     */
    getState() {
        return {
            isPlaying: this.isPlaying,
            currentStep: this.currentStep,
            sequenceLength: this.sequence.length,
            tempo: this.tempo,
            loopEnabled: this.loopEnabled
        };
    }
}

// Create global sequencer instance
const sequencer = new Sequencer();

// Export for ES6 modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Sequencer, sequencer };
}
