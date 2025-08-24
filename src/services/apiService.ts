/**
 * API Service Layer
 * 
 * This file contains all API calls used throughout the application.
 * It provides a centralized way to handle HTTP requests with proper
 * error handling, authentication, and type safety.
 * 
 * Features:
 * - JWT token management (access & refresh tokens)
 * - Automatic token refresh on 401 responses
 * - Centralized error handling
 * - TypeScript interfaces for all requests/responses
 * - Comprehensive logging for debugging
 * 
 * @author Your Team
 * @version 1.0.0
 */

// ============================================================================
// TYPE DEFINITIONS & INTERFACES
// ============================================================================

/**
 * Standard API response wrapper
 * All API responses follow this structure for consistency
 */
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * JWT Authentication tokens received from server
 */
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
}

/**
 * User authentication credentials for login
 */
interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * User registration data
 */
interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department?: string;
  role?: string;
}

/**
 * User profile information
 */
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  role: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Meeting data structure
 */
interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: number; // in seconds
  participants: string[]; // email addresses
  transcript?: string;
  summary?: string;
  actionItems?: string[];
  recordingUrl?: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

/**
 * Meeting creation request data
 */
interface CreateMeetingRequest {
  title: string;
  date: string;
  participants: string[];
  recordingBlob: Blob;
}

/**
 * User settings configuration
 */
interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    meetingReminders: boolean;
    summaryReady: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    audioQuality: 'low' | 'medium' | 'high';
    autoTranscribe: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
    publicProfile: boolean;
  };
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * API Configuration
 * Base URL and endpoints for all API calls
 */
const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-api.com/api' 
    : '/api',
  
  ENDPOINTS: {
    // Authentication endpoints
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    
    // User management endpoints
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    CHANGE_PASSWORD: '/user/change-password',
    SETTINGS: '/user/settings',
    
    // Meeting endpoints
    MEETINGS: '/meetings',
    MEETING_DETAILS: '/meetings/:id',
    PROCESS_MEETING: '/meetings/process',
    DELETE_MEETING: '/meetings/:id',
    
    // File upload endpoints
    UPLOAD_RECORDING: '/upload/recording',
    UPLOAD_AVATAR: '/upload/avatar',
  }
} as const;

/**
 * Local storage keys for token management
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'meetingSummarizer_accessToken',
  REFRESH_TOKEN: 'meetingSummarizer_refreshToken',
  USER_PROFILE: 'meetingSummarizer_userProfile',
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get stored access token from localStorage
 * @returns {string | null} The access token or null if not found
 */
const getAccessToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Get stored refresh token from localStorage
 * @returns {string | null} The refresh token or null if not found
 */
const getRefreshToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Store authentication tokens in localStorage
 * @param {AuthTokens} tokens - The authentication tokens to store
 */
const storeTokens = (tokens: AuthTokens): void => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  
  // Set expiration reminder (optional: for proactive refresh)
  const expirationTime = Date.now() + (tokens.expiresIn * 1000);
  localStorage.setItem('tokenExpiration', expirationTime.toString());
};

/**
 * Clear all stored authentication data
 */
const clearAuthData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  localStorage.removeItem('tokenExpiration');
};

/**
 * Build authorization headers for authenticated requests
 * @returns {HeadersInit} Headers object with authorization
 */
const buildAuthHeaders = (): HeadersInit => {
  const token = getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

/**
 * Handle API errors with proper logging and user-friendly messages
 * @param {Response} response - The failed HTTP response
 * @param {string} context - Context about where the error occurred
 * @throws {Error} Throws an error with user-friendly message
 */
const handleApiError = async (response: Response, context: string): Promise<never> => {
  let errorMessage = 'An unexpected error occurred';
  
  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorData.error || errorMessage;
    
    // Log detailed error info for debugging
    console.error(`API Error in ${context}:`, {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      errorData
    });
  } catch (parseError) {
    console.error(`Failed to parse error response in ${context}:`, parseError);
  }
  
  throw new Error(errorMessage);
};

// ============================================================================
// CORE API SERVICE CLASS
// ============================================================================

/**
 * Main API Service Class
 * 
 * Handles all HTTP requests with automatic token management,
 * error handling, and response parsing.
 */
class ApiService {
  
  /**
   * Make an authenticated HTTP request
   * 
   * @param {string} endpoint - API endpoint (relative to base URL)
   * @param {RequestInit} options - Fetch options (method, body, etc.)
   * @param {boolean} requiresAuth - Whether this request requires authentication
   * @returns {Promise<T>} Parsed response data
   * @throws {Error} On request failure or authentication issues
   */
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    requiresAuth: boolean = true
  ): Promise<T> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    // Build request headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add authorization header if required
    if (requiresAuth) {
      const token = getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    // Make the initial request
    let response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Handle token refresh on 401 Unauthorized
    if (response.status === 401 && requiresAuth) {
      console.log('Access token expired, attempting refresh...');
      
      try {
        await this.refreshAccessToken();
        
        // Retry the original request with new token
        const newToken = getAccessToken();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, {
            ...options,
            headers,
          });
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear invalid tokens and redirect to login
        clearAuthData();
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }
    }
    
    // Handle non-successful responses
    if (!response.ok) {
      await handleApiError(response, endpoint);
    }
    
    // Parse and return response data
    const data = await response.json();
    return data.data || data; // Handle both wrapped and unwrapped responses
  }
  
  /**
   * Refresh the access token using the stored refresh token
   * 
   * @private
   * @returns {Promise<void>}
   * @throws {Error} If refresh fails
   */
  private async refreshAccessToken(): Promise<void> {
    const refreshToken = getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFRESH_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const data = await response.json();
    storeTokens(data.data);
  }
  
  // ========================================================================
  // AUTHENTICATION API METHODS
  // ========================================================================
  
  /**
   * Authenticate user with email and password
   * 
   * Sends login credentials to the server and stores returned JWT tokens.
   * The password is hashed on the backend for security.
   * 
   * @param {LoginCredentials} credentials - User login credentials
   * @returns {Promise<{ user: UserProfile; tokens: AuthTokens }>} User data and tokens
   * @throws {Error} On authentication failure
   * 
   * @example
   * ```typescript
   * try {
   *   const { user, tokens } = await apiService.login({
   *     email: 'user@example.com',
   *     password: 'securePassword123'
   *   });
   *   console.log('Logged in as:', user.firstName);
   * } catch (error) {
   *   console.error('Login failed:', error.message);
   * }
   * ```
   */
  async login(credentials: LoginCredentials): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const response = await this.makeRequest<{ user: UserProfile; tokens: AuthTokens }>(
      API_CONFIG.ENDPOINTS.LOGIN,
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      },
      false // Login doesn't require existing auth
    );
    
    // Store tokens and user data
    storeTokens(response.tokens);
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(response.user));
    
    console.log('User successfully authenticated:', response.user.email);
    return response;
  }
  
  /**
   * Register a new user account
   * 
   * Creates a new user account with hashed password storage.
   * Returns authentication tokens for immediate login.
   * 
   * @param {RegisterData} userData - New user registration data
   * @returns {Promise<{ user: UserProfile; tokens: AuthTokens }>} Created user and tokens
   * @throws {Error} On registration failure (e.g., email already exists)
   * 
   * @example
   * ```typescript
   * try {
   *   const { user } = await apiService.register({
   *     email: 'newuser@example.com',
   *     password: 'securePassword123',
   *     firstName: 'John',
   *     lastName: 'Doe',
   *     department: 'Engineering'
   *   });
   *   console.log('Account created for:', user.email);
   * } catch (error) {
   *   console.error('Registration failed:', error.message);
   * }
   * ```
   */
  async register(userData: RegisterData): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const response = await this.makeRequest<{ user: UserProfile; tokens: AuthTokens }>(
      API_CONFIG.ENDPOINTS.REGISTER,
      {
        method: 'POST',
        body: JSON.stringify(userData),
      },
      false // Registration doesn't require existing auth
    );
    
    // Store tokens and user data
    storeTokens(response.tokens);
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(response.user));
    
    console.log('User successfully registered:', response.user.email);
    return response;
  }
  
  /**
   * Log out the current user
   * 
   * Invalidates the refresh token on the server and clears all local auth data.
   * 
   * @returns {Promise<void>}
   * @throws {Error} On logout failure (non-critical)
   * 
   * @example
   * ```typescript
   * try {
   *   await apiService.logout();
   *   console.log('Successfully logged out');
   * } catch (error) {
   *   console.warn('Logout had issues:', error.message);
   *   // Still clear local data even if server request fails
   * }
   * ```
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await this.makeRequest(
          API_CONFIG.ENDPOINTS.LOGOUT,
          {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          },
          true
        );
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
      // Continue with local cleanup even if server request fails
    } finally {
      // Always clear local auth data
      clearAuthData();
      console.log('Local authentication data cleared');
    }
  }
  
  /**
   * Request password reset email
   * 
   * Sends a password reset link to the user's email address.
   * 
   * @param {string} email - User's email address
   * @returns {Promise<{ message: string }>} Confirmation message
   * @throws {Error} On request failure
   * 
   * @example
   * ```typescript
   * try {
   *   const result = await apiService.forgotPassword('user@example.com');
   *   console.log(result.message); // "Password reset email sent"
   * } catch (error) {
   *   console.error('Failed to send reset email:', error.message);
   * }
   * ```
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return await this.makeRequest<{ message: string }>(
      API_CONFIG.ENDPOINTS.FORGOT_PASSWORD,
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
      false
    );
  }
  
  /**
   * Reset password with token from email
   * 
   * @param {string} token - Reset token from email
   * @param {string} newPassword - New password
   * @returns {Promise<{ message: string }>} Confirmation message
   * @throws {Error} On reset failure
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return await this.makeRequest<{ message: string }>(
      API_CONFIG.ENDPOINTS.RESET_PASSWORD,
      {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      },
      false
    );
  }
  
  // ========================================================================
  // USER PROFILE API METHODS
  // ========================================================================
  
  /**
   * Get current user's profile information
   * 
   * @returns {Promise<UserProfile>} User profile data
   * @throws {Error} On request failure or if not authenticated
   * 
   * @example
   * ```typescript
   * try {
   *   const profile = await apiService.getUserProfile();
   *   console.log('User name:', profile.firstName, profile.lastName);
   * } catch (error) {
   *   console.error('Failed to load profile:', error.message);
   * }
   * ```
   */
  async getUserProfile(): Promise<UserProfile> {
    const profile = await this.makeRequest<UserProfile>(
      API_CONFIG.ENDPOINTS.PROFILE,
      { method: 'GET' }
    );
    
    // Update cached profile data
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    return profile;
  }
  
  /**
   * Update user profile information
   * 
   * @param {Partial<UserProfile>} updates - Profile fields to update
   * @returns {Promise<UserProfile>} Updated profile data
   * @throws {Error} On update failure
   * 
   * @example
   * ```typescript
   * try {
   *   const updated = await apiService.updateUserProfile({
   *     firstName: 'John',
   *     department: 'Engineering'
   *   });
   *   console.log('Profile updated:', updated);
   * } catch (error) {
   *   console.error('Profile update failed:', error.message);
   * }
   * ```
   */
  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const updatedProfile = await this.makeRequest<UserProfile>(
      API_CONFIG.ENDPOINTS.UPDATE_PROFILE,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
    
    // Update cached profile data
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
    console.log('User profile updated successfully');
    return updatedProfile;
  }
  
  /**
   * Change user password
   * 
   * @param {string} currentPassword - Current password for verification
   * @param {string} newPassword - New password to set
   * @returns {Promise<{ message: string }>} Confirmation message
   * @throws {Error} On password change failure
   * 
   * @example
   * ```typescript
   * try {
   *   await apiService.changePassword('oldPassword', 'newSecurePassword');
   *   console.log('Password changed successfully');
   * } catch (error) {
   *   console.error('Password change failed:', error.message);
   * }
   * ```
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return await this.makeRequest<{ message: string }>(
      API_CONFIG.ENDPOINTS.CHANGE_PASSWORD,
      {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    );
  }
  
  // ========================================================================
  // USER SETTINGS API METHODS
  // ========================================================================
  
  /**
   * Get user settings and preferences
   * 
   * @returns {Promise<UserSettings>} User settings object
   * @throws {Error} On request failure
   * 
   * @example
   * ```typescript
   * const settings = await apiService.getUserSettings();
   * console.log('Email notifications:', settings.notifications.email);
   * ```
   */
  async getUserSettings(): Promise<UserSettings> {
    return await this.makeRequest<UserSettings>(
      API_CONFIG.ENDPOINTS.SETTINGS,
      { method: 'GET' }
    );
  }
  
  /**
   * Update user settings and preferences
   * 
   * @param {Partial<UserSettings>} settings - Settings to update
   * @returns {Promise<UserSettings>} Updated settings object
   * @throws {Error} On update failure
   * 
   * @example
   * ```typescript
   * const updated = await apiService.updateUserSettings({
   *   notifications: { email: false, push: true }
   * });
   * ```
   */
  async updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    return await this.makeRequest<UserSettings>(
      API_CONFIG.ENDPOINTS.SETTINGS,
      {
        method: 'PUT',
        body: JSON.stringify(settings),
      }
    );
  }
  
  // ========================================================================
  // MEETING MANAGEMENT API METHODS
  // ========================================================================
  
  /**
   * Get all meetings for the current user
   * 
   * @param {object} params - Query parameters
   * @param {number} params.page - Page number (1-based)
   * @param {number} params.limit - Number of meetings per page
   * @param {string} params.status - Filter by status ('processing', 'completed', 'failed')
   * @returns {Promise<{ meetings: Meeting[]; total: number; page: number; limit: number }>}
   * @throws {Error} On request failure
   * 
   * @example
   * ```typescript
   * const { meetings, total } = await apiService.getMeetings({
   *   page: 1,
   *   limit: 10,
   *   status: 'completed'
   * });
   * console.log(`Showing ${meetings.length} of ${total} meetings`);
   * ```
   */
  async getMeetings(params: {
    page?: number;
    limit?: number;
    status?: 'processing' | 'completed' | 'failed';
  } = {}): Promise<{ meetings: Meeting[]; total: number; page: number; limit: number }> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    
    const endpoint = `${API_CONFIG.ENDPOINTS.MEETINGS}?${queryParams.toString()}`;
    return await this.makeRequest<{ meetings: Meeting[]; total: number; page: number; limit: number }>(
      endpoint,
      { method: 'GET' }
    );
  }
  
  /**
   * Get detailed information about a specific meeting
   * 
   * @param {string} meetingId - Unique meeting identifier
   * @returns {Promise<Meeting>} Detailed meeting information
   * @throws {Error} On request failure or if meeting not found
   * 
   * @example
   * ```typescript
   * try {
   *   const meeting = await apiService.getMeetingDetails('meeting-123');
   *   console.log('Meeting:', meeting.title);
   *   console.log('Participants:', meeting.participants.join(', '));
   * } catch (error) {
   *   console.error('Meeting not found:', error.message);
   * }
   * ```
   */
  async getMeetingDetails(meetingId: string): Promise<Meeting> {
    const endpoint = API_CONFIG.ENDPOINTS.MEETING_DETAILS.replace(':id', meetingId);
    return await this.makeRequest<Meeting>(endpoint, { method: 'GET' });
  }
  
  /**
   * Process a new meeting recording
   * 
   * Uploads a meeting recording and associated metadata for AI processing.
   * The recording will be transcribed and summarized asynchronously.
   * 
   * @param {CreateMeetingRequest} meetingData - Meeting information and recording
   * @returns {Promise<{ meeting: Meeting; uploadUrl?: string }>} Created meeting object
   * @throws {Error} On upload or processing failure
   * 
   * @example
   * ```typescript
   * const formData = new FormData();
   * formData.append('recording', recordingBlob);
   * formData.append('title', 'Weekly Team Sync');
   * formData.append('date', '2024-01-15T10:00:00Z');
   * formData.append('participants', JSON.stringify(['john@company.com']));
   * 
   * try {
   *   const result = await apiService.processMeeting({
   *     title: 'Weekly Team Sync',
   *     date: '2024-01-15T10:00:00Z',
   *     participants: ['john@company.com'],
   *     recordingBlob: recordingBlob
   *   });
   *   console.log('Meeting processing started:', result.meeting.id);
   * } catch (error) {
   *   console.error('Failed to process meeting:', error.message);
   * }
   * ```
   */
  async processMeeting(meetingData: CreateMeetingRequest): Promise<{ meeting: Meeting; uploadUrl?: string }> {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('recording', meetingData.recordingBlob);
    formData.append('title', meetingData.title);
    formData.append('date', meetingData.date);
    formData.append('participants', JSON.stringify(meetingData.participants));
    
    // Make request with FormData (no JSON content-type header)
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROCESS_MEETING}`, {
      method: 'POST',
      headers: {
        // Don't set Content-Type - let browser set it with boundary for FormData
        'Authorization': `Bearer ${getAccessToken()}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      await handleApiError(response, 'processMeeting');
    }
    
    const data = await response.json();
    console.log('Meeting processing initiated:', data.meeting?.id);
    return data.data || data;
  }
  
  /**
   * Delete a meeting and all associated data
   * 
   * @param {string} meetingId - Meeting ID to delete
   * @returns {Promise<{ message: string }>} Confirmation message
   * @throws {Error} On deletion failure
   * 
   * @example
   * ```typescript
   * try {
   *   await apiService.deleteMeeting('meeting-123');
   *   console.log('Meeting deleted successfully');
   * } catch (error) {
   *   console.error('Failed to delete meeting:', error.message);
   * }
   * ```
   */
  async deleteMeeting(meetingId: string): Promise<{ message: string }> {
    const endpoint = API_CONFIG.ENDPOINTS.DELETE_MEETING.replace(':id', meetingId);
    const result = await this.makeRequest<{ message: string }>(endpoint, { method: 'DELETE' });
    console.log('Meeting deleted:', meetingId);
    return result;
  }
  
  // ========================================================================
  // FILE UPLOAD API METHODS
  // ========================================================================
  
  /**
   * Upload a meeting recording file
   * 
   * @param {File | Blob} recordingFile - Audio/video recording file
   * @param {function} onProgress - Progress callback (optional)
   * @returns {Promise<{ fileUrl: string; fileId: string }>} Upload result
   * @throws {Error} On upload failure
   * 
   * @example
   * ```typescript
   * const result = await apiService.uploadRecording(recordingBlob, (progress) => {
   *   console.log(`Upload progress: ${progress}%`);
   * });
   * console.log('Recording uploaded:', result.fileUrl);
   * ```
   */
  async uploadRecording(
    recordingFile: File | Blob,
    onProgress?: (progress: number) => void
  ): Promise<{ fileUrl: string; fileId: string }> {
    const formData = new FormData();
    formData.append('recording', recordingFile);
    
    // Create XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
      }
      
      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.data || response);
          } catch (error) {
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });
      
      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed due to network error'));
      });
      
      // Send request
      xhr.open('POST', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD_RECORDING}`);
      xhr.setRequestHeader('Authorization', `Bearer ${getAccessToken()}`);
      xhr.send(formData);
    });
  }
  
  /**
   * Upload user avatar image
   * 
   * @param {File} avatarFile - Image file for avatar
   * @returns {Promise<{ avatarUrl: string }>} New avatar URL
   * @throws {Error} On upload failure
   * 
   * @example
   * ```typescript
   * const fileInput = document.querySelector('input[type="file"]');
   * const file = fileInput.files[0];
   * 
   * try {
   *   const result = await apiService.uploadAvatar(file);
   *   console.log('New avatar URL:', result.avatarUrl);
   * } catch (error) {
   *   console.error('Avatar upload failed:', error.message);
   * }
   * ```
   */
  async uploadAvatar(avatarFile: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD_AVATAR}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      await handleApiError(response, 'uploadAvatar');
    }
    
    const data = await response.json();
    console.log('Avatar uploaded successfully');
    return data.data || data;
  }
  
  // ========================================================================
  // UTILITY METHODS
  // ========================================================================
  
  /**
   * Check if user is currently authenticated
   * 
   * @returns {boolean} True if user has valid tokens
   * 
   * @example
   * ```typescript
   * if (apiService.isAuthenticated()) {
   *   console.log('User is logged in');
   * } else {
   *   window.location.href = '/login';
   * }
   * ```
   */
  isAuthenticated(): boolean {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    return !!(accessToken && refreshToken);
  }
  
  /**
   * Get cached user profile from localStorage
   * 
   * @returns {UserProfile | null} Cached user profile or null
   * 
   * @example
   * ```typescript
   * const cachedProfile = apiService.getCachedUserProfile();
   * if (cachedProfile) {
   *   console.log('Welcome back,', cachedProfile.firstName);
   * }
   * ```
   */
  getCachedUserProfile(): UserProfile | null {
    try {
      const profileJson = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return profileJson ? JSON.parse(profileJson) : null;
    } catch (error) {
      console.error('Failed to parse cached user profile:', error);
      return null;
    }
  }
  
  /**
   * Clear all cached data (useful for testing or troubleshooting)
   * 
   * @example
   * ```typescript
   * apiService.clearCache();
   * console.log('All cached data cleared');
   * ```
   */
  clearCache(): void {
    clearAuthData();
    console.log('All cached authentication data cleared');
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton API service instance
 * 
 * Use this instance throughout your application for all API calls.
 * It maintains authentication state and provides consistent error handling.
 * 
 * @example
 * ```typescript
 * import { apiService } from '@/services/apiService';
 * 
 * // In a React component
 * const handleLogin = async (email: string, password: string) => {
 *   try {
 *     const { user } = await apiService.login({ email, password });
 *     console.log('Logged in as:', user.firstName);
 *   } catch (error) {
 *     setError(error.message);
 *   }
 * };
 * ```
 */
export const apiService = new ApiService();

// Export types for use in components
export type {
  ApiResponse,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  UserProfile,
  Meeting,
  CreateMeetingRequest,
  UserSettings,
};

// Export utility functions for advanced use cases
export {
  getAccessToken,
  getRefreshToken,
  clearAuthData,
};