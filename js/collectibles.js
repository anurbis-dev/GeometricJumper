import { getPlayer } from './player.js';
import { playCollectSoundYellow, playCollectSoundOrange, playCollectSoundPurple, playCollectSoundRed, playCollectModifierSound } from './audio.js';

// --- Определение типов коллекционных предметов ---

const PIXEL_YELLOW = {
    id: 'pixel_yellow',
    size: 8,
    draw: (ctx, c) => {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
        ctx.beginPath(); ctx.arc(c.x, c.y, c.size * 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffff00';
        ctx.beginPath(); ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2); ctx.fill();
    },
    onCollect: (player, offset) => {
        player.flashTime = 10;
        playCollectSoundYellow(offset);
        return 1;
    }
};

const PIXEL_ORANGE = {
    id: 'pixel_orange',
    size: 9,
    draw: (ctx, c) => {
        ctx.fillStyle = 'rgba(255, 165, 0, 0.2)';
        ctx.beginPath(); ctx.arc(c.x, c.y, c.size * 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffa500';
        ctx.beginPath(); ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2); ctx.fill();
    },
    onCollect: (player, offset) => {
        player.flashTime = 10;
        playCollectSoundOrange(offset);
        return 3;
    }
};

const PIXEL_PURPLE = {
    id: 'pixel_purple',
    size: 10,
    draw: (ctx, c) => {
        ctx.fillStyle = 'rgba(128, 0, 128, 0.3)';
        ctx.beginPath(); ctx.arc(c.x, c.y, c.size * 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#800080';
        ctx.beginPath(); ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2); ctx.fill();
    },
    onCollect: (player, offset) => {
        player.flashTime = 10;
        playCollectSoundPurple(offset);
        return 5;
    }
};

const PIXEL_RED = {
    id: 'pixel_red',
    size: 12,
    draw: (ctx, c) => {
        const alpha = 0.4 + (Math.sin(performance.now() / 150) + 1) * 0.3;
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.5})`;
        ctx.beginPath(); ctx.arc(c.x, c.y, c.size * 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.beginPath(); ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2); ctx.fill();
    },
    onCollect: (player, offset) => {
        player.flashTime = 10;
        playCollectSoundRed(offset);
        return 10;
    }
};

const MODIFIER_MAGNET = {
    id: 'modifier_magnet',
    size: 14,
    draw: (ctx, c) => {
        const alpha = 0.5 + (Math.sin(performance.now() / 200) + 1) * 0.25;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(performance.now() / 1000);
        ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(-c.size / 2, -c.size / 2, c.size, c.size);
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.3})`;
        ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
        ctx.restore();
    },
    onCollect: (player, offset) => {
        player.effects.magnetTimer += 7;
        playCollectModifierSound(offset);
        return 0;
    }
};

const MODIFIER_DOUBLE_JUMP = {
    id: 'modifier_double_jump',
    size: 14,
    draw: (ctx, c) => {
        const alpha = 0.5 + (Math.sin(performance.now() / 200) + 1) * 0.25;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(performance.now() / 1000);
        ctx.strokeStyle = `rgba(0, 191, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(-c.size / 2, -c.size / 2, c.size, c.size);
        ctx.fillStyle = `rgba(0, 191, 255, ${alpha * 0.3})`;
        ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
        ctx.restore();
    },
    onCollect: (player, offset) => {
        player.effects.doubleJumpTimer += 10;
        playCollectModifierSound(offset);
        return 0;
    }
};

export const COLLECTIBLE_TYPES = {
    'pixel_yellow': PIXEL_YELLOW,
    'pixel_orange': PIXEL_ORANGE,
    'pixel_purple': PIXEL_PURPLE,
    'pixel_red': PIXEL_RED,
    'modifier_magnet': MODIFIER_MAGNET,
    'modifier_double_jump': MODIFIER_DOUBLE_JUMP,
};

export function createCollectible(typeName, x, y) {
    const type = COLLECTIBLE_TYPES[typeName];
    if (!type) return null;
    return {
        x, y,
        dx: 0, dy: 0,
        type: type.id,
        size: type.size,
        active: true,
        isAttracted: false,
        draw: type.draw,
        onCollect: type.onCollect
    };
}

export function updateCollectibles(activeCollectibles, scaledDt) {
    const player = getPlayer();
    let pointsCollected = 0;
    let soundOffset = 0;

    activeCollectibles.forEach(c => {
        if (c.active) {
            if (player.effects.magnetTimer > 0 && c.type.startsWith('pixel')) {
                const magnetRadius = player.width * 5;
                const dist = Math.hypot(player.x + player.width / 2 - c.x, player.y + player.height / 2 - c.y);
                if (dist < magnetRadius && dist > 1) {
                    c.isAttracted = true;
                }
            }
            
            if(c.isAttracted) {
                const angle = Math.atan2(player.y + player.height / 2 - c.y, player.x + player.width / 2 - c.x);
                const attractionForce = 4000;
                c.dx += Math.cos(angle) * attractionForce * scaledDt;
                c.dy += Math.sin(angle) * attractionForce * scaledDt;
                
                // Добавляем "сопротивление воздуха", чтобы погасить излишнюю скорость
                c.dx *= 0.95;
                c.dy *= 0.95;
            } else {
                c.dx *= 0.9;
                c.dy *= 0.9;
            }
            
            c.x += c.dx * scaledDt;
            c.y += c.dy * scaledDt;

            const collectDist = Math.hypot(player.x + player.width / 2 - c.x, player.y + player.height / 2 - c.y);
            if (collectDist < player.width / 2 + c.size) {
                c.active = false;
                const points = c.onCollect(player, soundOffset);
                pointsCollected += points;
                if (points > 0 || c.type.startsWith('modifier')) {
                    soundOffset += 0.02;
                }
            }
        }
    });

    return pointsCollected;
}

export function drawCollectibles(ctx, activeCollectibles) {
    activeCollectibles.forEach(c => {
        if (c.active) {
            c.draw(ctx, c);
        }
    });
}

export function resetAllCollectibles(allCollectibles) {
    allCollectibles.forEach(c => {
        c.active = true;
        c.dx = 0;
        c.dy = 0;
        c.isAttracted = false;
    });
}

