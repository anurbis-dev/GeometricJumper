import { generateMusic as proceduralGenerate } from './audio/music/proceduralMusic.js';
import { initSfx, sfx } from './audio/sfx.js';
import { initUiSounds, uiSounds } from './audio/ui.js';

let audioInitialized = false;
let musicSynths = {};

/**
 * Инициализирует всю аудиосистему.
 */
export function initAudio() {
    if (audioInitialized) return;
    Tone.start();

    // Создаем основные синтезаторы для музыки
    const reverb = new Tone.Reverb(1.5).toDestination();
    const delay = new Tone.FeedbackDelay("8n", 0.3).connect(reverb);
    
    musicSynths.bassSynth = new Tone.MonoSynth({
        oscillator: { type: "fmsine" },
        envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 1.4 },
        filterEnvelope: { attack: 0.05, decay: 0.1, sustain: 0.8, release: 1, baseFrequency: 200, octaves: 4 }
    }).connect(delay);
    musicSynths.bassSynth.volume.value = -12;

    musicSynths.leadSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 }
    }).connect(delay);
    musicSynths.leadSynth.volume.value = -18;
    
    // Инициализируем все под-модули
    initSfx(Tone);
    initUiSounds(Tone);

    Tone.Transport.bpm.value = 240;
    Tone.Transport.start();
    audioInitialized = true;
    document.getElementById('instructions').classList.add('hidden');
}

/**
 * Вызывает генератор процедурной музыки.
 */
export function generateMusic() {
    if (!audioInitialized) return;
    proceduralGenerate(musicSynths, Tone);
}

// --- Экспортируем все звуковые функции для удобного доступа ---
export const playJumpSound = sfx.playJump;
export const playLandSound = sfx.playLand;
export const playDeathSound = sfx.playDeath;
export const playCollectSoundYellow = sfx.playCollectYellow;
export const playCollectSoundOrange = sfx.playCollectOrange;
export const playCollectSoundPurple = sfx.playCollectPurple;
export const playCollectSoundRed = sfx.playCollectRed;
export const playCollectModifierSound = sfx.playCollectModifier;
export const setPortalVolume = sfx.setPortalVolume;
export const stopPortalSound = sfx.stopPortal;

export const playPauseSound = uiSounds.playPause;
export const playMenuSound = uiSounds.playMenu;
export const playVictorySound = uiSounds.playVictory;


// --- Управление транспортом (глобальное) ---
export function startTransport() { if (audioInitialized && Tone.Transport.state !== 'started') Tone.Transport.start(); }
export function pauseTransport() { if (audioInitialized) Tone.Transport.pause(); }
export function stopTransport() { if (audioInitialized) Tone.Transport.stop(); }

