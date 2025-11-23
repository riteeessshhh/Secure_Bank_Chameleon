import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, Clock, Database, Users, Activity, Loader2, TrendingUp, DollarSign, CreditCard, LogOut, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const FakeDashboard = () => {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9).toUpperCase());

    useEffect(() => {
        // Simulate initial loading
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 dark:bg-gray-900 light:bg-gray-50 text-gray-100 dark:text-gray-100 light:text-gray-900 p-4 sm:p-6 font-sans">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8 border-b border-gray-700 dark:border-gray-700 light:border-gray-300 pb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-green-500 dark:text-green-500 light:text-green-600 flex items-center gap-2">
                    <Shield className="w-6 h-6 sm:w-8 sm:h-8" /> SecureBank Admin Portal
                </h1>
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">
                        <p>Session ID: SB-{sessionId}</p>
                        <p className="text-xs mt-1">Last sync: {new Date().toLocaleTimeString()}</p>
                    </div>
                    <div className="flex gap-2 ml-auto sm:ml-0">
                        <button
                            onClick={toggleTheme}
                            className="bg-gray-700 dark:bg-gray-700 light:bg-gray-200 hover:bg-gray-600 dark:hover:bg-gray-600 light:hover:bg-gray-300 text-white dark:text-white light:text-gray-900 px-3 py-2 rounded flex items-center gap-2 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <button onClick={() => navigate('/')} className="bg-red-600 dark:bg-red-600 light:bg-red-500 hover:bg-red-700 dark:hover:bg-red-700 light:hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded flex items-center gap-2 text-sm">
                            <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {isLoading ? (
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Loading dashboard data...</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Total Accounts</p>
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                        <p className="text-2xl font-bold text-white">Syncing...</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Last updated: --:--</p>
                                </div>
                                <Users className="w-12 h-12 text-blue-500 opacity-50" />
                            </div>
                        </div>

                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-green-500 transition-colors">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Pending Transactions</p>
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                                        <p className="text-2xl font-bold text-white">Loading...</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Processing queue...</p>
                                </div>
                                <Activity className="w-12 h-12 text-green-500 opacity-50" />
                            </div>
                        </div>

                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-yellow-500 transition-colors">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">System Status</p>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
                                        <p className="text-2xl font-bold text-white">Syncing...</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Database sync in progress</p>
                                </div>
                                <Database className="w-12 h-12 text-yellow-500 opacity-50" />
                            </div>
                        </div>

                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Account Balance</p>
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                                        <p className="text-2xl font-bold text-white">--</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Retrieving data...</p>
                                </div>
                                <DollarSign className="w-12 h-12 text-purple-500 opacity-50" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Clock className="w-6 h-6 text-blue-500" /> Recent Activity
                            </h2>
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-900 rounded">
                                        <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
                                            <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 text-center text-gray-500 text-sm">
                                <Loader2 className="w-4 h-4 inline-block animate-spin mr-2" />
                                Loading transaction history...
                            </div>
                        </div>

                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-green-500" /> Financial Overview
                            </h2>
                            <div className="space-y-4">
                                <div className="bg-gray-900 p-4 rounded">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-400 text-sm">Total Assets</span>
                                        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                                    </div>
                                    <div className="h-8 bg-gray-700 rounded w-full animate-pulse"></div>
                                </div>
                                <div className="bg-gray-900 p-4 rounded">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-400 text-sm">Pending Deposits</span>
                                        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                                    </div>
                                    <div className="h-8 bg-gray-700 rounded w-full animate-pulse"></div>
                                </div>
                                <div className="bg-gray-900 p-4 rounded">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-400 text-sm">Active Loans</span>
                                        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                                    </div>
                                    <div className="h-8 bg-gray-700 rounded w-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <CreditCard className="w-6 h-6 text-purple-500" /> Account Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-gray-900 p-4 rounded">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-gray-400 text-sm">Account #{i}</span>
                                        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
                                        <div className="h-4 bg-gray-700 rounded w-2/3 animate-pulse"></div>
                                        <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <div className="bg-yellow-900 border border-yellow-700 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1 animate-pulse" />
                <div>
                    <h3 className="font-bold text-yellow-200 flex items-center gap-2">
                        System Maintenance
                        <Loader2 className="w-4 h-4 animate-spin" />
                    </h3>
                    <p className="text-yellow-300 text-sm mt-1">
                        Database synchronization in progress. Some features may be temporarily unavailable.
                        Estimated completion: 15-20 minutes.
                    </p>
                    <p className="text-yellow-400 text-xs mt-2">
                        Status: Synchronizing with backup servers... <span className="inline-block animate-pulse">●</span>
                    </p>
                </div>
            </div>

            <div className="mt-8 text-center text-gray-500 text-xs">
                <p>This session is being monitored for security purposes.</p>
                <p className="mt-1">SecureBank Internal Systems v2.4.1</p>
            </div>
        </div>
    );
};

export default FakeDashboard;
