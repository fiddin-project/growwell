const requireRole = require('../../middleware/requireRole')

describe('requireRole middleware', () => {
  function createReq(role) {
    return { user: { id: 1, role } }
  }

  function createReply() {
    const reply = {
      status: vi.fn(() => reply),
      send: vi.fn(() => reply),
    }
    return reply
  }

  it('allows access when role matches', async () => {
    const req = createReq('ADMIN')
    const reply = createReply()
    const middleware = requireRole('ADMIN')
    const result = await middleware(req, reply)
    expect(reply.status).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('denies access when role does not match', async () => {
    const req = createReq('PENGASUH')
    const reply = createReply()
    const middleware = requireRole('ADMIN')
    await middleware(req, reply)
    expect(reply.status).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith({ error: 'Akses ditolak: hak akses tidak cukup' })
  })

  it('denies access for ADMIN on PENGASUH route', async () => {
    const req = createReq('ADMIN')
    const reply = createReply()
    const middleware = requireRole('PENGASUH')
    await middleware(req, reply)
    expect(reply.status).toHaveBeenCalledWith(403)
  })

  it('allows PENGASUH on PENGASUH route', async () => {
    const req = createReq('PENGASUH')
    const reply = createReply()
    const middleware = requireRole('PENGASUH')
    await middleware(req, reply)
    expect(reply.status).not.toHaveBeenCalled()
  })
})
