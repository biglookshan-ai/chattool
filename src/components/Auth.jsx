import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2 } from 'lucide-react';

export default function Auth({ onLogin }) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin,
                    }
                });
                if (error) throw error;
                setMessage({ text: '注册成功！请查收验证邮件 (如果有开启邮箱验证)，或直接登录。', type: 'success' });
                setIsSignUp(false);
            } else {
                const { data: signInData, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                if (signInData?.user) {
                    onLogin(signInData.user);
                }
            }
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            height: '100dvh', width: '100vw', background: 'var(--bg-primary)'
        }}>
            <div className="glass-card auth-card">
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '16px',
                        background: 'linear-gradient(135deg, var(--accent) 0%, #9b59b6 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 16px',
                        boxShadow: '0 8px 32px var(--accent-glow)'
                    }}>
                        FT
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                        影视翻译助手
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {isSignUp ? '创建一个新账号以开启云端同步' : '登录你的账号访问历史记录'}
                    </p>
                </div>

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>邮箱</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 14px', borderRadius: '8px',
                                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                color: 'var(--text-primary)', outline: 'none'
                            }}
                            placeholder="your@email.com"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>密码</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 14px', borderRadius: '8px',
                                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                color: 'var(--text-primary)', outline: 'none'
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    {message.text && (
                        <div style={{
                            padding: '12px', borderRadius: '8px', fontSize: '13px',
                            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                            color: message.type === 'error' ? '#ef4444' : '#22c55e',
                            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                        }}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            padding: '12px', width: '100%', borderRadius: '8px',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '8px'
                        }}
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {isSignUp ? '注册' : '登录'}
                    </button>

                    <button
                        type="button"
                        onClick={() => { setIsSignUp(!isSignUp); setMessage({ text: '', type: '' }); }}
                        style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)',
                            fontSize: '13px', cursor: 'pointer', outline: 'none'
                        }}
                    >
                        {isSignUp ? '已有账号？去登录' : '没有账号？去注册'}
                    </button>
                </form>
            </div>
        </div>
    );
}
