import { useState } from 'react';
import { MessageSquarePlus, MessageSquare, Film, ChevronLeft, ChevronRight, LogOut, Edit2, Trash2, X, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';

export default function Sidebar({ collapsed, onToggle }) {
    const { conversations, activeConvId, setActiveConvId, createConversation, updateConversationMetadata, deleteConversation } = useApp();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editConv, setEditConv] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editNote, setEditNote] = useState('');

    const formatTime = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    };

    const openEditModal = (conv, e) => {
        e.stopPropagation();
        setEditConv(conv);
        setEditTitle(conv.title || '');
        setEditNote(conv.note || '');
        setEditModalOpen(true);
    };

    const handleSaveMetadata = () => {
        if (editConv) {
            updateConversationMetadata(editConv.id, { title: editTitle.trim() || '未命名对话', note: editNote.trim() });
        }
        setEditModalOpen(false);
    };

    return (
        <>
            <div
                style={{
                    width: collapsed ? '52px' : '240px',
                    minWidth: collapsed ? '52px' : '240px',
                    background: 'var(--bg-secondary)',
                    borderRight: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'width 0.25s ease, min-width 0.25s ease',
                    overflow: 'hidden',
                    position: 'relative',
                    zIndex: 1
                }}
            >
                {/* Header */}
                <div style={{
                    padding: collapsed ? '16px 0' : '16px 12px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    gap: '8px',
                    flexShrink: 0
                }}>
                    {!collapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Film size={16} style={{ color: 'var(--accent)' }} />
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                影视翻译助手
                            </span>
                        </div>
                    )}
                    {collapsed && <Film size={18} style={{ color: 'var(--accent)' }} />}

                    <button
                        onClick={onToggle}
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            padding: '4px',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.15s'
                        }}
                        title={collapsed ? '展开侧栏' : '收起侧栏'}
                    >
                        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>

                {/* New conversation button */}
                <div style={{ padding: collapsed ? '10px 8px' : '10px 12px', flexShrink: 0 }}>
                    <button
                        onClick={createConversation}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: '8px',
                            padding: collapsed ? '8px' : '8px 12px',
                            background: 'var(--accent-dim)',
                            border: '1px solid rgba(124,106,247,0.25)',
                            borderRadius: '8px',
                            color: 'var(--accent)',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            whiteSpace: 'nowrap'
                        }}
                        title="新建对话"
                    >
                        <MessageSquarePlus size={15} />
                        {!collapsed && '新建对话'}
                    </button>
                </div>

                {/* Conversation list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '0 8px 8px' : '0 12px 8px' }}>
                    {conversations.length === 0 && !collapsed && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
                            暂无对话
                        </p>
                    )}
                    {conversations.map(conv => (
                        <div
                            key={conv.id}
                            className={`conv-item ${activeConvId === conv.id ? 'active' : ''}`}
                            style={{
                                marginBottom: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                position: 'relative'
                            }}
                            onClick={() => setActiveConvId(conv.id)}
                            title={conv.note ? `[备注] ${conv.note}` : conv.title}
                        >
                            <MessageSquare
                                size={14}
                                style={{ color: activeConvId === conv.id ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}
                            />
                            {!collapsed && (
                                <div style={{ flex: 1, overflow: 'hidden', paddingRight: '24px' }}>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: activeConvId === conv.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {conv.title}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                                        {formatTime(conv.createdAt || conv.created_at)}
                                    </div>
                                    {conv.note && (
                                        <div style={{ fontSize: '10px', color: 'var(--warning)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            📝 {conv.note}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Hover Buttons (Visible when active) */}
                            {!collapsed && activeConvId === conv.id && (
                                <div style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    display: 'flex',
                                    gap: '6px'
                                }}>
                                    <button
                                        className="edit-conv-btn"
                                        onClick={(e) => openEditModal(conv, e)}
                                        style={{
                                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                                            borderRadius: '4px', padding: '4px', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--text-secondary)'
                                        }}
                                        title="编辑备注"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                    <button
                                        className="edit-conv-btn"
                                        onClick={(e) => deleteConversation(conv.id, e)}
                                        style={{
                                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                                            borderRadius: '4px', padding: '4px', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#f87171' // Red for delete
                                        }}
                                        title="删除对话"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Logout button */}
                <div style={{ padding: collapsed ? '10px 8px' : '10px 12px', flexShrink: 0, borderTop: '1px solid var(--border)' }}>
                    <button
                        onClick={() => supabase.auth.signOut()}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: '8px',
                            padding: collapsed ? '8px' : '8px 12px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'color 0.15s',
                            whiteSpace: 'nowrap'
                        }}
                        title="退出登录"
                    >
                        <LogOut size={15} />
                        {!collapsed && '退出登录'}
                    </button>
                </div>
            </div>

            {/* Edit Metadata Modal */}
            {editModalOpen && (
                <>
                    <div
                        onClick={() => setEditModalOpen(false)}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.5)', zIndex: 200,
                            animation: 'fadeIn 0.2s ease',
                            backdropFilter: 'blur(2px)'
                        }}
                    />
                    <div
                        className="glass-card animate-fade-in-up"
                        style={{
                            position: 'fixed', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '360px', maxWidth: '90vw',
                            zIndex: 201, padding: '24px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Edit2 size={18} style={{ color: 'var(--accent)' }} />
                                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>编辑对话信息</h2>
                            </div>
                            <button
                                onClick={() => setEditModalOpen(false)}
                                style={{
                                    background: 'transparent', border: 'none', color: 'var(--text-muted)',
                                    cursor: 'pointer', padding: '4px', borderRadius: '4px'
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>对话标题</label>
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="输入标题"
                                style={{
                                    width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)',
                                    borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)',
                                    fontSize: '13px', outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>对话备注</label>
                            <textarea
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                placeholder="添加一些备注信息帮助分类..."
                                rows={3}
                                style={{
                                    width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)',
                                    borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)',
                                    fontSize: '13px', outline: 'none', resize: 'none'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setEditModalOpen(false)} className="btn-ghost">
                                取消
                            </button>
                            <button onClick={handleSaveMetadata} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Save size={14} /> 保存
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
