/**
 * WALL HARP SIMULATOR - VISUALIZATION
 * p5.js rendering functions for string instrument visualization
 */

// ===== COORDINATE CONVERSION FUNCTIONS =====

/**
 * Convert mm position to screen Y coordinate
 * Note: Screen Y goes down, but string measurements go up from soundbox
 *
 * @param {number} positionMm - Position in mm from soundbox (0 = soundbox, 2134 = top)
 * @param {number} canvasHeight - Current canvas height
 * @returns {number} - Screen Y coordinate
 */
function mmToScreenY(positionMm, canvasHeight) {
    const height = canvasHeight || VISUAL_CONSTANTS.CANVAS_HEIGHT;
    const topMargin = 60;
    const bottomMargin = 120;
    const stringZoneHeight = height - topMargin - bottomMargin;
    const stringZoneBottom = height - bottomMargin;

    // Calculate percentage (0 = bottom/soundbox, 1 = top/bridge)
    const percent = positionMm / PHYSICS_CONSTANTS.FULL_STRING_LENGTH;

    // Convert to screen Y (inverted because screen Y increases downward)
    const screenY = stringZoneBottom - (percent * stringZoneHeight);

    return screenY;
}

/**
 * Convert screen Y coordinate to mm position
 *
 * @param {number} screenY - Screen Y coordinate
 * @param {number} canvasHeight - Current canvas height
 * @returns {number} - Position in mm from soundbox
 */
function screenYToMm(screenY, canvasHeight) {
    const height = canvasHeight || VISUAL_CONSTANTS.CANVAS_HEIGHT;
    const topMargin = 60;
    const bottomMargin = 120;
    const stringZoneHeight = height - topMargin - bottomMargin;
    const stringZoneBottom = height - bottomMargin;

    // Calculate percentage (0 = bottom, 1 = top)
    const percent = (stringZoneBottom - screenY) / stringZoneHeight;

    // Convert to mm
    const positionMm = percent * PHYSICS_CONSTANTS.FULL_STRING_LENGTH;

    return positionMm;
}

// ===== DRAWING FUNCTIONS =====

/**
 * Draw the soundbox component at bottom
 *
 * @param {p5} p - p5.js instance
 */
function drawSoundbox(p) {
    const y = mmToScreenY(0, p.height);
    const height = VISUAL_CONSTANTS.SOUNDBOX_HEIGHT;

    // Main soundbox body
    p.fill(VISUAL_CONSTANTS.COLORS.soundbox);
    p.stroke(VISUAL_CONSTANTS.COLORS.soundboxStroke);
    p.strokeWeight(2);
    p.rect(0, y, p.width, height);

    // Inner detail lines
    p.stroke(VISUAL_CONSTANTS.COLORS.soundboxStroke);
    p.strokeWeight(1);
    p.line(0, y + 10, p.width, y + 10);
    p.line(0, y + height - 10, p.width, y + height - 10);

    // Label
    p.fill(VISUAL_CONSTANTS.COLORS.text);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(VISUAL_CONSTANTS.FONT_SIZES.title);
    p.text('SOUNDBOX', p.width / 2, y + height / 2);
}

/**
 * Draw the top bridge component
 *
 * @param {p5} p - p5.js instance
 */
function drawTopBridge(p) {
    const y = mmToScreenY(PHYSICS_CONSTANTS.FULL_STRING_LENGTH, p.height);
    const height = VISUAL_CONSTANTS.TOP_BRIDGE_HEIGHT;

    // Bridge body
    p.fill(VISUAL_CONSTANTS.COLORS.topBridge);
    p.stroke(VISUAL_CONSTANTS.COLORS.bridgeStroke);
    p.strokeWeight(2);
    p.rect(0, y - height / 2, p.width, height);

    // Detail lines
    p.stroke(VISUAL_CONSTANTS.COLORS.bridgeStroke);
    p.strokeWeight(1);
    p.line(0, y - 5, p.width, y - 5);
    p.line(0, y + 5, p.width, y + 5);

    // Label
    p.fill(VISUAL_CONSTANTS.COLORS.text);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(VISUAL_CONSTANTS.FONT_SIZES.label);
    p.text('TOP BRIDGE', p.width / 2, y);
}

/**
 * Draw the resonator panel background
 *
 * @param {p5} p - p5.js instance
 */
function drawResonator(p) {
    // No background - keep canvas transparent/white
    // Removed grey background and horizontal grid lines for cleaner look
}

/**
 * Draw measurement ruler on the side
 *
 * @param {p5} p - p5.js instance
 */
function drawMeasurementRuler(p) {
    const rulerX = 10;
    const topY = mmToScreenY(PHYSICS_CONSTANTS.FULL_STRING_LENGTH, p.height);
    const bottomY = mmToScreenY(0, p.height);

    p.stroke(VISUAL_CONSTANTS.COLORS.measurementLine);
    p.strokeWeight(1);
    p.line(rulerX, topY, rulerX, bottomY);

    // Tick marks every 250mm (more divisions for better readability)
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(10);
    p.fill(VISUAL_CONSTANTS.COLORS.textDim);

    for (let mm = 0; mm <= PHYSICS_CONSTANTS.FULL_STRING_LENGTH; mm += 250) {
        const tickY = mmToScreenY(mm, p.height);
        p.stroke(VISUAL_CONSTANTS.COLORS.measurementLine);

        // Longer tick for major divisions (every 500mm)
        const tickLength = (mm % 500 === 0) ? 10 : 5;
        p.line(rulerX - tickLength, tickY, rulerX + tickLength, tickY);

        // Only label major divisions to avoid clutter
        if (mm % 500 === 0) {
            p.noStroke();
            p.text(mm + "mm", rulerX + 12, tickY);
        }
    }
}

/**
 * Draw a single string with proper capo visualization
 *
 * @param {p5} p - p5.js instance
 * @param {HarpString} string - String object to draw
 * @param {boolean} isSelected - Whether this string is selected
 */
function drawString(p, string, isSelected) {
    const x = (string.index + 0.5) * (p.width / string.totalStrings);

    // Calculate Y positions
    const soundboxY = mmToScreenY(0, p.height);
    const topBridgeY = mmToScreenY(PHYSICS_CONSTANTS.FULL_STRING_LENGTH, p.height);
    const lowerCapoY = mmToScreenY(string.lowerCapoMm, p.height);
    const upperCapoY = mmToScreenY(string.upperCapoMm, p.height);

    // Always show string number and note name
    p.fill(VISUAL_CONSTANTS.COLORS.text);
    p.noStroke();
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(10);
    p.text(string.noteName, x, topBridgeY - 5);

    // String number and X-distance from string #1
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(10);
    p.fill(VISUAL_CONSTANTS.COLORS.textDim);

    // Calculate distance from first string (string #1 is at position 0)
    const distanceFromFirstMm = string.index * (PHYSICS_CONSTANTS.WALL_WIDTH / string.totalStrings);
    const distanceFromFirstInches = (distanceFromFirstMm / 25.4).toFixed(1);

    // Show string number and distance
    p.text('#' + (string.index + 1), x, soundboxY + 5);
    p.textSize(9);
    p.text(distanceFromFirstInches + '"', x, soundboxY + 18);

    // Get material color for this string
    const materialColor = string.color || VISUAL_CONSTANTS.COLORS.stringInactive;

    // Calculate string thickness based on gauge
    const gaugeData = STRING_GAUGES[string.gauge];
    const baseThickness = gaugeData ? (gaugeData.diameter * 10) : 4; // Increased scale for better visibility
    const fullStringThickness = Math.max(3, baseThickness * 0.8); // Increased from 0.5 to 0.8 for better visibility
    const playableThickness = Math.max(4, baseThickness * 1.2); // Increased for better material color visibility

    // Draw FULL string (from top to bottom) - thickness based on gauge, full color opacity
    p.stroke(materialColor[0], materialColor[1], materialColor[2], 255);
    p.strokeWeight(fullStringThickness);
    p.line(x, soundboxY, x, topBridgeY);

    // Draw playable section (active vibrating portion) - thicker, highlight it
    if (string.isPlaying) {
        // Animated vibration effect
        const vibrationAmount = string.playingAmplitude * 5;
        const vibrationX = x + p.sin(p.frameCount * 0.3) * vibrationAmount;

        // Glow effect for playing string - brighter material color
        p.stroke(materialColor[0], materialColor[1], materialColor[2], 150);
        p.strokeWeight(playableThickness * 3);
        p.line(vibrationX, lowerCapoY, vibrationX, upperCapoY);

        // Main vibrating string - full material color, thicker based on gauge
        p.stroke(materialColor[0], materialColor[1], materialColor[2], 255);
        p.strokeWeight(playableThickness * 1.8);
        p.line(vibrationX, lowerCapoY, vibrationX, upperCapoY);

    } else {
        // Static string - use material color or selection color, thickness based on gauge
        if (isSelected) {
            // Selected: show material color with black outline
            p.stroke(0, 0, 0); // Black outline
            p.strokeWeight(playableThickness * 1.6);
            p.line(x, lowerCapoY, x, upperCapoY);

            p.stroke(materialColor[0], materialColor[1], materialColor[2], 255); // Material color
            p.strokeWeight(playableThickness * 1.3);
            p.line(x, lowerCapoY, x, upperCapoY);
        } else {
            p.stroke(materialColor[0], materialColor[1], materialColor[2], 255);
            p.strokeWeight(playableThickness);
            p.line(x, lowerCapoY, x, upperCapoY);
        }
    }

    // Draw capos
    drawCapo(p, x, lowerCapoY, string.isDraggingLowerCapo);
    drawCapo(p, x, upperCapoY, string.isDraggingUpperCapo);

    // Draw anchor points at string ends
    p.noStroke();
    p.fill(VISUAL_CONSTANTS.COLORS.capoStroke);
    p.circle(x, soundboxY, 3);
    p.circle(x, topBridgeY, 3);
}

/**
 * Draw a capo mechanism
 *
 * @param {p5} p - p5.js instance
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {boolean} isDragging - Whether capo is being dragged
 */
function drawCapo(p, x, y, isDragging) {
    const width = VISUAL_CONSTANTS.CAPO_WIDTH;
    const height = VISUAL_CONSTANTS.CAPO_HEIGHT;

    const color = isDragging ?
        VISUAL_CONSTANTS.COLORS.capoDragging :
        VISUAL_CONSTANTS.COLORS.capo;

    // Capo body (rectangular clamp)
    p.fill(color);
    p.stroke(VISUAL_CONSTANTS.COLORS.capoStroke);
    p.strokeWeight(1.5);
    p.rect(x - width / 2, y - height / 2, width, height, 2);

    // Pressure pad (black rubber strip)
    p.fill(VISUAL_CONSTANTS.COLORS.capoPad);
    p.noStroke();
    p.rect(x - width / 2 + 2, y - 2, width - 4, 4, 1);

    // Thumbscrew (adjustment mechanism)
    p.fill(VISUAL_CONSTANTS.COLORS.capoScrew);
    p.stroke(VISUAL_CONSTANTS.COLORS.capoStroke);
    p.strokeWeight(0.5);
    p.circle(x + width / 2 - 4, y, 5);

    // Screw detail
    p.stroke(VISUAL_CONSTANTS.COLORS.capoStroke);
    p.strokeWeight(0.5);
    p.line(x + width / 2 - 6, y, x + width / 2 - 2, y);
}

/**
 * Draw UI overlay showing mode and info
 *
 * @param {p5} p - p5.js instance
 * @param {string} mode - Current interaction mode
 * @param {number} numStrings - Number of strings
 */
function drawUIOverlay(p, mode, numStrings) {
    // String count at top right
    p.fill(VISUAL_CONSTANTS.COLORS.text);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(VISUAL_CONSTANTS.FONT_SIZES.label);
    p.text(numStrings + ' STRINGS', p.width - 15, 15);

    // Note: Mode and material info now displayed in HTML overlay at bottom
    // Removed canvas text to avoid overlap
}

/**
 * Draw keyboard shortcuts help overlay
 *
 * @param {p5} p - p5.js instance
 */
function drawKeyboardShortcuts(p) {
    const shortcuts = [
        '← → : SELECT STRING',
        '↑ ↓ : MOVE CAPO (10mm)',
        'SHIFT+↑↓ : SWITCH CAPO',
        '+ - : SEMITONE',
        'PgUp/PgDn : OCTAVE',
        'SPACE : PLUCK',
        '1-3 : MODE',
        'T : TEST AUDIO'
    ];

    const x = p.width - 15;
    const startY = 50;
    const lineHeight = 16;

    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(11);
    p.fill(VISUAL_CONSTANTS.COLORS.textDim);

    shortcuts.forEach((shortcut, index) => {
        p.text(shortcut, x, startY + (index * lineHeight));
    });
}

/**
 * Draw selection highlight for a string
 *
 * @param {p5} p - p5.js instance
 * @param {HarpString} string - String to highlight
 */
function drawStringHighlight(p, string) {
    const x = (string.index + 0.5) * (p.width / string.totalStrings);
    const lowerCapoY = mmToScreenY(string.lowerCapoMm, p.height);
    const upperCapoY = mmToScreenY(string.upperCapoMm, p.height);

    // Semi-transparent highlight
    p.fill(VISUAL_CONSTANTS.COLORS.hover);
    p.noStroke();
    p.rect(x - 15, upperCapoY, 30, lowerCapoY - upperCapoY);
}

/**
 * Draw string number labels (for debugging or detailed view)
 *
 * @param {p5} p - p5.js instance
 * @param {Array<HarpString>} strings - Array of strings
 * @param {boolean} showAll - Show all labels or just selected
 */
function drawStringLabels(p, strings, showAll) {
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(VISUAL_CONSTANTS.FONT_SIZES.small);

    strings.forEach((string, index) => {
        if (!showAll && !string.isSelected) return;

        const x = (index + 0.5) * (p.width / string.totalStrings);
        const y = mmToScreenY(PHYSICS_CONSTANTS.FULL_STRING_LENGTH, p.height) - 25;

        p.fill(VISUAL_CONSTANTS.COLORS.textDim);
        p.noStroke();
        p.text(string.noteName, x, y);
    });
}

/**
 * Draw string spacing distances
 *
 * @param {p5} p - p5.js instance
 * @param {number} totalStrings - Total number of strings
 */
function drawStringSpacing(p, totalStrings) {
    const stringWidth = p.width / totalStrings;
    const wallWidthFt = PHYSICS_CONSTANTS.WALL_WIDTH / 304.8; // Convert mm to feet
    const spacingFt = wallWidthFt / totalStrings;

    // Only show spacing if there aren't too many strings
    if (totalStrings > 48) return;

    p.textAlign(p.CENTER, p.TOP);
    p.textSize(8);
    p.fill(VISUAL_CONSTANTS.COLORS.textDim);
    p.noStroke();

    // Show spacing between first few strings
    const showCount = Math.min(5, totalStrings - 1);
    for (let i = 0; i < showCount; i++) {
        const x = (i + 1) * stringWidth;
        const y = p.height - 60;

        // Draw distance marker
        p.stroke(VISUAL_CONSTANTS.COLORS.measurementLine);
        p.strokeWeight(1);
        p.line(x, y - 5, x, y + 5);

        p.noStroke();
        p.text(spacingFt.toFixed(2) + 'ft', x, y + 8);
    }

    // Show total wall width
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.textSize(9);
    p.text('Wall: ' + wallWidthFt.toFixed(1) + 'ft total', p.width - 10, p.height - 60);
}

// Export for ES6 modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        mmToScreenY,
        screenYToMm,
        drawSoundbox,
        drawTopBridge,
        drawResonator,
        drawMeasurementRuler,
        drawString,
        drawCapo,
        drawUIOverlay,
        drawKeyboardShortcuts,
        drawStringHighlight,
        drawStringLabels
    };
}
