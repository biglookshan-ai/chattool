/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { getWordBook, saveWord, deleteWord } from '../services/wordBookService';

const AppContext = createContext(null);

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function newConversation(title = '新对话') {
    return { id: generateId(), title, messages: [], created_at: new Date().toISOString() };
}

export function AppProvider({ children, user }) {
    const [conversations, setConversations] = useState([]);
    const [activeConvId, setActiveConvId] = useState(null);
    const [wordBook, setWordBook] = useState([]);
    const [wordBookOpen, setWordBookOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingInitial, setIsFetchingInitial] = useState(true);

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
                    setConversations(convos);
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
                            messages: initial.messages
                        });
                    if (!insertError) {
                        setConversations([initial]);
                        setActiveConvId(initial.id);
                    }
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
            await supabase
                .from('conversations')
                .update({
                    title: convObject.title,
                    messages: convObject.messages,
                    updated_at: new Date().toISOString()
                })
                .match({ id: convObject.id, user_id: user.id });
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

    // Create new conversation
    const createConversation = useCallback(async () => {
        if (!user) return;
        const n = newConversation(`对话 ${conversations.length + 1}`);
        setConversations(prev => [n, ...prev]);
        setActiveConvId(n.id);

        await supabase
            .from('conversations')
            .insert({
                id: n.id,
                user_id: user.id,
                title: n.title,
                messages: n.messages
            });
    }, [conversations.length, user]);

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
        await deleteWord(user.id, id);
        const wb = await getWordBook(user.id);
        setWordBook(wb);
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
        createConversation,
        wordBook,
        wordBookOpen,
        setWordBookOpen,
        isLoading,
        setIsLoading,
        handleSaveWord,
        handleDeleteWord
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
