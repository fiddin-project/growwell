import client from '../api/client'

export function createCrudResource(basePath, { multipart = false } = {}) {
  const config = multipart ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
  return {
    getAll:    (params) => client.get(basePath, { params }).then((r) => r.data),
    create:    (data)  => client.post(basePath, data, config).then((r) => r.data),
    update:    (id, data) => client.put(`${basePath}/${id}`, data, config).then((r) => r.data),
    delete:    (id) => client.delete(`${basePath}/${id}`).then((r) => r.data),
  }
}
