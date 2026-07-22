const { buildApp } = require('../../../tests/helper')

describe('OpenAPI contract', () => {
  it('documents every registered API route with a unique operationId', async () => {
    const app = await buildApp({
      prisma: { $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]) },
    })
    const document = app.swagger()
    const operationIds = []

    for (const [path, pathItem] of Object.entries(document.paths)) {
      if (!path.startsWith('/api/')) continue
      for (const method of ['get', 'post', 'put', 'delete', 'patch']) {
        const operation = pathItem[method]
        if (!operation) continue
        expect(operation.operationId, `${method.toUpperCase()} ${path}`).toBeTruthy()
        operationIds.push(operation.operationId)
      }
    }

    expect(document.openapi).toBe('3.0.3')
    expect(document.paths['/api/auth/login'].post).toBeTruthy()
    expect(document.paths['/api/pengasuh/skrining'].post).toBeTruthy()
    expect(new Set(operationIds).size).toBe(operationIds.length)
    await app.close()
  })

  it('serves the generated JSON document', async () => {
    const app = await buildApp({
      prisma: { $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]) },
    })
    const response = await app.inject({ method: 'GET', url: '/documentation/json' })
    expect(response.statusCode).toBe(200)
    expect(response.json().info.title).toBe('GrowWell API')
    await app.close()
  })
})
