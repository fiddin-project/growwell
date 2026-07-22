package id.growwell.mobile

import android.app.Application
import id.growwell.mobile.data.AppContainer

class GrowWellApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
