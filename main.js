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

            drawString(p, string, string.isSelected);
        });

        p.pop();

        // Draw UI overlay (not affected by zoom/pan)
        drawUIOverlay(p, this.interactionManager.mode, this.numStrings);

        // Draw keyboard shortcuts (not affected by zoom/pan)
        drawKeyboardShortcuts(p);

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
        // Check if middle mouse or shift+click for panning
        if (p.mouseButton === p.CENTER || p.keyIsDown(p.SHIFT)) {
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

        this.interactionManager.handleMousePressed(transformedX, transformedY, isMultiSelect);
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
    }

    setStringCount(count) {
        console.log("Setting string count to:", count);
        this.numStrings = count;
        this.strings = createChromaticStrings(
            count,
            this.currentMaterial,
            this.currentGauge,
            this.currentTension
        );
        this.interactionManager.strings = this.strings;
        this.selectedStringIndex = 0;
        this.interactionManager.selectedStringIndex = 0;

        if (audioEngine && audioEngine.initialized) {
            audioEngine.dispose();
            audioEngine.initialize(count);
        }

        this.updateUI();
    }

    setMode(mode) {
        this.interactionManager.setMode(mode);
        updateModeIndicator(mode);
    }

    applyScalePreset(scaleName, rootMidi) {
        rootMidi = rootMidi || 48;
        applyScale(this.strings, scaleName, rootMidi);
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
