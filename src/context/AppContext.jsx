import { createContext, useContext, useState, useCallback } from 'react';
import { getWordBook, saveWord, deleteWord } from '../services/wordBookService';

const AppContext = createContext(null);

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function newConversation(title = '新对话') {
    return { id: generateId(), title, messages: [], createdAt: Date.now() };
}

const _initialConv = newConversation('对话 1');

export function AppProvider({ children }) {
    const [conversations, setConversations] = useState([_initialConv]);
    const [activeConvId, setActiveConvId] = useState(_initialConv.id);
    const [wordBook, setWordBook] = useState(() => getWordBook());
    const [wordBookOpen, setWordBookOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Active conversation
    const activeConversation = conversations.find(c => c.id === activeConvId);

    // Add a message to a conversation
    const addMessage = useCallback((convId, message) => {
        setConversations(prev => prev.map(c => {
            if (c.id !== convId) return c;
            const msgs = [...c.messages, message];
            // Auto-title after first user message
            const title = msgs.length === 1 && message.role === 'user'
                ? message.content.slice(0, 20) + (message.content.length > 20 ? '…' : '')
                : c.title;
            return { ...c, messages: msgs, title };
        }));
    }, []);

    // Update last assistant message (streaming-like approach)
    const updateLastMessage = useCallback((convId, data) => {
        setConversations(prev => prev.map(c => {
            if (c.id !== convId) return c;
            const msgs = [...c.messages];
            const lastIdx = msgs.length - 1;
            if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
                msgs[lastIdx] = { ...msgs[lastIdx], ...data };
            }
            return { ...c, messages: msgs };
        }));
    }, []);

    // Update a specific message by ID
    const updateMessage = useCallback((convId, msgId, data) => {
        setConversations(prev => prev.map(c => {
            if (c.id !== convId) return c;
            const msgs = c.messages.map(m => m.id === msgId ? { ...m, ...data } : m);
            return { ...c, messages: msgs };
        }));
    }, []);

    // Create new conversation
    const createConversation = useCallback(() => {
        const n = newConversation(`对话 ${conversations.length + 1}`);
        setConversations(prev => [n, ...prev]);
        setActiveConvId(n.id);
    }, [conversations.length]);

    // Word book actions
    const handleSaveWord = useCallback((entry) => {
        const saved = saveWord(entry);
        if (saved) setWordBook(getWordBook());
        return saved;
    }, []);

    const handleDeleteWord = useCallback((id) => {
        deleteWord(id);
        setWordBook(getWordBook());
    }, []);

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
