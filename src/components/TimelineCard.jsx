import { useState } from 'react';
import { Bot, CheckCircle, BookmarkPlus, Reply, Send, RefreshCw, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

// Typing indicator for loading state
export function TypingIndicator() {
    return (
        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '3px solid var(--accent)' }}>
            <div style={{
                width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--accent) 0%, #9b59b6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Bot size={14} color="white" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
            </div>
        </div>
    );
}

// Save button that tracks its own saved state
function SaveButton({ english, chinese_explanation, style: btnStyle }) {
    const { handleSaveWord, wordBook } = useApp();
    const [saved, setSaved] = useState(() => wordBook.some(w => w.english === english));

    const handleClick = () => {
        if (saved) return;
        const ok = handleSaveWord({ english, chinese_explanation, style: btnStyle });
        if (ok) setSaved(true);
    };

    return (
        <button className={`btn-save ${saved ? 'saved' : ''}`} onClick={handleClick}>
            {saved ? <CheckCircle size={11} /> : <BookmarkPlus size={11} />}
            {saved ? '已收藏' : '➕ 收藏'}
        </button>
    );
}

// Copy button that shows a temporary success state
function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <button
            onClick={handleCopy}
            className="btn-ghost"
            style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '4px 8px', fontSize: '11px', color: copied ? 'var(--success)' : 'var(--text-muted)',
                borderColor: copied ? 'rgba(74, 222, 128, 0.3)' : 'var(--border)',
                background: copied ? 'var(--success-dim)' : 'transparent'
            }}
            title="一键复制到剪贴板"
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? '已复制' : '复制'}
        </button>
    );
}

// Error card
function ErrorCard({ message, onRetry }) {
    const isApiKeyError = message === 'MISSING_API_KEY';
    return (
        <div className="glass-card" style={{
            padding: '14px 16px',
            borderColor: 'rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.05)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
            <p style={{ fontSize: '13px', color: '#f87171', lineHeight: '1.6', margin: 0, flex: 1 }}>
                {isApiKeyError ? (
                    <>⚠️ 缺少 API Key。请点击左上角齿轮图标 ⚙️ 配置。配置好后可点击右侧重试。</>
                ) : (
                    <>⚠️ 请求失败：{message}</>
                )}
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="btn-ghost"
                    style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--text-primary)', border: '1px solid var(--border)', marginLeft: '12px' }}
                >
                    <RefreshCw size={12} style={{ marginRight: '4px' }} /> 重新生成
                </button>
            )}
        </div>
    );
}

export default function TimelineCard({ interaction, isLoading, onReply, onRegenerate, onRetryError }) {
    const { userMsg, assistantMsg } = interaction;

    // Determine the type of interaction
    let isReplyFlow = false;
    let originalText = userMsg?.content || '';
    let englishContext = null;

    // Fallback for older messages before we explicitly added [REPLY] flag
    // if the AI returned zh_to_en, it implies the user sent Chinese.
    if (originalText.startsWith('[REPLY] ')) {
        isReplyFlow = true;
        originalText = originalText.replace('[REPLY] ', '');
        englishContext = userMsg?.originalContext;
    } else if (assistantMsg?.data?.type === 'zh_to_en') {
        isReplyFlow = true;
    }

    // Local states
    // Auto-collapse previous phases if the user has ALREADY entered their reply.
    const hasAlreadyReplied = assistantMsg?.user_reply_text ? true : false;
    const [showFullExchange, setShowFullExchange] = useState(!hasAlreadyReplied);
    const [showReplies, setShowReplies] = useState(false);
    const [replyText, setReplyText] = useState('');

    // Safety check - if somehow we don't have a user message (rare error state)
    if (!userMsg && !assistantMsg) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }} className="animate-fade-in-up">

            {/* Header / Badge */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', paddingLeft: '4px' }}>
                <span className={`tag ${isReplyFlow ? 'tag-optimized' : 'tag-casual'}`} style={{
                    background: isReplyFlow ? 'var(--accent)' : 'var(--bg-card)',
                    color: isReplyFlow ? 'white' : 'var(--text-secondary)',
                    borderColor: isReplyFlow ? 'var(--accent)' : 'var(--border)',
                    boxShadow: isReplyFlow ? '0 0 10px var(--accent-glow)' : 'none'
                }}>
                    {isReplyFlow ? '我回复' : '对方问'}
                </span>
            </div>

            {/* Main Card Container */}
            <div className="glass-card" style={{
                overflow: 'hidden',
                borderLeft: `3px solid ${isReplyFlow ? 'var(--accent)' : 'var(--border-light)'}`
            }}>

                {/* 1. Input Section (What the user typed/pasted) */}
                {userMsg && (
                    <div style={{
                        padding: '16px',
                        background: 'rgba(0,0,0,0.2)',
                        borderBottom: '1px solid var(--border)'
                    }}>
                        {isReplyFlow && englishContext && (
                            <div style={{
                                marginBottom: '12px',
                                padding: '10px 14px',
                                background: 'var(--bg-card)',
                                borderRadius: '6px',
                                borderLeft: '3px solid var(--border-light)',
                                color: 'var(--text-secondary)',
                                fontSize: '13px',
                                lineHeight: '1.5'
                            }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                                    引用的英文语境
                                </div>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{englishContext}</div>
                            </div>
                        )}
                        <div style={{
                            fontSize: '15px',
                            lineHeight: '1.6',
                            color: 'var(--text-primary)',
                            fontFamily: 'inherit',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {originalText}
                        </div>
                    </div>
                )}

                {/* 2. Loading State */}
                {isLoading && (
                    <div style={{ padding: '16px' }}>
                        <TypingIndicator />
                    </div>
                )}

                {/* 3. Error State */}
                {assistantMsg?.error && (
                    <div style={{ padding: '16px' }}>
                        <ErrorCard message={assistantMsg.error} onRetry={() => onRetryError && onRetryError(interaction)} />
                    </div>
                )}

                {/* 4. Results Section */}
                {assistantMsg?.data && !isLoading && !assistantMsg.error && (
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* A. Mode: Other Asks -> English to Chinese */}
                        {!isReplyFlow && assistantMsg.data.type === 'en_to_zh' && (
                            <>
                                {/* Collapsible Middle Section (Translation, References, User's raw reply) */}
                                {showFullExchange && (
                                    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {/* Translation outcome */}
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                                <Bot size={14} color="var(--accent)" />
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>翻译</span>
                                            </div>
                                            <p style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--text-primary)', fontFamily: 'inherit' }}>
                                                {assistantMsg.data.translation}
                                            </p>
                                        </div>

                                        {/* Reference Replies (Collapsible within) */}
                                        {assistantMsg.data.replies && assistantMsg.data.replies.length > 0 && (
                                            <div style={{
                                                background: 'var(--bg-primary)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)',
                                                overflow: 'hidden'
                                            }}>
                                                <button
                                                    onClick={() => setShowReplies(!showReplies)}
                                                    style={{
                                                        width: '100%', padding: '10px 14px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        background: 'transparent', border: 'none',
                                                        color: 'var(--text-secondary)', fontSize: '12px',
                                                        cursor: 'pointer', outline: 'none'
                                                    }}
                                                >
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        💬 参考回复 ({assistantMsg.data.replies.length})
                                                    </span>
                                                    {showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </button>

                                                {showReplies && (
                                                    <div style={{ padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {assistantMsg.data.replies.map((reply, i) => (
                                                            <div key={i}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                                    <span className={`tag ${reply.style === 'casual' ? 'tag-casual' : 'tag-professional'}`}>
                                                                        {reply.style === 'casual' ? '🎬 地道口语' : '📋 专业商务'}
                                                                    </span>
                                                                </div>
                                                                <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                                                    "{reply.english}"
                                                                </p>
                                                                {reply.chinese_explanation && (
                                                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '6px' }}>
                                                                        {reply.chinese_explanation}
                                                                    </p>
                                                                )}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <CopyButton text={reply.english} />
                                                                    <SaveButton english={reply.english} chinese_explanation={reply.chinese_explanation} style={reply.style} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Nested Reply Section (User's Chinese) */}
                                        {(assistantMsg.loading_reply || assistantMsg.user_reply_text) && (
                                            <div style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                                    <Reply size={14} color="var(--accent)" />
                                                    <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>我回复</span>
                                                </div>
                                                <div style={{
                                                    padding: '12px', background: 'var(--bg-card)', borderRadius: '8px',
                                                    color: 'var(--text-primary)', fontSize: '14px',
                                                    border: '1px solid var(--border)'
                                                }}>
                                                    {assistantMsg.user_reply_text}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Collapse Toggle Button (Only after they have replied) */}
                                {hasAlreadyReplied && (
                                    <button
                                        onClick={() => setShowFullExchange(!showFullExchange)}
                                        className="btn-ghost animate-fade-in-up"
                                        style={{
                                            width: '100%', padding: '8px', fontSize: '12px',
                                            color: 'var(--text-muted)', display: 'flex',
                                            justifyContent: 'center', alignItems: 'center', gap: '4px',
                                            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px',
                                            marginTop: showFullExchange ? '8px' : '0'
                                        }}
                                    >
                                        {showFullExchange ? <><ChevronUp size={14} /> 收起交互过程</> : <><ChevronDown size={14} /> 展开中间翻译与解析过程</>}
                                    </button>
                                )}

                                {/* Bottom Block (Either Input Box OR Target English) */}
                                {assistantMsg.loading_reply ? (
                                    <div style={{ marginTop: '16px' }}><TypingIndicator /></div>
                                ) : assistantMsg.reply_error ? (
                                    <div style={{ marginTop: '16px' }}><ErrorCard message={assistantMsg.reply_error} onRetry={() => onReply(assistantMsg.user_reply_text, originalText, assistantMsg.id)} /></div>
                                ) : assistantMsg.reply_data ? (
                                    <div className="animate-fade-in-up" style={{ marginTop: showFullExchange ? '16px' : '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                            <Bot size={14} color="var(--warning)" />
                                            <span style={{ fontSize: '12px', color: 'var(--warning)', fontWeight: 600 }}>自动翻译为英文</span>
                                        </div>
                                        <div style={{
                                            background: 'var(--bg-primary)', borderRadius: '8px',
                                            padding: '12px 16px', borderLeft: '3px solid var(--warning)', marginBottom: '10px'
                                        }}>
                                            <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                                                {assistantMsg.reply_data.optimized_english}
                                            </p>
                                        </div>
                                        {showFullExchange && assistantMsg.reply_data.chinese_explanation && (
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '10px' }}>
                                                {assistantMsg.reply_data.chinese_explanation}
                                            </p>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <CopyButton text={assistantMsg.reply_data.optimized_english} />
                                            <SaveButton
                                                english={assistantMsg.reply_data.optimized_english}
                                                chinese_explanation={assistantMsg.reply_data.chinese_explanation}
                                                style="optimized"
                                            />
                                        </div>
                                    </div>
                                ) : !assistantMsg.user_reply_text ? (
                                    <div className="animate-fade-in-up" style={{
                                        background: 'var(--bg-hover)', padding: '12px',
                                        borderRadius: '8px', border: '1px dashed var(--border-light)', marginTop: '0'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                            <Reply size={14} color="var(--accent)" />
                                            <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>我直接回复对方</span>
                                        </div>
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    if (replyText.trim()) {
                                                        onReply(replyText, originalText, assistantMsg.id);
                                                        setReplyText('');
                                                    }
                                                }
                                            }}
                                            placeholder="用中文写下你的回复..."
                                            style={{
                                                width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
                                                borderRadius: '6px', padding: '10px', color: 'var(--text-primary)',
                                                fontSize: '13px', outline: 'none', resize: 'none', minHeight: '60px', marginBottom: '8px'
                                            }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => {
                                                    if (replyText.trim()) {
                                                        onReply(replyText, originalText, assistantMsg.id);
                                                        setReplyText('');
                                                    }
                                                }}
                                                className="btn-primary"
                                                disabled={!replyText.trim()}
                                                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Send size={12} />
                                                生成英文回复
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </>
                        )}

                        {/* B. Mode: I Reply -> Chinese to English Optimization */}
                        {isReplyFlow && assistantMsg.data.type === 'zh_to_en' && (
                            <>
                                {/* Optimized outcome */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Bot size={14} color="var(--warning)" />
                                            <span style={{ fontSize: '12px', color: 'var(--warning)', fontWeight: 600 }}>生成回复</span>
                                        </div>

                                        <button
                                            onClick={() => onRegenerate(userMsg, assistantMsg.id)}
                                            className="btn-ghost"
                                            style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <RefreshCw size={11} /> 重新生成
                                        </button>
                                    </div>

                                    <div style={{
                                        background: 'var(--bg-primary)',
                                        borderRadius: '8px',
                                        padding: '12px 16px',
                                        borderLeft: '3px solid var(--warning)'
                                    }}>
                                        <p className="mono" style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', fontWeight: 500 }}>
                                            "{assistantMsg.data.optimized_english}"
                                        </p>
                                    </div>
                                </div>

                                {/* Explanation & Save */}
                                <div>
                                    {assistantMsg.data.chinese_explanation && (
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '10px' }}>
                                            {assistantMsg.data.chinese_explanation}
                                        </p>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CopyButton text={assistantMsg.data.optimized_english} />
                                        <SaveButton
                                            english={assistantMsg.data.optimized_english}
                                            chinese_explanation={assistantMsg.data.chinese_explanation}
                                            style="optimized"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}
