let audioInitialized = false;
let music = {};
let jumpSynth, landSynth, deathSynth, deathNoise, pauseSynth, menuSynth, victorySynth, portalSynth, portalLoop;
let bassSynth, leadSynth;

// Новые синтезаторы для каждого типа пикселя и модификатора
let collectSynthYellow, collectSynthOrange, collectSynthPurple, collectSynthRed, collectModifierSynth;


export function initAudio() {
    if (audioInitialized) return;
    Tone.start();

    const reverb = new Tone.Reverb(1.5).toDestination();
    const delay = new Tone.FeedbackDelay("8n", 0.3).connect(reverb);
    
    bassSynth = new Tone.MonoSynth({
        oscillator: { type: "fmsine" },
        envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 1.4 },
        filterEnvelope: { attack: 0.05, decay: 0.1, sustain: 0.8, release: 1, baseFrequency: 200, octaves: 4 }
    }).connect(delay);
    bassSynth.volume.value = -12;

    leadSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 }
    }).connect(delay);
    leadSynth.volume.value = -18;
    
    Tone.Transport.bpm.value = 240;
    
    jumpSynth = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.0, release: 0.1 } }).toDestination();
    landSynth = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0 } }).toDestination();
    deathSynth = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.2 } }).toDestination();
    deathNoise = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }).toDestination();
    pauseSynth = new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 } }).toDestination();
    
    // Инициализация новых синтезаторов
    const synthSettings = { oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } };
    collectSynthYellow = new Tone.Synth(synthSettings).toDestination();
    collectSynthOrange = new Tone.Synth(synthSettings).toDestination();
    collectSynthPurple = new Tone.Synth(synthSettings).toDestination();
    collectSynthRed = new Tone.Synth(synthSettings).toDestination();
    collectModifierSynth = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.4, sustain: 0.1, release: 0.2 } }).toDestination();


    menuSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 }
    }).toDestination();
    menuSynth.volume.value = -15;

    victorySynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5 }
    }).toDestination();
    
    portalSynth = new Tone.AMSynth({
        harmonicity: 1.5,
        oscillator: { type: "sine" },
        envelope: { attack: 0.1, decay: 0.2, sustain: 1.0, release: 0.5 },
        modulation: { type: "square" },
        modulationEnvelope: { attack: 0.5, decay: 0.0, sustain: 1.0, release: 0.5 }
    }).toDestination();
    portalSynth.volume.value = -Infinity;
    portalLoop = new Tone.Loop(time => {
        portalSynth.triggerAttackRelease("C3", "2n", time);
    }, "1n").start(0);

    jumpSynth.volume.value = -10; landSynth.volume.value = -15; deathSynth.volume.value = -8; deathNoise.volume.value = -15; pauseSynth.volume.value = -10; victorySynth.volume.value = -12;
    collectSynthYellow.volume.value = -14;
    collectSynthOrange.volume.value = -13;
    collectSynthPurple.volume.value = -12;
    collectSynthRed.volume.value = -11;
    collectModifierSynth.volume.value = -10;
    
    Tone.Transport.start();
    audioInitialized = true;
    document.getElementById('instructions').classList.add('hidden');
}

export function generateMusic() {
    if (!audioInitialized) return;
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
    const bassPattern = new Tone.Pattern((time, note) => bassSynth.triggerAttackRelease(note, "2n", time), bassLine, "randomWalk");
    bassPattern.interval = "1m";
    const leadSequence = new Tone.Sequence((time, note) => { if (note) leadSynth.triggerAttackRelease(note, "8n", time); }, melody, "4n");
    music = { bass: bassPattern, lead: leadSequence };
    music.bass.start(0); music.lead.start(0);
}

// Функции для проигрывания звуков
export function playJumpSound() { if (audioInitialized) jumpSynth.triggerAttackRelease("C5", "8n"); }
export function playLandSound() { if (audioInitialized) landSynth.triggerAttackRelease("8n"); }
export function playDeathSound() {
    if (audioInitialized) {
        deathSynth.triggerAttackRelease("G2", "0.4");
        deathSynth.frequency.rampTo("C2", 0.4);
        deathNoise.triggerAttackRelease("0.2");
    }
}
export function playPauseSound() { if (audioInitialized) pauseSynth.triggerAttackRelease("E4", "16n"); }
export function playMenuSound(isPause) {
    if (audioInitialized) {
        const now = Tone.now();
        const notes = isPause ? ["C4", "E4", "G4"] : ["G4", "E4", "C4"];
        menuSynth.triggerAttackRelease(notes, "8n", now);
    }
}
export function playVictorySound() {
    if (audioInitialized) {
        const now = Tone.now();
        victorySynth.triggerAttackRelease("C5", "16n", now);
        victorySynth.triggerAttackRelease("E5", "16n", now + 0.125);
        victorySynth.triggerAttackRelease("G5", "16n", now + 0.25);
        victorySynth.triggerAttackRelease("C6", "8n", now + 0.375);
    }
}

// Обновленные функции для звуков пикселей с временным сдвигом
export function playCollectSoundYellow(offset = 0) { if (audioInitialized) collectSynthYellow.triggerAttackRelease("C6", "16n", Tone.now() + offset); }
export function playCollectSoundOrange(offset = 0) { if (audioInitialized) collectSynthOrange.triggerAttackRelease("E6", "16n", Tone.now() + offset); }
export function playCollectSoundPurple(offset = 0) { if (audioInitialized) collectSynthPurple.triggerAttackRelease("G6", "16n", Tone.now() + offset); }
export function playCollectSoundRed(offset = 0) { if (audioInitialized) collectSynthRed.triggerAttackRelease("C7", "16n", Tone.now() + offset); }
export function playCollectModifierSound(offset = 0) { if (audioInitialized) collectModifierSynth.triggerAttackRelease("A5", "8n", Tone.now() + offset); }


export function setPortalVolume(player, teleport, canvasWidth) {
    if (!audioInitialized || !teleport || !teleport.x) return;
    const distToPortal = teleport.x - (player.x + player.width / 2);
    const maxDist = canvasWidth * 2;
    if (distToPortal < maxDist && distToPortal > 0) {
        const proximity = 1 - (distToPortal / maxDist);
        const targetVolume = -30 + (proximity * 25);
        portalSynth.volume.rampTo(targetVolume, 0.2);
    } else {
        portalSynth.volume.rampTo(-Infinity, 0.5);
    }
}

export function stopPortalSound() { if (audioInitialized) portalSynth.volume.rampTo(-Infinity, 0.5); }
export function startTransport() { if (audioInitialized && Tone.Transport.state !== 'started') Tone.Transport.start(); }
export function pauseTransport() { if (audioInitialized) Tone.Transport.pause(); }
export function stopTransport() { if (audioInitialized) Tone.Transport.stop(); }

