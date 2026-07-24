package id.growwell.mobile.data.session

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import id.growwell.mobile.data.remote.dto.UserDto
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class TokenStore(context: Context) {
    private val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
    private val keyStore = KeyStore.getInstance(ANDROID_KEY_STORE).apply { load(null) }

    @Volatile private var accessToken: String? = null

    fun accessToken(): String? = accessToken

    @Synchronized
    fun refreshToken(): String? {
        val stored = preferences.getString(KEY_REFRESH_TOKEN, null) ?: return null
        return runCatching { decrypt(stored) }.getOrElse {
            clear()
            null
        }
    }

    fun hasSession(): Boolean = refreshToken() != null

    @Synchronized
    fun save(access: String, refresh: String?, user: UserDto? = null) {
        accessToken = access
        preferences.edit().apply {
            if (refresh != null) putString(KEY_REFRESH_TOKEN, encrypt(refresh))
            if (user != null) {
                putInt(KEY_USER_ID, user.id)
                putString(KEY_USERNAME, user.username)
                putString(KEY_FULL_NAME, user.fullName)
                putString(KEY_ROLE, user.role)
            }
        }.apply()
    }

    fun cachedUser(): UserDto? {
        if (!preferences.contains(KEY_USER_ID)) return null
        val username = preferences.getString(KEY_USERNAME, null) ?: return null
        val fullName = preferences.getString(KEY_FULL_NAME, null) ?: return null
        val role = preferences.getString(KEY_ROLE, null) ?: return null
        return UserDto(preferences.getInt(KEY_USER_ID, 0), username, fullName, role)
    }

    @Synchronized
    fun clear() {
        accessToken = null
        preferences.edit()
            .remove(KEY_REFRESH_TOKEN)
            .remove(KEY_USER_ID)
            .remove(KEY_USERNAME)
            .remove(KEY_FULL_NAME)
            .remove(KEY_ROLE)
            .apply()
    }

    private fun encrypt(value: String): String {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, secretKey())
        val encrypted = cipher.doFinal(value.toByteArray(Charsets.UTF_8))
        return "${Base64.encodeToString(cipher.iv, Base64.NO_WRAP)}:${Base64.encodeToString(encrypted, Base64.NO_WRAP)}"
    }

    private fun decrypt(value: String): String {
        val parts = value.split(':', limit = 2)
        require(parts.size == 2) { "Invalid encrypted session" }
        val cipher = Cipher.getInstance(TRANSFORMATION)
        val iv = Base64.decode(parts[0], Base64.NO_WRAP)
        cipher.init(Cipher.DECRYPT_MODE, secretKey(), GCMParameterSpec(128, iv))
        return cipher.doFinal(Base64.decode(parts[1], Base64.NO_WRAP)).toString(Charsets.UTF_8)
    }

    private fun secretKey(): SecretKey {
        (keyStore.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEY_STORE)
        generator.init(
            KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build(),
        )
        return generator.generateKey()
    }

    private companion object {
        const val ANDROID_KEY_STORE = "AndroidKeyStore"
        const val KEY_ALIAS = "growwell_refresh_token_v2"
        const val PREFERENCES_NAME = "growwell_keystore_session_v2"
        const val KEY_REFRESH_TOKEN = "refresh_token"
        const val KEY_USER_ID = "user_id"
        const val KEY_USERNAME = "username"
        const val KEY_FULL_NAME = "full_name"
        const val KEY_ROLE = "role"
        const val TRANSFORMATION = "AES/GCM/NoPadding"
    }
}
