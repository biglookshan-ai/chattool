import { useState, useEffect } from 'react';
import { Key, X, Plus, Trash2, CheckCircle, HelpCircle, Minus, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ApiKeySettings({ open, onClose }) {
    const { apiKeys, saveApiKeys } = useApp();
    const [keys, setKeys] = useState(() => [...apiKeys]);

    // Re-sync local state from global AppContext when modal opens
    useEffect(() => {
        if (open) {
            setKeys(apiKeys.length > 0 ? [...apiKeys] : ['']);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    if (!open) return null;

    const handleSave = () => {
        const cleanedKeys = keys.map(k => k.trim()).filter(k => k.length > 0);
        const finalKeys = cleanedKeys.length > 0 ? cleanedKeys : [''];
        setKeys(finalKeys);

        // Save to global context, which persists to DB & LocalStorage
        saveApiKeys(finalKeys);

        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleClearAll = () => {
        saveApiKeys([]);
        setKeys(['']);
    };

    const updateKey = (index, value) => {
        const newKeys = [...keys];
        newKeys[index] = value;
        setKeys(newKeys);
    };

    const addKey = () => {
        setKeys([...keys, '']);
    };

    const removeKey = (index) => {
        const newKeys = keys.filter((_, i) => i !== index);
        setKeys(newKeys.length > 0 ? newKeys : ['']);
    };

    const hasValidKeys = keys.some(k => k.trim().length > 0);

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
                className="animate-slide-in-right"
                style={{
                    position: 'fixed', top: 0, right: 0, bottom: 0,
                    width: '360px', maxWidth: '100vw',
                    background: 'var(--bg-secondary)',
                    borderLeft: '1px solid var(--border)',
                    zIndex: 101, display: 'flex', flexDirection: 'column',
                    boxShadow: '-8px 0 40px rgba(0,0,0,0.4)'
                }}
            >
                <div style={{
                    padding: '20px', borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
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

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--warning)', lineHeight: '1.5', marginBottom: '16px', padding: '10px', background: 'rgba(234,179,8,0.1)', borderRadius: '6px', border: '1px solid rgba(234,179,8,0.2)' }}>
                        ⚠️ 系统不再提供默认 Key。请自行添加你的专属 Gemini API Keys。
                        <br /><br />
                        如果某个 Key 额度耗尽或失效，系统会自动尝试切换下一个。
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {keys.map((k, index) => {
                            const isPlaceholderKey = k.length > 10;
                            const displayValue = isPlaceholderKey
                                ? `••••••••••••••••••••${k.slice(-4)}`
                                : k;

                            return (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder={`Gemini API Key ${index + 1}`}
                                        value={displayValue}
                                        onFocus={(e) => {
                                            if (isPlaceholderKey) e.target.value = k;
                                        }}
                                        onBlur={(e) => {
                                            if (isPlaceholderKey) e.target.value = displayValue;
                                        }}
                                        onChange={(e) => updateKey(index, e.target.value)}
                                        style={{
                                            flex: 1, minWidth: 0,
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
                                    <button
                                        onClick={() => removeKey(index)}
                                        className="btn-ghost"
                                        style={{ padding: '8px', color: '#f87171' }}
                                        title="移除"
                                    >
                                        <Minus size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={addKey}
                        className="btn-ghost"
                        style={{ marginTop: '16px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', padding: '10px' }}
                    >
                        <Plus size={14} /> 增加一个 Key 备用
                    </button>
                </div>

                <div style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                        onClick={handleSave}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '6px', padding: '12px' }}
                        disabled={!hasValidKeys}
                    >
                        <Save size={14} />
                        保存设置
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="btn-ghost"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '6px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                    >
                        <Trash2 size={14} />
                        清空全部
                    </button>
                </div>
            </div>
        </>
    );
}
