import client from './client'

export function getChildren() {
  return client.get('/pengasuh/anak').then((r) => r.data)
}

export function createChild(data) {
  return client.post('/pengasuh/anak', data).then((r) => r.data)
}

export function getPertanyaan(idSkala) {
  const params = idSkala ? { id_skala: idSkala } : {}
  return client.get('/pengasuh/pertanyaan', { params }).then((r) => r.data)
}


export function getScreenings(anakId) {
  return client.get(`/pengasuh/skrining/${anakId}`).then((r) => r.data)
}

export function getScreeningDetail(id) {
  return client.get(`/pengasuh/skrining/detail/${id}`).then((r) => r.data)
}

export function submitScreening(data) {
  return client.post('/pengasuh/skrining', data).then((r) => r.data)
}

export function getEdukasi() {
  return client.get('/pengasuh/edukasi').then((r) => r.data)
}

export function getPsikolog() {
  return client.get('/pengasuh/psikolog').then((r) => r.data)
}

export function getMonitoring(anakId) {
  return client.get(`/pengasuh/monitoring/${anakId}`).then((r) => r.data)
}

export function getDashboard() {
  return client.get('/pengasuh/dashboard').then((r) => r.data)
}
