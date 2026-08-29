import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, DEFAULT_HEADERS, REQUEST_TIMEOUT_MS } from '../constants/api';

// Auth types
export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  username: string;
}

export interface UserCreateRequest {
  username: string;
  password: string;
  recaptcha_token: string;
}

export interface UserLoginRequest {
  username: string;
  password: string;
  recaptcha_token: string;
}

export interface UserInfo {
  id: string;
  username: string;
  status: string;
}

// Batch types
export interface Batch {
  batch_id: string;
  field_id?: string;
  initial_weight_kg: number;
  harvest_timestamp: string;
  initial_visual_score: number;
  detected_ripeness_stage: string;
  fungal_pathogen_presence: boolean;
  macro_satellite_modifier: number;
  micro_drone_modifier: number;
  logistics_road_penalty: number;
  qr_code_secure_token: string;
  current_status: string;
}

export interface BatchCreateRequest {
  initial_weight_kg: number;
  harvest_timestamp?: string;
  field_id?: string;
  qr_code_secure_token?: string;
}

export interface BatchListResponse {
  batches: Batch[];
  count: number;
  limit: number;
  offset: number;
}

export interface BatchStatusUpdate {
  batch_id: string;
  current_status: string;
}

// Dashboard types
export interface DashboardStats {
  totals: {
    batch_count: number;
    total_weight_kg: number;
    avg_visual_score: number;
  };
  by_status: Array<{ current_status: string; batch_count: number; total_weight_kg: number }>;
  by_risk_tier: Array<{ risk_tier: string; batch_count: number; total_weight_kg: number }>;
  by_crop_category: Array<{ crop_category: string; batch_count: number; total_weight_kg: number }>;
  pathogen_alerts: number;
  recent_batches: Array<{
    batch_id: string;
    initial_weight_kg: number;
    harvest_timestamp: string;
    detected_ripeness_stage: string;
    current_status: string;
    initial_visual_score: number;
  }>;
}

// Environmental Log types
export interface EnvironmentalLog {
  log_timestamp: string;
  batch_id: string;
  ambient_temperature_c: number;
  relative_humidity_pct: number;
  longitude?: number;
  latitude?: number;
}

export interface EnvironmentalLogRequest {
  batch_id: string;
  temperature_c: number;
  humidity_pct: number;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
}

export interface LogAnalytics {
  log_count: number;
  temperature: { min_c: number | null; avg_c: number | null; max_c: number | null };
  humidity: { min_pct: number | null; avg_pct: number | null; max_pct: number | null };
  temperature_trend: string;
  degree_hours_above_optimal: number;
  spoilage_risk_class: string;
  spoilage_risk_pct: number;
  first_log_timestamp: string | null;
  last_log_timestamp: string | null;
}

// Salvage Facility types
export interface SalvageFacility {
  facility_id: string;
  facility_name: string;
  facility_type: string;
  guaranteed_floor_price_per_kg: number;
  longitude: number;
  latitude: number;
  distance_km: number;
}

export interface SalvageFacilitiesResponse {
  facilities: SalvageFacility[];
  count: number;
}

// Mandi Price types
export interface MandiPrice {
  market: string;
  state: string;
  modal_price: number;
  min_price: number;
  max_price: number;
  commodity: string;
  arrival_date: string;
  distance_km?: number;
}

export interface MandiPricesResponse {
  source: string;
  crop: string;
  prices: MandiPrice[];
  count: number;
  trend?: string;
  api_status: string;
}

// Health check
export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  database: string;
  timestamp: string;
}

// Notifications
export interface Notification {
  id: string;
  icon: string;
  icon_color: string;
  icon_bg: string;
  title: string;
  description: string;
  time_label: string;
  unread: boolean;
}

// Pest Scans
export interface PestScan {
  id: string;
  crop_name: string;
  scan_date: string;
  issue_detected: boolean;
  result_text: string;
  image_uri: string;
}

// Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem('auth_token');
}

async function setAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem('auth_token', token);
}

async function clearAuthToken(): Promise<void> {
  await AsyncStorage.multiRemove(['auth_token', 'user_id', 'username']);
}

function buildHeaders(includeAuth = true): Record<string, string> {
  const headers = { ...DEFAULT_HEADERS };
  return headers;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = await getAuthToken();

  const headers = buildHeaders(requireAuth);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message = isJson && data?.detail ? data.detail : response.statusText;
      throw new ApiError(message, response.status, data);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return data as T;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }
    throw new ApiError(err instanceof Error ? err.message : 'Network error', 0);
  }
}

export const api = {
  auth: {
    register: (payload: UserCreateRequest) =>
      request<TokenResponse>('/api/v5/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    login: (payload: UserLoginRequest) =>
      request<TokenResponse>('/api/v5/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    me: () => request<UserInfo>('/api/v5/auth/me', {}, true),

    logout: async () => {
      await clearAuthToken();
    },
  },

  batches: {
    list: (params?: { status?: string; limit?: number; offset?: number }) => {
      const search = new URLSearchParams();
      if (params?.status) search.set('status', params.status);
      if (params?.limit) search.set('limit', String(params.limit));
      if (params?.offset) search.set('offset', String(params.offset));
      return request<BatchListResponse>(`/api/v5/batches?${search.toString()}`, {}, false);
    },

    get: (batchId: string) =>
      request<{ batch: Batch }>(`/api/v5/batches/${batchId}`, {}, false),

    create: (payload: BatchCreateRequest) =>
      request<{ batch_id: string; qr_code_secure_token: string; initial_weight_kg: number; current_status: string; harvest_timestamp: string }>(
        '/api/v5/batches',
        { method: 'POST', body: JSON.stringify(payload) },
        false
      ),

    updateStatus: (batchId: string, newStatus: string) =>
      request<BatchStatusUpdate>(`/api/v5/batches/${batchId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ new_status: newStatus }),
      }, false),

    delete: (batchId: string) =>
      request<{ batch_id: string; status: string; message: string }>(`/api/v5/batches/${batchId}`, {
        method: 'DELETE',
      }, false),
  },

  dashboard: {
    get: () => request<DashboardStats>('/api/v5/dashboard', {}, false),
  },

  logs: {
    create: (payload: EnvironmentalLogRequest) =>
      request<{ status: string; batch_id: string; temperature_c: number; humidity_pct: number }>(
        '/api/v5/logs',
        { method: 'POST', body: JSON.stringify(payload) },
        true
      ),

    list: (batchId: string, limit = 100) =>
      request<{ batch_id: string; logs: EnvironmentalLog[]; count: number }>(
        `/api/v5/logs/${batchId}?limit=${limit}`,
        {},
        true
      ),

    analytics: (batchId: string) =>
      request<{ batch_id: string; analytics: LogAnalytics }>(
        `/api/v5/logs/${batchId}/analytics`,
        {},
        true
      ),
  },

  salvage: {
    nearby: (latitude: number, longitude: number, radiusKm = 50, limit = 5) =>
      request<SalvageFacilitiesResponse>(
        `/api/v5/salvage/nearby?latitude=${latitude}&longitude=${longitude}&radius_km=${radiusKm}&limit=${limit}`,
        {},
        true
      ),
  },

  mandi: {
    prices: (crop: string, state?: string) => {
      const search = new URLSearchParams({ crop });
      if (state) search.set('state', state);
      return request<MandiPricesResponse>(`/api/v5/mandi/prices?${search.toString()}`, {}, true);
    },
  },

  health: () => request<HealthResponse>('/api/v5/health', {}, false),

  metadata: {
    faq: () => request<{ categories: Array<{ category: string; faqs: Array<{ question: string; answer: string; icon?: string }> }> }>('/api/v5/faq', {}, false),
    crops: () => request<any>('/api/v5/crops/metadata', {}, false),
  },

  passport: {
    get: (batchId: string) => request<any>(`/api/v5/passport/${batchId}`, {}, false),
    generate: (params: { batch_id: string; crop_type?: string; weight_kg?: number; visual_score?: number; expiry_days?: number }) => {
      const search = new URLSearchParams({
        batch_id: params.batch_id,
        crop_type: params.crop_type || 'Tomato',
        weight_kg: String(params.weight_kg ?? 500),
        visual_score: String(params.visual_score ?? 85),
        expiry_days: String(params.expiry_days ?? 7),
      });
      return request<any>(`/api/v5/passport/generate?${search.toString()}`, { method: 'POST' }, true);
    },
    verify: (token: string) => request<any>(`/api/v5/passport/verify?token=${encodeURIComponent(token)}`, { method: 'POST' }, false),
  },

  notifications: {
    list: () => request<Notification[]>('/api/v5/notifications', {}, true),
    markAsRead: (notificationId?: string) =>
      request<{ status: string }>(`/api/v5/notifications/read${notificationId ? `?id=${notificationId}` : ''}`, { method: 'POST' }, true),
  },

  scans: {
    list: () => request<PestScan[]>('/api/v5/scans', {}, true),
    recent: () => request<{ scans: PestScan[] }>('/api/v5/scans/recent', {}, true),
  },

  setAuthToken,
  getAuthToken,
  clearAuthToken,
};