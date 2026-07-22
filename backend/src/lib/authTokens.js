const crypto = require('node:crypto')

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 15 * 60
const DEFAULT_REFRESH_TOKEN_TTL_DAYS = 30

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function getAccessTokenTtlSeconds() {
  return positiveInteger(process.env.ACCESS_TOKEN_TTL_SECONDS, DEFAULT_ACCESS_TOKEN_TTL_SECONDS)
}

function getRefreshTokenTtlDays() {
  return positiveInteger(process.env.REFRESH_TOKEN_TTL_DAYS, DEFAULT_REFRESH_TOKEN_TTL_DAYS)
}

function generateOpaqueToken() {
  return crypto.randomBytes(32).toString('base64url')
}

function hashOpaqueToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function generateId() {
  return crypto.randomUUID()
}

function refreshExpiryDate(now = new Date()) {
  return new Date(now.getTime() + getRefreshTokenTtlDays() * 24 * 60 * 60 * 1000)
}

function signAccessToken(fastify, user) {
  const expiresIn = getAccessTokenTtlSeconds()
  const token = fastify.jwt.sign(
    {
      id: user.id,
      role: user.role,
      nama_lengkap: user.nama_lengkap,
      type: 'access',
      jti: generateId(),
    },
    { expiresIn }
  )
  return { token, expiresIn }
}

module.exports = {
  generateId,
  generateOpaqueToken,
  getAccessTokenTtlSeconds,
  getRefreshTokenTtlDays,
  hashOpaqueToken,
  refreshExpiryDate,
  signAccessToken,
}
