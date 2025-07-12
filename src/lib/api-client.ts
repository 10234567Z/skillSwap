// API Client with error handling and caching
class ApiClient {
  private cache = new Map<string, { data: unknown; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    // Only add authorization header if we have a valid token
    if (token && token !== 'null' && token !== 'undefined') {
      try {
        // Basic token validation - check if it has 3 parts (header.payload.signature)
        const parts = token.split('.')
        if (parts.length === 3) {
          headers.Authorization = `Bearer ${token}`
        }
      } catch {
        // Invalid token, don't include it
      }
    }
    
    return headers
  }

  private getCacheKey(url: string, params?: Record<string, unknown>): string {
    return `${url}?${new URLSearchParams(params as Record<string, string>).toString()}`
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }
    return response.json()
  }

  async get<T>(url: string, params?: Record<string, unknown>, useCache = true): Promise<T> {
    const cacheKey = this.getCacheKey(url, params)
    
    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      if (this.isCacheValid(cached.timestamp)) {
        return cached.data as T
      }
      this.cache.delete(cacheKey)
    }

    // Filter out undefined and empty values from params
    const cleanParams = params ? Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(params).filter(([_, value]) => 
        value !== undefined && value !== null && value !== ''
      ).map(([key, value]) => [key, String(value)])
    ) : {}
    
    const queryString = Object.keys(cleanParams).length > 0 
      ? `?${new URLSearchParams(cleanParams).toString()}` 
      : ''
      
    const response = await fetch(`${url}${queryString}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    const data = await this.handleResponse<T>(response)
    
    // Cache successful responses
    if (useCache) {
      this.cache.set(cacheKey, { data, timestamp: Date.now() })
    }
    
    return data
  }

  async post<T>(url: string, body?: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  async put<T>(url: string, body?: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  async delete<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })

    return this.handleResponse<T>(response)
  }

  clearCache(): void {
    this.cache.clear()
  }

  clearCacheForUrl(url: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(url))
    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

export const apiClient = new ApiClient()
