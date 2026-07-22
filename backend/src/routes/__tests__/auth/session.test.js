const { buildApp } = require('../../../../tests/helper')
const prisma = require('../../../lib/prisma')

let app

beforeEach(async () => {
  app = await buildApp()
})

afterEach(async () => {
  await app.close()
})

async function androidLogin() {
  return app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { username: 'pengasuh_1', password: '123', client_type: 'android' },
  })
}

describe('refresh session lifecycle', () => {
  it('returns an Android refresh token but stores only its hash', async () => {
    const response = await androidLogin()
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.access_token).toBe(body.token)
    expect(body.expires_in).toBe(900)
    expect(body.refresh_token).toBeTruthy()

    const stored = await prisma.refreshSession.findFirst({
      where: { user_id: body.user.id },
      orderBy: { created_at: 'desc' },
    })
    expect(stored.token_hash).not.toBe(body.refresh_token)
    expect(stored.token_hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('rotates refresh tokens and revokes a family on replay', async () => {
    const login = (await androidLogin()).json()
    const refreshedResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: { client_type: 'android', refresh_token: login.refresh_token },
    })
    expect(refreshedResponse.statusCode).toBe(200)
    const refreshed = refreshedResponse.json()
    expect(refreshed.refresh_token).not.toBe(login.refresh_token)

    const replay = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: { client_type: 'android', refresh_token: login.refresh_token },
    })
    expect(replay.statusCode).toBe(401)
    expect(replay.json().code).toBe('REFRESH_TOKEN_REUSED')

    const replacementAfterReplay = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: { client_type: 'android', refresh_token: refreshed.refresh_token },
    })
    expect(replacementAfterReplay.statusCode).toBe(401)
  })

  it('uses an HttpOnly refresh cookie for web clients', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'pengasuh_1', password: '123', client_type: 'web' },
    })
    expect(login.statusCode).toBe(200)
    expect(login.json()).not.toHaveProperty('refresh_token')
    const cookie = login.headers['set-cookie']
    expect(cookie).toContain('growwell_refresh=')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Strict')

    const refresh = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { cookie: cookie.split(';')[0] },
      payload: { client_type: 'web' },
    })
    expect(refresh.statusCode).toBe(200)
    expect(refresh.headers['set-cookie']).toContain('growwell_refresh=')
  })

  it('revokes the current session on logout', async () => {
    const login = (await androidLogin()).json()
    const logout = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      payload: { refresh_token: login.refresh_token },
    })
    expect(logout.statusCode).toBe(204)

    const refresh = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: { client_type: 'android', refresh_token: login.refresh_token },
    })
    expect(refresh.statusCode).toBe(401)
  })

  it('revokes every session for the authenticated user', async () => {
    const first = (await androidLogin()).json()
    const second = (await androidLogin()).json()

    const logoutAll = await app.inject({
      method: 'POST',
      url: '/api/auth/logout-all',
      headers: { authorization: `Bearer ${first.access_token}` },
    })
    expect(logoutAll.statusCode).toBe(204)

    for (const refreshToken of [first.refresh_token, second.refresh_token]) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: { client_type: 'android', refresh_token: refreshToken },
      })
      expect(response.statusCode).toBe(401)
    }
  })
})
