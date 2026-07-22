package id.growwell.mobile.ui

import id.growwell.mobile.data.locale.AppLanguage
import id.growwell.mobile.data.remote.dto.EducationDto
import id.growwell.mobile.data.remote.dto.PsychologistDto
import id.growwell.mobile.data.remote.dto.QuestionDto
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

class LocalizedContentTest {
    @Test fun `question selects requested language and falls back to Indonesian`() {
        val bilingual = QuestionDto(1, "Pertanyaan", "Question", "E")
        val fallback = QuestionDto(2, "Pertanyaan", null, "E")

        assertEquals("Pertanyaan", bilingual.localizedText(AppLanguage.INDONESIAN))
        assertEquals("Question", bilingual.localizedText(AppLanguage.ENGLISH))
        assertEquals("Pertanyaan", fallback.localizedText(AppLanguage.ENGLISH))
    }

    @Test fun `education and psychologist fields use English content`() {
        val education = EducationDto(1, "Judul", "Title", "Deskripsi", "Description", "pdf", null, null)
        val psychologist = PsychologistDto(1, "Doctor", "Psikologi Anak", "Child Psychology", null, "Halo", "Hello")

        assertEquals("Title", education.localizedTitle(AppLanguage.ENGLISH))
        assertEquals("Description", education.localizedDescription(AppLanguage.ENGLISH))
        assertEquals("Child Psychology", psychologist.localizedSpecialization(AppLanguage.ENGLISH))
        assertEquals("Hello", psychologist.localizedMessage(AppLanguage.ENGLISH))
    }

    @Test fun `date output follows selected locale`() {
        val idDate = formatApiDate("2026-07-22T12:00:00.000Z", AppLanguage.INDONESIAN)
        val enDate = formatApiDate("2026-07-22T12:00:00.000Z", AppLanguage.ENGLISH)

        assertNotEquals(idDate, enDate)
    }
}
