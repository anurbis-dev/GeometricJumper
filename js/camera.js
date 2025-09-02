import { getGameState, getLastSafePlatform, getRespawnTarget, finalizeRespawn } from './physics.js';
import { getPlayer } from './player.js';

const camera = { x: 0, y: 0, smoothness: 0.05 };
const cameraTarget = { x: 0, y: 0 };
let cameraOffsetX, cameraOffsetY;

/**
 * Возвращает текущий объект камеры.
 */
export function getCamera() {
    return camera;
}

/**
 * Инициализирует или пересчитывает смещение камеры на основе размера холста.
 * @param {HTMLCanvasElement} canvas - Игровой холст.
 */
export function initCamera(canvas) {
    const currentAspectRatio = canvas.width / canvas.height;
    if (currentAspectRatio < 1) { // Портретный режим
        cameraOffsetX = canvas.width / 2.8;
        cameraOffsetY = canvas.height / 1.6;
    } else { // Ландшафтный режим
        cameraOffsetX = canvas.width / 3.5;
        cameraOffsetY = canvas.height / 1.8;
    }
}

/**
 * Мгновенно перемещает камеру к текущей позиции игрока.
 */
export function snapCameraToPlayer() {
    const player = getPlayer();
    camera.x = player.x - cameraOffsetX;
    camera.y = player.y - cameraOffsetY;
    cameraTarget.x = camera.x;
    cameraTarget.y = camera.y;
}

/**
 * Обновляет позицию камеры каждый кадр, обеспечивая плавное следование.
 * @param {number} dt - Время, прошедшее с последнего кадра (delta time).
 */
export function updateCamera(dt) {
    const player = getPlayer();
    const gameState = getGameState();
    const respawnPlatform = getRespawnTarget();

    let currentSmoothness = camera.smoothness;

    if (gameState === 'panningToRespawn' && respawnPlatform) {
        // Если мы в процессе перемещения к точке возрождения, цель камеры - эта точка.
        cameraTarget.x = (respawnPlatform.x + 20) - cameraOffsetX;
        cameraTarget.y = (respawnPlatform.y - player.height) - cameraOffsetY;
        // Увеличиваем скорость камеры для быстрого возврата
        currentSmoothness = 0.15;
    } else if (gameState !== 'dead') {
        // В остальных случаях камера следует за игроком.
        cameraTarget.x = player.x - cameraOffsetX;
        cameraTarget.y = player.y - cameraOffsetY;
    }

    // Ограничиваем камеру по оси Y, чтобы она не падала в пропасть
    const lastSafePlatform = getLastSafePlatform();
    if (lastSafePlatform) {
        const maxCameraTargetY = lastSafePlatform.y - cameraOffsetY;
        if (cameraTarget.y > maxCameraTargetY) {
            cameraTarget.y = maxCameraTargetY;
        }
    }
    
    // Плавно двигаем камеру к её цели
    const smoothFactor = 1 - Math.pow(1 - currentSmoothness, dt * 60);
    camera.x += (cameraTarget.x - camera.x) * smoothFactor;
    camera.y += (cameraTarget.y - camera.y) * smoothFactor;

    // Когда камера прибыла в точку возрождения, завершаем процесс
    if (gameState === 'panningToRespawn') {
        if (Math.abs(camera.x - cameraTarget.x) < 5 && Math.abs(camera.y - cameraTarget.y) < 5) {
            finalizeRespawn();
        }
    }
}

