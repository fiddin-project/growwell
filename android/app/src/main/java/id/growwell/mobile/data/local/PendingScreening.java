package id.growwell.mobile.data.local;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "pending_screenings")
public class PendingScreening {
    @PrimaryKey @NonNull public String submissionId;
    public int childId;
    @NonNull public String instrumentRevision;
    @NonNull public String answersJson;
    @NonNull public String state;
    public int attemptCount;
    public String lastErrorCode;
    public long createdAt;

    public PendingScreening(@NonNull String submissionId, int childId, @NonNull String instrumentRevision, @NonNull String answersJson, @NonNull String state, int attemptCount, String lastErrorCode, long createdAt) {
        this.submissionId = submissionId;
        this.childId = childId;
        this.instrumentRevision = instrumentRevision;
        this.answersJson = answersJson;
        this.state = state;
        this.attemptCount = attemptCount;
        this.lastErrorCode = lastErrorCode;
        this.createdAt = createdAt;
    }
}
