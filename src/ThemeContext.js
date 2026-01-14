import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes } from './themes';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState('dark');

    useEffect(() => {
        const savedTheme = localStorage.getItem('steam-absa-theme');
        if (savedTheme && themes[savedTheme]) {
            setCurrentTheme(savedTheme);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setCurrentTheme(newTheme);
        localStorage.setItem('steam-absa-theme', newTheme);
    };

    const theme = themes[currentTheme];

    return (
        <ThemeContext.Provider value={{ theme, currentTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
