package id.growwell.mobile.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.FactCheck
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.automirrored.filled.Login
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.automirrored.filled.ShowChart
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.window.Dialog
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.annotation.StringRes
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import id.growwell.mobile.R
import id.growwell.mobile.data.remote.dto.*
import id.growwell.mobile.data.locale.AppLanguage
import id.growwell.mobile.BuildConfig
import id.growwell.mobile.core.safeWebUrl
import id.growwell.mobile.core.whatsappUrl
import java.util.Locale
import java.text.SimpleDateFormat

private enum class Tab(@param:StringRes val labelRes: Int) {
    HOME(R.string.nav_home), CHILDREN(R.string.nav_children), SCREENING(R.string.nav_screening),
    MONITORING(R.string.nav_monitoring), EDUCATION(R.string.nav_education), HELP(R.string.nav_help),
}

private fun isValidApiDate(value: String): Boolean =
    Regex("\\d{4}-\\d{2}-\\d{2}").matches(value) &&
        runCatching {
            SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).apply { isLenient = false }.parse(value)
        }.getOrNull() != null

private val UiError.messageRes: Int
    get() = when (this) {
        UiError.LOGIN -> R.string.error_login
        UiError.LOGIN_UNSUPPORTED_ROLE -> R.string.error_login_unsupported_role
        UiError.LOAD_DATA -> R.string.error_load_data
        UiError.CREATE_CHILD -> R.string.error_create_child
        UiError.UPDATE_CHILD -> R.string.error_update_child
        UiError.DELETE_CHILD -> R.string.error_delete_child
        UiError.DELETE_CHILD_HAS_HISTORY -> R.string.error_delete_child_history
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
    "video" -> stringResource(R.string.type_video)
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
        GrowWellConfirmationDialog(
            icon = Icons.Default.ErrorOutline,
            title = stringResource(R.string.error_title),
            message = stringResource(error.messageRes),
            confirmLabel = stringResource(if (error == UiError.LOAD_DATA) R.string.retry else R.string.close),
            onConfirm = {
                viewModel.clearError()
                if (error == UiError.LOAD_DATA) viewModel.refresh()
            },
            onDismiss = viewModel::clearError,
            actionColor = if (error == UiError.LOAD_DATA) Color(0xFF0D5C63) else Color(0xFFBA1A1A),
        )
    }
    when (session) {
        SessionState.Loading -> GrowWellLoadingScreen()
        SessionState.SignedOut -> LoginScreen(language, viewModel::setLanguage, viewModel::login)
        is SessionState.SignedIn -> MainScreen(
            content, language, viewModel::setLanguage, viewModel::logout,
            viewModel::createChild, viewModel::updateChild, viewModel::deleteChild,
            viewModel::startScreening, viewModel::submitScreening, viewModel::resetScreening,
            viewModel::reviewFailedSubmission,
            viewModel::saveDraft,
            viewModel::loadMonitoring,
        )
    }
}

@Composable
private fun GrowWellLoadingScreen() {
    Surface(Modifier.fillMaxSize(), color = Color(0xFFF9F9FF)) {
        Column(
            Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Surface(
                modifier = Modifier.size(88.dp),
                shape = RoundedCornerShape(26.dp),
                color = Color(0xFFF0F3FF),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x33BFC8C9)),
                shadowElevation = 3.dp,
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        Icons.Default.Eco,
                        contentDescription = stringResource(R.string.app_name),
                        tint = Color(0xFF0D5C63),
                        modifier = Modifier.size(52.dp),
                    )
                }
            }
            Spacer(Modifier.height(24.dp))
            Text(
                stringResource(R.string.app_name),
                color = Color(0xFF004349),
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(20.dp))
            CircularProgressIndicator(
                modifier = Modifier.size(30.dp),
                color = Color(0xFF0D5C63),
                strokeWidth = 3.dp,
            )
        }
    }
}

@Composable
private fun LoginScreen(language: AppLanguage, onLanguage: (AppLanguage) -> Unit, onLogin: (String, String) -> Unit) {
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    val submit = { if (username.isNotBlank() && password.isNotBlank()) onLogin(username.trim(), password) }
    val primary = Color(0xFF004349)
    val background = Color(0xFFF9F9FF)
    val outline = Color(0xFFBFC8C9)
    val onSurfaceVariant = Color(0xFF3F484A)
    val fieldShape = RoundedCornerShape(12.dp)

    Surface(Modifier.fillMaxSize(), color = background) {
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .imePadding()
                .padding(horizontal = 24.dp, vertical = 36.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
                LanguageMenu(language, onLanguage)
            }
            Spacer(Modifier.height(8.dp))
            Box(
                Modifier
                    .size(80.dp)
                    .shadow(2.dp, RoundedCornerShape(24.dp))
                    .background(Color(0xFFF0F3FF), RoundedCornerShape(24.dp))
                    .border(1.dp, outline.copy(alpha = .3f), RoundedCornerShape(24.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.Default.Eco,
                    contentDescription = null,
                    tint = primary,
                    modifier = Modifier.size(48.dp),
                )
            }
            Spacer(Modifier.height(24.dp))
            Text(
                stringResource(R.string.app_name),
                color = primary,
                fontSize = 24.sp,
                lineHeight = 32.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(12.dp))
            Text(
                stringResource(R.string.app_tagline),
                color = onSurfaceVariant,
                fontSize = 16.sp,
                lineHeight = 24.sp,
            )
            Spacer(Modifier.height(40.dp))

            Column(
                Modifier
                    .fillMaxWidth()
                    .widthIn(max = 448.dp)
                    .shadow(
                        elevation = 10.dp,
                        shape = RoundedCornerShape(32.dp),
                        ambientColor = primary.copy(alpha = .05f),
                        spotColor = primary.copy(alpha = .05f),
                    )
                    .background(Color.White.copy(alpha = .92f), RoundedCornerShape(32.dp))
                    .padding(32.dp),
                verticalArrangement = Arrangement.spacedBy(24.dp),
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    LoginFieldLabel(stringResource(R.string.username), onSurfaceVariant)
                    OutlinedTextField(
                        value = username,
                        onValueChange = { username = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text(stringResource(R.string.username_hint), color = outline) },
                        leadingIcon = { Icon(Icons.Default.Person, null, tint = outline) },
                        singleLine = true,
                        shape = fieldShape,
                        colors = loginFieldColors(primary, outline),
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Text,
                            imeAction = ImeAction.Next,
                        ),
                    )
                }

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    LoginFieldLabel(stringResource(R.string.password), onSurfaceVariant)
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("••••••••", color = outline) },
                        leadingIcon = { Icon(Icons.Default.Lock, null, tint = outline) },
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    stringResource(
                                        if (passwordVisible) R.string.hide_password else R.string.show_password
                                    ),
                                    tint = outline,
                                )
                            }
                        },
                        singleLine = true,
                        shape = fieldShape,
                        colors = loginFieldColors(primary, outline),
                        visualTransformation = if (passwordVisible) {
                            VisualTransformation.None
                        } else {
                            PasswordVisualTransformation()
                        },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Password,
                            imeAction = ImeAction.Done,
                        ),
                        keyboardActions = KeyboardActions(onDone = { submit() }),
                    )
                }

                Button(
                    onClick = submit,
                    enabled = username.isNotBlank() && password.isNotBlank(),
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = fieldShape,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = primary,
                        contentColor = Color.White,
                        disabledContainerColor = primary.copy(alpha = .45f),
                        disabledContentColor = Color.White.copy(alpha = .8f),
                    ),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 6.dp),
                ) {
                    Text(stringResource(R.string.login), fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.width(8.dp))
                    Icon(Icons.AutoMirrored.Filled.Login, null, Modifier.size(20.dp))
                }

                HorizontalDivider(color = outline.copy(alpha = .3f))
            }
        }
    }
}

@Composable
private fun LoginFieldLabel(text: String, color: Color) {
    Text(
        text = text,
        modifier = Modifier.padding(start = 4.dp),
        color = color,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = .28.sp,
    )
}

@Composable
private fun loginFieldColors(primary: Color, outline: Color) = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = primary,
    unfocusedBorderColor = outline,
    focusedLeadingIconColor = primary,
    cursorColor = primary,
    focusedContainerColor = Color.White,
    unfocusedContainerColor = Color.White,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainScreen(
    state: AppContentState,
    language: AppLanguage,
    onLanguage: (AppLanguage) -> Unit,
    onLogout: () -> Unit,
    onCreateChild: (CreateChildRequest) -> Unit,
    onUpdateChild: (Int, CreateChildRequest) -> Unit,
    onDeleteChild: (Int) -> Unit,
    onStartScreening: (Int) -> Unit,
    onSubmitScreening: (ScreeningRequest) -> Unit,
    onResetScreening: () -> Unit,
    onReviewFailedSubmission: () -> Unit,
    onSaveDraft: (Int, String, List<AnswerRequest>) -> Unit,
    onLoadMonitoring: (Int) -> Unit,
) {
    var tab by rememberSaveable { mutableStateOf(Tab.HOME) }
    var showChildForm by remember { mutableStateOf(false) }
    var showLogoutConfirmation by remember { mutableStateOf(false) }
    val appBackground = Color(0xFFF9F9FF)
    val primary = Color(0xFF004349)
    Scaffold(
        containerColor = appBackground,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        stringResource(R.string.app_name),
                        color = Color(0xFF111C2C),
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                    )
                },
                actions = {
                    LanguageMenu(language, onLanguage)
                    IconButton(onClick = { tab = Tab.HELP }) {
                        Icon(Icons.Default.SupportAgent, stringResource(R.string.nav_help), tint = primary)
                    }
                    IconButton(onClick = { showLogoutConfirmation = true }) {
                        Icon(Icons.AutoMirrored.Filled.Logout, stringResource(R.string.logout), tint = primary)
                    }
                    Spacer(Modifier.width(16.dp))
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = appBackground),
            )
        },
        bottomBar = {
            NavigationBar {
                Tab.entries.filterNot { it == Tab.HELP }.forEach { item ->
                    val icon = when (item) { Tab.HOME -> Icons.Default.Home; Tab.CHILDREN -> Icons.Default.ChildCare; Tab.SCREENING -> Icons.AutoMirrored.Filled.FactCheck; Tab.MONITORING -> Icons.AutoMirrored.Filled.ShowChart; Tab.EDUCATION -> Icons.AutoMirrored.Filled.MenuBook; Tab.HELP -> Icons.Default.SupportAgent }
                    NavigationBarItem(selected = tab == item, onClick = { tab = item }, icon = { Icon(icon, null) }, label = { Text(stringResource(item.labelRes)) })
                }
            }
        },
        floatingActionButton = {
            if (tab == Tab.HOME || tab == Tab.CHILDREN) {
                FloatingActionButton(
                    onClick = { showChildForm = true },
                    containerColor = primary,
                    contentColor = Color.White,
                ) { Icon(Icons.Default.Add, stringResource(R.string.add_child)) }
            }
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when (tab) {
                Tab.HOME -> DashboardScreen(
                    state = state,
                    language = language,
                    onChildren = { tab = Tab.CHILDREN },
                    onMonitoring = { tab = Tab.MONITORING },
                )
                Tab.CHILDREN -> ChildrenScreen(state.children, language, onUpdateChild, onDeleteChild)
                Tab.SCREENING -> ScreeningScreen(
                    state, language, onStartScreening, onSubmitScreening, onResetScreening,
                    onReviewFailedSubmission, onSaveDraft,
                    onViewMonitoring = { childId ->
                        onLoadMonitoring(childId)
                        tab = Tab.MONITORING
                    },
                )
                Tab.MONITORING -> MonitoringScreen(state, language, onLoadMonitoring)
                Tab.EDUCATION -> EducationScreen(state.education, language)
                Tab.HELP -> PsychologistsScreen(state.psychologists, language)
            }
            if (state.loading) LinearProgressIndicator(Modifier.fillMaxWidth().align(Alignment.TopCenter))
            if (state.offline && !state.loading) {
                Surface(
                    modifier = Modifier.align(Alignment.TopCenter).padding(top = 8.dp),
                    color = Color(0xFFFFDBCE),
                    shape = RoundedCornerShape(50),
                    shadowElevation = 2.dp,
                ) {
                    Row(
                        Modifier.padding(horizontal = 14.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(Icons.Default.CloudOff, null, Modifier.size(17.dp), tint = Color(0xFF763315))
                        Spacer(Modifier.width(7.dp))
                        Text(stringResource(R.string.offline_data), color = Color(0xFF763315), fontSize = 12.sp)
                    }
                }
            }
        }
    }
    if (showChildForm) ChildFormDialog(onDismiss = { showChildForm = false }) { onCreateChild(it); showChildForm = false }
    if (showLogoutConfirmation) {
        GrowWellConfirmationDialog(
            icon = Icons.AutoMirrored.Filled.Logout,
            title = stringResource(R.string.logout_confirmation_title),
            message = stringResource(R.string.logout_confirmation_body),
            confirmLabel = stringResource(R.string.logout),
            dismissLabel = stringResource(R.string.cancel),
            onConfirm = {
                showLogoutConfirmation = false
                onLogout()
            },
            onDismiss = { showLogoutConfirmation = false },
        )
    }
}

private fun screeningCategoryColor(category: String?): Color = when (category) {
    "abnormal" -> Color(0xFFC51B1B)
    "borderline" -> Color(0xFFAD4C24)
    else -> Color(0xFF0D5C63)
}

@Composable
private fun GrowWellEmptyState(icon: ImageVector, message: String) {
    Surface(
        Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x33BFC8C9)),
    ) {
        Column(
            Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Surface(shape = RoundedCornerShape(28.dp), color = Color(0xFFF0F3FF)) {
                Icon(icon, null, tint = Color(0xFF0D5C63), modifier = Modifier.padding(14.dp).size(28.dp))
            }
            Spacer(Modifier.height(14.dp))
            Text(
                message,
                color = Color(0xFF6F797A),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                lineHeight = 22.sp,
            )
        }
    }
}

@Composable
private fun GrowWellConfirmationDialog(
    icon: ImageVector,
    title: String,
    message: String,
    confirmLabel: String,
    dismissLabel: String? = null,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    actionColor: Color = Color(0xFF0D5C63),
) {
    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(32.dp),
            color = Color.White,
            shadowElevation = 24.dp,
        ) {
            Column(
                Modifier.padding(horizontal = 32.dp, vertical = 38.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Surface(
                    modifier = Modifier.size(72.dp),
                    shape = RoundedCornerShape(36.dp),
                    color = actionColor.copy(alpha = .10f),
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(icon, null, tint = actionColor, modifier = Modifier.size(36.dp))
                    }
                }
                Spacer(Modifier.height(30.dp))
                Text(
                    title,
                    color = Color(0xFF111C2C),
                    fontSize = 27.sp,
                    lineHeight = 34.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                )
                Spacer(Modifier.height(14.dp))
                Text(
                    message,
                    color = Color(0xFF71829F),
                    fontSize = 17.sp,
                    lineHeight = 25.sp,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                )
                Spacer(Modifier.height(30.dp))
                Button(
                    onClick = onConfirm,
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = actionColor),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 7.dp),
                ) {
                    Text(confirmLabel, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                }
                if (dismissLabel != null) {
                    Spacer(Modifier.height(10.dp))
                    TextButton(
                        onClick = onDismiss,
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = RoundedCornerShape(16.dp),
                    ) {
                        Text(dismissLabel, color = Color(0xFF71829F), fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

@Composable
private fun ScreeningScoreSummary(
    score: Int?,
    category: String,
    categoryKey: String?,
    color: Color,
) {
    Card(
        Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(
            Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 34.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Box(Modifier.size(174.dp), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(
                    progress = { ((score ?: 0) / 40f).coerceIn(0f, 1f) },
                    modifier = Modifier.fillMaxSize(),
                    color = color,
                    trackColor = Color(0xFFE7EEFF),
                    strokeWidth = 12.dp,
                )
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(score?.toString() ?: "–", color = Color(0xFF111C2C), fontSize = 36.sp, fontWeight = FontWeight.Bold)
                    Text(stringResource(R.string.total_score_label), color = Color(0xFF6F797A), fontSize = 14.sp)
                }
            }
            Spacer(Modifier.height(28.dp))
            Surface(
                shape = RoundedCornerShape(24.dp),
                color = color.copy(alpha = .16f),
            ) {
                Row(Modifier.padding(horizontal = 16.dp, vertical = 9.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        if (categoryKey == "normal") Icons.Default.CheckCircleOutline else Icons.Default.WarningAmber,
                        null,
                        tint = color,
                        modifier = Modifier.size(19.dp),
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(category.uppercase(), color = color, fontWeight = FontWeight.Medium)
                }
            }
            Spacer(Modifier.height(18.dp))
            Text(
                stringResource(
                    when (categoryKey) {
                        "abnormal" -> R.string.result_summary_abnormal
                        "borderline" -> R.string.result_summary_borderline
                        else -> R.string.result_summary_normal
                    },
                ),
                color = Color(0xFF3F484A),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                lineHeight = 21.sp,
            )
        }
    }
}

@Composable
private fun ScreeningScaleRow(name: String, score: Int, category: String, categoryKey: String?) {
    val color = screeningCategoryColor(categoryKey)
    Row(
        Modifier.fillMaxWidth()
            .border(0.dp, Color.Transparent)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(name, color = Color(0xFF111C2C), fontWeight = FontWeight.Medium)
            Text(category.uppercase(), color = color, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
        Surface(shape = RoundedCornerShape(10.dp), color = Color(0xFFE9F0F2)) {
            Text(
                score.toString(),
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                color = Color(0xFF75C9D0),
                fontSize = 20.sp,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
    HorizontalDivider(color = Color(0xFFD8E3FA))
}

@Composable
private fun ScreeningRecommendation(categoryKey: String?) {
    Surface(
        Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = Color(0xFFF0F3FF),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFB7CCD4)),
    ) {
        Row(Modifier.padding(24.dp), verticalAlignment = Alignment.Top) {
            Surface(shape = RoundedCornerShape(8.dp), color = Color(0xFF0D5C63)) {
                Icon(
                    Icons.Default.MedicalInformation,
                    null,
                    tint = Color.White,
                    modifier = Modifier.padding(9.dp).size(22.dp),
                )
            }
            Spacer(Modifier.width(16.dp))
            Column {
                Text(stringResource(R.string.recommended_next_steps), color = Color(0xFF004349), fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(4.dp))
                Text(
                    stringResource(
                        when (categoryKey) {
                            "abnormal" -> R.string.recommendation_abnormal
                            "borderline" -> R.string.recommendation_borderline
                            else -> R.string.recommendation_normal
                        },
                    ),
                    color = Color(0xFF3F484A),
                    lineHeight = 23.sp,
                )
            }
        }
    }
}

@Composable
private fun ScreeningResultContent(
    result: ScreeningDto,
    child: ChildDto?,
    form: ScreeningFormDto?,
    language: AppLanguage,
    onViewHistory: (() -> Unit)?,
    onNewScreening: () -> Unit,
) {
    val categoryKey = result.category?.lowercase()
    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 24.dp, end = 24.dp, top = 24.dp, bottom = 112.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        item {
            Text(stringResource(R.string.screening_result), color = Color(0xFF111C2C), fontSize = 28.sp, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(6.dp))
            child?.let {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.ChildCare, null, tint = Color(0xFF0D5C63), modifier = Modifier.size(24.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(it.fullName, color = Color(0xFF0D5C63), fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
                }
            }
            formatApiDate(result.createdAt, language)?.let {
                Spacer(Modifier.height(4.dp))
                Text(it, color = Color(0xFF6F797A), style = MaterialTheme.typography.bodySmall)
            }
        }
        item {
            ScreeningScoreSummary(result.totalScore, localizedCategory(result.category), categoryKey, screeningCategoryColor(categoryKey))
        }
        item {
            Card(
                Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            ) {
                Column(Modifier.padding(24.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Analytics, null)
                        Spacer(Modifier.width(10.dp))
                        Text(stringResource(R.string.score_breakdown), color = Color(0xFF111C2C), fontSize = 21.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(Modifier.height(22.dp))
                    result.perScale.forEach { scale ->
                        ScreeningScaleRow(
                            localizedScaleName(scale.scaleId, scale.scaleName, form, language),
                            scale.skor,
                            localizedCategory(scale.kategori),
                            scale.kategori.lowercase(),
                        )
                    }
                }
            }
        }
        item { ScreeningRecommendation(categoryKey) }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                onViewHistory?.let {
                    OutlinedButton(
                        onClick = it,
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = RoundedCornerShape(28.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF0D5C63)),
                    ) {
                        Icon(Icons.Default.History, null)
                        Spacer(Modifier.width(8.dp))
                        Text(stringResource(R.string.view_history))
                    }
                }
                Button(
                    onClick = onNewScreening,
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(28.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0D5C63)),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 7.dp),
                ) {
                    Icon(Icons.Default.AddTask, null)
                    Spacer(Modifier.width(8.dp))
                    Text(stringResource(R.string.new_screening), fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun ScreeningScreen(
    state: AppContentState,
    language: AppLanguage,
    onStart: (Int) -> Unit,
    onSubmit: (ScreeningRequest) -> Unit,
    onReset: () -> Unit,
    onReviewFailedSubmission: () -> Unit,
    onSaveDraft: (Int, String, List<AnswerRequest>) -> Unit,
    onViewMonitoring: (Int) -> Unit,
) {
    var selectedChild by remember(state.selectedScreeningChildId) {
        mutableStateOf(state.selectedScreeningChildId)
    }
    var submissionToConfirm by remember { mutableStateOf<ScreeningRequest?>(null) }
    var childToStart by remember { mutableStateOf<ChildDto?>(null) }
    val answers = remember(state.selectedScreeningChildId, state.screeningForm?.revision) {
        mutableStateMapOf<Int, String>()
    }
    val form = state.screeningForm
    val result = state.screeningResult
    LaunchedEffect(state.selectedScreeningChildId, state.draftAnswers) {
        answers.clear()
        state.draftAnswers.forEach { answers[it.questionId] = it.jawaban }
    }
    state.pendingSubmissionId?.let { submissionId ->
        Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(stringResource(R.string.sync_pending), style = MaterialTheme.typography.headlineMedium)
            Text(stringResource(R.string.sync_pending_body))
            state.pendingSubmissionState?.let {
                Text(stringResource(R.string.sync_status, it), fontWeight = FontWeight.SemiBold)
            }
            state.pendingSubmissionErrorCode?.let {
                Text(stringResource(R.string.sync_error_code, it), color = MaterialTheme.colorScheme.error)
            }
            Text(stringResource(R.string.submission_id, submissionId), style = MaterialTheme.typography.bodySmall)
            if (
                state.pendingSubmissionState == "FAILED" ||
                state.pendingSubmissionState == "FAILED_STALE"
            ) {
                Button(onClick = onReviewFailedSubmission) {
                    Text(stringResource(R.string.review_again))
                }
            }
        }
        return
    }
    if (result != null) {
        val screenedChild = state.children.firstOrNull { it.id == state.selectedScreeningChildId }
        ScreeningResultContent(
            result = result,
            child = screenedChild,
            form = form,
            language = language,
            onViewHistory = state.selectedScreeningChildId?.let { childId ->
                { onViewMonitoring(childId) }
            },
            onNewScreening = {
                answers.clear()
                onReset()
            },
        )
        return
    }
    var childSearch by remember { mutableStateOf("") }
    val primary = Color(0xFF0D5C63)
    val filteredChildren = state.children.filter {
        childSearch.isBlank() || it.fullName.contains(childSearch, ignoreCase = true)
    }
    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 24.dp, end = 24.dp, top = 24.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Text(
                stringResource(R.string.development_screening),
                color = Color(0xFF111C2C),
                fontSize = 28.sp,
                lineHeight = 36.sp,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(32.dp))
        }
        if (form == null) {
            item {
                OutlinedTextField(
                    value = childSearch,
                    onValueChange = { childSearch = it },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text(stringResource(R.string.search_children), color = Color(0xFF8B9AB5)) },
                    leadingIcon = { Icon(Icons.Default.Search, null, tint = Color(0xFF8B9AB5)) },
                    singleLine = true,
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = Color.White,
                        unfocusedContainerColor = Color.White,
                        focusedBorderColor = primary,
                        unfocusedBorderColor = Color(0xFFD7DEEA),
                        cursorColor = primary,
                    ),
                )
                Spacer(Modifier.height(28.dp))
                Text(
                    stringResource(R.string.available_profiles).uppercase(),
                    color = Color(0xFF93A4BE),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = .8.sp,
                )
            }
            if (filteredChildren.isEmpty()) {
                item { GrowWellEmptyState(Icons.Default.ChildCare, stringResource(R.string.no_children)) }
            }
            items(filteredChildren, key = { it.id }) { child ->
                val selected = selectedChild == child.id
                val selectAndConfirm = {
                    selectedChild = child.id
                    childToStart = child
                }
                Surface(
                    modifier = Modifier.fillMaxWidth().clickable(onClick = selectAndConfirm),
                    shape = RoundedCornerShape(16.dp),
                    color = if (selected) Color(0xFFF0F9FA) else Color.White,
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (selected) primary else Color(0xFFE8ECF2),
                    ),
                    shadowElevation = if (selected) 0.dp else 2.dp,
                ) {
                    Row(
                        Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        RadioButton(
                            selected = selected,
                            onClick = selectAndConfirm,
                            colors = RadioButtonDefaults.colors(
                                selectedColor = primary,
                                unselectedColor = Color(0xFFCAD6E5),
                            ),
                        )
                        Spacer(Modifier.width(4.dp))
                        Column(Modifier.weight(1f)) {
                            Text(
                                child.fullName,
                                color = Color(0xFF263142),
                                fontSize = 16.sp,
                                fontWeight = FontWeight.SemiBold,
                            )
                            Spacer(Modifier.height(3.dp))
                            Text(
                                stringResource(R.string.profile_ready),
                                color = Color(0xFF71829F),
                                fontSize = 12.sp,
                            )
                        }
                        Box(
                            Modifier.size(38.dp).background(Color(0x0D0D5C63), RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(Icons.Default.PersonOutline, null, tint = primary, modifier = Modifier.size(21.dp))
                        }
                    }
                }
            }
            item {
                Spacer(Modifier.height(28.dp))
                Button(
                    onClick = {
                        childToStart = state.children.firstOrNull { it.id == selectedChild }
                    },
                    enabled = selectedChild != null,
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = primary,
                        contentColor = Color.White,
                        disabledContainerColor = primary.copy(alpha = .4f),
                    ),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 6.dp),
                ) {
                    Text(stringResource(R.string.load_questions), fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(10.dp))
                    Icon(Icons.AutoMirrored.Filled.ArrowForward, null, Modifier.size(20.dp))
                }
            }
        }
        form?.questions?.let { questions ->
            val scaleOrder = form.scales.map { it.id }.ifEmpty {
                questions.map { it.scaleId }.distinct()
            }
            val activeScaleId = questions.firstOrNull { it.id !in answers }?.scaleId
                ?: questions.lastOrNull()?.scaleId
            val activeSection = (scaleOrder.indexOf(activeScaleId).takeIf { it >= 0 } ?: 0) + 1
            stickyHeader {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    color = Color.White,
                    shadowElevation = 8.dp,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE0E7E8)),
                ) {
                    Column(Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                        Row(
                            Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Bottom,
                        ) {
                            Text(
                                stringResource(
                                    R.string.screening_section_progress,
                                    activeSection,
                                    scaleOrder.size.coerceAtLeast(1),
                                ).uppercase(),
                                color = primary,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp,
                            )
                            Text(
                                stringResource(R.string.sdq_assessment),
                                color = Color(0xFF111C2C),
                                fontSize = 18.sp,
                                fontWeight = FontWeight.SemiBold,
                            )
                        }
                        Spacer(Modifier.height(4.dp))
                        Text(
                            stringResource(R.string.question_progress, answers.size, questions.size),
                            color = Color(0xFF6F797A),
                            fontSize = 12.sp,
                        )
                        Spacer(Modifier.height(7.dp))
                        LinearProgressIndicator(
                            progress = { if (questions.isEmpty()) 0f else answers.size.toFloat() / questions.size },
                            modifier = Modifier.fillMaxWidth().height(7.dp),
                            color = primary,
                            trackColor = Color(0xFFE7EEFF),
                        )
                    }
                }
            }
            items(questions, key = { it.id }) { question ->
                Card(
                    Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(
                        topStart = 24.dp,
                        topEnd = 24.dp,
                        bottomEnd = 8.dp,
                        bottomStart = 24.dp,
                    ),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                ) {
                    Column(
                        Modifier.padding(24.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Text(
                            question.localizedText(language),
                            color = Color(0xFF111C2C),
                            fontSize = 20.sp,
                            lineHeight = 28.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Spacer(Modifier.height(2.dp))
                        listOf(
                            "tidak_benar" to R.string.answer_not_true,
                            "agak_benar" to R.string.answer_somewhat_true,
                            "selalu_benar" to R.string.answer_certainly_true,
                        ).forEach { (value, labelRes) ->
                            val selected = answers[question.id] == value
                            val optionShape = RoundedCornerShape(12.dp)
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(
                                        if (selected) Color(0xFFF0F3FF) else Color.White,
                                        optionShape,
                                    )
                                    .border(
                                        1.dp,
                                        if (selected) primary else Color(0xFFBFC8C9),
                                        optionShape,
                                    )
                                    .clickable {
                                        answers[question.id] = value
                                        val childId = selectedChild
                                        if (childId != null) {
                                            onSaveDraft(
                                                childId,
                                                form.revision,
                                                answers.map { AnswerRequest(it.key, it.value) },
                                            )
                                        }
                                    }
                                    .padding(horizontal = 10.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                RadioButton(
                                    selected = selected,
                                    onClick = {
                            answers[question.id] = value
                            val childId = selectedChild
                            if (childId != null) onSaveDraft(childId, form.revision, answers.map { AnswerRequest(it.key, it.value) })
                                    },
                                    colors = RadioButtonDefaults.colors(
                                        selectedColor = primary,
                                        unselectedColor = Color(0xFFBFC8C9),
                                    ),
                                )
                                Spacer(Modifier.width(4.dp))
                                Text(
                                    stringResource(labelRes),
                                    color = Color(0xFF3F484A),
                                    fontSize = 16.sp,
                                )
                            }
                        }
                    }
                }
            }
            item {
                Button(
                    onClick = {
                        submissionToConfirm = ScreeningRequest(
                            childId = requireNotNull(selectedChild),
                            clientSubmissionId = requireNotNull(state.screeningSubmissionId),
                            instrumentRevision = form.revision,
                            jawaban = questions.map { AnswerRequest(it.id, requireNotNull(answers[it.id])) },
                        )
                    },
                    enabled = selectedChild != null && answers.size == questions.size,
                    modifier = Modifier.fillMaxWidth().height(62.dp),
                    shape = RoundedCornerShape(32.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = primary,
                        contentColor = Color.White,
                        disabledContainerColor = primary.copy(alpha = .4f),
                    ),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 8.dp),
                ) {
                    Text(
                        stringResource(R.string.submit_screening).uppercase(),
                        fontWeight = FontWeight.Bold,
                    )
                    Spacer(Modifier.width(10.dp))
                    Icon(Icons.AutoMirrored.Filled.Send, null, Modifier.size(22.dp))
                }
            }
        }
    }
    submissionToConfirm?.let { request ->
        GrowWellConfirmationDialog(
            icon = Icons.AutoMirrored.Filled.Send,
            title = stringResource(R.string.submit_screening_title),
            message = stringResource(R.string.submit_screening_body),
            confirmLabel = stringResource(R.string.submit),
            dismissLabel = stringResource(R.string.review_again),
            onConfirm = {
                submissionToConfirm = null
                onSubmit(request)
            },
            onDismiss = { submissionToConfirm = null },
        )
    }
    childToStart?.let { child ->
        GrowWellConfirmationDialog(
            icon = Icons.AutoMirrored.Filled.FactCheck,
            title = stringResource(R.string.start_screening_title),
            message = stringResource(R.string.start_screening_body, child.fullName),
            confirmLabel = stringResource(R.string.start_screening),
            dismissLabel = stringResource(R.string.cancel),
            actionColor = primary,
            onConfirm = {
                childToStart = null
                onStart(child.id)
            },
            onDismiss = { childToStart = null },
        )
    }
}

@Composable
private fun MonitoringScreen(state: AppContentState, language: AppLanguage, onLoad: (Int) -> Unit) {
    val monitoring = state.monitoring
    var selectedChild by remember { mutableStateOf(state.selectedMonitoringChildId) }
    var childSearch by remember { mutableStateOf("") }
    val primary = Color(0xFF0D5C63)
    val filteredChildren = state.children.filter {
        childSearch.isBlank() || it.fullName.contains(childSearch, ignoreCase = true)
    }
    LaunchedEffect(state.selectedMonitoringChildId) {
        state.selectedMonitoringChildId?.let { selectedChild = it }
    }
    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 24.dp, end = 24.dp, top = 24.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Text(
                stringResource(R.string.child_monitoring),
                color = Color(0xFF111C2C),
                fontSize = 28.sp,
                lineHeight = 38.sp,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(32.dp))
            OutlinedTextField(
                value = childSearch,
                onValueChange = { childSearch = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text(stringResource(R.string.search_children), color = Color(0xFF8B9AB5)) },
                leadingIcon = { Icon(Icons.Default.Search, null, tint = Color(0xFF8B9AB5)) },
                singleLine = true,
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Color.White,
                    unfocusedContainerColor = Color.White,
                    focusedBorderColor = primary,
                    unfocusedBorderColor = Color(0xFFD7DEEA),
                    cursorColor = primary,
                ),
            )
            Spacer(Modifier.height(28.dp))
            Text(
                stringResource(R.string.available_profiles).uppercase(),
                color = Color(0xFF93A4BE),
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = .8.sp,
            )
        }
        if (filteredChildren.isEmpty()) {
            item { GrowWellEmptyState(Icons.Default.ChildCare, stringResource(R.string.no_children)) }
        }
        items(filteredChildren, key = { "monitoring-${it.id}" }) { child ->
            val selected = selectedChild == child.id
            val selectAndLoad = {
                selectedChild = child.id
                onLoad(child.id)
            }
            Surface(
                modifier = Modifier.fillMaxWidth().clickable(onClick = selectAndLoad),
                shape = RoundedCornerShape(16.dp),
                color = if (selected) Color(0xFFF0F9FA) else Color.White,
                border = androidx.compose.foundation.BorderStroke(1.dp, if (selected) primary else Color(0xFFE8ECF2)),
                shadowElevation = if (selected) 0.dp else 2.dp,
            ) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(
                        selected = selected,
                        onClick = selectAndLoad,
                        colors = RadioButtonDefaults.colors(selectedColor = primary, unselectedColor = Color(0xFFCAD6E5)),
                    )
                    Spacer(Modifier.width(4.dp))
                    Column(Modifier.weight(1f)) {
                        Text(child.fullName, color = Color(0xFF263142), fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                        Spacer(Modifier.height(3.dp))
                        Text(
                            if (state.selectedMonitoringChildId == child.id && monitoring != null) {
                                stringResource(R.string.monitoring_loaded)
                            } else {
                                stringResource(R.string.monitoring_ready)
                            },
                            color = Color(0xFF71829F),
                            fontSize = 12.sp,
                        )
                    }
                    Box(
                        Modifier.size(38.dp).background(Color(0x0D0D5C63), RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.AutoMirrored.Filled.ShowChart, null, tint = primary, modifier = Modifier.size(21.dp))
                    }
                }
            }
        }
        item {
            Spacer(Modifier.height(28.dp))
            Button(
                onClick = { selectedChild?.let(onLoad) },
                enabled = selectedChild != null,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = primary,
                    contentColor = Color.White,
                    disabledContainerColor = primary.copy(alpha = .4f),
                ),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 6.dp),
            ) {
                Text(stringResource(R.string.load_monitoring), fontSize = 16.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.width(10.dp))
                Icon(Icons.AutoMirrored.Filled.ArrowForward, null, Modifier.size(20.dp))
            }
        }
        monitoring?.let { data ->
            item { Spacer(Modifier.height(20.dp)) }
            item { MonitoringChart(data) }
            item {
                Spacer(Modifier.height(12.dp))
                Text(stringResource(R.string.screening_history), color = primary, fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
            }
            if (data.riwayat.isEmpty()) item {
                GrowWellEmptyState(Icons.Default.History, stringResource(R.string.no_screening_history))
            }
            items(data.riwayat, key = { it.id }) { entry ->
                MonitoringHistoryCard(entry, language, state.screeningForm)
            }
        }
    }
}

@Composable
private fun MonitoringHistoryCard(
    screening: ScreeningDto,
    language: AppLanguage,
    form: ScreeningFormDto?,
) {
    var expanded by remember(screening.id) { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        ActivityCard(screening, language)
        if (screening.perScale.isNotEmpty()) {
            OutlinedButton(
                onClick = { expanded = !expanded },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFBFC8C9)),
            ) {
                Text(stringResource(if (expanded) R.string.hide_details else R.string.screening_detail))
                Spacer(Modifier.weight(1f))
                Icon(
                    if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = null,
                )
            }
            if (expanded) {
                Card(
                    Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x33BFC8C9)),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                ) {
                    Column(Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(shape = RoundedCornerShape(10.dp), color = Color(0xFFF0F3FF)) {
                                Icon(
                                    Icons.Default.Analytics,
                                    null,
                                    tint = Color(0xFF0D5C63),
                                    modifier = Modifier.padding(9.dp).size(21.dp),
                                )
                            }
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text(
                                    stringResource(R.string.score_breakdown),
                                    color = Color(0xFF111C2C),
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                )
                                Text(
                                    stringResource(
                                        R.string.total_score,
                                        screening.totalScore?.toString() ?: "–",
                                    ),
                                    color = Color(0xFF6F797A),
                                    fontSize = 13.sp,
                                )
                            }
                        }
                        Spacer(Modifier.height(14.dp))
                        HorizontalDivider(color = Color(0xFFE7EEFF))
                        Spacer(Modifier.height(4.dp))
                        screening.perScale.forEach { scale ->
                            ScreeningScaleRow(
                                name = localizedScaleName(scale.scaleId, scale.scaleName, form, language),
                                score = scale.skor,
                                category = localizedCategory(scale.kategori),
                                categoryKey = scale.kategori.lowercase(),
                            )
                        }
                    }
                }
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
private fun DashboardScreen(
    state: AppContentState,
    language: AppLanguage,
    onChildren: () -> Unit,
    onMonitoring: () -> Unit,
) {
    val primary = Color(0xFF004349)
    val recent = state.dashboard?.recentScreenings.orEmpty()
    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 24.dp, end = 24.dp, top = 16.dp, bottom = 96.dp),
    ) {
        item {
            Text(stringResource(R.string.summary), color = primary, fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(16.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                MetricCard(stringResource(R.string.total_children), state.children.size.toString(), Modifier.weight(1f), onChildren)
                MetricCard(stringResource(R.string.recent_activity), state.dashboard?.recentScreenings?.size?.toString() ?: "–", Modifier.weight(1f), onMonitoring)
            }
            Spacer(Modifier.height(40.dp))
            Box(
                Modifier.fillMaxWidth().height(32.dp)
                    .background(Color(0x1A0D5C63), RoundedCornerShape(topEnd = 8.dp, bottomEnd = 8.dp))
            ) { Box(Modifier.fillMaxHeight().width(4.dp).background(primary)) }
            Spacer(Modifier.height(32.dp))
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                Text(stringResource(R.string.recent_activity), color = primary, fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
                TextButton(onClick = onMonitoring) { Text(stringResource(R.string.view_all), color = primary) }
            }
            Spacer(Modifier.height(8.dp))
        }
        if (recent.isEmpty()) item {
            GrowWellEmptyState(Icons.Default.History, stringResource(R.string.no_recent_activity))
        }
        items(recent, key = { it.id }) { screening ->
            ActivityCard(screening, language)
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun MetricCard(label: String, value: String, modifier: Modifier, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = modifier.heightIn(min = 116.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x4DBFC8C9)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(Modifier.padding(24.dp)) {
            Text(value, color = Color(0xFF004349), fontSize = 36.sp, lineHeight = 44.sp, fontWeight = FontWeight.Bold)
            Text(label, color = Color(0xFF3F484A), fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun ActivityCard(screening: ScreeningDto, language: AppLanguage) {
    val category = localizedCategory(screening.category)
    val key = screening.category?.lowercase()
    val accent = when (key) {
        "abnormal" -> Color(0xFFBA1A1A)
        "borderline" -> Color(0xFF934A29)
        else -> Color(0xFF0D5C63)
    }
    val badgeBackground = when (key) {
        "abnormal" -> Color(0xFFFFDAD6)
        "borderline" -> Color(0xFFFFB598)
        else -> Color(0xFFABEEF6)
    }
    val badgeContent = when (key) {
        "abnormal" -> Color(0xFF93000A)
        "borderline" -> Color(0xFF763315)
        else -> Color(0xFF004349)
    }
    Card(
        Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x33BFC8C9)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Box {
            Box(Modifier.align(Alignment.CenterEnd).fillMaxHeight().width(4.dp).background(accent))
            Column(Modifier.fillMaxWidth().padding(24.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                screening.child?.let {
                    Text(
                        it.fullName,
                        color = Color(0xFF004349),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                    )
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
                    Text(
                        formatApiDate(screening.createdAt, language) ?: stringResource(R.string.date_unavailable),
                        color = Color(0xFF6F797A), fontSize = 12.sp, fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        category.uppercase(),
                        modifier = Modifier.background(badgeBackground, RoundedCornerShape(50)).padding(horizontal = 8.dp, vertical = 3.dp),
                        color = badgeContent, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = .4.sp,
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        stringResource(R.string.score_value, screening.totalScore?.toString() ?: "–"),
                        color = Color(0xFF111C2C), fontSize = 20.sp, fontWeight = FontWeight.SemiBold,
                    )
                    Box(Modifier.padding(horizontal = 8.dp).size(6.dp).background(Color(0xFFBFC8C9), RoundedCornerShape(50)))
                    Text(category, color = accent, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                }
                screening.performer?.fullName?.let {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.ManageAccounts, null, tint = Color(0xFF6F797A), modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(stringResource(R.string.performed_by, it), color = Color(0xFF3F484A), fontSize = 14.sp)
                    }
                }
            }
        }
    }
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
    var search by remember { mutableStateOf("") }
    val visibleChildren = children
        .filter { search.isBlank() || it.fullName.contains(search, ignoreCase = true) }
        .sortedBy { it.fullName.lowercase() }
    val primary = Color(0xFF0D5C63)

    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 24.dp, end = 24.dp, top = 24.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Text(
                stringResource(R.string.nav_children),
                color = Color(0xFF111C2C),
                fontSize = 28.sp,
                lineHeight = 36.sp,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(24.dp))
            OutlinedTextField(
                value = search,
                onValueChange = { search = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text(stringResource(R.string.search_by_name), color = Color(0xFF8B94A5)) },
                leadingIcon = { Icon(Icons.Default.Search, null, tint = Color(0xFF8B94A5)) },
                singleLine = true,
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Color.White,
                    unfocusedContainerColor = Color.White,
                    focusedBorderColor = primary,
                    unfocusedBorderColor = Color(0xFFF1F2F4),
                    cursorColor = primary,
                ),
            )
        }
        if (visibleChildren.isEmpty()) item {
            GrowWellEmptyState(Icons.Default.ChildCare, stringResource(R.string.no_children))
        }
        items(visibleChildren, key = { it.id }) { child ->
            Card(
                Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x1ABFC8C9)),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
            ) {
                Column(Modifier.padding(20.dp)) {
                    Text(child.fullName, color = primary, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CalendarMonth, null, tint = Color(0xFF7B8495), modifier = Modifier.size(15.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(
                            stringResource(
                                R.string.child_date_gender,
                                formatApiDate(child.birthDate, language) ?: child.birthDate,
                                localizedGender(child.gender),
                            ),
                            color = Color(0xFF7B8495),
                            fontSize = 14.sp,
                        )
                    }
                    Spacer(Modifier.height(16.dp))
                    HorizontalDivider(color = Color(0xFFF1F2F4))
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick = { editing = child }) {
                            Icon(Icons.Default.Edit, null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(stringResource(R.string.edit))
                        }
                        TextButton(
                            onClick = { deleting = child },
                            colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFFFF3B3B)),
                        ) {
                            Icon(Icons.Default.DeleteOutline, null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(stringResource(R.string.delete))
                        }
                    }
                }
            }
        }
    }
    editing?.let { child -> ChildFormDialog(child, onDismiss = { editing = null }) { onUpdate(child.id, it); editing = null } }
    deleting?.let { child ->
        GrowWellConfirmationDialog(
            icon = Icons.Default.DeleteOutline,
            title = stringResource(R.string.delete_child_title),
            message = stringResource(R.string.delete_child_body, child.fullName),
            confirmLabel = stringResource(R.string.delete),
            dismissLabel = stringResource(R.string.cancel),
            actionColor = Color(0xFFBA1A1A),
            onConfirm = {
                onDelete(child.id)
                deleting = null
            },
            onDismiss = { deleting = null },
        )
    }
}

@Composable
private fun EducationScreen(items: List<EducationDto>, language: AppLanguage) {
    var search by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("all") }
    val uriHandler = LocalUriHandler.current
    val filtered = items.filter {
        (type == "all" || it.tipe.equals(type, ignoreCase = true)) &&
            (search.isBlank() || it.judul.contains(search, true) ||
                it.englishTitle.orEmpty().contains(search, true) ||
                it.deskripsi.orEmpty().contains(search, true) ||
                it.englishDescription.orEmpty().contains(search, true))
    }
    val primary = Color(0xFF0D5C63)
    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 24.dp, end = 24.dp, top = 24.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Text(
                stringResource(R.string.education_materials),
                color = primary,
                fontSize = 28.sp,
                lineHeight = 36.sp,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(24.dp))
            OutlinedTextField(
                value = search,
                onValueChange = { search = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text(stringResource(R.string.search_materials), color = Color(0xFF8B94A5)) },
                leadingIcon = { Icon(Icons.Default.Search, null, tint = Color(0xFF8B94A5)) },
                singleLine = true,
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Color.White,
                    unfocusedContainerColor = Color.White,
                    focusedBorderColor = primary,
                    unfocusedBorderColor = Color(0xFFF0F1F3),
                    cursorColor = primary,
                ),
            )
            Spacer(Modifier.height(14.dp))
            Row(
                Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                listOf("all", "pdf", "gambar", "youtube").forEach { value ->
                    val selected = type == value
                    FilterChip(
                        selected = selected,
                        onClick = { type = value },
                        label = {
                            Text(
                                if (value == "all") stringResource(R.string.filter_all) else localizedMaterialType(value),
                                fontSize = 12.sp,
                            )
                        },
                        shape = RoundedCornerShape(50),
                        colors = FilterChipDefaults.filterChipColors(
                            containerColor = Color.White,
                            labelColor = Color(0xFF3F484A),
                            selectedContainerColor = primary,
                            selectedLabelColor = Color.White,
                        ),
                        border = FilterChipDefaults.filterChipBorder(
                            enabled = true,
                            selected = selected,
                            borderColor = Color.Transparent,
                            selectedBorderColor = Color.Transparent,
                        ),
                    )
                }
            }
            Spacer(Modifier.height(10.dp))
        }
        if (filtered.isEmpty()) item {
            GrowWellEmptyState(Icons.AutoMirrored.Filled.MenuBook, stringResource(R.string.no_education))
        }
        items(filtered, key = { it.id }) { entry ->
            val safeUrl = safeWebUrl(entry.assetUrl ?: entry.source, BuildConfig.DEBUG)
            Card(
                Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x33BFC8C9)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            ) {
                Column(Modifier.padding(18.dp)) {
                    if (!entry.tipe.equals("video", ignoreCase = true)) {
                        EducationTypeBadge(entry.tipe)
                    }
                    Spacer(Modifier.height(12.dp))
                    Text(
                        entry.localizedTitle(language),
                        color = primary,
                        fontSize = 18.sp,
                        lineHeight = 23.sp,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                    entry.localizedDescription(language).takeIf(String::isNotBlank)?.let {
                        Spacer(Modifier.height(7.dp))
                        Text(
                            it,
                            color = Color(0xFF5D6668),
                            fontSize = 13.sp,
                            lineHeight = 18.sp,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                    Spacer(Modifier.height(14.dp))
                    HorizontalDivider(color = Color(0xFFECEFF1))
                    if (safeUrl != null) {
                        TextButton(
                            onClick = { uriHandler.openUri(safeUrl) },
                            contentPadding = PaddingValues(horizontal = 0.dp, vertical = 4.dp),
                        ) {
                            Text(stringResource(R.string.open_material), color = primary, fontWeight = FontWeight.SemiBold)
                            Spacer(Modifier.width(8.dp))
                            Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = primary, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun EducationTypeBadge(type: String) {
    val normalized = type.lowercase()
    val background = when (normalized) {
        "pdf" -> Color(0xFFFFB598)
        "gambar", "image" -> Color(0xFFDEE8FF)
        else -> Color(0xFFABEef6)
    }
    val foreground = when (normalized) {
        "pdf" -> Color(0xFF763315)
        else -> Color(0xFF004349)
    }
    Text(
        localizedMaterialType(type).uppercase(),
        modifier = Modifier.background(background, RoundedCornerShape(7.dp)).padding(horizontal = 10.dp, vertical = 4.dp),
        color = foreground,
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = .4.sp,
    )
}

@Composable
private fun PsychologistsScreen(items: List<PsychologistDto>, language: AppLanguage) {
    var search by remember { mutableStateOf("") }
    val uriHandler = LocalUriHandler.current
    val filtered = items.filter { search.isBlank() || it.nama.contains(search, true) || it.spesialisasi.orEmpty().contains(search, true) || it.englishSpecialization.orEmpty().contains(search, true) }
    val primary = Color(0xFF004349)
    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 24.dp, end = 24.dp, top = 24.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        item {
            Text(
                stringResource(R.string.psychologist_help),
                color = primary,
                fontSize = 28.sp,
                lineHeight = 34.sp,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(22.dp))
            OutlinedTextField(
                value = search,
                onValueChange = { search = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text(stringResource(R.string.search_psychologist), color = Color(0xFF8B94A5)) },
                leadingIcon = { Icon(Icons.Default.Search, null, tint = Color(0xFF8B94A5)) },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Color.White,
                    unfocusedContainerColor = Color.White,
                    focusedBorderColor = primary,
                    unfocusedBorderColor = Color(0xFFBFC8C9),
                    cursorColor = primary,
                ),
            )
        }
        if (filtered.isEmpty()) item {
            GrowWellEmptyState(Icons.Default.SupportAgent, stringResource(R.string.no_psychologist))
        }
        items(filtered, key = { it.id }) { psychologist ->
            Card(
                Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x33BFC8C9)),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
            ) {
                Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Row(verticalAlignment = Alignment.Top) {
                        Box(
                            Modifier
                                .size(64.dp)
                                .background(Color(0xFFE8F2F3), RoundedCornerShape(50))
                                .border(2.dp, Color(0xFF0D5C63), RoundedCornerShape(50)),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                psychologist.nama
                                    .split(" ")
                                    .mapNotNull { it.firstOrNull()?.takeIf(Char::isLetter) }
                                    .take(2)
                                    .joinToString("")
                                    .uppercase(),
                                color = primary,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                        Spacer(Modifier.width(16.dp))
                        Column(Modifier.weight(1f)) {
                            Text(
                                psychologist.nama,
                                color = primary,
                                fontSize = 20.sp,
                                lineHeight = 25.sp,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                            )
                            psychologist.localizedSpecialization(language).takeIf(String::isNotBlank)?.let {
                                Spacer(Modifier.height(4.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Psychology, null, tint = Color(0xFF934A29), modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(6.dp))
                                    Text(
                                        it,
                                        color = Color(0xFF934A29),
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                    )
                                }
                            }
                        }
                    }
                    psychologist.phone?.let {
                        Row(
                            Modifier
                                .fillMaxWidth()
                                .background(Color(0xFFF0F3FF), RoundedCornerShape(9.dp))
                                .border(1.dp, Color(0x4DBFC8C9), RoundedCornerShape(9.dp))
                                .padding(horizontal = 14.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Icon(Icons.Default.Phone, null, tint = primary, modifier = Modifier.size(19.dp))
                            Spacer(Modifier.width(10.dp))
                            Text(it, color = Color(0xFF263142), fontSize = 13.sp, fontWeight = FontWeight.Medium)
                        }
                    }
                    whatsappUrl(psychologist.phone, psychologist.localizedMessage(language))?.let { url ->
                        Button(
                            onClick = { uriHandler.openUri(url) },
                            modifier = Modifier.fillMaxWidth().height(50.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = primary, contentColor = Color.White),
                            elevation = ButtonDefaults.buttonElevation(defaultElevation = 5.dp),
                        ) {
                            Icon(Icons.AutoMirrored.Filled.Chat, null, modifier = Modifier.size(21.dp))
                            Spacer(Modifier.width(10.dp))
                            Text(stringResource(R.string.chat_whatsapp), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ChildFormDialog(initial: ChildDto? = null, onDismiss: () -> Unit, onSave: (CreateChildRequest) -> Unit) {
    var name by remember(initial?.id) { mutableStateOf(initial?.fullName.orEmpty()) }
    var birthDate by remember(initial?.id) { mutableStateOf(initial?.birthDate?.take(10).orEmpty()) }
    var gender by remember(initial?.id) { mutableStateOf(initial?.gender ?: "L") }
    var attemptedSave by remember(initial?.id) { mutableStateOf(false) }
    var showDatePicker by remember { mutableStateOf(false) }
    val validName = name.trim().length in 1..100
    val validDate = isValidApiDate(birthDate.trim())
    val primary = Color(0xFF004349)

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(28.dp),
            color = Color.White,
            shadowElevation = 20.dp,
        ) {
            Column(Modifier.padding(28.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
                Text(
                    stringResource(if (initial == null) R.string.add_child else R.string.edit_child),
                    color = Color(0xFF111C2C),
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                )
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it.take(101) },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text(stringResource(R.string.full_name)) },
                    singleLine = true,
                    isError = attemptedSave && !validName,
                    supportingText = {
                        if (attemptedSave && !validName) Text(stringResource(R.string.invalid_child_name))
                    },
                    shape = RoundedCornerShape(14.dp),
                )
                OutlinedTextField(
                    value = birthDate,
                    onValueChange = {},
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text(stringResource(R.string.birth_date)) },
                    placeholder = { Text(stringResource(R.string.birth_date_hint)) },
                    readOnly = true,
                    singleLine = true,
                    isError = attemptedSave && !validDate,
                    supportingText = {
                        if (attemptedSave && !validDate) Text(stringResource(R.string.invalid_birth_date))
                    },
                    trailingIcon = {
                        IconButton(onClick = { showDatePicker = true }) {
                            Icon(Icons.Default.CalendarMonth, stringResource(R.string.select_birth_date), tint = primary)
                        }
                    },
                    shape = RoundedCornerShape(14.dp),
                )
                Text(stringResource(R.string.gender), color = Color(0xFF3F484A), fontWeight = FontWeight.SemiBold)
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    listOf("L" to R.string.gender_male, "P" to R.string.gender_female).forEach { (value, label) ->
                        FilterChip(
                            selected = gender == value,
                            onClick = { gender = value },
                            label = { Text(stringResource(label)) },
                            leadingIcon = {
                                Icon(
                                    if (value == "L") Icons.Default.Male else Icons.Default.Female,
                                    null,
                                    modifier = Modifier.size(18.dp),
                                )
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp),
                        )
                    }
                }
                Button(
                    onClick = {
                        attemptedSave = true
                        if (validName && validDate) {
                            onSave(CreateChildRequest(name.trim(), birthDate.trim(), gender))
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = primary),
                ) {
                    Text(stringResource(R.string.save), fontWeight = FontWeight.Bold)
                }
                TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                    Text(stringResource(R.string.cancel), color = Color(0xFF71829F))
                }
            }
        }
    }
    if (showDatePicker) {
        val initialMillis = remember(initial?.id) {
            birthDate.takeIf(::isValidApiDate)?.let {
                SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).apply {
                    isLenient = false
                    timeZone = java.util.TimeZone.getTimeZone("UTC")
                }.parse(it)?.time
            }
        }
        val pickerState = rememberDatePickerState(initialSelectedDateMillis = initialMillis)
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    pickerState.selectedDateMillis?.let { millis ->
                        birthDate = SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).apply {
                            timeZone = java.util.TimeZone.getTimeZone("UTC")
                        }.format(java.util.Date(millis))
                    }
                    showDatePicker = false
                }) { Text(stringResource(R.string.select)) }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) { Text(stringResource(R.string.cancel)) }
            },
        ) {
            DatePicker(state = pickerState)
        }
    }
}
