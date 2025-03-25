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
    let baseFreq = baseFreqInput.value;
    baseFreqInput.addEventListener("input", (event) => {
        baseFreq = event.target.value;
    });

    // 周波数比を計算する関数
    const dimensionRatio = [2, 3, 5];
    const calcRatio = pos => {
        let ratio = 1;
        for (let i = 0; i < dimensionRatio.length; i++) {
            ratio *= Math.pow(dimensionRatio[i], pos[i]);
        }
        return ratio;
    }

    // 純正律のマッピング
    const splitNoteAndOctave = input => {
        const match = input.match(/^([^\d]+)(\d+)$/);
        if (match) {
            return [match[1], parseInt(match[2], 10)];
        }
        return [input, null]; // 数字がない場合の処理
    }
    const justIntonation = input => {
        const note = splitNoteAndOctave(input)[0];
        const octave = splitNoteAndOctave(input)[1];
        const baseOctave = octave - 4;
        switch (note) {
            case "C":
                return [baseOctave, 0, 0];
            case "C#":
                return [baseOctave + 4, -1, -1];
            case "D":
                return [baseOctave - 3, 2, 0];
            case "D#":
                return [baseOctave + 1, 1, -1];
            case "E":
                return [baseOctave - 2, 0, 1];
            case "F":
                return [baseOctave + 2, -1, 0];
            case "F#":
                return [baseOctave + 6, -2, -1];
            case "G":
                return [baseOctave - 1, 1, 0];
            case "G#":
                return [baseOctave + 3, 0, -1];
            case "A":
                return [baseOctave, -1, 1];
            case "A#":
                return [baseOctave + 4, -2, 0];
            case "B":
                return [baseOctave - 3, 1, 1];
        }
    }
    const keyMap = {
        "KeyA": justIntonation("C4"),
        "KeyS": justIntonation("D4"),
        "KeyD": justIntonation("E4"),
        "KeyF": justIntonation("F4"),
        "KeyG": justIntonation("G4"),
        "KeyH": justIntonation("A4"),
        "KeyJ": justIntonation("B4"),
        "KeyK": justIntonation("C5"),
        "KeyL": justIntonation("D5"),
        "Semicolon": justIntonation("E5"),
        "Quote": justIntonation("F5"),
        "Backslash": justIntonation("G5"),

        "KeyW": justIntonation("C#4"),
        "KeyE": justIntonation("D#4"),
        "KeyT": justIntonation("F#4"),
        "KeyY": justIntonation("G#4"),
        "KeyU": justIntonation("A#4"),
        "KeyO": justIntonation("C#5"),
        "KeyP": justIntonation("D#5"),
        "BracketRight": justIntonation("F#5"),
    };

    // UI 要素
    const ratioDisplay = document.getElementById("ratio-display");
    const keys = document.querySelectorAll(".key");

    // 現在押されているキーを記録
    let activeKeys = {};

    // キーを押したときの処理
    document.addEventListener("keydown", async (event) => {
        if (keyMap[event.code] && !activeKeys[event.code]) {
            await Tone.start();
            synth.triggerAttack(baseFreq * calcRatio(keyMap[event.code]));
            activeKeys[event.code] = keyMap[event.code];


            // UI 更新
            document.querySelector(`.key[data-key="${event.code}"]`)?.classList.add("active");
            updateRatioDisplay();
        }
    });

    // キーを離したときの処理
    document.addEventListener("keyup", (event) => {
        if (activeKeys[event.code]) {
            synth.triggerRelease(baseFreq * calcRatio(keyMap[event.code]));
            delete activeKeys[event.code];

            // UI 更新
            document.querySelector(`.key[data-key="${event.code}"]`)?.classList.remove("active");
            updateRatioDisplay();
        }
    });

    // 周波数比を更新する関数
    function updateRatioDisplay() {
        let positions = Object.values(activeKeys);
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

    const comparePositions = (a, b) => calcRatio(a) - calcRatio(b);
    const lcm2 = arr => arr.reduce((a, b) => lcm(a, b));
    const lcm = (a, b) => (a * b) / gcd(a, b);
    const gcd2 = arr => arr.reduce((a, b) => gcd(a, b));
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
});
