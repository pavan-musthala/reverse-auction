/*
  # Fix RLS policies for requirements table

  1. Security Updates
    - Drop existing policies that reference non-existent users table
    - Create new policies using auth.jwt() for role checking
    - Allow authenticated users to read all requirements
    - Allow users with admin role to create, update, and delete requirements

  2. Changes
    - Replace users table references with auth.jwt() calls
    - Simplify SELECT policy to allow all authenticated users
    - Fix INSERT, UPDATE, DELETE policies for admin users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view requirements" ON requirements;
DROP POLICY IF EXISTS "Admins can insert requirements" ON requirements;
DROP POLICY IF EXISTS "Admins can update their requirements" ON requirements;
DROP POLICY IF EXISTS "Admins can delete their requirements" ON requirements;

-- Create new policies using auth.jwt() instead of users table
CREATE POLICY "Allow authenticated users to read requirements"
  ON requirements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to create requirements"
  ON requirements
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Allow admins to update their requirements"
  ON requirements
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() AND 
    (auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Allow admins to delete their requirements"
  ON requirements
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() AND 
    (auth.jwt() ->> 'role') = 'admin'
  );