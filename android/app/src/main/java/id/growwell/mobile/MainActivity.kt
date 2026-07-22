package id.growwell.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.viewmodel.compose.viewModel
import id.growwell.mobile.ui.AppViewModel
import id.growwell.mobile.ui.GrowWellApp
import id.growwell.mobile.ui.theme.GrowWellTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            GrowWellTheme {
                val container = (application as GrowWellApplication).container
                val appViewModel: AppViewModel = viewModel(factory = AppViewModel.Factory(container.repository))
                GrowWellApp(appViewModel)
            }
        }
    }
}
