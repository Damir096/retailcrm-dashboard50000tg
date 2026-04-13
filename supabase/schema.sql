-- DDL script for orders table
CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    retailcrm_id integer UNIQUE,
    order_number text,
    customer_name text,
    total_sum numeric,
    status text,
    created_at timestamp with time zone DEFAULT now()
);

-- Disable Row Level Security (RLS) as requested
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
