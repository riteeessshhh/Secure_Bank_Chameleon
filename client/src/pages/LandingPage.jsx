import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Lock, CreditCard, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 light:bg-white">
            {/* Header */}
            <header className="w-full bg-white dark:bg-gray-900 light:bg-white border-b border-gray-200 dark:border-gray-800 light:border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 sm:h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded flex items-center justify-center">
                                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 light:text-gray-800">
                                Secure Bank
                            </span>
                        </div>

                        {/* Navigation */}
                        <div className="hidden md:flex items-center gap-6 lg:gap-8">
                            <a href="#" className="text-gray-700 dark:text-gray-300 light:text-gray-700 hover:text-blue-600 dark:hover:text-blue-400 light:hover:text-blue-600 transition-colors text-sm lg:text-base">
                                Personal
                            </a>
                            <a href="#" className="text-gray-700 dark:text-gray-300 light:text-gray-700 hover:text-blue-600 dark:hover:text-blue-400 light:hover:text-blue-600 transition-colors text-sm lg:text-base">
                                Business
                            </a>
                            <a href="#" className="text-gray-700 dark:text-gray-300 light:text-gray-700 hover:text-blue-600 dark:hover:text-blue-400 light:hover:text-blue-600 transition-colors text-sm lg:text-base">
                                About
                            </a>
                            <a href="#" className="text-gray-700 dark:text-gray-300 light:text-gray-700 hover:text-blue-600 dark:hover:text-blue-400 light:hover:text-blue-600 transition-colors text-sm lg:text-base">
                                Contact
                            </a>
                        </div>

                        {/* Right side buttons */}
                        <div className="flex items-center gap-3 sm:gap-4">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 light:hover:bg-gray-100 transition-colors"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? (
                                    <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                ) : (
                                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                )}
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 light:bg-blue-600 light:hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-md font-medium text-sm sm:text-base transition-colors"
                            >
                                Login
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-800 dark:text-gray-100 light:text-gray-800 mb-4 sm:mb-6">
                        Banking made{' '}
                        <span className="text-blue-600 dark:text-blue-400 light:text-blue-600">
                            simple and secure
                        </span>
                    </h1>
                    <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-400 light:text-gray-600 max-w-3xl mx-auto mb-8 sm:mb-12 px-4">
                        Experience modern banking with no hidden fees, instant transfers, and world-class security. Your financial future starts here.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 light:bg-blue-600 light:hover:bg-blue-700 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-md font-semibold text-base sm:text-lg transition-colors shadow-lg hover:shadow-xl"
                        >
                            Open Account
                        </button>
                        <button className="w-full sm:w-auto bg-white dark:bg-gray-800 light:bg-white border-2 border-gray-300 dark:border-gray-700 light:border-gray-300 text-gray-800 dark:text-gray-200 light:text-gray-800 px-8 sm:px-10 py-3 sm:py-4 rounded-md font-semibold text-base sm:text-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 light:hover:bg-gray-50">
                            Learn More
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Stats */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 border-t border-gray-200 dark:border-gray-800 light:border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 lg:gap-16 text-center">
                    <div>
                        <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-blue-600 dark:text-blue-400 light:text-blue-600 mb-2">
                            $0
                        </div>
                        <div className="text-base sm:text-lg text-gray-600 dark:text-gray-400 light:text-gray-600">
                            Monthly Fees
                        </div>
                    </div>
                    <div>
                        <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-blue-600 dark:text-blue-400 light:text-blue-600 mb-2">
                            24/7
                        </div>
                        <div className="text-base sm:text-lg text-gray-600 dark:text-gray-400 light:text-gray-600">
                            Customer Support
                        </div>
                    </div>
                    <div>
                        <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-blue-600 dark:text-blue-400 light:text-blue-600 mb-2">
                            256-bit
                        </div>
                        <div className="text-base sm:text-lg text-gray-600 dark:text-gray-400 light:text-gray-600">
                            Encryption
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600 dark:text-blue-400 light:text-blue-600 mb-4 sm:mb-6">
                        Built for your peace of mind
                    </h2>
                    <p className="text-lg sm:text-xl text-blue-700 dark:text-blue-300 light:text-blue-700 max-w-2xl mx-auto">
                        Everything you need to manage your money with confidence
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {/* Bank-level Security */}
                    <div className="bg-white dark:bg-gray-800 light:bg-white p-6 sm:p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900 light:bg-blue-100 rounded-lg flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 light:text-blue-600" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 light:text-blue-600 mb-3 sm:mb-4 text-center">
                            Bank-level Security
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 light:text-gray-600 text-sm sm:text-base text-center">
                            Your money is protected with industry-leading security measures and FDIC insurance.
                        </p>
                    </div>

                    {/* Instant Transfers */}
                    <div className="bg-white dark:bg-gray-800 light:bg-white p-6 sm:p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900 light:bg-blue-100 rounded-lg flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                            <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 light:text-blue-600" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 light:text-blue-600 mb-3 sm:mb-4 text-center">
                            Instant Transfers
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 light:text-gray-600 text-sm sm:text-base text-center">
                            Send and receive money instantly with no delays or hidden fees.
                        </p>
                    </div>

                    {/* Data Privacy */}
                    <div className="bg-white dark:bg-gray-800 light:bg-white p-6 sm:p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900 light:bg-blue-100 rounded-lg flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                            <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 light:text-blue-600" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 light:text-blue-600 mb-3 sm:mb-4 text-center">
                            Data Privacy
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 light:text-gray-600 text-sm sm:text-base text-center">
                            Your personal information is encrypted and never shared with third parties.
                        </p>
                    </div>

                    {/* Smart Cards */}
                    <div className="bg-white dark:bg-gray-800 light:bg-white p-6 sm:p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900 light:bg-blue-100 rounded-lg flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                            <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 light:text-blue-600" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 light:text-blue-600 mb-3 sm:mb-4 text-center">
                            Smart Cards
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 light:text-gray-600 text-sm sm:text-base text-center">
                            Get virtual and physical cards with real-time spending notifications.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-50 dark:bg-gray-900 light:bg-gray-50 border-t border-gray-200 dark:border-gray-800 light:border-gray-200 py-8 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center text-gray-600 dark:text-gray-400 light:text-gray-600 text-sm sm:text-base">
                        <p>&copy; 2025 Secure Bank Corporation. All rights reserved.</p>
                        <p className="mt-2 text-xs">Unauthorized access is prohibited and monitored.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;



