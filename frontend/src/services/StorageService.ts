import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserInter } from '@/constants/types';

const KEYS = {
    LOGGED_USER: 'logged_user',
    APP_THEME: 'app_theme',
};

const memoryStore: Record<string, string> = {
    [KEYS.APP_THEME]: 'dark',
};

export const StorageService = {
    async getTheme(): Promise<'light' | 'dark'> {
        try {
            const value = await AsyncStorage.getItem(KEYS.APP_THEME);
            if (value === 'light' || value === 'dark') return value;
            return (memoryStore[KEYS.APP_THEME] as any) || 'dark';
        } catch (error) {
            return (memoryStore[KEYS.APP_THEME] as any) || 'dark';
        }
    },

    async setTheme(theme: 'light' | 'dark'): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.APP_THEME, theme);
        } catch (error) {
            console.warn('Failed to save theme to AsyncStorage');
        }
        memoryStore[KEYS.APP_THEME] = theme;
    },

    async saveUser(user: UserInter): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.LOGGED_USER, JSON.stringify(user));
        } catch (error) {
            console.warn('Failed to save user to AsyncStorage:', error);
        }
    },

    async getUser(): Promise<UserInter | null> {
        try {
            const json = await AsyncStorage.getItem(KEYS.LOGGED_USER);
            if (!json) return null;
            return JSON.parse(json) as UserInter;
        } catch (error) {
            console.warn('Failed to read user from AsyncStorage:', error);
            return null;
        }
    },

    async clearUser(): Promise<void> {
        try {
            await AsyncStorage.removeItem(KEYS.LOGGED_USER);
        } catch (error) {
            console.error('Failed to clear user from AsyncStorage:', error);
        }
    },
};

export default StorageService;
