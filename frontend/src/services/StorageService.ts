import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    HAS_SEEN_ONBOARDING: 'has_seen_onboarding',
    APP_THEME: 'app_theme',
};

const memoryStore: Record<string, string> = {
    [KEYS.APP_THEME]: 'dark', // Default to dark
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
    async isFirstTimeUser(): Promise<boolean> {
        try {
            const value = await AsyncStorage.getItem(KEYS.HAS_SEEN_ONBOARDING);
            if (value !== null) return false;

            // Check memory fallback if AsyncStorage returned null
            return memoryStore[KEYS.HAS_SEEN_ONBOARDING] === undefined;
        } catch (error) {
            console.warn('AsyncStorage failure, using memory fallback:', error);
            return memoryStore[KEYS.HAS_SEEN_ONBOARDING] === undefined;
        }
    },

    async markOnboardingComplete(): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.HAS_SEEN_ONBOARDING, 'true');
        } catch (error) {
            console.warn('Failed to save to AsyncStorage, saving to memory:', error);
        }
        // Always update memory store as a reliable runtime fallback
        memoryStore[KEYS.HAS_SEEN_ONBOARDING] = 'true';
    },

    async clearOnboardingStatus(): Promise<void> {
        try {
            await AsyncStorage.removeItem(KEYS.HAS_SEEN_ONBOARDING);
        } catch (error) {
            console.error('Error clearing onboarding status:', error);
        }
        delete memoryStore[KEYS.HAS_SEEN_ONBOARDING];
    }
};


export default StorageService;
