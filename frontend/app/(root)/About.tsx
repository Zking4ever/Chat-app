import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const openDeveloperSite = () => {
    Linking.openURL('https://astawusamsalu.vercel.app').catch((err) =>
      console.error("Couldn't load page", err)
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('settings.about')}
        </Text>
      </View>

      <View style={styles.content}>
        <Ionicons name="heart" size={80} color={colors.tint} style={styles.icon} />

        <Text style={[styles.madeWithLove, { color: colors.text }]}>
          {t('settings.aboutContent.madeWithLove')}
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.surface }]} />

        <Text style={[styles.developer, { color: colors.textSecondary }]}>
          {t('settings.aboutContent.developer')}
        </Text>

        <TouchableOpacity onPress={openDeveloperSite} style={styles.linkContainer}>
          <Text style={[styles.link, { color: colors.tint }]}>
            astawusamsalu.vercel.app
          </Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textSecondary }]}>
          Version 1.0.0
        </Text>
      </View>
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
    borderBottomWidth: 0.5,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 100, // Offset for visual balance
  },
  icon: {
    marginBottom: 30,
  },
  madeWithLove: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 10,
    lineHeight: 32,
  },
  divider: {
    width: 60,
    height: 2,
    marginVertical: 20,
    borderRadius: 1,
  },
  developer: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 5,
  },
  linkContainer: {
    padding: 10,
  },
  link: {
    fontSize: 16,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  version: {
    fontSize: 14,
    marginTop: 40,
    opacity: 0.6,
  },
});
