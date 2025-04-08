import { TuningSystem } from './TuningSystem.js';
import { JustIntonation } from './JustIntonation.js';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * Auto Tuning Temperament
 * Dynamically adjusts tuning based on currently played notes
 */
export class AutoTuningTemperament extends TuningSystem {
    /**
     * Create an Auto Tuning Temperament system
     * @param {number} baseFrequency - Base frequency in Hz
     * @param {number} baseMidiNote - MIDI note number for base frequency
     */
    constructor(baseFrequency, baseMidiNote) {
        super(baseFrequency, baseMidiNote);
        this.justIntonation = new JustIntonation(baseFrequency, baseMidiNote);
        this.dimensionRatio = this.justIntonation.dimensionRatio;
        this.activeNotes = [];
        this.positions = new Map();
    }

    /**
     * Set active notes and recalculate positions
     * @param {number[]} midiNotes - Array of active MIDI notes
     */
    setActiveNotes(midiNotes) {
        this.activeNotes = [...midiNotes];
        this.positions = this.calcAutoTuningTemperamentPositions(this.activeNotes);
    }

    /**
     * Calculate frequency ratio for a MIDI note
     * @param {number} midiNote - MIDI note number
     * @returns {number} - Frequency ratio
     */
    getRatio(midiNote) {
        if (!this.positions.has(midiNote)) {
            // If note isn't in the current positions map, recalculate
            this.setActiveNotes([...this.activeNotes, midiNote]);
        }
        
        const position = this.positions.get(midiNote);
        return MathUtils.calcRatio(position, this.dimensionRatio);
    }

    /**
     * Get frequencies for multiple MIDI notes
     * @param {number[]} midiNotes - Array of MIDI note numbers
     * @returns {Map<number, number>} - Map of MIDI note to frequency
     */
    getFrequencies(midiNotes) {
        this.setActiveNotes(midiNotes);
        
        const frequencies = new Map();
        for (const note of midiNotes) {
            const ratio = MathUtils.calcRatio(this.positions.get(note), this.dimensionRatio);
            frequencies.set(note, this.baseFrequency * ratio);
        }
        
        return frequencies;
    }

    /**
     * Calculate Auto Tuning Temperament positions for MIDI notes
     * @param {number[]} midiNotes - Array of MIDI notes
     * @returns {Map<number, number[]>} - Map of MIDI note to position
     */
    calcAutoTuningTemperamentPositions(midiNotes) {
        const positions = new Map();
        
        // If no notes, return empty map
        if (midiNotes.length === 0) {
            return positions;
        }
        
        // Start with base note at [0,0,0]
        positions.set(this.baseMidiNote, [0, 0, 0]);
        
        let midiNotesToCompare = [this.baseMidiNote];
        let remainingMidiNotes = [...midiNotes];
        
        // Remove base note from remaining if it's in the list
        const baseIndex = remainingMidiNotes.indexOf(this.baseMidiNote);
        if (baseIndex !== -1) {
            remainingMidiNotes.splice(baseIndex, 1);
        }
        
        let isBaseMidiNoteDeleted = false;
        
        // Process all remaining notes
        while (remainingMidiNotes.length > 0) {
            const result = this.calcNextMidiNoteToProcess(remainingMidiNotes, midiNotesToCompare);
            
            const semitones = result.nextMidiNoteToProcess - result.midiNoteToCompare;
            let position = this.justIntonation.calcJustIntonationPosition(semitones + this.baseMidiNote);
            
            positions.set(
                result.nextMidiNoteToProcess, 
                MathUtils.positionSum(positions.get(result.midiNoteToCompare), position)
            );
            
            // Remove base note from comparison list after first note is processed
            if (result.nextMidiNoteToProcess !== result.midiNoteToCompare && !isBaseMidiNoteDeleted) {
                midiNotesToCompare = midiNotesToCompare.filter(note => note !== this.baseMidiNote);
                isBaseMidiNoteDeleted = true;
            }
            
            // Remove processed note from remaining list
            const index = remainingMidiNotes.indexOf(result.nextMidiNoteToProcess);
            if (index !== -1) {
                remainingMidiNotes.splice(index, 1);
            }
            
            // Add processed note to comparison list
            midiNotesToCompare.push(result.nextMidiNoteToProcess);
        }

        // If base note wasn't in the original list, remove it from positions
        if (!midiNotes.includes(this.baseMidiNote)) {
            positions.delete(this.baseMidiNote);
        }
        
        return positions;
    }

    /**
     * Calculate the next MIDI note to process
     * @param {number[]} unprocessedMidiNotes - Unprocessed MIDI notes
     * @param {number[]} midiNotesToCompare - MIDI notes to compare against
     * @returns {Object} - Next note to process and note to compare it with
     */
    calcNextMidiNoteToProcess(unprocessedMidiNotes, midiNotesToCompare) {
        let minDistance = Infinity;
        let nextMidiNoteToProcess = null;
        let midiNoteToCompare = null;

        for (let i = 0; i < unprocessedMidiNotes.length; i++) {
            for (let j = 0; j < midiNotesToCompare.length; j++) {
                const diff = Math.abs(unprocessedMidiNotes[i] - midiNotesToCompare[j]);
                const distance = this.diffToDistance(diff);

                if (distance < minDistance) {
                    minDistance = distance;
                    nextMidiNoteToProcess = unprocessedMidiNotes[i];
                    midiNoteToCompare = midiNotesToCompare[j];
                }
            }
        }
        
        return { nextMidiNoteToProcess, midiNoteToCompare };
    }

    /**
     * Calculate distance from MIDI note difference
     * @param {number} diff - MIDI note difference
     * @returns {number} - Distance
     */
    diffToDistance(diff) {
        return MathUtils.calcDistance(
            this.justIntonation.calcJustIntonationPosition(diff + this.baseMidiNote),
            this.dimensionRatio
        );
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

        this.setActiveNotes(activeNotes);
        const positions = Array.from(this.positions.values());
        
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
