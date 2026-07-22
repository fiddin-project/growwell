package id.growwell.mobile.core

import org.junit.Assert.*
import org.junit.Test

class LinkUtilsTest {
    @Test fun `rejects unsafe schemes`() {
        assertNull(safeWebUrl("javascript:alert(1)"))
        assertNull(safeWebUrl("file:///tmp/secret"))
        assertNull(safeWebUrl("http://example.com"))
        assertEquals("http://10.0.2.2/file.pdf", safeWebUrl("http://10.0.2.2/file.pdf", allowHttp = true))
    }

    @Test fun `encodes whatsapp message exactly once`() {
        assertEquals(
            "https://wa.me/628123?text=Halo%2C%20saya%20ingin%20konsultasi%20anak%20%26%20keluarga.",
            whatsappUrl("+62 8123", "Halo, saya ingin konsultasi anak & keluarga."),
        )
    }
}
