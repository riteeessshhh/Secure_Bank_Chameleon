import React, { useState, useEffect } from 'react';
import { Brain, RefreshCw, Copy, Check, AlertTriangle, Shield, FileText, Loader2 } from 'lucide-react';
import axios from 'axios';

/**
 * AI Explain Panel Component
 * 
 * Displays AI-generated explanation for attack events with:
 * - Summary paragraph
 * - Severity badge
 * - Recommended actions
 * - Regenerate button
 * - Copy to clipboard
 * - Add to report
 */
const AiExplainPanel = ({ eventId, eventData, onAddToReport }) => {
    const [explanation, setExplanation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(null);

    const fetchExplanation = async () => {
        if (!eventId && !eventData) return;
        
        setLoading(true);
        setError(null);
        
        try {
            let response;
            
            if (eventId) {
                // Use GET endpoint for event ID
                response = await axios.get(`http://localhost:5000/api/ai/explain/${eventId}`);
            } else {
                // Use POST endpoint for direct event data
                response = await axios.post('http://localhost:5000/api/ai/explain', {
                    event: eventData
                });
            }
            
            if (response.data.success && response.data.explanation) {
                setExplanation(response.data.explanation);
            } else {
                setError('Failed to generate explanation');
            }
        } catch (err) {
            console.error('Error fetching AI explanation:', err);
            setError(err.response?.data?.detail || 'Failed to load explanation');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (eventId || eventData) {
            fetchExplanation();
        }
    }, [eventId, eventData]);

    const copyToClipboard = async () => {
        if (!explanation) return;
        
        const text = `AI Forensic Analysis

Summary: ${explanation.summary}

Attack Type: ${explanation.type}
Intent: ${explanation.intent}
Severity: ${explanation.severity}/10
Confidence: ${(explanation.confidence * 100).toFixed(0)}%

Recommended Actions:
${explanation.recommendedActions.map((action, i) => `${i + 1}. ${action}`).join('\n')}`;
        
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const getSeverityColor = (severity) => {
        if (severity >= 8) return 'bg-red-600 text-white';
        if (severity >= 5) return 'bg-yellow-600 text-white';
        return 'bg-green-600 text-white';
    };

    const getSeverityLabel = (severity) => {
        if (severity >= 8) return 'Critical';
        if (severity >= 5) return 'Medium';
        return 'Low';
    };

    if (loading && !explanation) {
        return (
            <div className="bg-gray-800 dark:bg-gray-800 light:bg-white rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300 p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mr-3" />
                    <span className="text-gray-400 dark:text-gray-400 light:text-gray-600">Generating AI explanation...</span>
                </div>
            </div>
        );
    }

    if (error && !explanation) {
        return (
            <div className="bg-gray-800 dark:bg-gray-800 light:bg-white rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300 p-6">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                    <AlertTriangle size={20} />
                    <span className="font-semibold">Error</span>
                </div>
                <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm mb-4">{error}</p>
                <button
                    onClick={fetchExplanation}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!explanation) {
        return null;
    }

    return (
        <div className="bg-gray-800 dark:bg-gray-800 light:bg-white rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-bold text-white dark:text-white light:text-gray-900">
                        AI Forensic Analysis
                    </h3>
                    {explanation.source === 'fallback-rules' && (
                        <span className="text-xs bg-gray-700 dark:bg-gray-700 light:bg-gray-200 text-gray-400 dark:text-gray-400 light:text-gray-600 px-2 py-1 rounded">
                            Offline Mode
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchExplanation}
                        disabled={loading}
                        className="p-2 bg-gray-700 dark:bg-gray-700 light:bg-gray-200 hover:bg-gray-600 dark:hover:bg-gray-600 light:hover:bg-gray-300 text-white dark:text-white light:text-gray-900 rounded transition-colors disabled:opacity-50"
                        title="Regenerate explanation"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={copyToClipboard}
                        className="p-2 bg-gray-700 dark:bg-gray-700 light:bg-gray-200 hover:bg-gray-600 dark:hover:bg-gray-600 light:hover:bg-gray-300 text-white dark:text-white light:text-gray-900 rounded transition-colors"
                        title="Copy to clipboard"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    {onAddToReport && (
                        <button
                            onClick={() => onAddToReport(explanation)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            title="Add to report"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Summary */}
            <div className="mb-4">
                <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 leading-relaxed">
                    {explanation.summary}
                </p>
            </div>

            {/* Attack Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">Attack Type</div>
                    <div className="text-sm font-semibold text-white dark:text-white light:text-gray-900">
                        {explanation.type}
                    </div>
                </div>
                <div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mb-1">Intent</div>
                    <div className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700">
                        {explanation.intent}
                    </div>
                </div>
            </div>

            {/* Severity Badge */}
            <div className="mb-4">
                <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">Severity</div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getSeverityColor(explanation.severity)}`}>
                        {getSeverityLabel(explanation.severity)} ({explanation.severity}/10)
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">
                        Confidence: {(explanation.confidence * 100).toFixed(0)}%
                    </div>
                </div>
            </div>

            {/* Recommended Actions */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <h4 className="text-sm font-semibold text-white dark:text-white light:text-gray-900">
                        Recommended Actions
                    </h4>
                </div>
                <ul className="space-y-2">
                    {explanation.recommendedActions.map((action, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-300 dark:text-gray-300 light:text-gray-700">
                            <span className="text-blue-400 mt-1">•</span>
                            <span>{action}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-gray-700 dark:border-gray-700 light:border-gray-300">
                <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">
                    {explanation.source === 'fallback-rules' 
                        ? 'Analysis generated using heuristic rules (offline mode). Enable LLM API for enhanced analysis.'
                        : 'Analysis generated by AI assistant.'}
                </p>
            </div>
        </div>
    );
};

export default AiExplainPanel;

