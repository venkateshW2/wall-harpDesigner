/**
 * WALL HARP SIMULATOR - VISUALIZATION
 * p5.js rendering functions for string instrument visualization
 */

// ===== COORDINATE CONVERSION FUNCTIONS =====

/**
 * Convert pixel coordinates to wall position in feet and inches
 * @param {number} pixelX - X position in pixels
 * @param {number} pixelY - Y position in pixels
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {object} - {x: "feet'inches\"", y: "feet'inches\"", xScale: "inches\""}
 */
function pixelsToWallPosition(pixelX, pixelY, canvasWidth, canvasHeight) {
    // Convert pixels to mm
    const wallWidthMm = PHYSICS_CONSTANTS.WALL_WIDTH;
    const wallHeightMm = PHYSICS_CONSTANTS.FULL_STRING_LENGTH;

    const xMm = (pixelX / canvasWidth) * wallWidthMm;
    const yMm = (pixelY / canvasHeight) * wallHeightMm;

    // Convert mm to inches (1 inch = 25.4mm)
    const xInches = xMm / 25.4;
    const yInches = yMm / 25.4;

    // Convert to feet and inches
    const xFeet = Math.floor(xInches / 12);
    const xInchesRemainder = (xInches % 12).toFixed(1);
    const yFeet = Math.floor(yInches / 12);
    const yInchesRemainder = (yInches % 12).toFixed(1);

    return {
        x: `${xFeet}'${xInchesRemainder}"`,
        y: `${yFeet}'${yInchesRemainder}"`,
        xScale: `${xInches.toFixed(1)}"`  // X-scale in inches from left edge
    };
}

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
 * Check if point is near another point
 * @param {number} px - Point X
 * @param {number} py - Point Y
 * @param {number} ex - Endpoint X
 * @param {number} ey - Endpoint Y
 * @param {number} threshold - Distance threshold
 * @returns {boolean}
 */
function isNearPoint(px, py, ex, ey, threshold = 20) {
    const dist = Math.sqrt((px - ex) ** 2 + (py - ey) ** 2);
    return dist < threshold;
}

/**
 * Draw endpoint marker (capo equivalent in draw mode)
 * @param {p5} p - p5.js instance
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {boolean} isDragging - Is this endpoint being dragged?
 * @param {boolean} isStart - Is this the start point (vs end point)?
 * @param {Array} color - RGB color array for the string
 * @param {number} canvasWidth - Canvas width for coordinate conversion
 * @param {number} canvasHeight - Canvas height for coordinate conversion
 * @param {boolean} showCoordinates - Whether to show position coordinates
 */
function drawEndpoint(p, x, y, isDragging, isStart, color, canvasWidth, canvasHeight, showCoordinates = false) {
    const size = isDragging ? 16 : 12;

    // Outer circle (based on string color)
    p.fill(color[0], color[1], color[2], 200);
    p.stroke(VISUAL_CONSTANTS.COLORS.capoStroke);
    p.strokeWeight(2);
    p.circle(x, y, size);

    // Inner indicator (different for start vs end)
    if (isStart) {
        // Start point: filled circle
        p.fill(VISUAL_CONSTANTS.COLORS.capo);
        p.noStroke();
        p.circle(x, y, size / 2);
    } else {
        // End point: hollow circle
        p.noFill();
        p.stroke(VISUAL_CONSTANTS.COLORS.capo);
        p.strokeWeight(2);
        p.circle(x, y, size / 2);
    }

    // Draw position coordinates only when interacting (dragging, hovering, or selected)
    if (showCoordinates) {
        const pos = pixelsToWallPosition(x, y, canvasWidth, canvasHeight);
        const labelText = `X:${pos.xScale} Y:${pos.y}`;

        // Position label offset based on endpoint position
        const offsetX = x > canvasWidth / 2 ? -5 : 5;
        const offsetY = y > canvasHeight / 2 ? -10 : 15;

        // Draw text without background - bold black text
        p.textSize(10);
        p.textAlign(offsetX < 0 ? p.RIGHT : p.LEFT, p.CENTER);
        p.fill(0, 0, 0);  // Black text
        p.noStroke();
        p.textStyle(p.BOLD);
        p.text(labelText, x + offsetX + (offsetX < 0 ? -4 : 4), y + offsetY);
        p.textStyle(p.NORMAL);
    }
}

/**
 * Draw a string in draw mode (free-form line)
 * @param {p5} p - p5.js instance
 * @param {HarpString} string - String object
 * @param {boolean} isSelected - Whether string is selected
 * @param {boolean} isHovered - Whether string is hovered
 */
function drawStringInDrawMode(p, string, isSelected, isHovered) {
    // Check if endpoints are set
    if (string.startX === null || string.endX === null) {
        return; // String not yet placed
    }

    // Get material color for this string
    const materialColor = string.color || VISUAL_CONSTANTS.COLORS.stringInactive;
    const matteColor = [
        Math.floor(materialColor[0] * 0.8),
        Math.floor(materialColor[1] * 0.8),
        Math.floor(materialColor[2] * 0.8)
    ];

    // Calculate string thickness based on gauge
    const gaugeData = STRING_GAUGES[string.gauge];
    const baseThickness = gaugeData ? (gaugeData.diameter * 10) : 4;
    const stringThickness = Math.max(4, baseThickness * 1.2);

    // Draw the string line
    if (string.isPlaying) {
        // Animated vibration effect
        const vibrationAmount = string.playingAmplitude * 5;
        const midX = (string.startX + string.endX) / 2;
        const midY = (string.startY + string.endY) / 2;

        // Calculate perpendicular offset for vibration
        const dx = string.endX - string.startX;
        const dy = string.endY - string.startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / length;
        const perpY = dx / length;

        const vibrationX = Math.sin(p.frameCount * 0.3) * vibrationAmount;
        const offsetX = perpX * vibrationX;
        const offsetY = perpY * vibrationX;

        // Glow effect
        p.stroke(matteColor[0], matteColor[1], matteColor[2], 120);
        p.strokeWeight(stringThickness * 3);
        p.line(
            string.startX + offsetX, string.startY + offsetY,
            string.endX + offsetX, string.endY + offsetY
        );

        // Main vibrating string
        p.stroke(matteColor[0], matteColor[1], matteColor[2], 255);
        p.strokeWeight(stringThickness * 1.8);
        p.line(
            string.startX + offsetX, string.startY + offsetY,
            string.endX + offsetX, string.endY + offsetY
        );
    } else {
        // Static string
        if (isSelected) {
            // Selected: black outline
            p.stroke(0, 0, 0);
            p.strokeWeight(stringThickness * 1.6);
            p.line(string.startX, string.startY, string.endX, string.endY);

            // Inner string with color
            p.stroke(matteColor[0], matteColor[1], matteColor[2], 255);
            p.strokeWeight(stringThickness * 1.3);
            p.line(string.startX, string.startY, string.endX, string.endY);
        } else {
            // Normal string
            p.stroke(matteColor[0], matteColor[1], matteColor[2], 220);
            p.strokeWeight(stringThickness);
            p.line(string.startX, string.startY, string.endX, string.endY);
        }
    }

    // Draw endpoints with position coordinates (show coordinates only when interacting)
    const showCoords = isHovered || isSelected || string.isDraggingStart || string.isDraggingEnd;
    drawEndpoint(p, string.startX, string.startY, string.isDraggingStart, true, materialColor, p.width, p.height, showCoords);
    drawEndpoint(p, string.endX, string.endY, string.isDraggingEnd, false, materialColor, p.width, p.height, showCoords);

    // Draw string info overlay only when hovered, selected, or playing
    if (isHovered || isSelected || string.isPlaying) {
        const midX = (string.startX + string.endX) / 2;
        const midY = (string.startY + string.endY) / 2;

        // Calculate string length in feet and inches
        const lengthMm = string.calculateDrawLength(p.height);
        const lengthInches = lengthMm / 25.4;
        const lengthFeet = Math.floor(lengthInches / 12);
        const lengthInchesRemainder = (lengthInches % 12).toFixed(1);
        const lengthStr = `${lengthFeet}'${lengthInchesRemainder}"`;

        // Get material and gauge info
        const materialName = STRING_MATERIALS[string.material]?.name || string.material;
        const gaugeName = STRING_GAUGES[string.gauge]?.name || string.gauge;

        // Build info text
        const freq = string.actualFrequency.toFixed(1);
        const line1 = `#${string.index + 1}: ${string.noteName} | ${freq}Hz`;
        const line2 = `${lengthStr} | ${materialName} ${gaugeName}`;
        const line3 = `${string.tension.toFixed(0)}N`;

        // Calculate perpendicular offset for text (place text to the side of the string)
        const dx = string.endX - string.startX;
        const dy = string.endY - string.startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / length;
        const perpY = dx / length;

        // Offset text to the side (increased distance for better visibility)
        const textOffsetDistance = 50;
        const textX = midX + perpX * textOffsetDistance;
        const textY = midY + perpY * textOffsetDistance;

        // Draw semi-transparent background for better readability
        p.textSize(11);
        const line1Width = p.textWidth(line1);
        p.textSize(10);
        const line2Width = p.textWidth(line2);
        const line3Width = p.textWidth(line3);
        const maxWidth = Math.max(line1Width, line2Width, line3Width);

        // Background rectangle
        p.fill(255, 255, 255, 200);  // Semi-transparent white
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(textX, textY, maxWidth + 12, 42, 4);

        // Draw text - bold black text
        p.textAlign(p.CENTER, p.CENTER);
        p.textStyle(p.BOLD);
        p.fill(0, 0, 0);  // Bold black text
        p.noStroke();

        p.textSize(11);
        p.text(line1, textX, textY - 12);
        p.textSize(10);
        p.text(line2, textX, textY + 2);
        p.text(line3, textX, textY + 13);
        p.textStyle(p.NORMAL);
    }
}

/**
 * Draw a single string with proper capo visualization
 *
 * @param {p5} p - p5.js instance
 * @param {HarpString} string - String object to draw
 * @param {boolean} isSelected - Whether this string is selected
 * @param {string} currentMode - Current interaction mode
 * @param {boolean} isHovered - Whether this string is hovered
 */
function drawString(p, string, isSelected, currentMode, isHovered = false) {
    // Only show draw mode strings when in DRAW mode
    if (currentMode === INTERACTION_CONSTANTS.MODES.DRAW && string.drawMode && string.startX !== null) {
        drawStringInDrawMode(p, string, isSelected, isHovered);
        return;
    }

    // In DRAW mode, don't show vertical strings
    if (currentMode === INTERACTION_CONSTANTS.MODES.DRAW) {
        return;
    }

    // Original vertical string drawing code below (UNCHANGED)
    const x = (string.index + 0.5) * (p.width / string.totalStrings);

    // Calculate Y positions
    const soundboxY = mmToScreenY(0, p.height);
    const topBridgeY = mmToScreenY(PHYSICS_CONSTANTS.FULL_STRING_LENGTH, p.height);
    const lowerCapoY = mmToScreenY(string.lowerCapoMm, p.height);
    const upperCapoY = mmToScreenY(string.upperCapoMm, p.height);

    // Always show string number and note name - black for readability
    p.fill(0, 0, 0);
    p.noStroke();
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(VISUAL_CONSTANTS.FONT_SIZES.stringNote);
    p.textStyle(p.BOLD);
    p.text(string.noteName, x, topBridgeY - 5);

    // String number and X-distance from string #1
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(VISUAL_CONSTANTS.FONT_SIZES.stringNumber);
    p.textStyle(p.BOLD);
    p.fill(0, 0, 0);

    // Calculate distance from first string (string #1 is at position 0)
    const distanceFromFirstMm = string.index * (PHYSICS_CONSTANTS.WALL_WIDTH / string.totalStrings);
    const distanceFromFirstInches = (distanceFromFirstMm / 25.4).toFixed(1);

    // Show string number and distance
    p.text('#' + (string.index + 1), x, soundboxY + 5);
    p.textSize(9);
    p.text(distanceFromFirstInches + '"', x, soundboxY + 18);

    // Get material color for this string - make it matte (reduce brightness)
    const materialColor = string.color || VISUAL_CONSTANTS.COLORS.stringInactive;
    // Reduce brightness by 20% for matte look
    const matteColor = [
        Math.floor(materialColor[0] * 0.8),
        Math.floor(materialColor[1] * 0.8),
        Math.floor(materialColor[2] * 0.8)
    ];

    // Calculate string thickness based on gauge
    const gaugeData = STRING_GAUGES[string.gauge];
    const baseThickness = gaugeData ? (gaugeData.diameter * 10) : 4;
    const fullStringThickness = Math.max(3, baseThickness * 0.8);
    const playableThickness = Math.max(4, baseThickness * 1.2);

    // Draw NON-PLAYABLE sections (outside capos) with reduced opacity (30%)
    // Top section (from top bridge to upper capo)
    p.stroke(matteColor[0], matteColor[1], matteColor[2], 80);
    p.strokeWeight(fullStringThickness);
    p.line(x, topBridgeY, x, upperCapoY);

    // Bottom section (from lower capo to soundbox)
    p.stroke(matteColor[0], matteColor[1], matteColor[2], 80);
    p.strokeWeight(fullStringThickness);
    p.line(x, lowerCapoY, x, soundboxY);

    // Draw PLAYABLE section (between capos) - thicker, full matte color
    if (string.isPlaying) {
        // Animated vibration effect
        const vibrationAmount = string.playingAmplitude * 5;
        const vibrationX = x + p.sin(p.frameCount * 0.3) * vibrationAmount;

        // Glow effect for playing string
        p.stroke(matteColor[0], matteColor[1], matteColor[2], 120);
        p.strokeWeight(playableThickness * 3);
        p.line(vibrationX, lowerCapoY, vibrationX, upperCapoY);

        // Main vibrating string - full matte color
        p.stroke(matteColor[0], matteColor[1], matteColor[2], 255);
        p.strokeWeight(playableThickness * 1.8);
        p.line(vibrationX, lowerCapoY, vibrationX, upperCapoY);

    } else {
        // Static string - use matte color
        if (isSelected) {
            // Selected: show matte color with black outline
            p.stroke(0, 0, 0); // Black outline
            p.strokeWeight(playableThickness * 1.6);
            p.line(x, lowerCapoY, x, upperCapoY);

            p.stroke(matteColor[0], matteColor[1], matteColor[2], 255); // Full matte color
            p.strokeWeight(playableThickness * 1.3);
            p.line(x, lowerCapoY, x, upperCapoY);
        } else {
            p.stroke(matteColor[0], matteColor[1], matteColor[2], 220);
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
    // String count at top right - black for readability
    p.fill(0, 0, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(VISUAL_CONSTANTS.FONT_SIZES.label);
    p.text(numStrings + ' STRINGS', p.width - 15, 15);

    // Note: Mode and material info now displayed in HTML overlay at bottom
    // Removed canvas text to avoid overlap
}

/**
 * Draw currently playing string info on canvas
 *
 * @param {p5} p - p5.js instance
 * @param {Array<HarpString>} strings - Array of all strings
 */
function drawPlayingStringInfo(p, strings) {
    // Find all currently playing strings
    const playingStrings = strings.filter(s => s.isPlaying);

    if (playingStrings.length === 0) return;

    // Simple text display at top center with more padding
    const x = p.width / 2;
    const y = 15;  // Moved up slightly for more space

    p.textAlign(p.CENTER, p.TOP);
    p.textStyle(p.BOLD);
    p.noStroke();

    // Show only the first playing string to keep it simple
    const string = playingStrings[0];

    // String number and note in one line - black for readability
    p.textSize(20);
    p.fill(0, 0, 0);  // Black instead of grey
    const freq = string.targetFrequency.toFixed(1);
    const cents = parseFloat(string.centsDeviation).toFixed(1);
    const centsText = cents > 0 ? '+' + cents : cents;

    p.text(`#${string.index + 1}: ${string.noteName} | ${freq}Hz | ${centsText}¢`, x, y);

    p.textStyle(p.NORMAL); // Reset to normal
}

/**
 * Draw keyboard shortcuts help overlay
 *
 * @param {p5} p - p5.js instance
 * @param {string} currentMode - Current interaction mode
 */
function drawKeyboardShortcuts(p, currentMode) {
    let shortcuts;

    if (currentMode === INTERACTION_CONSTANTS.MODES.DRAW) {
        // Draw mode shortcuts - no capo controls
        shortcuts = [
            '← → : SELECT STRING',
            'SHIFT+CLICK : PLACE STRING',
            'DRAG : MOVE ENDPOINT',
            'CLICK : PLUCK',
            'DEL : DELETE STRING',
            'SPACE : PLUCK',
            '1-4 : MODE',
            'T : TEST AUDIO'
        ];
    } else {
        // Standard mode shortcuts - include capo controls
        shortcuts = [
            '← → : SELECT STRING',
            '↑ ↓ : MOVE CAPO (10mm)',
            'SHIFT+↑↓ : SWITCH CAPO',
            '+ - : SEMITONE',
            'PgUp/PgDn : OCTAVE',
            'SPACE : PLUCK',
            '1-4 : MODE',
            'T : TEST AUDIO'
        ];
    }

    const x = p.width - 15;
    const startY = 60;  // Increased from 50 for more padding
    const lineHeight = 16;

    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(13);
    p.textStyle(p.BOLD);
    p.fill(0, 0, 0);  // Black for readability

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
