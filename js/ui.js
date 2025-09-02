import { pauseTransport } from './audio.js';

const mainMenu = document.getElementById('main-menu');
const pauseMenu = document.getElementById('pause-menu');
const levelEndMenu = document.getElementById('level-end-menu');
const levelStartBanner = document.getElementById('level-start-banner');
const allMenus = [mainMenu, pauseMenu, levelEndMenu, levelStartBanner];

const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const deathsElement = document.getElementById('deaths');
const fadeOverlay = document.getElementById('fade-overlay');

export function showMenu(menuName) {
    allMenus.forEach(m => m.classList.add('hidden'));
    if (menuName !== null) {
        pauseTransport();
    	if (menuName === 'main') mainMenu.classList.remove('hidden');
	    if (menuName === 'pause') pauseMenu.classList.remove('hidden');
	    if (menuName === 'levelEnd') levelEndMenu.classList.remove('hidden');
    }
}

export function updateScoreUI(score) { scoreElement.textContent = `Очки: ${score}`; }
export function updateLevelUI(level) { levelElement.textContent = `Уровень: ${level}`; }
export function updateDeathsUI(deaths) { deathsElement.textContent = `Попытки: ${deaths}`; }

export function showStartBanner(level, pixelCount) {
    document.getElementById('level-banner-title').textContent = `Уровень ${level}`;
    document.getElementById('level-banner-pixels').textContent = `Собрать пикселей: ${pixelCount}`;
    levelStartBanner.classList.remove('hidden');
    document.getElementById('start-prompt').classList.add('hidden');
}

export function showLevelEndMenu(level, totalPixels, bonusPoints) {
    const levelStats = { // Предполагается, что эта информация будет передана
        startTime: window.levelStats.startTime, // Глобальный доступ - не лучший вариант, но для рефакторинга сойдет
        pixelsCollected: window.levelStats.pixelsCollected,
        deaths: window.levelStats.deaths
    };

    const levelEndTitle = document.getElementById('level-end-title');
    if (levelStats.deaths === 0) {
        levelEndTitle.textContent = `Уровень ${level} пройден ИДЕАЛЬНО!`;
    } else {
        levelEndTitle.textContent = `Уровень ${level} пройден!`;
    }
    
    const timeTaken = ((performance.now() - levelStats.startTime) / 1000).toFixed(1);
    document.getElementById('level-time-stat').textContent = `${timeTaken}s`;
    document.getElementById('level-pixels-stat').textContent = `${levelStats.pixelsCollected} / ${totalPixels}`;
    document.getElementById('level-deaths-stat').textContent = levelStats.deaths;
    
    const bonusStatElement = document.getElementById('level-bonus-stat');
    bonusStatElement.textContent = `+${bonusPoints}`;
    bonusStatElement.classList.toggle('bonus-stat', bonusPoints > 0);
}

export function fadeScreen(targetOpacity, duration) {
    return new Promise(resolve => {
        const startOpacity = parseFloat(fadeOverlay.style.opacity) || 0;
        let startTime = null;
        function animate(currentTime) {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const currentOpacity = startOpacity + (targetOpacity - startOpacity) * progress;
            fadeOverlay.style.opacity = currentOpacity;
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                fadeOverlay.style.opacity = targetOpacity;
                resolve();
            }
        }
        requestAnimationFrame(animate);
    });
}

function setupButton(buttonId, callback) {
    const button = document.getElementById(buttonId);
    button.addEventListener('click', (e) => { e.stopPropagation(); callback(); });
    button.addEventListener('touchstart', (e) => { e.stopPropagation(); e.preventDefault(); callback(); });
}

export function initUI(callbacks) {
    setupButton('play-button', callbacks.onPlay);
    setupButton('exit-button', callbacks.onExit);
    setupButton('resume-button', callbacks.onResume);
    // Fullscreen buttons in pause and level end menus
    const toggleFull = () => {
        const elem = document.documentElement;
        if (!document.fullscreenElement) {
            if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
            else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
    };
    setupButton('fullscreen-toggle-button', toggleFull);
    setupButton('fullscreen-toggle-button-end', toggleFull);
    setupButton('restart-level-button', callbacks.onRestart);
    setupButton('exit-to-main-menu-pause-button', callbacks.onExitToMain);
    setupButton('exit-to-main-menu-end-button', callbacks.onExitToMain);
    setupButton('continue-button', callbacks.onContinue);
    setupButton('replay-level-button', callbacks.onReplay);

    const menuIcon = document.getElementById('menu-icon');
    menuIcon.addEventListener('click', callbacks.onPause);
    menuIcon.addEventListener('touchstart', (e) => { e.preventDefault(); callbacks.onPause(); });
}