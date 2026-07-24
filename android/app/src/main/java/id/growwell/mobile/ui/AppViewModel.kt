package id.growwell.mobile.ui

import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import id.growwell.mobile.data.GrowWellRepository
import id.growwell.mobile.data.SubmissionOutcome
import id.growwell.mobile.data.PendingSubmissionStatus
import id.growwell.mobile.data.UnsupportedRoleException
import id.growwell.mobile.data.locale.AppLanguage
import id.growwell.mobile.data.locale.LanguageStore
import id.growwell.mobile.data.remote.dto.*
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import kotlinx.coroutines.Job
import kotlinx.coroutines.supervisorScope
import retrofit2.HttpException
import java.util.UUID

sealed interface SessionState {
    data object Loading : SessionState
    data object SignedOut : SessionState
    data class SignedIn(val user: UserDto) : SessionState
}

data class AppContentState(
    val loading: Boolean = false,
    val offline: Boolean = false,
    val dashboard: DashboardDto? = null,
    val children: List<ChildDto> = emptyList(),
    val education: List<EducationDto> = emptyList(),
    val psychologists: List<PsychologistDto> = emptyList(),
    val selectedScreeningChildId: Int? = null,
    val screeningSubmissionId: String? = null,
    val screeningForm: ScreeningFormDto? = null,
    val screeningResult: ScreeningDto? = null,
    val pendingSubmissionId: String? = null,
    val pendingSubmissionState: String? = null,
    val pendingSubmissionErrorCode: String? = null,
    val draftAnswers: List<AnswerRequest> = emptyList(),
    val selectedMonitoringChildId: Int? = null,
    val monitoring: MonitoringDto? = null,
    val error: UiError? = null,
)

enum class UiError {
    LOGIN, LOGIN_UNSUPPORTED_ROLE, LOAD_DATA, CREATE_CHILD, UPDATE_CHILD, DELETE_CHILD, DELETE_CHILD_HAS_HISTORY,
    LOAD_MONITORING, LOAD_SCREENING, SUBMIT_SCREENING,
}

class AppViewModel(
    private val repository: GrowWellRepository,
    private val languageStore: LanguageStore,
) : ViewModel() {
    private var pendingObserverJob: Job? = null
    private val _session = MutableStateFlow<SessionState>(SessionState.Loading)
    val session: StateFlow<SessionState> = _session.asStateFlow()
    private val _content = MutableStateFlow(AppContentState())
    val content: StateFlow<AppContentState> = _content.asStateFlow()
    val language: StateFlow<AppLanguage> = languageStore.language.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5_000),
        AppLanguage.fromTag(AppCompatDelegate.getApplicationLocales().toLanguageTags()),
    )

    init { viewModelScope.launch { _session.value = repository.restoreSession()?.let(SessionState::SignedIn) ?: SessionState.SignedOut } }

    fun login(username: String, password: String) = viewModelScope.launch {
        _session.value = SessionState.Loading
        runCatching { repository.login(username.trim(), password) }
            .onSuccess { _session.value = SessionState.SignedIn(it); refresh() }
            .onFailure {
                _content.value = _content.value.copy(
                    error = if (it is UnsupportedRoleException) UiError.LOGIN_UNSUPPORTED_ROLE else UiError.LOGIN,
                )
                _session.value = SessionState.SignedOut
            }
    }

    fun logout() = viewModelScope.launch {
        repository.logout()
        _content.value = AppContentState()
        _session.value = SessionState.SignedOut
    }

    fun refresh() = viewModelScope.launch {
        _content.value = _content.value.copy(loading = true, error = null)
        val results = supervisorScope {
            val dashboard = async { runCatching { repository.dashboard() } }
            val children = async { runCatching { repository.children() } }
            val education = async { runCatching { repository.education() } }
            val psychologists = async { runCatching { repository.psychologists() } }
            listOf(dashboard.await(), children.await(), education.await(), psychologists.await())
        }
        val authenticationFailure = results.mapNotNull(Result<*>::exceptionOrNull)
            .firstOrNull(::shouldSignOut)
        if (authenticationFailure != null) {
            handleFailure(authenticationFailure, UiError.LOAD_DATA)
            return@launch
        }
        @Suppress("UNCHECKED_CAST")
        _content.value = _content.value.copy(
            loading = false,
            offline = !repository.isNetworkAvailable(),
            dashboard = (results[0] as Result<DashboardDto>).getOrNull() ?: _content.value.dashboard,
            children = (results[1] as Result<List<ChildDto>>).getOrNull() ?: _content.value.children,
            education = (results[2] as Result<List<EducationDto>>).getOrNull() ?: _content.value.education,
            psychologists = (results[3] as Result<List<PsychologistDto>>).getOrNull() ?: _content.value.psychologists,
            error = if (results.any(Result<*>::isFailure)) UiError.LOAD_DATA else null,
        )
        repository.latestPendingStatus()?.let(::recoverPendingSubmission)
    }

    fun createChild(request: CreateChildRequest) = viewModelScope.launch {
        runCatching { repository.createChild(request) }
            .onSuccess { refresh() }
            .onFailure { handleFailure(it, UiError.CREATE_CHILD) }
    }

    fun updateChild(id: Int, request: CreateChildRequest) = viewModelScope.launch {
        runCatching { repository.updateChild(id, request) }
            .onSuccess { refresh() }
            .onFailure { handleFailure(it, UiError.UPDATE_CHILD) }
    }

    fun deleteChild(id: Int) = viewModelScope.launch {
        runCatching { repository.deleteChild(id) }
            .onSuccess { refresh() }
            .onFailure { handleFailure(it, UiError.DELETE_CHILD) }
    }

    fun loadMonitoring(childId: Int) = viewModelScope.launch {
        _content.value = _content.value.copy(
            loading = true,
            error = null,
            selectedMonitoringChildId = childId,
            monitoring = null,
        )
        runCatching { repository.monitoring(childId) }
            .onSuccess {
                _content.value = _content.value.copy(
                    loading = false,
                    offline = !repository.isNetworkAvailable(),
                    monitoring = it,
                )
            }
            .onFailure { error ->
                _content.value = _content.value.copy(
                    loading = false,
                    monitoring = null,
                )
                handleFailure(error, UiError.LOAD_MONITORING)
            }
    }

    fun startScreening(childId: Int) = viewModelScope.launch {
        _content.value = _content.value.copy(
            loading = true,
            error = null,
            selectedScreeningChildId = childId,
            screeningSubmissionId = UUID.randomUUID().toString(),
            screeningForm = null,
            screeningResult = null,
            pendingSubmissionId = null,
            pendingSubmissionState = null,
            pendingSubmissionErrorCode = null,
            draftAnswers = emptyList(),
        )
        runCatching {
            val form = async { repository.screeningForm() }
            val draft = async { repository.loadDraft(childId) }
            form.await() to draft.await()
        }
            .onSuccess { (form, draft) ->
                _content.value = _content.value.copy(
                    loading = false,
                    offline = !repository.isNetworkAvailable(),
                    screeningForm = form,
                    draftAnswers = draft,
                )
            }
            .onFailure {
                _content.value = _content.value.copy(loading = false)
                handleFailure(it, UiError.LOAD_SCREENING)
            }
    }

    fun submitScreening(request: ScreeningRequest) = viewModelScope.launch {
        _content.value = _content.value.copy(loading = true, error = null)
        runCatching { repository.submitScreening(request) }
            .onSuccess { outcome ->
                _content.value = when (outcome) {
                    is SubmissionOutcome.Confirmed -> _content.value.copy(
                        loading = false,
                        screeningResult = outcome.result,
                        pendingSubmissionId = null,
                        pendingSubmissionState = null,
                        pendingSubmissionErrorCode = null,
                    )
                    is SubmissionOutcome.Queued -> {
                        observePendingSubmission(outcome.submissionId, request.childId)
                        _content.value.copy(
                            loading = false,
                            screeningResult = null,
                            pendingSubmissionId = outcome.submissionId,
                            pendingSubmissionState = "PENDING",
                            pendingSubmissionErrorCode = null,
                        )
                    }
                }
            }
            .onFailure {
                _content.value = _content.value.copy(loading = false)
                handleFailure(it, UiError.SUBMIT_SCREENING)
            }
    }

    fun saveDraft(childId: Int, revision: String, answers: List<AnswerRequest>) = viewModelScope.launch {
        if (_content.value.selectedScreeningChildId == childId) {
            _content.value = _content.value.copy(draftAnswers = answers)
        }
        repository.saveDraft(childId, revision, answers)
    }

    fun resetScreening() {
        _content.value = _content.value.copy(
            selectedScreeningChildId = null,
            screeningSubmissionId = null,
            screeningForm = null,
            screeningResult = null,
            pendingSubmissionId = null,
            pendingSubmissionState = null,
            pendingSubmissionErrorCode = null,
            draftAnswers = emptyList(),
        )
    }

    fun reviewFailedSubmission() = viewModelScope.launch {
        _content.value.pendingSubmissionId?.let { repository.discardPendingSubmission(it) }
        pendingObserverJob?.cancel()
        resetScreening()
    }

    fun clearError() { _content.value = _content.value.copy(error = null) }

    private fun shouldSignOut(error: Throwable): Boolean =
        error is HttpException && (
            error.code() == 403 ||
                (error.code() == 401 && !repository.hasStoredSession())
            )

    private suspend fun handleFailure(error: Throwable, fallback: UiError) {
        if (shouldSignOut(error)) {
            repository.clearLocalSession()
            _content.value = AppContentState()
            _session.value = SessionState.SignedOut
        } else {
            val resolved = if (
                fallback == UiError.DELETE_CHILD &&
                error is HttpException &&
                error.code() == 400
            ) {
                UiError.DELETE_CHILD_HAS_HISTORY
            } else {
                fallback
            }
            _content.value = _content.value.copy(error = resolved)
        }
    }

    private fun recoverPendingSubmission(status: PendingSubmissionStatus) {
        _content.value = _content.value.copy(
            selectedScreeningChildId = status.childId,
            pendingSubmissionId = status.submissionId,
            pendingSubmissionState = status.state,
            pendingSubmissionErrorCode = status.lastErrorCode,
        )
        observePendingSubmission(status.submissionId, status.childId)
    }

    private fun observePendingSubmission(submissionId: String, childId: Int) {
        pendingObserverJob?.cancel()
        pendingObserverJob = viewModelScope.launch {
            while (true) {
                delay(2_000)
                val status = repository.pendingStatus(submissionId)
                if (status == null) {
                    val officialResult = runCatching { repository.screenings(childId) }
                        .getOrNull()
                        ?.firstOrNull { it.clientSubmissionId == submissionId }
                    _content.value = _content.value.copy(
                        pendingSubmissionId = null,
                        pendingSubmissionState = null,
                        pendingSubmissionErrorCode = null,
                        screeningResult = officialResult,
                    )
                    refresh()
                    break
                }
                _content.value = _content.value.copy(
                    pendingSubmissionState = status.state,
                    pendingSubmissionErrorCode = status.lastErrorCode,
                )
                if (status.state == "FAILED" || status.state == "FAILED_STALE") break
            }
        }
    }

    fun setLanguage(language: AppLanguage) = viewModelScope.launch {
        languageStore.setLanguage(language)
        AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(language.tag))
    }

    class Factory(
        private val repository: GrowWellRepository,
        private val languageStore: LanguageStore,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = AppViewModel(repository, languageStore) as T
    }
}
