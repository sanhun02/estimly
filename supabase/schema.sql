-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table
CREATE TABLE public.companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  default_tax_rate DECIMAL(5,2) DEFAULT 0,
  default_deposit_percent DECIMAL(5,2) DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table
CREATE TABLE public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estimates table
CREATE TABLE public.estimates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  estimate_number TEXT UNIQUE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_percent DECIMAL(5,2) DEFAULT 50,
  deposit_amount DECIMAL(10,2),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'invoiced')),
  notes TEXT,
  terms TEXT,
  pdf_url TEXT,
  accepted_at TIMESTAMPTZ,
  signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estimate Items table
CREATE TABLE public.estimate_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) DEFAULT 0,
  labor_hours DECIMAL(10,2) DEFAULT 0,
  labor_rate DECIMAL(10,2) DEFAULT 0,
  taxable BOOLEAN DEFAULT TRUE,
  line_total DECIMAL(10,2) GENERATED ALWAYS AS (
    (quantity * unit_price) + (labor_hours * labor_rate)
  ) STORED,
  sort_order INTEGER DEFAULT 0
);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  estimate_id UUID REFERENCES estimates(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  paid DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) GENERATED ALWAYS AS (total - paid) STORED,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  estimate_id UUID REFERENCES estimates(id) ON DELETE SET NULL,
  stripe_payment_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', false),
       ('pdfs', 'pdfs', true);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users: can only see their own record
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Companies: users can only access their own company
CREATE POLICY "Users can view own company" ON companies FOR SELECT 
  USING (id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can update own company" ON companies FOR UPDATE 
  USING (id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Clients: users can only access clients in their company
CREATE POLICY "Users can view own clients" ON clients FOR SELECT 
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can insert clients" ON clients FOR INSERT 
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE 
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE 
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Estimates: users can only access estimates in their company
CREATE POLICY "Users can view own estimates" ON estimates FOR SELECT 
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can insert estimates" ON estimates FOR INSERT 
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can update own estimates" ON estimates FOR UPDATE 
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can delete own estimates" ON estimates FOR DELETE 
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Estimate Items: follow parent estimate permissions
CREATE POLICY "Users can view own estimate items" ON estimate_items FOR SELECT 
  USING (estimate_id IN (
    SELECT id FROM estimates WHERE company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  ));
CREATE POLICY "Users can insert estimate items" ON estimate_items FOR INSERT 
  WITH CHECK (estimate_id IN (
    SELECT id FROM estimates WHERE company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  ));
CREATE POLICY "Users can update own estimate items" ON estimate_items FOR UPDATE 
  USING (estimate_id IN (
    SELECT id FROM estimates WHERE company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  ));
CREATE POLICY "Users can delete own estimate items" ON estimate_items FOR DELETE 
  USING (estimate_id IN (
    SELECT id FROM estimates WHERE company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  ));

-- Similar policies for invoices and payments...
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT 
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can insert invoices" ON invoices FOR INSERT 
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view own payments" ON payments FOR SELECT 
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  ));

-- Function to generate estimate numbers
CREATE OR REPLACE FUNCTION generate_estimate_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  year_prefix TEXT;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(estimate_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM estimates
  WHERE estimate_number LIKE year_prefix || '%';
  
  RETURN year_prefix || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate estimate numbers
CREATE OR REPLACE FUNCTION set_estimate_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estimate_number IS NULL THEN
    NEW.estimate_number := generate_estimate_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_estimate
BEFORE INSERT ON estimates
FOR EACH ROW
EXECUTE FUNCTION set_estimate_number();