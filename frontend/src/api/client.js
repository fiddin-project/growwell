import axios from 'axios'
import { clearAccessToken, getAccessToken, setAccessToken } from './tokenStore'

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

let refreshPromise = null

function isAuthLifecycleRequest(url = '') {
  return ['/auth/login', '/auth/refresh', '/auth/logout'].some((path) => url.includes(path))
}

function notifyAuthenticationExpired() {
  clearAccessToken()
  window.dispatchEvent(new Event('growwell:auth-expired'))
}

async function refreshAccessToken() {
  const { data } = await axios.post(
    '/api/auth/refresh',
    { client_type: 'web' },
    { withCredentials: true }
  )
  setAccessToken(data.access_token || data.token)
  return data
}

client.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {}
    if (
      error.response?.status === 401 &&
      !originalRequest._growwellRetry &&
      !isAuthLifecycleRequest(originalRequest.url)
    ) {
      originalRequest._growwellRetry = true
      refreshPromise ||= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      try {
        await refreshPromise
        return client(originalRequest)
      } catch {
        notifyAuthenticationExpired()
      }
    }
    return Promise.reject(error)
  }
)

export default client
export { refreshAccessToken }
