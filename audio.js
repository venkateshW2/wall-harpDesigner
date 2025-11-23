/**
 * WALL HARP SIMULATOR - AUDIO ENGINE
 * Enhanced harp sound with adjustable parameters
 */

class HarpAudioEngine {
    constructor() {
        this.initialized = false;
        this.synths = [];
        this.masterVolume = null;
        this.reverb = null;
        this.delay = null;
        this.chorus = null;
        this.filter = null;
        this.context = null;
        this.engineType = 'karplus'; // Current synthesis engine

        // Audio parameters (adjustable)
        this.params = {
            attackNoise: 1.5,
            dampening: 4000,
            resonance: 0.97,
            reverbDecay: 2.5,
            reverbWet: 0.4,
            delayTime: 0.15,
            delayWet: 0.15,
            chorusWet: 0.2,
            masterVolume: -6
        };

        // ADSR parameters
        this.adsrParams = {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.5,
            release: 1.0
        };

        // Filter parameters
        this.filterParams = {
            type: 'lowpass',
            frequency: 2000,
            Q: 1.0
        };
    }

    async initialize(numStrings) {
        numStrings = numStrings || 72;

        if (this.initialized) {
            console.log("Audio already initialized");
            return;
        }

        try {
            console.log("=== INITIALIZING HARP AUDIO ENGINE ===");

            await Tone.start();
            console.log("✓ Tone.js context started");

            // Create effects chain for rich harp sound
            this.masterVolume = new Tone.Volume(this.params.masterVolume).toDestination();

            // Reverb for spacious sound
            this.reverb = new Tone.Reverb({
                decay: this.params.reverbDecay,
                wet: this.params.reverbWet,
                preDelay: 0.01
            }).connect(this.masterVolume);

            await this.reverb.generate();
            console.log("✓ Reverb created (decay: " + this.params.reverbDecay + "s)");

            // Delay for shimmer
            this.delay = new Tone.FeedbackDelay({
                delayTime: this.params.delayTime,
                feedback: 0.3,
                wet: this.params.delayWet
            }).connect(this.reverb);
            console.log("✓ Delay created");

            // Subtle chorus for richness
            this.chorus = new Tone.Chorus({
                frequency: 1.5,
                delayTime: 3.5,
                depth: 0.5,
                wet: this.params.chorusWet
            }).connect(this.delay);
            this.chorus.start();
            console.log("✓ Chorus created");

            // Create pluck synths
            this.synths = [];
            for (let i = 0; i < numStrings; i++) {
                const synth = this.createHarpSynth();
                this.synths.push(synth);
            }
            console.log("✓ Created " + numStrings + " harp synths");

            this.initialized = true;
            this.updateStatusIndicator(true);
            this.updateAudioParamsUI();

            console.log("=== HARP AUDIO ENGINE READY ===");

            // Play test chord
            setTimeout(() => {
                this.playTestChord();
            }, 200);

        } catch (error) {
            console.error("❌ Failed to initialize audio:", error);
            this.updateStatusIndicator(false);
            throw error;
        }
    }

    createHarpSynth() {
        let synth;
        const connectionPoint = this.filter || this.chorus;

        switch (this.engineType) {
            case 'karplus':
                // Karplus-Strong physical modeling (default)
                synth = new Tone.PluckSynth({
                    attackNoise: this.params.attackNoise,
                    dampening: this.params.dampening,
                    resonance: this.params.resonance
                }).connect(connectionPoint);
                break;

            case 'piano':
                // Piano-like sound with rich harmonics
                synth = new Tone.Synth({
                    oscillator: { type: 'triangle' },
                    envelope: {
                        attack: this.adsrParams.attack,
                        decay: this.adsrParams.decay,
                        sustain: this.adsrParams.sustain,
                        release: this.adsrParams.release
                    }
                }).connect(connectionPoint);
                break;

            case 'sine':
                // Pure sine wave
                synth = new Tone.Synth({
                    oscillator: { type: 'sine' },
                    envelope: {
                        attack: this.adsrParams.attack,
                        decay: this.adsrParams.decay,
                        sustain: this.adsrParams.sustain,
                        release: this.adsrParams.release
                    }
                }).connect(connectionPoint);
                break;

            case 'saw':
                // Bright sawtooth
                synth = new Tone.Synth({
                    oscillator: { type: 'sawtooth' },
                    envelope: {
                        attack: this.adsrParams.attack,
                        decay: this.adsrParams.decay,
                        sustain: this.adsrParams.sustain,
                        release: this.adsrParams.release
                    }
                }).connect(connectionPoint);
                break;

            case 'square':
                // Hollow square wave
                synth = new Tone.Synth({
                    oscillator: { type: 'square' },
                    envelope: {
                        attack: this.adsrParams.attack,
                        decay: this.adsrParams.decay,
                        sustain: this.adsrParams.sustain,
                        release: this.adsrParams.release
                    }
                }).connect(connectionPoint);
                break;

            case 'triangle':
                // Soft triangle wave
                synth = new Tone.Synth({
                    oscillator: { type: 'triangle' },
                    envelope: {
                        attack: this.adsrParams.attack,
                        decay: this.adsrParams.decay,
                        sustain: this.adsrParams.sustain,
                        release: this.adsrParams.release
                    }
                }).connect(connectionPoint);
                break;

            default:
                // Fallback to Karplus-Strong
                synth = new Tone.PluckSynth({
                    attackNoise: this.params.attackNoise,
                    dampening: this.params.dampening,
                    resonance: this.params.resonance
                }).connect(connectionPoint);
        }

        return synth;
    }

    setEngineType(engineType) {
        console.log(`Switching audio engine to: ${engineType}`);
        this.engineType = engineType;

        if (!this.initialized) {
            console.log('Audio not initialized yet, engine will be set on init');
            return;
        }

        // Recreate all synths with new engine type
        const numStrings = this.synths.length;

        // Dispose old synths
        this.synths.forEach(synth => {
            try {
                synth.dispose();
            } catch (e) {
                console.warn('Error disposing synth:', e);
            }
        });

        // Create new synths
        this.synths = [];
        for (let i = 0; i < numStrings; i++) {
            const synth = this.createHarpSynth();
            this.synths.push(synth);
        }

        console.log(`✓ Recreated ${numStrings} synths with ${engineType} engine`);
    }

    pluckString(stringIndex, frequency, duration, velocity) {
        duration = duration || 4.0; // Longer for harp
        velocity = velocity || 0.7;

        if (!this.initialized) {
            console.warn("❌ Audio not initialized");
            return;
        }

        if (stringIndex < 0 || stringIndex >= this.synths.length) {
            console.error("❌ Invalid string index:", stringIndex);
            return;
        }

        if (!frequency || frequency < 20 || frequency > 20000) {
            console.error("❌ Invalid frequency:", frequency);
            return;
        }

        try {
            const now = Tone.now();
            this.synths[stringIndex].triggerAttackRelease(
                frequency,
                duration,
                now,
                velocity
            );

            console.log("♪ String " + (stringIndex + 1) + ": " + frequency.toFixed(2) + " Hz");

        } catch (error) {
            console.error("❌ Error playing string " + stringIndex + ":", error);
        }
    }

    playTestChord() {
        console.log("Playing harp test chord (C major)...");
        if (this.synths.length >= 3) {
            // Play C-E-G chord
            this.pluckString(0, 261.63, 3.0, 0.6); // C4
            setTimeout(() => this.pluckString(1, 329.63, 3.0, 0.5), 50); // E4
            setTimeout(() => this.pluckString(2, 392.00, 3.0, 0.5), 100); // G4
        }
    }

    async playSequence(stringIndices, frequencies, interval) {
        interval = interval || 0.15;

        for (let i = 0; i < stringIndices.length; i++) {
            this.pluckString(stringIndices[i], frequencies[i], 2.0);
            await new Promise(resolve => setTimeout(resolve, interval * 1000));
        }
    }

    playChord(stringIndices, frequencies, duration) {
        duration = duration || 3.0;
        stringIndices.forEach((stringIndex, i) => {
            setTimeout(() => {
                this.pluckString(stringIndex, frequencies[i], duration, 0.6);
            }, i * 30); // Slight stagger for natural harp sound
        });
    }

    stopAll() {
        if (!this.initialized) return;
        this.synths.forEach(synth => {
            try {
                synth.releaseAll();
            } catch (e) {}
        });
    }

    // Update audio parameters dynamically
    updateParams(newParams) {
        Object.assign(this.params, newParams);

        if (!this.initialized) return;

        // Update effects
        if (this.reverb && newParams.reverbDecay !== undefined) {
            this.reverb.decay = newParams.reverbDecay;
        }
        if (this.reverb && newParams.reverbWet !== undefined) {
            this.reverb.wet.value = newParams.reverbWet;
        }
        if (this.delay && newParams.delayTime !== undefined) {
            this.delay.delayTime.value = newParams.delayTime;
        }
        if (this.delay && newParams.delayWet !== undefined) {
            this.delay.wet.value = newParams.delayWet;
        }
        if (this.chorus && newParams.chorusWet !== undefined) {
            this.chorus.wet.value = newParams.chorusWet;
        }
        if (this.masterVolume && newParams.masterVolume !== undefined) {
            this.masterVolume.volume.value = newParams.masterVolume;
        }

        // Update synths
        if (newParams.attackNoise !== undefined ||
            newParams.dampening !== undefined ||
            newParams.resonance !== undefined) {

            this.synths.forEach(synth => {
                if (newParams.attackNoise !== undefined) {
                    synth.attackNoise = newParams.attackNoise;
                }
                if (newParams.dampening !== undefined) {
                    synth.dampening = newParams.dampening;
                }
                if (newParams.resonance !== undefined) {
                    synth.resonance = newParams.resonance;
                }
            });
        }

        console.log("Audio parameters updated:", this.params);
    }

    setVolume(volumeDb) {
        this.params.masterVolume = volumeDb;
        if (this.initialized && this.masterVolume) {
            this.masterVolume.volume.value = volumeDb;
        }
    }

    updateStatusIndicator(isActive) {
        const statusElement = document.getElementById('audioStatus');
        const statusText = statusElement ? statusElement.querySelector('.status-text') : null;

        if (statusElement && statusText) {
            if (isActive) {
                statusElement.classList.add('active');
                statusText.textContent = 'Active';
            } else {
                statusElement.classList.remove('active');
                statusText.textContent = 'Standby';
            }
        }
    }

    updateAudioParamsUI() {
        // Update UI sliders with current values
        const updateSlider = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        };

        updateSlider('reverbDecay', this.params.reverbDecay);
        updateSlider('reverbWet', this.params.reverbWet);
        updateSlider('attackNoise', this.params.attackNoise);
        updateSlider('dampening', this.params.dampening);
        updateSlider('resonance', this.params.resonance);
    }

    /**
     * Set ADSR envelope parameters
     * @param {Object} adsr - ADSR parameters {attack, decay, sustain, release}
     */
    setADSR(adsr) {
        // Store ADSR parameters
        if (adsr.attack !== undefined) {
            this.adsrParams.attack = adsr.attack;
        }
        if (adsr.decay !== undefined) {
            this.adsrParams.decay = adsr.decay;
        }
        if (adsr.sustain !== undefined) {
            this.adsrParams.sustain = adsr.sustain;
        }
        if (adsr.release !== undefined) {
            this.adsrParams.release = adsr.release;
        }

        if (!this.initialized) {
            return;
        }

        // Update existing synths that support envelope parameters
        this.synths.forEach(synth => {
            if (synth.envelope) {
                if (adsr.attack !== undefined) {
                    synth.envelope.attack = adsr.attack;
                }
                if (adsr.decay !== undefined) {
                    synth.envelope.decay = adsr.decay;
                }
                if (adsr.sustain !== undefined) {
                    synth.envelope.sustain = adsr.sustain;
                }
                if (adsr.release !== undefined) {
                    synth.envelope.release = adsr.release;
                }
            }
        });

        console.log('ADSR updated:', this.adsrParams);
    }

    /**
     * Set filter parameters
     * @param {Object} filterParams - Filter parameters {type, frequency, Q}
     */
    setFilter(filterParams) {
        // Store filter parameters
        if (filterParams.type !== undefined) {
            this.filterParams.type = filterParams.type;
        }
        if (filterParams.frequency !== undefined) {
            this.filterParams.frequency = filterParams.frequency;
        }
        if (filterParams.Q !== undefined) {
            this.filterParams.Q = filterParams.Q;
        }

        if (!this.initialized) {
            return;
        }

        // Create filter if it doesn't exist
        if (!this.filter) {
            this.filter = new Tone.Filter({
                type: this.filterParams.type,
                frequency: this.filterParams.frequency,
                Q: this.filterParams.Q
            });

            // Insert filter into audio chain (between synths and chorus)
            this.synths.forEach(synth => {
                synth.disconnect();
                synth.connect(this.filter);
            });
            this.filter.connect(this.chorus);
            console.log('Filter created and inserted into audio chain');
        } else {
            // Update existing filter parameters
            if (filterParams.type !== undefined) {
                this.filter.type = filterParams.type;
            }
            if (filterParams.frequency !== undefined) {
                this.filter.frequency.value = filterParams.frequency;
            }
            if (filterParams.Q !== undefined) {
                this.filter.Q.value = filterParams.Q;
            }
        }

        console.log('Filter updated:', this.filterParams);
    }

    dispose() {
        if (!this.initialized) return;
        this.synths.forEach(synth => synth.dispose());
        if (this.chorus) this.chorus.dispose();
        if (this.delay) this.delay.dispose();
        if (this.reverb) this.reverb.dispose();
        if (this.masterVolume) this.masterVolume.dispose();
        this.initialized = false;
        this.updateStatusIndicator(false);
    }
}

let audioEngine = null;

async function initAudio(numStrings) {
    numStrings = numStrings || 72;

    if (!audioEngine) {
        audioEngine = new HarpAudioEngine();
    }

    await audioEngine.initialize(numStrings);
    return audioEngine;
}

async function testAudioSystem() {
    console.log("=== AUDIO TEST ===");

    try {
        if (!audioEngine || !audioEngine.initialized) {
            await initAudio(12);
        }

        // Play harp arpeggio
        const testFreqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];

        for (let i = 0; i < testFreqs.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 300));
            audioEngine.pluckString(i, testFreqs[i], 2.0);
        }

        console.log("✓ Audio test completed");

    } catch (error) {
        console.error("❌ Audio test failed:", error);
    }
}
