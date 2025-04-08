/**
 * Controller for computer keyboard input
 */
export class KeyboardController {
    /**
     * Create a keyboard controller
     * @param {Object} noteHandler - Object with handleNoteOn and handleNoteOff methods
     */
    constructor(noteHandler) {
        this.noteHandler = noteHandler;
        this.activeKeys = {};
        this.keyMap = this.createKeyMap();
        
        this.initEventListeners();
    }

    /**
     * Create key mapping for computer keyboard
     * @returns {Object} - Map of key codes to MIDI note numbers
     */
    createKeyMap() {
        return {
            "KeyA": 60, // C4
            "KeyW": 61, // C#4
            "KeyS": 62, // D4
            "KeyE": 63, // D#4
            "KeyD": 64, // E4
            "KeyF": 65, // F4
            "KeyT": 66, // F#4
            "KeyG": 67, // G4
            "KeyY": 68, // G#4
            "KeyH": 69, // A4
            "KeyU": 70, // A#4
            "KeyJ": 71, // B4
            "KeyK": 72, // C5
            "KeyO": 73, // C#5
            "KeyL": 74, // D5
            "KeyP": 75, // D#5
            "Semicolon": 76, // E5
            "Quote": 77, // F5
            "BracketRight": 78, // F#5
            "Backslash": 79, // G5
        };
    }

    /**
     * Initialize event listeners for keyboard input
     */
    initEventListeners() {
        // Key down event
        document.addEventListener("keydown", async (event) => {
            if (this.keyMap[event.code] !== undefined && !this.activeKeys[event.code]) {
                await Tone.start();
                this.activeKeys[event.code] = this.keyMap[event.code];
                this.noteHandler.handleNoteOn(this.keyMap[event.code]);
                
                // Update UI
                document.querySelector(`.white-key[data-key="${event.code}"]`)?.classList.add("active");
                document.querySelector(`.black-key[data-key="${event.code}"]`)?.classList.add("active");
            }
        });

        // Key up event
        document.addEventListener("keyup", (event) => {
            if (this.activeKeys[event.code] !== undefined) {
                const midiNote = this.activeKeys[event.code];
                delete this.activeKeys[event.code];
                this.noteHandler.handleNoteOff(midiNote);
                
                // Update UI
                document.querySelector(`.white-key[data-key="${event.code}"]`)?.classList.remove("active");
                document.querySelector(`.black-key[data-key="${event.code}"]`)?.classList.remove("active");
            }
        });
    }

    /**
     * Get active MIDI notes from keyboard
     * @returns {number[]} - Array of active MIDI notes
     */
    getActiveNotes() {
        return Object.values(this.activeKeys);
    }
}
