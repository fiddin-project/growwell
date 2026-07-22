package id.growwell.mobile.data.local;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "cached_children")
public class CachedChild {
    @PrimaryKey public int id;
    @NonNull public String name;
    @NonNull public String birthDate;
    @NonNull public String gender;
    public String creatorName;
    public long cachedAt;

    public CachedChild(int id, @NonNull String name, @NonNull String birthDate, @NonNull String gender, String creatorName, long cachedAt) {
        this.id = id;
        this.name = name;
        this.birthDate = birthDate;
        this.gender = gender;
        this.creatorName = creatorName;
        this.cachedAt = cachedAt;
    }
}
