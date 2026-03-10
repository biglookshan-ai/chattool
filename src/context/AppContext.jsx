/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { getWordBook, saveWord, deleteWord, updateWord } from '../services/wordBookService';

const AppContext = createContext(null);

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function newConversation(title = '新对话') {
    return { id: generateId(), title, note: '', messages: [], created_at: new Date().toISOString() };
}

export function AppProvider({ children, user }) {
    const [conversations, setConversations] = useState([]);
    const [activeConvId, setActiveConvId] = useState(null);
    const [wordBook, setWordBook] = useState([]);
    const [wordBookOpen, setWordBookOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingInitial, setIsFetchingInitial] = useState(true);
    const [apiKeys, setApiKeys] = useState(() => {
        try { return JSON.parse(localStorage.getItem('gemini_api_keys')) || ['']; }
        catch { return ['']; }
    });

    // 1. Initial Load of Data
    useEffect(() => {
        if (!user) return;

        async function fetchInitialData() {
            setIsFetchingInitial(true);
            try {
                // Fetch Conversations
                const { data: convos, error } = await supabase
                    .from('conversations')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false });

                if (error) throw error;

                if (convos && convos.length > 0) {
                    // Ensure older convos have a note field locally
                    setConversations(convos.map(c => ({ ...c, note: c.note || '' })));
                    setActiveConvId(convos[0].id);
                } else {
                    // Create default conversation if none exists
                    const initial = newConversation('对话 1');
                    const { error: insertError } = await supabase
                        .from('conversations')
                        .insert({
                            id: initial.id,
                            user_id: user.id,
                            title: initial.title,
                            note: initial.note,
                            messages: initial.messages
                        });
                    if (!insertError) {
                        setConversations([initial]);
                        setActiveConvId(initial.id);
                    }
                }

                // Fetch API Settings
                const { data: settingsData, error: settingsError } = await supabase
                    .from('user_settings')
                    .select('api_keys')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (settingsData && settingsData.api_keys) {
                    setApiKeys(settingsData.api_keys);
                    localStorage.setItem('gemini_api_keys', JSON.stringify(settingsData.api_keys));
                } else if (!settingsError || settingsError.code === 'PGRST116') {
                    // Create if doesn't exist
                    await supabase.from('user_settings').insert({ user_id: user.id, api_keys: apiKeys });
                }

                // Fetch Wordbook
                const wb = await getWordBook(user.id);
                setWordBook(wb);
            } catch (err) {
                console.error("Error loading initial data:", err);
            } finally {
                setIsFetchingInitial(false);
            }
        }

        fetchInitialData();
    }, [user]);

    // Active conversation
    const activeConversation = conversations.find(c => c.id === activeConvId);

    // Sync a specific conversation to Supabase
    const syncConversationToDb = useCallback(async (convObject) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('conversations')
                .update({
                    title: convObject.title,
                    note: convObject.note || '',
                    messages: convObject.messages, // Syncing full chat payload across devices
                    updated_at: new Date().toISOString()
                })
                .match({ id: convObject.id, user_id: user.id });

            if (error) {
                console.error("Supabase update error:", error.message);
            }
        } catch (err) {
            console.error("Failed to sync conversation:", err);
        }
    }, [user]);

    // Add a message to a conversation
    const addMessage = useCallback((convId, message) => {
        setConversations(prev => {
            const newConvos = prev.map(c => {
                if (c.id !== convId) return c;
                const msgs = [...c.messages, message];
                const title = msgs.length === 1 && message.role === 'user'
                    ? message.content.slice(0, 20) + (message.content.length > 20 ? '…' : '')
                    : c.title;
                const updatedConv = { ...c, messages: msgs, title };

                // Fire and forget DB sync
                syncConversationToDb(updatedConv);
                return updatedConv;
            });
            return newConvos;
        });
    }, [syncConversationToDb]);

    // Update last assistant message (streaming-like approach)
    const updateLastMessage = useCallback((convId, data) => {
        setConversations(prev => {
            const newConvos = [...prev];
            const idx = newConvos.findIndex(c => c.id === convId);
            if (idx === -1) return prev;

            const c = { ...newConvos[idx] };
            const msgs = [...c.messages];
            const lastIdx = msgs.length - 1;

            if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
                msgs[lastIdx] = { ...msgs[lastIdx], ...data };
                c.messages = msgs;
                newConvos[idx] = c;

                syncConversationToDb(c);
            }
            return newConvos;
        });
    }, [syncConversationToDb]);

    // Update a specific message by ID
    const updateMessage = useCallback((convId, msgId, data) => {
        setConversations(prev => {
            const newConvos = prev.map(c => {
                if (c.id !== convId) return c;
                const msgs = c.messages.map(m => m.id === msgId ? { ...m, ...data } : m);
                const updatedConv = { ...c, messages: msgs };

                syncConversationToDb(updatedConv);
                return updatedConv;
            });
            return newConvos;
        });
    }, [syncConversationToDb]);

    // Update conversation metadata
    const updateConversationMetadata = useCallback((convId, { title, note }) => {
        setConversations(prev => {
            const newConvos = prev.map(c => {
                if (c.id !== convId) return c;
                const updatedConv = { ...c, title: title !== undefined ? title : c.title, note: note !== undefined ? note : c.note };
                syncConversationToDb(updatedConv);
                return updatedConv;
            });
            return newConvos;
        });
    }, [syncConversationToDb]);

    // Create new conversation
    const createConversation = useCallback(async () => {
        if (!user) return;
        const newC = newConversation(`对话 ${conversations.length + 1}`);

        // Persist immediately
        const { error } = await supabase
            .from('conversations')
            .insert({
                id: newC.id,
                user_id: user.id,
                title: newC.title,
                note: newC.note,
                messages: newC.messages
            });

        if (!error) {
            setConversations(prev => [newC, ...prev]);
            setActiveConvId(newC.id);
        } else {
            console.error("Error creating conversation:", error.message);
        }
    }, [conversations.length, user]);

    // Delete a conversation
    const deleteConversation = useCallback(async (convId, e) => {
        if (e) e.stopPropagation();
        if (!user) return;

        // Delete from local state first for fast UI
        setConversations(prev => {
            const filtered = prev.filter(c => c.id !== convId);
            if (activeConvId === convId && filtered.length > 0) {
                setActiveConvId(filtered[0].id);
            } else if (filtered.length === 0) {
                setActiveConvId(null);
            }
            return filtered;
        });

        // Delete remotely
        const { error } = await supabase
            .from('conversations')
            .delete()
            .match({ id: convId, user_id: user.id });

        if (error) console.error("Error deleting conversation:", error.message);
    }, [user, activeConvId]);

    // User Settings persistence for API Keys
    const saveApiKeys = useCallback(async (newKeys) => {
        setApiKeys(newKeys);
        localStorage.setItem('gemini_api_keys', JSON.stringify(newKeys));
        if (user) {
            await supabase.from('user_settings').update({ api_keys: newKeys }).eq('user_id', user.id);
        }
    }, [user]);

    // Word book actions
    const handleSaveWord = useCallback(async (entry) => {
        if (!user) return false;
        const saved = await saveWord(user.id, entry);
        if (saved) {
            const wb = await getWordBook(user.id);
            setWordBook(wb);
        }
        return saved;
    }, [user]);

    const handleDeleteWord = useCallback(async (id) => {
        if (!user) return;
        setWordBook(prev => prev.filter(w => w.id !== id));
        await deleteWord(user.id, id);
    }, [user]);

    const handleUpdateWord = useCallback(async (id, updates) => {
        if (!user) return;
        setWordBook(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
        await updateWord(user.id, id, updates);
    }, [user]);

    if (isFetchingInitial) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                加载云端数据中...
            </div>
        );
    }

    const value = {
        conversations,
        activeConvId,
        setActiveConvId,
        activeConversation,
        addMessage,
        updateLastMessage,
        updateMessage,
        updateConversationMetadata,
        createConversation,
        deleteConversation,
        apiKeys,
        saveApiKeys,
        wordBook,
        wordBookOpen,
        setWordBookOpen,
        isLoading,
        setIsLoading,
        handleSaveWord,
        handleDeleteWord,
        handleUpdateWord
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
