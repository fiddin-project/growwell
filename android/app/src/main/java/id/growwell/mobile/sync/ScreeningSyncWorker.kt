package id.growwell.mobile.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import id.growwell.mobile.GrowWellApplication

class ScreeningSyncWorker(appContext: Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val id = inputData.getString(SUBMISSION_ID) ?: return Result.failure()
        val app = applicationContext as GrowWellApplication
        return if (app.container.repository.syncPending(id)) Result.success() else Result.retry()
    }

    companion object { const val SUBMISSION_ID = "submission_id" }
}
