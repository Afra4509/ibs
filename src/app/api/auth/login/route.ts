import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    // Fetch password from Supabase settings table
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('setting_value')
      .eq('setting_key', 'admin_password')
      .single();
      
    const actualPassword = error || !data ? 'smada2026' : data.setting_value;

    if (password === actualPassword) {
      const cookieStore = cookies();
      cookieStore.set('admin_token', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
      
      return NextResponse.json({ success: true, message: 'Login berhasil' });
    }
    
    return NextResponse.json({ error: 'Password salah' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
