/*
  # Create requirements and bids tables for reverse auction platform

  1. New Tables
    - `requirements`
      - `id` (uuid, primary key)
      - `product_name` (text)
      - `hs_code` (text)
      - `moq` (integer)
      - `description` (text)
      - `images` (text array)
      - `created_by` (uuid, references auth.users)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `bids`
      - `id` (uuid, primary key)
      - `requirement_id` (uuid, references requirements)
      - `supplier_id` (uuid, references auth.users)
      - `supplier_name` (text)
      - `amount` (decimal)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
    - Requirements: admins can CRUD, suppliers can read
    - Bids: suppliers can create/read own, admins can read all
*/

-- Create requirements table
CREATE TABLE IF NOT EXISTS requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  hs_code text NOT NULL,
  moq integer NOT NULL CHECK (moq > 0),
  description text NOT NULL,
  images text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'open', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bids table
CREATE TABLE IF NOT EXISTS bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id uuid REFERENCES requirements(id) ON DELETE CASCADE NOT NULL,
  supplier_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  supplier_name text NOT NULL,
  amount decimal(12,2) NOT NULL CHECK (amount > 0),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_requirements_status ON requirements(status);
CREATE INDEX IF NOT EXISTS idx_requirements_start_time ON requirements(start_time);
CREATE INDEX IF NOT EXISTS idx_requirements_end_time ON requirements(end_time);
CREATE INDEX IF NOT EXISTS idx_requirements_created_by ON requirements(created_by);
CREATE INDEX IF NOT EXISTS idx_bids_requirement_id ON bids(requirement_id);
CREATE INDEX IF NOT EXISTS idx_bids_supplier_id ON bids(supplier_id);
CREATE INDEX IF NOT EXISTS idx_bids_amount ON bids(amount);

-- Enable Row Level Security
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Requirements policies
CREATE POLICY "Anyone can view requirements"
  ON requirements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert requirements"
  ON requirements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update their requirements"
  ON requirements
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete their requirements"
  ON requirements
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Bids policies
CREATE POLICY "Anyone can view bids"
  ON bids
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Suppliers can insert bids"
  ON bids
  FOR INSERT
  TO authenticated
  WITH CHECK (
    supplier_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'supplier'
    )
  );

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_requirements_updated_at
  BEFORE UPDATE ON requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update requirement status based on time
CREATE OR REPLACE FUNCTION update_requirement_status()
RETURNS void AS $$
BEGIN
  UPDATE requirements 
  SET status = CASE
    WHEN now() < start_time THEN 'upcoming'
    WHEN now() > end_time THEN 'closed'
    ELSE 'open'
  END
  WHERE status != CASE
    WHEN now() < start_time THEN 'upcoming'
    WHEN now() > end_time THEN 'closed'
    ELSE 'open'
  END;
END;
$$ language 'plpgsql';