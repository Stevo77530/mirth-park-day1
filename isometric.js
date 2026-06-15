/**
 * Isometric projection helpers for MIRTH Park
 * Simple diamond-style isometric using classic projection.
 * Grid coordinates are stored as (gridX, gridY).
 * Screen coordinates are calculated for rendering and input.
 */

const TILE_WIDTH = 48;
const TILE_HEIGHT = 24;
const HALF_WIDTH = TILE_WIDTH / 2;
const HALF_HEIGHT = TILE_HEIGHT / 2;

const ISO = {
    /**
     * Convert grid coordinates to screen position (top-left of tile)
     */
    gridToScreen(gridX, gridY) {
        const screenX = (gridX - gridY) * HALF_WIDTH;
        const screenY = (gridX + gridY) * HALF_HEIGHT;
        return { x: screenX, y: screenY };
    },

    /**
     * Convert screen click position back to nearest grid tile
     * Assumes canvas has been offset so (0,0) is the top of the map
     */
    screenToGrid(screenX, screenY, offsetX = 0, offsetY = 0) {
        const x = screenX - offsetX;
        const y = screenY - offsetY;

        // Inverse isometric projection
        const gridX = Math.floor((x / HALF_WIDTH + y / HALF_HEIGHT) / 2);
        const gridY = Math.floor((y / HALF_HEIGHT - x / HALF_WIDTH) / 2);

        return { gridX, gridY };
    },

    /**
     * Get the draw depth for correct isometric sorting (higher = drawn later = on top)
     */
    getDepth(gridX, gridY) {
        return gridX + gridY;
    },

    /**
     * Get center of a tile in screen space (useful for guests)
     */
    getTileCenter(gridX, gridY) {
        const pos = this.gridToScreen(gridX, gridY);
        return {
            x: pos.x + HALF_WIDTH,
            y: pos.y + HALF_HEIGHT
        };
    }
};

// Export for other modules (simple global for prototype)
window.ISO = ISO;
window.TILE_WIDTH = TILE_WIDTH;
window.TILE_HEIGHT = TILE_HEIGHT;