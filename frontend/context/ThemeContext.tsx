import React, { createContext, useContext, useEffect, useState } from 'react';
import { Colors } from '../constants/Colors';
import StorageService from '../src/services/StorageService';

type Theme = 'light' | 'dark' | 'telegram' | 'romantic' | 'darkBlue';

interface ThemeContextType {
    theme: Theme;
    colors: typeof Colors.light;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark');

    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await StorageService.getTheme();
            if (savedTheme) setThemeState(savedTheme as Theme);
        };
        loadTheme();
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setThemeState(newTheme);
        StorageService.setTheme(newTheme);
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        StorageService.setTheme(newTheme);
    };

    const colors = Colors[theme] || Colors.dark;
    const availableThemes: Theme[] = ['light', 'dark', 'telegram', 'romantic', 'darkBlue'];

    return (
        <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme, availableThemes }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
