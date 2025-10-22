/*
  # Add recommended_fix column to findings table
  
  1. Changes
    - Add `recommended_fix` column to `findings` table
    - This will store the suggested solution/fix for each finding
    - Helps departments understand exactly what needs to be done
  
  2. Security
    - No RLS changes needed (inherits from table)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'findings' AND column_name = 'recommended_fix'
  ) THEN
    ALTER TABLE findings ADD COLUMN recommended_fix text DEFAULT '';
  END IF;
END $$;
