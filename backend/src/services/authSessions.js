const {
  generateId,
  generateOpaqueToken,
  hashOpaqueToken,
  refreshExpiryDate,
} = require('../lib/authTokens')

function sessionMetadata(req) {
  return {
    user_agent: String(req.headers['user-agent'] || '').slice(0, 255) || null,
    ip_address: String(req.ip || '').slice(0, 64) || null,
  }
}

async function createRefreshSession(prisma, userId, req, familyId = generateId()) {
  const refreshToken = generateOpaqueToken()
  const session = await prisma.refreshSession.create({
    data: {
      family_id: familyId,
      user_id: userId,
      token_hash: hashOpaqueToken(refreshToken),
      expires_at: refreshExpiryDate(),
      ...sessionMetadata(req),
    },
  })
  return { refreshToken, session }
}

async function revokeFamily(prisma, familyId, now = new Date()) {
  await prisma.refreshSession.updateMany({
    where: { family_id: familyId, revoked_at: null },
    data: { revoked_at: now },
  })
}

async function rotateRefreshSession(prisma, presentedToken, req) {
  const tokenHash = hashOpaqueToken(presentedToken)
  const existing = await prisma.refreshSession.findUnique({
    where: { token_hash: tokenHash },
    include: { user: true },
  })

  if (!existing) return { error: 'INVALID' }

  const now = new Date()
  if (existing.revoked_at) {
    await revokeFamily(prisma, existing.family_id, now)
    return { error: 'REUSED' }
  }
  if (existing.expires_at <= now) {
    await prisma.refreshSession.update({
      where: { id: existing.id },
      data: { revoked_at: now },
    })
    return { error: 'EXPIRED' }
  }

  const refreshToken = generateOpaqueToken()
  const replacementId = generateId()
  const result = await prisma.$transaction(async (tx) => {
    const claimed = await tx.refreshSession.updateMany({
      where: { id: existing.id, revoked_at: null },
      data: {
        revoked_at: now,
        last_used_at: now,
        replaced_by_id: replacementId,
      },
    })
    if (claimed.count !== 1) return null

    await tx.refreshSession.create({
      data: {
        id: replacementId,
        family_id: existing.family_id,
        user_id: existing.user_id,
        token_hash: hashOpaqueToken(refreshToken),
        expires_at: refreshExpiryDate(now),
        ...sessionMetadata(req),
      },
    })
    return true
  })

  if (!result) {
    await revokeFamily(prisma, existing.family_id, now)
    return { error: 'REUSED' }
  }

  return { refreshToken, user: existing.user }
}

async function revokePresentedSession(prisma, presentedToken) {
  if (!presentedToken) return
  await prisma.refreshSession.updateMany({
    where: { token_hash: hashOpaqueToken(presentedToken), revoked_at: null },
    data: { revoked_at: new Date() },
  })
}

module.exports = {
  createRefreshSession,
  revokeFamily,
  revokePresentedSession,
  rotateRefreshSession,
}
