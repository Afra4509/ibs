import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (uses service role key - full access)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export type Database = {
  tickets: {
    id: string;
    name: string;
    phone: string;
    ticket_code: string;
    payment_method: 'qris' | 'cash';
    status: 'pending' | 'paid_online' | 'paid_cash' | 'confirmed' | 'used' | 'expired';
    is_used: boolean;
    pakasir_transaction_id: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
  };
  payments: {
    id: string;
    ticket_code: string;
    method: 'qris' | 'cash';
    amount: number;
    status: 'pending' | 'paid' | 'failed' | 'expired';
    transaction_id: string | null;
    raw_webhook: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
  };
};

export type Ticket = Database['tickets'];
export type Payment = Database['payments'];
