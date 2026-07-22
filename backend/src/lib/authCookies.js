const { getRefreshTokenTtlDays } = require('./authTokens')

const REFRESH_COOKIE_NAME = 'growwell_refresh'

function cookieIsSecure() {
  if (process.env.COOKIE_SECURE === 'true') return true
  if (process.env.COOKIE_SECURE === 'false') return false
  return process.env.NODE_ENV === 'production'
}

function refreshCookieOptions() {
  return {
    path: '/api/auth',
    httpOnly: true,
    secure: cookieIsSecure(),
    sameSite: 'strict',
    maxAge: getRefreshTokenTtlDays() * 24 * 60 * 60,
  }
}

function setRefreshCookie(reply, token) {
  reply.setCookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions())
}

function clearRefreshCookie(reply) {
  reply.clearCookie(REFRESH_COOKIE_NAME, {
    path: '/api/auth',
    httpOnly: true,
    secure: cookieIsSecure(),
    sameSite: 'strict',
  })
}

function getPresentedRefreshToken(req) {
  return req.body?.refresh_token || req.cookies?.[REFRESH_COOKIE_NAME] || null
}

function isAndroidClient(req) {
  return req.body?.client_type === 'android' || Boolean(req.body?.refresh_token)
}

module.exports = {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  getPresentedRefreshToken,
  isAndroidClient,
  refreshCookieOptions,
  setRefreshCookie,
}
