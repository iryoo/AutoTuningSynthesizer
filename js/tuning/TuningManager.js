import { EqualTemperament } from './EqualTemperament.js';
import { JustIntonation } from './JustIntonation.js';
import { AutoTuningTemperament } from './AutoTuningTemperament.js';

/**
 * Manager for tuning systems
 */
export class TuningManager {
    /**
     * Create a tuning manager
     * @param {Object} synth - The synthesizer instance
     * @param {number} baseFrequency - Base frequency in Hz
     * @param {number} baseMidiNote - MIDI note number for base frequency
     */
    constructor(synth, baseFrequency, baseMidiNote) {
        this.synth = synth;
        this.baseFrequency = baseFrequency;
        this.baseMidiNote = baseMidiNote;
        
        // Create tuning systems
        this.equalTemperament = new EqualTemperament(baseFrequency, baseMidiNote);
        this.justIntonation = new JustIntonation(baseFrequency, baseMidiNote);
        this.autoTuningTemperament = new AutoTuningTemperament(baseFrequency, baseMidiNote);
        
        // Default tuning system
        this.currentTuningSystem = this.autoTuningTemperament;
        
        // Input controllers
        this.inputControllers = [];
    }

    /**
     * Add an input controller
     * @param {Object} controller - Input controller with getActiveNotes method
     */
    addInputController(controller) {
        this.inputControllers.push(controller);
    }

    /**
     * Set the tuning system
     * @param {string} tuningType - Type of tuning system ('equal', 'just', or 'auto')
     */
    setTuningSystem(tuningType) {
        switch (tuningType) {
            case 'equal':
                this.currentTuningSystem = this.equalTemperament;
                break;
            case 'just':
                this.currentTuningSystem = this.justIntonation;
                break;
            case 'auto':
                this.currentTuningSystem = this.autoTuningTemperament;
                break;
            default:
                console.error(`Unknown tuning system: ${tuningType}`);
                return;
        }
    }

    /**
     * Set the base frequency
     * @param {number} frequency - Base frequency in Hz
     */
    setBaseFrequency(frequency) {
        this.baseFrequency = frequency;
        this.equalTemperament.setBaseFrequency(frequency);
        this.justIntonation.setBaseFrequency(frequency);
        this.autoTuningTemperament.setBaseFrequency(frequency);
    }

    /**
     * Set the base MIDI note
     * @param {number} midiNote - MIDI note number
     */
    setBaseMidiNote(midiNote) {
        this.baseMidiNote = midiNote;
        this.equalTemperament.setBaseMidiNote(midiNote);
        this.justIntonation.setBaseMidiNote(midiNote);
        this.autoTuningTemperament.setBaseMidiNote(midiNote);
    }

    /**
     * Get all active notes from input controllers
     * @returns {number[]} - Array of active MIDI notes
     */
    getActiveNotes() {
        let activeNotes = [];
        for (const controller of this.inputControllers) {
            activeNotes = activeNotes.concat(controller.getActiveNotes());
        }
        return activeNotes;
    }

    /**
     * Get frequencies for active notes
     * @param {number[]} activeNotes - Array of active MIDI notes
     * @returns {Map<number, number>} - Map of MIDI note to frequency
     */
    getFrequencies(activeNotes) {
        return this.currentTuningSystem.getFrequencies(activeNotes);
    }

    /**
     * Format ratio display for UI
     * @param {number[]} activeNotes - Array of active MIDI notes
     * @returns {string} - Formatted ratio display
     */
    formatRatioDisplay(activeNotes) {
        return this.currentTuningSystem.formatRatioDisplay(activeNotes);
    }

    /**
     * Handle note on event
     * @param {number} midiNote - MIDI note number
     */
    handleNoteOn(midiNote) {
        const activeNotes = this.getActiveNotes();
        
        if (this.currentTuningSystem === this.autoTuningTemperament) {
            // For auto tuning, we need to recalculate all frequencies
            const frequencies = this.currentTuningSystem.getFrequencies(activeNotes);
            
            // Update all active notes with new frequencies
            for (const [note, frequency] of frequencies.entries()) {
                if (this.synth.voices.has(note)) {
                    this.synth.changeFrequency(note, frequency);
                } else {
                    this.synth.triggerAttack(note, frequency);
                }
            }
        } else {
            // For other tuning systems, just trigger the new note
            const frequency = this.currentTuningSystem.getFrequency(midiNote);
            this.synth.triggerAttack(midiNote, frequency);
        }
    }

    /**
     * Handle note off event
     * @param {number} midiNote - MIDI note number
     */
    handleNoteOff(midiNote) {
        this.synth.triggerRelease(midiNote);
    }
}
