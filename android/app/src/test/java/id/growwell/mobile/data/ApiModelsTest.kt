package id.growwell.mobile.data

import com.google.gson.Gson
import id.growwell.mobile.data.remote.dto.DashboardDto
import id.growwell.mobile.data.remote.dto.MonitoringDto
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test

class ApiModelsTest {
    private val gson = Gson()

    @Test
    fun dashboardKeepsChildAndSubmissionIdentity() {
        val json = """
            {
              "recentScreenings": [{
                "id": 7,
                "anak_id": 3,
                "client_submission_id": "3d57f24d-0ec1-45d8-bca9-d679c7598c21",
                "tanggal_skrining": "2026-07-23T10:00:00.000Z",
                "total_score": 14,
                "kategori_total": "Borderline",
                "anak": {"id": 3, "nama": "Alya"}
              }]
            }
        """.trimIndent()

        val screening = gson.fromJson(json, DashboardDto::class.java).recentScreenings.single()

        assertEquals("Alya", screening.child?.fullName)
        assertEquals("3d57f24d-0ec1-45d8-bca9-d679c7598c21", screening.clientSubmissionId)
        assertEquals("2026-07-23T10:00:00.000Z", screening.createdAt)
    }

    @Test
    fun monitoringKeepsChildThresholdsAndScaleDetails() {
        val json = """
            {
              "anak": {
                "nama": "Alya",
                "tanggal_lahir": "2020-01-02T00:00:00.000Z",
                "jenis_kelamin": "P"
              },
              "threshold_total": {
                "batas_normal_max": 13,
                "batas_borderline_max": 16
              },
              "riwayat": [{
                "id": 8,
                "total_score": 12,
                "kategori_total": "Normal",
                "per_skala": [{
                  "id_skala": "E",
                  "skor": 2,
                  "kategori": "Normal",
                  "nama_skala": "Gejala Emosional"
                }]
              }]
            }
        """.trimIndent()

        val monitoring = gson.fromJson(json, MonitoringDto::class.java)

        assertEquals("Alya", monitoring.child?.fullName)
        assertEquals(13, monitoring.thresholdTotal?.normalMax)
        assertNotNull(monitoring.riwayat.single().perScale.single())
        assertEquals("E", monitoring.riwayat.single().perScale.single().scaleId)
    }
}
