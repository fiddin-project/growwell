package id.growwell.mobile.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import id.growwell.mobile.R

private val Colors = lightColorScheme(
    primary = Color(0xFF004349),
    onPrimary = Color.White,
    primaryContainer = Color(0xFF0D5C63),
    onPrimaryContainer = Color.White,
    secondary = Color(0xFF0D5C63),
    onSecondary = Color.White,
    background = Color(0xFFF9F9FF),
    onBackground = Color(0xFF111C2C),
    surface = Color.White,
    onSurface = Color(0xFF111C2C),
    surfaceVariant = Color(0xFFE7EEFF),
    onSurfaceVariant = Color(0xFF3F484A),
    outline = Color(0xFF6F797A),
    outlineVariant = Color(0xFFBFC8C9),
    error = Color(0xFFBA1A1A),
)

private val PlusJakartaSans = FontFamily(
    Font(R.font.plus_jakarta_sans, FontWeight.Normal),
    Font(R.font.plus_jakarta_sans, FontWeight.Medium),
    Font(R.font.plus_jakarta_sans, FontWeight.SemiBold),
    Font(R.font.plus_jakarta_sans, FontWeight.Bold),
)

private val GrowWellTypography = Typography().run {
    copy(
        displayLarge = displayLarge.copy(fontFamily = PlusJakartaSans),
        displayMedium = displayMedium.copy(fontFamily = PlusJakartaSans),
        displaySmall = displaySmall.copy(fontFamily = PlusJakartaSans),
        headlineLarge = headlineLarge.copy(fontFamily = PlusJakartaSans),
        headlineMedium = headlineMedium.copy(fontFamily = PlusJakartaSans),
        headlineSmall = headlineSmall.copy(fontFamily = PlusJakartaSans),
        titleLarge = titleLarge.copy(fontFamily = PlusJakartaSans),
        titleMedium = titleMedium.copy(fontFamily = PlusJakartaSans),
        titleSmall = titleSmall.copy(fontFamily = PlusJakartaSans),
        bodyLarge = bodyLarge.copy(fontFamily = PlusJakartaSans),
        bodyMedium = bodyMedium.copy(fontFamily = PlusJakartaSans),
        bodySmall = bodySmall.copy(fontFamily = PlusJakartaSans),
        labelLarge = labelLarge.copy(fontFamily = PlusJakartaSans),
        labelMedium = labelMedium.copy(fontFamily = PlusJakartaSans),
        labelSmall = labelSmall.copy(fontFamily = PlusJakartaSans),
    )
}

@Composable
fun GrowWellTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = Colors, typography = GrowWellTypography, content = content)
}
