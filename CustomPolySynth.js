class CustomPolySynth {
    constructor(options = {}) {
        this.voices = new Map();
        this.maxPolyphony = options.maxPolyphony || 8;
        this.activeVoices = new Set();
        this.synthOptions = options.synthOptions || {};
        this.volume = new Tone.Volume().toDestination();
    }

    _createVoice() {
        const synth = new Tone.Synth(this.synthOptions).connect(this.volume);
        return synth;
    }

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
    }

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
    }

    changeFrequency(midiNote, newFreq, time = 0.01) {
        const voice = this.voices.get(midiNote);
        if (voice) {
            voice.frequency.rampTo(newFreq, time);
        }
        return this;
    }

    set(params) {
        this.synthOptions = { ...this.synthOptions, ...params };
        this.voices.forEach((voice) => {
            voice.set(params);
        });
    }

    dispose() {
        this.voices.forEach((voice) => {
            voice.dispose();
        });
        this.voices.clear();
        this.activeVoices.clear();
        this.volume.dispose();
    }
}