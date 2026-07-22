package id.growwell.mobile.data.local;

import android.content.Context;
import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;

@Database(entities = {CachedChild.class, ScreeningDraft.class, PendingScreening.class}, version = 1, exportSchema = false)
public abstract class GrowWellDatabase extends RoomDatabase {
    public abstract GrowWellDao dao();

    public static GrowWellDatabase create(Context context) {
        return Room.databaseBuilder(context.getApplicationContext(), GrowWellDatabase.class, "growwell.db").build();
    }
}
