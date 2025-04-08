/**
 * Custom polyphonic synthesizer
 */
export class CustomPolySynth {
    /**
     * Create a custom polyphonic synthesizer
     * @param {Object} options - Synthesizer options
     */
    constructor(options = {}) {
        this.voices = new Map();
        this.maxPolyphony = options.maxPolyphony || 8;
        this.activeVoices = new Set();
        this.synthOptions = options.synthOptions || {};
        this.volume = new Tone.Volume().toDestination();
    }

    /**
     * Create a new voice
     * @returns {Tone.Synth} - New synth voice
     * @private
     */
    _createVoice() {
        const synth = new Tone.Synth(this.synthOptions).connect(this.volume);
        return synth;
    }

    /**
     * Trigger a note attack
     * @param {number} midiNote - MIDI note number
     * @param {number} frequency - Frequency in Hz
     * @param {number} time - Start time
     * @returns {CustomPolySynth} - this
     */
    triggerAttack(midiNote, frequency, time = Tone.now()) {
        if (!this.voices.has(midiNote)) {
            if (this.activeVoices.size >= this.maxPolyphony) {
                const oldestVoice = this.activeVoices.values().next().value;
                this.triggerRelease(oldestVoice);
            }
            const voice = this._createVoice();
            this.voices.set(midiNote, voice);
            this.activeVoices.add(midiNote);
        }
        const voice = this.voices.get(midiNote);
        voice.triggerAttack(frequency, time);
        return this;
    }

    /**
     * Trigger a note release
     * @param {number} midiNote - MIDI note number
     * @param {number} time - Release time
     * @returns {CustomPolySynth} - this
     */
    triggerRelease(midiNote, time = Tone.now()) {
        if (this.voices.has(midiNote)) {
            const voice = this.voices.get(midiNote);
            const releaseTime = voice.envelope.release;
            voice.triggerRelease(time);
            this.activeVoices.delete(midiNote);
            this.voices.delete(midiNote);

            Tone.Transport.scheduleOnce((scheduledTime) => {
                voice.dispose();
            }, time + releaseTime);
            Tone.Transport.start();
        }
        return this;
    }

    /**
     * Change the frequency of a voice
     * @param {number} midiNote - MIDI note number
     * @param {number} newFreq - New frequency in Hz
     * @param {number} time - Transition time
     * @returns {CustomPolySynth} - this
     */
    changeFrequency(midiNote, newFreq, time = 0.01) {
        const voice = this.voices.get(midiNote);
        if (voice) {
            voice.frequency.rampTo(newFreq, time);
        }
        return this;
    }

    /**
     * Set synthesizer parameters
     * @param {Object} params - Synthesizer parameters
     * @returns {CustomPolySynth} - this
     */
    set(params) {
        this.synthOptions = { ...this.synthOptions, ...params };
        this.voices.forEach((voice) => {
            voice.set(params);
        });
        return this;
    }

    /**
     * Dispose of all voices and resources
     */
    dispose() {
        this.voices.forEach((voice) => {
            voice.dispose();
        });
        this.voices.clear();
        this.activeVoices.clear();
        this.volume.dispose();
    }
}
