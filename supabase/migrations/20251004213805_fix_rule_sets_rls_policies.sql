/*
  # Fix Rule Sets RLS Policies

  ## Changes
  1. Drop existing restrictive rule sets policies
  2. Create simpler policies that work correctly
  
  ## New Policies
  - All authenticated users can view rule sets
  - Admin and manager roles can create/update/delete rule sets
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view rule sets" ON rule_sets;
DROP POLICY IF EXISTS "Admins can manage rule sets" ON rule_sets;

-- Create new policies
CREATE POLICY "Anyone can view rule sets"
  ON rule_sets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert rule sets"
  ON rule_sets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can update rule sets"
  ON rule_sets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete rule sets"
  ON rule_sets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'manager')
    )
  );