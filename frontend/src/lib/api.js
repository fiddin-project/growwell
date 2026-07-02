import client from '../api/client'

export function createCrudResource(basePath) {
  return {
    getAll:    (params) => client.get(basePath, { params }).then((r) => r.data),
    create:    (data)  => client.post(basePath, data).then((r) => r.data),
    update:    (id, data) => client.put(`${basePath}/${id}`, data).then((r) => r.data),
    delete:    (id) => client.delete(`${basePath}/${id}`).then((r) => r.data),
  }
}
