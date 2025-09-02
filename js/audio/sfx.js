// Объект для хранения всех синтезаторов
const synths = {};

/**
 * Инициализирует все синтезаторы для звуковых эффектов.
 * @param {object} Tone - Глобальный объект Tone.js.
 */
export function initSfx(Tone) {
    synths.jumpSynth = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.0, release: 0.1 } }).toDestination();
    synths.landSynth = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0 } }).toDestination();
    synths.deathSynth = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.2 } }).toDestination();
    synths.deathNoise = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }).toDestination();
    
    const collectSynthSettings = { oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } };
    synths.collectSynthYellow = new Tone.Synth(collectSynthSettings).toDestination();
    synths.collectSynthOrange = new Tone.Synth(collectSynthSettings).toDestination();
    synths.collectSynthPurple = new Tone.Synth(collectSynthSettings).toDestination();
    synths.collectSynthRed = new Tone.Synth(collectSynthSettings).toDestination();
    synths.collectModifierSynth = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.4, sustain: 0.1, release: 0.2 } }).toDestination();
    
    synths.portalSynth = new Tone.AMSynth({
        harmonicity: 1.5,
        oscillator: { type: "sine" },
        envelope: { attack: 0.1, decay: 0.2, sustain: 1.0, release: 0.5 },
        modulation: { type: "square" },
        modulationEnvelope: { attack: 0.5, decay: 0.0, sustain: 1.0, release: 0.5 }
    }).toDestination();
    synths.portalSynth.volume.value = -Infinity;
    
    new Tone.Loop(time => {
        synths.portalSynth.triggerAttackRelease("C3", "2n", time);
    }, "1n").start(0);

    // Настройка громкости
    synths.jumpSynth.volume.value = -10;
    synths.landSynth.volume.value = -15;
    synths.deathSynth.volume.value = -8;
    synths.deathNoise.volume.value = -15;
    synths.collectSynthYellow.volume.value = -14;
    synths.collectSynthOrange.volume.value = -13;
    synths.collectSynthPurple.volume.value = -12;
    synths.collectSynthRed.volume.value = -11;
    synths.collectModifierSynth.volume.value = -10;
}

/**
 * Объект, содержащий функции для проигрывания звуковых эффектов.
 */
export const sfx = {
    playJump: () => synths.jumpSynth?.triggerAttackRelease("C5", "8n"),
    playLand: () => synths.landSynth?.triggerAttackRelease("8n"),
    playDeath: () => {
        if (synths.deathSynth) {
            synths.deathSynth.triggerAttackRelease("G2", "0.4");
            synths.deathSynth.frequency.rampTo("C2", 0.4);
            synths.deathNoise.triggerAttackRelease("0.2");
        }
    },
    playCollectYellow: (offset = 0) => synths.collectSynthYellow?.triggerAttackRelease("C6", "16n", Tone.now() + offset),
    playCollectOrange: (offset = 0) => synths.collectSynthOrange?.triggerAttackRelease("E6", "16n", Tone.now() + offset),
    playCollectPurple: (offset = 0) => synths.collectSynthPurple?.triggerAttackRelease("G6", "16n", Tone.now() + offset),
    playCollectRed: (offset = 0) => synths.collectSynthRed?.triggerAttackRelease("C7", "16n", Tone.now() + offset),
    playCollectModifier: (offset = 0) => synths.collectModifierSynth?.triggerAttackRelease("A5", "8n", Tone.now() + offset),
    setPortalVolume: (player, teleport, canvasWidth) => {
        if (!synths.portalSynth || !teleport || !teleport.x) return;
        const distToPortal = teleport.x - (player.x + player.width / 2);
        const maxDist = canvasWidth * 2;
        if (distToPortal < maxDist && distToPortal > 0) {
            const proximity = 1 - (distToPortal / maxDist);
            const targetVolume = -30 + (proximity * 25);
            synths.portalSynth.volume.rampTo(targetVolume, 0.2);
        } else {
            synths.portalSynth.volume.rampTo(-Infinity, 0.5);
        }
    },
    stopPortal: () => synths.portalSynth?.volume.rampTo(-Infinity, 0.5)
};
