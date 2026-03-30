export const API_BASE = 'http://localhost:8000'

export const fetchWithAuth = async (url, options = {}) => {
  const session = localStorage.getItem('session_token')
  const headers = {
    ...options.headers,
    Authorization: session ? `Bearer ${session}` : '',
    'Content-Type':
      options.body instanceof FormData
        ? undefined
        : options.headers?.['Content-Type'] || 'application/json',
  }

  // Remove Content-Type if it's FormData, browser will set it with boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type']
  }

  const response = await fetch(`${API_BASE}${url}`, { ...options, headers })
  if (response.status === 401) {
    localStorage.removeItem('session_token')
    window.location.reload()
    return null
  }
  return response
}
