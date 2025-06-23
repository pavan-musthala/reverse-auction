/*
  # Fix Requirements RLS Policy

  1. Security Updates
    - Update RLS policies to properly check admin role from JWT user metadata
    - Fix INSERT policy to allow admins to create requirements
    - Fix UPDATE policy to allow admins to update their own requirements  
    - Fix DELETE policy to allow admins to delete their own requirements

  The issue was that the original policies were checking `jwt() ->> 'role'` but the role
  is stored in the user_metadata of the JWT token, accessible via `auth.jwt() -> 'user_metadata' ->> 'role'`.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow admins to create requirements" ON requirements;
DROP POLICY IF EXISTS "Allow admins to update their requirements" ON requirements;
DROP POLICY IF EXISTS "Allow admins to delete their requirements" ON requirements;

-- Create updated INSERT policy that checks role from JWT user metadata
CREATE POLICY "Allow admins to create requirements"
  ON requirements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role'::text) = 'admin'::text
  );

-- Create updated UPDATE policy
CREATE POLICY "Allow admins to update their requirements"
  ON requirements
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() 
    AND (auth.jwt() -> 'user_metadata' ->> 'role'::text) = 'admin'::text
  );

-- Create updated DELETE policy
CREATE POLICY "Allow admins to delete their requirements"
  ON requirements
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() 
    AND (auth.jwt() -> 'user_metadata' ->> 'role'::text) = 'admin'::text
  );