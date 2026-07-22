package id.growwell.mobile.ui

import id.growwell.mobile.data.locale.AppLanguage
import id.growwell.mobile.data.remote.dto.EducationDto
import id.growwell.mobile.data.remote.dto.PsychologistDto
import id.growwell.mobile.data.remote.dto.QuestionDto
import id.growwell.mobile.data.remote.dto.ScaleDto
import java.text.DateFormat
import java.text.SimpleDateFormat
import java.util.Locale

private fun choose(indonesian: String?, english: String?, language: AppLanguage): String =
    if (language == AppLanguage.ENGLISH) english?.takeIf(String::isNotBlank)
        ?: indonesian.orEmpty()
    else indonesian?.takeIf(String::isNotBlank) ?: english.orEmpty()

fun QuestionDto.localizedText(language: AppLanguage) = choose(text, englishText, language)
fun ScaleDto.localizedName(language: AppLanguage) = choose(name, englishName, language)
fun EducationDto.localizedTitle(language: AppLanguage) = choose(judul, englishTitle, language)
fun EducationDto.localizedDescription(language: AppLanguage) = choose(deskripsi, englishDescription, language)
fun PsychologistDto.localizedSpecialization(language: AppLanguage) = choose(spesialisasi, englishSpecialization, language)
fun PsychologistDto.localizedMessage(language: AppLanguage) = choose(defaultMessage, englishDefaultMessage, language)

fun formatApiDate(value: String?, language: AppLanguage): String? {
    val rawDate = value?.take(10) ?: return null
    val parsed = runCatching {
        SimpleDateFormat("yyyy-MM-dd", Locale.ROOT).apply { isLenient = false }.parse(rawDate)
    }.getOrNull() ?: return null
    val locale = if (language == AppLanguage.INDONESIAN) Locale.forLanguageTag("id-ID") else Locale.ENGLISH
    return DateFormat.getDateInstance(DateFormat.LONG, locale).format(parsed)
}
