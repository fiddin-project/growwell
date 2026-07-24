package id.growwell.mobile.data.remote

import id.growwell.mobile.data.remote.dto.RefreshRequest
import id.growwell.mobile.data.session.TokenStore
import okhttp3.Authenticator
import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route

class AccessTokenInterceptor(private val tokenStore: TokenStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = tokenStore.accessToken()
        val request = if (token == null) chain.request() else chain.request().newBuilder()
            .header("Authorization", "Bearer $token")
            .build()
        return chain.proceed(request)
    }
}

class RefreshAuthenticator(
    private val tokenStore: TokenStore,
    private val sessionApi: SessionApi,
) : Authenticator {
    private val lock = Any()

    override fun authenticate(route: Route?, response: Response): Request? {
        if (responseCount(response) >= 2) return null
        val refresh = tokenStore.refreshToken() ?: return null
        synchronized(lock) {
            val requestToken = response.request.header("Authorization")?.removePrefix("Bearer ")
            val currentToken = tokenStore.accessToken()
            if (currentToken != null && currentToken != requestToken) {
                return response.request.newBuilder().header("Authorization", "Bearer $currentToken").build()
            }
            val refreshed = runCatching {
                sessionApi.refreshBlocking(RefreshRequest(refreshToken = refresh)).execute()
            }.getOrNull()
            if (refreshed == null) return null
            if (!refreshed.isSuccessful) {
                if (refreshed.code() == 401 || refreshed.code() == 403) tokenStore.clear()
                return null
            }
            val body = refreshed.body()
            if (body == null) {
                tokenStore.clear()
                return null
            }
            tokenStore.save(body.accessToken, body.refreshToken, body.user)
            return response.request.newBuilder().header("Authorization", "Bearer ${body.accessToken}").build()
        }
    }

    private fun responseCount(response: Response): Int {
        var count = 1
        var prior = response.priorResponse
        while (prior != null) { count++; prior = prior.priorResponse }
        return count
    }
}
