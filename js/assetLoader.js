/**
 * Asset Loader System for PNG Images
 * Handles loading and caching of game assets
 */

class AssetLoader {
    constructor() {
        this.assets = new Map();
        this.loadingPromises = new Map();
        this.loadedCount = 0;
        this.totalAssets = 0;
    }

    /**
     * Load a single image asset
     * @param {string} name - Asset name/key
     * @param {string} path - Path to the image file
     * @returns {Promise<HTMLImageElement>}
     */
    async loadImage(name, path) {
        // Return cached asset if already loaded
        if (this.assets.has(name)) {
            return this.assets.get(name);
        }

        // Return existing promise if already loading
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }

        // Create new loading promise
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.assets.set(name, img);
                this.loadedCount++;
                this.loadingPromises.delete(name);
                console.log(`Loaded asset: ${name} (${this.loadedCount}/${this.totalAssets})`);
                resolve(img);
            };
            img.onerror = () => {
                this.loadingPromises.delete(name);
                console.error(`Failed to load asset: ${name} from ${path}`);
                reject(new Error(`Failed to load asset: ${name}`));
            };
            img.src = path;
        });

        this.loadingPromises.set(name, promise);
        return promise;
    }

    /**
     * Load multiple assets in parallel
     * @param {Object} assetList - Object with name: path pairs
     * @returns {Promise<Object>} Object with loaded assets
     */
    async loadAssets(assetList) {
        this.totalAssets = Object.keys(assetList).length;
        this.loadedCount = 0;

        const promises = Object.entries(assetList).map(([name, path]) => 
            this.loadImage(name, path)
        );

        try {
            await Promise.all(promises);
            console.log('All assets loaded successfully');
            return this.getAssets(Object.keys(assetList));
        } catch (error) {
            console.error('Error loading assets:', error);
            throw error;
        }
    }

    /**
     * Get loaded asset by name
     * @param {string} name - Asset name
     * @returns {HTMLImageElement|null}
     */
    getAsset(name) {
        return this.assets.get(name) || null;
    }

    /**
     * Get multiple assets by names
     * @param {string[]} names - Array of asset names
     * @returns {Object} Object with requested assets
     */
    getAssets(names) {
        const result = {};
        names.forEach(name => {
            result[name] = this.getAsset(name);
        });
        return result;
    }

    /**
     * Check if asset is loaded
     * @param {string} name - Asset name
     * @returns {boolean}
     */
    isLoaded(name) {
        return this.assets.has(name);
    }

    /**
     * Get loading progress (0-1)
     * @returns {number}
     */
    getProgress() {
        if (this.totalAssets === 0) return 1;
        return this.loadedCount / this.totalAssets;
    }

    /**
     * Clear all assets from memory
     */
    clear() {
        this.assets.clear();
        this.loadingPromises.clear();
        this.loadedCount = 0;
        this.totalAssets = 0;
    }
}

// Create global asset loader instance
export const assetLoader = new AssetLoader();

// Asset definitions
export const ASSET_PATHS = {
    // Player assets
    'player_idle': 'assets/player/player_idle.png',
    'player_jump': 'assets/player/player_jump.png',
    'player_magnet': 'assets/player/player_magnet.png',
    'player_double_jump': 'assets/player/player_double_jump.png',
    
    // Collectible assets
    'pixel_yellow': 'assets/collectibles/pixel_yellow.png',
    'pixel_orange': 'assets/collectibles/pixel_orange.png',
    'pixel_purple': 'assets/collectibles/pixel_purple.png',
    'pixel_red': 'assets/collectibles/pixel_red.png',
    'modifier_magnet': 'assets/collectibles/modifier_magnet.png',
    'modifier_double_jump': 'assets/collectibles/modifier_double_jump.png',
    
    // Platform assets
    'platform_grass': 'assets/platforms/platform_grass.png',
    'platform_grass_left': 'assets/platforms/platform_grass_left.png',
    'platform_grass_right': 'assets/platforms/platform_grass_right.png',
    'platform_grass_center': 'assets/platforms/platform_grass_center.png',
    
    // Background assets
    'cloud_small': 'assets/backgrounds/cloud_small.png',
    'cloud_medium': 'assets/backgrounds/cloud_medium.png',
    'cloud_large': 'assets/backgrounds/cloud_large.png',
    'mountain_distant': 'assets/backgrounds/mountain_distant.png',
    'mountain_near': 'assets/backgrounds/mountain_near.png',
    'tree_small': 'assets/backgrounds/tree_small.png',
    'tree_medium': 'assets/backgrounds/tree_medium.png',
    'tree_large': 'assets/backgrounds/tree_large.png',
    'bush_small': 'assets/backgrounds/bush_small.png',
    'bush_medium': 'assets/backgrounds/bush_medium.png',
    
    // Portal assets
    'portal_ring': 'assets/backgrounds/portal_ring.png',
    'portal_center': 'assets/backgrounds/portal_center.png'
};

/**
 * Initialize asset loading
 * @returns {Promise<void>}
 */
export async function initAssets() {
    try {
        console.log('Starting asset loading...');
        await assetLoader.loadAssets(ASSET_PATHS);
        console.log('Asset loading completed');
    } catch (error) {
        console.error('Asset loading failed:', error);
        // Continue with fallback to programmatic graphics
        console.log('Falling back to programmatic graphics');
    }
}

/**
 * Get asset with fallback to programmatic graphics
 * @param {string} name - Asset name
 * @returns {HTMLImageElement|null}
 */
export function getAssetWithFallback(name) {
    return assetLoader.getAsset(name);
}

/**
 * Check if assets are available
 * @returns {boolean}
 */
export function hasAssets() {
    return assetLoader.loadedCount > 0;
}
