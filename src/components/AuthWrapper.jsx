import { useEffect, useState } from 'react'
import App from '../App.jsx'
import Auth from './Auth.jsx'
import { AppProvider } from '../context/AppContext.jsx'
import { supabase } from '../services/supabaseClient'

export default function AuthWrapper() {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setLoading(false)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    if (loading) {
        return (
            <div style={{
                display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg-primary)',
                alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
            }}>
                加载会话中...
            </div>
        )
    }

    if (!session) {
        return <Auth onLogin={() => { }} />
    }

    return (
        <AppProvider user={session.user}>
            <App />
        </AppProvider>
    )
}
