import { useState, useRef, useCallback } from 'react';
import { Send, Loader2, Lightbulb } from 'lucide-react';

const HINTS = [
    'Can you check the back focus on the B-cam?',
    '今天收工，明天上午8点出发去片场。',
    'We need a 2x anamorphic with PL mount for next week.',
    '这个镜头的PL口适配器有没有？',
    'The wireless follow focus is not tracking properly.',
    '我们需要确认call time和租金是否包含保险。',
];

export default function ChatInput({ onSend, disabled }) {
    const [value, setValue] = useState('');
    const [mode, setMode] = useState('ask'); // 'ask' or 'reply'
    const textareaRef = useRef(null);
    const [hintIndex, setHintIndex] = useState(() => Math.floor(Math.random() * HINTS.length));

    const handleSubmit = useCallback(() => {
        const trimmed = value.trim();
        if (!trimmed || disabled) return;

        let finalOutput = trimmed;
        if (mode === 'reply') {
            // Prefix with [REPLY] flag if not already present so timeline treats it as I Reply
            if (!finalOutput.startsWith('[REPLY] ')) {
                finalOutput = '[REPLY] ' + finalOutput;
            }
        }

        onSend(finalOutput);
        setValue('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }, [value, disabled, mode, onSend]);

    // Removed Enter to submit per user request, allowing for multiline natural drafting
    const handleKeyDown = (e) => {
        // Just let Enter do default line break
    };

    const handleInput = (e) => {
        setValue(e.target.value);
        // Auto-resize
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 160) + 'px';
        }
    };

    const insertHint = () => {
        const hint = HINTS[hintIndex];
        setValue(hint);
        setHintIndex((hintIndex + 1) % HINTS.length);
        if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
        }
    };

    return (
        <div style={{
            padding: '16px 20px 20px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            flexShrink: 0
        }}>

            {/* Mode Switcher Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <button
                    onClick={() => setMode('ask')}
                    style={{
                        padding: '6px 16px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        background: mode === 'ask' ? 'var(--bg-card)' : 'transparent',
                        color: mode === 'ask' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        boxShadow: mode === 'ask' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                >
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: mode === 'ask' ? 'var(--text-secondary)' : 'transparent',
                        border: `1px solid ${mode === 'ask' ? 'var(--text-secondary)' : 'var(--border)'}`
                    }} />
                    翻译对方内容
                </button>
                <button
                    onClick={() => setMode('reply')}
                    style={{
                        padding: '6px 16px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        background: mode === 'reply' ? 'var(--accent)' : 'transparent',
                        color: mode === 'reply' ? 'white' : 'var(--text-secondary)',
                        boxShadow: mode === 'reply' ? '0 2px 10px var(--accent-glow)' : 'none',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                >
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: mode === 'reply' ? 'white' : 'transparent',
                        border: `1px solid ${mode === 'reply' ? 'white' : 'var(--border)'}`
                    }} />
                    润色我的回复
                </button>
            </div>

            {/* Input container */}
            <div style={{ position: 'relative' }}>
                <textarea
                    ref={textareaRef}
                    className="chat-input"
                    value={value}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        mode === 'ask'
                            ? "直接粘贴对方的英文... (或输入中文自动翻译)"
                            : "直接输入你想回对方的中文... (AI将润色为专业英文)"
                    }
                    rows={3}
                    disabled={disabled}
                    style={{
                        paddingRight: '52px',
                        borderColor: mode === 'reply' ? 'var(--accent)' : 'var(--border)'
                    }}
                />
                {/* Send button */}
                <button
                    onClick={handleSubmit}
                    disabled={!value.trim() || disabled}
                    style={{
                        position: 'absolute',
                        right: '10px',
                        bottom: '10px',
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        border: 'none',
                        background: value.trim() && !disabled
                            ? (mode === 'reply' ? 'var(--accent)' : 'var(--bg-hover)')
                            : 'var(--bg-hover)',
                        color: value.trim() && !disabled ? 'white' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: value.trim() && !disabled ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                        outline: 'none'
                    }}
                    title="发送 (Enter)"
                >
                    {disabled
                        ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Send size={15} color={value.trim() && !disabled ? (mode === 'ask' ? 'var(--text-primary)' : 'white') : 'var(--text-muted)'} />
                    }
                </button>
            </div>

            {/* Footer row */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '10px'
            }}>
                {/* Hint button */}
                <button
                    onClick={insertHint}
                    disabled={disabled}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '11px',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        padding: '0',
                        transition: 'color 0.15s',
                        fontFamily: 'Inter, sans-serif'
                    }}
                    title="插入示例文本"
                >
                    <Lightbulb size={12} />
                    示例句子
                </button>

                {/* Shortcut hint */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        点击右下角按钮发送
                    </span>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10px',
                        color: 'var(--text-muted)'
                    }}>
                        <span style={{
                            display: 'inline-block',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '3px',
                            padding: '1px 5px',
                            fontSize: '9px',
                            fontFamily: 'monospace'
                        }}>EN</span>
                        <span>↔</span>
                        <span style={{
                            display: 'inline-block',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '3px',
                            padding: '1px 5px',
                            fontSize: '9px',
                            fontFamily: 'monospace'
                        }}>中</span>
                        <span>自动检测</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
