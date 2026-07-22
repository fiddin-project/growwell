package id.growwell.mobile.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Colors = lightColorScheme(
    primary = Color(0xFF1E7650), onPrimary = Color.White,
    secondary = Color(0xFF52634F), background = Color(0xFFF7FBF8),
    surface = Color.White, error = Color(0xFFBA1A1A),
)

@Composable
fun GrowWellTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = Colors, typography = Typography(), content = content)
}
