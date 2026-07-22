function parsePagination(query, { defaultLimit = 100, maxLimit = 100 } = {}) {
  const page = query.page === undefined ? 1 : Number(query.page)
  const limit = query.limit === undefined ? defaultLimit : Number(query.limit)
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
    return null
  }
  return { page, limit, skip: (page - 1) * limit }
}

module.exports = { parsePagination }
