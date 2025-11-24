/**
 * WALL HARP SIMULATOR - INTERACTION MANAGER
 * Handles mouse/touch interactions with strings and capos
 */

/**
 * Mouse interaction manager
 */
class InteractionManager {
    /**
     * Create interaction manager
     *
     * @param {Array<HarpString>} strings - Array of string objects
     * @param {number} canvasWidth - Canvas width in pixels
     * @param {number} canvasHeight - Canvas height in pixels
     */
    constructor(strings, canvasWidth, canvasHeight) {
        this.strings = strings;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        this.mode = INTERACTION_CONSTANTS.MODES.PLUCK; // Default mode
        this.selectedStringIndex = 0;
        this.selectedStringIndices = [0]; // Array of selected string indices for multi-selection
        this.hoveredStringIndex = -1;
        this.draggedString = null;
        this.draggedCapo = null; // 'lower' or 'upper'
        this.activeCapo = 'lower'; // Which capo is selected for keyboard control

        // For auto-pluck while dragging
        this.lastDragPluckTime = 0;

        // Draw mode state
        this.drawModeState = {
            placingString: false,      // Is user placing a new string?
            currentStringIndex: -1,    // Which string is being placed?
            placedStartPoint: false,   // Has start point been placed?
            tempEndX: null,            // Temporary end point while placing
            tempEndY: null
        };
    }

    /**
     * Find endpoint under cursor in draw mode
     * @param {number} mouseX - Mouse X
     * @param {number} mouseY - Mouse Y
     * @returns {object|null} - {string, endpoint: 'start'|'end'} or null
     */
    findEndpointAtPosition(mouseX, mouseY) {
        const threshold = INTERACTION_CONSTANTS.ENDPOINT_GRAB_THRESHOLD;

        for (let string of this.strings) {
            if (!string.drawMode) continue;
            if (string.startX === null || string.endX === null) continue;

            // Check start point
            if (isNearPoint(mouseX, mouseY, string.startX, string.startY, threshold)) {
                return { string, endpoint: 'start' };
            }

            // Check end point
            if (isNearPoint(mouseX, mouseY, string.endX, string.endY, threshold)) {
                return { string, endpoint: 'end' };
            }
        }

        return null;
    }

    /**
     * Find first unplaced string in draw mode
     * @returns {HarpString|null}
     */
    findUnplacedDrawString() {
        for (let string of this.strings) {
            if (string.drawMode && (string.startX === null || string.endX === null)) {
                return string;
            }
        }
        return null;
    }

    /**
     * Find string near click position in draw mode
     * @param {number} mouseX - Mouse X
     * @param {number} mouseY - Mouse Y
     * @returns {HarpString|null}
     */
    findStringAtPosition(mouseX, mouseY) {
        const threshold = 15; // pixels

        for (let string of this.strings) {
            if (!string.drawMode) continue;
            if (string.startX === null || string.endX === null) continue;

            // Calculate distance from point to line segment
            const dist = distanceToLineSegment(
                mouseX, mouseY,
                string.startX, string.startY,
                string.endX, string.endY
            );

            if (dist < threshold) {
                return string;
            }
        }

        return null;
    }

    /**
     * Handle mouse press in DRAW mode
     * @param {number} mouseX - Mouse X
     * @param {number} mouseY - Mouse Y
     * @param {boolean} shiftKey - Whether Shift is pressed
     */
    handleDrawModeMousePressed(mouseX, mouseY, shiftKey) {
        // Check if clicking on existing endpoint
        const endpoint = this.findEndpointAtPosition(mouseX, mouseY);

        if (endpoint) {
            // Start dragging this endpoint
            const { string, endpoint: which } = endpoint;
            this.draggedString = string;

            if (which === 'start') {
                string.isDraggingStart = true;
            } else {
                string.isDraggingEnd = true;
            }

            this.selectedStringIndex = string.index;
            this.selectedStringIndices = [string.index];
            this.updateSelection();

            console.log(`Grabbed ${which} endpoint of string #${string.index + 1}`);
            return;
        }

        // If Shift is held, place a new string
        if (shiftKey) {
            const unplacedString = this.findUnplacedDrawString();

            if (unplacedString) {
                // Start placing this string
                this.drawModeState.placingString = true;
                this.drawModeState.currentStringIndex = unplacedString.index;
                this.drawModeState.placedStartPoint = true;

                // Set start point
                unplacedString.startX = mouseX;
                unplacedString.startY = mouseY;
                unplacedString.endX = mouseX;
                unplacedString.endY = mouseY;

                this.selectedStringIndex = unplacedString.index;
                this.selectedStringIndices = [unplacedString.index];
                this.updateSelection();

                console.log(`Placing string #${unplacedString.index + 1} - start point set (Shift+Click)`);
            } else {
                console.log('All strings placed in draw mode');
            }
        } else {
            // Regular click without Shift: try to pluck a string
            const string = this.findStringAtPosition(mouseX, mouseY);

            if (string) {
                // Select and pluck this string
                this.selectedStringIndex = string.index;
                this.selectedStringIndices = [string.index];
                this.updateSelection();

                string.pluck();
                console.log(`Plucked string #${string.index + 1}`);
            } else {
                console.log('Click on a string to pluck it, or Shift+Click to place a new string');
            }
        }
    }

    /**
     * Handle mouse drag in DRAW mode
     * @param {number} mouseX - Mouse X
     * @param {number} mouseY - Mouse Y
     */
    handleDrawModeMouseDragged(mouseX, mouseY) {
        // If placing a new string
        if (this.drawModeState.placingString) {
            const string = this.strings[this.drawModeState.currentStringIndex];
            if (string) {
                // Update end point
                string.endX = mouseX;
                string.endY = mouseY;
                string.updateCalculations();
            }
            return;
        }

        // If dragging an existing endpoint
        if (this.draggedString) {
            if (this.draggedString.isDraggingStart) {
                this.draggedString.startX = mouseX;
                this.draggedString.startY = mouseY;
            } else if (this.draggedString.isDraggingEnd) {
                this.draggedString.endX = mouseX;
                this.draggedString.endY = mouseY;
            }

            this.draggedString.updateCalculations();

            // Auto-pluck while dragging for live feedback
            const now = Date.now();
            if (now - this.lastDragPluckTime > INTERACTION_CONSTANTS.DRAG_PLUCK_INTERVAL) {
                this.draggedString.pluck(0.5, 0.4);
                this.lastDragPluckTime = now;
            }
        }
    }

    /**
     * Handle mouse release in DRAW mode
     */
    handleDrawModeMouseReleased() {
        // If placing a string, finalize it
        if (this.drawModeState.placingString) {
            const string = this.strings[this.drawModeState.currentStringIndex];
            if (string) {
                string.updateCalculations();
                console.log(`String #${string.index + 1} placed: (${string.startX.toFixed(0)},${string.startY.toFixed(0)}) → (${string.endX.toFixed(0)},${string.endY.toFixed(0)})`);

                // Play the string to hear it
                string.pluck(1.0, 0.6);
            }

            // Reset placing state
            this.drawModeState.placingString = false;
            this.drawModeState.currentStringIndex = -1;
            this.drawModeState.placedStartPoint = false;
        }

        // If dragging an endpoint, release it
        if (this.draggedString) {
            this.draggedString.isDraggingStart = false;
            this.draggedString.isDraggingEnd = false;
            this.draggedString = null;
        }
    }

    /**
     * Handle mouse press event
     *
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     * @param {boolean} isMultiSelect - Whether Ctrl/Cmd is pressed for multi-selection
     * @param {boolean} shiftKey - Whether Shift is pressed
     */
    handleMousePressed(mouseX, mouseY, isMultiSelect = false, shiftKey = false) {
        // Route to draw mode handler if in draw mode
        if (this.mode === INTERACTION_CONSTANTS.MODES.DRAW) {
            this.handleDrawModeMousePressed(mouseX, mouseY, shiftKey);
            return;
        }

        // Original code for other modes (UNCHANGED)
        // Find string under cursor
        const stringIndex = this.findStringAtX(mouseX);
        if (stringIndex === -1) return;

        const string = this.strings[stringIndex];
        this.selectedStringIndex = stringIndex;

        if (isMultiSelect) {
            // Multi-selection mode: toggle string in selection
            const indexInSelection = this.selectedStringIndices.indexOf(stringIndex);
            if (indexInSelection > -1) {
                // Deselect this string
                this.selectedStringIndices.splice(indexInSelection, 1);
                string.isSelected = false;
                // If we removed the last string, ensure we have at least one selected
                if (this.selectedStringIndices.length === 0) {
                    this.selectedStringIndices = [stringIndex];
                    string.isSelected = true;
                }
            } else {
                // Add to selection
                this.selectedStringIndices.push(stringIndex);
                string.isSelected = true;
            }
        } else {
            // Single selection mode: clear all and select this one
            this.strings.forEach(s => s.isSelected = false);
            this.selectedStringIndices = [stringIndex];
            string.isSelected = true;
        }

        // ALWAYS pluck when clicking a string (in all modes)
        if (this.mode === INTERACTION_CONSTANTS.MODES.PLUCK) {
            // Full pluck in pluck mode
            string.pluck();

        } else if (this.mode === INTERACTION_CONSTANTS.MODES.ADJUST) {
            // Pluck even in adjust mode
            string.pluck(1.0, 0.5); // Shorter, quieter

            // Check if clicking on a capo or anywhere on the string
            const lowerCapoY = mmToScreenY(string.lowerCapoMm, this.canvasHeight);
            const upperCapoY = mmToScreenY(string.upperCapoMm, this.canvasHeight);
            const midY = (lowerCapoY + upperCapoY) / 2;

            const distToLower = Math.abs(mouseY - lowerCapoY);
            const distToUpper = Math.abs(mouseY - upperCapoY);

            // If clicking closer to lower capo OR below middle, grab lower capo
            if (mouseY > midY || (distToLower < distToUpper && distToLower < 100)) {
                string.isDraggingLowerCapo = true;
                this.draggedString = string;
                this.draggedCapo = 'lower';
                console.log('Grabbed LOWER capo');
            }
            // Otherwise grab upper capo
            else {
                string.isDraggingUpperCapo = true;
                this.draggedString = string;
                this.draggedCapo = 'upper';
                console.log('Grabbed UPPER capo');
            }
        }
    }

    /**
     * Handle mouse drag event
     *
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     */
    handleMouseDragged(mouseX, mouseY) {
        // Route to draw mode handler if in draw mode
        if (this.mode === INTERACTION_CONSTANTS.MODES.DRAW) {
            this.handleDrawModeMouseDragged(mouseX, mouseY);
            return;
        }

        if (!this.draggedString || this.mode !== INTERACTION_CONSTANTS.MODES.ADJUST) return;

        const newPositionMm = screenYToMm(mouseY, this.canvasHeight);

        if (this.draggedCapo === 'lower') {
            this.draggedString.setLowerCapoPosition(newPositionMm);
        } else if (this.draggedCapo === 'upper') {
            this.draggedString.setUpperCapoPosition(newPositionMm);
        }

        // Auto-pluck while dragging for live feedback
        const now = Date.now();
        if (now - this.lastDragPluckTime > INTERACTION_CONSTANTS.DRAG_PLUCK_INTERVAL) {
            this.draggedString.pluck(0.5, 0.4); // Short, quiet pluck
            this.lastDragPluckTime = now;
        }
    }

    /**
     * Handle mouse release event
     */
    handleMouseReleased() {
        // Route to draw mode handler if in draw mode
        if (this.mode === INTERACTION_CONSTANTS.MODES.DRAW) {
            this.handleDrawModeMouseReleased();
            return;
        }

        if (this.draggedString) {
            this.draggedString.isDraggingLowerCapo = false;
            this.draggedString.isDraggingUpperCapo = false;
            this.draggedString = null;
            this.draggedCapo = null;
        }
    }

    /**
     * Handle mouse move event (for hover effects)
     *
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     */
    handleMouseMoved(mouseX, mouseY) {
        this.hoveredStringIndex = this.findStringAtX(mouseX);
    }

    /**
     * Find which string is at given X coordinate
     *
     * @param {number} x - X coordinate
     * @returns {number} - String index, or -1 if none
     */
    findStringAtX(x) {
        if (this.strings.length === 0) return -1;

        let closestIndex = -1;
        let minDist = Infinity;

        const stringWidth = this.canvasWidth / this.strings.length;

        this.strings.forEach((string, index) => {
            const stringX = (index + 0.5) * stringWidth;
            const dist = Math.abs(x - stringX);

            // Threshold is half the string spacing
            if (dist < minDist && dist < stringWidth / 2) {
                minDist = dist;
                closestIndex = index;
            }
        });

        return closestIndex;
    }

    /**
     * Get currently selected string (primary selection)
     *
     * @returns {HarpString|null} - Selected string or null
     */
    getSelectedString() {
        if (this.selectedStringIndex >= 0 && this.selectedStringIndex < this.strings.length) {
            return this.strings[this.selectedStringIndex];
        }
        return null;
    }

    /**
     * Get all selected strings
     *
     * @returns {Array<HarpString>} - Array of selected strings
     */
    getSelectedStrings() {
        return this.selectedStringIndices
            .filter(index => index >= 0 && index < this.strings.length)
            .map(index => this.strings[index]);
    }

    /**
     * Get currently hovered string
     *
     * @returns {HarpString|null} - Hovered string or null
     */
    getHoveredString() {
        if (this.hoveredStringIndex >= 0 && this.hoveredStringIndex < this.strings.length) {
            return this.strings[this.hoveredStringIndex];
        }
        return null;
    }

    /**
     * Set interaction mode
     *
     * @param {string} mode - Mode name from INTERACTION_CONSTANTS.MODES
     */
    setMode(mode) {
        if (Object.values(INTERACTION_CONSTANTS.MODES).includes(mode)) {
            this.mode = mode;
            console.log("Interaction mode set to: " + mode);
        } else {
            console.error("Invalid mode: " + mode);
        }
    }

    /**
     * Handle keyboard input for advanced controls
     *
     * @param {string} key - Key that was pressed
     * @param {boolean} shiftKey - Whether shift is held
     */
    handleKeyPressed(key, shiftKey) {
        let selected = this.getSelectedString();

        // Number keys (1-9) to select modes
        if (key === '1') this.setMode(INTERACTION_CONSTANTS.MODES.PLUCK);
        if (key === '2') this.setMode(INTERACTION_CONSTANTS.MODES.ADJUST);
        if (key === '3') this.setMode(INTERACTION_CONSTANTS.MODES.PATTERN);
        if (key === '4') this.setMode(INTERACTION_CONSTANTS.MODES.DRAW);

        // Arrow Left/Right: Navigate between strings
        if (key === 'ArrowLeft') {
            if (this.mode === INTERACTION_CONSTANTS.MODES.DRAW) {
                // In draw mode, only navigate through placed strings
                let newIndex = this.selectedStringIndex - 1;
                while (newIndex >= 0) {
                    const str = this.strings[newIndex];
                    if (str.drawMode && str.startX !== null && str.endX !== null) {
                        this.selectedStringIndex = newIndex;
                        this.updateSelection();
                        selected = this.getSelectedString();
                        if (selected) selected.pluck(0.5, 0.3);
                        break;
                    }
                    newIndex--;
                }
            } else {
                // In other modes, navigate normally
                if (this.selectedStringIndex > 0) {
                    this.selectedStringIndex--;
                    this.updateSelection();
                    selected = this.getSelectedString();
                    if (selected) selected.pluck(0.5, 0.3);
                }
            }
        }
        if (key === 'ArrowRight') {
            if (this.mode === INTERACTION_CONSTANTS.MODES.DRAW) {
                // In draw mode, only navigate through placed strings
                let newIndex = this.selectedStringIndex + 1;
                while (newIndex < this.strings.length) {
                    const str = this.strings[newIndex];
                    if (str.drawMode && str.startX !== null && str.endX !== null) {
                        this.selectedStringIndex = newIndex;
                        this.updateSelection();
                        selected = this.getSelectedString();
                        if (selected) selected.pluck(0.5, 0.3);
                        break;
                    }
                    newIndex++;
                }
            } else {
                // In other modes, navigate normally
                if (this.selectedStringIndex < this.strings.length - 1) {
                    this.selectedStringIndex++;
                    this.updateSelection();
                    selected = this.getSelectedString();
                    if (selected) selected.pluck(0.5, 0.3);
                }
            }
        }

        // Shift + Up/Down: Switch active capo
        if (shiftKey && key === 'ArrowUp') {
            this.activeCapo = 'upper';
            console.log('Active capo: UPPER');
            if (selected) selected.pluck(0.3, 0.2);
        }
        if (shiftKey && key === 'ArrowDown') {
            this.activeCapo = 'lower';
            console.log('Active capo: LOWER');
            if (selected) selected.pluck(0.3, 0.2);
        }

        // Arrow Up/Down: Move active capo (10mm steps)
        if (!shiftKey && key === 'ArrowUp' && selected) {
            const step = 10;
            if (this.activeCapo === 'lower') {
                selected.setLowerCapoPosition(selected.lowerCapoMm - step);
            } else {
                selected.setUpperCapoPosition(selected.upperCapoMm - step);
            }
            selected.pluck(0.5, 0.3);
        }
        if (!shiftKey && key === 'ArrowDown' && selected) {
            const step = 10;
            if (this.activeCapo === 'lower') {
                selected.setLowerCapoPosition(selected.lowerCapoMm + step);
            } else {
                selected.setUpperCapoPosition(selected.upperCapoMm + step);
            }
            selected.pluck(0.5, 0.3);
        }

        // PageUp/PageDown: Jump octave (12 semitones)
        if (key === 'PageUp' && selected) {
            shiftStringSemitones(selected, 12);
            selected.pluck(0.7, 0.4);
        }
        if (key === 'PageDown' && selected) {
            shiftStringSemitones(selected, -12);
            selected.pluck(0.7, 0.4);
        }

        // +/- keys: Shift by semitone
        if ((key === '+' || key === '=') && selected) {
            shiftStringSemitones(selected, 1);
            selected.pluck(0.5, 0.3);
        }
        if ((key === '-' || key === '_') && selected) {
            shiftStringSemitones(selected, -1);
            selected.pluck(0.5, 0.3);
        }

        // Space to pluck selected string
        if (key === ' ') {
            if (selected) selected.pluck();
        }

        // Delete/Backspace to delete string in draw mode
        if ((key === 'Delete' || key === 'Backspace') && this.mode === INTERACTION_CONSTANTS.MODES.DRAW) {
            const selectedStrings = this.getSelectedStrings();
            selectedStrings.forEach(string => {
                if (string.drawMode) {
                    // Reset string endpoints to "delete" it
                    string.startX = null;
                    string.startY = null;
                    string.endX = null;
                    string.endY = null;
                    console.log(`Deleted string #${string.index + 1}`);
                }
            });
        }

        // 'T' to test audio
        if (key === 't' || key === 'T') {
            testAudioSystem();
        }
    }

    /**
     * Update selection state of all strings
     */
    updateSelection() {
        this.strings.forEach((string, index) => {
            string.isSelected = this.selectedStringIndices.includes(index);
        });
    }

    /**
     * Select string by index
     *
     * @param {number} index - String index
     */
    selectString(index) {
        if (index >= 0 && index < this.strings.length) {
            this.selectedStringIndex = index;
            this.updateSelection();
        }
    }

    /**
     * Play sequence of selected strings
     *
     * @param {Array<number>} indices - Array of string indices to play
     * @param {number} interval - Time between notes in seconds
     */
    async playStringSequence(indices, interval) {
        interval = interval || AUDIO_CONSTANTS.ARPEGGIO_INTERVAL;

        for (let i = 0; i < indices.length; i++) {
            if (indices[i] >= 0 && indices[i] < this.strings.length) {
                this.strings[indices[i]].pluck(1.5);
                await new Promise(resolve => setTimeout(resolve, interval * 1000));
            }
        }
    }

    /**
     * Play chord from selected strings
     *
     * @param {Array<number>} indices - Array of string indices to play
     */
    playStringChord(indices) {
        indices.forEach(index => {
            if (index >= 0 && index < this.strings.length) {
                this.strings[index].pluck();
            }
        });
    }
}

// Export for ES6 modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        InteractionManager
    };
}
