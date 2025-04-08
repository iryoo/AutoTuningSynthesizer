/**
 * Controller for MIDI input
 */
export class MIDIController {
    /**
     * Create a MIDI controller
     * @param {Object} noteHandler - Object with handleNoteOn and handleNoteOff methods
     */
    constructor(noteHandler) {
        this.noteHandler = noteHandler;
        this.midi = null;
        this.inputs = null;
        this.outputs = null;
        this.activeMidiNotes = {}; // Tracks active MIDI notes
        
        this.initMIDI();
    }

    /**
     * Initialize Web MIDI API
     */
    initMIDI() {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess({ sysex: false })
                .then(this.onMIDISuccess.bind(this), this.onMIDIFailure.bind(this));
        } else {
            console.log('WebMIDI is not supported in this browser.');
        }
    }

    /**
     * Handle successful MIDI access
     * @param {MIDIAccess} midiAccess - MIDI access object
     */
    onMIDISuccess(midiAccess) {
        console.log('MIDI Access Granted!');
        this.midi = midiAccess;
        this.inputs = this.midi.inputs.values();
        this.outputs = this.midi.outputs.values();

        // Set up event handlers for all inputs
        for (let input = this.inputs.next(); input && !input.done; input = this.inputs.next()) {
            input.value.onmidimessage = this.onMIDIMessage.bind(this);
        }

        // Listen for state changes
        this.midi.onstatechange = this.onStateChange.bind(this);
    }

    /**
     * Handle MIDI access failure
     * @param {Error} error - Error object
     */
    onMIDIFailure(error) {
        console.error('Could not access MIDI devices:', error);
    }

    /**
     * Handle MIDI state changes (device connect/disconnect)
     * @param {MIDIConnectionEvent} event - MIDI connection event
     */
    onStateChange(event) {
        console.log('MIDI state change:', event);
        this.inputs = this.midi.inputs.values();
        
        // Update event handlers for all inputs
        for (let input = this.inputs.next(); input && !input.done; input = this.inputs.next()) {
            input.value.onmidimessage = this.onMIDIMessage.bind(this);
        }
    }

    /**
     * Handle incoming MIDI messages
     * @param {MIDIMessageEvent} message - MIDI message event
     */
    onMIDIMessage(message) {
        const data = message.data;
        const type = data[0] & 0xf0;
        const note = data[1];
        const velocity = data[2];

        switch (type) {
            case 144: // noteOn
                this.midiNoteOn(note, velocity);
                break;
            case 128: // noteOff
                this.midiNoteOff(note, velocity);
                break;
        }
    }

    /**
     * Handle MIDI note on event
     * @param {number} note - MIDI note number
     * @param {number} velocity - Note velocity
     */
    midiNoteOn(note, velocity) {
        if (velocity === 0) {
            // Some devices send noteOn with velocity 0 instead of noteOff
            this.midiNoteOff(note, velocity);
            return;
        }
        
        if (!this.activeMidiNotes[note]) {
            this.activeMidiNotes[note] = true;
            this.noteHandler.handleNoteOn(note);
        }
    }

    /**
     * Handle MIDI note off event
     * @param {number} note - MIDI note number
     * @param {number} velocity - Note velocity
     */
    midiNoteOff(note, velocity) {
        if (this.activeMidiNotes[note]) {
            this.activeMidiNotes[note] = false;
            this.noteHandler.handleNoteOff(note);
        }
    }

    /**
     * Get active MIDI notes
     * @returns {number[]} - Array of active MIDI notes
     */
    getActiveNotes() {
        return Object.keys(this.activeMidiNotes)
            .filter(key => this.activeMidiNotes[key])
            .map(Number);
    }
}
