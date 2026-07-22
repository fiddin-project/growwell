function getPublicBaseUrl() {
  const configured = process.env.PUBLIC_BASE_URL || 'http://localhost:3001'
  const url = new URL(configured)
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('PUBLIC_BASE_URL must use http or https')
  }
  return url.toString().replace(/\/$/, '')
}

function resolvePublicUrl(value) {
  if (!value) return value
  if (/^https?:\/\//i.test(value)) return value
  return new URL(value.startsWith('/') ? value : `/${value}`, `${getPublicBaseUrl()}/`).toString()
}

function educationResponse(item) {
  return { ...item, asset_url: resolvePublicUrl(item.url_atau_file) }
}

module.exports = { educationResponse, getPublicBaseUrl, resolvePublicUrl }
