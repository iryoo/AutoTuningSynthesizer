import { TuningSystem } from './TuningSystem.js';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * Just Intonation tuning system
 * Uses pure integer ratios for intervals
 */
export class JustIntonation extends TuningSystem {
    /**
     * Create a Just Intonation tuning system
     * @param {number} baseFrequency - Base frequency in Hz
     * @param {number} baseMidiNote - MIDI note number for base frequency
     */
    constructor(baseFrequency, baseMidiNote) {
        super(baseFrequency, baseMidiNote);
        this.dimensionRatio = [2, 3, 5]; // Prime factors used for tuning
    }

    /**
     * Calculate frequency ratio for a MIDI note
     * @param {number} midiNote - MIDI note number
     * @returns {number} - Frequency ratio
     */
    getRatio(midiNote) {
        const position = this.calcJustIntonationPosition(midiNote);
        return MathUtils.calcRatio(position, this.dimensionRatio);
    }

    /**
     * Calculate Just Intonation position for a MIDI note
     * @param {number} midiNote - MIDI note number
     * @returns {number[]} - Position array
     */
    calcJustIntonationPosition(midiNote) {
        const semitones = midiNote - this.baseMidiNote;
        const baseOctave = Math.floor(semitones / 12);
        const noteOffset = (semitones + 1200) % 12;
        let position;
        
        switch (noteOffset) {
            case 0: // C
                position = [0, 0, 0]; // 1
                break;
            case 1: // C#
                position = [4, -1, -1]; // 16/15
                break;
            case 2: // D
                position = [-3, 2, 0]; // 9/8
                break;
            case 3: // D#
                position = [1, 1, -1]; // 6/5
                break;
            case 4: // E
                position = [-2, 0, 1]; // 5/4
                break;
            case 5: // F
                position = [2, -1, 0]; // 4/3
                break;
            case 6: // F#
                position = [6, -2, -1]; // 64/45
                break;
            case 7: // G
                position = [-1, 1, 0]; // 3/2
                break;
            case 8: // G#
                position = [3, 0, -1]; // 8/5
                break;
            case 9: // A
                position = [0, -1, 1]; // 5/3
                break;
            case 10: // A#
                position = [4, -2, 0]; // 16/9
                break;
            case 11: // B
                position = [-3, 1, 1]; // 15/8
                break;
            default:
                return [0, 0, 0];
        }
        
        return MathUtils.positionSum([baseOctave, 0, 0], position);
    }

    /**
     * Get positions for multiple MIDI notes
     * @param {number[]} midiNotes - Array of MIDI note numbers
     * @returns {Map<number, number[]>} - Map of MIDI note to position
     */
    getPositions(midiNotes) {
        const positions = new Map();
        for (const note of midiNotes) {
            positions.set(note, this.calcJustIntonationPosition(note));
        }
        return positions;
    }

    /**
     * Format ratio display for UI
     * @param {number[]} activeNotes - Array of active MIDI notes
     * @returns {string} - Formatted ratio display
     */
    formatRatioDisplay(activeNotes) {
        if (activeNotes.length <= 1) {
            return "";
        }

        const positions = activeNotes.map(note => this.calcJustIntonationPosition(note));
        const sortedPositions = [...positions].sort((a, b) => 
            MathUtils.comparePositions(a, b, this.dimensionRatio)
        );

        let num = [];
        let den = [];

        for (let pos of sortedPositions) {
            num.push(1);
            den.push(1);
            for (let i = 0; i < pos.length; i++) {
                if (pos[i] > 0) {
                    num[num.length - 1] *= Math.pow(this.dimensionRatio[i], pos[i]);
                } else if (pos[i] < 0) {
                    den[den.length - 1] *= Math.pow(this.dimensionRatio[i], -pos[i]);
                }
            }
        }

        const lcm = MathUtils.lcmArray(den);
        const gcd = MathUtils.gcdArray(num);
        
        const ratios = [];
        for (let i = 0; i < num.length; i++) {
            ratios[i] = (lcm * num[i]) / (gcd * den[i]);
        }
        
        return `${ratios.join(" : ")} (${MathUtils.lcmArray(ratios)})`;
    }
}
