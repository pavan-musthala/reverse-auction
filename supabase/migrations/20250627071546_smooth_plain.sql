/*
  # Fix RLS Policies for Requirements Table

  1. Purpose
    - Updates RLS policies to properly check admin role from JWT metadata
    - Fixes reference to non-existent users table
    - Ensures only admins can create, update, and delete requirements

  2. Changes
    - Drop existing policies that reference non-existent users table
    - Create new policies that check role from JWT user metadata
    - Maintain same security model but with correct table references

  3. Security
    - INSERT: Only users with 'admin' role can create requirements
    - UPDATE: Only admins can update their own requirements
    - DELETE: Only admins can delete their own requirements
    - SELECT: All authenticated users can read requirements
*/

-- Drop existing policies that reference non-existent users table
DROP POLICY IF EXISTS "Allow admins to create requirements" ON requirements;
DROP POLICY IF EXISTS "Allow admins to update their requirements" ON requirements;
DROP POLICY IF EXISTS "Allow admins to delete their requirements" ON requirements;

-- Create updated INSERT policy that checks role from JWT user metadata
CREATE POLICY "Allow admins to create requirements"
  ON requirements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text
  );

-- Create updated UPDATE policy
CREATE POLICY "Allow admins to update their requirements"
  ON requirements
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() 
    AND ((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text
  );

-- Create updated DELETE policy
CREATE POLICY "Allow admins to delete their requirements"
  ON requirements
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() 
    AND ((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text
  );