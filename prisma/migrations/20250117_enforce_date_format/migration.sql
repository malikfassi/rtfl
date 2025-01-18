-- Convert existing dates to YYYY-MM-DD format
UPDATE "Game"
SET date = substr(date, 1, 10)
WHERE length(date) > 10; 