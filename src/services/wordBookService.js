import { supabase } from './supabaseClient';

export async function getWordBook(userId) {
    if (!userId) return [];
    try {
        const { data, error } = await supabase
            .from('word_book')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching wordbook:', err);
        return [];
    }
}

export async function saveWord(userId, entry) {
    if (!userId) return false;
    try {
        // Check if exists
        const { data: existing } = await supabase
            .from('word_book')
            .select('id')
            .eq('user_id', userId)
            .eq('english', entry.english);

        if (existing && existing.length > 0) return false;

        const { error } = await supabase
            .from('word_book')
            .insert({
                user_id: userId,
                english: entry.english,
                chinese_explanation: entry.chinese_explanation,
                style: entry.style
            });

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error saving word:', err);
        return false;
    }
}

export async function deleteWord(userId, id) {
    if (!userId) return;
    try {
        await supabase
            .from('word_book')
            .delete()
            .match({ id, user_id: userId });
    } catch (err) {
        console.error('Error deleting word:', err);
    }
}

// NOTE: Since checking status requires a network call now,
// UI might need to rely on the local state copy of getWordBook
// rather than doing an active network check every time isSaved is called.
