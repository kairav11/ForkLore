import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Body, Mono } from '@/components/ui/Text';
import { palette } from '@/lib/theme';

/**
 * Install affordance for the PWA, web only:
 * - Android/Chrome: captures `beforeinstallprompt` and shows an "Install" button
 *   that triggers the native install prompt.
 * - iOS/Safari: no programmatic prompt exists, so shows a one-time
 *   "Share → Add to Home Screen" hint (dismissal persisted).
 *
 * Hidden when already installed (standalone display mode) and inside iframes
 * (the Bilt live preview embeds the app in one).
 */

// Chrome's install event — not yet in lib.dom.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const IOS_HINT_DISMISSED_KEY = 'pwa-ios-install-hint-dismissed';

function isEligibleBrowserContext(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  // Already installed / running standalone (navigator.standalone is iOS-only).
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    Reflect.get(navigator, 'standalone') === true;
  if (standalone) return false;
  // Embedded (e.g. the Bilt live preview iframe) — installing isn't possible there.
  if (window.self !== window.top) return false;
  return true;
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ masquerades as macOS but is touch-capable.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return isIos && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

const TAB_BAR_HEIGHT = 49;

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const insets = useSafeAreaInsets();
  const bottom = insets.bottom + TAB_BAR_HEIGHT + 12;

  useEffect(() => {
    if (!isEligibleBrowserContext()) return undefined;

    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const handleAppInstalled = () => {
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!isEligibleBrowserContext() || !isIosSafari()) return;

    void (async () => {
      try {
        const dismissed = await AsyncStorage.getItem(IOS_HINT_DISMISSED_KEY);
        if (!dismissed) {
          setShowIosHint(true);
        }
      } catch (_error) {
        // no-op on storage errors
      }
    })();
  }, []);

  const handleInstall = useCallback(() => {
    if (!installEvent) return;
    void (async () => {
      await installEvent.prompt();
      await installEvent.userChoice;
      // The captured event is single-use regardless of the user's choice.
      setInstallEvent(null);
    })();
  }, [installEvent]);

  const dismissIosHint = useCallback(() => {
    setShowIosHint(false);
    AsyncStorage.setItem(IOS_HINT_DISMISSED_KEY, 'true').catch(() => {});
  }, []);

  if (Platform.OS !== 'web') return null;

  if (installEvent) {
    return (
      <View
        style={{
          bottom,
          backgroundColor: palette.surface,
          borderWidth: 1,
          borderColor: palette.border,
        }}
        className="absolute right-4 left-4 z-50 flex-row items-center gap-3 rounded-2xl p-4"
      >
        <View className="flex-1 gap-1">
          <Body weight="semibold" className="text-[14px]">
            Add to home screen
          </Body>
          <Body className="text-muted text-[12px] leading-4">
            Install this app for a full-screen experience
          </Body>
        </View>
        <Pressable
          accessibilityRole="button"
          className="rounded-full px-3 py-2"
          onPress={() => setInstallEvent(null)}
        >
          <Mono className="text-[10px] tracking-[1px] uppercase">Not now</Mono>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="rounded-full px-3.5 py-2.5"
          style={{ backgroundColor: palette.accent }}
          onPress={handleInstall}
        >
          <Mono
            weight="bold"
            className="text-[10px] tracking-[1px] uppercase"
            color={palette.background}
          >
            Install
          </Mono>
        </Pressable>
      </View>
    );
  }

  if (showIosHint) {
    return (
      <View
        style={{
          bottom,
          backgroundColor: palette.surface,
          borderWidth: 1,
          borderColor: palette.border,
        }}
        className="absolute right-4 left-4 z-50 flex-row items-center gap-3 rounded-2xl p-4"
      >
        <View className="flex-1 gap-1">
          <Body weight="semibold" className="text-[14px]">
            Add to home screen
          </Body>
          <Body className="text-muted text-[12px] leading-4">
            Tap Share, then “Add to Home Screen” to install this app
          </Body>
        </View>
        <Pressable
          accessibilityRole="button"
          className="rounded-full px-3 py-2"
          onPress={dismissIosHint}
        >
          <Mono className="text-[10px] tracking-[1px] uppercase">Got it</Mono>
        </Pressable>
      </View>
    );
  }

  return null;
}
