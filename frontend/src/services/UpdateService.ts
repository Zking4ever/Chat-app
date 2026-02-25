import * as Updates from 'expo-updates';
import { Alert, AppState } from 'react-native';

class UpdateService {
    private static instance: UpdateService;
    private isChecking = false;

    private constructor() {
        // Listen for app state changes to check for updates when returning to foreground
        AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                this.checkAndApplyUpdateSilently();
            }
        });
    }

    public static getInstance(): UpdateService {
        if (!UpdateService.instance) {
            UpdateService.instance = new UpdateService();
        }
        return UpdateService.instance;
    }

    /**
     * Periodically check for updates.
     * In production, this should be called on app start and resume.
     */
    public async checkAndApplyUpdateSilently() {
        if (this.isChecking || __DEV__) return;
        this.isChecking = true;

        try {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
                console.log('Update available! Downloading...');

                await Updates.fetchUpdateAsync();

                // Once downloaded, we can decide when to apply it.
                // For a "seamless" feel, we might wait for the user to be idle,
                // or just notify them that the app will update on next restart.

                Alert.alert(
                    'Update Available',
                    'A new version of the app has been downloaded and is ready to use.',
                    [
                        {
                            text: 'Restart Now',
                            onPress: () => Updates.reloadAsync()
                        },
                        {
                            text: 'Later',
                            style: 'cancel'
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Update check failed:', error);
            // expo-updates handles rollback automatically if a new bundle fails to boot
        } finally {
            this.isChecking = false;
        }
    }

    /**
     * Force a check and download (e.g. from a "Check for Updates" button in Settings)
     */
    public async forceUpdateCheck() {
        try {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
            } else {
                Alert.alert('Up to Date', 'You are already running the latest version.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to check for updates.');
        }
    }
}

export default UpdateService.getInstance();
