import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserInter } from '@/constants/types';

const KEYS = {
    LOGGED_USER: 'logged_user',
    APP_THEME: 'app_theme',
    RECENT_CONTACTS: 'recent_contacts',
};

const MAX_RECENT = 10;

const memoryStore: Record<string, string> = {
    [KEYS.APP_THEME]: 'dark',
};

export const StorageService = {
    async getTheme(): Promise<string> {
        try {
            const value = await AsyncStorage.getItem(KEYS.APP_THEME);
            return value || memoryStore[KEYS.APP_THEME] || 'dark';
        } catch {
            return memoryStore[KEYS.APP_THEME] || 'dark';
        }
    },

    async setTheme(theme: string): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.APP_THEME, theme);
        } catch {
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

    // ── Recent Contacts ────────────────────────────────────────────────────────

    async getRecentContacts(): Promise<UserInter[]> {
        try {
            const json = await AsyncStorage.getItem(KEYS.RECENT_CONTACTS);
            if (!json) return [];
            return JSON.parse(json) as UserInter[];
        } catch {
            return [];
        }
    },

    async addRecentContact(user: UserInter): Promise<void> {
        try {
            const current = await StorageService.getRecentContacts();
            const filtered = current.filter((u: UserInter) => u.id !== user.id);
            const updated = [user, ...filtered].slice(0, MAX_RECENT);
            await AsyncStorage.setItem(KEYS.RECENT_CONTACTS, JSON.stringify(updated));
        } catch (error) {
            console.warn('Failed to add recent contact:', error);
        }
    },

    async removeRecentContact(userId: number): Promise<void> {
        try {
            const current = await StorageService.getRecentContacts();
            const updated = current.filter((u: UserInter) => u.id !== userId);
            await AsyncStorage.setItem(KEYS.RECENT_CONTACTS, JSON.stringify(updated));
        } catch (error) {
            console.warn('Failed to remove recent contact:', error);
        }
    },
};

export default StorageService;
