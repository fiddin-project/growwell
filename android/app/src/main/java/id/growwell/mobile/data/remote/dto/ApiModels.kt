package id.growwell.mobile.data.remote.dto

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val username: String,
    val password: String,
    @SerializedName("client_type") val clientType: String = "android",
)

data class RefreshRequest(
    @SerializedName("client_type") val clientType: String = "android",
    @SerializedName("refresh_token") val refreshToken: String,
)

data class LogoutRequest(
    @SerializedName("client_type") val clientType: String = "android",
    @SerializedName("refresh_token") val refreshToken: String,
)

data class SessionResponse(
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("refresh_token") val refreshToken: String?,
    @SerializedName("expires_in") val expiresIn: Long,
    val user: UserDto,
)

data class UserDto(
    val id: Int,
    val username: String,
    @SerializedName("nama_lengkap") val fullName: String,
    val role: String,
)

data class CreatorDto(
    val id: Int,
    @SerializedName("nama_lengkap") val fullName: String?,
    val role: String?,
)

data class ChildDto(
    val id: Int,
    @SerializedName("nama") val fullName: String,
    @SerializedName("tanggal_lahir") val birthDate: String,
    @SerializedName("jenis_kelamin") val gender: String,
    val creator: CreatorDto?,
)

data class CreateChildRequest(
    @SerializedName("nama") val fullName: String,
    @SerializedName("tanggal_lahir") val birthDate: String,
    @SerializedName("jenis_kelamin") val gender: String,
)

data class DashboardDto(
    val recentScreenings: List<ScreeningDto> = emptyList(),
)

data class ScreeningChildDto(
    val id: Int,
    @SerializedName("nama") val fullName: String,
)

data class ScaleDto(
    @SerializedName("id_skala") val id: String,
    @SerializedName("nama_skala") val name: String,
    @SerializedName("nama_skala_en") val englishName: String?,
)

data class QuestionDto(
    val id: Int,
    @SerializedName("teks_pertanyaan") val text: String,
    @SerializedName("teks_pertanyaan_en") val englishText: String?,
    @SerializedName("id_skala") val scaleId: String,
)

data class ScreeningFormDto(
    @SerializedName("instrument_revision") val revision: String,
    val scales: List<ScaleDto> = emptyList(),
    val questions: List<QuestionDto> = emptyList(),
)

data class AnswerRequest(
    @SerializedName("id_pertanyaan") val questionId: Int,
    val jawaban: String,
)

data class ScreeningRequest(
    @SerializedName("anak_id") val childId: Int,
    @SerializedName("client_submission_id") val clientSubmissionId: String,
    @SerializedName("instrument_revision") val instrumentRevision: String,
    val jawaban: List<AnswerRequest>,
)

data class ScreeningDto(
    val id: Int,
    @SerializedName("anak_id") val childId: Int?,
    @SerializedName("client_submission_id") val clientSubmissionId: String? = null,
    @SerializedName("total_score") val totalScore: Int?,
    @SerializedName("kategori_total") val category: String?,
    @SerializedName("tanggal_skrining") val createdAt: String?,
    val performer: CreatorDto? = null,
    @SerializedName("anak") val child: ScreeningChildDto? = null,
    @SerializedName("per_skala") val perScale: List<ScaleResultDto> = emptyList(),
)

data class ScaleResultDto(
    @SerializedName("id_skala") val scaleId: String,
    val skor: Int,
    val kategori: String,
    @SerializedName("nama_skala") val scaleName: String? = null,
)

data class EducationDto(
    val id: Int,
    val judul: String,
    @SerializedName("judul_en") val englishTitle: String?,
    val deskripsi: String?,
    @SerializedName("deskripsi_en") val englishDescription: String?,
    val tipe: String,
    @SerializedName("asset_url") val assetUrl: String?,
    @SerializedName("url_atau_file") val source: String?,
)

data class PsychologistDto(
    val id: Int,
    val nama: String,
    val spesialisasi: String?,
    @SerializedName("spesialisasi_en") val englishSpecialization: String?,
    @SerializedName("nomor_whatsapp") val phone: String?,
    @SerializedName("pesan_default") val defaultMessage: String?,
    @SerializedName("pesan_default_en") val englishDefaultMessage: String?,
)

data class ThresholdDto(
    @SerializedName("batas_normal_max") val normalMax: Int,
    @SerializedName("batas_borderline_max") val borderlineMax: Int,
)

data class MonitoringDto(
    @SerializedName("anak") val child: MonitoringChildDto?,
    @SerializedName("threshold_total") val thresholdTotal: ThresholdDto?,
    val riwayat: List<ScreeningDto> = emptyList(),
)

data class MonitoringChildDto(
    @SerializedName("nama") val fullName: String,
    @SerializedName("tanggal_lahir") val birthDate: String,
    @SerializedName("jenis_kelamin") val gender: String,
)

data class ApiErrorDto(
    val error: String?,
    val code: String?,
    @SerializedName("request_id") val requestId: String?,
)
