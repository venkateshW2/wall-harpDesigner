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
    }

    /**
     * Handle mouse press event
     *
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     * @param {boolean} isMultiSelect - Whether Ctrl/Cmd is pressed for multi-selection
     */
    handleMousePressed(mouseX, mouseY, isMultiSelect = false) {
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

        // Arrow Left/Right: Navigate between strings
        if (key === 'ArrowLeft' && this.selectedStringIndex > 0) {
            this.selectedStringIndex--;
            this.updateSelection();
            selected = this.getSelectedString(); // Get newly selected string
            if (selected) selected.pluck(0.5, 0.3);
        }
        if (key === 'ArrowRight' && this.selectedStringIndex < this.strings.length - 1) {
            this.selectedStringIndex++;
            this.updateSelection();
            selected = this.getSelectedString(); // Get newly selected string
            if (selected) selected.pluck(0.5, 0.3);
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
