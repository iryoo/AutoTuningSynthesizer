document.addEventListener("DOMContentLoaded", () => {
    // 🎵 Tone.js のセットアップ
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
    synth.set({ voice: Tone.Synth, oscillator: { type: "sawtooth" } });

    const dimensionRatio = [2, 3, 5];

    // 🔢 周波数比を計算する関数
    function calcRatio(pos) {
        return Math.pow(dimensionRatio[0], pos[0]) * Math.pow(dimensionRatio[1], pos[1]) * Math.pow(dimensionRatio[2], pos[2]);
    }

    // 🎼 純正律の周波数マッピング
    const baseFreq = 264;
    const justIntonation = {
        "KeyZ": [-1, 0, 0],  // C3
        "KeyX": [-4, 2, 0], // D3
        "KeyC": [-3, 0, 1], // E3
        "KeyV": [1, -1, 0], // F3
        "KeyB": [-2, 1, 0], // G3
        "KeyN": [-1, -1, 1], // A3
        "KeyM": [-4, 1, 1], // B3
        "KeyA": [0, 0, 0],  // C4
        "KeyS": [-3, 2, 0], // D4
        "KeyD": [-2, 0, 1], // E4
        "KeyF": [2, -1, 0], // F4
        "KeyG": [-1, 1, 0], // G4
        "KeyH": [0, -1, 1], // A4
        "KeyJ": [-3, 1, 1], // B4
        "KeyK": [1, 0, 0]   // C5
    };

    // 🖥 UI 要素
    const ratioDisplay = document.getElementById("ratio-display");
    const keys = document.querySelectorAll(".key");

    // 🎹 現在押されているキーを記録
    let activeKeys = {};

    // 🎼 キーを押したときの処理
    document.addEventListener("keydown", async (event) => {
        if (justIntonation[event.code] && !activeKeys[event.code]) {
            await Tone.start();
            synth.triggerAttack(baseFreq * calcRatio(justIntonation[event.code]));
            activeKeys[event.code] = justIntonation[event.code];

            // UI 更新
            document.querySelector(`.key[data-key="${event.code}"]`)?.classList.add("active");
            updateRatioDisplay();
        }
    });

    // 🎵 キーを離したときの処理
    document.addEventListener("keyup", (event) => {
        if (activeKeys[event.code]) {
            synth.triggerRelease(baseFreq * calcRatio(justIntonation[event.code]));
            delete activeKeys[event.code];

            // UI 更新
            document.querySelector(`.key[data-key="${event.code}"]`)?.classList.remove("active");
            updateRatioDisplay();
        }
    });

    // 📊 周波数比を更新する関数
    function updateRatioDisplay() {
        let positions = Object.values(activeKeys);

        if (positions.length <= 1) {
            ratioDisplay.innerText = "";
            return;
        }
        
        let ratios = [];
        let num = [];
        let den = [];

        for(let pos of positions) {
            num.push(1);
            den.push(1);
            for(let i = 0; i < pos.length; i++) {
                if(pos[i] > 0) num[num.length - 1] *= Math.pow(dimensionRatio[i], pos[i]);
                else if(pos[i] < 0)  den[den.length - 1] *= Math.pow(dimensionRatio[i], -pos[i]);
            }
        }
        const lcm = lcm2(den);
        for(let i = 0; i < num.length; i++) {
            ratios[i] = lcm * num[i] / den[i];
        }
        ratioDisplay.innerText = `${ratios.join(" : ")}`;
    }

    const lcm2 = arr => arr.reduce((a, b) => lcm(a, b));
    const lcm = (a, b) => (a * b) / gcd(a, b);
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
});
