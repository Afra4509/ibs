-- ============================================
-- IBS Ticketing System - Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if re-running
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;

-- ============================================
-- TICKETS TABLE
-- ============================================
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  ticket_code TEXT UNIQUE NOT NULL,          -- format: IBS-XXXXXXXX
  payment_method TEXT NOT NULL CHECK (payment_method IN ('qris', 'cash')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'paid_online', 'paid_cash', 'confirmed', 'used', 'expired')
  ),
  is_used BOOLEAN DEFAULT FALSE,
  pakasir_transaction_id TEXT,               -- reference dari PakASir
  expires_at TIMESTAMPTZ,                    -- H+1 setelah event
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk fast lookup berdasarkan ticket_code
CREATE INDEX idx_tickets_ticket_code ON tickets(ticket_code);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_pakasir_transaction_id ON tickets(pakasir_transaction_id) WHERE pakasir_transaction_id IS NOT NULL;

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_code TEXT NOT NULL REFERENCES tickets(ticket_code) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('qris', 'cash')),
  amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'paid', 'failed', 'expired')
  ),
  transaction_id TEXT,                       -- dari PakASir
  raw_webhook JSONB,                         -- raw webhook payload untuk audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_ticket_code ON payments(ticket_code);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id) WHERE transaction_id IS NOT NULL;

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by server-side API)
CREATE POLICY "Service role full access tickets"
  ON tickets FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access payments"
  ON payments FOR ALL
  USING (auth.role() = 'service_role');

-- Public: can only read their own ticket by code (anon)
CREATE POLICY "Public read own ticket"
  ON tickets FOR SELECT
  USING (true);  -- filtering by ticket_code done in API layer

-- ============================================
-- ANALYTICS VIEW
-- ============================================
CREATE OR REPLACE VIEW ticket_analytics AS
SELECT
  COUNT(*) FILTER (WHERE status != 'expired') AS total_active,
  COUNT(*) FILTER (WHERE status = 'pending') AS total_pending,
  COUNT(*) FILTER (WHERE status IN ('confirmed', 'paid_online', 'paid_cash')) AS total_confirmed,
  COUNT(*) FILTER (WHERE status = 'used') AS total_used,
  COUNT(*) FILTER (WHERE status = 'expired') AS total_expired,
  COUNT(*) FILTER (WHERE payment_method = 'qris') AS total_qris,
  COUNT(*) FILTER (WHERE payment_method = 'cash') AS total_cash
FROM tickets;
