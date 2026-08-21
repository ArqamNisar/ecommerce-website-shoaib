/**
 * TechHaven — Backend API Client
 * Centralized API calls to the FastAPI backend.
 */

let rawApiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').trim();
if (rawApiBase && !rawApiBase.startsWith('http://') && !rawApiBase.startsWith('https://')) {
  rawApiBase = `https://${rawApiBase}`;
}
const API_BASE = rawApiBase.replace(/\/+$/, '');

/**
 * Generic fetch wrapper with error handling.
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('techhaven_admin_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText || 'Request failed'}`;
    try {
      const errorData = await response.json();
      if (typeof errorData === 'object' && errorData !== null) {
        errorMessage = errorData.detail || errorData.message || errorData.error || JSON.stringify(errorData);
      }
    } catch {
      try {
        const textError = await response.text();
        if (textError && textError.length < 200) {
          errorMessage = `HTTP ${response.status}: ${textError}`;
        }
      } catch {
        // use default HTTP status message
      }
    }
    console.error(`[API Error] ${options.method || 'GET'} ${url} failed with status ${response.status}:`, errorMessage);
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/* ---- Products ---- */

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  category: string;
  subcategory: string | null;
  brand: string | null;
  tags: string[];
  specifications: Record<string, string>;
  images: string[];
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProductFilters {
  page?: number;
  page_size?: number;
  category?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  is_featured?: boolean;
  sort_by?: string;
  sort_order?: string;
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  return apiFetch<ProductListResponse>(`/api/products?${params.toString()}`);
}

export async function getProduct(id: string, sessionId?: string): Promise<Product> {
  const params = sessionId ? `?session_id=${sessionId}` : '';
  return apiFetch<Product>(`/api/products/${id}${params}`);
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  return apiFetch<Product>('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<Product> {
  return apiFetch<Product>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
}

export async function uploadProductImages(id: string, files: FileList): Promise<{ uploaded: string[]; total_images: number }> {
  const formData = new FormData();
  Array.from(files).forEach(file => formData.append('files', file));
  return apiFetch(`/api/products/${id}/images`, {
    method: 'POST',
    body: formData,
  });
}

export async function getCategories(): Promise<{ name: string; count: number }[]> {
  return apiFetch('/api/products/categories');
}

export async function getBrands(): Promise<string[]> {
  return apiFetch('/api/products/brands');
}

/* ---- Search ---- */

export interface SearchResponse extends ProductListResponse {
  query: string;
}

export async function searchProducts(
  query: string,
  filters: Omit<ProductFilters, 'is_featured'> & { session_id?: string } = {}
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query });
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  return apiFetch<SearchResponse>(`/api/search?${params.toString()}`);
}

export async function getSearchSuggestions(query: string): Promise<{ suggestions: string[] }> {
  return apiFetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
}

/* ---- Recommendations ---- */

export async function getSimilarProducts(productId: string, limit = 8): Promise<{ products: Product[] }> {
  return apiFetch(`/api/recommendations/similar/${productId}?limit=${limit}`);
}

export async function getTrendingProducts(limit = 8): Promise<{ products: Product[] }> {
  return apiFetch(`/api/recommendations/trending?limit=${limit}`);
}

export async function getRecentlyViewed(sessionId: string, limit = 8): Promise<{ products: Product[] }> {
  return apiFetch(`/api/recommendations/recently-viewed?session_id=${sessionId}&limit=${limit}`);
}

export async function getPersonalizedRecommendations(sessionId: string, limit = 8): Promise<{ products: Product[] }> {
  return apiFetch(`/api/recommendations/personalized?session_id=${sessionId}&limit=${limit}`);
}

/* ---- Chatbot ---- */

export interface ChatResponse {
  reply: string;
  products: Product[];
}

export async function sendChatMessage(
  message: string,
  sessionId?: string,
  history?: { role: string; content: string }[]
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>('/api/chatbot', {
    method: 'POST',
    body: JSON.stringify({ message, session_id: sessionId, history }),
  });
}

/* ---- Auth ---- */

export interface LoginResponse {
  access_token: string;
  token_type: string;
  admin_email: string;
}

export async function adminLogin(email: string, password: string): Promise<LoginResponse> {
  const response = await apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  // Store token
  if (typeof window !== 'undefined') {
    localStorage.setItem('techhaven_admin_token', response.access_token);
    localStorage.setItem('techhaven_admin_email', response.admin_email);
  }
  return response;
}

export function adminLogout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('techhaven_admin_token');
    localStorage.removeItem('techhaven_admin_email');
  }
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('techhaven_admin_token');
}

export function getAdminEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('techhaven_admin_email');
}
