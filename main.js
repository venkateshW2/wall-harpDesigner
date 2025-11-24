/**
 * WALL HARP SIMULATOR - MAIN APPLICATION
 */

class WallHarpSimulator {
    constructor() {
        this.strings = [];
        this.numStrings = 36;
        this.interactionManager = null;
        this.p5Instance = null;
        this.selectedStringIndex = 0;
        this.initialized = false;

        // Wall dimensions (in feet, converted to mm internally)
        this.wallWidthFt = PHYSICS_CONSTANTS.DEFAULT_WALL_WIDTH_FT;
        this.wallHeightFt = PHYSICS_CONSTANTS.DEFAULT_WALL_HEIGHT_FT;
        this.wallWidthMm = this.wallWidthFt * 304.8;
        this.wallHeightMm = this.wallHeightFt * 304.8;
        this.reverseCapoMode = false;

        // Material properties
        this.currentMaterial = PHYSICS_CONSTANTS.DEFAULT_MATERIAL;
        this.currentGauge = PHYSICS_CONSTANTS.DEFAULT_GAUGE;
        this.currentTension = PHYSICS_CONSTANTS.DEFAULT_TENSION;
        this.currentAudioEngine = AUDIO_CONSTANTS.DEFAULT_ENGINE;

        // Zoom and pan state
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
    }

    async init() {
        console.log("=== INITIALIZING WALL HARP SIMULATOR ===");

        try {
            // Run physics tests
            runPhysicsTests();

            // Create strings with current material properties
            this.strings = createChromaticStrings(
                this.numStrings,
                this.currentMaterial,
                this.currentGauge,
                this.currentTension
            );
            console.log("✓ Created " + this.numStrings + " strings");

            // Create audio engine
            if (!audioEngine) {
                audioEngine = new HarpAudioEngine();
            }

            // Create interaction manager (will be updated with actual canvas size in p5 setup)
            this.interactionManager = new InteractionManager(
                this.strings,
                window.innerWidth - 320,
                window.innerHeight
            );

            // Set up p5.js
            this.initP5();

            // Set up UI
            initializeUIControls(this);

            // Update UI
            this.updateUI();

            this.initialized = true;
            console.log("✓ Wall Harp Simulator initialized");

        } catch (error) {
            console.error("❌ Failed to initialize:", error);
            throw error;
        }
    }

    initP5() {
        const self = this;

        const sketch = (p) => {
            p.setup = () => {
                // Create responsive canvas - use window dimensions
                const container = document.getElementById('canvasContainer');
                const containerWidth = container.clientWidth || window.innerWidth - 320;
                const containerHeight = window.innerHeight;

                // Make canvas fill available space
                const canvas = p.createCanvas(containerWidth, containerHeight);
                canvas.parent('canvasContainer');
                p.textFont('JetBrains Mono, monospace');

                // Update interaction manager with actual canvas dimensions
                if (self.interactionManager) {
                    self.interactionManager.canvasWidth = containerWidth;
                    self.interactionManager.canvasHeight = containerHeight;
                }

                console.log("✓ Canvas created:", p.width, "x", p.height);
            };

            p.windowResized = () => {
                const container = document.getElementById('canvasContainer');
                const containerWidth = container.clientWidth || window.innerWidth - 320;
                const containerHeight = window.innerHeight;
                p.resizeCanvas(containerWidth, containerHeight);

                // Update interaction manager with new dimensions
                if (self.interactionManager) {
                    self.interactionManager.canvasWidth = containerWidth;
                    self.interactionManager.canvasHeight = containerHeight;
                }
            };

            p.draw = () => {
                self.draw(p);
            };

            p.mousePressed = () => {
                self.handleMousePressed(p);
            };

            p.mouseDragged = () => {
                self.handleMouseDragged(p);
            };

            p.mouseReleased = () => {
                self.handleMouseReleased(p);
            };

            p.mouseMoved = () => {
                self.handleMouseMoved(p);
            };

            // Disable mouseWheel for canvas - let page handle scrolling
            p.mouseWheel = (event) => {
                // Only handle zoom if Ctrl/Cmd is pressed
                if (event && event.event && (event.event.ctrlKey || event.event.metaKey)) {
                    self.handleMouseWheel(p, event);
                    return false;
                }
                // Allow normal scrolling otherwise
                return true;
            };
        };

        this.p5Instance = new p5(sketch);
    }

    draw(p) {
        // Always use white background for maximum clarity
        p.background(255, 255, 255);

        // Apply zoom and pan transformations
        p.push();
        p.translate(this.panX, this.panY);
        p.scale(this.zoom);

        // Draw components
        drawResonator(p);
        // Soundbox and top bridge removed - just strings now
        drawMeasurementRuler(p);

        // Draw strings
        this.strings.forEach((string) => {
            string.updatePlaying(p.deltaTime / 1000);

            const isHovered = (string.index === this.interactionManager.hoveredStringIndex);
            if (isHovered && !string.isSelected) {
                drawStringHighlight(p, string);
            }

            drawString(p, string, string.isSelected, this.interactionManager.mode, isHovered);
        });

        p.pop();

        // Draw UI overlay (not affected by zoom/pan)
        drawUIOverlay(p, this.interactionManager.mode, this.numStrings);

        // Draw currently playing string info (not affected by zoom/pan)
        drawPlayingStringInfo(p, this.strings);

        // Draw keyboard shortcuts (not affected by zoom/pan)
        drawKeyboardShortcuts(p, this.interactionManager.mode);

        // Draw string spacing labels (not affected by zoom/pan)
        drawStringSpacing(p, this.numStrings);

        // Draw zoom indicator
        p.fill(VISUAL_CONSTANTS.COLORS.textDim);
        p.noStroke();
        p.textAlign(p.RIGHT, p.BOTTOM);
        p.textSize(10);
        p.text("Zoom: " + (this.zoom * 100).toFixed(0) + "%", p.width - 15, p.height - 35);
    }

    handleMousePressed(p) {
        // Check for Shift key
        const shiftKey = p.keyIsDown(p.SHIFT);

        // Check if middle mouse for panning (but NOT shift+click anymore, since Shift is used for placing strings in draw mode)
        if (p.mouseButton === p.CENTER) {
            this.isPanning = true;
            this.lastMouseX = p.mouseX;
            this.lastMouseY = p.mouseY;
            return;
        }

        // Transform mouse coordinates
        const transformedX = (p.mouseX - this.panX) / this.zoom;
        const transformedY = (p.mouseY - this.panY) / this.zoom;

        // Check for Ctrl/Cmd key for multi-selection
        const isMultiSelect = p.keyIsDown(p.CONTROL) || p.keyIsDown(93); // 93 is Cmd on Mac

        this.interactionManager.handleMousePressed(transformedX, transformedY, isMultiSelect, shiftKey);
        this.selectedStringIndex = this.interactionManager.selectedStringIndex;
        this.updateUI();
    }

    handleMouseDragged(p) {
        if (this.isPanning) {
            this.panX += p.mouseX - this.lastMouseX;
            this.panY += p.mouseY - this.lastMouseY;
            this.lastMouseX = p.mouseX;
            this.lastMouseY = p.mouseY;
            return;
        }

        const transformedX = (p.mouseX - this.panX) / this.zoom;
        const transformedY = (p.mouseY - this.panY) / this.zoom;

        this.interactionManager.handleMouseDragged(transformedX, transformedY);

        if (this.interactionManager.draggedString) {
            updateInfoPanel(this.interactionManager.draggedString);
        }
    }

    handleMouseReleased(p) {
        this.isPanning = false;
        this.interactionManager.handleMouseReleased();
    }

    handleMouseMoved(p) {
        const transformedX = (p.mouseX - this.panX) / this.zoom;
        const transformedY = (p.mouseY - this.panY) / this.zoom;

        this.interactionManager.handleMouseMoved(transformedX, transformedY);
    }

    handleMouseWheel(p, event) {
        // Zoom with mouse wheel
        const zoomAmount = -event.delta * 0.001;
        const newZoom = clamp(
            this.zoom + zoomAmount,
            VISUAL_CONSTANTS.MIN_ZOOM,
            VISUAL_CONSTANTS.MAX_ZOOM
        );

        // Zoom towards mouse position
        const mouseXBeforeZoom = (p.mouseX - this.panX) / this.zoom;
        const mouseYBeforeZoom = (p.mouseY - this.panY) / this.zoom;

        this.zoom = newZoom;

        const mouseXAfterZoom = (p.mouseX - this.panX) / this.zoom;
        const mouseYAfterZoom = (p.mouseY - this.panY) / this.zoom;

        this.panX += (mouseXAfterZoom - mouseXBeforeZoom) * this.zoom;
        this.panY += (mouseYAfterZoom - mouseYBeforeZoom) * this.zoom;
    }

    updateUI() {
        const selectedString = this.interactionManager.getSelectedString();
        const selectionCount = this.interactionManager.selectedStringIndices.length;
        if (selectedString) {
            updateInfoPanel(selectedString, selectionCount);
        }

        // Update wall dimension displays
        const maxStringsValue = document.getElementById('maxStringsValue');
        const stringSpacingValue = document.getElementById('stringSpacingValue');
        if (maxStringsValue) {
            maxStringsValue.textContent = this.calculateMaxStrings();
        }
        if (stringSpacingValue) {
            stringSpacingValue.textContent = this.getStringSpacing().toFixed(1) + ' mm';
        }
    }

    setStringCount(count) {
        console.log("=== SET STRING COUNT ===");
        console.log("Setting string count to:", count);
        console.log("Current WALL_WIDTH:", PHYSICS_CONSTANTS.WALL_WIDTH);
        console.log("Current FULL_STRING_LENGTH:", PHYSICS_CONSTANTS.FULL_STRING_LENGTH);

        // Save draw mode string data before recreating (up to the new count)
        const drawModeData = this.strings.slice(0, count).map(string => ({
            drawMode: string.drawMode,
            startX: string.startX,
            startY: string.startY,
            endX: string.endX,
            endY: string.endY
        }));

        this.numStrings = count;
        this.strings = createChromaticStrings(
            count,
            this.currentMaterial,
            this.currentGauge,
            this.currentTension
        );

        // Restore draw mode string data for existing strings
        this.strings.forEach((string, index) => {
            if (drawModeData[index] && drawModeData[index].drawMode) {
                string.drawMode = drawModeData[index].drawMode;
                string.startX = drawModeData[index].startX;
                string.startY = drawModeData[index].startY;
                string.endX = drawModeData[index].endX;
                string.endY = drawModeData[index].endY;
                // Recalculate with current dimensions
                string.updateCalculations();
            }
        });

        this.interactionManager.strings = this.strings;

        // Reset selection to first string and update selection state
        this.selectedStringIndex = 0;
        this.interactionManager.selectedStringIndex = 0;
        this.interactionManager.selectedStringIndices = [0];
        this.interactionManager.updateSelection();

        if (audioEngine && audioEngine.initialized) {
            audioEngine.dispose();
            audioEngine.initialize(count);
        }

        console.log("✓ Strings created. First string totalStrings:", this.strings[0].totalStrings);
        console.log("✓ Selection updated. Selected indices:", this.interactionManager.selectedStringIndices);
        console.log("✓ Preserved draw mode strings where possible");

        this.updateUI();
    }

    setMode(mode) {
        this.interactionManager.setMode(mode);
        updateModeIndicator(mode);

        // Check if any strings are in draw mode
        const hasDrawModeStrings = this.strings.some(s => s.drawMode && s.startX !== null);

        // If switching TO draw mode AND no strings are in draw mode yet, enable it
        if (mode === INTERACTION_CONSTANTS.MODES.DRAW && !hasDrawModeStrings) {
            this.enableDrawModeForStrings();
        }

        // NOTE: We NO LONGER disable draw mode when switching away!
        // This allows users to keep their drawn strings and switch between modes
        // The draw mode strings will simply not be visible in vertical modes
    }

    /**
     * Enable draw mode for all strings
     */
    enableDrawModeForStrings() {
        console.log("=== ENABLING DRAW MODE ===");
        this.strings.forEach(string => {
            string.drawMode = true;
            // Leave endpoints null - user will place them
        });
        console.log(`✓ ${this.strings.length} strings ready for drawing`);
        showNotification('DRAW MODE: Click to pluck | Shift+Click to place string | Delete to remove | Drag endpoints to move', 'info', 8000);
    }

    /**
     * Disable draw mode for all strings and revert to vertical mode
     */
    disableDrawModeForStrings() {
        console.log("=== DISABLING DRAW MODE ===");
        this.strings.forEach(string => {
            string.disableDrawMode();
        });
        console.log(`✓ Reverted to vertical string mode`);
        showNotification('Reverted to vertical string mode', 'info');
    }

    applyScalePreset(scaleName, rootMidi) {
        console.log("=== APPLY SCALE PRESET ===");
        console.log(`Scale: ${scaleName}, Root MIDI: ${rootMidi || 48}`);
        console.log(`Current FULL_STRING_LENGTH: ${PHYSICS_CONSTANTS.FULL_STRING_LENGTH}mm`);
        console.log(`Strings before: ${this.strings.length}`);

        rootMidi = rootMidi || 48;
        applyScale(this.strings, scaleName, rootMidi);

        console.log(`First string after scale: lowerCapo=${this.strings[0].lowerCapoMm}mm, upperCapo=${this.strings[0].upperCapoMm}mm, note=${this.strings[0].noteName}`);

        this.updateUI();

        const scale = SCALES[scaleName];
        if (scale) {
            showNotification('Applied: ' + scale.name, 'success');
        }
    }

    async playTestSequence() {
        if (!audioEngine || !audioEngine.initialized) {
            showNotification('Initialize audio first', 'error');
            return;
        }

        const indices = [0, 1, 2, 3, 4, 5, 6];
        await this.interactionManager.playStringSequence(indices, 0.2);
    }

    resetZoom() {
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
    }

    resetTuning() {
        this.strings = createChromaticStrings(
            this.numStrings,
            this.currentMaterial,
            this.currentGauge,
            this.currentTension
        );
        this.interactionManager.strings = this.strings;

        // Reset selection and update selection state
        this.selectedStringIndex = 0;
        this.interactionManager.selectedStringIndex = 0;
        this.interactionManager.selectedStringIndices = [0];
        this.interactionManager.updateSelection();

        this.updateUI();
        showNotification('Reset to chromatic tuning', 'success');
    }

    forceRedraw() {
        // Force a full redraw (useful for theme changes)
        if (this.p5Instance) {
            this.p5Instance.redraw();
        }
    }

    setMaterialProperties(material, gauge, tension) {
        console.log(`Setting material: ${material}, gauge: ${gauge}, tension: ${tension}N`);

        this.currentMaterial = material;
        this.currentGauge = gauge;
        this.currentTension = tension;

        // Recalculate all string physics
        this.strings.forEach(string => {
            string.setMaterial(material, gauge, tension);
        });

        this.updateUI();
        console.log('Material properties applied to all strings');
    }

    setAudioEngine(engineType) {
        console.log(`Setting audio engine: ${engineType}`);
        this.currentAudioEngine = engineType;

        if (audioEngine && audioEngine.initialized) {
            audioEngine.setEngineType(engineType);
        }
    }

    setWallDimensions(widthFt, heightFt) {
        console.log("=== SET WALL DIMENSIONS ===");
        console.log(`Changing from ${this.wallWidthFt}ft x ${this.wallHeightFt}ft to ${widthFt}ft x ${heightFt}ft`);

        this.wallWidthFt = widthFt;
        this.wallHeightFt = heightFt;
        this.wallWidthMm = widthFt * 304.8;
        this.wallHeightMm = heightFt * 304.8;

        // Update physics constants
        const oldWallWidth = PHYSICS_CONSTANTS.WALL_WIDTH;
        const oldStringLength = PHYSICS_CONSTANTS.FULL_STRING_LENGTH;

        PHYSICS_CONSTANTS.WALL_WIDTH = this.wallWidthMm;
        PHYSICS_CONSTANTS.FULL_STRING_LENGTH = this.wallHeightMm;

        console.log(`PHYSICS_CONSTANTS.WALL_WIDTH: ${oldWallWidth}mm → ${PHYSICS_CONSTANTS.WALL_WIDTH}mm`);
        console.log(`PHYSICS_CONSTANTS.FULL_STRING_LENGTH: ${oldStringLength}mm → ${PHYSICS_CONSTANTS.FULL_STRING_LENGTH}mm`);

        // Recalculate maximum strings based on minimum spacing
        const maxStrings = this.calculateMaxStrings();
        console.log(`Maximum strings with 1cm spacing: ${maxStrings}`);

        // If current string count exceeds max, adjust it
        if (this.numStrings > maxStrings) {
            console.warn(`Current string count (${this.numStrings}) exceeds maximum (${maxStrings}). Adjusting...`);
            this.setStringCount(maxStrings);
        } else {
            console.log(`Recreating ${this.numStrings} strings with new dimensions...`);

            // Save draw mode string data before recreating
            const drawModeData = this.strings.map(string => ({
                drawMode: string.drawMode,
                startX: string.startX,
                startY: string.startY,
                endX: string.endX,
                endY: string.endY
            }));

            // Recreate strings with new dimensions
            this.strings = createChromaticStrings(
                this.numStrings,
                this.currentMaterial,
                this.currentGauge,
                this.currentTension
            );

            // Restore draw mode string data
            this.strings.forEach((string, index) => {
                if (drawModeData[index] && drawModeData[index].drawMode) {
                    string.drawMode = drawModeData[index].drawMode;
                    string.startX = drawModeData[index].startX;
                    string.startY = drawModeData[index].startY;
                    string.endX = drawModeData[index].endX;
                    string.endY = drawModeData[index].endY;
                    // Recalculate with new wall dimensions
                    string.updateCalculations();
                }
            });

            this.interactionManager.strings = this.strings;

            console.log(`✓ Created strings. First string: lowerCapo=${this.strings[0].lowerCapoMm}mm, upperCapo=${this.strings[0].upperCapoMm}mm`);
            console.log(`✓ Preserved draw mode strings`);

            // Reset selection to first string and update selection state
            this.selectedStringIndex = 0;
            this.interactionManager.selectedStringIndex = 0;
            this.interactionManager.selectedStringIndices = [0];
            this.interactionManager.updateSelection();

            console.log("✓ Selection reset complete");
        }

        this.updateUI();
        showNotification(`Wall: ${widthFt}ft x ${heightFt}ft | Max strings: ${maxStrings}`, 'success');
    }

    calculateMaxStrings() {
        // Calculate maximum number of strings based on wall width and minimum spacing
        const maxStrings = Math.floor(this.wallWidthMm / PHYSICS_CONSTANTS.MIN_STRING_SPACING);
        return maxStrings;
    }

    getStringSpacing() {
        // Calculate actual spacing between strings
        return this.wallWidthMm / this.numStrings;
    }

    toggleReverseCapoMode() {
        this.reverseCapoMode = !this.reverseCapoMode;
        console.log(`Reverse capo mode: ${this.reverseCapoMode ? 'ON' : 'OFF'}`);

        // Recreate strings with reversed capo positions
        this.strings = createChromaticStrings(
            this.numStrings,
            this.currentMaterial,
            this.currentGauge,
            this.currentTension
        );

        // Apply reverse if enabled
        if (this.reverseCapoMode) {
            this.strings.forEach((string) => {
                // Swap capo positions
                const temp = string.lowerCapoMm;
                string.lowerCapoMm = string.upperCapoMm;
                string.upperCapoMm = temp;
            });
        }

        this.interactionManager.strings = this.strings;

        // Reset selection and update selection state
        this.selectedStringIndex = 0;
        this.interactionManager.selectedStringIndex = 0;
        this.interactionManager.selectedStringIndices = [0];
        this.interactionManager.updateSelection();

        this.updateUI();
        showNotification(`Reverse capo mode: ${this.reverseCapoMode ? 'ON' : 'OFF'}`, 'info');
    }
}

// ===== INITIALIZATION =====

let app;

window.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM loaded - starting initialization");

    try {
        // Initialize theme first
        const savedTheme = getTheme();
        setTheme(savedTheme);

        showLoadingIndicator('Initializing Wall Harp Simulator...');

        app = new WallHarpSimulator();
        await app.init();

        hideLoadingIndicator();

        showNotification('READY - Initialize audio to begin', 'success', 5000);

    } catch (error) {
        console.error("❌ Initialization failed:", error);
        hideLoadingIndicator();
        showNotification('Initialization failed - Check console', 'error', 5000);
    }
});

window.addEventListener('resize', debounce(() => {
    if (app && app.p5Instance) {
        console.log("Window resized");
    }
}, 250));

window.addEventListener('beforeunload', () => {
    if (audioEngine && audioEngine.initialized) {
        audioEngine.dispose();
    }
});

// Debug helpers
if (typeof window !== 'undefined') {
    window.WallHarpApp = app;
    window.exportConfig = () => {
        if (app) downloadConfiguration(app.strings);
    };
    window.testAudio = () => {
        if (app) app.playTestSequence();
    };
    window.resetView = () => {
        if (app) app.resetZoom();
    };
}
