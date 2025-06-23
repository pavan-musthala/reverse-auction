/*
  # Fix Requirements RLS Policy

  1. Security Updates
    - Update INSERT policy for requirements table to properly check user role from user metadata
    - Update UPDATE and DELETE policies to use consistent role checking
    - Ensure policies work with the actual user metadata structure

  2. Changes Made
    - Modified INSERT policy to check role from users.raw_user_meta_data
    - Updated UPDATE and DELETE policies for consistency
    - Maintained existing SELECT policy for all authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow admins to create requirements" ON requirements;
DROP POLICY IF EXISTS "Allow admins to update their requirements" ON requirements;
DROP POLICY IF EXISTS "Allow admins to delete their requirements" ON requirements;

-- Create updated INSERT policy that checks role from user metadata
CREATE POLICY "Allow admins to create requirements"
  ON requirements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.raw_user_meta_data ->> 'role'::text) = 'admin'::text
    )
  );

-- Create updated UPDATE policy
CREATE POLICY "Allow admins to update their requirements"
  ON requirements
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.raw_user_meta_data ->> 'role'::text) = 'admin'::text
    )
  );

-- Create updated DELETE policy
CREATE POLICY "Allow admins to delete their requirements"
  ON requirements
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.raw_user_meta_data ->> 'role'::text) = 'admin'::text
    )
  );