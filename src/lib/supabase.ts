import { createClient } from '@supabase/supabase-js'

// 環境変数からゴミ（日本語やスペース）を取り除く関数
const sanitize = (str: string | undefined) => {
  if (!str) return '';
  // 英数字・記号以外の文字（日本語など）をすべて削除し、前後の空白も消す
  return str.replace(/[^\x20-\x7E]/g, '').trim();
}

const supabaseUrl = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL)
const supabaseAnonKey = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
