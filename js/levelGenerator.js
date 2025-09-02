import { JUMP_FORCE, GRAVITY, PLATFORM_HEIGHT } from './constants.js';
import { getPlayer } from './player.js';
import { createCollectible, COLLECTIBLE_TYPES } from './collectibles.js';

let generatedLevelData = {};

export function getGeneratedLevelData() { return generatedLevelData; }
export function setGeneratedLevelData(data) { generatedLevelData = data; }

export function generateLevel(currentLevel, canvasHeight) {
    const player = getPlayer();
    const levelFactor = Math.min(1, (currentLevel - 1) / 10);
    const levelLength = 15000 + 10000 * levelFactor + (currentLevel - 1) * 2000;
    
    let platforms = [];
    let collectibles = [];
    let teleport = {};
    let portalRings = [];
    const levelColorHue = 195 + (currentLevel - 1) * 25;
    
    let currentX = -200;
    let currentY = canvasHeight - PLATFORM_HEIGHT * 4;
    
    const startPlatform = { id: 0, x: currentX, y: currentY, width: 800, height: canvasHeight };
    startPlatform.bottomShape = generateBottomShape(startPlatform);
    platforms.push(startPlatform);
    currentX += startPlatform.width;
    
    const maxJumpHeight = (JUMP_FORCE * JUMP_FORCE) / (2 * GRAVITY);
    let platformIdCounter = 1;

    // Флаг для отслеживания, был ли недавно размещен модификатор прыжка
    let jumpModifierPlacedRecently = false;

    while (currentX < levelLength) {
        const lastPlatform = platforms[platforms.length - 1];
        let newPlatform;
        const createGap = Math.random() > 0.4;

        if (createGap) {
            const yChangeMultiplier = 0.3 + 0.7 * levelFactor;
            let newY = lastPlatform.y;
            const yChangeMaxUp = maxJumpHeight * 0.9 * yChangeMultiplier;
            const yChangeMaxDown = maxJumpHeight * 1.5 * yChangeMultiplier;
            const yChange = (Math.random() * (yChangeMaxUp + yChangeMaxDown)) - yChangeMaxDown;
            newY += yChange;
            newY = Math.max(canvasHeight / 4, Math.min(canvasHeight - PLATFORM_HEIGHT * 2, newY));

            const timeToPeak = -JUMP_FORCE / GRAVITY;
            const heightAtPeak = lastPlatform.y - maxJumpHeight;
            const fallDistance = newY - heightAtPeak;
            const timeToFall = fallDistance > 0 ? Math.sqrt(2 * fallDistance / GRAVITY) : 0;
            const timeInAir = timeToPeak + timeToFall;
            const maxHorizontalDist = player.dx * timeInAir;

            const safeJumpFactor = 0.9;
            const safeMaxDist = maxHorizontalDist * safeJumpFactor;

            const minGap = 80;
            let gap = minGap;
            
            if (safeMaxDist > minGap + player.width) {
                gap = minGap + Math.random() * (safeMaxDist - minGap - player.width);
            }
            
            currentX = lastPlatform.x + lastPlatform.width + gap;
            const width = 120 + Math.random() * 300;
            newPlatform = { id: platformIdCounter++, x: currentX, y: newY, width: width, height: PLATFORM_HEIGHT };

        } else {
            const width = 200 + Math.random() * 500;
            currentX = lastPlatform.x + lastPlatform.width;
            const slopeFactor = 0.3;
            const yChange = (Math.random() - 0.5) * 2 * slopeFactor * width;
            let newY = lastPlatform.y + yChange;
            newY = Math.max(canvasHeight / 2, Math.min(canvasHeight - PLATFORM_HEIGHT * 2, newY));
            newPlatform = { id: platformIdCounter++, x: currentX, y: newY, width: width, height: PLATFORM_HEIGHT };
        }
        newPlatform.bottomShape = generateBottomShape(newPlatform);
        platforms.push(newPlatform);
        currentX = newPlatform.x + newPlatform.width;
    }
    
    const finalPlatform = platforms[platforms.length - 1];
    const teleportLocationX = finalPlatform.x + finalPlatform.width / 2;
    
    // Генерация коллекционных предметов с вероятностями
    for (const p of platforms) {
        if (p.id === 0 || p.id === finalPlatform.id) continue;

        const itemCount = Math.floor(p.width / 180);
        for (let i = 0; i < itemCount; i++) {
            const collectibleX = p.x + 60 + Math.random() * (p.width - 120);
            
            // Если недавно был модификатор прыжка, спавним пиксели выше
            const verticalRange = jumpModifierPlacedRecently ? maxJumpHeight * 1.5 : maxJumpHeight * 0.6;
            const collectibleY = p.y - 60 - Math.random() * verticalRange;
            
            if (collectibleX >= teleportLocationX) continue;

            const rand = Math.random();
            let typeName = 'pixel_yellow';

            // Модификаторы спавнятся только в первой половине уровня
            if (p.x < levelLength * 0.6 && rand > 0.97) {
                typeName = Math.random() > 0.5 ? 'modifier_magnet' : 'modifier_double_jump';
                if (typeName === 'modifier_double_jump') {
                    jumpModifierPlacedRecently = true; // Включаем флаг
                }
            } else if (rand > 0.92) {
                typeName = 'pixel_red';
            } else if (rand > 0.80) {
                typeName = 'pixel_purple';
            } else if (rand > 0.60) {
                typeName = 'pixel_orange';
            } else {
                // Если сгенерировался обычный пиксель, сбрасываем флаг
                jumpModifierPlacedRecently = false;
            }
            
            collectibles.push(createCollectible(typeName, collectibleX, collectibleY));
        }
    }
    collectibles.sort((a, b) => a.x - b.x);

    const teleportHeight = 150;
    teleport = { x: teleportLocationX - 40, y: finalPlatform.y - teleportHeight, width: 80, height: teleportHeight };
    
    portalRings = [
        { angle: Math.random() * Math.PI * 2, speed: (Math.PI * 2 / 3) * (1 + (Math.random() - 0.5) * 0.1) },
        { angle: Math.random() * Math.PI * 2, speed: -(Math.PI * 2 / 3) * (1 + (Math.random() - 0.5) * 0.1) }
    ];
    
    const parallaxElements = generateParallaxElements(levelLength, canvasHeight, platforms);

    return {
        platforms, collectibles, teleport, portalRings, levelLength, levelColorHue, parallaxElements,
        totalPixelsInLevel: collectibles.length,
        activePlatforms: [], activeCollectibles: [], activeTreesAndBushes: [],
        nextPlatformIndex: 0, nextCollectibleIndex: 0, nextTreeIndex: 0
    };
}

function generateBottomShape(p) {
    const points = [];
    const bottomY = p.y + p.height;
    const numSpikes = Math.floor(2 + (p.width / 150) + Math.random() * 3);
    const spikeDepth = 80 + Math.random() * 150;
    points.push({ x: p.x, y: bottomY });
    for(let i = 1; i < numSpikes; i++) {
        const spikeX = p.x + (i * p.width / numSpikes) + (Math.random() - 0.5) * (p.width / numSpikes);
        const spikeY = bottomY + (Math.random() * 0.5 + 0.5) * spikeDepth;
        points.push({x: spikeX, y: spikeY});
    }
    points.push({ x: p.x + p.width, y: bottomY });
    return points;
}

function generateParallaxElements(levelLength, canvasHeight, platforms) {
    const totalLength = levelLength + 1200 * 2;
    let clouds = [], distantMountains = [], mountains = [], treesAndBushes = [];
    
    for (let i = 0; i < totalLength / 400; i++) {
        const y = 50 + Math.random() * (canvasHeight / 3); const x = Math.random() * totalLength; const clusterSize = 3 + Math.random() * 5; const baseRadius = 30 + Math.random() * 40; const alpha = 0.4 + Math.random() * 0.5;
        for(let j = 0; j < clusterSize; j++) { clouds.push({ x: x + (Math.random() - 0.5) * baseRadius * 2.5, y: y + (Math.random() - 0.5) * baseRadius * 0.8, radiusX: baseRadius * (0.8 + Math.random() * 0.6), radiusY: baseRadius * (0.5 + Math.random() * 0.4), alpha: alpha * (0.8 + Math.random() * 0.2) }); }
    }
    const createMountain = (y, base, height, segments) => { const pts = [{x: -base/2, y}]; for(let i = 1; i < segments; i++) { pts.push({x: (-base/2) + (base * (i/segments)), y: y - (Math.sin((i/segments) * Math.PI) * height) + (Math.random() - 0.5) * height * 0.3}); } pts.push({x: base/2, y}); return pts; };
    for (let i = 0; i < totalLength / 1000; i++) { distantMountains.push({ x: Math.random() * totalLength, y: canvasHeight, points: createMountain(0, 400 + Math.random() * 500, 200 + Math.random() * 150, 5 + Math.floor(Math.random()*5)) }); }
    for (let i = 0; i < totalLength / 800; i++) { mountains.push({ x: Math.random() * totalLength, y: canvasHeight - 50, points: createMountain(0, 250 + Math.random() * 300, 150 + Math.random() * 250, 5 + Math.floor(Math.random()*5)) }); }
    for (let x = 0; x < totalLength; x += (150 + Math.random() * 200)) {
        const groundPlatform = platforms.find(p => x >= p.x && x <= p.x + p.width);
        if (groundPlatform) {
            const type = Math.random() > 0.4 ? 'tree' : 'bush';
            const height = type === 'tree' ? 100 + Math.random() * 150 : 40 + Math.random() * 50;
            treesAndBushes.push({ x: x, y: groundPlatform.y, height: height, type: type });
        }
    }
    treesAndBushes.sort((a, b) => a.x - b.x);
    
    return { clouds, distantMountains, mountains, treesAndBushes };
}

