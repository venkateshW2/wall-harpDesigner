/**
 * WALL HARP SIMULATOR - UI CONTROLS
 * Event handlers and UI update functions
 */

/**
 * Update the information panel with current string data
 *
 * @param {HarpString} string - String to display info for
 * @param {number} selectionCount - Number of strings selected (optional)
 */
function updateInfoPanel(string, selectionCount = 1) {
    if (!string) return;

    // Update selection count
    const selectionCountElement = document.getElementById('selectionCount');
    if (selectionCountElement) {
        selectionCountElement.textContent = selectionCount === 1
            ? '1 string selected'
            : `${selectionCount} strings selected`;
    }

    const data = string.getStringData();

    // Update DOM elements safely
    const updateElement = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    updateElement('stringNumber', data.stringNumber);
    updateElement('currentNote', data.noteName);
    updateElement('currentFreq', data.frequency + ' Hz');
    updateElement('midiNote', data.midiNoteRounded + ' (' + data.noteName + ')');
    updateElement('playableLength', data.playableLengthMm + ' mm (' + data.playableLengthFeet + ' ft)');
    updateElement('lowerCapo', data.lowerCapoMm + ' mm (' + data.lowerCapoFeet + ' ft)');
    updateElement('upperCapo', data.upperCapoMm + ' mm (' + data.upperCapoFeet + ' ft)');

    // Update tuning status with color
    const centsElement = document.getElementById('centsDeviation');
    if (centsElement) {
        const cents = parseFloat(data.centsDeviation);
        const tuningText = cents > 0 ? '+' + cents.toFixed(1) + ' cents' : cents.toFixed(1) + ' cents';
        centsElement.textContent = tuningText;

        // Color based on how in-tune it is
        if (Math.abs(cents) < 5) {
            centsElement.style.color = '#00ff00'; // Green - in tune
        } else if (Math.abs(cents) < 10) {
            centsElement.style.color = '#ffff00'; // Yellow - slightly off
        } else {
            centsElement.style.color = '#ff0000'; // Red - out of tune
        }
    }

    // Update per-string material controls - ONLY update if not currently being edited
    // This prevents the dropdown from resetting while the user is trying to change it
    const selectedStringMaterial = document.getElementById('selectedStringMaterial');
    const selectedStringGauge = document.getElementById('selectedStringGauge');
    const selectedStringTension = document.getElementById('selectedStringTension');
    const selectedStringTensionValue = document.getElementById('selectedStringTensionValue');

    // Don't reset dropdowns if they have focus (user is actively editing them)
    if (selectedStringMaterial && document.activeElement !== selectedStringMaterial) {
        selectedStringMaterial.value = string.material;
    }
    if (selectedStringGauge && document.activeElement !== selectedStringGauge) {
        selectedStringGauge.value = string.gauge;
    }
    if (selectedStringTension && document.activeElement !== selectedStringTension) {
        selectedStringTension.value = string.tension;
        if (selectedStringTensionValue) {
            selectedStringTensionValue.textContent = string.tension + ' N';
        }
    }
}

/**
 * Initialize all UI event listeners
 *
 * @param {object} app - Main application instance
 */
function initializeUIControls(app) {
    // Wall dimensions controls
    const wallWidth = document.getElementById('wallWidth');
    const wallHeight = document.getElementById('wallHeight');
    const wallWidthValue = document.getElementById('wallWidthValue');
    const wallHeightValue = document.getElementById('wallHeightValue');
    const applyWallDimensions = document.getElementById('applyWallDimensions');
    const maxStringsValue = document.getElementById('maxStringsValue');
    const stringSpacingValue = document.getElementById('stringSpacingValue');
    const toggleReverseCapo = document.getElementById('toggleReverseCapo');
    const reverseCapoStatus = document.getElementById('reverseCapoStatus');

    if (wallWidth && wallWidthValue) {
        wallWidth.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            wallWidthValue.textContent = value.toFixed(1) + ' ft';
        });
    }

    if (wallHeight && wallHeightValue) {
        wallHeight.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            wallHeightValue.textContent = value.toFixed(1) + ' ft';
        });
    }

    if (applyWallDimensions && wallWidth && wallHeight) {
        applyWallDimensions.addEventListener('click', () => {
            const width = parseFloat(wallWidth.value);
            const height = parseFloat(wallHeight.value);
            app.setWallDimensions(width, height);

            // Update display values
            if (maxStringsValue) {
                maxStringsValue.textContent = app.calculateMaxStrings();
            }
            if (stringSpacingValue) {
                stringSpacingValue.textContent = app.getStringSpacing().toFixed(1) + ' mm';
            }
        });
    }

    if (toggleReverseCapo) {
        toggleReverseCapo.addEventListener('click', () => {
            app.toggleReverseCapoMode();

            // Update status display
            if (reverseCapoStatus) {
                const statusValue = reverseCapoStatus.querySelector('.status-value');
                if (statusValue) {
                    statusValue.textContent = app.reverseCapoMode ? 'ON' : 'OFF';
                    statusValue.style.color = app.reverseCapoMode ? '#00ff00' : '#666';
                }
            }
        });
    }

    // Audio initialization button
    const initAudioBtn = document.getElementById('initAudio');
    if (initAudioBtn) {
        initAudioBtn.addEventListener('click', async () => {
            try {
                await audioEngine.initialize(app.strings.length);
                console.log("Audio system initialized successfully");
            } catch (error) {
                console.error("Failed to initialize audio:", error);
                alert("Failed to initialize audio. Please check console for details.");
            }
        });
    }

    // String count slider
    const stringCountSlider = document.getElementById('stringCount');
    const stringCountValue = document.getElementById('stringCountValue');
    if (stringCountSlider && stringCountValue) {
        stringCountSlider.addEventListener('input', (e) => {
            const count = parseInt(e.target.value);
            stringCountValue.textContent = count;
            app.setStringCount(count);
        });
    }

    // Mode buttons
    const modeButtons = document.querySelectorAll('.mode-btn');
    const drawModeControls = document.getElementById('drawModeControls');

    modeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.target.dataset.mode;
            app.setMode(mode);

            // Update button states
            modeButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Show/hide draw mode controls
            if (drawModeControls) {
                if (mode === 'draw') {
                    drawModeControls.classList.remove('collapsed');
                } else {
                    drawModeControls.classList.add('collapsed');
                }
            }
        });
    });

    // Quantize Pitch button
    const quantizePitchBtn = document.getElementById('quantizePitch');
    if (quantizePitchBtn) {
        quantizePitchBtn.addEventListener('click', () => {
            const scaleFilter = document.getElementById('drawScaleFilter')?.value || 'none';
            const rootNote = parseInt(document.getElementById('drawRootNote')?.value || '48');

            // Get selected strings
            const selectedStrings = app.interactionManager.getSelectedStrings();

            if (selectedStrings.length === 0) {
                showNotification('No strings selected for quantization', 'warning');
                return;
            }

            let quantizedCount = 0;
            selectedStrings.forEach(string => {
                if (quantizeStringPitch(string, scaleFilter, rootNote)) {
                    quantizedCount++;
                }
            });

            if (quantizedCount > 0) {
                showNotification(`Quantized ${quantizedCount} string(s) to perfect pitch`, 'success');
                app.redraw();
            } else {
                showNotification('No strings could be quantized', 'warning');
            }
        });
    }

    // Scale preset buttons (both old and new class names)
    const presetButtons = document.querySelectorAll('.preset-btn, .preset-item');
    presetButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const scale = e.target.dataset.scale;
            const rootNoteSelect = document.getElementById('rootNoteSelect');
            const rootMidi = rootNoteSelect ? parseInt(rootNoteSelect.value) : 36;
            app.applyScalePreset(scale, rootMidi);
        });
    });

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // CSV Export button
    const exportCSVBtn = document.getElementById('exportCSV');
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', () => {
            downloadCSV(app.strings);
            showNotification('CSV exported successfully', 'success');
        });
    }

    // JSON Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            downloadConfiguration(app.strings);
        });
    }

    // Import button
    const importBtn = document.getElementById('importBtn');
    const fileInput = document.getElementById('fileInput');

    if (importBtn && fileInput) {
        importBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                try {
                    const success = await loadConfigurationFromFile(e.target.files[0], app.strings);
                    if (success) {
                        app.updateUI();
                        console.log("Configuration imported successfully");
                    } else {
                        alert("Failed to import configuration. Check console for details.");
                    }
                } catch (error) {
                    console.error("Import error:", error);
                    alert("Error importing configuration: " + error.message);
                }
                // Reset file input
                fileInput.value = '';
            }
        });
    }

    // Zoom controls
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const resetViewBtn = document.getElementById('resetView');

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            if (app) {
                app.zoom = clamp(app.zoom + 0.2, VISUAL_CONSTANTS.MIN_ZOOM, VISUAL_CONSTANTS.MAX_ZOOM);
            }
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            if (app) {
                app.zoom = clamp(app.zoom - 0.2, VISUAL_CONSTANTS.MIN_ZOOM, VISUAL_CONSTANTS.MAX_ZOOM);
            }
        });
    }

    if (resetViewBtn) {
        resetViewBtn.addEventListener('click', () => {
            if (app) app.resetZoom();
        });
    }

    // Audio parameter controls
    const reverbDecaySlider = document.getElementById('reverbDecay');
    const reverbWetSlider = document.getElementById('reverbWet');
    const attackNoiseSlider = document.getElementById('attackNoise');
    const resonanceSlider = document.getElementById('resonance');

    if (reverbDecaySlider) {
        reverbDecaySlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('reverbDecayVal').textContent = value.toFixed(1) + 's';
            if (audioEngine && audioEngine.initialized) {
                audioEngine.updateParams({ reverbDecay: value });
            }
        });
    }

    if (reverbWetSlider) {
        reverbWetSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('reverbWetVal').textContent = Math.round(value * 100) + '%';
            if (audioEngine && audioEngine.initialized) {
                audioEngine.updateParams({ reverbWet: value });
            }
        });
    }

    if (attackNoiseSlider) {
        attackNoiseSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('attackNoiseVal').textContent = value.toFixed(1);
            if (audioEngine && audioEngine.initialized) {
                audioEngine.updateParams({ attackNoise: value });
            }
        });
    }

    if (resonanceSlider) {
        resonanceSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('resonanceVal').textContent = value.toFixed(2);
            if (audioEngine && audioEngine.initialized) {
                audioEngine.updateParams({ resonance: value });
            }
        });
    }

    // Note/Frequency input
    const noteInput = document.getElementById('noteInput');
    const applyNoteBtn = document.getElementById('applyNote');

    if (applyNoteBtn && noteInput) {
        applyNoteBtn.addEventListener('click', () => {
            const input = noteInput.value.trim();
            if (!input) {
                showNotification('Please enter a note or frequency', 'error');
                return;
            }

            const selectedString = app.interactionManager.getSelectedString();
            if (!selectedString) {
                showNotification('Please select a string first', 'error');
                return;
            }

            // Check if input is a number (frequency) or note name
            const isNumber = !isNaN(parseFloat(input)) && isFinite(input);

            let success = false;
            if (isNumber) {
                success = setStringToFrequency(selectedString, parseFloat(input));
            } else {
                success = setStringToNote(selectedString, input);
            }

            if (success) {
                app.updateUI();
                showNotification('String tuned to ' + input, 'success');
                noteInput.value = '';
            } else {
                showNotification('Invalid note/frequency format', 'error');
            }
        });

        // Allow Enter key to apply
        noteInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyNoteBtn.click();
            }
        });
    }

    // Waveform generator
    const waveformType = document.getElementById('waveformType');
    const waveAmplitude = document.getElementById('waveAmplitude');
    const waveAmplitudeVal = document.getElementById('waveAmplitudeVal');
    const applyWaveformBtn = document.getElementById('applyWaveform');

    if (waveAmplitude && waveAmplitudeVal) {
        waveAmplitude.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            waveAmplitudeVal.textContent = value + 'mm';
        });
    }

    if (applyWaveformBtn && waveformType && waveAmplitude) {
        applyWaveformBtn.addEventListener('click', () => {
            const type = waveformType.value;
            const amplitude = parseInt(waveAmplitude.value);

            applyWaveform(app.strings, type, amplitude);
            app.updateUI();
            showNotification('Applied ' + type + ' waveform pattern', 'success');
        });
    }

    // Semitone adjustment buttons
    const semitoneUpBtn = document.getElementById('semitoneUp');
    const semitoneDownBtn = document.getElementById('semitoneDown');
    const octaveUpBtn = document.getElementById('octaveUp');
    const octaveDownBtn = document.getElementById('octaveDown');

    if (semitoneUpBtn) {
        semitoneUpBtn.addEventListener('click', () => {
            const selectedString = app.interactionManager.getSelectedString();
            if (!selectedString) {
                showNotification('Please select a string first', 'error');
                return;
            }

            shiftStringSemitones(selectedString, 1);
            app.updateUI();
            selectedString.pluck(0.7, 0.4);
            showNotification('String shifted +1 semitone', 'success');
        });
    }

    if (semitoneDownBtn) {
        semitoneDownBtn.addEventListener('click', () => {
            const selectedString = app.interactionManager.getSelectedString();
            if (!selectedString) {
                showNotification('Please select a string first', 'error');
                return;
            }

            shiftStringSemitones(selectedString, -1);
            app.updateUI();
            selectedString.pluck(0.7, 0.4);
            showNotification('String shifted -1 semitone', 'success');
        });
    }

    if (octaveUpBtn) {
        octaveUpBtn.addEventListener('click', () => {
            const selectedString = app.interactionManager.getSelectedString();
            if (!selectedString) {
                showNotification('Please select a string first', 'error');
                return;
            }

            shiftStringSemitones(selectedString, 12);
            app.updateUI();
            selectedString.pluck(0.8, 0.5);
            showNotification('String shifted +1 OCTAVE (12 semitones)', 'success');
        });
    }

    if (octaveDownBtn) {
        octaveDownBtn.addEventListener('click', () => {
            const selectedString = app.interactionManager.getSelectedString();
            if (!selectedString) {
                showNotification('Please select a string first', 'error');
                return;
            }

            shiftStringSemitones(selectedString, -12);
            app.updateUI();
            selectedString.pluck(0.8, 0.5);
            showNotification('String shifted -1 OCTAVE (12 semitones)', 'success');
        });
    }

    // SCL Library dropdown
    const sclLibrarySelect = document.getElementById('sclLibrarySelect');
    const applySclFile = document.getElementById('applySclFile');

    // Populate SCL library dropdown
    if (sclLibrarySelect) {
        // Curated list of SCL files from the scl folder
        const sclFiles = [
            // Equal divisions
            '05-19.scl', '05-22.scl', '05-24.scl', '06-41.scl', '07-19.scl',
            '07-31.scl', '07-37.scl', '08-11.scl', '08-13.scl', '08-19.scl',
            '09-19.scl', '09-22.scl', '09-23.scl', '09-29.scl',

            // Bohlen-Pierce scales
            'bohlen-p.scl', 'bohlen-eg.scl', 'bohlen5.scl',
            'bohlen_pyth.scl', 'bohlen_mean.scl', 'bohlen_harm.scl',

            // Meantone variants
            'meantone-fifths11.scl', 'meantone19trans37.scl', 'meantone31trans37.scl'
        ];

        sclFiles.forEach(file => {
            const option = document.createElement('option');
            option.value = file;
            option.textContent = file.replace('.scl', '').toUpperCase();
            sclLibrarySelect.appendChild(option);
        });
    }

    if (applySclFile && sclLibrarySelect) {
        applySclFile.addEventListener('click', async () => {
            const selectedFile = sclLibrarySelect.value;
            if (!selectedFile) {
                showNotification('Please select an SCL file', 'error');
                return;
            }

            try {
                // Fetch the SCL file
                const response = await fetch('scl/' + selectedFile);
                if (!response.ok) {
                    // Try root directory
                    const response2 = await fetch(selectedFile);
                    if (!response2.ok) {
                        throw new Error('Failed to load SCL file');
                    }
                    const scalaText = await response2.text();
                    const scalaData = parseScalaFile(scalaText);
                    applyScalaScale(app.strings, scalaData, 65.41);
                    app.updateUI();
                    showNotification('Loaded: ' + scalaData.description, 'success', 4000);
                } else {
                    const scalaText = await response.text();
                    const scalaData = parseScalaFile(scalaText);
                    applyScalaScale(app.strings, scalaData, 65.41);
                    app.updateUI();
                    showNotification('Loaded: ' + scalaData.description, 'success', 4000);
                }
            } catch (error) {
                console.error('SCL load error:', error);
                showNotification('Failed to load SCL file: ' + error.message, 'error');
            }
        });
    }

    // Scala file import
    const importScalaBtn = document.getElementById('importScala');
    const scalaFileInput = document.getElementById('scalaFileInput');

    if (importScalaBtn && scalaFileInput) {
        importScalaBtn.addEventListener('click', () => {
            scalaFileInput.click();
        });

        scalaFileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();

                reader.onload = (evt) => {
                    try {
                        const scalaText = evt.target.result;
                        const scalaData = parseScalaFile(scalaText);

                        // Apply to all strings with default root frequency (C2 = 65.41 Hz)
                        applyScalaScale(app.strings, scalaData, 65.41);
                        app.updateUI();

                        showNotification('Scala scale loaded: ' + scalaData.description, 'success', 4000);
                    } catch (error) {
                        console.error('Scala import error:', error);
                        showNotification('Failed to load Scala file: ' + error.message, 'error');
                    }

                    scalaFileInput.value = '';
                };

                reader.readAsText(file);
            }
        });
    }

    // Theme toggle - initialize with saved theme
    const themeDarkBtn = document.getElementById('themeDark');
    const themeLightBtn = document.getElementById('themeLight');

    if (themeDarkBtn && themeLightBtn) {
        // Set initial state based on current theme
        const currentTheme = getTheme();
        if (currentTheme === 'dark') {
            themeDarkBtn.classList.add('active');
            themeLightBtn.classList.remove('active');
        } else {
            themeLightBtn.classList.add('active');
            themeDarkBtn.classList.remove('active');
        }

        themeDarkBtn.addEventListener('click', () => {
            setTheme('dark');
            themeDarkBtn.classList.add('active');
            themeLightBtn.classList.remove('active');
            showNotification('DARK THEME', 'info');

            // Force redraw
            if (app) app.forceRedraw();
        });

        themeLightBtn.addEventListener('click', () => {
            setTheme('light');
            themeLightBtn.classList.add('active');
            themeDarkBtn.classList.remove('active');
            showNotification('LIGHT THEME', 'info');

            // Force redraw
            if (app) app.forceRedraw();
        });
    }

    // Collapsible sections
    document.querySelectorAll('.section-title').forEach(title => {
        title.addEventListener('click', () => {
            title.parentElement.classList.toggle('collapsed');
        });
    });

    // Material selection
    const stringMaterial = document.getElementById('stringMaterial');
    const stringGauge = document.getElementById('stringGauge');
    const stringTension = document.getElementById('stringTension');
    const tensionValue = document.getElementById('tensionValue');
    const applyMaterial = document.getElementById('applyMaterial');
    const materialInfo = document.getElementById('materialInfo');

    if (stringTension && tensionValue) {
        stringTension.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            tensionValue.textContent = value + ' N';
        });
    }

    if (applyMaterial && stringMaterial && stringGauge && stringTension) {
        applyMaterial.addEventListener('click', () => {
            const material = stringMaterial.value;
            const gauge = stringGauge.value;
            const tension = parseInt(stringTension.value);

            // Update app material properties
            if (app) {
                app.setMaterialProperties(material, gauge, tension);

                const gaugeName = STRING_GAUGES[gauge].name;
                const diameter = STRING_GAUGES[gauge].diameter;
                const matName = STRING_MATERIALS[material].name;

                if (materialInfo) {
                    materialInfo.textContent = `${matName.toUpperCase()} ${diameter}mm @ ${tension}N`;
                }

                showNotification(`Applied ${matName} ${gaugeName} @ ${tension}N`, 'success');
            }
        });
    }

    // Audio engine selection
    const audioEngineSelect = document.getElementById('audioEngine');
    if (audioEngineSelect) {
        audioEngineSelect.addEventListener('change', (e) => {
            if (app) {
                app.setAudioEngine(e.target.value);
                const engineName = e.target.options[e.target.selectedIndex].text;
                showNotification(`Audio Engine: ${engineName}`, 'info');
            }
        });
    }

    // ADSR envelope controls
    const attackTime = document.getElementById('attackTime');
    const attackValue = document.getElementById('attackValue');
    const decayTime = document.getElementById('decayTime');
    const decayValue = document.getElementById('decayValue');
    const sustainLevel = document.getElementById('sustainLevel');
    const sustainValue = document.getElementById('sustainValue');
    const releaseTime = document.getElementById('releaseTime');
    const releaseValue = document.getElementById('releaseValue');

    if (attackTime && attackValue) {
        attackTime.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) / 1000;
            attackValue.textContent = value.toFixed(3) + ' s';
            if (audioEngine && audioEngine.initialized) {
                audioEngine.setADSR({attack: value});
            }
        });
    }

    if (decayTime && decayValue) {
        decayTime.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) / 1000;
            decayValue.textContent = value.toFixed(2) + ' s';
            if (audioEngine && audioEngine.initialized) {
                audioEngine.setADSR({decay: value});
            }
        });
    }

    if (sustainLevel && sustainValue) {
        sustainLevel.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) / 100;
            sustainValue.textContent = value.toFixed(2);
            if (audioEngine && audioEngine.initialized) {
                audioEngine.setADSR({sustain: value});
            }
        });
    }

    if (releaseTime && releaseValue) {
        releaseTime.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) / 1000;
            releaseValue.textContent = value.toFixed(2) + ' s';
            if (audioEngine && audioEngine.initialized) {
                audioEngine.setADSR({release: value});
            }
        });
    }

    // Filter controls
    const filterType = document.getElementById('filterType');
    const filterFrequency = document.getElementById('filterFrequency');
    const filterFreqValue = document.getElementById('filterFreqValue');
    const filterQ = document.getElementById('filterQ');
    const filterQValue = document.getElementById('filterQValue');

    if (filterType) {
        filterType.addEventListener('change', (e) => {
            if (audioEngine && audioEngine.initialized) {
                audioEngine.setFilter({type: e.target.value});
                showNotification(`Filter: ${e.target.options[e.target.selectedIndex].text}`, 'info');
            }
        });
    }

    if (filterFrequency && filterFreqValue) {
        filterFrequency.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            filterFreqValue.textContent = value + ' Hz';
            if (audioEngine && audioEngine.initialized) {
                audioEngine.setFilter({frequency: value});
            }
        });
    }

    if (filterQ && filterQValue) {
        filterQ.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            filterQValue.textContent = value.toFixed(1);
            if (audioEngine && audioEngine.initialized) {
                audioEngine.setFilter({Q: value});
            }
        });
    }

    // Per-string material controls
    const selectedStringMaterial = document.getElementById('selectedStringMaterial');
    const selectedStringGauge = document.getElementById('selectedStringGauge');
    const selectedStringTension = document.getElementById('selectedStringTension');
    const selectedStringTensionValue = document.getElementById('selectedStringTensionValue');
    const applySelectedStringMaterial = document.getElementById('applySelectedStringMaterial');
    const applyAllStringsMaterial = document.getElementById('applyAllStringsMaterial');

    // Cache user's selections to prevent them from being overwritten by updateInfoPanel
    let userMaterialSelection = null;
    let userGaugeSelection = null;
    let userTensionSelection = null;

    // Track when user changes the material dropdown
    if (selectedStringMaterial) {
        selectedStringMaterial.addEventListener('change', (e) => {
            userMaterialSelection = e.target.value;
            console.log('🎨 User changed material to:', userMaterialSelection);
        });
    }

    // Track when user changes the gauge dropdown
    if (selectedStringGauge) {
        selectedStringGauge.addEventListener('change', (e) => {
            userGaugeSelection = e.target.value;
            console.log('📏 User changed gauge to:', userGaugeSelection);
        });
    }

    // Track when user changes the tension
    if (selectedStringTension) {
        selectedStringTension.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            userTensionSelection = value;
            if (selectedStringTensionValue) {
                selectedStringTensionValue.textContent = value + ' N';
            }
            console.log('⚡ User changed tension to:', userTensionSelection);
        });
    }

    // Apply to selected strings
    if (applySelectedStringMaterial && selectedStringMaterial && selectedStringGauge && selectedStringTension) {
        applySelectedStringMaterial.addEventListener('click', (event) => {
            // CRITICAL: Stop event from bubbling up which might trigger selection change
            event.stopPropagation();
            event.preventDefault();

            // Use cached user selections if available, otherwise fall back to current dropdown values
            const material = userMaterialSelection || selectedStringMaterial.value;
            const gauge = userGaugeSelection || selectedStringGauge.value;
            const tension = userTensionSelection || parseInt(selectedStringTension.value);

            console.log('🔵 BUTTON CLICKED: applySelectedStringMaterial');
            console.log('📋 Dropdown.value =', selectedStringMaterial.value);
            console.log('📋 Dropdown.selectedIndex =', selectedStringMaterial.selectedIndex);
            console.log('💾 Cached user selections:', { userMaterialSelection, userGaugeSelection, userTensionSelection });
            console.log('🎯 USING VALUES: material="' + material + '", gauge="' + gauge + '", tension=' + tension);

            const selectedStrings = app.interactionManager.getSelectedStrings();
            console.log(`🔍 Selected strings count: ${selectedStrings.length}`, selectedStrings);

            if (!selectedStrings || selectedStrings.length === 0) {
                showNotification('Please select at least one string', 'error');
                return;
            }

            console.log(`🎨 Applying material: ${material} (${STRING_MATERIALS[material].name}), gauge: ${gauge}, tension: ${tension}N`);
            console.log(`📊 Material color from constants:`, STRING_MATERIALS[material].color);

            // Apply to all selected strings
            selectedStrings.forEach((string) => {
                const colorBefore = [...string.color];
                console.log(`   String #${string.index + 1} - Color BEFORE:`, colorBefore);

                string.setMaterial(material, gauge, tension);

                console.log(`   String #${string.index + 1} - Color AFTER:`, string.color);
            });

            // Clear cached selections after applying
            userMaterialSelection = null;
            userGaugeSelection = null;
            userTensionSelection = null;

            console.log('✅ Calling app.updateUI()');
            app.updateUI();

            const matName = STRING_MATERIALS[material].name;
            const gaugeName = STRING_GAUGES[gauge].name;
            showNotification(`Applied ${matName} ${gaugeName} @ ${tension}N to ${selectedStrings.length} string(s)`, 'success');
        });
    } else {
        console.error('❌ Material button or dropdowns not found!', {
            applySelectedStringMaterial,
            selectedStringMaterial,
            selectedStringGauge,
            selectedStringTension
        });
    }

    // Apply to all strings
    if (applyAllStringsMaterial && selectedStringMaterial && selectedStringGauge && selectedStringTension) {
        applyAllStringsMaterial.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();

            console.log('🔵 BUTTON CLICKED: applyAllStringsMaterial');

            // Use cached user selections if available, otherwise fall back to current dropdown values
            const material = userMaterialSelection || selectedStringMaterial.value;
            const gauge = userGaugeSelection || selectedStringGauge.value;
            const tension = userTensionSelection || parseInt(selectedStringTension.value);

            console.log('💾 Cached user selections:', { userMaterialSelection, userGaugeSelection, userTensionSelection });
            console.log('🎯 USING VALUES: material="' + material + '", gauge="' + gauge + '", tension=' + tension);
            console.log(`🎨 Applying material to ALL ${app.strings.length} strings: ${material} (${STRING_MATERIALS[material].name})`);
            console.log(`📊 Material color from constants:`, STRING_MATERIALS[material].color);

            // Apply to all strings
            app.strings.forEach(string => {
                const colorBefore = [...string.color];
                console.log(`   String #${string.index + 1} - Color BEFORE:`, colorBefore);

                string.setMaterial(material, gauge, tension);

                console.log(`   String #${string.index + 1} - Color AFTER:`, string.color);
            });

            // Clear cached selections after applying
            userMaterialSelection = null;
            userGaugeSelection = null;
            userTensionSelection = null;

            console.log('✅ Calling app.updateUI()');
            app.updateUI();

            const matName = STRING_MATERIALS[material].name;
            const gaugeName = STRING_GAUGES[gauge].name;
            showNotification(`Applied ${matName} ${gaugeName} @ ${tension}N to ALL ${app.strings.length} strings`, 'success');
        });
    } else {
        console.error('❌ APPLY ALL button or dropdowns not found!', {
            applyAllStringsMaterial,
            selectedStringMaterial,
            selectedStringGauge,
            selectedStringTension
        });
    }

    // Keyboard shortcuts - prevent conflict with text inputs
    document.addEventListener('keydown', (e) => {
        // Don't process shortcuts if typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }

        // Prevent arrow keys and Page Up/Down from scrolling the page
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', ' '].includes(e.key)) {
            e.preventDefault();
        }

        if (app && app.interactionManager) {
            app.interactionManager.handleKeyPressed(e.key, e.shiftKey);

            // Update UI after keyboard action
            const selected = app.interactionManager.getSelectedString();
            if (selected) {
                updateInfoPanel(selected);
            }
        }
    });

    // Save/Load project
    const saveProjectBtn = document.getElementById('saveProject');
    const loadProjectBtn = document.getElementById('loadProject');
    const loadProjectFile = document.getElementById('loadProjectFile');

    if (saveProjectBtn) {
        saveProjectBtn.addEventListener('click', () => {
            if (!app || !app.strings) {
                showNotification('No project to save', 'error');
                return;
            }

            // Gather project state
            const projectData = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                numStrings: app.numStrings,
                currentMaterial: app.currentMaterial,
                currentGauge: app.currentGauge,
                currentTension: app.currentTension,
                currentAudioEngine: app.currentAudioEngine,
                strings: app.strings.map(string => ({
                    index: string.index,
                    targetMidiNote: string.targetMidiNote,
                    material: string.material,
                    gauge: string.gauge,
                    tension: string.tension,
                    lowerCapoMm: string.lowerCapoMm,
                    upperCapoMm: string.upperCapoMm
                }))
            };

            // Download as JSON
            const jsonString = JSON.stringify(projectData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wallharp_project_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showNotification('Project saved successfully', 'success');
        });
    }

    if (loadProjectBtn && loadProjectFile) {
        loadProjectBtn.addEventListener('click', () => {
            loadProjectFile.click();
        });

        loadProjectFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const projectData = JSON.parse(event.target.result);

                    // Validate project data
                    if (!projectData.version || !projectData.strings) {
                        throw new Error('Invalid project file');
                    }

                    // Set string count first
                    if (projectData.numStrings) {
                        app.setStringCount(projectData.numStrings);
                    }

                    // Load string configurations
                    projectData.strings.forEach((stringData, index) => {
                        if (index < app.strings.length) {
                            const string = app.strings[index];

                            // Set material properties
                            string.setMaterial(
                                stringData.material || 'steel',
                                stringData.gauge || 'medium',
                                stringData.tension || 120
                            );

                            // Set capo positions
                            if (stringData.lowerCapoMm !== undefined) {
                                string.lowerCapoMm = stringData.lowerCapoMm;
                            }
                            if (stringData.upperCapoMm !== undefined) {
                                string.upperCapoMm = stringData.upperCapoMm;
                            }

                            // Set target MIDI note
                            if (stringData.targetMidiNote !== undefined) {
                                string.targetMidiNote = stringData.targetMidiNote;
                                string.targetFrequency = midiToFrequency(stringData.targetMidiNote);
                            }
                        }
                    });

                    // Set global material properties
                    if (projectData.currentMaterial) {
                        app.currentMaterial = projectData.currentMaterial;
                    }
                    if (projectData.currentGauge) {
                        app.currentGauge = projectData.currentGauge;
                    }
                    if (projectData.currentTension) {
                        app.currentTension = projectData.currentTension;
                    }

                    // Set audio engine
                    if (projectData.currentAudioEngine && audioEngine && audioEngine.initialized) {
                        app.setAudioEngine(projectData.currentAudioEngine);
                    }

                    app.updateUI();
                    showNotification('Project loaded successfully', 'success');

                    // Reset file input
                    loadProjectFile.value = '';

                } catch (error) {
                    console.error('Error loading project:', error);
                    showNotification('Failed to load project: ' + error.message, 'error');
                    loadProjectFile.value = '';
                }
            };

            reader.readAsText(file);
        });
    }

    console.log("UI controls initialized");
}

/**
 * Update string count display
 *
 * @param {number} count - Number of strings
 */
function updateStringCountDisplay(count) {
    const element = document.getElementById('stringCountValue');
    if (element) {
        element.textContent = count;
    }
}

/**
 * Show notification message
 *
 * @param {string} message - Message to display
 * @param {string} type - Message type ('info', 'success', 'error')
 * @param {number} duration - Duration in milliseconds
 */
function showNotification(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification notification-' + type;
    notification.textContent = message;

    // Add to body
    document.body.appendChild(notification);

    // Style notification
    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px 20px',
        backgroundColor: type === 'error' ? '#2a2a2a' : '#1a1a1a',
        color: '#e0e0e0',
        border: '1px solid ' + (type === 'error' ? '#606060' : '#3a3a3a'),
        fontSize: '11px',
        letterSpacing: '1px',
        fontFamily: 'monospace',
        zIndex: '10000',
        opacity: '0',
        transition: 'opacity 0.3s ease'
    });

    // Fade in
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);

    // Remove after duration
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, duration);
}

/**
 * Update mode indicator in UI
 *
 * @param {string} mode - Current mode
 */
function updateModeIndicator(mode) {
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Format and display performance stats
 *
 * @param {number} fps - Current frames per second
 * @param {number} stringCount - Number of strings
 */
function updatePerformanceStats(fps, stringCount) {
    // Could add a stats panel if needed
    // For now, just log to console periodically
    if (window.frameCount && window.frameCount % 300 === 0) {
        console.log("Performance: " + fps.toFixed(1) + " FPS | " + stringCount + " strings");
    }
}

/**
 * Create and show a loading indicator
 *
 * @param {string} message - Loading message
 * @returns {HTMLElement} - Loading element reference
 */
function showLoadingIndicator(message) {
    message = message || 'Loading...';

    const loader = document.createElement('div');
    loader.id = 'loadingIndicator';
    loader.innerHTML = '<div class="spinner"></div><div class="loading-text">' + message + '</div>';

    Object.assign(loader.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(10, 10, 10, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '20000',
        color: '#e0e0e0',
        fontFamily: 'monospace',
        fontSize: '12px',
        letterSpacing: '2px'
    });

    document.body.appendChild(loader);
    return loader;
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
        document.body.removeChild(loader);
    }
}

/**
 * Add CSS for notification animations
 */
function injectNotificationStyles() {
    if (document.getElementById('notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #3a3a3a;
            border-top: 3px solid #ffffff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }

        .loading-text {
            text-transform: uppercase;
        }
    `;
    document.head.appendChild(style);
}

// Initialize notification styles on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNotificationStyles);
} else {
    injectNotificationStyles();
}

// Export for ES6 modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateInfoPanel,
        initializeUIControls,
        updateStringCountDisplay,
        showNotification,
        updateModeIndicator,
        updatePerformanceStats,
        showLoadingIndicator,
        hideLoadingIndicator
    };
}
