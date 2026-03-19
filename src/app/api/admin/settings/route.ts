import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

function verifyAdminKey(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_token');
  return token?.value === 'true';
}

export async function POST(request: NextRequest) {
  if (!verifyAdminKey()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { new_password } = await request.json();
    
    if (!new_password || new_password.length < 4) {
      return NextResponse.json({ error: 'Password minimal 4 karakter.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({ setting_key: 'admin_password', setting_value: new_password }, { onConflict: 'setting_key' });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Password admin berhasil diubah!' });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Gagal mengubah pengaturan.' }, { status: 500 });
  }
}
