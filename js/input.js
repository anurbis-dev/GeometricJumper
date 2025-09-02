import { getGameState, setGameState, setTimeScaleTarget } from './physics.js';
import { playMenuSound } from './audio.js';
import { getPlayer } from './player.js';

let onJumpCallback;
let onPauseCallback;
let isAutoJumping = false;
let touchCache = [];
let prevDiff = -1;
// Remove fullscreen gesture handling and auto-orientation fullscreen
// as per updated requirements
let twoFingerHandled = false;
let orientationListenerAttached = false;

export function playerJump() {
    onJumpCallback();
}

export function getAutoJumpState() {
    return isAutoJumping;
}

export function togglePause() {
    const gameState = getGameState();
    if (gameState === 'playing') {
        playMenuSound(true);
        setTimeScaleTarget(0);
        setGameState('pausing');
    } else if (gameState === 'paused') {
        onPauseCallback();
    }
}

function handleKeyDown(e) {
    if (e.code === 'Space') {
        playerJump();
    }
    if (e.code === 'Escape') {
        togglePause();
    }

    // --- Клавиши для тестирования ---
    if (getGameState() === 'playing') {
        const player = getPlayer();
        if (e.code === 'Digit1') { // Нажатие "1"
            player.effects.doubleJumpTimer += 10;
            console.log('Double Jump Activated for 10s');
        }
        if (e.code === 'Digit2') { // Нажатие "2"
            player.effects.magnetTimer += 7;
            console.log('Magnet Activated for 7s');
        }
    }
}

function handlePointerDown(e) {
    e.preventDefault();
    if (e.target.closest('.menu-box') || e.target.closest('#menu-icon')) return;
    if (e.button === 2) {
        togglePause();
        return;
    }
    if (getGameState() === 'levelReady') {
        const player = getPlayer();
        player.jumpInitiated = true;
        return;
    }
    if (e.pointerType === 'touch') {
        // Start auto-jump while touch is held
        isAutoJumping = true;
        // Immediate jump feedback for touch in playing state
        if (getGameState() === 'playing') {
            playerJump();
        }
    } else if (e.pointerType === 'mouse' && e.button === 0) {
        // Mouse hold should behave as auto-jump
        isAutoJumping = true;
        if (getGameState() === 'playing') playerJump();
    }
}

function handlePointerUp(e) {
    e.preventDefault();
    // Stop auto-jump on release for both touch and mouse
    if (e.pointerType === 'touch' && e.isPrimary) {
        isAutoJumping = false;
    } else if (e.pointerType === 'mouse' && e.button === 0) {
        isAutoJumping = false;
    }
}

function toggleFullScreen(enter = true) {
    const elem = document.documentElement;
    if (enter && !document.fullscreenElement) {
        if (elem.requestFullscreen) elem.requestFullscreen().catch(err => console.error(err));
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    } else if (!enter && document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
}

function handleTouchStart(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
        touchCache.push(e.changedTouches[i]);
    }

    // Fullscreen gestures removed
}

function handleTouchMove(e) {
    e.preventDefault();
    for (let i = 0; i < e.touches.length; i++) {
        const index = touchCache.findIndex(t => t.identifier === e.touches[i].identifier);
        if (index !== -1) touchCache[index] = e.touches[i];
    }
    // Fullscreen pinch handling removed
}

function handleTouchEnd(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
        const index = touchCache.findIndex(t => t.identifier === e.changedTouches[i].identifier);
        if (index !== -1) touchCache.splice(index, 1);
    }
    if (touchCache.length < 2) prevDiff = -1;
    if (touchCache.length < 2) twoFingerHandled = false;
}


export function initInput(callbacks) {
    onJumpCallback = callbacks.onJump;
    onPauseCallback = callbacks.onResume;

    document.addEventListener('keydown', handleKeyDown);
    const gameContainer = document.getElementById('game-container');
    gameContainer.addEventListener('pointerdown', handlePointerDown);
    gameContainer.addEventListener('pointerup', handlePointerUp);
    gameContainer.addEventListener('contextmenu', (e) => e.preventDefault());
    gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    gameContainer.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Removed auto fullscreen on orientation change
}

