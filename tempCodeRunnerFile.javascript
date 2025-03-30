document.addEventListener("DOMContentLoaded", () => {
    // Tone.js のセットアップ
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
    synth.set({ voice: Tone.Synth });

    // 音量をセット
    const volumeSlider = document.getElementById("volumeSlider");
    synth.volume.value = parseFloat(volumeSlider.value);
    volumeSlider.addEventListener("input", (event) => {
        synth.volume.value = parseFloat(event.target.value);
    });

    // 波形のセレクト
    const waveformSelect = document.getElementById("waveformSelect");
    synth.set({ oscillator: { type: waveformSelect.value } });
    waveformSelect.addEventListener("input", (event) => {
        synth.set({ oscillator: { type: event.target.value } });
    });

    // 基準となる音の周波数をセット
    const baseMidiNote = 60; // MIDI note number for base frequency (C4)
    const baseFreq = Tone.Frequency(baseMidiNote, "midi").toFrequency();
    const baseFreqInput = document.getElementById("baseFreqInput");
    baseFreqInput.value = baseFreq;
    baseFreqInput.addEventListener("input", (event) => {
        // baseFreq = parseFloat(event.target.value);
        // 基準周波数を変更する機能は削除
    });

    // 音律の選択
    const tuningSelect = document.getElementById("tuningSelect");
    let currentTuning = tuningSelect.value;

    tuningSelect.addEventListener("input", (event) => {
        currentTuning = event.target.value;
        activeKeys = {};
        updateRatioDisplay();
        updateAllFrequencies();
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

    // 純正律の周波数比を計算する関数
    const calcJustIntonationRatio = midiNote => {
        const baseOctave = Math.floor((midiNote - 60) / 12);
        const noteOffset = midiNote % 12;
        switch (noteOffset) {
            case 0: // C
                return [baseOctave, 0, 0]; // 1
            case 1: // C#
                return [baseOctave + 4, -1, -1]; // 16/15
            case 2: // D
                return [baseOctave - 3, 2, 0]; // 9/8
            case 3: // D#
                return [baseOctave + 1, 1, -1]; // 6/5
            case 4: // E
                return [baseOctave - 2, 0, 1]; // 5/4
            case 5: // F
                return [baseOctave + 2, -1, 0]; // 4/3
            case 6: // F#
                return [baseOctave + 6, -2, -1]; // 64/45
            case 7: // G
                return [baseOctave - 1, 1, 0]; // 3/2
            case 8: // G#
                return [baseOctave + 3, 0, -1]; // 8/5
            case 9: // A
                return [baseOctave, -1, 1]; // 5/3
            case 10: // A#
                return [baseOctave + 4, -2, 0]; // 16/9
            case 11: // B
                return [baseOctave - 3, 1, 1]; // 15/8
            default:
                return [0, 0, 0];
        }
    };

    // 平均律の周波数比を計算する関数
    const calcEqualTemperamentRatio = midiNote => {
        const semitones = midiNote - baseMidiNote;
        return Math.pow(2, semitones / 12);
    };

    // MIDIノート番号のマッピング
    const keyMap = {
        "KeyA": 60, // C4
        "KeyS": 62, // D4
        "KeyD": 64, // E4
        "KeyF": 65, // F4
        "KeyG": 67, // G4
        "KeyH": 69, // A4
        "KeyJ": 71, // B4
        "KeyK": 72, // C5
        "KeyL": 74, // D5
        "Semicolon": 76, // E5
        "Quote": 77, // F5
        "Backslash": 79, // G5

        "KeyW": 61, // C#4
        "KeyE": 63, // D#4
        "KeyT": 66, // F#4
        "KeyY": 68, // G#4
        "KeyU": 70, // A#4
        "KeyO": 73, // C#5
        "KeyP": 75, // D#5
        "BracketRight": 78, // F#5
    };

    // UI 要素
    const ratioDisplay = document.getElementById("ratio-display");

    // 現在押されているキーを記録
    let activeKeys = {};

    // キーを押したときの処理
    document.addEventListener("keydown", async (event) => {
        if (keyMap[event.code] !== undefined && !activeKeys[event.code]) {
            await Tone.start();
            let ratio;
            let frequency;
            if (currentTuning === "just") {
                ratio = calcRatio(calcJustIntonationRatio(keyMap[event.code]));
            } else if (currentTuning === "equal") {
                ratio = calcEqualTemperamentRatio(keyMap[event.code]);
            }
            frequency = baseFreq * ratio;
            synth.triggerAttack(frequency);
            activeKeys[event.code] = keyMap[event.code];

            // UI 更新
            document.querySelector(`.white-key[data-key="${event.code}"]`)?.classList.add("active");
            document.querySelector(`.black-key[data-key="${event.code}"]`)?.classList.add("active");
            updateRatioDisplay();
            updateKeyFrequency(event.code);
        }
    });

    // キーを離したときの処理
    document.addEventListener("keyup", (event) => {
        if (activeKeys[event.code] !== undefined) {
            let ratio;
            let frequency;
            if (currentTuning === "just") {
                ratio = calcRatio(calcJustIntonationRatio(keyMap[event.code]));
            } else if (currentTuning === "equal") {
                ratio = calcEqualTemperamentRatio(keyMap[event.code]);
            }
            frequency = baseFreq * ratio;
            synth.triggerRelease(frequency);
            delete activeKeys[event.code];

            // UI 更新
            document.querySelector(`.white-key[data-key="${event.code}"]`)?.classList.remove("active");
            document.querySelector(`.black-key[data-key="${event.code}"]`)?.classList.remove("active");
            updateRatioDisplay();
            updateKeyFrequency(event.code);
        }
    });

    // 周波数比を更新する関数
    function updateRatioDisplay() {
        if (currentTuning === "equal") {
            ratioDisplay.innerText = "";
            return;
        }
        let positions = Object.values(activeKeys).map(key => calcJustIntonationRatio(key));
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

    // キーの周波数を更新する関数
    function updateKeyFrequency(keyCode) {
        const key = document.querySelector(`[data-key="${keyCode}"]`);
        if (key) {
            let ratio;
            if (currentTuning === "just") {
                ratio = calcRatio(calcJustIntonationRatio(keyMap[keyCode]));
            } else if (currentTuning === "equal") {
                ratio = calcEqualTemperamentRatio(keyMap[keyCode]);
            }
            const frequency = Math.round(baseFreq * ratio);
            key.querySelector(".frequency").innerText = frequency + " Hz";
        }
    }

    // すべてのキーの周波数を更新する関数
    function updateAllFrequencies() {
        for (const keyCode in keyMap) {
            updateKeyFrequency(keyCode);
        }
    }

    const comparePositions = (a, b) => calcRatio(a) - calcRatio(b);
    const lcm2 = arr => arr.reduce((a, b) => lcm(a, b));
    const lcm = (a, b) => (a * b) / gcd(a, b);
    const gcd2 = arr => arr.reduce((a, b) => gcd(a, b));
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);

    // 初期化時にすべての周波数を更新
    updateAllFrequencies();
});
