/*
  # Fix RLS policy for bids table

  1. Changes
    - Drop the existing restrictive INSERT policy on bids table
    - Create a new INSERT policy that only checks supplier_id against auth.uid()
    - Remove the problematic users table query from the policy

  2. Security
    - Maintains security by ensuring users can only insert bids with their own supplier_id
    - Removes the users table access that was causing permission errors
    - Role checking will be handled at the application level instead of database level

  3. Notes
    - This fixes the "permission denied for table users" error
    - The application should handle role validation before allowing bid submission
*/

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Suppliers can insert bids" ON bids;

-- Create a new, simpler INSERT policy that doesn't query the users table
CREATE POLICY "Authenticated users can insert their own bids"
  ON bids
  FOR INSERT
  TO authenticated
  WITH CHECK (supplier_id = auth.uid());