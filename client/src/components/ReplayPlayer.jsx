import React, { useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Download, RotateCcw, MousePointer, Eye } from 'lucide-react';
import { useReplay } from '../hooks/useReplay';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Enhanced Replay Player Component
 * 
 * Plays back recorded attacker session with:
 * - Realistic form simulation
 * - Timeline slider with frame-by-frame navigation
 * - Play/Pause controls
 * - Step forward/backward
 * - Speed control (0.5x, 1x, 2x, 4x)
 * - Visual simulation of keystrokes, clicks, mouse movements, scrolls
 * - Export replay as JSON
 * - Better visual indicators for all action types
 */
const ReplayPlayer = ({ actions = [], eventId, eventData }) => {
    const {
        frames,
        currentFrame,
        currentTime,
        totalDuration,
        isPlaying,
        playbackSpeed,
        fieldTexts,
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
    } = useReplay(actions);
    
    const formAreaRef = useRef(null);
    const userIdFieldRef = useRef(null);
    const passwordFieldRef = useRef(null);
    const mouseCursorRef = useRef(null);
    
    // Log field texts for debugging
    useEffect(() => {
        console.log('[ReplayPlayer] Field texts updated', {
            fieldTexts,
            userid: fieldTexts.userid,
            password: fieldTexts.password ? '***' : undefined
        });
    }, [fieldTexts]);
    
    // Update mouse cursor position
    useEffect(() => {
        if (mouseCursorRef.current && mousePosition.x !== null && mousePosition.y !== null) {
            mouseCursorRef.current.style.left = `${mousePosition.x}px`;
            mouseCursorRef.current.style.top = `${mousePosition.y}px`;
        }
    }, [mousePosition]);
    
    // Handle export
    const exportReplay = () => {
        const exportData = {
            eventId,
            eventData,
            actions,
            metadata: {
                totalDuration: totalDuration.toFixed(2),
                totalActions: actions.length,
                exportedAt: new Date().toISOString(),
                playbackSpeed,
                summary: {
                    keystrokes: actions.filter(a => a.type === 'keystroke').length,
                    clicks: actions.filter(a => a.type === 'click').length,
                    mouseMovements: actions.filter(a => a.type === 'mousemove').length,
                    scrolls: actions.filter(a => a.type === 'scroll').length,
                    focuses: actions.filter(a => a.type === 'focus').length
                }
            }
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `replay-${eventId || 'session'}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };
    
    const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
    
    // Get action type icon
    const getActionIcon = (type) => {
        switch (type) {
            case 'keystroke': return '⌨️';
            case 'click': return '🖱️';
            case 'mousemove': return '🖐️';
            case 'scroll': return '📜';
            case 'focus': return '👁️';
            case 'blur': return '👁️‍🗨️';
            case 'navigate': return '🧭';
            case 'submit': return '📤';
            case 'resize': return '📐';
            default: return '⚡';
        }
    };
    
    // Get action description
    const getActionDescription = (frame) => {
        switch (frame.type) {
            case 'keystroke':
                return `${frame.payload || 'key'}${frame.target ? ` → ${frame.target}` : ''}`;
            case 'click':
                return `Click (${Math.round(frame.x)}, ${Math.round(frame.y)})${frame.target ? ` on ${frame.target}` : ''}`;
            case 'mousemove':
                return `Move to (${Math.round(frame.x)}, ${Math.round(frame.y)})`;
            case 'scroll':
                return `Scroll to (${Math.round(frame.scrollX || 0)}, ${Math.round(frame.scrollY || 0)})`;
            case 'focus':
                return `Focus: ${frame.target || 'field'}`;
            case 'blur':
                return `Blur: ${frame.target || 'field'}`;
            case 'navigate':
                return `Navigate: ${frame.target || frame.url || 'page'}`;
            case 'submit':
                return 'Form Submit';
            case 'resize':
                return `Resize: ${frame.width}x${frame.height}`;
            default:
                return frame.type;
        }
    };
    
    return (
        <div className="bg-gray-800 dark:bg-gray-800 light:bg-white rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white dark:text-white light:text-gray-900">
                    Session Replay
                </h2>
                <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">
                        {actions.length} actions • {formatTime(totalDuration)}
                    </div>
                    <button
                        onClick={exportReplay}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-2 text-sm transition-colors"
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
                    max={Math.max(0, frames.length - 1)}
                    value={currentFrame}
                    onChange={(e) => seekTo(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 dark:bg-gray-700 light:bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #4b5563 ${progress}%, #4b5563 100%)`
                    }}
                    aria-label="Timeline slider"
                />
                <div className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-1">
                    Frame {currentFrame + 1} of {frames.length} • {progress.toFixed(1)}%
                </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={reset}
                        className="p-2 bg-gray-700 dark:bg-gray-700 light:bg-gray-200 hover:bg-gray-600 dark:hover:bg-gray-600 light:hover:bg-gray-300 text-white dark:text-white light:text-gray-900 rounded transition-colors"
                        aria-label="Reset replay"
                        title="Reset"
                    >
                        <RotateCcw size={20} />
                    </button>
                    <button
                        onClick={stepBackward}
                        disabled={currentFrame === 0}
                        className="p-2 bg-gray-700 dark:bg-gray-700 light:bg-gray-200 hover:bg-gray-600 dark:hover:bg-gray-600 light:hover:bg-gray-300 text-white dark:text-white light:text-gray-900 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Step backward"
                        title="Step Backward"
                    >
                        <SkipBack size={20} />
                    </button>
                    <button
                        onClick={isPlaying ? pause : play}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        aria-label={isPlaying ? "Pause" : "Play"}
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button
                        onClick={stepForward}
                        disabled={currentFrame >= frames.length - 1}
                        className="p-2 bg-gray-700 dark:bg-gray-700 light:bg-gray-200 hover:bg-gray-600 dark:hover:bg-gray-600 light:hover:bg-gray-300 text-white dark:text-white light:text-gray-900 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Step forward"
                        title="Step Forward"
                    >
                        <SkipForward size={20} />
                    </button>
                </div>
                
                {/* Speed Control */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">Speed:</span>
                    {[0.5, 1, 2, 4].map(speed => (
                        <button
                            key={speed}
                            onClick={() => setPlaybackSpeed(speed)}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
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
            
            {/* Enhanced Simulated Form Area */}
            <div 
                ref={formAreaRef}
                className="relative bg-gray-900 dark:bg-gray-900 light:bg-gray-100 rounded-lg p-6 mb-4 border-2 border-dashed border-gray-600 dark:border-gray-600 light:border-gray-400 min-h-[300px]"
            >
                <div className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mb-4 flex items-center justify-between">
                    <span>Simulated Login Form (Replay)</span>
                    {viewportSize.width > 0 && (
                        <span className="text-xs">
                            Viewport: {viewportSize.width}×{viewportSize.height}
                        </span>
                    )}
                </div>
                
                {/* Mouse Cursor Indicator */}
                {mousePosition.x !== null && mousePosition.y !== null && (
                    <motion.div
                        ref={mouseCursorRef}
                        className="absolute pointer-events-none z-20"
                        style={{
                            transform: 'translate(-50%, -50%)'
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <MousePointer size={20} className="text-blue-400 drop-shadow-lg" />
                    </motion.div>
                )}
                
                {/* Click Overlay */}
                <AnimatePresence>
                    {currentAction && currentAction.type === 'click' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold pointer-events-none z-10 shadow-lg"
                            style={{
                                left: `${currentAction.x}px`,
                                top: `${currentAction.y}px`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            CLICK {currentAction.button === 'right' ? '(RIGHT)' : ''}
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Focus Indicator */}
                <AnimatePresence>
                    {currentAction && currentAction.type === 'focus' && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute bg-yellow-500 text-black px-3 py-1 rounded text-xs font-bold pointer-events-none z-10 shadow-lg flex items-center gap-1"
                            style={{
                                left: '20px',
                                top: '60px'
                            }}
                        >
                            <Eye size={12} />
                            FOCUS: {currentAction.target || 'field'}
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Keystroke Indicator */}
                <AnimatePresence>
                    {currentAction && currentAction.type === 'keystroke' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold pointer-events-none z-10 shadow-lg"
                            style={{
                                left: '20px',
                                top: focusedField === 'password' ? '120px' : '90px'
                            }}
                        >
                            ⌨️ {currentAction.payload}
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Submit Indicator */}
                <AnimatePresence>
                    {currentAction && currentAction.type === 'submit' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.9 }}
                            className="absolute bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold pointer-events-none z-10 shadow-xl"
                            style={{
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            ✓ FORM SUBMITTED
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Scroll Indicator */}
                {scrollPosition.y > 0 && (
                    <div className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-1 rounded text-xs">
                        📜 Scroll: {Math.round(scrollPosition.y)}px
                    </div>
                )}
                
                {/* Simulated Form Fields */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">
                            User ID
                        </label>
                        <div 
                            ref={userIdFieldRef}
                            className={`relative p-3 rounded border-2 transition-colors ${
                                focusedField === 'userid' 
                                    ? 'border-yellow-500 bg-yellow-500/10' 
                                    : 'border-gray-700 dark:border-gray-700 light:border-gray-300 bg-gray-800 dark:bg-gray-800 light:bg-white'
                            }`}
                        >
                            <div className="font-mono text-sm text-white dark:text-white light:text-gray-900 min-h-[20px] whitespace-pre-wrap">
                                {fieldTexts.userid || <span className="text-gray-500">Enter user ID...</span>}
                                {isPlaying && focusedField === 'userid' && (
                                    <span className="inline-block w-0.5 h-4 bg-white dark:bg-white light:bg-gray-900 ml-1 animate-pulse" />
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mb-1">
                            Password
                        </label>
                        <div 
                            ref={passwordFieldRef}
                            className={`relative p-3 rounded border-2 transition-colors ${
                                focusedField === 'password' 
                                    ? 'border-yellow-500 bg-yellow-500/10' 
                                    : 'border-gray-700 dark:border-gray-700 light:border-gray-300 bg-gray-800 dark:bg-gray-800 light:bg-white'
                            }`}
                        >
                            <div className="font-mono text-sm text-white dark:text-white light:text-gray-900 min-h-[20px] whitespace-pre-wrap">
                                {fieldTexts.password ? (
                                    <span>{'•'.repeat(fieldTexts.password.length)}</span>
                                ) : (
                                    <span className="text-gray-500">Enter password...</span>
                                )}
                                {isPlaying && focusedField === 'password' && (
                                    <span className="inline-block w-0.5 h-4 bg-white dark:bg-white light:bg-gray-900 ml-1 animate-pulse" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Enhanced Action Timeline List */}
            <div className="bg-gray-900 dark:bg-gray-900 light:bg-gray-100 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-2 flex items-center justify-between">
                    <span>Action Timeline</span>
                    <span className="text-xs">
                        {actions.filter(a => a.type === 'keystroke').length} keystrokes • {' '}
                        {actions.filter(a => a.type === 'click').length} clicks
                    </span>
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
                                <span className="font-mono flex items-center gap-1">
                                    <span>{getActionIcon(frame.type)}</span>
                                    <span>{getActionDescription(frame)}</span>
                                </span>
                                <span className="text-gray-500 text-xs">
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
                        {currentAction.type === 'mousemove' && `Mouse moved to ${currentAction.x}, ${currentAction.y}`}
                        {currentAction.type === 'scroll' && `Scrolled to position ${scrollPosition.x}, ${scrollPosition.y}`}
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
