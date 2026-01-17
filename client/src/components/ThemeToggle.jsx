import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';

export const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(
        document.documentElement.classList.contains('dark')
    );

    const toggle = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggle}
            className="p-2 rounded-lg border border-border bg-surface hover:bg-primarySoft transition"
            aria-label="Toggle theme"
        >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
};
