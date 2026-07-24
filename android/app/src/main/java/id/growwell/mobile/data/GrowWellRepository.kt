package id.growwell.mobile.data

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import androidx.work.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import id.growwell.mobile.data.local.*
import id.growwell.mobile.data.remote.GrowWellApi
import id.growwell.mobile.data.remote.dto.*
import id.growwell.mobile.data.session.TokenStore
import id.growwell.mobile.sync.ScreeningSyncWorker
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.IOException
import java.util.concurrent.TimeUnit
import retrofit2.HttpException

sealed interface SubmissionOutcome {
    data class Confirmed(val result: ScreeningDto) : SubmissionOutcome
    data class Queued(val submissionId: String) : SubmissionOutcome
}

data class PendingSubmissionStatus(
    val submissionId: String,
    val childId: Int,
    val state: String,
    val lastErrorCode: String?,
)

class UnsupportedRoleException : IllegalArgumentException()

class GrowWellRepository(
    private val context: Context,
    private val api: GrowWellApi,
    private val tokenStore: TokenStore,
    private val dao: GrowWellDao,
) {
    private val gson = Gson()
    suspend fun login(username: String, password: String): UserDto {
        val session = api.login(LoginRequest(username, password))
        if (session.user.role != "PENGASUH") {
            session.refreshToken?.let { runCatching { api.logout(LogoutRequest(refreshToken = it)) } }
            throw UnsupportedRoleException()
        }
        tokenStore.save(session.accessToken, session.refreshToken, session.user)
        return session.user
    }

    suspend fun restoreSession(): UserDto? {
        val refresh = tokenStore.refreshToken() ?: return null
        return try {
            val session = api.refresh(RefreshRequest(refreshToken = refresh))
            if (session.user.role != "PENGASUH") error("Role tidak didukung")
            tokenStore.save(session.accessToken, session.refreshToken, session.user)
            session.user
        } catch (_: IOException) {
            tokenStore.cachedUser()?.takeIf { it.role == "PENGASUH" }
        } catch (error: HttpException) {
            if (error.code() == 401 || error.code() == 403) {
                clearLocalSession()
                null
            } else {
                tokenStore.cachedUser()?.takeIf { it.role == "PENGASUH" }
            }
        } catch (_: Exception) {
            clearLocalSession()
            null
        }
    }

    suspend fun logout() {
        tokenStore.refreshToken()?.let { refresh ->
            runCatching { api.logout(LogoutRequest(refreshToken = refresh)) }
        }
        clearLocalSession()
    }

    suspend fun clearLocalSession() {
        tokenStore.clear()
        withContext(Dispatchers.IO) { dao.clearUserData() }
    }

    fun hasStoredSession(): Boolean = tokenStore.hasSession()

    fun isNetworkAvailable(): Boolean {
        val manager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = manager.activeNetwork ?: return false
        val capabilities = manager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
            capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }

    suspend fun dashboard(): DashboardDto = cachedRequest(CACHE_DASHBOARD, DashboardDto::class.java) { api.dashboard() }
    suspend fun children(): List<ChildDto> = withContext(Dispatchers.IO) {
        try {
            val remote = api.children()
            dao.deleteChildren()
            dao.saveChildren(remote.map { CachedChild(it.id, it.fullName, it.birthDate, it.gender, it.creator?.fullName, System.currentTimeMillis()) })
            remote
        } catch (error: Throwable) {
            if (!canUseCache(error)) throw error
            dao.children().map { ChildDto(it.id, it.name, it.birthDate, it.gender, it.creatorName?.let { name -> CreatorDto(0, name, null) }) }
        }
    }
    suspend fun createChild(request: CreateChildRequest) = api.createChild(request)
    suspend fun updateChild(id: Int, request: CreateChildRequest) = api.updateChild(id, request)
    suspend fun deleteChild(id: Int) = api.deleteChild(id)
    suspend fun education(): List<EducationDto> = cachedListRequest(CACHE_EDUCATION) { api.education() }
    suspend fun psychologists(): List<PsychologistDto> = cachedListRequest(CACHE_PSYCHOLOGISTS) { api.psychologists() }
    suspend fun screeningForm(): ScreeningFormDto =
        cachedRequest(CACHE_SCREENING_FORM, ScreeningFormDto::class.java) { api.screeningForm() }
    suspend fun submitScreening(request: ScreeningRequest): SubmissionOutcome {
        return try {
            val result = api.submitScreening(request)
            withContext(Dispatchers.IO) { dao.deleteDraft(request.childId); dao.deletePending(request.clientSubmissionId) }
            SubmissionOutcome.Confirmed(result)
        } catch (error: IOException) {
            val json = gson.toJson(request.jawaban)
            withContext(Dispatchers.IO) {
                dao.savePending(PendingScreening(request.clientSubmissionId, request.childId, request.instrumentRevision, json, "PENDING", 0, null, System.currentTimeMillis()))
            }
            enqueueSync(request.clientSubmissionId)
            SubmissionOutcome.Queued(request.clientSubmissionId)
        }
    }

    suspend fun saveDraft(childId: Int, revision: String, answers: List<AnswerRequest>) = withContext(Dispatchers.IO) {
        dao.saveDraft(ScreeningDraft(childId, revision, gson.toJson(answers), System.currentTimeMillis()))
    }

    suspend fun loadDraft(childId: Int): List<AnswerRequest> = withContext(Dispatchers.IO) {
        val draft = dao.draft(childId) ?: return@withContext emptyList()
        gson.fromJson(draft.answersJson, object : TypeToken<List<AnswerRequest>>() {}.type)
    }

    suspend fun pendingStatus(id: String): PendingSubmissionStatus? = withContext(Dispatchers.IO) {
        dao.pending(id)?.let {
            PendingSubmissionStatus(it.submissionId, it.childId, it.state, it.lastErrorCode)
        }
    }

    suspend fun latestPendingStatus(): PendingSubmissionStatus? = withContext(Dispatchers.IO) {
        dao.latestPending()?.let {
            PendingSubmissionStatus(it.submissionId, it.childId, it.state, it.lastErrorCode)
        }
    }

    suspend fun discardPendingSubmission(id: String) = withContext(Dispatchers.IO) {
        dao.deletePending(id)
    }

    suspend fun syncPending(id: String): Boolean {
        val pending = withContext(Dispatchers.IO) { dao.pending(id) } ?: return true
        val answers: List<AnswerRequest> = gson.fromJson(pending.answersJson, object : TypeToken<List<AnswerRequest>>() {}.type)
        return try {
            api.submitScreening(ScreeningRequest(pending.childId, pending.submissionId, pending.instrumentRevision, answers))
            withContext(Dispatchers.IO) { dao.deletePending(id); dao.deleteDraft(pending.childId) }
            true
        } catch (error: IOException) {
            withContext(Dispatchers.IO) {
                pending.state = "FAILED_RETRYABLE"; pending.attemptCount += 1; pending.lastErrorCode = "NETWORK"
                dao.savePending(pending)
            }
            false
        } catch (error: HttpException) {
            val status = error.code()
            val retryable = status >= 500
            withContext(Dispatchers.IO) {
                pending.state = if (retryable) "FAILED_RETRYABLE" else if (status == 409) "FAILED_STALE" else "FAILED"
                pending.attemptCount += 1
                pending.lastErrorCode = "HTTP_$status"
                dao.savePending(pending)
            }
            !retryable
        }
    }

    private fun enqueueSync(id: String) {
        val request = OneTimeWorkRequestBuilder<ScreeningSyncWorker>()
            .setInputData(workDataOf(ScreeningSyncWorker.SUBMISSION_ID to id))
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, TimeUnit.SECONDS)
            .build()
        WorkManager.getInstance(context).enqueueUniqueWork("screening-$id", ExistingWorkPolicy.KEEP, request)
    }
    suspend fun screenings(childId: Int) = api.screenings(childId)
    suspend fun monitoring(childId: Int): MonitoringDto =
        cachedRequest("$CACHE_MONITORING_PREFIX$childId", MonitoringDto::class.java) { api.monitoring(childId) }

    private suspend fun <T> cachedRequest(
        key: String,
        clazz: Class<T>,
        remote: suspend () -> T,
    ): T = withContext(Dispatchers.IO) {
        try {
            remote().also { dao.saveCachedPayload(CachedPayload(key, gson.toJson(it), System.currentTimeMillis())) }
        } catch (error: Throwable) {
            if (!canUseCache(error)) throw error
            val cached = dao.cachedPayload(key) ?: throw error
            gson.fromJson(cached.json, clazz)
        }
    }

    private suspend inline fun <reified T> cachedListRequest(
        key: String,
        crossinline remote: suspend () -> List<T>,
    ): List<T> = withContext(Dispatchers.IO) {
        try {
            remote().also { dao.saveCachedPayload(CachedPayload(key, gson.toJson(it), System.currentTimeMillis())) }
        } catch (error: Throwable) {
            if (!canUseCache(error)) throw error
            val cached = dao.cachedPayload(key) ?: throw error
            gson.fromJson(cached.json, object : TypeToken<List<T>>() {}.type)
        }
    }

    private fun canUseCache(error: Throwable): Boolean =
        error is IOException || (error is HttpException && error.code() >= 500)

    private companion object {
        const val CACHE_DASHBOARD = "dashboard"
        const val CACHE_EDUCATION = "education"
        const val CACHE_PSYCHOLOGISTS = "psychologists"
        const val CACHE_SCREENING_FORM = "screening_form"
        const val CACHE_MONITORING_PREFIX = "monitoring_"
    }
}
