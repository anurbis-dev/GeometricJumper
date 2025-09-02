let music = {};

/**
 * Генерирует и запускает процедурную музыку.
 * @param {object} synths - Объект, содержащий bassSynth и leadSynth.
 * @param {object} Tone - Глобальный объект Tone.js.
 */
export function generateMusic(synths, Tone) {
    if (music.bass) music.bass.dispose();
    if (music.lead) music.lead.dispose();
    
    const scales = {
        major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10],
        pentatonicMajor: [0, 2, 4, 7, 9], pentatonicMinor: [0, 3, 5, 7, 10]
    };
    const rootNotes = ["C", "D", "E", "F", "G", "A"];
    const currentRoot = rootNotes[Math.floor(Math.random() * rootNotes.length)];
    const currentScaleName = Object.keys(scales)[Math.floor(Math.random() * Object.keys(scales).length)];
    const currentScale = scales[currentScaleName];

    function getNote(octave, scale, index) {
        const noteIndex = scale[index % scale.length];
        const octaveOffset = Math.floor(index / scale.length);
        return Tone.Frequency(currentRoot + (octave + octaveOffset)).transpose(noteIndex).toNote();
    }

    const melody = [];
    let melodyIndex = Math.floor(Math.random() * 5);
    for (let i = 0; i < 32; i++) {
         if (Math.random() > 0.3) {
            melody.push(getNote(4, currentScale, melodyIndex));
            melodyIndex += Math.floor(Math.random() * 5) - 2;
            melodyIndex = Math.max(0, Math.min(10, melodyIndex));
         } else { melody.push(null); }
    }
    const bassLine = [getNote(2, currentScale, 0), getNote(1, currentScale, 4), getNote(1, currentScale, 5), getNote(1, currentScale, 3)];
    
    const bassPattern = new Tone.Pattern((time, note) => {
        synths.bassSynth.triggerAttackRelease(note, "2n", time)
    }, bassLine, "randomWalk");
    bassPattern.interval = "1m";

    const leadSequence = new Tone.Sequence((time, note) => {
        if (note) synths.leadSynth.triggerAttackRelease(note, "8n", time);
    }, melody, "4n");
    
    music = { bass: bassPattern, lead: leadSequence };
    music.bass.start(0);
    music.lead.start(0);
}
