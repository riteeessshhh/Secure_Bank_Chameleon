/**
 * Session Recorder Utility
 * 
 * Records attacker session actions (keystrokes, clicks, navigation, focus).
 * 
 * ⚠️ WARNING: This is for DEMO/TESTING purposes only.
 * In production, disable keystroke capture for password fields and sensitive data.
 * Only record actions after user consent and in compliance with privacy regulations.
 */

class SessionRecorder {
    constructor() {
        this.actions = [];
        this.startTime = null;
        this.isRecording = false;
        this.recordingMode = 'demo'; // 'demo' | 'production'
    }
    
    /**
     * Start recording session
     */
    start() {
        this.actions = [];
        this.startTime = Date.now();
        this.isRecording = true;
        console.log('[SessionRecorder] Recording started');
    }
    
    /**
     * Stop recording
     */
    stop() {
        this.isRecording = false;
        console.log('[SessionRecorder] Recording stopped. Total actions:', this.actions.length);
        return this.actions;
    }
    
    /**
     * Record a keystroke
     * 
     * @param {string} key - The key pressed
     * @param {string} target - Element ID or selector
     * @param {boolean} isPassword - Whether this is a password field (skip in production)
     */
    recordKeystroke(key, target = 'input', isPassword = false) {
        if (!this.isRecording) return;
        
        // In production mode, skip password field keystrokes
        if (this.recordingMode === 'production' && isPassword) {
            return;
        }
        
        // In demo mode, record everything (including passwords for demonstration)
        const action = {
            type: 'keystroke',
            ts: Date.now() - this.startTime,
            payload: key,
            target: target
        };
        
        this.actions.push(action);
    }
    
    /**
     * Record a click
     */
    recordClick(x, y, target = null) {
        if (!this.isRecording) return;
        
        const action = {
            type: 'click',
            ts: Date.now() - this.startTime,
            x: x,
            y: y,
            target: target
        };
        
        this.actions.push(action);
    }
    
    /**
     * Record navigation
     */
    recordNavigate(url, target = null) {
        if (!this.isRecording) return;
        
        const action = {
            type: 'navigate',
            ts: Date.now() - this.startTime,
            target: target || url
        };
        
        this.actions.push(action);
    }
    
    /**
     * Record focus event
     */
    recordFocus(target) {
        if (!this.isRecording) return;
        
        const action = {
            type: 'focus',
            ts: Date.now() - this.startTime,
            target: target
        };
        
        this.actions.push(action);
    }
    
    /**
     * Record form submit
     */
    recordSubmit() {
        if (!this.isRecording) return;
        
        const action = {
            type: 'submit',
            ts: Date.now() - this.startTime
        };
        
        this.actions.push(action);
    }
    
    /**
     * Get recorded actions
     */
    getActions() {
        return this.actions;
    }
    
    /**
     * Clear recorded actions
     */
    clear() {
        this.actions = [];
        this.startTime = null;
    }
    
    /**
     * Set recording mode
     * 'demo' - Record everything (including passwords) for demonstration
     * 'production' - Skip sensitive fields (passwords, etc.)
     */
    setMode(mode) {
        this.recordingMode = mode;
        console.log(`[SessionRecorder] Mode set to: ${mode}`);
    }
}

// Singleton instance
const sessionRecorder = new SessionRecorder();

export default sessionRecorder;



