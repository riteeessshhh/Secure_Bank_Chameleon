// API Configuration
// This file centralizes all API endpoint URLs
// In production, VITE_API_URL will be set by Render

const getApiUrl = () => {
  // Check for environment variable (set by Vite)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Check for Render environment variable
  if (import.meta.env.VITE_RENDER_API_URL) {
    return import.meta.env.VITE_RENDER_API_URL;
  }
  
  // Default to localhost for development
  return 'http://localhost:5000';
};

export const API_URL = getApiUrl();

// Debug: Log the API URL being used (remove in production if needed)
if (typeof window !== 'undefined') {
  console.log('[API Config] Using API URL:', API_URL);
  console.log('[API Config] VITE_API_URL env:', import.meta.env.VITE_API_URL);
}

// Helper function to build full API endpoint URLs
export const apiEndpoint = (path) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_URL}/${cleanPath}`;
};

export default {
  API_URL,
  apiEndpoint,
};

