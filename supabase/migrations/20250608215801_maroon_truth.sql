/*
  # Add RLS policies for clients table

  1. Security Policies
    - Add policy to allow anonymous users to read all clients
    - Add policy to allow anonymous users to insert new clients
    - Add policy to allow anonymous users to update clients
    - Add policy to allow anonymous users to delete clients

  Note: These policies are permissive for development purposes.
  In production, you should restrict access based on authentication and user roles.
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anon read clients" ON clients;
DROP POLICY IF EXISTS "Allow anon insert clients" ON clients;
DROP POLICY IF EXISTS "Allow anon update clients" ON clients;
DROP POLICY IF EXISTS "Allow anon delete clients" ON clients;

-- Create policies for anonymous access (development)
CREATE POLICY "Allow anon read clients"
  ON clients
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert clients"
  ON clients
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update clients"
  ON clients
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete clients"
  ON clients
  FOR DELETE
  TO anon
  USING (true);

-- Also add policies for authenticated users
CREATE POLICY "Allow authenticated read clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (true);