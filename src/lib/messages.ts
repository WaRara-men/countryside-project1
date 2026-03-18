import { supabase } from "./supabase";

export interface SamuraiMessage {
  id: string;
  sender_name: string;
  content: string; // メッセージ内容
  is_read: boolean;
  created_at: string;
}

/**
 * 家族からの新着メッセージを取得する
 */
export async function getLatestMessages(): Promise<SamuraiMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as SamuraiMessage[];
}

/**
 * メッセージを既読にする
 */
export async function markAsRead(messageId: string) {
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', messageId);
}
