import { CustomPolySynth } from './js/synth/CustomPolySynth.js';
import { TuningManager } from './js/tuning/TuningManager.js';
import { MIDIController } from './js/ui/MIDIController.js';
import { KeyboardController } from './js/ui/KeyboardController.js';
import { UIController } from './js/ui/UIController.js';

// DOMが完全に読み込まれてから初期化処理を開始
document.addEventListener("DOMContentLoaded", () => {
    console.log("Initializing Synthesizer...");

    // --- 初期値の取得 ---
    const baseMidiNoteInput = document.getElementById("baseMidiNoteInput");
    const baseFreqInput = document.getElementById("baseFreqInput");
    const waveformSelect = document.getElementById("waveformSelect");
    const attackSlider = document.getElementById("attackSlider");
    const decaySlider = document.getElementById("decaySlider");
    const sustainSlider = document.getElementById("sustainSlider");
    const releaseSlider = document.getElementById("releaseSlider");

    const initialBaseMidiNote = parseInt(baseMidiNoteInput.value);
    // Tone.jsがグローバルに存在することを期待
    const initialBaseFreq = parseFloat(baseFreqInput.value) || (typeof Tone !== 'undefined' ? Tone.Frequency(initialBaseMidiNote, "midi").toFrequency() : 261.63);
    // inputの値も更新しておく
    baseFreqInput.value = initialBaseFreq.toFixed(2);

    // --- 1. シンセサイザーの初期化 ---
    const synth = new CustomPolySynth({
        maxPolyphony: 16, // 最大同時発音数
        synthOptions: {
            // UIControllerで設定されるが、初期値として設定
            oscillator: { type: waveformSelect.value },
            envelope: {
                attack: parseFloat(attackSlider.value),
                decay: parseFloat(decaySlider.value),
                sustain: parseFloat(sustainSlider.value),
                release: parseFloat(releaseSlider.value),
            }
        }
    });

    // --- 2. チューニングマネージャーの初期化 ---
    const tuningManager = new TuningManager(synth, initialBaseFreq, initialBaseMidiNote);

    // --- 3. UIコントローラーの初期化 ---
    // UIControllerは内部でイベントリスナーを設定し、SynthとTuningManagerを操作する
    const uiController = new UIController(synth, tuningManager);

    // --- 4. ノートハンドラーの作成 ---
    // TuningManagerのノート処理をラップし、UI更新を追加する
    const noteHandler = {
        handleNoteOn: (midiNote) => {
            // Tone.jsのAudioContextを開始する (ユーザー操作起因の場合)
            // KeyboardController内でTone.start()が呼ばれるのでここでは不要かもしれないが念のため
            if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
                Tone.start();
                console.log("AudioContext started by note event.");
            }
            tuningManager.handleNoteOn(midiNote);
            // ノートイベント後にUI表示を更新
            uiController.updateRatioDisplay();
            uiController.updateFrequencyDisplay();
        },
        handleNoteOff: (midiNote) => {
            tuningManager.handleNoteOff(midiNote);
            // ノートイベント後にUI表示を更新
            uiController.updateRatioDisplay();
            uiController.updateFrequencyDisplay();
        }
    };

    // --- 5. インプットコントローラーの初期化 ---
    // KeyboardControllerとMIDIControllerに上記noteHandlerを渡す
    const keyboardController = new KeyboardController(noteHandler);
    const midiController = new MIDIController(noteHandler); // MIDIデバイスの接続も試みる

    // --- 6. TuningManagerにインプットコントローラーを登録 ---
    // これにより、TuningManagerがアクティブなノートを取得できるようになる
    tuningManager.addInputController(keyboardController);
    tuningManager.addInputController(midiController);

    // --- 7. 初期表示更新 ---
    // ページ読み込み時に現在の設定に基づいて表示を更新
    uiController.updateRatioDisplay();
    uiController.updateFrequencyDisplay();

    console.log("Synthesizer initialized successfully!");
});
