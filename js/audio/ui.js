// Объект для хранения всех синтезаторов
const synths = {};

/**
 * Инициализирует все синтезаторы для звуков интерфейса.
 * @param {object} Tone - Глобальный объект Tone.js.
 */
export function initUiSounds(Tone) {
    synths.pauseSynth = new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 } }).toDestination();
    
    synths.menuSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 }
    }).toDestination();
    
    synths.victorySynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5 }
    }).toDestination();

    // Настройка громкости
    synths.pauseSynth.volume.value = -10;
    synths.menuSynth.volume.value = -15;
    synths.victorySynth.volume.value = -12;
}

/**
 * Объект, содержащий функции для проигрывания звуков интерфейса.
 */
export const uiSounds = {
    playPause: () => synths.pauseSynth?.triggerAttackRelease("E4", "16n"),
    playMenu: (isPause) => {
        if (synths.menuSynth) {
            const now = Tone.now();
            const notes = isPause ? ["C4", "E4", "G4"] : ["G4", "E4", "C4"];
            synths.menuSynth.triggerAttackRelease(notes, "8n", now);
        }
    },
    playVictory: () => {
        if (synths.victorySynth) {
            const now = Tone.now();
            synths.victorySynth.triggerAttackRelease("C5", "16n", now);
            synths.victorySynth.triggerAttackRelease("E5", "16n", now + 0.125);
            synths.victorySynth.triggerAttackRelease("G5", "16n", now + 0.25);
            synths.victorySynth.triggerAttackRelease("C6", "8n", now + 0.375);
        }
    }
};
