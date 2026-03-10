import { useRef, useEffect, useState, useCallback } from 'react';
import { BookOpen, Film, Zap, Key, Menu } from 'lucide-react';
import { useApp } from './context/AppContext';
import { translateWithGemini } from './services/geminiService';
import Sidebar from './components/Sidebar';
import TimelineCard, { TypingIndicator } from './components/TimelineCard';
import ChatInput from './components/ChatInput';
import WordBook from './components/WordBook';
import ApiKeySettings from './components/ApiKeySettings';
import SelectionToolbar from './components/SelectionToolbar';

// Spin keyframe via inline style tag
const spinStyle = document.createElement('style');
spinStyle.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
document.head.appendChild(spinStyle);

// Welcome screen shown when a conversation has no messages
function WelcomeScreen() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', gap: '24px', userSelect: 'none'
    }}>
      {/* Icon + Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '64px', height: '64px', margin: '0 auto 16px',
          background: 'linear-gradient(135deg, var(--accent) 0%, #9b59b6 100%)',
          borderRadius: '18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 32px var(--accent-glow)'
        }}>
          <Film size={30} color="white" />
        </div>
        <h1 style={{
          fontSize: '22px', fontWeight: 800,
          color: 'var(--text-primary)', marginBottom: '8px'
        }}>
          影视器材圈专属翻译助手
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '380px', lineHeight: '1.6' }}>
          由资深 Rental House 经理 · 1st AC 驱动<br />
          懂行业黑话，翻译像真人说话
        </p>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '560px' }}>
        {[
          { icon: '🇬🇧', title: '英文 → 中文', desc: '地道翻译 + 2种英文回复建议' },
          { icon: '🇨🇳', title: '中文 → 英文', desc: '优化成地道行业英文' },
          { icon: '📖', title: '单词本', desc: '一键收藏，随时复习' },
        ].map((f, i) => (
          <div key={i} className="glass-card" style={{
            padding: '14px 18px', textAlign: 'center',
            flex: '1 1 150px', minWidth: '150px'
          }}>
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{f.icon}</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{f.title}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Jargon tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', maxWidth: '460px' }}>
        {['PL Mount', 'Anamorphic', 'Follow Focus', 'Back Focus', 'Wrap', 'Call Time', 'ARRI Alexa 35', 'Preston FF'].map(t => (
          <span key={t} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '3px 10px',
            fontSize: '11px', color: 'var(--text-muted)',
            fontFamily: 'JetBrains Mono, monospace'
          }}>{t}</span>
        ))}
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Zap size={12} style={{ color: 'var(--accent)' }} />
        粘贴英文 或 输入中文，即刻开始
      </p>
    </div>
  );
}

export default function App() {
  const {
    activeConversation, activeConvId, addMessage, updateLastMessage, updateMessage,
    wordBookOpen, setWordBookOpen, isLoading, setIsLoading
  } = useApp();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 768);
  const [keySettingsOpen, setKeySettingsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile && !isMobile) setSidebarCollapsed(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages?.length, isLoading, scrollToBottom]);

  const handleSend = useCallback(async (text) => {
    if (isLoading) return;

    // Add user message
    const userMsg = { id: Date.now().toString(), role: 'user', content: text };
    addMessage(activeConvId, userMsg);
    setIsLoading(true);

    // Placeholder assistant message
    const assistantId = (Date.now() + 1).toString();
    addMessage(activeConvId, { id: assistantId, role: 'assistant', data: null, error: null });

    try {
      const result = await translateWithGemini(text);
      updateLastMessage(activeConvId, { data: result, error: null });
    } catch (err) {
      updateLastMessage(activeConvId, { data: null, error: err.message || 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, activeConvId, addMessage, updateLastMessage, setIsLoading]);

  const handleSendReply = useCallback(async (chineseReply, englishContext, baseAssistantMsgId) => {
    if (!chineseReply.trim() || isLoading) return;

    // Show the user's reply in the UI inline within the same card
    updateMessage(activeConvId, baseAssistantMsgId, {
      loading_reply: true,
      user_reply_text: chineseReply,
      reply_error: null
    });
    setIsLoading(true);

    const promptText = `[REPLY_TO_CONTEXT]\nOriginal Message: "${englishContext}"\nMy Chinese Reply: "${chineseReply}"\n\nPlease translate my Chinese reply into professional Film Industry English.`;

    try {
      const result = await translateWithGemini(promptText);
      updateMessage(activeConvId, baseAssistantMsgId, {
        loading_reply: false,
        reply_data: result
      });
    } catch (err) {
      updateMessage(activeConvId, baseAssistantMsgId, {
        loading_reply: false,
        reply_error: err.message || 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, activeConvId, updateMessage, setIsLoading]);

  const handleRegenerate = useCallback(async (userMsg, assistantMsgId) => {
    if (isLoading) return;

    // Reset the assistant message state to loading
    updateLastMessage(activeConvId, { data: null, error: null }, assistantMsgId);
    setIsLoading(true);

    let promptText = userMsg.content;
    if (userMsg.content.startsWith('[REPLY] ')) {
      const chineseReply = userMsg.content.replace('[REPLY] ', '');
      promptText = `[REPLY_TO_CONTEXT]\nOriginal Message: "${userMsg.originalContext}"\nMy Chinese Reply: "${chineseReply}"\n\nPlease translate my Chinese reply into professional Film Industry English.`;
    }

    try {
      const result = await translateWithGemini(promptText);
      updateLastMessage(activeConvId, { data: result, error: null }, assistantMsgId);
    } catch (err) {
      updateLastMessage(activeConvId, { data: null, error: err.message || 'Unknown error' }, assistantMsgId);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, activeConvId, updateLastMessage, setIsLoading]);

  const messages = activeConversation?.messages || [];

  // Group messages into interactions: User message followed by Assistant message
  const interactions = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'user') {
      const interaction = { userMsg: messages[i], assistantMsg: null };
      if (i + 1 < messages.length && messages[i + 1].role === 'assistant') {
        interaction.assistantMsg = messages[i + 1];
        i++; // skip the assistant message in the next loop
      }
      interactions.push(interaction);
    } else if (messages[i].role === 'assistant') {
      // rare fallback if assistant message without user message
      interactions.push({ userMsg: null, assistantMsg: messages[i] });
    }
  }

  return (
    <div style={{ background: 'var(--bg-primary)', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        maxWidth: '1400px',
        overflow: 'hidden',
        position: 'relative',
        background: 'var(--bg-secondary)',
        boxShadow: '0 0 40px rgba(0,0,0,0.5)'
      }}>
        {/* Mobile Backdrop for Sidebar */}
        {isMobile && !sidebarCollapsed && (
          <div
            onClick={() => setSidebarCollapsed(true)}
            style={{
              position: 'fixed', inset: 0, zIndex: 90,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
              animation: 'fadeIn 0.2s ease'
            }}
          />
        )}

        {/* Left sidebar container */}
        <div style={{
          position: isMobile ? 'fixed' : 'relative',
          top: 0, bottom: 0, left: 0, zIndex: 100, height: '100%',
          transform: isMobile && sidebarCollapsed ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex'
        }}>
          <Sidebar collapsed={isMobile ? false : sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />
        </div>

        {/* Main chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Top bar */}
          <div style={{
            height: '56px', flexShrink: 0,
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 12px' : '0 20px'
          }}>
            {/* Conversation title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isMobile && (
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', padding: '4px', cursor: 'pointer'
                  }}
                >
                  <Menu size={20} />
                </button>
              )}
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: isLoading ? 'var(--warning)' : 'var(--success)',
                boxShadow: `0 0 6px ${isLoading ? 'var(--warning)' : 'var(--success)'}`,
                transition: 'background 0.3s'
              }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: isMobile ? '120px' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeConversation?.title || '新对话'}
              </span>
              {isLoading && !isMobile && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  AI 正在思考…
                </span>
              )}
            </div>

            {/* Top bar buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setKeySettingsOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px', padding: isMobile ? '6px' : '6px 12px',
                  color: 'var(--text-secondary)',
                  fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
                }}
                title="设置专属 API Key"
              >
                <Key size={14} />
                {!isMobile && <span>API Key</span>}
              </button>
              <button
                onClick={() => setWordBookOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: wordBookOpen ? 'var(--accent)' : 'var(--bg-card)',
                  border: `1px solid ${wordBookOpen ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '8px', padding: isMobile ? '6px' : '6px 12px',
                  color: wordBookOpen ? 'white' : 'var(--text-secondary)',
                  fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
                }}
              >
                <BookOpen size={14} />
                {!isMobile && <span>单词本</span>}
              </button>
            </div>
          </div>

          <div style={{
            flex: 1, overflowY: 'auto', padding: '20px',
            display: 'flex', flexDirection: 'column', gap: '24px'
          }}>
            {interactions.length === 0 ? (
              <WelcomeScreen />
            ) : (
              interactions.map((interaction, idx) => (
                <TimelineCard
                  key={interaction.userMsg?.id || interaction.assistantMsg?.id || idx}
                  interaction={interaction}
                  isLoading={isLoading && (
                    !interaction.assistantMsg?.data && !interaction.assistantMsg?.error
                  )}
                  onReply={handleSendReply}
                  onRegenerate={handleRegenerate}
                  onRetryError={(interaction) => handleRegenerate(interaction.userMsg, interaction.assistantMsg?.id)}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>

        {/* Word Book panel */}
        <WordBook />

        {/* Global Selection Toolbar */}
        <SelectionToolbar />

        {/* API Key Settings Modal */}
        <ApiKeySettings
          open={keySettingsOpen}
          onClose={() => setKeySettingsOpen(false)}
        />
      </div>
    </div>
  );
}
