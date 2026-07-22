function defaultErrorCode(statusCode) {
  const codes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    413: 'PAYLOAD_TOO_LARGE',
    415: 'UNSUPPORTED_MEDIA_TYPE',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_ERROR',
    503: 'SERVICE_UNAVAILABLE',
  }
  return codes[statusCode] || `HTTP_${statusCode}`
}

async function errorEnvelope(req, reply, payload) {
  if (reply.statusCode < 400 || typeof payload !== 'string') return payload
  const contentType = reply.getHeader('content-type') || ''
  if (!String(contentType).includes('application/json')) return payload

  try {
    const body = JSON.parse(payload)
    if (typeof body.error !== 'string') return payload
    return JSON.stringify({
      ...body,
      code: body.code || defaultErrorCode(reply.statusCode),
      details: Array.isArray(body.details) ? body.details : [],
      request_id: body.request_id || req.id,
    })
  } catch {
    return payload
  }
}

module.exports = errorEnvelope
