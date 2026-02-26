import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Switch,
    Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Settings() {
    const { t, i18n } = useTranslation();
    const { theme, colors, toggleTheme } = useTheme();
    const { logout } = useAuth();
    const router = useRouter();

    const currentLanguage = i18n.language;

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const isDarkMode = theme === 'dark';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.headerText} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.headerText }]}>{t('settings.title')}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.tint }]}>{t('settings.theme')}</Text>
                    <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
                        <View style={styles.settingInfo}>
                            <Ionicons name={isDarkMode ? "moon" : "sunny"} size={22} color={colors.tint} />
                            <Text style={[styles.settingLabel, { color: colors.text }]}>
                                {isDarkMode ? t('settings.dark') : t('settings.light')}
                            </Text>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#767577', true: colors.tint }}
                            thumbColor={Platform.OS === 'ios' ? '#fff' : isDarkMode ? colors.tint : '#f4f3f4'}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.tint }]}>{t('settings.language')}</Text>
                    <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
                        <TouchableOpacity
                            style={[styles.langOption, currentLanguage === 'en' && styles.activeLangOption]}
                            onPress={() => changeLanguage('en')}
                        >
                            <Text style={[styles.langText, { color: currentLanguage === 'en' ? colors.tint : colors.text }]}>EN</Text>
                            {currentLanguage === 'en' && <Ionicons name="checkmark" size={18} color={colors.tint} />}
                        </TouchableOpacity>
                        <View style={styles.separator} />
                        <TouchableOpacity
                            style={[styles.langOption, currentLanguage === 'am' && styles.activeLangOption]}
                            onPress={() => changeLanguage('am')}
                        >
                            <Text style={[styles.langText, { color: currentLanguage === 'am' ? colors.tint : colors.text }]}>አማ</Text>
                            {currentLanguage === 'am' && <Ionicons name="checkmark" size={18} color={colors.tint} />}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <TouchableOpacity
                        style={[styles.settingRow, { backgroundColor: colors.surface }]}
                        onPress={() => router.push('/(root)/About')}
                    >
                        <View style={styles.settingInfo}>
                            <Ionicons name="information-circle-outline" size={22} color={colors.tint} />
                            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.about')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.logoutButton, { borderColor: colors.tint }]}
                    onPress={logout}
                >
                    <Ionicons name="log-out-outline" size={20} color={colors.tint} />
                    <Text style={[styles.logoutText, { color: colors.tint }]}>{t('settings.logout')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    backButton: {
        marginRight: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        marginLeft: 5,
        textTransform: 'uppercase',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderRadius: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: 16,
        marginLeft: 12,
        fontWeight: '500',
    },
    langOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    activeLangOption: {
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    langText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
    separator: {
        width: 1,
        height: '60%',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    }
});
