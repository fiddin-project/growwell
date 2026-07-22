package id.growwell.mobile.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import id.growwell.mobile.data.GrowWellRepository
import id.growwell.mobile.data.SubmissionOutcome
import id.growwell.mobile.data.remote.dto.*
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
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
    val error: String? = null,
)

class AppViewModel(private val repository: GrowWellRepository) : ViewModel() {
    private val _session = MutableStateFlow<SessionState>(SessionState.Loading)
    val session: StateFlow<SessionState> = _session.asStateFlow()
    private val _content = MutableStateFlow(AppContentState())
    val content: StateFlow<AppContentState> = _content.asStateFlow()

    init { viewModelScope.launch { _session.value = repository.restoreSession()?.let(SessionState::SignedIn) ?: SessionState.SignedOut } }

    fun login(username: String, password: String) = viewModelScope.launch {
        _session.value = SessionState.Loading
        runCatching { repository.login(username.trim(), password) }
            .onSuccess { _session.value = SessionState.SignedIn(it); refresh() }
            .onFailure { _content.value = _content.value.copy(error = it.message ?: "Login gagal"); _session.value = SessionState.SignedOut }
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
            .onFailure { _content.value = _content.value.copy(loading = false, error = it.message ?: "Data gagal dimuat") }
    }

    fun createChild(request: CreateChildRequest) = viewModelScope.launch {
        runCatching { repository.createChild(request) }
            .onSuccess { refresh() }
            .onFailure { _content.value = _content.value.copy(error = it.message ?: "Data anak gagal disimpan") }
    }

    fun updateChild(id: Int, request: CreateChildRequest) = viewModelScope.launch {
        runCatching { repository.updateChild(id, request) }
            .onSuccess { refresh() }
            .onFailure { _content.value = _content.value.copy(error = it.message ?: "Data anak gagal diperbarui") }
    }

    fun deleteChild(id: Int) = viewModelScope.launch {
        runCatching { repository.deleteChild(id) }
            .onSuccess { refresh() }
            .onFailure { _content.value = _content.value.copy(error = it.message ?: "Data anak gagal dihapus") }
    }

    fun loadMonitoring(childId: Int) = viewModelScope.launch {
        _content.value = _content.value.copy(loading = true, error = null, selectedMonitoringChildId = childId)
        runCatching { repository.monitoring(childId) }
            .onSuccess { _content.value = _content.value.copy(loading = false, monitoring = it) }
            .onFailure { _content.value = _content.value.copy(loading = false, error = it.message ?: "Monitoring gagal dimuat") }
    }

    fun loadScreeningForm() = viewModelScope.launch {
        _content.value = _content.value.copy(loading = true, error = null, screeningResult = null)
        runCatching { repository.screeningForm() }
            .onSuccess { _content.value = _content.value.copy(loading = false, screeningForm = it) }
            .onFailure { _content.value = _content.value.copy(loading = false, error = it.message ?: "Formulir skrining gagal dimuat") }
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
            .onFailure { _content.value = _content.value.copy(loading = false, error = it.message ?: "Skrining gagal dikirim") }
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

    class Factory(private val repository: GrowWellRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = AppViewModel(repository) as T
    }
}
