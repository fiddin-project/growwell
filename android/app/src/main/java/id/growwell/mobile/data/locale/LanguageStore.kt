package id.growwell.mobile.data.locale

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

private val Context.languageDataStore by preferencesDataStore(name = "language_preferences")

enum class AppLanguage(val tag: String) {
    INDONESIAN("id"),
    ENGLISH("en");

    companion object {
        fun fromTag(tag: String?): AppLanguage =
            entries.firstOrNull { tag?.startsWith(it.tag, ignoreCase = true) == true } ?: INDONESIAN
    }
}

class LanguageStore(private val context: Context) {
    private val languageKey = stringPreferencesKey("app_language")

    val language: Flow<AppLanguage> = context.languageDataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { preferences -> AppLanguage.fromTag(preferences[languageKey]) }

    suspend fun setLanguage(language: AppLanguage) {
        context.languageDataStore.edit { it[languageKey] = language.tag }
    }
}
