package id.growwell.mobile.data

import android.content.Context
import id.growwell.mobile.BuildConfig
import id.growwell.mobile.data.remote.*
import id.growwell.mobile.data.session.TokenStore
import id.growwell.mobile.data.local.GrowWellDatabase
import id.growwell.mobile.data.locale.LanguageStore
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class AppContainer(context: Context) {
    val languageStore = LanguageStore(context)
    val tokenStore = TokenStore(context)
    val database = GrowWellDatabase.create(context)

    private val baseRetrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.API_BASE_URL)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val sessionApi = baseRetrofit.create(SessionApi::class.java)
    private val httpClient = OkHttpClient.Builder()
        .addInterceptor(AccessTokenInterceptor(tokenStore))
        .authenticator(RefreshAuthenticator(tokenStore, sessionApi))
        .apply {
            if (BuildConfig.DEBUG) addInterceptor(
                HttpLoggingInterceptor().setLevel(HttpLoggingInterceptor.Level.BASIC),
            )
        }
        .build()

    val api: GrowWellApi = Retrofit.Builder()
        .baseUrl(BuildConfig.API_BASE_URL)
        .client(httpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(GrowWellApi::class.java)

    val repository = GrowWellRepository(context, api, tokenStore, database.dao())
}
