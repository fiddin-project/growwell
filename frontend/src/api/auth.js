import client from './client'

export async function login(username, password) {
  const { data } = await client.post('/auth/login', { username, password, client_type: 'web' })
  return data
}

export async function refreshSession() {
  const { data } = await client.post('/auth/refresh', { client_type: 'web' })
  return data
}

export async function logout() {
  await client.post('/auth/logout', { client_type: 'web' })
}

export async function getMe() {
  const { data } = await client.get('/auth/me')
  return data
}
