package id.growwell.mobile.data.local;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import java.util.List;

@Dao
public interface GrowWellDao {
    @Query("SELECT * FROM cached_children ORDER BY name COLLATE NOCASE") List<CachedChild> children();
    @Insert(onConflict = OnConflictStrategy.REPLACE) void saveChildren(List<CachedChild> children);
    @Query("DELETE FROM cached_children") void deleteChildren();

    @Query("SELECT * FROM screening_drafts WHERE childId = :childId") ScreeningDraft draft(int childId);
    @Insert(onConflict = OnConflictStrategy.REPLACE) void saveDraft(ScreeningDraft draft);
    @Query("DELETE FROM screening_drafts WHERE childId = :childId") void deleteDraft(int childId);

    @Query("SELECT * FROM pending_screenings WHERE submissionId = :id") PendingScreening pending(String id);
    @Query("SELECT * FROM pending_screenings WHERE state IN ('PENDING', 'FAILED_RETRYABLE') ORDER BY createdAt") List<PendingScreening> pendingForSync();
    @Insert(onConflict = OnConflictStrategy.REPLACE) void savePending(PendingScreening pending);
    @Query("DELETE FROM pending_screenings WHERE submissionId = :id") void deletePending(String id);
    @Query("DELETE FROM cached_children") void clearChildren();
    @Query("DELETE FROM screening_drafts") void clearDrafts();
    @Query("DELETE FROM pending_screenings") void clearPending();

    default void clearUserData() {
        clearChildren();
        clearDrafts();
        clearPending();
    }
}
