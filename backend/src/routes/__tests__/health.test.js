const { buildApp } = require('../../../tests/helper')

describe('GET /api/health', () => {
  it('returns 200 when the database is ready', async () => {
    const app = await buildApp({
      prisma: { $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]) },
    })

    const response = await app.inject({ method: 'GET', url: '/api/health' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok', database: 'ok' })
    await app.close()
  })

  it('returns 503 without exposing database details', async () => {
    const app = await buildApp({
      prisma: { $queryRaw: vi.fn().mockRejectedValue(new Error('secret connection detail')) },
    })

    const response = await app.inject({ method: 'GET', url: '/api/health' })

    expect(response.statusCode).toBe(503)
    expect(response.json()).toEqual({ status: 'error', database: 'unavailable' })
    expect(response.payload).not.toContain('secret connection detail')
    await app.close()
  })
})
