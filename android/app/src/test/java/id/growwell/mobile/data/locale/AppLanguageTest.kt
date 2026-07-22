package id.growwell.mobile.data.locale

import org.junit.Assert.assertEquals
import org.junit.Test

class AppLanguageTest {
    @Test fun `language tags resolve supported languages`() {
        assertEquals(AppLanguage.INDONESIAN, AppLanguage.fromTag("id-ID"))
        assertEquals(AppLanguage.ENGLISH, AppLanguage.fromTag("en-US"))
    }

    @Test fun `unsupported or absent language defaults to Indonesian`() {
        assertEquals(AppLanguage.INDONESIAN, AppLanguage.fromTag(null))
        assertEquals(AppLanguage.INDONESIAN, AppLanguage.fromTag("fr"))
    }
}
