import { BASE_SPEED } from './constants.js';
import { initAudio, generateMusic, playMenuSound, stopTransport, startTransport, playVictorySound, setPortalVolume, pauseTransport } from './audio.js';
import { initUI, showMenu, updateScoreUI, updateLevelUI, updateDeathsUI, showLevelEndMenu, fadeScreen, showStartBanner } from './ui.js';
import { initInput, getAutoJumpState, togglePause } from './input.js';
import { preRenderLevel, draw, resizeCanvas } from './renderer.js';
import { updatePhysics, resetPlayer, getGameState, setGameState, getLevelStats, resetLevelStats, setTimeScaleTarget, die, completeLevel, resetCurrentLevelState, getTotalScore, awardBonus, resetScoreOnNewGame } from './physics.js';
import { getPlayer, setPlayerSpeed, performPlayerJump, resetPlayerState } from './player.js';
import { generateLevel, getGeneratedLevelData, setGeneratedLevelData } from './levelGenerator.js';
import { snapCameraToPlayer } from './camera.js';

// ======================= ИНИЦИАЛИЗАЦИЯ =======================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let lastTime = 0;
let deltaTime = 0;

let currentLevel = 1;
let lastOnGround = false; // track ground state for auto-jump edge detection

// ======================= ГЛАВНЫЕ ФУНКЦИИ УПРАВЛЕНИЯ ИГРОЙ =======================

async function startGame() {
    initAudio();
    currentLevel = 1;
    resetScoreOnNewGame();
    setPlayerSpeed(BASE_SPEED);
    
    updateLevelUI(currentLevel);
    updateScoreUI(getTotalScore());
    
    showMenu(null);
    await fadeScreen(1, 400);

    resetLevelStats();
    resetPlayerState(); // Сбрасываем эффекты игрока
    generateMusic();
    const levelData = generateLevel(currentLevel, canvas.height);
    setGeneratedLevelData(levelData);
    
    preRenderLevel(ctx, levelData, canvas.width, canvas.height);
    resetPlayer();
    snapCameraToPlayer();
    
    setGameState('levelReady');
    
    showStartBanner(currentLevel, levelData.totalPixelsInLevel);
    
    await fadeScreen(0, 400);
}

async function startNextLevel() {
    showMenu(null);
    await fadeScreen(1, 400);

    currentLevel++;
    setPlayerSpeed(BASE_SPEED + (currentLevel - 1) * 20);
    
    updateLevelUI(currentLevel);
    
    resetLevelStats();
    resetPlayerState(); // Сбрасываем эффекты игрока
    generateMusic();
    const levelData = generateLevel(currentLevel, canvas.height);
    setGeneratedLevelData(levelData);

    preRenderLevel(ctx, levelData, canvas.width, canvas.height);
    resetPlayer();
    snapCameraToPlayer();
    
    setGameState('levelReady');
    
    showStartBanner(currentLevel, levelData.totalPixelsInLevel);
    setTimeScaleTarget(1.0);

    await fadeScreen(0, 400);
}

async function restartCurrentLevel() {
    showMenu(null);
    await fadeScreen(1, 400);

    resetCurrentLevelState();
    updateScoreUI(getTotalScore());
    
    setPlayerSpeed(BASE_SPEED + (currentLevel - 1) * 20);
    resetPlayerState(); // Сбрасываем эффекты игрока
    resetPlayer();
    snapCameraToPlayer();

    setGameState('levelReady');
    const levelData = getGeneratedLevelData();
    showStartBanner(currentLevel, levelData.totalPixelsInLevel);
    setTimeScaleTarget(1.0);
    
    await fadeScreen(0, 400);
}

function resumeGame() {
    if (getGameState() !== 'paused') return;
    playMenuSound(false);
    showMenu(null);
    setGameState('resuming');
    setTimeScaleTarget(1);
}

function startGameplay() {
    if (getGameState() !== 'levelReady') return;
    const player = getPlayer();
    setGameState('playing');
    const startPrompt = document.getElementById('start-prompt');
    startPrompt.style.opacity = 0;
    setTimeout(() => {
         startPrompt.classList.add('hidden');
         document.getElementById('level-start-banner').classList.add('hidden');
    }, 300);
    getLevelStats().startTime = performance.now();
    startTransport();
}

function exitToMainMenu() {
    setGameState('mainMenu');
    setTimeScaleTarget(1.0);
    showMenu('main');
}

// ======================= ГЛАВНЫЙ ИГРОВОЙ ЦИКЛ =======================

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    if (deltaTime > 0.1) deltaTime = 0.1;
    
    const gameState = getGameState();
    const player = getPlayer();
    const levelData = getGeneratedLevelData();

    if (gameState === 'levelReady' && (getAutoJumpState() || player.jumpInitiated)) {
        startGameplay();
        player.jumpInitiated = false;
    }

    const physicsResult = updatePhysics(deltaTime, canvas, levelData);
    
    if (physicsResult.playerDied) {
        die();
        updateDeathsUI(getLevelStats().deaths);
    }
    if (physicsResult.levelCompleted) {
        completeLevel();
        let bonusPoints = 0;
        if (getLevelStats().deaths === 0) {
            bonusPoints = 10;
            awardBonus();
        }
        updateScoreUI(getTotalScore());
        showLevelEndMenu(currentLevel, levelData.totalPixelsInLevel, bonusPoints);
    }
    if (physicsResult.collected > 0) {
        updateScoreUI(getTotalScore());
    }

    // Auto-jump when input is held: trigger on ground enter only
    if (getGameState() === 'playing') {
        if (getAutoJumpState() && player.onGround && !lastOnGround) {
            performPlayerJump();
        }
        lastOnGround = player.onGround;
    } else {
        lastOnGround = false;
    }
    
    if (levelData && levelData.teleport) {
        setPortalVolume(player, levelData.teleport, canvas.width);
    }
    
    draw(ctx, canvas, deltaTime);
    
    requestAnimationFrame(gameLoop);
}

// ======================= ЗАПУСК ИГРЫ И НАЗНАЧЕНИЕ СОБЫТИЙ =======================

resizeCanvas(canvas);
initUI({
    onPlay: startGame,
    onExit: () => {
        stopTransport();
        document.getElementById('game-container').innerHTML = '<div class="menu-overlay" style="backdrop-filter: none;"><div class="menu-box"><h1>Спасибо за игру!</h1><p>Вы можете закрыть эту вкладку.</p></div></div>';
    },
    onResume: resumeGame,
    onRestart: restartCurrentLevel,
    onExitToMain: exitToMainMenu,
    onContinue: startNextLevel,
    onReplay: restartCurrentLevel,
    onPause: togglePause
});

initInput({
    onJump: () => {
        const gameState = getGameState();
        if (gameState === 'levelReady') {
            startGameplay();
        } else if (gameState === 'playing') {
            performPlayerJump();
        }
    },
    onResume: resumeGame,
    onPause: togglePause
});

window.addEventListener('resize', () => resizeCanvas(canvas));
document.addEventListener('fullscreenchange', () => resizeCanvas(canvas));
document.addEventListener('webkitfullscreenchange', () => resizeCanvas(canvas));

showMenu('main');
requestAnimationFrame(gameLoop);

