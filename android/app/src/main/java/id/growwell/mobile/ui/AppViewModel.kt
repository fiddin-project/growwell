package id.growwell.mobile.ui

import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import id.growwell.mobile.data.GrowWellRepository
import id.growwell.mobile.data.SubmissionOutcome
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

sealed interface SessionState {
    data object Loading : SessionState
    data object SignedOut : SessionState
    data class SignedIn(val user: UserDto) : SessionState
}

data class AppContentState(
    val loading: Boolean = false,
    val dashboard: DashboardDto? = null,
    val children: List<ChildDto> = emptyList(),
    val education: List<EducationDto> = emptyList(),
    val psychologists: List<PsychologistDto> = emptyList(),
    val screeningForm: ScreeningFormDto? = null,
    val screeningResult: ScreeningDto? = null,
    val pendingSubmissionId: String? = null,
    val draftAnswers: List<AnswerRequest> = emptyList(),
    val selectedMonitoringChildId: Int? = null,
    val monitoring: MonitoringDto? = null,
    val error: UiError? = null,
)

enum class UiError { LOGIN, LOAD_DATA, CREATE_CHILD, UPDATE_CHILD, DELETE_CHILD, LOAD_MONITORING, LOAD_SCREENING, SUBMIT_SCREENING }

class AppViewModel(
    private val repository: GrowWellRepository,
    private val languageStore: LanguageStore,
) : ViewModel() {
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
            .onFailure { _content.value = _content.value.copy(error = UiError.LOGIN); _session.value = SessionState.SignedOut }
    }

    fun logout() = viewModelScope.launch {
        repository.logout()
        _content.value = AppContentState()
        _session.value = SessionState.SignedOut
    }

    fun refresh() = viewModelScope.launch {
        _content.value = _content.value.copy(loading = true, error = null)
        runCatching {
            val dashboard = async { repository.dashboard() }
            val children = async { repository.children() }
            val education = async { repository.education() }
            val psychologists = async { repository.psychologists() }
            AppContentState(
                dashboard = dashboard.await(), children = children.await(),
                education = education.await(), psychologists = psychologists.await(),
            )
        }.onSuccess { _content.value = it }
            .onFailure { _content.value = _content.value.copy(loading = false, error = UiError.LOAD_DATA) }
    }

    fun createChild(request: CreateChildRequest) = viewModelScope.launch {
        runCatching { repository.createChild(request) }
            .onSuccess { refresh() }
            .onFailure { _content.value = _content.value.copy(error = UiError.CREATE_CHILD) }
    }

    fun updateChild(id: Int, request: CreateChildRequest) = viewModelScope.launch {
        runCatching { repository.updateChild(id, request) }
            .onSuccess { refresh() }
            .onFailure { _content.value = _content.value.copy(error = UiError.UPDATE_CHILD) }
    }

    fun deleteChild(id: Int) = viewModelScope.launch {
        runCatching { repository.deleteChild(id) }
            .onSuccess { refresh() }
            .onFailure { _content.value = _content.value.copy(error = UiError.DELETE_CHILD) }
    }

    fun loadMonitoring(childId: Int) = viewModelScope.launch {
        _content.value = _content.value.copy(loading = true, error = null, selectedMonitoringChildId = childId)
        runCatching { repository.monitoring(childId) }
            .onSuccess { _content.value = _content.value.copy(loading = false, monitoring = it) }
            .onFailure { _content.value = _content.value.copy(loading = false, error = UiError.LOAD_MONITORING) }
    }

    fun loadScreeningForm() = viewModelScope.launch {
        _content.value = _content.value.copy(loading = true, error = null, screeningResult = null)
        runCatching { repository.screeningForm() }
            .onSuccess { _content.value = _content.value.copy(loading = false, screeningForm = it) }
            .onFailure { _content.value = _content.value.copy(loading = false, error = UiError.LOAD_SCREENING) }
    }

    fun submitScreening(request: ScreeningRequest) = viewModelScope.launch {
        _content.value = _content.value.copy(loading = true, error = null)
        runCatching { repository.submitScreening(request) }
            .onSuccess { outcome ->
                _content.value = when (outcome) {
                    is SubmissionOutcome.Confirmed -> _content.value.copy(loading = false, screeningResult = outcome.result, pendingSubmissionId = null)
                    is SubmissionOutcome.Queued -> _content.value.copy(loading = false, screeningResult = null, pendingSubmissionId = outcome.submissionId)
                }
            }
            .onFailure { _content.value = _content.value.copy(loading = false, error = UiError.SUBMIT_SCREENING) }
    }

    fun saveDraft(childId: Int, revision: String, answers: List<AnswerRequest>) = viewModelScope.launch {
        repository.saveDraft(childId, revision, answers)
    }

    fun loadDraft(childId: Int) = viewModelScope.launch {
        val answers = repository.loadDraft(childId)
        _content.value = _content.value.copy(draftAnswers = answers)
    }

    fun resetScreening() { _content.value = _content.value.copy(screeningResult = null, pendingSubmissionId = null) }

    fun clearError() { _content.value = _content.value.copy(error = null) }

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
