package id.growwell.mobile.data.remote

import id.growwell.mobile.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.*

interface GrowWellApi {
    @POST("auth/login") suspend fun login(@Body request: LoginRequest): SessionResponse
    @POST("auth/refresh") suspend fun refresh(@Body request: RefreshRequest): SessionResponse
    @POST("auth/logout") suspend fun logout(@Body request: LogoutRequest): Response<Unit>
    @POST("auth/logout-all") suspend fun logoutAll(): Response<Unit>
    @GET("auth/me") suspend fun me(): UserDto

    @GET("pengasuh/dashboard") suspend fun dashboard(): DashboardDto
    @GET("pengasuh/anak") suspend fun children(): List<ChildDto>
    @POST("pengasuh/anak") suspend fun createChild(@Body request: CreateChildRequest): ChildDto
    @PUT("pengasuh/anak/{id}") suspend fun updateChild(@Path("id") id: Int, @Body request: CreateChildRequest): ChildDto
    @DELETE("pengasuh/anak/{id}") suspend fun deleteChild(@Path("id") id: Int): Response<Unit>
    @GET("pengasuh/screening-form") suspend fun screeningForm(): ScreeningFormDto
    @POST("pengasuh/skrining") suspend fun submitScreening(@Body request: ScreeningRequest): ScreeningDto
    @GET("pengasuh/skrining/{childId}") suspend fun screenings(@Path("childId") childId: Int): List<ScreeningDto>
    @GET("pengasuh/monitoring/{childId}") suspend fun monitoring(@Path("childId") childId: Int): MonitoringDto
    @GET("pengasuh/edukasi") suspend fun education(): List<EducationDto>
    @GET("pengasuh/psikolog") suspend fun psychologists(): List<PsychologistDto>
}

interface SessionApi {
    @POST("auth/refresh") fun refreshBlocking(@Body request: RefreshRequest): retrofit2.Call<SessionResponse>
}
