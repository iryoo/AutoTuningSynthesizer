/**
 * Base class for tuning systems
 */
export class TuningSystem {
    /**
     * Create a tuning system
     * @param {number} baseFrequency - Base frequency in Hz
     * @param {number} baseMidiNote - MIDI note number for base frequency
     */
    constructor(baseFrequency, baseMidiNote) {
        this.baseFrequency = baseFrequency;
        this.baseMidiNote = baseMidiNote;
    }

    /**
     * Set the base frequency
     * @param {number} frequency - Base frequency in Hz
     */
    setBaseFrequency(frequency) {
        this.baseFrequency = frequency;
    }

    /**
     * Set the base MIDI note
     * @param {number} midiNote - MIDI note number
     */
    setBaseMidiNote(midiNote) {
        this.baseMidiNote = midiNote;
    }

    /**
     * Calculate frequency for a MIDI note
     * @param {number} midiNote - MIDI note number
     * @returns {number} - Frequency in Hz
     */
    getFrequency(midiNote) {
        const ratio = this.getRatio(midiNote);
        return this.baseFrequency * ratio;
    }

    /**
     * Calculate frequency ratio for a MIDI note
     * @param {number} midiNote - MIDI note number
     * @returns {number} - Frequency ratio
     */
    getRatio(midiNote) {
        throw new Error("Method 'getRatio' must be implemented by subclasses");
    }

    /**
     * Get frequencies for multiple MIDI notes
     * @param {number[]} midiNotes - Array of MIDI note numbers
     * @returns {Map<number, number>} - Map of MIDI note to frequency
     */
    getFrequencies(midiNotes) {
        const frequencies = new Map();
        for (const note of midiNotes) {
            frequencies.set(note, this.getFrequency(note));
        }
        return frequencies;
    }

    /**
     * Format ratio display for UI
     * @param {number[]} activeNotes - Array of active MIDI notes
     * @returns {string} - Formatted ratio display
     */
    formatRatioDisplay(activeNotes) {
        return "";
    }
}
