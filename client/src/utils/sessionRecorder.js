/**
 * Enhanced Session Recorder Utility
 * 
 * Records attacker session actions with comprehensive event tracking:
 * - Keystrokes (with special key handling)
 * - Mouse clicks and movements
 * - Scroll events
 * - Focus/blur events
 * - Form submissions
 * - Window resize events
 * - Element visibility changes
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
        this.config = {
            recordMouseMovements: true,
            recordScrolls: true,
            recordResizes: true,
            mouseMovementThrottle: 100, // ms
            scrollThrottle: 100 // ms
        };
        this.lastMouseMoveTime = 0;
        this.lastScrollTime = 0;
        this.boundHandlers = new Map(); // Track bound handlers for cleanup
        this.fieldTexts = {}; // Track text per field for accurate replay
    }
    
    /**
     * Start recording session
     */
    start() {
        this.actions = [];
        this.startTime = Date.now();
        this.isRecording = true;
        this.fieldTexts = {}; // Reset field texts
        this.attachGlobalListeners();
        console.log('[SessionRecorder] Recording started', {
            mode: this.recordingMode,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Stop recording
     */
    stop() {
        this.isRecording = false;
        this.detachGlobalListeners();
        const summary = this.getSummary();
        console.log('[SessionRecorder] Recording stopped', {
            totalActions: this.actions.length,
            duration: this.actions.length > 0 ? this.actions[this.actions.length - 1].ts : 0,
            summary: summary,
            fieldTexts: this.fieldTexts
        });
        return this.actions;
    }
    
    /**
     * Attach global event listeners for comprehensive recording
     */
    attachGlobalListeners() {
        if (typeof window === 'undefined') return;
        
        // Mouse movement (throttled)
        const mouseMoveHandler = (e) => {
            if (this.config.recordMouseMovements) {
                const now = Date.now();
                if (now - this.lastMouseMoveTime > this.config.mouseMovementThrottle) {
                    this.recordMouseMove(e.clientX, e.clientY);
                    this.lastMouseMoveTime = now;
                }
            }
        };
        
        // Scroll events (throttled)
        const scrollHandler = () => {
            if (this.config.recordScrolls) {
                const now = Date.now();
                if (now - this.lastScrollTime > this.config.scrollThrottle) {
                    this.recordScroll(window.scrollX, window.scrollY);
                    this.lastScrollTime = now;
                }
            }
        };
        
        // Window resize
        const resizeHandler = () => {
            if (this.config.recordResizes) {
                this.recordResize(window.innerWidth, window.innerHeight);
            }
        };
        
        // Click events
        const clickHandler = (e) => {
            this.recordClick(e.clientX, e.clientY, this.getElementSelector(e.target));
        };
        
        // Store bound handlers for cleanup
        this.boundHandlers.set('mousemove', mouseMoveHandler);
        this.boundHandlers.set('scroll', scrollHandler);
        this.boundHandlers.set('resize', resizeHandler);
        this.boundHandlers.set('click', clickHandler);
        
        // Attach listeners
        window.addEventListener('mousemove', mouseMoveHandler, { passive: true });
        window.addEventListener('scroll', scrollHandler, { passive: true });
        window.addEventListener('resize', resizeHandler);
        document.addEventListener('click', clickHandler);
    }
    
    /**
     * Detach global event listeners
     */
    detachGlobalListeners() {
        if (typeof window === 'undefined') return;
        
        this.boundHandlers.forEach((handler, event) => {
            if (event === 'click') {
                document.removeEventListener(event, handler);
            } else {
                window.removeEventListener(event, handler);
            }
        });
        
        this.boundHandlers.clear();
    }
    
    /**
     * Get element selector for identification
     */
    getElementSelector(element) {
        if (!element) return 'unknown';
        
        // Try ID first
        if (element.id) {
            return `#${element.id}`;
        }
        
        // Try class
        if (element.className && typeof element.className === 'string') {
            const classes = element.className.split(' ').filter(c => c).slice(0, 2).join('.');
            if (classes) {
                return `.${classes}`;
            }
        }
        
        // Use tag name
        return element.tagName?.toLowerCase() || 'unknown';
    }
    
    /**
     * Record a keystroke with enhanced metadata
     * 
     * @param {string} key - The key pressed
     * @param {string} target - Element ID or selector
     * @param {boolean} isPassword - Whether this is a password field (skip in production)
     * @param {string} fieldType - Type of field (text, password, email, etc.)
     */
    recordKeystroke(key, target = 'input', isPassword = false, fieldType = 'text') {
        if (!this.isRecording) {
            console.warn('[SessionRecorder] Attempted to record keystroke but not recording');
            return;
        }
        
        // Ensure actions array exists
        if (!this.actions) {
            console.warn('[SessionRecorder] Actions array was undefined, reinitializing');
            this.actions = [];
        }
        
        // In production mode, skip password field keystrokes
        if (this.recordingMode === 'production' && isPassword) {
            console.log('[SessionRecorder] Skipping password keystroke (production mode)');
            return;
        }
        
        // Initialize field text tracking if needed
        if (!this.fieldTexts[target]) {
            this.fieldTexts[target] = '';
        }
        
        // Handle special keys and update field text
        let normalizedKey = key;
        let keyType = 'character';
        let currentFieldText = this.fieldTexts[target] || '';
        
        if (key === 'Backspace' || key === '\b') {
            normalizedKey = '[BACKSPACE]';
            keyType = 'special';
            // Update field text
            this.fieldTexts[target] = currentFieldText.slice(0, -1);
        } else if (key === 'Delete' || key === 'Del') {
            normalizedKey = '[DELETE]';
            keyType = 'special';
            // Delete doesn't change text in this simple implementation
        } else if (key === 'Enter' || key === '\n') {
            normalizedKey = '[ENTER]';
            keyType = 'special';
            this.fieldTexts[target] = currentFieldText + '\n';
        } else if (key === 'Tab') {
            normalizedKey = '[TAB]';
            keyType = 'special';
            this.fieldTexts[target] = currentFieldText + '    ';
        } else if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
            normalizedKey = `[${key.toUpperCase()}]`;
            keyType = 'special';
            // Arrow keys don't change text
        } else if (key && key.length > 1 && !['Shift', 'Control', 'Alt', 'Meta'].includes(key)) {
            // Other special keys
            normalizedKey = `[${key.toUpperCase()}]`;
            keyType = 'special';
        } else if (key && key.length === 1) {
            // Regular character
            this.fieldTexts[target] = currentFieldText + key;
        }
        
        const action = {
            type: 'keystroke',
            ts: Date.now() - this.startTime,
            payload: normalizedKey,
            originalKey: key,
            keyType: keyType,
            target: target,
            fieldType: fieldType,
            isPassword: isPassword,
            fieldText: this.fieldTexts[target] // Store current field text for accurate replay
        };
        
        this.actions.push(action);
        
        console.log('[SessionRecorder] Keystroke recorded', {
            key: key,
            normalizedKey: normalizedKey,
            target: target,
            fieldText: this.fieldTexts[target],
            actionCount: this.actions.length
        });
    }
    
    /**
     * Record a click with enhanced metadata
     */
    recordClick(x, y, target = null, button = 'left') {
        if (!this.isRecording) return;
        
        const action = {
            type: 'click',
            ts: Date.now() - this.startTime,
            x: x,
            y: y,
            target: target,
            button: button,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight
        };
        
        this.actions.push(action);
    }
    
    /**
     * Record mouse movement
     */
    recordMouseMove(x, y) {
        if (!this.isRecording) return;
        
        const action = {
            type: 'mousemove',
            ts: Date.now() - this.startTime,
            x: x,
            y: y
        };
        
        this.actions.push(action);
    }
    
    /**
     * Record scroll event
     */
    recordScroll(scrollX, scrollY) {
        if (!this.isRecording) return;
        
        const action = {
            type: 'scroll',
            ts: Date.now() - this.startTime,
            scrollX: scrollX,
            scrollY: scrollY
        };
        
        this.actions.push(action);
    }
    
    /**
     * Record window resize
     */
    recordResize(width, height) {
        if (!this.isRecording) return;
        
        const action = {
            type: 'resize',
            ts: Date.now() - this.startTime,
            width: width,
            height: height
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
            target: target || url,
            url: url
        };
        
        this.actions.push(action);
    }
    
    /**
     * Record focus event
     */
    recordFocus(target, fieldType = null) {
        if (!this.isRecording) return;
        
        const action = {
            type: 'focus',
            ts: Date.now() - this.startTime,
            target: target,
            fieldType: fieldType
        };
        
        this.actions.push(action);
    }
    
    /**
     * Record blur event
     */
    recordBlur(target) {
        if (!this.isRecording) return;
        
        const action = {
            type: 'blur',
            ts: Date.now() - this.startTime,
            target: target
        };
        
        this.actions.push(action);
    }
    
    /**
     * Record form submit
     */
    recordSubmit(formData = null) {
        if (!this.isRecording) return;
        
        const action = {
            type: 'submit',
            ts: Date.now() - this.startTime,
            formData: formData
        };
        
        this.actions.push(action);
    }
    
    /**
     * Record element visibility change
     */
    recordVisibilityChange(isVisible, element) {
        if (!this.isRecording) return;
        
        const action = {
            type: 'visibility',
            ts: Date.now() - this.startTime,
            isVisible: isVisible,
            target: this.getElementSelector(element)
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
     * Get actions summary
     */
    getSummary() {
        const summary = {
            total: this.actions.length,
            byType: {},
            duration: this.actions.length > 0 
                ? this.actions[this.actions.length - 1].ts 
                : 0
        };
        
        this.actions.forEach(action => {
            summary.byType[action.type] = (summary.byType[action.type] || 0) + 1;
        });
        
        return summary;
    }
    
    /**
     * Clear recorded actions
     */
    clear() {
        this.actions = [];
        this.startTime = null;
        this.fieldTexts = {};
        this.detachGlobalListeners();
        console.log('[SessionRecorder] Actions cleared');
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
    
    /**
     * Update configuration
     */
    configure(config) {
        this.config = { ...this.config, ...config };
    }
}

// Singleton instance
const sessionRecorder = new SessionRecorder();

export default sessionRecorder;
