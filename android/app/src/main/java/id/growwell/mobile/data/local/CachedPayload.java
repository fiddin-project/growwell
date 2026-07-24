package id.growwell.mobile.data.local;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "cached_payloads")
public class CachedPayload {
    @PrimaryKey @NonNull public String cacheKey;
    @NonNull public String json;
    public long updatedAt;

    public CachedPayload(@NonNull String cacheKey, @NonNull String json, long updatedAt) {
        this.cacheKey = cacheKey;
        this.json = json;
        this.updatedAt = updatedAt;
    }
}
