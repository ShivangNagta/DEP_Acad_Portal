import { useState, useEffect } from 'react';
import {
    Mail,
    KeyRound,
    Loader2,
    ArrowRight,
    Sun,
    Moon,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

import { API_BASE_URL } from '../config/api';

export default function OTPLogin() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [step, setStep] = useState('email');
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDark(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    const sendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setStep('otp');
            setMessage({ type: 'success', text: 'OTP sent to your email inbox.' });
        } catch (e) {
            setMessage({ type: 'error', text: e.message || 'Failed to send OTP' });
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token: otp })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            localStorage.setItem('access_token', data.user.accessToken);
            localStorage.setItem('refresh_token', data.user.refreshToken);

            window.location.href = '/dashboard';
        } catch (e) {
            setMessage({ type: 'error', text: e.message || 'Invalid or expired OTP' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))] text-[rgb(var(--text))] p-4 relative transition-colors duration-300">

            {/* THEME TOGGLE */}
            <button
                onClick={toggleTheme}
                className="
                    absolute top-6 right-6 
                    p-3 rounded-full 
                    bg-[rgb(var(--surface))] 
                    border border-[rgb(var(--border))] 
                    text-[rgb(var(--muted))] 
                    hover:text-[rgb(var(--primary))] hover:border-[rgb(var(--primary))]/50
                    shadow-sm hover:shadow-md 
                    transition-all duration-300 cursor-pointer active:scale-95
                "
                title="Toggle Theme"
            >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* LOGIN CARD */}
            <div className="w-full max-w-md bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl p-8 shadow-xl animate-fade-in-up">

                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-[rgb(var(--primary))]/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-[rgb(var(--primary))]">
                        <KeyRound size={24} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Academic Portal</h1>
                    <p className="text-[rgb(var(--muted))] text-sm font-medium">
                        {step === 'email'
                            ? 'Secure login for Students & Faculty'
                            : `Enter the code sent to ${email}`
                        }
                    </p>
                </div>

                {/* Forms */}
                {step === 'email' ? (
                    <form onSubmit={sendOTP} className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                        <InputField
                            icon={Mail}
                            type="email"
                            label="Institutional Email"
                            placeholder="you@iitrpr.ac.in"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoFocus
                        />
                        <SubmitButton loading={loading}>
                            Send Login Code <ArrowRight size={18} />
                        </SubmitButton>
                    </form>
                ) : (
                    <form onSubmit={verifyOTP} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2">
                            <InputField
                                icon={KeyRound}
                                type="text"
                                label="One-Time Password"
                                placeholder="e.g. 123456"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                maxLength={6}
                                autoFocus
                                className="tracking-widest font-mono text-center text-lg"
                            />
                            <button
                                type="button"
                                onClick={() => setStep('email')}
                                className="text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--primary))] hover:underline cursor-pointer"
                            >
                                Wrong email? Go back
                            </button>
                        </div>
                        <SubmitButton loading={loading}>
                            Verify & Enter
                        </SubmitButton>
                    </form>
                )}

                {/* Status Message */}
                {message.text && (
                    <div className={`
                        mt-6 p-3 rounded-lg border flex items-center gap-3 text-sm font-semibold animate-in fade-in slide-in-from-top-2
                        ${message.type === 'error'
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : 'bg-[rgb(var(--primary-soft))]/20 text-[rgb(var(--primary))] border-[rgb(var(--primary-soft))]'
                        }
                    `}>
                        {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                        {message.text}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 text-xs text-[rgb(var(--muted))] opacity-60 font-mono">
                © 2026 Institute of Technology Ropar • Secure Access
            </div>
        </div>
    );
}


const InputField = ({ icon: Icon, label, className = "", ...props }) => (
    <div className="space-y-1.5 text-left">
        <label className="text-xs font-bold text-[rgb(var(--muted))] uppercase tracking-wider ml-1">
            {label}
        </label>
        <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))] group-focus-within:text-[rgb(var(--primary))] transition-colors">
                <Icon size={18} />
            </div>
            <input
                {...props}
                required
                className={`
                    w-full pl-10 pr-4 py-3 rounded-xl
                    bg-[rgb(var(--bg))] 
                    border-2 border-[rgb(var(--border))] 
                    text-[rgb(var(--text))] font-medium
                    placeholder:text-[rgb(var(--muted))]/50
                    outline-none 
                    focus:border-[rgb(var(--primary))] 
                    focus:ring-4 focus:ring-[rgb(var(--primary))]/10 
                    transition-all duration-200
                    ${className}
                `}
            />
        </div>
    </div>
);

const SubmitButton = ({ children, loading }) => (
    <button
        disabled={loading}
        className="
            cursor-pointer
            w-full py-3 px-4 rounded-xl 
            bg-[rgb(var(--primary))] 
            text-[rgb(var(--surface))] 
            font-bold text-base
            shadow-md hover:shadow-lg hover:brightness-110 
            active:scale-[0.98] 
            disabled:opacity-70 disabled:cursor-not-allowed
            transition-all duration-200
            flex items-center justify-center gap-2
        "
    >
        {loading ? (
            <>
                <Loader2 size={20} className="animate-spin" />
                <span>Processing...</span>
            </>
        ) : children}
    </button>
);
