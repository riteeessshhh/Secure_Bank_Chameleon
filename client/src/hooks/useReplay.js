import { useState, useEffect } from 'react';

/**
 * Hook to normalize events into playback frames for session replay.
 * 
 * @param {Array} actions - Array of action objects with type, ts, payload, etc.
 * @returns {Object} - Playback state and controls
 */
export const useReplay = (actions = []) => {
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [displayedText, setDisplayedText] = useState('');
    const [currentAction, setCurrentAction] = useState(null);
    
    // Normalize actions into frames
    const frames = actions.map((action, index) => {
        const prevAction = index > 0 ? actions[index - 1] : null;
        const delay = prevAction ? (action.ts - prevAction.ts) / 1000 : 0; // Convert to seconds
        
        return {
            ...action,
            delay,
            frameIndex: index
        };
    });
    
    const totalDuration = frames.length > 0 
        ? (frames[frames.length - 1].ts - frames[0].ts) / 1000 
        : 0;
    
    const currentTime = frames.length > 0 && frames[currentFrame]
        ? (frames[currentFrame].ts - frames[0].ts) / 1000
        : 0;
    
    // Playback logic
    useEffect(() => {
        if (!isPlaying || currentFrame >= frames.length) {
            setIsPlaying(false);
            return;
        }
        
        const frame = frames[currentFrame];
        const delay = frame.delay * (1 / playbackSpeed) * 1000; // Adjust for speed
        
        const timer = setTimeout(() => {
            // Process current action
            if (frame.type === 'keystroke' && frame.payload) {
                setDisplayedText(prev => prev + frame.payload);
            } else if (frame.type === 'click') {
                setCurrentAction({
                    type: 'click',
                    x: frame.x,
                    y: frame.y,
                    target: frame.target
                });
                // Clear click highlight after animation
                setTimeout(() => setCurrentAction(null), 500);
            } else if (frame.type === 'navigate') {
                setCurrentAction({
                    type: 'navigate',
                    target: frame.target
                });
            } else if (frame.type === 'focus') {
                setCurrentAction({
                    type: 'focus',
                    target: frame.target
                });
            } else if (frame.type === 'submit') {
                setCurrentAction({
                    type: 'submit'
                });
            }
            
            setCurrentFrame(prev => prev + 1);
        }, delay);
        
        return () => clearTimeout(timer);
    }, [isPlaying, currentFrame, frames, playbackSpeed]);
    
    const play = () => {
        if (currentFrame >= frames.length) {
            setCurrentFrame(0);
            setDisplayedText('');
        }
        setIsPlaying(true);
    };
    
    const pause = () => {
        setIsPlaying(false);
    };
    
    const reset = () => {
        setIsPlaying(false);
        setCurrentFrame(0);
        setDisplayedText('');
        setCurrentAction(null);
    };
    
    const stepForward = () => {
        if (currentFrame < frames.length - 1) {
            setCurrentFrame(prev => prev + 1);
            // Process frame immediately
            const frame = frames[currentFrame + 1];
            if (frame.type === 'keystroke' && frame.payload) {
                setDisplayedText(prev => prev + frame.payload);
            }
        }
    };
    
    const stepBackward = () => {
        if (currentFrame > 0) {
            const newFrame = currentFrame - 1;
            setCurrentFrame(newFrame);
            // Rebuild displayed text up to this point
            let text = '';
            for (let i = 0; i <= newFrame; i++) {
                if (frames[i].type === 'keystroke' && frames[i].payload) {
                    text += frames[i].payload;
                }
            }
            setDisplayedText(text);
        }
    };
    
    const seekTo = (frameIndex) => {
        const clampedIndex = Math.max(0, Math.min(frameIndex, frames.length - 1));
        setCurrentFrame(clampedIndex);
        // Rebuild displayed text up to this point
        let text = '';
        for (let i = 0; i <= clampedIndex; i++) {
            if (frames[i].type === 'keystroke' && frames[i].payload) {
                text += frames[i].payload;
            }
        }
        setDisplayedText(text);
    };
    
    return {
        frames,
        currentFrame,
        currentTime,
        totalDuration,
        isPlaying,
        playbackSpeed,
        displayedText,
        currentAction,
        play,
        pause,
        reset,
        stepForward,
        stepBackward,
        seekTo,
        setPlaybackSpeed
    };
};

