import { GRAVITY, JUMP_FORCE } from './constants.js';
import { playJumpSound, playLandSound } from './audio.js';

// --- Состояние игрока ---
const player = {
    x: 150, y: 100,
    width: 40, height: 40,
    dx: 300, dy: 0,
    onGround: false,
    wasOnGround: false,
    angle: 0,
    flashTime: 0,
    jumpInitiated: false,
    jumpsLeft: 2, // Счетчик для двойного прыжка
    effects: {
        magnetTimer: 0,
        doubleJumpTimer: 0
    }
};

// --- Функции для внешнего доступа ---
export function getPlayer() {
    return player;
}

export function setPlayerSpeed(speed) {
    player.dx = speed;
}

/**
 * Сбрасывает эффекты и состояние прыжков игрока.
 */
export function resetPlayerState() {
    player.jumpsLeft = 2;
    player.effects.magnetTimer = 0;
    player.effects.doubleJumpTimer = 0;
}

/**
 * Выполняет прыжок. Поддерживает двойной прыжок, если активен модификатор.
 */
export function performPlayerJump() {
    const canDoubleJump = player.effects.doubleJumpTimer > 0;

    if (player.jumpsLeft > 0) {
        if (player.jumpsLeft === 1 && !canDoubleJump) {
            return;
        }
        player.dy = JUMP_FORCE;
        player.onGround = false;
        player.jumpsLeft--;
        playJumpSound();
    }
}

/**
 * Обновляет физическое состояние игрока.
 * @param {number} scaledDt - Время кадра.
 * @param {object[]} activePlatforms - Активные платформы.
 * @returns {object} Результат обновления.
 */
export function updatePlayer(scaledDt, activePlatforms) {
    let collisionResult = {
        hasDied: false,
        landed: false,
        newSafePlatform: null
    };

    if (player.effects.magnetTimer > 0) {
        player.effects.magnetTimer -= scaledDt;
    }
    if (player.effects.doubleJumpTimer > 0) {
        player.effects.doubleJumpTimer -= scaledDt;
    }

    player.x += player.dx * scaledDt;
    player.dy += GRAVITY * scaledDt;
    player.y += player.dy * scaledDt;

    let onSolidGround = false;
    if (player.flashTime > 0) player.flashTime -= scaledDt * 60;

    activePlatforms.forEach(platform => {
        if (player.x + player.width > platform.x && player.x < platform.x + platform.width) {
            const collisionSide = player.x + player.width >= platform.x && player.x + player.width < platform.x + (player.dx * scaledDt) + 1;
            if (player.dx > 0 && collisionSide && player.y + player.height > platform.y && player.y < platform.y + platform.height) {
                 const ledgeHeight = (player.y + player.height) - platform.y;
                 if (ledgeHeight > 0 && ledgeHeight < player.height / 2 && player.dy >= 0) {
                    player.y = platform.y - player.height;
                    player.dy = -120;
                    onSolidGround = true;
                    collisionResult.newSafePlatform = platform;
                 } else {
                    collisionResult.hasDied = true;
                 }
            }
            if (player.dy >= 0 && player.y + player.height >= platform.y && player.y + player.height < platform.y + platform.height + (player.dy * scaledDt)) {
                player.y = platform.y - player.height;
                player.dy = 0;
                onSolidGround = true;
                collisionResult.newSafePlatform = platform;
            }
            if (player.dy < 0 && player.y < platform.y + platform.height && player.y > platform.y) {
                 player.y = platform.y + platform.height;
                 player.dy = 0;
            }
        }
    });
    
    player.onGround = onSolidGround;
    
    if (player.onGround) {
        player.angle = Math.round(player.angle / (Math.PI / 2)) * (Math.PI / 2);
    } else {
        player.angle += player.dx / 50 * scaledDt;
    }

    if (player.onGround && !player.wasOnGround) {
        playLandSound();
        collisionResult.landed = true;
        player.jumpsLeft = 2;
    }
    player.wasOnGround = player.onGround;

    return collisionResult;
}

