const isDevelopment = process.env.NODE_ENV === 'development';

// Use NEXT_PUBLIC_BACKEND_URL if set, otherwise:
// - In development: use localhost:5000 (backend)
// - In production: use same origin (will be proxied to backend via Vercel)
// Note: API_BASE_URL should NOT include /api suffix - components will add it
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 
  (isDevelopment 
    ? 'http://localhost:5000' 
    : (typeof window !== 'undefined' ? window.location.origin : ''));

export const API_ENDPOINTS = {
  LEADERBOARD: `${API_BASE_URL}/api/market/leaderboard`,
  // Add other API endpoints here as needed
};
