import React, { useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Download, RotateCcw } from 'lucide-react';
import { useReplay } from '../hooks/useReplay';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Replay Player Component
 * 
 * Plays back recorded attacker session with:
 * - Timeline slider
 * - Play/Pause controls
 * - Step forward/backward
 * - Speed control (0.5x, 1x, 2x)
 * - Visual simulation of keystrokes, clicks, navigation
 * - Export replay as JSON
 */
const ReplayPlayer = ({ actions = [], eventId, eventData }) => {
    const {
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
    } = useReplay(actions);
    
    const textareaRef = useRef(null);
    const clickOverlayRef = useRef(null);
    
    // Auto-scroll textarea as text is typed
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
    }, [displayedText]);
    
    // Handle export
    const exportReplay = () => {
        const exportData = {
            eventId,
            eventData,
            actions,
            metadata: {
                totalDuration,
                totalActions: actions.length,
                exportedAt: new Date().toISOString()
            }
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `replay-${eventId}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
    
    return (
        <div className="bg-gray-800 dark:bg-gray-800 light:bg-white rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white dark:text-white light:text-gray-900">
                    Session Replay
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={exportReplay}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-2 text-sm"
                        aria-label="Export replay as JSON"
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>
            
            {/* Timeline Slider */}
            <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(totalDuration)}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max={frames.length - 1}
                    value={currentFrame}
                    onChange={(e) => seekTo(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 dark:bg-gray-700 light:bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #4b5563 ${progress}%, #4b5563 100%)`
                    }}
                    aria-label="Timeline slider"
                />
                <div className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-1">
                    Frame {currentFrame + 1} of {frames.length}
                </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <button
                        onClick={reset}
                        className="p-2 bg-gray-700 dark:bg-gray-700 light:bg-gray-200 hover:bg-gray-600 dark:hover:bg-gray-600 light:hover:bg-gray-300 text-white dark:text-white light:text-gray-900 rounded"
                        aria-label="Reset replay"
                    >
                        <RotateCcw size={20} />
                    </button>
                    <button
                        onClick={stepBackward}
                        disabled={currentFrame === 0}
                        className="p-2 bg-gray-700 dark:bg-gray-700 light:bg-gray-200 hover:bg-gray-600 dark:hover:bg-gray-600 light:hover:bg-gray-300 text-white dark:text-white light:text-gray-900 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Step backward"
                    >
                        <SkipBack size={20} />
                    </button>
                    <button
                        onClick={isPlaying ? pause : play}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                        aria-label={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button
                        onClick={stepForward}
                        disabled={currentFrame >= frames.length - 1}
                        className="p-2 bg-gray-700 dark:bg-gray-700 light:bg-gray-200 hover:bg-gray-600 dark:hover:bg-gray-600 light:hover:bg-gray-300 text-white dark:text-white light:text-gray-900 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Step forward"
                    >
                        <SkipForward size={20} />
                    </button>
                </div>
                
                {/* Speed Control */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">Speed:</span>
                    {[0.5, 1, 2].map(speed => (
                        <button
                            key={speed}
                            onClick={() => setPlaybackSpeed(speed)}
                            className={`px-3 py-1 rounded text-sm ${
                                playbackSpeed === speed
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 dark:bg-gray-700 light:bg-gray-200 text-gray-300 dark:text-gray-300 light:text-gray-700 hover:bg-gray-600'
                            }`}
                            aria-label={`Playback speed ${speed}x`}
                        >
                            {speed}x
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Simulated Form Area */}
            <div className="relative bg-gray-900 dark:bg-gray-900 light:bg-gray-100 rounded-lg p-4 mb-4 border-2 border-dashed border-gray-600 dark:border-gray-600 light:border-gray-400">
                <div className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mb-2">
                    Simulated Login Form (Replay)
                </div>
                
                {/* Click Overlay */}
                <AnimatePresence>
                    {currentAction && currentAction.type === 'click' && (
                        <motion.div
                            ref={clickOverlayRef}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold pointer-events-none z-10"
                            style={{
                                left: `${currentAction.x}px`,
                                top: `${currentAction.y}px`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            CLICK
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Focus Indicator */}
                <AnimatePresence>
                    {currentAction && currentAction.type === 'focus' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold pointer-events-none z-10"
                            style={{
                                left: '20px',
                                top: '60px'
                            }}
                        >
                            FOCUS
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Submit Indicator */}
                <AnimatePresence>
                    {currentAction && currentAction.type === 'submit' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute bg-green-500 text-white px-3 py-2 rounded text-sm font-bold pointer-events-none z-10"
                            style={{
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            SUBMIT
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <textarea
                    ref={textareaRef}
                    readOnly
                    value={displayedText}
                    className="w-full h-32 bg-gray-800 dark:bg-gray-800 light:bg-white text-white dark:text-white light:text-gray-900 p-3 rounded border border-gray-700 dark:border-gray-700 light:border-gray-300 font-mono text-sm resize-none"
                    placeholder="Keystrokes will appear here during replay..."
                    aria-label="Simulated form input showing replayed keystrokes"
                />
                
                {/* Cursor Blink Effect */}
                {isPlaying && (
                    <span className="inline-block w-0.5 h-4 bg-white dark:bg-white light:bg-gray-900 ml-1 animate-pulse" />
                )}
            </div>
            
            {/* Action Timeline List */}
            <div className="bg-gray-900 dark:bg-gray-900 light:bg-gray-100 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-2">
                    Action Timeline
                </div>
                <div className="space-y-1">
                    {frames.map((frame, index) => (
                        <div
                            key={index}
                            onClick={() => seekTo(index)}
                            className={`p-2 rounded text-xs cursor-pointer transition-colors ${
                                index === currentFrame
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 dark:bg-gray-800 light:bg-gray-200 text-gray-300 dark:text-gray-300 light:text-gray-700 hover:bg-gray-700'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-mono">
                                    {frame.type === 'keystroke' && `⌨️ ${frame.payload || 'key'}`}
                                    {frame.type === 'click' && `🖱️ Click (${Math.round(frame.x)}, ${Math.round(frame.y)})`}
                                    {frame.type === 'navigate' && `🧭 Navigate: ${frame.target || 'page'}`}
                                    {frame.type === 'focus' && `👁️ Focus: ${frame.target || 'field'}`}
                                    {frame.type === 'submit' && `📤 Submit`}
                                </span>
                                <span className="text-gray-500">
                                    +{frame.delay.toFixed(2)}s
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Accessibility: Screen reader announcements */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
                {currentAction && (
                    <span>
                        {currentAction.type === 'keystroke' && `Typed: ${currentAction.payload}`}
                        {currentAction.type === 'click' && `Clicked at position ${currentAction.x}, ${currentAction.y}`}
                        {currentAction.type === 'navigate' && `Navigated to ${currentAction.target}`}
                        {currentAction.type === 'focus' && `Focused on ${currentAction.target}`}
                        {currentAction.type === 'submit' && `Form submitted`}
                    </span>
                )}
            </div>
        </div>
    );
};

export default ReplayPlayer;



