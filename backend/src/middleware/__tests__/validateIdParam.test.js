const validateIdParam = require('../../middleware/validateIdParam')

describe('validateIdParam middleware', () => {
  function createReqParams(id) {
    return { params: { id } }
  }

  function createReply() {
    const reply = {
      status: vi.fn(() => reply),
      send: vi.fn(() => reply),
    }
    return reply
  }

  it('passes for valid positive integer id', async () => {
    const req = createReqParams('5')
    const reply = createReply()
    await validateIdParam(req, reply)
    expect(reply.status).not.toHaveBeenCalled()
    expect(req.params.id).toBe(5)
  })

  it('returns 400 for id = "0"', async () => {
    const req = createReqParams('0')
    const reply = createReply()
    await validateIdParam(req, reply)
    expect(reply.status).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith({ error: 'ID tidak valid' })
  })

  it('returns 400 for negative id', async () => {
    const req = createReqParams('-1')
    const reply = createReply()
    await validateIdParam(req, reply)
    expect(reply.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 for non-numeric string', async () => {
    const req = createReqParams('abc')
    const reply = createReply()
    await validateIdParam(req, reply)
    expect(reply.status).toHaveBeenCalledWith(400)
  })

  it('truncates decimal and passes (parseInt behavior)', async () => {
    const req = createReqParams('1.5')
    const reply = createReply()
    await validateIdParam(req, reply)
    expect(reply.status).not.toHaveBeenCalled()
    expect(req.params.id).toBe(1)
  })

  it('returns 400 for empty string', async () => {
    const req = createReqParams('')
    const reply = createReply()
    await validateIdParam(req, reply)
    expect(reply.status).toHaveBeenCalledWith(400)
  })

  it('converts string id to integer', async () => {
    const req = createReqParams('42')
    const reply = createReply()
    await validateIdParam(req, reply)
    expect(req.params.id).toBe(42)
    expect(typeof req.params.id).toBe('number')
  })
})
