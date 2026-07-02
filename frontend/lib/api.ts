import axios from 'axios';
import type { MOCK_ANALYSIS_RESULT } from './mockData';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle 401s
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
        localStorage.removeItem('token');
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

// ===================== TYPES =====================
export interface AnalyzeRequest {
  tender_text?: string;
  tender_url?: string;
  tender_id?: string;
  tender_file_path?: string;
  business_profile: {
    name: string;
    company_type: string;
    turnover?: number;
    annual_turnover?: number;
    turnover_unit?: 'absolute' | 'lakhs' | 'crores';
    experience_years: number;
    team_size: number;
    industry: string;
    state: string;
    certifications: string[];
  };
}

export interface AnalyzeResponse {
  analysisId: string;
  status: 'completed' | 'processing' | 'error' | 'queued';
  result: typeof MOCK_ANALYSIS_RESULT | null;
}

export interface TenderFilters {
  search?: string;
  category?: string[];
  minBudget?: number;
  maxBudget?: number;
  deadlineFilter?: 'week' | 'month' | 'quarter';
  sortBy?: 'deadline' | 'budget' | 'matchScore';
}

export interface ChatRequest {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: string;
}

// ===================== API WRAPPER =====================
async function apiCall<T>(fn: () => Promise<T>, fallbackGetter: () => Promise<T>): Promise<T> {
  if (USE_MOCK) {
    return await fallbackGetter();
  }
  try {
    return await fn();
  } catch (error: any) {
    // Don't fall back for client errors (auth, not found, etc.)
    if (error?.response?.status >= 400 && error?.response?.status < 500) {
      throw error;
    }
    console.warn('API call failed, using mock fallback:', error?.message || error);
    return await fallbackGetter();
  }
}

// ===================== AUTH API =====================

export async function login(usernameEmail: string, password: string): Promise<string> {
  if (USE_MOCK) {
    return 'mock-token-xyz';
  }
  const params = new URLSearchParams();
  params.append('username', usernameEmail);
  params.append('password', password);
  
  const response = await apiClient.post('/auth/token', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data.access_token;
}

export async function sendOtp(email: string): Promise<any> {
  if (USE_MOCK) {
    return { message: 'Mock OTP sent successfully' };
  }
  const response = await apiClient.post('/auth/send-otp', { email });
  return response.data;
}

export async function register(name: string, email: string, password: string, otp: string): Promise<any> {
  if (USE_MOCK) {
    return { user_id: 'mock-user-1', name, email };
  }
  const response = await apiClient.post('/auth/register', { name, email, password, otp });
  return response.data;
}

export async function getMe(): Promise<any> {
  return apiCall(
    async () => {
      const response = await apiClient.get('/auth/me');
      return response.data;
    },
    async () => ({ user_id: 'mock-user-1', name: 'Guest Developer', email: 'guest@example.com' })
  );
}

export async function getApiKeys(): Promise<any> {
  return apiCall(
    async () => {
      const response = await apiClient.get('/auth/keys');
      return response.data;
    },
    async () => ({
      groq_api_key_configured: false,
      gemini_api_key_configured: false,
      groq_api_key_masked: '',
      gemini_api_key_masked: ''
    })
  );
}

export async function saveApiKeys(data: { groq_api_key?: string; gemini_api_key?: string }): Promise<any> {
  return apiCall(
    async () => {
      const response = await apiClient.post('/auth/keys', data);
      return response.data;
    },
    async () => ({ message: 'API keys updated successfully (mocked)' })
  );
}

// ===================== API FUNCTIONS =====================

export async function analyzeTender(data: AnalyzeRequest): Promise<any> {
  return apiCall(
    async () => {
      const response = await apiClient.post('/api/analyze', data);
      return response.data;
    },
    async () => ({
      analysis_id: 'demo',
      status: 'queued' as const,
      websocket_url: '/ws/analysis/demo',
      message: 'Pipeline started successfully'
    })
  );
}

export async function uploadPDF(file: File): Promise<any> {
  return apiCall(
    async () => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post('/api/upload-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    async () => ({
      tender_id: 'TEN-MOCK-001',
      file_name: file.name,
      file_path: '/mock/path/' + file.name,
      pages: 1,
      extracted_text_preview: 'Mock text content',
      metadata: {},
      message: 'Mock upload success'
    })
  );
}

export async function getAnalysis(analysisId: string): Promise<any> {
  return apiCall(
    async () => {
      const response = await apiClient.get(`/api/analysis/${analysisId}`);
      return response.data;
    },
    async () => (await import('./mockData')).MOCK_ANALYSIS_RESULT
  );
}

export async function getAnalyses(): Promise<any[]> {
  return apiCall(
    async () => {
      const response = await apiClient.get('/api/analyses');
      return response.data;
    },
    async () => (await import('./mockData')).MOCK_DASHBOARD_STATS.recentAnalyses
  );
}

export async function deleteAnalysis(analysisId: string): Promise<any> {
  return apiCall(
    async () => {
      const response = await apiClient.delete(`/api/analysis/${analysisId}`);
      return response.data;
    },
    async () => ({ deleted: true })
  );
}

export async function rerunStep(analysisId: string, stepId: string): Promise<any> {
  return apiCall(
    async () => {
      const response = await apiClient.post(`/api/analyze/${analysisId}/rerun/${stepId}`);
      return response.data;
    },
    async () => ({ step: stepId, status: 'rerun complete' })
  );
}

export async function getTenders(filters?: TenderFilters) {
  return apiCall(
    async () => {
      const params = { ...filters, page_size: 1000 };
      const response = await apiClient.get('/api/tenders', { params });
      return response.data.tenders || [];
    },
    async () => (await import('./mockData')).MOCK_TENDERS
  );
}

export async function getTender(tenderId: string) {
  return apiCall(
    async () => {
      const response = await apiClient.get(`/api/tenders/${tenderId}`);
      return response.data;
    },
    async () => (await import('./mockData')).MOCK_TENDERS.find((t) => t.id === tenderId) || null
  );
}

export async function getSchemes() {
  return apiCall(
    async () => {
      const response = await apiClient.get('/api/schemes');
      return response.data;
    },
    async () => (await import('./mockData')).MOCK_SCHEMES
  );
}

const MOCK_PDF_BASE64 = 'JVBERi0xLjEKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nCiAgICAgL1BhZ2VzIDIgMCBSCiAgPj4KZW5kb2JqCjIgMCBvYmoKICA8PCAvVHlwZSAvUGFnZXMKICAgICAvS2lkcyBbIDMgMCBSIF0KICAgICAvQ291bnQgMQogID4+CmVuZG9iagozIDAgb2JqCiAgPDwgL1R5cGUgL1BhZ2UKICAgICAvUGFyZW50IDIgMCBSCiAgICAgL1Jlc291cmNlcyA8PAogICAgICAgL0ZvbnQgPDwKICAgICAgICAgL0YxIDQgMCBSCiAgICAgICA+PgogICAgID4+CiAgICAgL01lZGlhQm94IFsgMCAwIDU5NSA4NDIgXQogICAgIC9Db250ZW50cyA1IDAgUgogID4+CmVuZG9iago0IDAgb2JqCiAgPDwgL1R5cGUgL0ZvbnQKICAgICAvU3VidHlwZSAvVHlwZTEKICAgICAvQmFzZUZvbnQgL0hlbHZldGljYQogID4+CmVuZG9iago1IDAgb2JqCiAgPDwgL0xlbmd0aCA0NCA+PgpzdHJlYW0KQlQKICAvRjEgMjQgVGYKICA3MCA3MDAgVGQKICAoTW9jayBERU1PIFBERikgVGoKRUQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA2MiAwMDAwMCBuIAowMDAwMDAwMTI3IDAwMDAwIG4gCjAwMDAwMDAyNzQgMDAwMDAgbiAKMDAwMDAwMDM1NiAwMDAwMCBuIAp0cmFpbGVyCiAgPDwgL1NpemUgNgogICAgIC9Sb290IDEgMCBSCgogID4+CnN0YXJ0eHJlZgogNDUwCiUlRU9GCg==';

const MOCK_DOCX_BASE64 = 'UEsDBBQACAgIANOnblYAAAAAAAAAAAAAAAALAAAAd29yZC9kb2N1bWVudC54bWysU01PNDEQvVfyHyp32yTdj5V2t5JYWKkIh4VDEhfejD1JrNqesT2E/j0zThcWWAniwB6P37Pfe/b9g2q3QWJwj96Ws1mS5Jy1N2Ffynmz2t0tF5W8w00H99B5wXJ3l5TFbE3KipN3HkHAGsS2hHk9Wy4W+6x7sSjKKvFhMhMObA3b90K+oIalZexs1YtP27YkL5jDk62y7/wJ+h2M0o953k2L5WwxXf5m/b4gN6l9y4GgO6K2Qc0H0qg0gU0Nmx+H2x5N6dE/Ld89H8KzL4sA92+T/H1V9LqH5d7/Q0L8zK0Wq0q+3K1gHh/96e95n3a9O/q487D4sNrdL5c11DscfM02F9/C6uL0p/Dmg4/h/l1S7G18xV91b5Mizf+nS/x7+p+WwXfVzofw4tP0u+mff7d4HkOfqXmGzZ/R2vKqjF7/Aw==';

function base64ToBlob(base64: string, type: string): Blob {
  const binaryString = typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type });
}

export async function downloadReport(analysisId: string): Promise<Blob> {
  return apiCall(
    async () => {
      const response = await apiClient.get(`/api/report/${analysisId}`, {
        responseType: 'blob',
      });
      return response.data;
    },
    async () => base64ToBlob(MOCK_PDF_BASE64, 'application/pdf')
  );
}

export async function emailReport(analysisId: string): Promise<any> {
  return apiCall(
    async () => {
      const response = await apiClient.post(`/api/report/${analysisId}/email`);
      return response.data;
    },
    async () => {
      await new Promise(r => setTimeout(r, 1500));
      return { message: "Mock email sent" };
    }
  );
}

export async function downloadReportDocx(analysisId: string): Promise<Blob> {
  return apiCall(
    async () => {
      const response = await apiClient.get(`/api/report/${analysisId}/download/docx`, {
        responseType: 'blob',
      });
      return response.data;
    },
    async () => base64ToBlob(MOCK_DOCX_BASE64, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  );
}

export async function chat(request: ChatRequest) {
  return apiCall(
    async () => {
      const response = await apiClient.post('/api/chat', request);
      return response.data;
    },
    async () => ({
      response: (await import('./mockData')).MOCK_CHAT_MESSAGES[2]?.content || 'I can help you analyze this tender.',
      sources: ['NIC Tender Document', 'Company Profile Analysis'],
    })
  );
}

export async function chatWithAnalysis(analysisId: string, request: ChatRequest) {
  return apiCall(
    async () => {
      const response = await apiClient.post(`/api/chat/${analysisId}`, request);
      return response.data;
    },
    async () => ({
      response: 'I am reviewing the proposal. Your technical stack is strong, but you need to fill the security certification gaps.',
      sources: ['NIC Tender Document', 'Company Profile Analysis'],
    })
  );
}

export async function getDashboardStats() {
  return apiCall(
    async () => {
      const response = await apiClient.get('/api/dashboard/stats');
      return response.data;
    },
    async () => (await import('./mockData')).MOCK_DASHBOARD_STATS
  );
}

// ===================== NEW FEATURES API =====================

export async function getConsortiumMatches(analysisId: string) {
  return apiCall(
    async () => {
      const response = await apiClient.get(`/api/consortium/match/${analysisId}`);
      return response.data;
    },
    async () => ({
      critical_gaps: ['CMMI Level 3 Certification', 'ISO 27001 Certification'],
      potential_partners: [
        { company: 'Global Tech Systems Ltd', can_fill: ['CMMI Level 3 Certification'], contact: 'consortium@globaltech.com', match_score: 0.5 },
        { company: 'SecureNet Solutions', can_fill: ['ISO 27001 Certification'], contact: 'partner@securenet.in', match_score: 0.5 },
        { company: 'OmniCorp Government Systems', can_fill: ['CMMI Level 3 Certification', 'ISO 27001 Certification'], contact: 'bids@omnicorp.com', match_score: 1.0 }
      ]
    })
  );
}

export async function registerForConsortium(profile: any) {
  const response = await apiClient.post('/api/consortium/register', profile);
  return response.data;
}

export async function getAnalyticsSummary() {
  return apiCall(
    async () => {
      const response = await apiClient.get('/api/analytics/summary');
      return response.data;
    },
    async () => ({
      total_analyses: 12,
      avg_eligibility_score: 0.79,
      avg_win_probability: 0.71,
      highest_score: 0.92,
      most_common_gaps: [
        { gap: 'ISO 27001 Certification', count: 5 },
        { gap: 'CMMI Level 3 Certification', count: 4 },
        { gap: 'MeitY Registry', count: 3 }
      ],
      tenders_by_category: {
        'IT/Software': 6,
        'Cybersecurity': 3,
        'Data Analytics': 3
      },
      score_trend: [
        { date: '2026-06-01', tender: 'NIC e-Gov', eligibility: 0.72, win_probability: 0.61 },
        { date: '2026-06-08', tender: 'SEBI Analytics', eligibility: 0.76, win_probability: 0.65 },
        { date: '2026-06-15', tender: 'MeitY UX Redesign', eligibility: 0.81, win_probability: 0.72 },
        { date: '2026-06-22', tender: 'DRDO Cybersecurity', eligibility: 0.89, win_probability: 0.81 }
      ],
      eligible_rate: 0.75
    })
  );
}

export async function getWatchlist() {
  return apiCall(
    async () => {
      const response = await apiClient.get('/api/watchlist');
      return response.data;
    },
    async () => (await import('./mockData')).MOCK_DASHBOARD_STATS.upcomingDeadlinesList
  );
}

export async function watchTender(tenderId: string, notifyDays: number = 7) {
  const response = await apiClient.post(`/api/tenders/${tenderId}/watch?notify_days=${notifyDays}`);
  return response.data;
}

export async function unwatchTender(tenderId: string) {
  const response = await apiClient.delete(`/api/tenders/${tenderId}/watch`);
  return response.data;
}

export async function getSchemeSubscriptions() {
  return apiCall(
    async () => {
      const response = await apiClient.get('/api/schemes/subscriptions');
      return response.data;
    },
    async () => ([
      { id: 'scheme-001', name: 'Startup India Seed Fund Scheme', provider: 'DPIIT', benefit: 'Seed funding', amount: '20 Lakhs', deadline: 'Rolling', subscription_id: 'sub-01', remind_days_before: 14 }
    ])
  );
}

export async function subscribeToScheme(schemeId: string, remindDaysBefore: number = 14) {
  const response = await apiClient.post(`/api/schemes/${schemeId}/subscribe?remind_days_before=${remindDaysBefore}`);
  return response.data;
}

export async function getBusinessProfile(companyId: string = 'my'): Promise<any> {
  return apiCall(
    async () => {
      const response = await apiClient.get(`/api/profile/${companyId}`);
      return response.data;
    },
    async () => ({
      name: 'Default Mock Startup',
      company_type: 'startup',
      turnover: 12000000.0,
      annual_turnover: 12000000.0,
      turnover_unit: 'absolute',
      experience_years: 5,
      team_size: 15,
      industry: 'IT/Software',
      state: 'Tamil Nadu',
      certifications: ['ISO 9001', 'ISO 27001']
    })
  );
}

export async function saveBusinessProfile(profile: any): Promise<any> {
  return apiCall(
    async () => {
      const response = await apiClient.post('/api/profile', profile);
      return response.data;
    },
    async () => ({ status: 'success', company_id: 'mock-user-1' })
  );
}

export default apiClient;
