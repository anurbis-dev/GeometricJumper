import { getParticles, getGameState, getTimeScale } from './physics.js';
import { getGeneratedLevelData } from './levelGenerator.js';
import { getCamera, updateCamera, initCamera } from './camera.js';
import { getPlayer } from './player.js';
import { drawCollectibles } from './collectibles.js';
import { getAssetWithFallback, hasAssets } from './assetLoader.js';

let preRenderedPlatformsCanvas = null;
let swayTime = 0;
let renderBuffer = 0;
let portalGradient = null;
let lastPortalTime = 0;

const parallaxLayers = {
    sky: { speed: 0 },
    clouds: { speed: 0.02, elements: [] },
    distantMountains: { speed: 0.03, elements: [] },
    mountains: { speed: 0.05, elements: [] },
    treesAndBushes: { speed: 0.1 / 3, elements: [] },
};

export function resizeCanvas(canvas) {
    const container = document.getElementById('game-container');
    const aspectRatio = 16 / 9;
    
    if (document.fullscreenElement) {
         container.style.width = '100vw';
         container.style.height = '100vh';
         container.style.borderRadius = '0';
    } else {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        if (screenWidth / screenHeight > aspectRatio) {
            container.style.height = `${screenHeight * 0.95}px`;
            container.style.width = `${screenHeight * 0.95 * aspectRatio}px`;
        } else {
            container.style.width = `${screenWidth * 0.95}px`;
            container.style.height = `${screenWidth * 0.95 / aspectRatio}px`;
        }
        container.style.borderRadius = '15px';
    }

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    renderBuffer = canvas.width * 0.5;

    initCamera(canvas);
}

export function preRenderLevel(ctx, levelData, canvasWidth, canvasHeight) {
    preRenderedPlatformsCanvas = document.createElement('canvas');
    preRenderedPlatformsCanvas.width = levelData.levelLength + canvasWidth;
    preRenderedPlatformsCanvas.height = canvasHeight;
    const preCtx = preRenderedPlatformsCanvas.getContext('2d');

    const platformColor = `hsl(${levelData.levelColorHue - 150}, 25%, 50%)`;
    const platformBottomColor = `hsl(${levelData.levelColorHue - 150}, 25%, 35%)`;
    const grassColor = `hsl(${levelData.levelColorHue - 80}, 45%, 50%)`;
    
    parallaxLayers.clouds.elements = levelData.parallaxElements.clouds;
    parallaxLayers.distantMountains.elements = levelData.parallaxElements.distantMountains;
    parallaxLayers.mountains.elements = levelData.parallaxElements.mountains;
    parallaxLayers.treesAndBushes.elements = levelData.parallaxElements.treesAndBushes;

    levelData.platforms.forEach(p => {
        preCtx.fillStyle = platformColor;
        preCtx.fillRect(p.x, p.y, p.width, p.height);
        if (p.bottomShape) {
            preCtx.fillStyle = platformBottomColor;
            preCtx.beginPath();
            preCtx.moveTo(p.x, p.y + p.height);
            p.bottomShape.forEach(point => preCtx.lineTo(point.x, point.y));
            preCtx.lineTo(p.x + p.width, p.y + p.height);
            preCtx.closePath();
            preCtx.fill();
        }
        const staticSwayTime = p.x / 20.0;
        drawGrassOnPlatform(p, grassColor, preCtx, staticSwayTime);
    });
}

export function draw(ctx, canvas, dt) {
    const levelData = getGeneratedLevelData();

    if (!levelData || levelData.levelColorHue === undefined) {
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }
    
    const { activeCollectibles, activeTreesAndBushes } = levelData;
    const player = getPlayer();
    const gameState = getGameState();
    
    swayTime += dt * getTimeScale();
    
    updateCamera(dt);
    const camera = getCamera();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, `hsl(${levelData.levelColorHue}, 70%, 60%)`);
    skyGradient.addColorStop(1, `hsl(${levelData.levelColorHue + 20}, 70%, 80%)`);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    
    drawParallaxLayer(ctx, canvas, camera, parallaxLayers.clouds, (el) => { 
        const cloudImage = getAssetWithFallback('cloud_medium');
        if (hasAssets() && cloudImage) {
            ctx.globalAlpha = el.alpha;
            ctx.drawImage(cloudImage, el.x - cloudImage.width / 2, el.y - cloudImage.height / 2);
            ctx.globalAlpha = 1;
        } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${el.alpha})`; 
            ctx.beginPath(); 
            ctx.ellipse(el.x, el.y, el.radiusX, el.radiusY, 0, 0, Math.PI * 2); 
            ctx.fill(); 
        }
    });
    const drawMountain = (el) => { 
        const mountainImage = getAssetWithFallback('mountain_distant');
        if (hasAssets() && mountainImage) {
            ctx.drawImage(mountainImage, el.x - mountainImage.width/2, el.y - mountainImage.height);
        } else {
            ctx.beginPath(); 
            ctx.moveTo(el.x + el.points[0].x, el.y + el.points[0].y); 
            for(let i = 1; i < el.points.length; i++) { 
                ctx.lineTo(el.x + el.points[i].x, el.y + el.points[i].y); 
            } 
            ctx.closePath(); 
            ctx.fill(); 
        }
    };
    drawParallaxLayer(ctx, canvas, camera, parallaxLayers.distantMountains, drawMountain, `hsl(${levelData.levelColorHue - 10}, 20%, 45%)`);
    drawParallaxLayer(ctx, canvas, camera, parallaxLayers.mountains, drawMountain, `hsl(${levelData.levelColorHue}, 30%, 30%)`);
    
    if (preRenderedPlatformsCanvas) {
        ctx.drawImage(preRenderedPlatformsCanvas, 0, 0);
    }
    
    const treeLayer = parallaxLayers.treesAndBushes;
    ctx.save();
    ctx.translate(-(camera.x * treeLayer.speed), -(camera.y * treeLayer.speed));
    activeTreesAndBushes.forEach(el => drawTreeOrBush(ctx, el, levelData.levelColorHue));
    ctx.restore();
    
    drawCollectibles(ctx, activeCollectibles);

    if (levelData.teleport.x && levelData.teleport.x + levelData.teleport.width > camera.x && levelData.teleport.x < camera.x + canvas.width) {
        drawPortal(ctx, levelData.teleport, levelData.portalRings);
    }

    if (gameState === 'dead' || gameState === 'panningToRespawn') {
        getParticles().forEach(p => {
            ctx.save();
            ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
            ctx.rotate(p.angle);
            ctx.fillStyle = `rgba(231, 76, 60, ${p.life})`;
            ctx.fillRect(-p.width/2, -p.height/2, p.width, p.height);
            ctx.restore();
        });
    } else if (gameState !== 'levelEnd' && gameState !== 'mainMenu') {
        drawPlayer(ctx, player);
    }
    
    ctx.restore();
}

function drawPlayer(ctx, player) {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(player.angle);

    const magnetActive = player.effects.magnetTimer > 0;
    const jumpActive = player.effects.doubleJumpTimer > 0;
    
    // Try to use PNG assets first
    let playerImage = null;
    if (hasAssets()) {
        if (magnetActive && jumpActive) {
            // Use magnet image for combined effects
            playerImage = getAssetWithFallback('player_magnet');
        } else if (magnetActive) {
            playerImage = getAssetWithFallback('player_magnet');
        } else if (jumpActive) {
            playerImage = getAssetWithFallback('player_double_jump');
        } else if (!player.onGround) {
            playerImage = getAssetWithFallback('player_jump');
        } else {
            playerImage = getAssetWithFallback('player_idle');
        }
    }

    if (playerImage) {
        // Draw PNG image in original size
        ctx.drawImage(playerImage, -playerImage.width / 2, -playerImage.height / 2);
    } else {
        // Fallback to programmatic graphics
        let playerColor;
        
        if (magnetActive || jumpActive) {
            const time = performance.now() / 200;
            const mixFactor = (Math.sin(time) + 1) / 2;

            if (magnetActive && jumpActive) {
                const r = 255 * mixFactor;
                const b = 255 * (1 - mixFactor);
                playerColor = `rgb(${r}, 200, ${b})`;
            } else if (magnetActive) {
                playerColor = `hsl(60, 100%, 70%)`;
            } else {
                playerColor = `hsl(195, 100%, 60%)`;
            }
        } else {
            playerColor = `hsl(0, 70%, 60%)`;
        }

        ctx.fillStyle = playerColor;
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 4;
        ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
        ctx.strokeRect(-player.width / 2, -player.height / 2, player.width, player.height);
    }

    if (player.flashTime > 0) {
        const flashAlpha = player.flashTime / 10;
        // Уменьшаем прозрачность вспышки, чтобы она не перекрывала основной цвет
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.5})`;
        ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    }

    ctx.restore();
}

function drawPortal(ctx, teleport, portalRings) {
    const centerX = teleport.x + teleport.width / 2;
    const centerY = teleport.y + teleport.height / 2;
    
    // Try to use PNG assets first
    const portalCenterImage = getAssetWithFallback('portal_center');
    const portalRingImage = getAssetWithFallback('portal_ring');
    
    if (hasAssets() && portalCenterImage && portalRingImage) {
        // Draw PNG portal
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Draw rotating rings
        if (portalRings.length > 0) {
            ctx.rotate(portalRings[0].angle);
            ctx.drawImage(portalRingImage, -portalRingImage.width / 2, -portalRingImage.height / 2);
            ctx.rotate(-portalRings[0].angle);
            
            ctx.rotate(portalRings[1].angle);
            ctx.drawImage(portalRingImage, -portalRingImage.width / 3, -portalRingImage.height / 3, portalRingImage.width * 2/3, portalRingImage.height * 2/3);
            ctx.rotate(-portalRings[1].angle);
        }
        
        // Draw center
        ctx.drawImage(portalCenterImage, -portalCenterImage.width / 2, -portalCenterImage.height / 2);
        
        ctx.restore();
    } else {
        // Fallback to programmatic graphics
        // Cache gradient and only update every 100ms for performance
        const currentTime = performance.now();
        if (!portalGradient || currentTime - lastPortalTime > 100) {
            portalGradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, teleport.width * 0.7);
            portalGradient.addColorStop(0, `rgba(220, 240, 255, ${0.6 + Math.sin(currentTime / 200) * 0.2})`);
            portalGradient.addColorStop(1, `rgba(52, 152, 219, 0)`);
            lastPortalTime = currentTime;
        }
        ctx.fillStyle = portalGradient;
        ctx.fillRect(teleport.x, teleport.y, teleport.width, teleport.height);

        if (portalRings.length > 0) {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.strokeStyle = '#ecf0f1';
            
            ctx.save();
            ctx.lineWidth = 4;
            ctx.rotate(portalRings[0].angle);
            ctx.strokeRect(-teleport.width / 2.2, -teleport.height / 2.2, teleport.width * 1.1, teleport.height * 1.1);
            ctx.restore();

            ctx.save();
            ctx.lineWidth = 2;
            ctx.rotate(portalRings[1].angle);
            ctx.strokeRect(-teleport.width / 3, -teleport.height / 3, teleport.width * 2/3, teleport.height * 2/3);
            ctx.restore();

            ctx.restore();
        }
    }
}

function drawParallaxLayer(ctx, canvas, camera, layer, drawElement, color) {
    if (!layer || !layer.elements) return;
    ctx.fillStyle = color || '#000';
    const layerX = camera.x * layer.speed;
    const layerY = camera.y * layer.speed;
    const isMountainLayer = layer === parallaxLayers.mountains || layer === parallaxLayers.distantMountains;
    const layerRenderBuffer = isMountainLayer ? renderBuffer * 2.5 : renderBuffer;
    
    ctx.save();
    ctx.translate(-layerX, -layerY);
    layer.elements.forEach(el => {
        const elOnScreenX = (el.x - layerX) - (camera.x - layerX);
        const elWidth = el.base || el.radiusX * 2 || 200;
        if (elOnScreenX > -elWidth - layerRenderBuffer && elOnScreenX < canvas.width + elWidth + layerRenderBuffer) {
            drawElement(el);
        }
    });
    ctx.restore();
}

function drawTreeOrBush(ctx, el, levelColorHue) {
    const groundY = el.y;
    const sway = Math.sin(swayTime * 0.1 + el.x / 50) * 0.01;
    
    // Try to use PNG assets first
    let treeImage = null;
    if (hasAssets()) {
        if (el.type === 'tree') {
            if (el.height < 80) {
                treeImage = getAssetWithFallback('tree_small');
            } else if (el.height < 120) {
                treeImage = getAssetWithFallback('tree_medium');
            } else {
                treeImage = getAssetWithFallback('tree_large');
            }
        } else {
            if (el.height < 30) {
                treeImage = getAssetWithFallback('bush_small');
            } else {
                treeImage = getAssetWithFallback('bush_medium');
            }
        }
    }
    
    if (treeImage) {
        // Draw PNG image in original size
        ctx.save();
        ctx.translate(el.x, groundY);
        ctx.rotate(sway);
        ctx.drawImage(treeImage, -treeImage.width/2, -treeImage.height);
        ctx.restore();
    } else {
        // Fallback to programmatic graphics
        if (el.type === 'tree') {
            ctx.fillStyle = `hsl(${levelColorHue - 160}, 30%, 30%)`;
            ctx.beginPath(); ctx.moveTo(el.x - 6, groundY); ctx.lineTo(el.x + 6, groundY); ctx.lineTo(el.x + 2, groundY - el.height); ctx.lineTo(el.x - 2, groundY - el.height); ctx.closePath(); ctx.fill();
        }
        ctx.save();
        const crownCenterY = el.type === 'tree' ? groundY - el.height : groundY - el.height * 0.6;
        ctx.translate(el.x, crownCenterY);
        ctx.rotate(sway);
        const crownRadius = el.height * (el.type === 'tree' ? 0.4 : 0.8);
        const leafBaseHue = 120 + (levelColorHue - 195) / 3;
        
        // Pre-generate leaf positions for performance (only if not cached)
        if (!el.cachedLeaves) {
            el.cachedLeaves = [];
            for (let r = 0; r < crownRadius; r += 5) {
                const leavesInRing = Math.max(1, 15 - r / 4);
                for (let i = 0; i < leavesInRing; i++) {
                    const distFromCenter = r + Math.random() * 10; 
                    if (distFromCenter > crownRadius) continue;
                    const angle = Math.random() * Math.PI * 2;
                    const offsetX = Math.cos(angle) * distFromCenter;
                    const offsetY = Math.sin(angle) * distFromCenter * (el.type === 'tree' ? 0.7 : 1.0) - (el.type === 'tree' ? crownRadius * 0.5 : 0);
                    const sizeFactor = 1 - (distFromCenter / crownRadius);
                    const leafSizeX = (10 + 15 * sizeFactor) * (0.8 + Math.random() * 0.4);
                    const leafSizeY = (15 + 25 * sizeFactor) * (0.8 + Math.random() * 0.4);
                    const leafHue = leafBaseHue + Math.random()*20 - 10;
                    el.cachedLeaves.push({ offsetX, offsetY, leafSizeX, leafSizeY, leafHue, sizeFactor });
                }
            }
        }
        
        // Draw cached leaves
        el.cachedLeaves.forEach((leaf, i) => {
            const leafSway = Math.sin(swayTime * 0.04 + i) * 0.05;
            ctx.fillStyle = `hsla(${leaf.leafHue}, 60%, ${40 + leaf.sizeFactor * 20}%, ${0.6 + leaf.sizeFactor * 0.4})`;
            ctx.beginPath(); 
            ctx.ellipse(leaf.offsetX, leaf.offsetY, leaf.leafSizeX, leaf.leafSizeY, leafSway, 0, Math.PI * 2); 
            ctx.fill();
        });
        ctx.restore();
    }
}

function drawGrassOnPlatform(p, color, targetCtx, currentSwayTime) {
    const grassCount = p.width / 6;
    targetCtx.fillStyle = color;
    
    // Pre-generate grass positions for performance (only if not cached)
    if (!p.cachedGrass) {
        p.cachedGrass = [];
        for (let i = 0; i < grassCount; i++) {
            const grassX = p.x + i * 6 + Math.random() * 3;
            const grassHeight = 8 + Math.random() * 12;
            p.cachedGrass.push({ grassX, grassHeight });
        }
    }
    
    // Draw cached grass
    p.cachedGrass.forEach(grass => {
        const sway = Math.sin(currentSwayTime + grass.grassX / 20) * (grass.grassHeight / 4);
        targetCtx.beginPath();
        targetCtx.moveTo(grass.grassX - 1.5, p.y);
        targetCtx.lineTo(grass.grassX + 1.5, p.y);
        targetCtx.lineTo(grass.grassX + sway, p.y - grass.grassHeight);
        targetCtx.closePath();
        targetCtx.fill();
    });
}

