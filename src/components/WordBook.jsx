import { useState, useEffect } from 'react';
import { BookOpen, X, Trash2, Search, Volume2, Bot } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translateWithGemini } from '../services/geminiService';

export default function WordBook() {
    const { wordBook, wordBookOpen, setWordBookOpen, handleDeleteWord, handleUpdateWord } = useApp();
    const [search, setSearch] = useState('');
    const [translatingId, setTranslatingId] = useState(null);

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') setWordBookOpen(false); };
        if (wordBookOpen) window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [wordBookOpen, setWordBookOpen]);

    const handleTranslate = async (word) => {
        setTranslatingId(word.id);
        try {
            const prompt = `请用非常简短的一句话解释这个影视专业词汇/句子的意思: "${word.english}"`;
            const result = await translateWithGemini(prompt);
            let explanation = result.translation || result.chinese_explanation || Object.values(result)[0] || '翻译成功';
            handleUpdateWord(word.id, { chinese_explanation: explanation });
        } catch (err) {
            console.error(err);
        }
        setTranslatingId(null);
    };

    const handleTTS = (text) => {
        if (!text) return;
        const msg = new SpeechSynthesisUtterance(text);

        // Attempt to find a British English voice
        const voices = window.speechSynthesis.getVoices();
        const ukVoice = voices.find(v => v.lang === 'en-GB' || v.lang === 'en_GB');
        if (ukVoice) {
            msg.voice = ukVoice;
        } else {
            // Fallback to general english if no UK voice specifically found
            msg.lang = 'en-US';
        }

        window.speechSynthesis.speak(msg);
    };

    const filtered = wordBook.filter(w =>
        w.english.toLowerCase().includes(search.toLowerCase()) ||
        (w.chinese_explanation || '').includes(search)
    );

    const styleLabel = {
        casual: { label: '地道口语', color: 'var(--success)', bg: 'var(--success-dim)' },
        professional: { label: '专业商务', color: 'var(--info)', bg: 'var(--info-dim)' },
        optimized: { label: '优化英文', color: 'var(--warning)', bg: 'var(--warning-dim)' }
    };

    if (!wordBookOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={() => setWordBookOpen(false)}
                style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                    zIndex: 40, animation: 'fadeIn 0.2s ease'
                }}
            />

            {/* Panel */}
            <div
                className="animate-slide-in-right"
                style={{
                    position: 'fixed', top: 0, right: 0, bottom: 0,
                    width: '360px', maxWidth: '100vw',
                    background: 'var(--bg-secondary)',
                    borderLeft: '1px solid var(--border)',
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '-8px 0 40px rgba(0,0,0,0.4)'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            background: 'var(--accent-dim)',
                            borderRadius: '8px',
                            padding: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <BookOpen size={16} style={{ color: 'var(--accent)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>单词本</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{wordBook.length} 个词汇已保存</div>
                        </div>
                    </div>
                    <button
                        onClick={() => setWordBookOpen(false)}
                        style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', padding: '4px',
                            borderRadius: '6px', transition: 'all 0.15s'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search */}
                <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{
                            position: 'absolute', left: '10px', top: '50%',
                            transform: 'translateY(-50%)', color: 'var(--text-muted)'
                        }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="搜索单词本..."
                            style={{
                                width: '100%',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '8px 12px 8px 32px',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                </div>

                {/* Word list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <BookOpen size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                                {wordBook.length === 0 ? '还没有保存任何词汇' : '没有匹配的词汇'}
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px' }}>
                                在聊天中点击「➕收藏到单词本」来保存
                            </p>
                        </div>
                    ) : (
                        filtered.map((word, i) => {
                            const s = styleLabel[word.style] || styleLabel.optimized;
                            return (
                                <div
                                    key={word.id}
                                    className="glass-card animate-fade-in-up"
                                    style={{
                                        marginBottom: '10px',
                                        padding: '14px',
                                        animationDelay: `${i * 0.04}s`
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {/* Style tag */}
                                            <span style={{
                                                display: 'inline-block',
                                                fontSize: '10px', fontWeight: 700,
                                                padding: '2px 6px', borderRadius: '4px',
                                                background: s.bg, color: s.color,
                                                marginBottom: '6px'
                                            }}>
                                                {s.label}
                                            </span>
                                            {/* English */}
                                            <p style={{
                                                fontSize: '15px', fontWeight: 600,
                                                color: 'var(--text-primary)',
                                                lineHeight: 1.5, marginBottom: '6px',
                                                wordBreak: 'break-word',
                                                fontFamily: 'inherit'
                                            }}>
                                                {word.english}
                                            </p>
                                            {/* Explanation */}
                                            {word.chinese_explanation && (
                                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                                    {word.chinese_explanation}
                                                </p>
                                            )}
                                            {/* Date */}
                                            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
                                                {new Date(word.savedAt).toLocaleDateString('zh-CN')}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, paddingLeft: '8px', borderLeft: '1px solid var(--border)' }}>
                                            {/* TTS button */}
                                            <button
                                                onClick={() => handleTTS(word.english)}
                                                style={{
                                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                                    color: 'var(--accent)', padding: '4px',
                                                    borderRadius: '4px', transition: 'all 0.15s',
                                                }}
                                                title="朗读"
                                            >
                                                <Volume2 size={16} />
                                            </button>
                                            {/* Translate button */}
                                            <button
                                                onClick={() => handleTranslate(word)}
                                                disabled={translatingId === word.id}
                                                style={{
                                                    background: 'transparent', border: 'none', cursor: translatingId === word.id ? 'not-allowed' : 'pointer',
                                                    color: 'var(--info)', padding: '4px',
                                                    borderRadius: '4px', transition: 'all 0.15s',
                                                }}
                                                title="AI 翻译"
                                            >
                                                {translatingId === word.id ? <span className="typing-dot" style={{ display: 'inline-block' }} /> : <Bot size={16} />}
                                            </button>
                                            {/* Delete button */}
                                            <button
                                                onClick={() => handleDeleteWord(word.id)}
                                                style={{
                                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                                    color: 'var(--text-muted)', padding: '4px',
                                                    borderRadius: '4px', transition: 'color 0.15s',
                                                    marginTop: 'auto'
                                                }}
                                                title="删除"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
}
