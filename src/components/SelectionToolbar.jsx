import { useState, useEffect } from 'react';
import { BookmarkPlus, Bot, X, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translateWithGemini } from '../services/geminiService';

export default function SelectionToolbar() {
    const { handleSaveWord } = useApp();
    const [selectionInfo, setSelectionInfo] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    const [englishText, setEnglishText] = useState('');
    const [chineseText, setChineseText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        const handleMouseUp = () => {
            if (modalOpen) return;

            const selection = window.getSelection();
            const text = selection.toString().trim();

            if (text && text.length > 0) {
                // Ensure selection is not inside an input
                const activeEl = document.activeElement;
                if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
                    setSelectionInfo(null);
                    return;
                }

                // Small delay to allow double-click selection to settle
                setTimeout(() => {
                    const latestSelection = window.getSelection();
                    if (!latestSelection.rangeCount) return;
                    const range = latestSelection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();

                    setSelectionInfo({
                        text,
                        x: rect.left + (rect.width / 2),
                        y: rect.top - 10
                    });
                }, 10);
            } else {
                setSelectionInfo(null);
            }
        };

        // Also close the popup if we click elsewhere (mousedown clears selection before mouseup)
        const handleMouseDown = (e) => {
            if (selectionInfo && !e.target.closest('.selection-toolbar-popup')) {
                setSelectionInfo(null);
            }
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, [modalOpen, selectionInfo]);

    const handleOpenSaveModal = (e) => {
        e.stopPropagation();
        setEnglishText(selectionInfo.text);
        setChineseText('');
        setModalOpen(true);
        setSelectionInfo(null);
        window.getSelection().removeAllRanges();
    };

    const handleAutoTranslate = async () => {
        setIsTranslating(true);
        try {
            // Add context hint to force en_to_zh path
            const prompt = `请用非常简短的一句话解释这个影视专业词汇/句子的意思: "${englishText}"`;
            const result = await translateWithGemini(prompt);

            // Because geminiService forces a specific JSON schema (en_to_zh or zh_to_en),
            // It will return result.translation or result.optimized_english. Let's gracefully pick what makes sense.
            if (result.translation) {
                setChineseText(result.translation);
            } else if (result.chinese_explanation) {
                setChineseText(result.chinese_explanation);
            } else {
                setChineseText(Object.values(result)[0] || '翻译成功');
            }
        } catch (err) {
            console.error("Auto-translate failed:", err);
            setChineseText(`[翻译失败] ${err.message}`);
        } finally {
            setIsTranslating(false);
        }
    };

    const confirmSave = () => {
        handleSaveWord({
            english: englishText,
            chinese_explanation: chineseText,
            style: 'casual'
        });
        setModalOpen(false);
    };

    return (
        <>
            {/* Floating Toolbar Button */}
            {selectionInfo && !modalOpen && (
                <div
                    className="selection-toolbar-popup animate-fade-in-up"
                    style={{
                        position: 'fixed',
                        left: `${selectionInfo.x}px`,
                        top: `${selectionInfo.y}px`,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 9999,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5), 0 0 15px var(--accent-glow)',
                        borderRadius: '8px',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <button
                        onClick={handleOpenSaveModal}
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <BookmarkPlus size={14} /> 收藏到单词本
                    </button>
                    {/* Tiny arrow pointing down */}
                    <div style={{
                        position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)',
                        width: '10px', height: '10px', background: 'var(--bg-card)',
                        borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)'
                    }} />
                </div>
            )}

            {/* Save Modal */}
            {modalOpen && (
                <>
                    <div
                        onClick={() => setModalOpen(false)}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.5)', zIndex: 10000,
                            animation: 'fadeIn 0.2s ease', backdropFilter: 'blur(2px)'
                        }}
                    />
                    <div
                        className="glass-card animate-fade-in-up"
                        style={{
                            position: 'fixed', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '400px', maxWidth: '90vw',
                            zIndex: 10001, padding: '24px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <BookmarkPlus size={18} style={{ color: 'var(--accent)' }} />
                                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>添加生词/短语</h2>
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                style={{
                                    background: 'transparent', border: 'none', color: 'var(--text-muted)',
                                    cursor: 'pointer', padding: '4px', borderRadius: '4px'
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>摘抄内容 (英文)</label>
                            <div style={{
                                background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px',
                                fontSize: '14px', color: 'var(--text-primary)', borderLeft: '3px solid var(--accent)',
                                maxHeight: '100px', overflowY: 'auto'
                            }}>
                                {englishText}
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>中文释义 (选填)</label>
                                <button
                                    onClick={handleAutoTranslate}
                                    disabled={isTranslating}
                                    className="btn-ghost"
                                    style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning)' }}
                                >
                                    {isTranslating ? <span className="typing-dot" style={{ display: 'inline-block' }} /> : <Bot size={12} />}
                                    {isTranslating ? '翻译中...' : 'AI 辅助翻译'}
                                </button>
                            </div>
                            <textarea
                                value={chineseText}
                                onChange={(e) => setChineseText(e.target.value)}
                                placeholder="输入中文解释..."
                                rows={3}
                                style={{
                                    width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)',
                                    borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)',
                                    fontSize: '13px', outline: 'none', resize: 'none'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setModalOpen(false)} className="btn-ghost" disabled={isTranslating}>
                                取消
                            </button>
                            <button onClick={confirmSave} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} disabled={isTranslating}>
                                <Save size={14} /> 保存到单词本
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
