ALTER TABLE reviewer_schedule
ADD COLUMN allocation_percent INTEGER NOT NULL DEFAULT 0
CHECK(allocation_percent BETWEEN 0 AND 100);

-- Preserve the current eligible reviewer pool and start with an even split.
UPDATE reviewer_schedule
SET allocation_percent =
  100 / (SELECT COUNT(*) FROM reviewer_schedule WHERE active = 1)
  + CASE
      WHEN sort_order = (SELECT MIN(sort_order) FROM reviewer_schedule WHERE active = 1)
        THEN 100 % (SELECT COUNT(*) FROM reviewer_schedule WHERE active = 1)
      ELSE 0
    END
WHERE active = 1
  AND (SELECT COUNT(*) FROM reviewer_schedule WHERE active = 1) > 0;
