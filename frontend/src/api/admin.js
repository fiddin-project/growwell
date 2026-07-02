import client from './client'
import { createCrudResource } from '../lib/api'

export function getDashboard() {
  return client.get('/admin/dashboard').then((r) => r.data)
}

export function getAmbangBatas() {
  return client.get('/admin/ambang-batas').then((r) => r.data)
}

export function updateAmbangBatas(id, data) {
  return client.put(`/admin/ambang-batas/${id}`, data).then((r) => r.data)
}

export function resetAmbangBatas() {
  return client.post('/admin/ambang-batas/reset').then((r) => r.data)
}

const users = createCrudResource('/admin/users')
export const getUsers = users.getAll
export const createUser = users.create
export const updateUser = users.update
export const deleteUser = users.delete

const skala = createCrudResource('/admin/skala')
export const getSkala = skala.getAll
export const createSkala = skala.create
export const updateSkala = skala.update
export const deleteSkala = skala.delete

const pertanyaan = createCrudResource('/admin/pertanyaan')
export const getPertanyaan = pertanyaan.getAll
export const createPertanyaan = pertanyaan.create
export const updatePertanyaan = pertanyaan.update
export const deletePertanyaan = pertanyaan.delete

const anak = createCrudResource('/admin/anak')
export const getAnak = anak.getAll
export const createAnak = anak.create
export const updateAnak = anak.update
export const deleteAnak = anak.delete

const edukasi = createCrudResource('/admin/edukasi')
export const getEdukasi = edukasi.getAll
export const createEdukasi = edukasi.create
export const updateEdukasi = edukasi.update
export const deleteEdukasi = edukasi.delete

const psikolog = createCrudResource('/admin/psikolog')
export const getPsikolog = psikolog.getAll
export const createPsikolog = psikolog.create
export const updatePsikolog = psikolog.update
export const deletePsikolog = psikolog.delete
