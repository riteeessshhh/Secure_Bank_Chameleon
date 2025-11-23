import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const LoadingPage = () => {
    const { theme, toggleTheme } = useTheme();
    const [stage, setStage] = useState('authenticating'); // authenticating -> success -> redirecting
    const navigate = useNavigate();

    useEffect(() => {
        // Stage 1: Show authenticating for 3-4 seconds
        const authTimer = setTimeout(() => {
            setStage('success');
        }, 3500);

        // Stage 2: Show success message for 2 seconds
        const successTimer = setTimeout(() => {
            setStage('redirecting');
        }, 5500);

        // Stage 3: Redirect to fake dashboard after showing redirecting message
        const redirectTimer = setTimeout(() => {
            navigate('/fake-dashboard');
        }, 7000);

        return () => {
            clearTimeout(authTimer);
            clearTimeout(successTimer);
            clearTimeout(redirectTimer);
        };
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 dark:from-blue-900 dark:via-blue-800 dark:to-blue-900 light:from-blue-100 light:via-blue-50 light:to-blue-100 flex flex-col items-center justify-center font-sans px-4">
            <div className="absolute top-4 right-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-white/20 dark:bg-white/20 light:bg-blue-900/20 hover:bg-white/30 dark:hover:bg-white/30 light:hover:bg-blue-900/30 text-white transition-colors"
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
            <div className="bg-white dark:bg-gray-800 light:bg-white rounded-2xl shadow-2xl p-8 sm:p-12 max-w-md w-full mx-4">
                <div className="text-center">
                    {stage === 'authenticating' && (
                        <>
                            <Loader2 className="w-20 h-20 text-blue-600 animate-spin mx-auto mb-6" />
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                                Authenticating...
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Please wait while we verify your credentials
                            </p>
                            <div className="mt-8 flex gap-2 justify-center">
                                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <div className="mt-8 space-y-2">
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                                </div>
                                <p className="text-xs text-gray-500">Verifying security credentials...</p>
                            </div>
                        </>
                    )}

                    {stage === 'success' && (
                        <>
                            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6 animate-scale-in" />
                            <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-3 animate-fade-in">
                                Authentication Successful!
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Your credentials have been verified
                            </p>
                            <div className="flex items-center justify-center gap-2 text-green-600">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="text-sm font-medium">Secure connection established</span>
                            </div>
                        </>
                    )}

                    {stage === 'redirecting' && (
                        <>
                            <Loader2 className="w-20 h-20 text-blue-600 animate-spin mx-auto mb-6" />
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                                Redirecting...
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Loading your dashboard
                            </p>
                            <div className="mt-8 flex gap-2 justify-center">
                                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="mt-8 text-center text-blue-200 text-sm">
                <p>SecureBank - Secure Authentication Portal</p>
            </div>
        </div>
    );
};

export default LoadingPage;
