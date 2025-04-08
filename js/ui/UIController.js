/**
 * Main UI controller for the synthesizer
 */
export class UIController {
    /**
     * Create a UI controller
     * @param {Object} synth - The synthesizer instance
     * @param {Object} tuningManager - The tuning manager
     */
    constructor(synth, tuningManager) {
        this.synth = synth;
        this.tuningManager = tuningManager;
        this.ratioDisplay = document.getElementById("ratio-display");
        this.frequencyDisplay = document.getElementById("frequency-display");
        
        this.initControlElements();
    }

    /**
     * Initialize UI control elements
     */
    initControlElements() {
        // Volume control
        const volumeSlider = document.getElementById("volumeSlider");
        this.synth.volume.volume.value = parseFloat(volumeSlider.value);
        volumeSlider.addEventListener("input", (event) => {
            this.synth.volume.volume.value = parseFloat(event.target.value);
        });

        // Waveform selection
        const waveformSelect = document.getElementById("waveformSelect");
        this.synth.set({ oscillator: { type: waveformSelect.value } });
        waveformSelect.addEventListener("input", (event) => {
            this.synth.set({ oscillator: { type: event.target.value } });
        });

        // Base frequency and MIDI note
        const baseFreqInput = document.getElementById("baseFreqInput");
        const baseMidiNoteInput = document.getElementById("baseMidiNoteInput");
        
        baseFreqInput.addEventListener("input", (event) => {
            const baseFreq = parseFloat(event.target.value);
            this.tuningManager.setBaseFrequency(baseFreq);
            this.updateFrequencyDisplay();
        });

        baseMidiNoteInput.addEventListener("input", (event) => {
            const baseMidiNote = parseInt(event.target.value);
            this.tuningManager.setBaseMidiNote(baseMidiNote);
            this.updateFrequencyDisplay();
        });

        // Tuning system selection
        const tuningSelect = document.getElementById("tuningSelect");
        this.tuningManager.setTuningSystem(tuningSelect.value);
        
        tuningSelect.addEventListener("input", (event) => {
            this.tuningManager.setTuningSystem(event.target.value);
            this.updateRatioDisplay();
            this.updateFrequencyDisplay();
        });

        // ADSR controls
        this.initADSRControls();
    }

    /**
     * Initialize ADSR envelope controls
     */
    initADSRControls() {
        const attackSlider = document.getElementById("attackSlider");
        const decaySlider = document.getElementById("decaySlider");
        const sustainSlider = document.getElementById("sustainSlider");
        const releaseSlider = document.getElementById("releaseSlider");

        const setADSR = (a, d, s, r) => {
            this.synth.set({
                envelope: {
                    attack: parseFloat(a),
                    decay: parseFloat(d),
                    sustain: parseFloat(s),
                    release: parseFloat(r),
                },
            });
        };

        setADSR(
            parseFloat(attackSlider.value),
            parseFloat(decaySlider.value),
            parseFloat(sustainSlider.value),
            parseFloat(releaseSlider.value)
        );

        attackSlider.addEventListener("input", (event) => {
            const currentEnvelope = this.synth.synthOptions.envelope;
            setADSR(
                parseFloat(event.target.value),
                currentEnvelope.decay,
                currentEnvelope.sustain,
                currentEnvelope.release
            );
        });

        decaySlider.addEventListener("input", (event) => {
            const currentEnvelope = this.synth.synthOptions.envelope;
            setADSR(
                currentEnvelope.attack,
                parseFloat(event.target.value),
                currentEnvelope.sustain,
                currentEnvelope.release
            );
        });

        sustainSlider.addEventListener("input", (event) => {
            const currentEnvelope = this.synth.synthOptions.envelope;
            setADSR(
                currentEnvelope.attack,
                currentEnvelope.decay,
                parseFloat(event.target.value),
                currentEnvelope.release
            );
        });

        releaseSlider.addEventListener("input", (event) => {
            const currentEnvelope = this.synth.synthOptions.envelope;
            setADSR(
                currentEnvelope.attack,
                currentEnvelope.decay,
                currentEnvelope.sustain,
                parseFloat(event.target.value)
            );
        });
    }

    /**
     * Update the ratio display
     */
    updateRatioDisplay() {
        const activeNotes = this.tuningManager.getActiveNotes();
        const ratioText = this.tuningManager.formatRatioDisplay(activeNotes);
        this.ratioDisplay.innerText = ratioText;
    }

    /**
     * Update the frequency display
     */
    updateFrequencyDisplay() {
        const activeNotes = this.tuningManager.getActiveNotes();
        if (activeNotes.length <= 0) {
            this.frequencyDisplay.innerText = "";
            return;
        }

        const frequencies = this.tuningManager.getFrequencies(activeNotes);
        const frequencyData = [];
        
        for (const [midiNote, frequency] of frequencies.entries()) {
            frequencyData.push({
                midiNote: midiNote,
                frequency: Math.round(frequency)
            });
        }
        
        frequencyData.sort((a, b) => a.frequency - b.frequency);
        const sortedFrequencies = frequencyData.map(item => item.frequency);
        this.frequencyDisplay.innerText = sortedFrequencies.join(", ") + " Hz";
    }
}
