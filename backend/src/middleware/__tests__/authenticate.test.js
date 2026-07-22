const authenticate = require('../../middleware/authenticate')

describe('authenticate middleware', () => {
  function createReq() {
    return {
      jwtVerify: vi.fn(),
      user: { id: 1, role: 'ADMIN', type: 'access' },
    }
  }

  function createReply() {
    const reply = {
      status: vi.fn(() => reply),
      send: vi.fn(() => reply),
    }
    return reply
  }

  it('passes when jwtVerify succeeds', async () => {
    const req = createReq()
    req.jwtVerify.mockResolvedValue(undefined)
    const reply = createReply()
    await authenticate(req, reply)
    expect(req.jwtVerify).toHaveBeenCalled()
    expect(reply.status).not.toHaveBeenCalled()
  })

  it('returns 401 when jwtVerify throws', async () => {
    const req = createReq()
    req.jwtVerify.mockRejectedValue(new Error('Invalid token'))
    const reply = createReply()
    await authenticate(req, reply)
    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({ error: 'Tidak terautentikasi' })
  })

  it('returns 401 for expired token', async () => {
    const req = createReq()
    req.jwtVerify.mockRejectedValue(new Error('jwt expired'))
    const reply = createReply()
    await authenticate(req, reply)
    expect(reply.status).toHaveBeenCalledWith(401)
  })

  it('rejects a valid JWT that is not an access token', async () => {
    const req = createReq()
    req.user.type = 'refresh'
    const reply = createReply()
    await authenticate(req, reply)
    expect(reply.status).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith({ error: 'Token tidak valid', code: 'INVALID_TOKEN_TYPE' })
  })
})
