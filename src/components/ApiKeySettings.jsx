import { useState, useEffect } from 'react';
import { Key, Save, Trash2, X } from 'lucide-react';

export default function ApiKeySettings({ open, onClose }) {
    const [customKey, setCustomKey] = useState('');
    const [savedKey, setSavedKey] = useState('');

    // Load saved key on mount
    useEffect(() => {
        if (open) {
            setTimeout(() => {
                const stored = localStorage.getItem('gemini_custom_api_key') || '';
                setCustomKey(stored);
                setSavedKey(stored);
            }, 0);
        }
    }, [open]);

    if (!open) return null;

    const handleSave = () => {
        localStorage.setItem('gemini_custom_api_key', customKey.trim());
        setSavedKey(customKey.trim());

        // Slight delay to feel like "saving", then close
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleClear = () => {
        localStorage.removeItem('gemini_custom_api_key');
        setCustomKey('');
        setSavedKey('');
    };

    return (
        <>
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 100,
                    animation: 'fadeIn 0.2s ease',
                    backdropFilter: 'blur(2px)'
                }}
            />
            <div
                className="glass-card animate-fade-in-up"
                style={{
                    position: 'fixed', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '400px', maxWidth: '90vw',
                    zIndex: 101, padding: '24px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Key size={18} style={{ color: 'var(--accent)' }} />
                        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>API Key 设置</h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent', border: 'none', color: 'var(--text-muted)',
                            cursor: 'pointer', padding: '4px', borderRadius: '4px'
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '12px' }}>
                        系统预置了 3 个免费的 Gemini API Key。当预置 Key 的免费额度耗尽时，你可以输入自己的专属 Key 继续使用。
                    </p>

                    <div style={{ position: 'relative' }}>
                        <input
                            type="password"
                            placeholder="输入你的 Gemini API Key (选填)"
                            value={customKey}
                            onChange={(e) => setCustomKey(e.target.value)}
                            style={{
                                width: '100%',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                outline: 'none',
                                fontFamily: 'monospace'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {savedKey ? (
                        <button
                            onClick={handleClear}
                            className="btn-ghost"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                        >
                            <Trash2 size={14} />
                            清除专属 Key
                        </button>
                    ) : <div />}

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={onClose} className="btn-ghost">
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            disabled={!customKey.trim() && !savedKey}
                        >
                            <Save size={14} />
                            保存设置
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
