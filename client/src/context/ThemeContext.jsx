import React, { createContext, useState, useContext, useEffect } from 'react';
import { themes } from '../styles/theme';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};


export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark' ? 'dark' : 'light';
    });

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const value = {
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        colors: themes[theme].colors,
        themeName: themes[theme].name
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
