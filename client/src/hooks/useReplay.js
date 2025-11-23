import { useState, useEffect, useRef } from 'react';

/**
 * Enhanced Hook for session replay playback
 * 
 * Normalizes events into playback frames with improved handling for:
 * - Keystrokes (including special keys like backspace)
 * - Mouse movements and clicks
 * - Scroll events
 * - Focus/blur events
 * - Form submissions
 * - Window resizes
 * 
 * @param {Array} actions - Array of action objects with type, ts, payload, etc.
 * @returns {Object} - Playback state and controls
 */
export const useReplay = (actions = []) => {
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [fieldTexts, setFieldTexts] = useState({}); // Track text per field
    const [currentAction, setCurrentAction] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: null, y: null });
    const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
    const [focusedField, setFocusedField] = useState(null);
    const playbackTimerRef = useRef(null);
    
    // Log actions on mount for debugging
    useEffect(() => {
        console.log('[useReplay] Actions received', {
            count: actions.length,
            actions: actions.slice(0, 10), // Log first 10 actions
            hasMore: actions.length > 10
        });
    }, [actions.length]);
    
    // Normalize actions into frames with better timing
    const frames = actions.map((action, index) => {
        const prevAction = index > 0 ? actions[index - 1] : null;
        const delay = prevAction ? (action.ts - prevAction.ts) / 1000 : 0; // Convert to seconds
        
        return {
            ...action,
            delay: Math.max(0, delay), // Ensure non-negative
            frameIndex: index
        };
    });
    
    const totalDuration = frames.length > 0 
        ? (frames[frames.length - 1].ts - frames[0].ts) / 1000 
        : 0;
    
    const currentTime = frames.length > 0 && frames[currentFrame]
        ? (frames[currentFrame].ts - frames[0].ts) / 1000
        : 0;
    
    // Process a single frame
    const processFrame = (frameIndex) => {
        if (frameIndex < 0 || frameIndex >= frames.length) {
            console.warn('[useReplay] Invalid frame index', frameIndex);
            return;
        }
        
        const frame = frames[frameIndex];
        console.log('[useReplay] Processing frame', {
            index: frameIndex,
            type: frame.type,
            target: frame.target,
            payload: frame.payload
        });
        
        // Process based on action type
        switch (frame.type) {
            case 'keystroke':
                // Use stored fieldText if available (most accurate)
                if (frame.fieldText !== undefined) {
                    setFieldTexts(prev => ({
                        ...prev,
                        [frame.target]: frame.fieldText
                    }));
                    console.log('[useReplay] Using stored fieldText', {
                        target: frame.target,
                        fieldText: frame.fieldText
                    });
                } else {
                    // Fallback: reconstruct from payload
                    setFieldTexts(prev => {
                        const currentText = prev[frame.target] || '';
                        let newText = currentText;
                        
                        if (frame.payload === '[BACKSPACE]' || frame.originalKey === 'Backspace') {
                            newText = currentText.slice(0, -1);
                        } else if (frame.payload === '[DELETE]' || frame.originalKey === 'Delete') {
                            // Delete doesn't affect displayed text in this simple implementation
                            newText = currentText;
                        } else if (frame.payload === '[ENTER]' || frame.originalKey === 'Enter') {
                            newText = currentText + '\n';
                        } else if (frame.payload === '[TAB]' || frame.originalKey === 'Tab') {
                            newText = currentText + '    '; // Tab as 4 spaces
                        } else if (frame.payload && !frame.payload.startsWith('[')) {
                            // Regular character
                            newText = currentText + frame.payload;
                        }
                        
                        console.log('[useReplay] Reconstructed text', {
                            target: frame.target,
                            oldText: currentText,
                            newText: newText,
                            payload: frame.payload
                        });
                        
                        return {
                            ...prev,
                            [frame.target]: newText
                        };
                    });
                }
                
                setCurrentAction({
                    type: 'keystroke',
                    payload: frame.payload,
                    target: frame.target,
                    fieldType: frame.fieldType
                });
                setFocusedField(frame.target);
                // Clear keystroke indicator after a short delay
                setTimeout(() => setCurrentAction(null), 200);
                break;
                
            case 'click':
                setCurrentAction({
                    type: 'click',
                    x: frame.x,
                    y: frame.y,
                    target: frame.target,
                    button: frame.button || 'left'
                });
                // Clear click indicator after animation
                setTimeout(() => setCurrentAction(null), 800);
                break;
                
            case 'mousemove':
                setMousePosition({ x: frame.x, y: frame.y });
                break;
                
            case 'scroll':
                setScrollPosition({ 
                    x: frame.scrollX || 0, 
                    y: frame.scrollY || 0 
                });
                break;
                
            case 'resize':
                setViewportSize({ 
                    width: frame.width || window.innerWidth, 
                    height: frame.height || window.innerHeight 
                });
                break;
                
            case 'focus':
                setFocusedField(frame.target);
                setCurrentAction({
                    type: 'focus',
                    target: frame.target,
                    fieldType: frame.fieldType
                });
                setTimeout(() => setCurrentAction(null), 500);
                break;
                
            case 'blur':
                if (focusedField === frame.target) {
                    setFocusedField(null);
                }
                break;
                
            case 'navigate':
                setCurrentAction({
                    type: 'navigate',
                    target: frame.target,
                    url: frame.url
                });
                setTimeout(() => setCurrentAction(null), 1000);
                break;
                
            case 'submit':
                setCurrentAction({
                    type: 'submit',
                    formData: frame.formData
                });
                // Keep submit indicator visible longer
                setTimeout(() => setCurrentAction(null), 2000);
                break;
                
            default:
                break;
        }
    };
    
    // Playback logic with improved timing
    useEffect(() => {
        if (!isPlaying || currentFrame >= frames.length) {
            if (currentFrame >= frames.length) {
                setIsPlaying(false);
            }
            return;
        }
        
        const frame = frames[currentFrame];
        const delay = Math.max(10, frame.delay * (1 / playbackSpeed) * 1000); // Minimum 10ms delay
        
        playbackTimerRef.current = setTimeout(() => {
            processFrame(currentFrame);
            setCurrentFrame(prev => prev + 1);
        }, delay);
        
        return () => {
            if (playbackTimerRef.current) {
                clearTimeout(playbackTimerRef.current);
            }
        };
    }, [isPlaying, currentFrame, frames, playbackSpeed]);
    
    // Reset state when actions change
    useEffect(() => {
        reset();
    }, [actions.length]); // Only reset when actions array length changes
    
    const play = () => {
        if (currentFrame >= frames.length) {
            reset();
        }
        console.log('[useReplay] Playback started', {
            currentFrame,
            totalFrames: frames.length
        });
        setIsPlaying(true);
    };
    
    const pause = () => {
        console.log('[useReplay] Playback paused', { currentFrame });
        setIsPlaying(false);
    };
    
    const reset = () => {
        console.log('[useReplay] Playback reset');
        setIsPlaying(false);
        setCurrentFrame(0);
        setFieldTexts({});
        setCurrentAction(null);
        setMousePosition({ x: null, y: null });
        setScrollPosition({ x: 0, y: 0 });
        setFocusedField(null);
        if (playbackTimerRef.current) {
            clearTimeout(playbackTimerRef.current);
        }
    };
    
    const stepForward = () => {
        if (currentFrame < frames.length - 1) {
            const nextFrame = currentFrame + 1;
            setCurrentFrame(nextFrame);
            processFrame(nextFrame);
        }
    };
    
    const stepBackward = () => {
        if (currentFrame > 0) {
            const prevFrame = currentFrame - 1;
            setCurrentFrame(prevFrame);
            // Rebuild state up to this point
            rebuildStateToFrame(prevFrame);
        }
    };
    
    const rebuildStateToFrame = (targetFrame) => {
        console.log('[useReplay] Rebuilding state to frame', targetFrame);
        // Reset state
        const fieldTexts = {};
        let lastMousePos = { x: null, y: null };
        let lastScrollPos = { x: 0, y: 0 };
        let lastViewportSize = { width: 0, height: 0 };
        let lastFocusedField = null;
        
        // Rebuild up to target frame
        for (let i = 0; i <= targetFrame && i < frames.length; i++) {
            const frame = frames[i];
            
            switch (frame.type) {
                case 'keystroke':
                    // Use stored fieldText if available (most accurate)
                    if (frame.fieldText !== undefined) {
                        fieldTexts[frame.target] = frame.fieldText;
                    } else {
                        // Fallback: reconstruct from payload
                        const currentText = fieldTexts[frame.target] || '';
                        let newText = currentText;
                        
                        if (frame.payload === '[BACKSPACE]' || frame.originalKey === 'Backspace') {
                            newText = currentText.slice(0, -1);
                        } else if (frame.payload === '[ENTER]' || frame.originalKey === 'Enter') {
                            newText = currentText + '\n';
                        } else if (frame.payload === '[TAB]' || frame.originalKey === 'Tab') {
                            newText = currentText + '    ';
                        } else if (frame.payload && !frame.payload.startsWith('[')) {
                            newText = currentText + frame.payload;
                        }
                        
                        fieldTexts[frame.target] = newText;
                    }
                    lastFocusedField = frame.target;
                    break;
                    
                case 'mousemove':
                    lastMousePos = { x: frame.x, y: frame.y };
                    break;
                    
                case 'scroll':
                    lastScrollPos = { 
                        x: frame.scrollX || 0, 
                        y: frame.scrollY || 0 
                    };
                    break;
                    
                case 'resize':
                    lastViewportSize = { 
                        width: frame.width || window.innerWidth, 
                        height: frame.height || window.innerHeight 
                    };
                    break;
                    
                case 'focus':
                    lastFocusedField = frame.target;
                    break;
                    
                case 'blur':
                    if (lastFocusedField === frame.target) {
                        lastFocusedField = null;
                    }
                    break;
            }
        }
        
        setFieldTexts(fieldTexts);
        setMousePosition(lastMousePos);
        setScrollPosition(lastScrollPos);
        setViewportSize(lastViewportSize);
        setFocusedField(lastFocusedField);
        
        console.log('[useReplay] State rebuilt', {
            fieldTexts,
            targetFrame
        });
        
        // Process the target frame for visual indicators
        if (targetFrame >= 0 && targetFrame < frames.length) {
            processFrame(targetFrame);
        }
    };
    
    const seekTo = (frameIndex) => {
        const clampedIndex = Math.max(0, Math.min(frameIndex, frames.length - 1));
        setCurrentFrame(clampedIndex);
        rebuildStateToFrame(clampedIndex);
    };
    
    return {
        frames,
        currentFrame,
        currentTime,
        totalDuration,
        isPlaying,
        playbackSpeed,
        fieldTexts, // Return fieldTexts instead of displayedText
        currentAction,
        mousePosition,
        scrollPosition,
        viewportSize,
        focusedField,
        play,
        pause,
        reset,
        stepForward,
        stepBackward,
        seekTo,
        setPlaybackSpeed
    };
};
