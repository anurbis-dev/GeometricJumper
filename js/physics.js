import { PLATFORM_HEIGHT, GRAVITY } from './constants.js';
import { playDeathSound, startTransport, stopPortalSound, playVictorySound } from './audio.js';
import { showMenu, updateDeathsUI } from './ui.js';
import { getCamera } from './camera.js';
import { getGeneratedLevelData } from './levelGenerator.js';
import { getPlayer, setPlayerSpeed, updatePlayer } from './player.js';
import { updateCollectibles, resetAllCollectibles } from './collectibles.js';

// --- Состояние игры ---
let gameState = 'mainMenu';
let timeScale = 1.0;
let timeScaleTarget = 1.0;
let particles = [];
let lastSafePlatform = null;
let consecutiveDeaths = 0;
let lastDeathPlatformId = -1;
let respawnTarget = null;

// --- Управление счётом ---
let totalScore = 0;

const levelStats = {
    startTime: 0,
    pixelsCollected: 0,
    deaths: 0
};
window.levelStats = levelStats;

// --- Геттеры для внешних модулей ---
export function getParticles() { return particles; }
export function getGameState() { return gameState; }
export function setGameState(newState) { gameState = newState; }
export function getTimeScale() { return timeScale; }
export function setTimeScaleTarget(target) { timeScaleTarget = target; }
export function getLevelStats() { return levelStats; }
export function getLastSafePlatform() { return lastSafePlatform; }
export function getRespawnTarget() { return respawnTarget; }
export function getTotalScore() { return totalScore; }


// --- Главный цикл обновления физики ---
export function updatePhysics(dt, canvas, levelData) {
    const scaledDt = dt * timeScale;
    let playerDied = false;
    let levelCompleted = false;
    let collectedThisFrame = 0;

    const timeScaleDiff = timeScaleTarget - timeScale;
    if (Math.abs(timeScaleDiff) > 0.01) {
        timeScale += timeScaleDiff * 0.1;
        document.getElementById('pause-overlay').style.opacity = 1 - timeScale;
        document.getElementById('pause-overlay').style.backdropFilter = `blur(${ (1 - timeScale) * 5}px)`;
    } else if (timeScale !== timeScaleTarget) {
        timeScale = timeScaleTarget;
        if (gameState === 'pausing') { setGameState('paused'); showMenu('pause'); }
        if (gameState === 'levelEnding') { setGameState('levelEnd'); setTimeout(() => showMenu('levelEnd'), 500); }
        if (gameState === 'resuming') {
            setGameState('playing');
            startTransport();
        }
    }

    const isPlayerUpdatable = ['playing', 'pausing', 'resuming'].includes(gameState);
    if (isPlayerUpdatable || gameState === 'levelEnding' || gameState === 'enteringPortal' || gameState === 'panningToRespawn') {
        updateVisibleObjects(levelData, canvas);
        levelData.portalRings.forEach(r => { r.angle += r.speed * dt; });
    }

    if (gameState === 'dead' || gameState === 'panningToRespawn') {
        particles.forEach(p => { p.x += p.dx * dt; p.y += p.dy * dt; p.dy += GRAVITY * 0.8 * dt; p.angle += p.angleV * dt; p.life -= dt; });
        particles = particles.filter(p => p.life > 0);
    }
    
    if (isPlayerUpdatable) {
        const player = getPlayer();
        const playerUpdateResult = updatePlayer(scaledDt, levelData.activePlatforms);
        
        if (playerUpdateResult.newSafePlatform) {
            lastSafePlatform = playerUpdateResult.newSafePlatform;
        }
        if (playerUpdateResult.hasDied) {
            playerDied = true;
        }

        const pointsCollected = updateCollectibles(levelData.activeCollectibles, scaledDt);
        if (pointsCollected > 0) {
            collectedThisFrame = pointsCollected;
            levelStats.pixelsCollected += pointsCollected;
            totalScore += pointsCollected;
        }
        
        const teleport = levelData.teleport;
        if (gameState === 'playing' && teleport.x && player.x + player.width > teleport.x && player.x < teleport.x + teleport.width && player.y + player.height > teleport.y && player.y < teleport.y + teleport.height) {
            setGameState('enteringPortal');
            player.dx = 0;
            player.dy = 0;
            stopPortalSound();
            playVictorySound();
        }
        if (player.y > canvas.height + 300) playerDied = true;

    } else if (gameState === 'enteringPortal') {
        const player = getPlayer();
        const teleport = levelData.teleport;
        const targetX = teleport.x + teleport.width / 2 - player.width / 2;
        const targetY = teleport.y + teleport.height / 2 - player.height / 2;
        player.x += (targetX - player.x) * 0.08;
        player.y += (targetY - player.y) * 0.08;
        player.width *= 0.97;
        player.height *= 0.97;
        player.angle += 15 * dt;
        if (player.width < 1) levelCompleted = true;
    }

    return { playerDied, levelCompleted, collected: collectedThisFrame };
}

// --- Управление состоянием игрока и уровня ---

function movePlayerToRespawnHover() {
    const platform = respawnTarget;
    if (!platform) return;
    const player = getPlayer();

    player.x = platform.x + 20;
    player.y = platform.y - player.height - 20;
    player.dy = 0;
    player.angle = 0;
    player.width = 40;
    player.height = 40;
    player.onGround = false;
    player.wasOnGround = false;
    particles = [];
    lastSafePlatform = platform;

    const levelData = getGeneratedLevelData();
    const platforms = levelData.platforms;
    const respawnPlatformIndex = platforms.findIndex(p => p.id === platform.id);
    if (respawnPlatformIndex !== -1) {
        levelData.nextPlatformIndex = respawnPlatformIndex;
        const collectibles = levelData.collectibles;
        let nextCollectibleIdx = collectibles.findIndex(c => c.x >= platform.x);
        levelData.nextCollectibleIndex = (nextCollectibleIdx === -1) ? collectibles.length : nextCollectibleIdx;
        const trees = levelData.parallaxElements.treesAndBushes;
        let nextTreeIdx = trees.findIndex(t => t.x >= platform.x);
        levelData.nextTreeIndex = (nextTreeIdx === -1) ? trees.length : nextTreeIdx;
    }
}

export function awardBonus() {
    totalScore += 10;
}

export function resetPlayer() {
    const levelData = getGeneratedLevelData();
    const player = getPlayer();
    respawnTarget = levelData.platforms[0];
    lastSafePlatform = respawnTarget;
    movePlayerToRespawnHover();
    player.y = respawnTarget.y - player.height;
    player.onGround = true;
    player.wasOnGround = true;
    respawnTarget = null;
}

export function die() {
    if (['dead', 'panningToRespawn', 'enteringPortal'].includes(gameState)) return;

    const player = getPlayer();
    let platformForRespawn = lastSafePlatform;
    const levelData = getGeneratedLevelData();
    const platforms = levelData.platforms;

    if (lastSafePlatform) {
        if (consecutiveDeaths > 6) {
            const currentPlatformIndex = platforms.findIndex(p => p.id === lastSafePlatform.id);
            const newIndex = Math.max(0, currentPlatformIndex - 3);
            platformForRespawn = platforms[newIndex];
            consecutiveDeaths = 0;
        } else {
            const minPlatformWidth = player.width * 6;
            if (platformForRespawn.width < minPlatformWidth) {
                const currentPlatformIndex = platforms.findIndex(p => p.id === platformForRespawn.id);
                const newIndex = Math.max(0, currentPlatformIndex - 1);
                platformForRespawn = platforms[newIndex];
            }
        }
    }
    if (!platformForRespawn) {
        platformForRespawn = platforms[0];
    }
    
    respawnTarget = platformForRespawn;

    if (lastSafePlatform && lastSafePlatform.id === lastDeathPlatformId) {
        consecutiveDeaths++;
    } else {
        consecutiveDeaths = 1;
        lastDeathPlatformId = lastSafePlatform ? lastSafePlatform.id : -1;
    }
    
    setGameState('dead');
    levelStats.deaths++;
    playDeathSound();
    createExplosion(player.x, player.y);
    
    setTimeout(() => {
        movePlayerToRespawnHover();
        setGameState('panningToRespawn');
    }, 750);
}

export function finalizeRespawn() {
    setGameState('playing');
    timeScale = 1;
    timeScaleTarget = 1;
    respawnTarget = null;
}

export function completeLevel() {
    setGameState('levelEnding');
    setTimeScaleTarget(0);
}

export function resetScoreOnNewGame() {
    totalScore = 0;
}

export function resetLevelStats() {
    levelStats.pixelsCollected = 0;
    levelStats.deaths = 0;
    updateDeathsUI(0);
    consecutiveDeaths = 0;
    lastDeathPlatformId = -1;
    lastSafePlatform = null;
}

export function resetCurrentLevelState() {
    totalScore -= levelStats.pixelsCollected;
    
    levelStats.pixelsCollected = 0;
    levelStats.deaths = 0;
    updateDeathsUI(0);
    consecutiveDeaths = 0;
    lastDeathPlatformId = -1;

    const levelData = getGeneratedLevelData();
    resetAllCollectibles(levelData.collectibles);

    levelData.nextPlatformIndex = 0;
    levelData.nextCollectibleIndex = 0;
    levelData.nextTreeIndex = 0;
    levelData.activePlatforms = [];
    levelData.activeCollectibles = [];
    levelData.activeTreesAndBushes = [];
}


function createExplosion(x, y) {
    particles = [];
    const player = getPlayer();
    const particleSize = player.width / 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            particles.push({
                x: x + i * particleSize, y: y + j * particleSize,
                width: particleSize, height: particleSize,
                dx: (i - 1) * 200 + (Math.random() - 0.5) * 150,
                dy: (j - 1) * 200 + (Math.random() - 0.5) * 150 - 250,
                angle: 0, angleV: (Math.random() - 0.5) * 20,
                life: 1
            });
        }
    }
}

function updateVisibleObjects(levelData, canvas) {
    const camera = getCamera();
    const renderBuffer = canvas.width * 0.5;
    const viewLeft = camera.x - renderBuffer;
    const viewRight = camera.x + canvas.width + renderBuffer;

    // Сначала добавляем новые объекты, которые входят в зону видимости
    while (levelData.nextPlatformIndex < levelData.platforms.length && levelData.platforms[levelData.nextPlatformIndex].x < viewRight) {
        levelData.activePlatforms.push(levelData.platforms[levelData.nextPlatformIndex]);
        levelData.nextPlatformIndex++;
    }
    while (levelData.nextCollectibleIndex < levelData.collectibles.length && levelData.collectibles[levelData.nextCollectibleIndex].x < viewRight) {
        levelData.activeCollectibles.push(levelData.collectibles[levelData.nextCollectibleIndex]);
        levelData.nextCollectibleIndex++;
    }
    while (levelData.nextTreeIndex < levelData.parallaxElements.treesAndBushes.length && levelData.parallaxElements.treesAndBushes[levelData.nextTreeIndex].x < viewRight) {
        levelData.activeTreesAndBushes.push(levelData.parallaxElements.treesAndBushes[levelData.nextTreeIndex]);
        levelData.nextTreeIndex++;
    }

    // Затем удаляем старые объекты, которые ушли далеко влево
    levelData.activePlatforms = levelData.activePlatforms.filter(p => p.x + p.width > viewLeft);
    levelData.activeCollectibles = levelData.activeCollectibles.filter(c => c.x + c.size > viewLeft);
    levelData.activeTreesAndBushes = levelData.activeTreesAndBushes.filter(t => t.x + 20 > viewLeft);
}

