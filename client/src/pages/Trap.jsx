import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, Sun, Moon, Circle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import sessionRecorder from '../utils/sessionRecorder';
import { API_URL } from '../config/api';

// ⚠️ DEMO MODE: Set to false in production to disable keystroke capture
const DEMO_MODE = true;

const Trap = () => {
  const { theme, toggleTheme } = useTheme();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const navigate = useNavigate();
  const userIdRef = useRef(null);
  const passwordRef = useRef(null);

  // Initialize session recorder
  useEffect(() => {
    if (DEMO_MODE) {
      sessionRecorder.setMode('demo');
      sessionRecorder.start();
      setIsRecording(true);

      // Record initial focus
      sessionRecorder.recordFocus('page_load');

      return () => {
        sessionRecorder.stop();
      };
    }
  }, []);

  // Record keystrokes and events (DEMO MODE ONLY)
  useEffect(() => {
    if (!DEMO_MODE || !isRecording) return;

    const handleKeyDown = (e, fieldName, isPassword = false) => {
      // Record all keys including special keys
      const fieldType = isPassword ? 'password' : 'text';
      sessionRecorder.recordKeystroke(e.key, fieldName, isPassword, fieldType);
    };

    const handleFocus = (fieldName, fieldType) => {
      sessionRecorder.recordFocus(fieldName, fieldType);
    };

    const handleBlur = (fieldName) => {
      sessionRecorder.recordBlur(fieldName);
    };

    const userIdInput = userIdRef.current;
    const passwordInput = passwordRef.current;

    if (userIdInput) {
      userIdInput.addEventListener('keydown', (e) => handleKeyDown(e, 'userid', false));
      userIdInput.addEventListener('focus', () => handleFocus('userid', 'text'));
      userIdInput.addEventListener('blur', () => handleBlur('userid'));
    }

    if (passwordInput) {
      passwordInput.addEventListener('keydown', (e) => handleKeyDown(e, 'password', true));
      passwordInput.addEventListener('focus', () => handleFocus('password', 'password'));
      passwordInput.addEventListener('blur', () => handleBlur('password'));
    }

    return () => {
      if (userIdInput) {
        userIdInput.removeEventListener('keydown', handleKeyDown);
        userIdInput.removeEventListener('focus', handleFocus);
        userIdInput.removeEventListener('blur', handleBlur);
      }
      if (passwordInput) {
        passwordInput.removeEventListener('keydown', handleKeyDown);
        passwordInput.removeEventListener('focus', handleFocus);
        passwordInput.removeEventListener('blur', handleBlur);
      }
    };
  }, [isRecording, userId, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Record submit action
      if (DEMO_MODE && isRecording) {
        sessionRecorder.recordSubmit();
      }

      // Send both fields for analysis
      const payload = `User ID: ${userId}, Password: ${password}`;

      // Get recorded actions
      const actions = DEMO_MODE && isRecording ? sessionRecorder.getActions() : [];

      // Use /api/submit endpoint which handles both analysis and logging
      // This prevents duplicate log entries
      const response = await axios.post(`${API_URL}/api/submit`, {
        input: payload,
        username: userId,
        ip_address: '127.0.0.1',
        actions: actions
      });

      // Extract response data (submit endpoint returns different structure)
      const responseData = {
        response: {
          status: 200,
          message: response.data?.response?.message || "Processed",
          deception: response.data?.response?.deception || "None",
          action: response.data?.response?.action || "none"
        },
        forensics: {
          detected_type: response.data?.forensics?.detected_type || response.data?.attack_type || "Unknown",
          confidence: response.data?.forensics?.confidence || response.data?.confidence || 0.5,
          merkle_root: response.data?.forensics?.merkle_root || response.data?.merkle_root || ""
        }
      };

      // Debug: Log the response to see what we're getting
      console.log('Backend Response:', responseData);
      console.log('Response structure:', {
        response: responseData.response,
        forensics: responseData.forensics
      });

      // Check for redirect action (Admin Login)
      if (responseData.response?.action === 'redirect') {
        navigate('/dashboard');
        return;
      }

      // Check for fake dashboard redirect (Attacker Tarpit)
      if (responseData.response?.action === 'fake_dashboard') {
        // Show loading page first
        navigate('/loading');
        // Then redirect to fake dashboard after 5 seconds
        setTimeout(() => {
          navigate('/fake-dashboard');
        }, 5000);
        return;
      }

      // Check for slow loading then fake dashboard (SQLi/XSS deception)
      if (responseData.response?.action === 'slow_loading_then_fake_dashboard') {
        console.log('Detected SQLi/XSS - redirecting to loading page');
        // Navigate to loading page which will handle the flow
        navigate('/loading');
        return;
      }

      // Also check if attack type is SQLi or XSS from forensics
      const attackType = responseData.forensics?.detected_type;
      if (attackType === 'SQLi' || attackType === 'XSS') {
        console.log(`Detected ${attackType} attack - redirecting to loading page`);
        navigate('/loading');
        return;
      }

      // Simulate processing delay if not already handled by backend
      if (responseData.response?.deception === 'Artificial Network Lag') {
        // The backend already delayed, but we can add visual effect
      }

      setMessage(responseData.response);
      setLoading(false);
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);

      // Provide more specific error messages
      let errorMessage = "An unexpected error occurred. Please try again later.";
      if (error.response?.status === 404) {
        errorMessage = "Service not found. Please check if the backend server is running.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.message === 'Network Error' || error.code === 'ECONNREFUSED') {
        errorMessage = `Cannot connect to server. Please ensure the backend is running on ${API_URL}`;
      }

      setMessage({
        status: error.response?.status || 500,
        message: errorMessage,
        deception: "None"
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 font-sans px-4 py-8">
      {/* Header */}
      <div className="w-full bg-blue-900 dark:bg-blue-950 py-3 sm:py-4 px-4 sm:px-8 shadow-md fixed top-0 flex items-center justify-between z-20">
        <div className="flex items-center gap-2 text-white">
          <ShieldCheck size={24} className="sm:w-8 sm:h-8" />
          <span className="text-xl sm:text-2xl font-bold tracking-tight">SecureBank</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-blue-800 dark:bg-blue-900 hover:bg-blue-700 dark:hover:bg-blue-800 text-white transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="text-blue-200 text-xs sm:text-sm flex items-center gap-1">
            <Lock size={12} className="sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Secure Connection</span>
          </div>
        </div>
      </div>

      <div className="max-w-md w-full space-y-6 sm:space-y-8 p-6 sm:p-10 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-10 border-t-4 border-blue-600 mt-24 sm:mt-20">
        <div className="text-center">
          <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            Online Banking Login
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Please enter your credentials to access your accounts.
          </p>
          {DEMO_MODE && isRecording && (
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-red-500">
              {/* <Circle size={8} className="fill-red-500 animate-pulse" /> */}
              {/* <span>DEMO MODE: Session Recording Active</span> */}
            </div>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="userid" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User ID</label>
              <input
                ref={userIdRef}
                id="userid"
                name="userid"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Enter your User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onFocus={() => DEMO_MODE && sessionRecorder.recordFocus('userid')}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                ref={passwordRef}
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Enter your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => DEMO_MODE && sessionRecorder.recordFocus('password')}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot User ID/Password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Authenticating...' : 'Log In'}
            </button>
          </div>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded-md border ${message.status === 200 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {message.status === 200 ? <ShieldCheck size={20} /> : <Lock size={20} />}
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">{message.status === 200 ? 'Success' : 'Authentication Failed'}</h3>
                <div className="mt-1 text-sm">
                  {message.error || message.message}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mt-8 text-center text-xs text-gray-500 dark:text-gray-400 max-w-md px-4">
        <p>Unauthorized access is prohibited and monitored. All activities are logged for security purposes.</p>
        <p className="mt-2">&copy; 2025 SecureBank Corporation. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Trap;
