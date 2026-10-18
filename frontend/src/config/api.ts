/**
 * Centralized API configuration for the Notice-Decoder frontend.
 *
 * Base URL Resolution:
 * 1. `import.meta.env.VITE_API_BASE_URL`: Defined via .env file or hosting provider environment variable.
 * 2. In Production (`import.meta.env.PROD` / `!import.meta.env.DEV`): Deployed Render backend (`https://notice-decoder.onrender.com`).
 * 3. In Development (`import.meta.env.DEV`): Local backend (`http://localhost:5000`).
 */

const DEFAULT_PROD_API_URL = 'https://notice-decoder.onrender.com';
const DEFAULT_DEV_API_URL = 'http://localhost:5000';

const envBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL: string = (
  envBaseUrl && envBaseUrl.trim()
    ? envBaseUrl.trim()
    : (import.meta.env.DEV ? DEFAULT_DEV_API_URL : DEFAULT_PROD_API_URL)
).replace(/\/+$/, '');

/**
 * Constructs an absolute API endpoint URL given a path.
 * Normalizes leading slashes and prevents duplicate trailing slashes.
 *
 * @param path - Relative endpoint path (e.g. '/api/notices/decode')
 * @returns Fully qualified endpoint URL
 */
export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Strongly-typed registry of all backend endpoints.
 */
export const API_ENDPOINTS = {
  // Base & Health
  BASE: API_BASE_URL,
  HEALTH: apiUrl('/'),

  // Notice Decoding & Processing
  DECODE_NOTICE: apiUrl('/api/notices/decode'),
  DECODE_NOTICE_FILE: apiUrl('/api/notices/decode-file'),
  NOTICES: apiUrl('/api/notices'),
  NOTICE_BY_ID: (id: string | number) => apiUrl(`/api/notices/${id}`),

  // Academic Calendar & Events
  EVENTS: apiUrl('/api/events'),
  EVENT_BY_ID: (id: string | number) => apiUrl(`/api/events/${id}`),

  // Timetable Conflict Resolution
  CONFLICTS: apiUrl('/api/conflicts'),
  CHECK_CONFLICTS: apiUrl('/api/conflicts/check'),
  REVIEW_CONFLICT: (id: string | number) => apiUrl(`/api/conflicts/${id}/review`),

  // Authentication (Supabase / Backend)
  AUTH_LOGIN: apiUrl('/api/auth/login'),
  AUTH_REGISTER: apiUrl('/api/auth/register'),
  AUTH_ME: apiUrl('/api/auth/me'),

  // Notifications
  NOTIFICATIONS: apiUrl('/api/notifications'),
  NOTIFICATION_READ: (id: string | number) => apiUrl(`/api/notifications/${id}/read`),
  NOTIFICATIONS_MARK_ALL_READ: apiUrl('/api/notifications/mark-all-read'),
} as const;
