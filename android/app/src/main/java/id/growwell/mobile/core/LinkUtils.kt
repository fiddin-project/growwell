package id.growwell.mobile.core

import java.net.URI
import java.net.URLEncoder

fun safeWebUrl(value: String?, allowHttp: Boolean = false): String? {
    if (value.isNullOrBlank()) return null
    val uri = runCatching { URI(value) }.getOrNull() ?: return null
    val allowed = uri.scheme.equals("https", true) || (allowHttp && uri.scheme.equals("http", true))
    return value.takeIf { allowed && !uri.host.isNullOrBlank() }
}

fun whatsappUrl(phone: String?, message: String?): String? {
    val normalized = phone.orEmpty().filter(Char::isDigit)
    if (normalized.isBlank()) return null
    val encoded = URLEncoder.encode(message.orEmpty(), "UTF-8").replace("+", "%20")
    return "https://wa.me/$normalized?text=$encoded"
}
