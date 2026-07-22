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
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import id.growwell.mobile.data.remote.dto.*
import id.growwell.mobile.BuildConfig
import id.growwell.mobile.core.safeWebUrl
import id.growwell.mobile.core.whatsappUrl
import java.util.UUID

private enum class Tab(val label: String) { HOME("Beranda"), CHILDREN("Anak"), SCREENING("Skrining"), MONITORING("Monitoring"), EDUCATION("Edukasi"), HELP("Bantuan") }

@Composable
fun GrowWellApp(viewModel: AppViewModel) {
    val session by viewModel.session.collectAsStateWithLifecycle()
    val content by viewModel.content.collectAsStateWithLifecycle()
    LaunchedEffect(session) { if (session is SessionState.SignedIn && content.dashboard == null) viewModel.refresh() }
    content.error?.let { message ->
        AlertDialog(
            onDismissRequest = viewModel::clearError,
            confirmButton = { TextButton(onClick = viewModel::clearError) { Text("Tutup") } },
            title = { Text("Terjadi kendala") }, text = { Text(message) },
        )
    }
    when (session) {
        SessionState.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        SessionState.SignedOut -> LoginScreen(viewModel::login)
        is SessionState.SignedIn -> MainScreen(
            content, viewModel::refresh, viewModel::logout,
            viewModel::createChild, viewModel::updateChild, viewModel::deleteChild,
            viewModel::loadScreeningForm, viewModel::submitScreening, viewModel::resetScreening,
            viewModel::saveDraft,
            viewModel::loadDraft,
            viewModel::loadMonitoring,
        )
    }
}

@Composable
private fun LoginScreen(onLogin: (String, String) -> Unit) {
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    Surface(Modifier.fillMaxSize()) {
        Column(
            Modifier.fillMaxWidth().padding(32.dp),
            verticalArrangement = Arrangement.Center,
        ) {
            Text("GrowWell", style = MaterialTheme.typography.displaySmall, color = MaterialTheme.colorScheme.primary)
            Text("Pemantauan tumbuh kembang anak", style = MaterialTheme.typography.bodyLarge)
            Spacer(Modifier.height(32.dp))
            OutlinedTextField(username, { username = it }, Modifier.fillMaxWidth(), label = { Text("Username") }, singleLine = true)
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(password, { password = it }, Modifier.fillMaxWidth(), label = { Text("Password") }, singleLine = true, visualTransformation = PasswordVisualTransformation())
            Spacer(Modifier.height(20.dp))
            Button(onClick = { onLogin(username, password) }, enabled = username.isNotBlank() && password.isNotBlank(), modifier = Modifier.fillMaxWidth()) { Text("Masuk") }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainScreen(
    state: AppContentState,
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
            TopAppBar(title = { Text("GrowWell") }, actions = {
                IconButton(onClick = onRefresh) { Icon(Icons.Default.Refresh, "Muat ulang") }
                IconButton(onClick = onLogout) { Icon(Icons.AutoMirrored.Filled.Logout, "Keluar") }
            })
        },
        bottomBar = {
            NavigationBar {
                Tab.entries.forEach { item ->
                    val icon = when (item) { Tab.HOME -> Icons.Default.Home; Tab.CHILDREN -> Icons.Default.ChildCare; Tab.SCREENING -> Icons.AutoMirrored.Filled.FactCheck; Tab.MONITORING -> Icons.AutoMirrored.Filled.ShowChart; Tab.EDUCATION -> Icons.AutoMirrored.Filled.MenuBook; Tab.HELP -> Icons.Default.SupportAgent }
                    NavigationBarItem(selected = tab == item, onClick = { tab = item }, icon = { Icon(icon, null) }, label = { Text(item.label) })
                }
            }
        },
        floatingActionButton = {
            if (tab == Tab.CHILDREN) FloatingActionButton(onClick = { showChildForm = true }) { Icon(Icons.Default.Add, "Tambah anak") }
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when (tab) {
                Tab.HOME -> DashboardScreen(state)
                Tab.CHILDREN -> ChildrenScreen(state.children, onUpdateChild, onDeleteChild)
                Tab.SCREENING -> ScreeningScreen(state, onLoadScreening, onSubmitScreening, onResetScreening, onSaveDraft, onLoadDraft)
                Tab.MONITORING -> MonitoringScreen(state, onLoadMonitoring)
                Tab.EDUCATION -> EducationScreen(state.education)
                Tab.HELP -> PsychologistsScreen(state.psychologists)
            }
            if (state.loading) LinearProgressIndicator(Modifier.fillMaxWidth().align(Alignment.TopCenter))
        }
    }
    if (showChildForm) ChildFormDialog(onDismiss = { showChildForm = false }) { onCreateChild(it); showChildForm = false }
}

@Composable
private fun ScreeningScreen(
    state: AppContentState,
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
            Text("Menunggu sinkronisasi", style = MaterialTheme.typography.headlineMedium)
            Text("Skrining tersimpan aman di perangkat dan akan dikirim otomatis saat internet tersedia.")
            Text("ID: $submissionId", style = MaterialTheme.typography.bodySmall)
            Button(onClick = onReset) { Text("Kembali") }
        }
        return
    }
    if (result != null) {
        Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Hasil skrining", style = MaterialTheme.typography.headlineMedium)
            Text("Skor total: ${result.totalScore ?: "–"}", style = MaterialTheme.typography.headlineLarge)
            Text("Kategori: ${result.category ?: "–"}")
            result.perScale.forEach { scale -> Text("${scale.scaleName ?: scale.scaleId}: ${scale.skor} (${scale.kategori})") }
            Button(onClick = { answers.clear(); onReset() }) { Text("Skrining baru") }
        }
        return
    }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text("Skrining perkembangan", style = MaterialTheme.typography.headlineMedium) }
        item {
            Text("Pilih anak")
            state.children.forEach { child ->
                Row(verticalAlignment = Alignment.CenterVertically) { RadioButton(selectedChild == child.id, { selectedChild = child.id }); Text(child.fullName) }
            }
        }
        if (form == null) item { Button(onClick = onLoad, enabled = selectedChild != null) { Text("Muat pertanyaan") } }
        form?.questions?.let { questions ->
            items(questions, key = { it.id }) { question ->
                Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) {
                    Text(question.text, style = MaterialTheme.typography.titleMedium)
                    listOf("tidak_benar" to "Tidak benar", "agak_benar" to "Agak benar", "selalu_benar" to "Selalu benar").forEach { (value, label) ->
                        Row(verticalAlignment = Alignment.CenterVertically) { RadioButton(answers[question.id] == value, {
                            answers[question.id] = value
                            val childId = selectedChild
                            if (childId != null) onSaveDraft(childId, form.revision, answers.map { AnswerRequest(it.key, it.value) })
                        }); Text(label) }
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
                ) { Text("Kirim skrining") }
            }
        }
    }
    submissionToConfirm?.let { request ->
        AlertDialog(
            onDismissRequest = { submissionToConfirm = null },
            title = { Text("Kirim hasil skrining?") },
            text = { Text("Pastikan semua jawaban sudah benar. Skor resmi akan dihitung oleh server.") },
            confirmButton = { Button(onClick = { submissionToConfirm = null; onSubmit(request) }) { Text("Kirim") } },
            dismissButton = { TextButton(onClick = { submissionToConfirm = null }) { Text("Periksa lagi") } },
        )
    }
}

@Composable
private fun MonitoringScreen(state: AppContentState, onLoad: (Int) -> Unit) {
    val monitoring = state.monitoring
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text("Monitoring anak", style = MaterialTheme.typography.headlineMedium) }
        item {
            Text("Pilih anak")
            state.children.forEach { child ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(state.selectedMonitoringChildId == child.id, { onLoad(child.id) })
                    Text(child.fullName)
                }
            }
        }
        monitoring?.let { data ->
            item { MonitoringChart(data) }
            item { Text("Riwayat skrining", style = MaterialTheme.typography.titleLarge) }
            if (data.riwayat.isEmpty()) item { Text("Belum ada riwayat skrining.") }
            items(data.riwayat, key = { it.id }) { entry ->
                Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) {
                    Text(entry.createdAt?.take(10) ?: "Tanggal tidak tersedia", style = MaterialTheme.typography.titleMedium)
                    Text("Skor ${entry.totalScore ?: "–"} • ${entry.category ?: "–"}")
                    entry.performer?.fullName?.let { Text("Oleh $it", style = MaterialTheme.typography.bodySmall) }
                    entry.perScale.forEach { scale -> Text("${scale.scaleName ?: scale.scaleId}: ${scale.skor} (${scale.kategori})", style = MaterialTheme.typography.bodySmall) }
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
    val description = if (points.isEmpty()) "Grafik belum memiliki data" else "Grafik skor kronologis: ${points.joinToString()}. Batas normal ${threshold?.normalMax ?: "tidak tersedia"}, batas borderline ${threshold?.borderlineMax ?: "tidak tersedia"}."
    Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) {
        Text("Tren skor", style = MaterialTheme.typography.titleLarge)
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
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) { Text("Hijau: normal"); Text("Kuning: borderline") }
        Text(description, style = MaterialTheme.typography.bodySmall)
    } }
}

@Composable
private fun DashboardScreen(state: AppContentState) {
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text("Ringkasan", style = MaterialTheme.typography.headlineMedium) }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                MetricCard("Total anak", state.children.size.toString(), Modifier.weight(1f))
                MetricCard("Aktivitas terbaru", state.dashboard?.recentScreenings?.size?.toString() ?: "–", Modifier.weight(1f))
            }
        }
        item { Text("Semua anak dapat dilihat oleh admin dan seluruh pengasuh. Pembuat data tetap dicatat sebagai audit.") }
        item { Text("Aktivitas terbaru", style = MaterialTheme.typography.titleLarge) }
        val recent = state.dashboard?.recentScreenings.orEmpty()
        if (recent.isEmpty()) item { Text("Belum ada aktivitas skrining.") }
        items(recent, key = { it.id }) { screening ->
            Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) {
                Text(screening.createdAt?.take(10) ?: "Tanggal tidak tersedia", style = MaterialTheme.typography.titleMedium)
                Text("Skor ${screening.totalScore ?: "–"} • ${screening.category ?: "–"}")
                screening.performer?.fullName?.let { Text("Oleh $it", style = MaterialTheme.typography.bodySmall) }
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
    onUpdate: (Int, CreateChildRequest) -> Unit,
    onDelete: (Int) -> Unit,
) {
    var editing by remember { mutableStateOf<ChildDto?>(null) }
    var deleting by remember { mutableStateOf<ChildDto?>(null) }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
    item { Text("Data anak", style = MaterialTheme.typography.headlineMedium) }
    if (children.isEmpty()) item { Text("Belum ada data anak.") }
    items(children, key = { it.id }) { child ->
        Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) {
            Text(child.fullName, style = MaterialTheme.typography.titleMedium)
            Text("Lahir: ${child.birthDate} • ${child.gender}")
            child.creator?.fullName?.let { Text("Ditambahkan oleh $it", style = MaterialTheme.typography.bodySmall) }
            Row { TextButton(onClick = { editing = child }) { Text("Edit") }; TextButton(onClick = { deleting = child }) { Text("Hapus") } }
        } }
    }
    }
    editing?.let { child -> ChildFormDialog(child, onDismiss = { editing = null }) { onUpdate(child.id, it); editing = null } }
    deleting?.let { child -> AlertDialog(
        onDismissRequest = { deleting = null }, title = { Text("Hapus data anak?") },
        text = { Text("${child.fullName} akan dihapus. Data dengan riwayat skrining tetap akan ditolak server.") },
        confirmButton = { Button(onClick = { onDelete(child.id); deleting = null }) { Text("Hapus") } },
        dismissButton = { TextButton(onClick = { deleting = null }) { Text("Batal") } },
    ) }
}

@Composable
private fun EducationScreen(items: List<EducationDto>) {
    var search by remember { mutableStateOf("") }; var type by remember { mutableStateOf("all") }
    val uriHandler = LocalUriHandler.current
    val filtered = items.filter { (type == "all" || it.tipe == type) && (search.isBlank() || it.judul.contains(search, true) || it.englishTitle.orEmpty().contains(search, true)) }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
    item { Text("Materi edukasi", style = MaterialTheme.typography.headlineMedium) }
    item { OutlinedTextField(search, { search = it }, Modifier.fillMaxWidth(), label = { Text("Cari materi") }) }
    item { Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) { listOf("all" to "Semua", "pdf" to "PDF", "gambar" to "Gambar", "youtube" to "YouTube").forEach { (value, label) -> FilterChip(type == value, { type = value }, { Text(label) }) } } }
    if (filtered.isEmpty()) item { Text("Belum ada materi edukasi.") }
    items(filtered, key = { it.id }) { entry -> Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) {
        Text(entry.judul, style = MaterialTheme.typography.titleMedium); entry.deskripsi?.let { Text(it) }
        Text(entry.tipe.uppercase(), style = MaterialTheme.typography.labelSmall)
        val safeUrl = safeWebUrl(entry.assetUrl ?: entry.source, BuildConfig.DEBUG)
        if (safeUrl != null) TextButton(onClick = { uriHandler.openUri(safeUrl) }) { Text("Buka materi") }
    } } }
    }
}

@Composable
private fun PsychologistsScreen(items: List<PsychologistDto>) {
    var search by remember { mutableStateOf("") }
    val uriHandler = LocalUriHandler.current
    val filtered = items.filter { search.isBlank() || it.nama.contains(search, true) || it.spesialisasi.orEmpty().contains(search, true) }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
    item { Text("Bantuan psikolog", style = MaterialTheme.typography.headlineMedium) }
    item { OutlinedTextField(search, { search = it }, Modifier.fillMaxWidth(), label = { Text("Cari psikolog") }) }
    if (filtered.isEmpty()) item { Text("Belum ada data psikolog.") }
    items(filtered, key = { it.id }) { item -> Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) {
        Text(item.nama, style = MaterialTheme.typography.titleMedium); item.spesialisasi?.let { Text(it) }; item.phone?.let { Text("WhatsApp: $it") }
        whatsappUrl(item.phone, item.defaultMessage)?.let { url -> Button(onClick = { uriHandler.openUri(url) }) { Text("Chat WhatsApp") } }
    } } }
    }
}

@Composable
private fun ChildFormDialog(initial: ChildDto? = null, onDismiss: () -> Unit, onSave: (CreateChildRequest) -> Unit) {
    var name by remember(initial?.id) { mutableStateOf(initial?.fullName.orEmpty()) }; var birthDate by remember(initial?.id) { mutableStateOf(initial?.birthDate?.take(10).orEmpty()) }
    var gender by remember(initial?.id) { mutableStateOf(initial?.gender ?: "L") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initial == null) "Tambah anak" else "Edit anak") },
        text = { Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(name, { name = it }, label = { Text("Nama lengkap") })
            OutlinedTextField(birthDate, { birthDate = it }, label = { Text("Tanggal lahir (YYYY-MM-DD)") })
            Row(verticalAlignment = Alignment.CenterVertically) { RadioButton(gender == "L", { gender = "L" }); Text("Laki-laki"); RadioButton(gender == "P", { gender = "P" }); Text("Perempuan") }
        } },
        confirmButton = { Button(onClick = { onSave(CreateChildRequest(name.trim(), birthDate.trim(), gender)) }, enabled = name.isNotBlank() && Regex("\\d{4}-\\d{2}-\\d{2}").matches(birthDate)) { Text("Simpan") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Batal") } },
    )
}
