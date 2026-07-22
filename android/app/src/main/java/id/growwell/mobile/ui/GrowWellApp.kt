package id.growwell.mobile.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.FactCheck
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.automirrored.filled.ShowChart
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.stringResource
import androidx.annotation.StringRes
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import id.growwell.mobile.R
import id.growwell.mobile.data.remote.dto.*
import id.growwell.mobile.data.locale.AppLanguage
import id.growwell.mobile.BuildConfig
import id.growwell.mobile.core.safeWebUrl
import id.growwell.mobile.core.whatsappUrl
import java.util.UUID

private enum class Tab(@param:StringRes val labelRes: Int) {
    HOME(R.string.nav_home), CHILDREN(R.string.nav_children), SCREENING(R.string.nav_screening),
    MONITORING(R.string.nav_monitoring), EDUCATION(R.string.nav_education), HELP(R.string.nav_help),
}

private val UiError.messageRes: Int
    get() = when (this) {
        UiError.LOGIN -> R.string.error_login
        UiError.LOAD_DATA -> R.string.error_load_data
        UiError.CREATE_CHILD -> R.string.error_create_child
        UiError.UPDATE_CHILD -> R.string.error_update_child
        UiError.DELETE_CHILD -> R.string.error_delete_child
        UiError.LOAD_MONITORING -> R.string.error_load_monitoring
        UiError.LOAD_SCREENING -> R.string.error_load_screening
        UiError.SUBMIT_SCREENING -> R.string.error_submit_screening
    }

@Composable
private fun LanguageMenu(current: AppLanguage, onLanguage: (AppLanguage) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        IconButton(onClick = { expanded = true }) { Icon(Icons.Default.Language, stringResource(R.string.language)) }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            AppLanguage.entries.forEach { language ->
                DropdownMenuItem(
                    text = { Text(stringResource(if (language == AppLanguage.INDONESIAN) R.string.language_indonesian else R.string.language_english)) },
                    leadingIcon = { if (language == current) Icon(Icons.Default.Check, null) },
                    onClick = { expanded = false; if (language != current) onLanguage(language) },
                )
            }
        }
    }
}

@Composable
private fun localizedCategory(value: String?): String = when (value?.lowercase()) {
    "normal" -> stringResource(R.string.category_normal)
    "borderline" -> stringResource(R.string.category_borderline)
    "abnormal" -> stringResource(R.string.category_abnormal)
    else -> value ?: "–"
}

@Composable
private fun localizedGender(value: String): String = when (value.uppercase()) {
    "L", "M" -> stringResource(R.string.gender_male)
    "P", "F" -> stringResource(R.string.gender_female)
    else -> value
}

@Composable
private fun localizedMaterialType(value: String): String = when (value.lowercase()) {
    "pdf" -> stringResource(R.string.type_pdf)
    "gambar", "image" -> stringResource(R.string.type_image)
    "youtube" -> stringResource(R.string.type_youtube)
    else -> value
}

@Composable
private fun localizedScaleName(scaleId: String, fallback: String?, form: ScreeningFormDto?, language: AppLanguage): String {
    form?.scales?.firstOrNull { it.id == scaleId }?.let { return it.localizedName(language) }
    val resource = when (scaleId) {
        "E" -> R.string.scale_emotional
        "C" -> R.string.scale_conduct
        "H" -> R.string.scale_hyperactivity
        "P" -> R.string.scale_peer
        "Pro" -> R.string.scale_prosocial
        else -> null
    }
    return resource?.let { stringResource(it) } ?: fallback ?: scaleId
}

@Composable
fun GrowWellApp(viewModel: AppViewModel) {
    val session by viewModel.session.collectAsStateWithLifecycle()
    val content by viewModel.content.collectAsStateWithLifecycle()
    val language by viewModel.language.collectAsStateWithLifecycle()
    LaunchedEffect(session) { if (session is SessionState.SignedIn && content.dashboard == null) viewModel.refresh() }
    content.error?.let { error ->
        AlertDialog(
            onDismissRequest = viewModel::clearError,
            confirmButton = { TextButton(onClick = viewModel::clearError) { Text(stringResource(R.string.close)) } },
            title = { Text(stringResource(R.string.error_title)) }, text = { Text(stringResource(error.messageRes)) },
        )
    }
    when (session) {
        SessionState.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        SessionState.SignedOut -> LoginScreen(language, viewModel::setLanguage, viewModel::login)
        is SessionState.SignedIn -> MainScreen(
            content, language, viewModel::setLanguage, viewModel::refresh, viewModel::logout,
            viewModel::createChild, viewModel::updateChild, viewModel::deleteChild,
            viewModel::loadScreeningForm, viewModel::submitScreening, viewModel::resetScreening,
            viewModel::saveDraft,
            viewModel::loadDraft,
            viewModel::loadMonitoring,
        )
    }
}

@Composable
private fun LoginScreen(language: AppLanguage, onLanguage: (AppLanguage) -> Unit, onLogin: (String, String) -> Unit) {
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    Surface(Modifier.fillMaxSize()) {
        Column(
            Modifier.fillMaxWidth().padding(32.dp),
            verticalArrangement = Arrangement.Center,
        ) {
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) { LanguageMenu(language, onLanguage) }
            Text(stringResource(R.string.app_name), style = MaterialTheme.typography.displaySmall, color = MaterialTheme.colorScheme.primary)
            Text(stringResource(R.string.app_tagline), style = MaterialTheme.typography.bodyLarge)
            Spacer(Modifier.height(32.dp))
            OutlinedTextField(username, { username = it }, Modifier.fillMaxWidth(), label = { Text(stringResource(R.string.username)) }, singleLine = true)
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(password, { password = it }, Modifier.fillMaxWidth(), label = { Text(stringResource(R.string.password)) }, singleLine = true, visualTransformation = PasswordVisualTransformation())
            Spacer(Modifier.height(20.dp))
            Button(onClick = { onLogin(username, password) }, enabled = username.isNotBlank() && password.isNotBlank(), modifier = Modifier.fillMaxWidth()) { Text(stringResource(R.string.login)) }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainScreen(
    state: AppContentState,
    language: AppLanguage,
    onLanguage: (AppLanguage) -> Unit,
    onRefresh: () -> Unit,
    onLogout: () -> Unit,
    onCreateChild: (CreateChildRequest) -> Unit,
    onUpdateChild: (Int, CreateChildRequest) -> Unit,
    onDeleteChild: (Int) -> Unit,
    onLoadScreening: () -> Unit,
    onSubmitScreening: (ScreeningRequest) -> Unit,
    onResetScreening: () -> Unit,
    onSaveDraft: (Int, String, List<AnswerRequest>) -> Unit,
    onLoadDraft: (Int) -> Unit,
    onLoadMonitoring: (Int) -> Unit,
) {
    var tab by remember { mutableStateOf(Tab.HOME) }
    var showChildForm by remember { mutableStateOf(false) }
    Scaffold(
        topBar = {
            TopAppBar(title = { Text(stringResource(R.string.app_name)) }, actions = {
                LanguageMenu(language, onLanguage)
                IconButton(onClick = onRefresh) { Icon(Icons.Default.Refresh, stringResource(R.string.refresh)) }
                IconButton(onClick = onLogout) { Icon(Icons.AutoMirrored.Filled.Logout, stringResource(R.string.logout)) }
            })
        },
        bottomBar = {
            NavigationBar {
                Tab.entries.forEach { item ->
                    val icon = when (item) { Tab.HOME -> Icons.Default.Home; Tab.CHILDREN -> Icons.Default.ChildCare; Tab.SCREENING -> Icons.AutoMirrored.Filled.FactCheck; Tab.MONITORING -> Icons.AutoMirrored.Filled.ShowChart; Tab.EDUCATION -> Icons.AutoMirrored.Filled.MenuBook; Tab.HELP -> Icons.Default.SupportAgent }
                    NavigationBarItem(selected = tab == item, onClick = { tab = item }, icon = { Icon(icon, null) }, label = { Text(stringResource(item.labelRes)) })
                }
            }
        },
        floatingActionButton = {
            if (tab == Tab.CHILDREN) FloatingActionButton(onClick = { showChildForm = true }) { Icon(Icons.Default.Add, stringResource(R.string.add_child)) }
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when (tab) {
                Tab.HOME -> DashboardScreen(state, language)
                Tab.CHILDREN -> ChildrenScreen(state.children, language, onUpdateChild, onDeleteChild)
                Tab.SCREENING -> ScreeningScreen(state, language, onLoadScreening, onSubmitScreening, onResetScreening, onSaveDraft, onLoadDraft)
                Tab.MONITORING -> MonitoringScreen(state, language, onLoadMonitoring)
                Tab.EDUCATION -> EducationScreen(state.education, language)
                Tab.HELP -> PsychologistsScreen(state.psychologists, language)
            }
            if (state.loading) LinearProgressIndicator(Modifier.fillMaxWidth().align(Alignment.TopCenter))
        }
    }
    if (showChildForm) ChildFormDialog(onDismiss = { showChildForm = false }) { onCreateChild(it); showChildForm = false }
}

@Composable
private fun ScreeningScreen(
    state: AppContentState,
    language: AppLanguage,
    onLoad: () -> Unit,
    onSubmit: (ScreeningRequest) -> Unit,
    onReset: () -> Unit,
    onSaveDraft: (Int, String, List<AnswerRequest>) -> Unit,
    onLoadDraft: (Int) -> Unit,
) {
    var selectedChild by remember { mutableStateOf<Int?>(null) }
    var submissionToConfirm by remember { mutableStateOf<ScreeningRequest?>(null) }
    val answers = remember(state.screeningForm?.revision) { mutableStateMapOf<Int, String>() }
    val form = state.screeningForm
    val result = state.screeningResult
    LaunchedEffect(selectedChild) { selectedChild?.let(onLoadDraft) }
    LaunchedEffect(state.draftAnswers) {
        if (answers.isEmpty()) state.draftAnswers.forEach { answers[it.questionId] = it.jawaban }
    }
    state.pendingSubmissionId?.let { submissionId ->
        Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(stringResource(R.string.sync_pending), style = MaterialTheme.typography.headlineMedium)
            Text(stringResource(R.string.sync_pending_body))
            Text(stringResource(R.string.submission_id, submissionId), style = MaterialTheme.typography.bodySmall)
            Button(onClick = onReset) { Text(stringResource(R.string.back)) }
        }
        return
    }
    if (result != null) {
        Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(stringResource(R.string.screening_result), style = MaterialTheme.typography.headlineMedium)
            Text(stringResource(R.string.total_score, result.totalScore?.toString() ?: "–"), style = MaterialTheme.typography.headlineLarge)
            Text(stringResource(R.string.category, localizedCategory(result.category)))
            result.perScale.forEach { scale -> Text(stringResource(R.string.scale_score, localizedScaleName(scale.scaleId, scale.scaleName, form, language), scale.skor, localizedCategory(scale.kategori))) }
            Button(onClick = { answers.clear(); onReset() }) { Text(stringResource(R.string.new_screening)) }
        }
        return
    }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text(stringResource(R.string.development_screening), style = MaterialTheme.typography.headlineMedium) }
        item {
            Text(stringResource(R.string.select_child))
            state.children.forEach { child ->
                Row(verticalAlignment = Alignment.CenterVertically) { RadioButton(selectedChild == child.id, { selectedChild = child.id }); Text(child.fullName) }
            }
        }
        if (form == null) item { Button(onClick = onLoad, enabled = selectedChild != null) { Text(stringResource(R.string.load_questions)) } }
        form?.questions?.let { questions ->
            items(questions, key = { it.id }) { question ->
                Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) {
                    Text(question.localizedText(language), style = MaterialTheme.typography.titleMedium)
                    listOf("tidak_benar" to R.string.answer_not_true, "agak_benar" to R.string.answer_somewhat_true, "selalu_benar" to R.string.answer_certainly_true).forEach { (value, labelRes) ->
                        Row(verticalAlignment = Alignment.CenterVertically) { RadioButton(answers[question.id] == value, {
                            answers[question.id] = value
                            val childId = selectedChild
                            if (childId != null) onSaveDraft(childId, form.revision, answers.map { AnswerRequest(it.key, it.value) })
                        }); Text(stringResource(labelRes)) }
                    }
                } }
            }
            item {
                Button(
                    onClick = {
                        submissionToConfirm = ScreeningRequest(
                            childId = requireNotNull(selectedChild),
                            clientSubmissionId = UUID.randomUUID().toString(),
                            instrumentRevision = form.revision,
                            jawaban = questions.map { AnswerRequest(it.id, requireNotNull(answers[it.id])) },
                        )
                    },
                    enabled = selectedChild != null && answers.size == questions.size,
                    modifier = Modifier.fillMaxWidth(),
                ) { Text(stringResource(R.string.submit_screening)) }
            }
        }
    }
    submissionToConfirm?.let { request ->
        AlertDialog(
            onDismissRequest = { submissionToConfirm = null },
            title = { Text(stringResource(R.string.submit_screening_title)) },
            text = { Text(stringResource(R.string.submit_screening_body)) },
            confirmButton = { Button(onClick = { submissionToConfirm = null; onSubmit(request) }) { Text(stringResource(R.string.submit)) } },
            dismissButton = { TextButton(onClick = { submissionToConfirm = null }) { Text(stringResource(R.string.review_again)) } },
        )
    }
}

@Composable
private fun MonitoringScreen(state: AppContentState, language: AppLanguage, onLoad: (Int) -> Unit) {
    val monitoring = state.monitoring
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text(stringResource(R.string.child_monitoring), style = MaterialTheme.typography.headlineMedium) }
        item {
            Text(stringResource(R.string.select_child))
            state.children.forEach { child ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(state.selectedMonitoringChildId == child.id, { onLoad(child.id) })
                    Text(child.fullName)
                }
            }
        }
        monitoring?.let { data ->
            item { MonitoringChart(data) }
            item { Text(stringResource(R.string.screening_history), style = MaterialTheme.typography.titleLarge) }
            if (data.riwayat.isEmpty()) item { Text(stringResource(R.string.no_screening_history)) }
            items(data.riwayat, key = { it.id }) { entry ->
                Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) {
                    Text(formatApiDate(entry.createdAt, language) ?: stringResource(R.string.date_unavailable), style = MaterialTheme.typography.titleMedium)
                    Text(stringResource(R.string.score_and_category, entry.totalScore?.toString() ?: "–", localizedCategory(entry.category)))
                    entry.performer?.fullName?.let { Text(stringResource(R.string.performed_by, it), style = MaterialTheme.typography.bodySmall) }
                    entry.perScale.forEach { scale -> Text(stringResource(R.string.scale_score, localizedScaleName(scale.scaleId, scale.scaleName, state.screeningForm, language), scale.skor, localizedCategory(scale.kategori)), style = MaterialTheme.typography.bodySmall) }
                } }
            }
        }
    }
}

@Composable
private fun MonitoringChart(monitoring: MonitoringDto) {
    val points = monitoring.riwayat.asReversed().mapNotNull { it.totalScore }
    val threshold = monitoring.thresholdTotal
    val primaryColor = MaterialTheme.colorScheme.primary
    val unavailable = stringResource(R.string.unavailable)
    val description = if (points.isEmpty()) stringResource(R.string.chart_no_data) else stringResource(
        R.string.chart_description,
        points.joinToString(), threshold?.normalMax?.toString() ?: unavailable,
        threshold?.borderlineMax?.toString() ?: unavailable,
    )
    Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) {
        Text(stringResource(R.string.score_trend), style = MaterialTheme.typography.titleLarge)
        Canvas(Modifier.fillMaxWidth().height(180.dp).semantics { contentDescription = description }) {
            if (points.isEmpty()) return@Canvas
            val maximum = maxOf(points.maxOrNull() ?: 1, threshold?.borderlineMax ?: 1, 1).toFloat() + 2f
            fun y(value: Int) = size.height - (value / maximum * size.height)
            threshold?.normalMax?.let { drawLine(Color(0xFF2E7D32), start = androidx.compose.ui.geometry.Offset(0f, y(it)), end = androidx.compose.ui.geometry.Offset(size.width, y(it)), strokeWidth = 3f) }
            threshold?.borderlineMax?.let { drawLine(Color(0xFFF9A825), start = androidx.compose.ui.geometry.Offset(0f, y(it)), end = androidx.compose.ui.geometry.Offset(size.width, y(it)), strokeWidth = 3f) }
            val step = if (points.size <= 1) 0f else size.width / (points.size - 1)
            points.zipWithNext().forEachIndexed { index, (first, second) ->
                drawLine(primaryColor, androidx.compose.ui.geometry.Offset(index * step, y(first)), androidx.compose.ui.geometry.Offset((index + 1) * step, y(second)), strokeWidth = 6f)
            }
            if (points.size == 1) drawCircle(primaryColor, 8f, androidx.compose.ui.geometry.Offset(size.width / 2, y(points.first())))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) { Text(stringResource(R.string.legend_normal)); Text(stringResource(R.string.legend_borderline)) }
        Text(description, style = MaterialTheme.typography.bodySmall)
    } }
}

@Composable
private fun DashboardScreen(state: AppContentState, language: AppLanguage) {
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text(stringResource(R.string.summary), style = MaterialTheme.typography.headlineMedium) }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                MetricCard(stringResource(R.string.total_children), state.children.size.toString(), Modifier.weight(1f))
                MetricCard(stringResource(R.string.recent_activity), state.dashboard?.recentScreenings?.size?.toString() ?: "–", Modifier.weight(1f))
            }
        }
        item { Text(stringResource(R.string.visibility_note)) }
        item { Text(stringResource(R.string.recent_activity), style = MaterialTheme.typography.titleLarge) }
        val recent = state.dashboard?.recentScreenings.orEmpty()
        if (recent.isEmpty()) item { Text(stringResource(R.string.no_recent_activity)) }
        items(recent, key = { it.id }) { screening ->
            Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) {
                Text(formatApiDate(screening.createdAt, language) ?: stringResource(R.string.date_unavailable), style = MaterialTheme.typography.titleMedium)
                Text(stringResource(R.string.score_and_category, screening.totalScore?.toString() ?: "–", localizedCategory(screening.category)))
                screening.performer?.fullName?.let { Text(stringResource(R.string.performed_by, it), style = MaterialTheme.typography.bodySmall) }
            } }
        }
    }
}

@Composable private fun MetricCard(label: String, value: String, modifier: Modifier) {
    Card(modifier) { Column(Modifier.padding(20.dp)) { Text(value, style = MaterialTheme.typography.headlineLarge); Text(label) } }
}

@Composable
private fun ChildrenScreen(
    children: List<ChildDto>,
    language: AppLanguage,
    onUpdate: (Int, CreateChildRequest) -> Unit,
    onDelete: (Int) -> Unit,
) {
    var editing by remember { mutableStateOf<ChildDto?>(null) }
    var deleting by remember { mutableStateOf<ChildDto?>(null) }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
    item { Text(stringResource(R.string.children_data), style = MaterialTheme.typography.headlineMedium) }
    if (children.isEmpty()) item { Text(stringResource(R.string.no_children)) }
    items(children, key = { it.id }) { child ->
        Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) {
            Text(child.fullName, style = MaterialTheme.typography.titleMedium)
            Text(stringResource(R.string.born_gender, formatApiDate(child.birthDate, language) ?: child.birthDate, localizedGender(child.gender)))
            child.creator?.fullName?.let { Text(stringResource(R.string.added_by, it), style = MaterialTheme.typography.bodySmall) }
            Row { TextButton(onClick = { editing = child }) { Text(stringResource(R.string.edit)) }; TextButton(onClick = { deleting = child }) { Text(stringResource(R.string.delete)) } }
        } }
    }
    }
    editing?.let { child -> ChildFormDialog(child, onDismiss = { editing = null }) { onUpdate(child.id, it); editing = null } }
    deleting?.let { child -> AlertDialog(
        onDismissRequest = { deleting = null }, title = { Text(stringResource(R.string.delete_child_title)) },
        text = { Text(stringResource(R.string.delete_child_body, child.fullName)) },
        confirmButton = { Button(onClick = { onDelete(child.id); deleting = null }) { Text(stringResource(R.string.delete)) } },
        dismissButton = { TextButton(onClick = { deleting = null }) { Text(stringResource(R.string.cancel)) } },
    ) }
}

@Composable
private fun EducationScreen(items: List<EducationDto>, language: AppLanguage) {
    var search by remember { mutableStateOf("") }; var type by remember { mutableStateOf("all") }
    val uriHandler = LocalUriHandler.current
    val filtered = items.filter { (type == "all" || it.tipe == type) && (search.isBlank() || it.judul.contains(search, true) || it.englishTitle.orEmpty().contains(search, true)) }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
    item { Text(stringResource(R.string.education_materials), style = MaterialTheme.typography.headlineMedium) }
    item { OutlinedTextField(search, { search = it }, Modifier.fillMaxWidth(), label = { Text(stringResource(R.string.search_materials)) }) }
    item { Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) { listOf("all", "pdf", "gambar", "youtube").forEach { value -> FilterChip(type == value, { type = value }, { Text(if (value == "all") stringResource(R.string.filter_all) else localizedMaterialType(value)) }) } } }
    if (filtered.isEmpty()) item { Text(stringResource(R.string.no_education)) }
    items(filtered, key = { it.id }) { entry -> Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) {
        Text(entry.localizedTitle(language), style = MaterialTheme.typography.titleMedium); entry.localizedDescription(language).takeIf(String::isNotBlank)?.let { Text(it) }
        Text(localizedMaterialType(entry.tipe), style = MaterialTheme.typography.labelSmall)
        val safeUrl = safeWebUrl(entry.assetUrl ?: entry.source, BuildConfig.DEBUG)
        if (safeUrl != null) TextButton(onClick = { uriHandler.openUri(safeUrl) }) { Text(stringResource(R.string.open_material)) }
    } } }
    }
}

@Composable
private fun PsychologistsScreen(items: List<PsychologistDto>, language: AppLanguage) {
    var search by remember { mutableStateOf("") }
    val uriHandler = LocalUriHandler.current
    val filtered = items.filter { search.isBlank() || it.nama.contains(search, true) || it.spesialisasi.orEmpty().contains(search, true) || it.englishSpecialization.orEmpty().contains(search, true) }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
    item { Text(stringResource(R.string.psychologist_help), style = MaterialTheme.typography.headlineMedium) }
    item { OutlinedTextField(search, { search = it }, Modifier.fillMaxWidth(), label = { Text(stringResource(R.string.search_psychologist)) }) }
    if (filtered.isEmpty()) item { Text(stringResource(R.string.no_psychologist)) }
    items(filtered, key = { it.id }) { item -> Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) {
        Text(item.nama, style = MaterialTheme.typography.titleMedium); item.localizedSpecialization(language).takeIf(String::isNotBlank)?.let { Text(it) }; item.phone?.let { Text(stringResource(R.string.whatsapp_number, it)) }
        whatsappUrl(item.phone, item.localizedMessage(language))?.let { url -> Button(onClick = { uriHandler.openUri(url) }) { Text(stringResource(R.string.chat_whatsapp)) } }
    } } }
    }
}

@Composable
private fun ChildFormDialog(initial: ChildDto? = null, onDismiss: () -> Unit, onSave: (CreateChildRequest) -> Unit) {
    var name by remember(initial?.id) { mutableStateOf(initial?.fullName.orEmpty()) }; var birthDate by remember(initial?.id) { mutableStateOf(initial?.birthDate?.take(10).orEmpty()) }
    var gender by remember(initial?.id) { mutableStateOf(initial?.gender ?: "L") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(if (initial == null) R.string.add_child else R.string.edit_child)) },
        text = { Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(name, { name = it }, label = { Text(stringResource(R.string.full_name)) })
            OutlinedTextField(birthDate, { birthDate = it }, label = { Text(stringResource(R.string.birth_date_hint)) })
            Row(verticalAlignment = Alignment.CenterVertically) { RadioButton(gender == "L", { gender = "L" }); Text(stringResource(R.string.gender_male)); RadioButton(gender == "P", { gender = "P" }); Text(stringResource(R.string.gender_female)) }
        } },
        confirmButton = { Button(onClick = { onSave(CreateChildRequest(name.trim(), birthDate.trim(), gender)) }, enabled = name.isNotBlank() && Regex("\\d{4}-\\d{2}-\\d{2}").matches(birthDate)) { Text(stringResource(R.string.save)) } },
        dismissButton = { TextButton(onClick = onDismiss) { Text(stringResource(R.string.cancel)) } },
    )
}
