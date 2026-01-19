const isDevelopment = process.env.NODE_ENV === 'development';

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000' 
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  LEADERBOARD: `${API_BASE_URL}/api/market/leaderboard`,
  // Add other API endpoints here as needed
};
