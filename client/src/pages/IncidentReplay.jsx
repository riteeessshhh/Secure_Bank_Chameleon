import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Clock, MapPin } from 'lucide-react';
import axios from 'axios';
import ReplayPlayer from '../components/ReplayPlayer';
import AiExplainPanel from '../components/AiExplainPanel';
import { useTheme } from '../contexts/ThemeContext';
import { API_URL } from '../config/api';

/**
 * Incident Replay Page
 * 
 * Loads an event by ID and displays the ReplayPlayer with event details.
 */
const IncidentReplay = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [event, setEvent] = useState(null);
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Get event from logs endpoint (most reliable)
                const logsResponse = await axios.get(`${API_URL}/api/logs`);
                const event = logsResponse.data.logs.find(log => log.id === parseInt(eventId));
                
                if (event) {
                    // Try to get actions (optional - most events won't have them)
                    let actions = [];
                    try {
                        // Try the events endpoint first
                        const eventsResponse = await axios.get(`${API_URL}/api/events/${eventId}`);
                        if (eventsResponse.data && eventsResponse.data.actions) {
                            actions = eventsResponse.data.actions;
                        }
                    } catch (eventsErr) {
                        // If that fails, try actions endpoint
                        try {
                            const actionsResponse = await axios.get(`${API_URL}/api/events/${eventId}/actions`);
                            if (actionsResponse.data && actionsResponse.data.actions) {
                                actions = actionsResponse.data.actions;
                            }
                        } catch (actionsErr) {
                            // No actions available - this is normal for events logged before session recording was enabled
                            console.log('No actions available for this event (normal for older events)');
                        }
                    }
                    
                    setEvent(event);
                    setActions(actions);
                    setLoading(false);
                    return;
                }
                
                // Last resort: Try demo data
                try {
                    const demoResponse = await fetch('/demo_replays.json');
                    const demoData = await demoResponse.json();
                    const demoEvent = demoData.find(e => e.id === parseInt(eventId));
                    if (demoEvent) {
                        setEvent(demoEvent);
                        setActions(demoEvent.actions || []);
                        setError(null);
                        setLoading(false);
                        return;
                    }
                } catch (demoErr) {
                    console.error('Error loading demo data:', demoErr);
                }
                
                // If we get here, event not found
                setError('Event not found. It may not exist or demo mode may be required.');
            } catch (err) {
                console.error('Error fetching event:', err);
                setError('Failed to load event. Please check the console for details.');
            } finally {
                setLoading(false);
            }
        };
        
        if (eventId) {
            fetchEvent();
        }
    }, [eventId]);
    
    if (loading) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-6 flex items-center justify-center`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className={`text-gray-400 ${theme === 'dark' ? '' : 'text-gray-600'}`}>Loading replay...</p>
                </div>
            </div>
        );
    }
    
    if (error && !event) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                        <ArrowLeft size={20} />
                        Back to Dashboard
                    </button>
                    <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-200">{error}</p>
                    </div>
                </div>
            </div>
        );
    }
    
    if (!event) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                        <ArrowLeft size={20} />
                        Back to Dashboard
                    </button>
                    <div className="bg-gray-800 dark:bg-gray-800 light:bg-white rounded-lg p-6 text-center">
                        <p className={`text-gray-400 ${theme === 'dark' ? '' : 'text-gray-600'}`}>Event not found</p>
                    </div>
                </div>
            </div>
        );
    }
    
    const getAttackTypeColor = (type) => {
        switch (type) {
            case 'SQLi': return 'bg-red-600';
            case 'XSS': return 'bg-yellow-600';
            default: return 'bg-green-600';
        }
    };
    
    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-4 sm:p-6`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400 light:text-blue-600 hover:text-blue-700 dark:hover:text-blue-500 light:hover:text-blue-700"
                    >
                        <ArrowLeft size={20} />
                        Back to Dashboard
                    </button>
                    
                    <div className={`bg-gray-800 dark:bg-gray-800 light:bg-white rounded-lg p-6 border border-gray-700 dark:border-gray-700 light:border-gray-300`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <div>
                                <h1 className={`text-2xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                                    Incident Replay #{event.id}
                                </h1>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${getAttackTypeColor(event.attack_type)}`}>
                                        {event.attack_type}
                                    </span>
                                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Confidence: {(event.confidence * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Event Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2">
                                <MapPin className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                                <div>
                                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>IP Address</div>
                                    <div className={`font-mono text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {event.ip_address}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Clock className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                                <div>
                                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Timestamp</div>
                                    <div className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} title={event.timestamp}>
                                        {new Date(event.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <AlertTriangle className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                                <div>
                                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Strategy</div>
                                    <div className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {event.deception_strategy}
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Actions Recorded</div>
                                <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {actions.length} actions
                                </div>
                            </div>
                        </div>
                        
                        {/* Payload Preview */}
                        <div className="mt-4 pt-4 border-t border-gray-700 dark:border-gray-700 light:border-gray-300">
                            <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} mb-2`}>Payload</div>
                            <div className={`bg-gray-900 dark:bg-gray-900 light:bg-gray-100 p-3 rounded font-mono text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'} break-all`}>
                                {event.input_payload}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* AI Explanation Panel */}
                <div className="mb-6">
                    <AiExplainPanel 
                        eventId={event.id}
                        eventData={event}
                        onAddToReport={(explanation) => {
                            // Store explanation for PDF report
                            console.log('Adding explanation to report:', explanation);
                            // This would integrate with PDF generation
                        }}
                    />
                </div>

                {/* Replay Player */}
                {actions.length > 0 ? (
                    <ReplayPlayer 
                        actions={actions} 
                        eventId={event.id}
                        eventData={event}
                    />
                ) : (
                    <div className={`bg-gray-800 dark:bg-gray-800 light:bg-white rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300 p-6`}>
                        <div className="text-center py-8">
                            <p className={`text-gray-400 dark:text-gray-400 light:text-gray-600 mb-4`}>
                                No session replay available for this event.
                            </p>
                            <p className={`text-sm text-gray-500 dark:text-gray-500 light:text-gray-600`}>
                                Session recording was not enabled when this event was logged, or actions were not captured.
                            </p>
                            <p className={`text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-4`}>
                                To view replays, ensure DEMO_MODE is enabled in Trap.jsx and record a new session.
                            </p>
                            <div className="mt-6">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                                >
                                    Record New Session
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IncidentReplay;

