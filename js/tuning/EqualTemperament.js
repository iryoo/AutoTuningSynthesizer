import { TuningSystem } from './TuningSystem.js';

/**
 * Equal Temperament tuning system
 * Divides the octave into 12 equal parts
 */
export class EqualTemperament extends TuningSystem {
    /**
     * Calculate frequency ratio for a MIDI note
     * @param {number} midiNote - MIDI note number
     * @returns {number} - Frequency ratio
     */
    getRatio(midiNote) {
        const semitones = midiNote - this.baseMidiNote;
        return Math.pow(2, semitones / 12);
    }

    /**
     * Format ratio display for UI
     * @param {number[]} activeNotes - Array of active MIDI notes
     * @returns {string} - Formatted ratio display
     */
    formatRatioDisplay(activeNotes) {
        // Equal temperament doesn't display ratios
        return "";
    }
}
