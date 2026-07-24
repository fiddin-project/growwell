package id.growwell.mobile.data.local;

import android.content.Context;
import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;
import androidx.room.migration.Migration;
import androidx.sqlite.db.SupportSQLiteDatabase;

@Database(entities = {CachedChild.class, CachedPayload.class, ScreeningDraft.class, PendingScreening.class}, version = 2, exportSchema = false)
public abstract class GrowWellDatabase extends RoomDatabase {
    public abstract GrowWellDao dao();

    public static GrowWellDatabase create(Context context) {
        return Room.databaseBuilder(context.getApplicationContext(), GrowWellDatabase.class, "growwell.db")
            .addMigrations(MIGRATION_1_2)
            .build();
    }

    private static final Migration MIGRATION_1_2 = new Migration(1, 2) {
        @Override
        public void migrate(SupportSQLiteDatabase database) {
            database.execSQL(
                "CREATE TABLE IF NOT EXISTS `cached_payloads` (`cacheKey` TEXT NOT NULL, `json` TEXT NOT NULL, `updatedAt` INTEGER NOT NULL, PRIMARY KEY(`cacheKey`))"
            );
        }
    };
}
