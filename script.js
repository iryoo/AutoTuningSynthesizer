document.addEventListener("DOMContentLoaded", () => {
    // Tone.js のセットアップ
    const myPolySynth = new CustomPolySynth();

    // 音量をセット
    const volumeSlider = document.getElementById("volumeSlider");
    myPolySynth.volume.volume.value = parseFloat(volumeSlider.value);
    volumeSlider.addEventListener("input", (event) => {
        myPolySynth.volume.volume.value = parseFloat(event.target.value);
    });

    // 波形のセレクト
    const waveformSelect = document.getElementById("waveformSelect");
    myPolySynth.set({ oscillator: { type: waveformSelect.value } });
    waveformSelect.addEventListener("input", (event) => {
        myPolySynth.set({ oscillator: { type: event.target.value } });
    });

    // 基準となる音の周波数をセット
    let baseMidiNote = 60; // MIDI note number for base frequency (C4)
    let baseFreq = Tone.Frequency(baseMidiNote, "midi").toFrequency();
    const baseFreqInput = document.getElementById("baseFreqInput");
    const baseMidiNoteInput = document.getElementById("baseMidiNoteInput");
    baseFreqInput.value = baseFreq;
    baseMidiNoteInput.value = baseMidiNote;

    baseFreqInput.addEventListener("input", (event) => {
        baseFreq = parseFloat(event.target.value);
        updateFrequencyDisplay();
    });

    baseMidiNoteInput.addEventListener("input", (event) => {
        baseMidiNote = parseInt(event.target.value);
        updateFrequencyDisplay();
    });

    // 音律の選択
    const tuningSelect = document.getElementById("tuningSelect");
    let currentTuning = tuningSelect.value;

    tuningSelect.addEventListener("input", (event) => {
        currentTuning = event.target.value;
        activeKeys = {};
        updateRatioDisplay();
        updateFrequencyDisplay();
    });

    // ADSR Controls
    const attackSlider = document.getElementById("attackSlider");
    const decaySlider = document.getElementById("decaySlider");
    const sustainSlider = document.getElementById("sustainSlider");
    const releaseSlider = document.getElementById("releaseSlider");

    const setADSR = (a, d, s, r) => {
        myPolySynth.set({
            envelope: {
                attack: parseFloat(a),
                decay: parseFloat(d),
                sustain: parseFloat(s),
                release: parseFloat(r),
            },
        });
    }

    setADSR(parseFloat(attackSlider.value), parseFloat(decaySlider.value), parseFloat(sustainSlider.value), parseFloat(releaseSlider.value));

    attackSlider.addEventListener("input", (event) => {
        const currentEnvelope = myPolySynth.synthOptions.envelope;
        setADSR(parseFloat(event.target.value), currentEnvelope.decay, currentEnvelope.sustain, currentEnvelope.release);
    });

    decaySlider.addEventListener("input", (event) => {
        const currentEnvelope = myPolySynth.synthOptions.envelope;
        setADSR(currentEnvelope.attack, parseFloat(event.target.value), currentEnvelope.sustain, currentEnvelope.release);
    });

    sustainSlider.addEventListener("input", (event) => {
        const currentEnvelope = myPolySynth.synthOptions.envelope;
        setADSR(currentEnvelope.attack, currentEnvelope.decay, parseFloat(event.target.value), currentEnvelope.release);
    });

    releaseSlider.addEventListener("input", (event) => {
        const currentEnvelope = myPolySynth.synthOptions.envelope;
        setADSR(currentEnvelope.attack, currentEnvelope.decay, currentEnvelope.sustain, parseFloat(event.target.value));
    });
    
    // 周波数比を計算する関数
    const dimensionRatio = [2, 3, 5];
    const calcRatio = pos => {
        let ratio = 1;
        for (let i = 0; i < dimensionRatio.length; i++) {
            ratio *= Math.pow(dimensionRatio[i], pos[i]);
        }
        return ratio;
    };

    // 距離を計算する関数
    const calcDistance = pos => {
        let distance = 0;
        for (let i = 0; i < dimensionRatio.length; i++) {
            distance += Math.pow(dimensionRatio[i] * pos[i], 2);
        }
        return distance;
    };

    //MidiNoteの差から距離を求める関数
    const diffToDistance = diff => calcDistance(calcJustIntonationPosition(diff + baseMidiNote));

    //positionの和を計算する関数
    const positionSum = (a, b) => {
        let position = [];
        for (let i = 0; i < a.length; i++) {
            position[i] = a[i] + b[i];
        }
        return position;
    }

    // 純正律の音程を座標にする関数
    const calcJustIntonationPosition = midiNote => {
        const semitones = midiNote - baseMidiNote;
        const baseOctave = Math.floor(semitones / 12);
        const noteOffset = (semitones + 1200) % 12;
        let position;
        switch (noteOffset) {
            case 0: // C
                position = [0, 0, 0]; // 1
                break;
            case 1: // C#
                position = [4, -1, -1]; // 16/15
                break;
            case 2: // D
                position = [- 3, 2, 0]; // 9/8
                break;
            case 3: // D#
                position = [1, 1, -1]; // 6/5
                break;
            case 4: // E
                position = [-2, 0, 1]; // 5/4
                break;
            case 5: // F
                position = [2, -1, 0]; // 4/3
                break;
            case 6: // F#
                position = [6, -2, -1]; // 64/45
                break;
            case 7: // G
                position = [-1, 1, 0]; // 3/2
                break;
            case 8: // G#
                position = [3, 0, -1]; // 8/5
                break;
            case 9: // A
                position = [0, -1, 1]; // 5/3
                break;
            case 10: // A#
                position = [4, -2, 0]; // 16/9
                break;
            case 11: // B
                position = [-3, 1, 1]; // 15/8
                break;
            default:
                return [0, 0, 0];
        }
        return positionSum([baseOctave, 0, 0], position);
    };

    // 平均律の周波数比を計算する関数
    const calcEqualTemperamentRatio = midiNote => {
        const semitones = midiNote - baseMidiNote;
        return Math.pow(2, semitones / 12);
    };

    // Auto Tuning Temperamentの音程を座標にする関数
    const calcAutoTuningTemperamentPositions = (midiNotes) => {
        const positions = {};
        positions[baseMidiNote] = [0, 0, 0];
        let midiNotesToCompare = [baseMidiNote];
        let remainingMidiNotes = [...midiNotes];
        let isBaseMidiNoteDeleted = false;
        while (remainingMidiNotes.length > 0) {
            const result = calcNextMidiNoteToProcess(remainingMidiNotes, midiNotesToCompare);
            const semitones = result.nextMidiNoteToProcess - result.midiNoteToCompare;
            let position = calcJustIntonationPosition(semitones + baseMidiNote);
            positions[result.nextMidiNoteToProcess] = positionSum(positions[result.midiNoteToCompare], position);
            if (result.nextMidiNoteToProcess !== result.midiNoteToCompare && !isBaseMidiNoteDeleted) {
                midiNotesToCompare = midiNotesToCompare.filter(note => note !== baseMidiNote);
                isBaseMidiNoteDeleted = true;
            }
            remainingMidiNotes = remainingMidiNotes.filter(note => note !== result.nextMidiNoteToProcess);
            midiNotesToCompare.push(result.nextMidiNoteToProcess);
        }

        if (!midiNotes.includes(baseMidiNote)) {
            delete positions[baseMidiNote];
        }
        return positions;
    };

    // 次に計算するべきmidiNoteを求める関数
    const calcNextMidiNoteToProcess = (unprocessedMidiNotes, midiNotesToCompare) => {
        let minDistance = Infinity;
        let nextMidiNoteToProcess = null;
        let midiNoteToCompare = null;

        for (let i = 0; i < unprocessedMidiNotes.length; i++) {
            for (let j = 0; j < midiNotesToCompare.length; j++) {
                const diff = Math.abs(unprocessedMidiNotes[i] - midiNotesToCompare[j]);
                const distance = diffToDistance(diff);

                if (distance < minDistance) {
                    minDistance = distance;
                    nextMidiNoteToProcess = unprocessedMidiNotes[i];
                    midiNoteToCompare = midiNotesToCompare[j];
                }
            }
        }
        return { nextMidiNoteToProcess, midiNoteToCompare };
    };

    // MIDIノート番号のマッピング
    const keyMap = {
        "KeyA": 60, // C4
        "KeyW": 61, // C#4
        "KeyS": 62, // D4
        "KeyE": 63, // D#4
        "KeyD": 64, // E4
        "KeyF": 65, // F4
        "KeyT": 66, // F#4
        "KeyG": 67, // G4
        "KeyY": 68, // G#4
        "KeyH": 69, // A4
        "KeyU": 70, // A#4
        "KeyJ": 71, // B4
        "KeyK": 72, // C5
        "KeyO": 73, // C#5
        "KeyL": 74, // D5
        "KeyP": 75, // D#5
        "Semicolon": 76, // E5
        "Quote": 77, // F5
        "BracketRight": 78, // F#5
        "Backslash": 79, // G5
    };

    // UI 要素
    const ratioDisplay = document.getElementById("ratio-display");
    const frequencyDisplay = document.getElementById("frequency-display");

    // 現在押されているキーを記録
    let activeKeys = {};

    // キーを押したときの処理
    document.addEventListener("keydown", async (event) => {
        if (keyMap[event.code] !== undefined && !activeKeys[event.code]) {
            await Tone.start();
            activeKeys[event.code] = keyMap[event.code];
            handleNoteOn(keyMap[event.code]);
            // UI 更新
            document.querySelector(`.white-key[data-key="${event.code}"]`)?.classList.add("active");
            document.querySelector(`.black-key[data-key="${event.code}"]`)?.classList.add("active");
        }
    });

    // キーを離したときの処理
    document.addEventListener("keyup", (event) => {
        if (activeKeys[event.code] !== undefined) {
            delete activeKeys[event.code];
            handleNoteOff(keyMap[event.code]);
            // UI 更新
            document.querySelector(`.white-key[data-key="${event.code}"]`)?.classList.remove("active");
            document.querySelector(`.black-key[data-key="${event.code}"]`)?.classList.remove("active");
        }
    });

    // MIDI関連のグローバル変数
    let midi, inputs, outputs;
    let activeMidiNotes = {}; // 押されているMIDIノートを記録

    // Web MIDI APIの初期化
    function initMIDI() {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess({ sysex: false }).then(onMIDISuccess, onMIDIFailure);
        } else {
            console.log('WebMIDI is not supported in this browser.');
        }
    }

    function onMIDISuccess(midiAccess) {
        console.log('MIDI Access Granted!');
        midi = midiAccess;
        inputs = midi.inputs.values();
        outputs = midi.outputs.values();

        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
            input.value.onmidimessage = onMIDIMessage;
        }

        midi.onstatechange = onStateChange;
    }

    function onMIDIFailure(error) {
        console.error('Could not access MIDI devices:', error);
    }

    function onStateChange(event) {
        console.log('MIDI state change:', event);
        inputs = midi.inputs.values();
        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
            input.value.onmidimessage = onMIDIMessage;
        }
    }

    function onMIDIMessage(message) {
        const data = message.data;
        const command = data[0] >> 4;
        const channel = data[0] & 0xf;
        const type = data[0] & 0xf0;
        const note = data[1];
        const velocity = data[2];

        switch (type) {
            case 144: // noteOn
                midiNoteOn(note, velocity);
                break;
            case 128: // noteOff
                midiNoteOff(note, velocity);
                break;
        }
    }

    function midiNoteOn(note, velocity) {
        if (velocity === 0) {
            midiNoteOff(note, velocity);
            return;
        }
        if (!activeMidiNotes[note]) {
            activeMidiNotes[note] = true;
            handleNoteOn(note);
        }
    }

    function midiNoteOff(note, velocity) {
        if (activeMidiNotes[note]) {
            activeMidiNotes[note] = false;
            handleNoteOff(note);
        }
    }

    // MIDIの初期化
    initMIDI();

    // ノートオンとノートオフの処理を共通化
    const handleNoteOn = (midiNote) => {
        let ratio;
        let frequency;
        if (currentTuning === "just") {
            ratio = calcRatio(calcJustIntonationPosition(midiNote));
            frequency = baseFreq * ratio;
            myPolySynth.triggerAttack(midiNote, frequency);
        } else if (currentTuning === "equal") {
            ratio = calcEqualTemperamentRatio(midiNote);
            frequency = baseFreq * ratio;
            myPolySynth.triggerAttack(midiNote, frequency);
        } else if (currentTuning === "auto") {
            const activeNotes = Object.values(activeKeys).concat(Object.keys(activeMidiNotes).filter(key => activeMidiNotes[key]).map(Number));
            const positions = calcAutoTuningTemperamentPositions(activeNotes);

            let ratios = [];
            for (const note of activeNotes) {
                ratios[note] = calcRatio(positions[note]);
            }

            ratio = ratios[midiNote];
            frequency = baseFreq * ratio;

            for (const note of activeNotes) {
                if (myPolySynth.voices.has(note)) {
                    myPolySynth.changeFrequency(note, baseFreq * ratios[note]);
                } else {
                    myPolySynth.triggerAttack(note, baseFreq * ratios[note]);
                }
            }
        }
        updateRatioDisplay();
        updateFrequencyDisplay();
    };

    const handleNoteOff = (midiNote) => {
        myPolySynth.triggerRelease(midiNote);
        updateRatioDisplay();
        updateFrequencyDisplay();
    };

    // 周波数比を更新する関数
    function updateRatioDisplay() {
        let positions = [];
        if (currentTuning === "equal") {
            ratioDisplay.innerText = "";
            return;
        }

        const activeNotes = Object.values(activeKeys).concat(Object.keys(activeMidiNotes).filter(key => activeMidiNotes[key]).map(Number));

        if (currentTuning === "just") {
            positions = Object.values(activeNotes).map(key => calcJustIntonationPosition(key));
        } else if (currentTuning === "auto") {
            positions = Object.values(calcAutoTuningTemperamentPositions(activeNotes));
        }

        if (positions.length <= 1) {
            ratioDisplay.innerText = "";
            return;
        }
        let sortedPositions = positions.toSorted(comparePositions);

        let ratios = [];
        let num = [];
        let den = [];

        for (let pos of sortedPositions) {
            num.push(1);
            den.push(1);
            for (let i = 0; i < pos.length; i++) {
                if (pos[i] > 0) num[num.length - 1] *= Math.pow(dimensionRatio[i], pos[i]);
                else if (pos[i] < 0) den[den.length - 1] *= Math.pow(dimensionRatio[i], -pos[i]);
            }
        }
        const lcm = lcm2(den);
        const gcd = gcd2(num);
        for (let i = 0; i < num.length; i++) {
            ratios[i] = (lcm * num[i]) / (gcd * den[i]);
        }
        ratioDisplay.innerText = `${ratios.join(" : ")} (${lcm2(ratios)})`;
    }

    // 周波数を更新する関数
    function updateFrequencyDisplay() {
        let frequencyData = []; // {keyCode, frequency}
        const activeNotes = Object.values(activeKeys).concat(Object.keys(activeMidiNotes).filter(key => activeMidiNotes[key]).map(Number));
        for (const midiNote of activeNotes) {
            let ratio;
            if (currentTuning === "just") {
                ratio = calcRatio(calcJustIntonationPosition(midiNote));
            } else if (currentTuning === "equal") {
                ratio = calcEqualTemperamentRatio(midiNote);
            } else if (currentTuning === "auto") {
                const positions = calcAutoTuningTemperamentPositions(activeNotes);

                let ratios = [];
                for (const note of activeNotes) {
                    ratios[note] = calcRatio(positions[note]);
                }

                ratio = ratios[midiNote];
            }
            const frequency = Math.round(baseFreq * ratio);
            frequencyData.push({ midiNote: midiNote, frequency: frequency });
        }
        if (frequencyData.length <= 0) {
            frequencyDisplay.innerText = "";
            return;
        }
        frequencyData.sort((a, b) => a.frequency - b.frequency);
        const sortedFrequencies = frequencyData.map(item => item.frequency);
        frequencyDisplay.innerText = sortedFrequencies.join(", ") + " Hz";
    }

    const comparePositions = (a, b) => calcRatio(a) - calcRatio(b);
    const lcm2 = arr => arr.reduce((a, b) => lcm(a, b));
    const lcm = (a, b) => (a * b) / gcd(a, b);
    const gcd2 = arr => arr.reduce((a, b) => gcd(a, b));
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
});
