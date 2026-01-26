import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    School, ArrowRight, Mail, LogIn,
    ShieldQuestion, Sun, Moon
} from 'lucide-react';
import collegeLogo from '../assets/iit-ropar-logo.png';

/* --- UI COMPONENTS --- */
const HomeCard = ({ children, className = "", onClick }) => (
    <div
        onClick={onClick}
        className={`
            bg-[rgb(var(--surface))] 
            border border-[rgb(var(--border))] 
            rounded-2xl p-8 shadow-xl 
            transition-all duration-300 
            ${onClick ? 'cursor-pointer hover:border-[rgb(var(--primary))]/50 hover:shadow-2xl hover:-translate-y-1' : ''}
            ${className}
        `}
    >
        {children}
    </div>
);

const ActionButton = ({ children, onClick, variant = 'primary' }) => {
    const variants = {
        primary: "bg-[rgb(var(--primary))] text-[rgb(var(--surface))] shadow-lg hover:brightness-110",
        outline: "bg-transparent border-2 border-[rgb(var(--border))] text-[rgb(var(--text))] hover:border-[rgb(var(--primary))] hover:text-[rgb(var(--primary))]"
    };

    return (
        <button
            onClick={onClick}
            className={`
                w-full py-3.5 px-6 rounded-xl font-bold text-sm 
                flex items-center justify-center gap-2 
                transition-all duration-200 active:scale-95
                ${variants[variant]}
            `}
        >
            {children}
        </button>
    );
};

export default function HomePage() {
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(false);

    // Initialize Theme from LocalStorage
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

    return (
        <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))] flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">

            {/* THEME TOGGLE (Top Right) */}
            <button
                onClick={toggleTheme}
                className="
                    absolute top-6 right-6 z-20
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

            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[rgb(var(--primary))]/5 blur-[120px]" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-[rgb(var(--accent))]/5 blur-[100px]" />
            </div>

            <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center relative z-10">

                {/* LEFT: Branding Section */}
                <div className="space-y-8 text-center md:text-left animate-fade-in-up">
                    <div className="inline-flex p-2 rounded-3xl bg-white border border-[rgb(var(--border))] shadow-sm mb-4">
                        <img
                            src={collegeLogo}
                            alt="IIT Ropar Logo"
                            className="h-36 w-auto object-contain" // Adjust h-16 (height) as needed
                        />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[rgb(var(--text))] leading-[1.1]">
                            Academic <br />
                            <span className="text-[rgb(var(--primary))]">Portal</span>
                        </h1>
                        <p className="text-lg text-[rgb(var(--muted))] max-w-md mx-auto md:mx-0 leading-relaxed">
                            Welcome to the official academic management system of <strong>Indian Institute of Technology Ropar</strong>.
                        </p>
                    </div>
                </div>

                {/* RIGHT: Action Cards */}
                <div className="space-y-6 w-full max-w-md mx-auto animate-in slide-in-from-right-8 duration-500 delay-100">

                    {/* Card 1: Login */}
                    <HomeCard className="relative overflow-hidden group">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-[rgb(var(--text))]">
                            <LogIn size={20} className="text-[rgb(var(--primary))]" /> Existing User?
                        </h3>
                        <p className="text-sm text-[rgb(var(--muted))] mb-6">
                            Students and Faculty with active credentials can access the dashboard here.
                        </p>
                        <ActionButton onClick={() => navigate('/login')}>
                            Login to Portal <ArrowRight size={18} />
                        </ActionButton>
                    </HomeCard>

                    {/* Card 2: No Account */}
                    <HomeCard className="bg-[rgb(var(--bg))] border-dashed border-2 shadow-none">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] text-[rgb(var(--muted))]">
                                <ShieldQuestion size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-[rgb(var(--text))] mb-1">No Account?</h3>
                                <p className="text-xs text-[rgb(var(--muted))] mb-4 leading-relaxed">
                                    Access is restricted. If you are a new student or faculty, contact IT support.
                                </p>
                                <a
                                    href="mailto:2023csb1160@iitrpr.ac.in?subject=Account%20Request"
                                    className="flex items-center gap-2 text-xs font-bold text-[rgb(var(--primary))] hover:underline"
                                >
                                    <Mail size={14} /> support@iitrpr.ac.in
                                </a>
                            </div>
                        </div>
                    </HomeCard>

                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 text-center w-full text-[10px] text-[rgb(var(--muted))] uppercase tracking-widest opacity-50">
                © 2026 IIT Ropar • Academic Section
            </div>
        </div>
    );
}
