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
    const baseFreqInput = document.getElementById("baseFreqInput");
    let baseFreq = parseFloat(baseFreqInput.value);
    baseFreqInput.addEventListener("input", (event) => {
        baseFreq = parseFloat(event.target.value);
    });

    // 音律の選択
    const tuningSelect = document.getElementById("tuningSelect");
    let currentTuning = tuningSelect.value;

    tuningSelect.addEventListener("input", (event) => {
        currentTuning = event.target.value;
        activeKeys = {};
        updateRatioDisplay();
        updateFrequencyDisplay(); // 音律変更時に周波数表示を更新
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
    const calcJustIntonationRatio = input => {
        const note = splitNoteAndOctave(input)[0];
        const octave = splitNoteAndOctave(input)[1];
        const baseOctave = octave - 4;
        switch (note) {
            case "C":
                return [baseOctave, 0, 0]; // 1
            case "C#":
                return [baseOctave + 4, -1, -1]; // 16/15
            case "D":
                return [baseOctave - 3, 2, 0]; // 9/8
            case "D#":
                return [baseOctave + 1, 1, -1]; // 6/5
            case "E":
                return [baseOctave - 2, 0, 1]; // 5/4
            case "F":
                return [baseOctave + 2, -1, 0]; // 4/3
            case "F#":
                return [baseOctave + 6, -2, -1]; // 64/45
            case "G":
                return [baseOctave - 1, 1, 0]; // 3/2
            case "G#":
                return [baseOctave + 3, 0, -1]; // 8/5
            case "A":
                return [baseOctave, -1, 1]; // 5/3
            case "A#":
                return [baseOctave + 4, -2, 0]; // 16/9
            case "B":
                return [baseOctave - 3, 1, 1]; // 15/8
        }
    };

    // 平均律の周波数比を計算する関数
    const calcEqualTemperamentRatio = input => {
        const note = splitNoteAndOctave(input)[0];
        const octave = splitNoteAndOctave(input)[1];
        const baseOctave = octave - 4;
        const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const noteIndex = notes.indexOf(note);
        const semitones = noteIndex + baseOctave * 12;
        return Math.pow(2, semitones / 12);
    };

    // 純正律のマッピング
    const splitNoteAndOctave = input => {
        const match = input.match(/^([^\d]+)(\d+)$/);
        if (match) {
            return [match[1], parseInt(match[2], 10)];
        }
        return [input, null];
    };
    const keyMap = {
        "KeyA": "C4",
        "KeyS": "D4",
        "KeyD": "E4",
        "KeyF": "F4",
        "KeyG": "G4",
        "KeyH": "A4",
        "KeyJ": "B4",
        "KeyK": "C5",
        "KeyL": "D5",
        "Semicolon": "E5",
        "Quote": "F5",
        "Backslash": "G5",

        "KeyW": "C#4",
        "KeyE": "D#4",
        "KeyT": "F#4",
        "KeyY": "G#4",
        "KeyU": "A#4",
        "KeyO": "C#5",
        "KeyP": "D#5",
        "BracketRight": "F#5",
    };

    // UI 要素
    const ratioDisplay = document.getElementById("ratio-display");
    const frequencyDisplay = document.getElementById("frequency-display"); // 周波数表示用要素

    // 現在押されているキーを記録
    let activeKeys = {};

    // キーを押したときの処理
    document.addEventListener("keydown", async (event) => {
        if (keyMap[event.code] && !activeKeys[event.code]) {
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
            updateFrequencyDisplay(); // 周波数表示を更新
        }
    });

    // キーを離したときの処理
    document.addEventListener("keyup", (event) => {
        if (activeKeys[event.code]) {
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
            updateFrequencyDisplay(); // 周波数表示を更新
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

    // 周波数表示を更新する関数
    function updateFrequencyDisplay() {
        let frequencies = [];
        for (const key in activeKeys) {
            let ratio;
            if (currentTuning === "just") {
                ratio = calcRatio(calcJustIntonationRatio(keyMap[key]));
            } else if (currentTuning === "equal") {
                ratio = calcEqualTemperamentRatio(keyMap[key]);
            }
            frequencies.push(Math.round(baseFreq * ratio));
        }
        frequencyDisplay.innerText = frequencies.length > 0 ? frequencies.join(", ") + " Hz" : "";
    }

    const comparePositions = (a, b) => calcRatio(a) - calcRatio(b);
    const lcm2 = arr => arr.reduce((a, b) => lcm(a, b));
    const lcm = (a, b) => (a * b) / gcd(a, b);
    const gcd2 = arr => arr.reduce((a, b) => gcd(a, b));
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
});
