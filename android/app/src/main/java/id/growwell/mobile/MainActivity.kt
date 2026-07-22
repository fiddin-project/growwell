package id.growwell.mobile

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import id.growwell.mobile.ui.AppViewModel
import id.growwell.mobile.ui.GrowWellApp
import id.growwell.mobile.ui.theme.GrowWellTheme
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        val container = (application as GrowWellApplication).container
        val language = runBlocking { container.languageStore.language.first() }
        val locales = LocaleListCompat.forLanguageTags(language.tag)
        if (AppCompatDelegate.getApplicationLocales() != locales) {
            AppCompatDelegate.setApplicationLocales(locales)
        }
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            GrowWellTheme {
                val appViewModel: AppViewModel = viewModel(
                    factory = AppViewModel.Factory(container.repository, container.languageStore),
                )
                GrowWellApp(appViewModel)
            }
        }
    }
}
