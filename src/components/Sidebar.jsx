import { MessageSquarePlus, MessageSquare, Film, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';

export default function Sidebar({ collapsed, onToggle }) {
    const { conversations, activeConvId, setActiveConvId, createConversation } = useApp();

    const formatTime = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
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

                {/* Toggle button */}
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
                        style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={() => setActiveConvId(conv.id)}
                        title={collapsed ? conv.title : ''}
                    >
                        <MessageSquare
                            size={14}
                            style={{ color: activeConvId === conv.id ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}
                        />
                        {!collapsed && (
                            <div style={{ flex: 1, overflow: 'hidden' }}>
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
                                    {conv.messages.length} 条消息 · {formatTime(conv.createdAt || conv.created_at)}
                                </div>
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
    );
}
