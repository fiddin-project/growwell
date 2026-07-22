package id.growwell.mobile.data

import android.content.Context
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

class GrowWellRepository(
    private val context: Context,
    private val api: GrowWellApi,
    private val tokenStore: TokenStore,
    private val dao: GrowWellDao,
) {
    suspend fun login(username: String, password: String): UserDto {
        val session = api.login(LoginRequest(username, password))
        require(session.user.role == "PENGASUH") { "Aplikasi Android saat ini khusus akun pengasuh" }
        tokenStore.save(session.accessToken, session.refreshToken)
        return session.user
    }

    suspend fun restoreSession(): UserDto? {
        val refresh = tokenStore.refreshToken() ?: return null
        return runCatching {
            val session = api.refresh(RefreshRequest(refreshToken = refresh))
            if (session.user.role != "PENGASUH") error("Role tidak didukung")
            tokenStore.save(session.accessToken, session.refreshToken)
            session.user
        }.onFailure { tokenStore.clear() }.getOrNull()
    }

    suspend fun logout() {
        tokenStore.refreshToken()?.let { refresh ->
            runCatching { api.logout(LogoutRequest(refreshToken = refresh)) }
        }
        tokenStore.clear()
        withContext(Dispatchers.IO) { dao.clearUserData() }
    }

    suspend fun dashboard() = api.dashboard()
    suspend fun children(): List<ChildDto> = withContext(Dispatchers.IO) {
        try {
            val remote = api.children()
            dao.deleteChildren()
            dao.saveChildren(remote.map { CachedChild(it.id, it.fullName, it.birthDate, it.gender, it.creator?.fullName, System.currentTimeMillis()) })
            remote
        } catch (error: IOException) {
            dao.children().map { ChildDto(it.id, it.name, it.birthDate, it.gender, it.creatorName?.let { name -> CreatorDto(0, name, null) }) }
        }
    }
    suspend fun createChild(request: CreateChildRequest) = api.createChild(request)
    suspend fun updateChild(id: Int, request: CreateChildRequest) = api.updateChild(id, request)
    suspend fun deleteChild(id: Int) = api.deleteChild(id)
    suspend fun education() = api.education()
    suspend fun psychologists() = api.psychologists()
    suspend fun screeningForm() = api.screeningForm()
    suspend fun submitScreening(request: ScreeningRequest): SubmissionOutcome {
        return try {
            val result = api.submitScreening(request)
            withContext(Dispatchers.IO) { dao.deleteDraft(request.childId); dao.deletePending(request.clientSubmissionId) }
            SubmissionOutcome.Confirmed(result)
        } catch (error: IOException) {
            val json = Gson().toJson(request.jawaban)
            withContext(Dispatchers.IO) {
                dao.savePending(PendingScreening(request.clientSubmissionId, request.childId, request.instrumentRevision, json, "PENDING", 0, null, System.currentTimeMillis()))
            }
            enqueueSync(request.clientSubmissionId)
            SubmissionOutcome.Queued(request.clientSubmissionId)
        }
    }

    suspend fun saveDraft(childId: Int, revision: String, answers: List<AnswerRequest>) = withContext(Dispatchers.IO) {
        dao.saveDraft(ScreeningDraft(childId, revision, Gson().toJson(answers), System.currentTimeMillis()))
    }

    suspend fun loadDraft(childId: Int): List<AnswerRequest> = withContext(Dispatchers.IO) {
        val draft = dao.draft(childId) ?: return@withContext emptyList()
        Gson().fromJson(draft.answersJson, object : TypeToken<List<AnswerRequest>>() {}.type)
    }

    suspend fun syncPending(id: String): Boolean {
        val pending = withContext(Dispatchers.IO) { dao.pending(id) } ?: return true
        val answers: List<AnswerRequest> = Gson().fromJson(pending.answersJson, object : TypeToken<List<AnswerRequest>>() {}.type)
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
    suspend fun monitoring(childId: Int) = api.monitoring(childId)
}
