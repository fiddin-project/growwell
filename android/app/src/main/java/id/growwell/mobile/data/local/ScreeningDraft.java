package id.growwell.mobile.data.local;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "screening_drafts")
public class ScreeningDraft {
    @PrimaryKey public int childId;
    @NonNull public String instrumentRevision;
    @NonNull public String answersJson;
    public long updatedAt;

    public ScreeningDraft(int childId, @NonNull String instrumentRevision, @NonNull String answersJson, long updatedAt) {
        this.childId = childId;
        this.instrumentRevision = instrumentRevision;
        this.answersJson = answersJson;
        this.updatedAt = updatedAt;
    }
}
