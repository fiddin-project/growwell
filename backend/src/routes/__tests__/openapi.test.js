const { buildApp } = require('../../../tests/helper')

describe('OpenAPI contract', () => {
  it('documents every registered API route with a unique operationId', async () => {
    const app = await buildApp({
      prisma: { $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]) },
    })
    const document = app.swagger()
    const operationIds = []
    let operationCount = 0

    for (const [path, pathItem] of Object.entries(document.paths)) {
      if (!path.startsWith('/api/')) continue
      for (const method of ['get', 'post', 'put', 'delete', 'patch']) {
        const operation = pathItem[method]
        if (!operation) continue
        expect(operation.operationId, `${method.toUpperCase()} ${path}`).toBeTruthy()
        expect(operation.responses, `${method.toUpperCase()} ${path} responses`).toBeTruthy()
        expect(operation.responses.default, `${method.toUpperCase()} ${path} error response`).toBeTruthy()
        if (path.includes('{')) {
          expect(operation.parameters?.some((parameter) => parameter.in === 'path' && parameter.required)).toBe(true)
        }
        operationIds.push(operation.operationId)
        operationCount += 1
      }
    }

    expect(document.openapi).toBe('3.0.3')
    expect(document.paths['/api/auth/login'].post).toBeTruthy()
    expect(document.paths['/api/pengasuh/skrining'].post).toBeTruthy()
    expect(new Set(operationIds).size).toBe(operationIds.length)
    expect(operationCount).toBeGreaterThan(40)
    expect(document.components.schemas.ErrorResponse).toBeTruthy()
    expect(document.components.schemas.ScreeningForm).toBeTruthy()
    expect(document.paths['/api/auth/login'].post.requestBody).toBeTruthy()
    expect(document.paths['/api/admin/users'].get.parameters).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'page', in: 'query' }),
      expect.objectContaining({ name: 'limit', in: 'query' }),
    ]))
    await app.close()
  }, 20_000)

  it('serves the generated JSON document', async () => {
    const app = await buildApp({
      prisma: { $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]) },
    })
    const response = await app.inject({ method: 'GET', url: '/documentation/json' })
    expect(response.statusCode).toBe(200)
    expect(response.json().info.title).toBe('GrowWell API')
    await app.close()
  }, 20_000)
})
