import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';

import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { palette } from '@/lib/theme';

interface StoryBackdropProps {
  imageUrl: string | null;
  /** `strong` darkens the scene further for text-heavy screens. */
  overlay?: 'reading' | 'strong';
  /** Scene artwork drawn over the base image but under the reading gradients. */
  underlay?: ReactNode;
  children?: ReactNode;
}

/**
 * The setting's background image fills the screen and stays fixed for the whole
 * story, with per-scene artwork crossfading over it via `underlay`.
 *
 * Three layers keep text legible over every generated image, bright or dark: a
 * flat charcoal veil across the whole frame, a scrim under the top controls, and
 * a deeper gradient toward the bottom where the story panel and choices sit.
 */
export function StoryBackdrop({
  imageUrl,
  overlay = 'reading',
  underlay,
  children,
}: StoryBackdropProps) {
  const { width, height } = useWindowDimensions();
  const fill = { position: 'absolute', left: 0, top: 0, width, height } as const;
  const isStrong = overlay === 'strong';

  return (
    <View className="bg-background flex-1">
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ ...fill }}
          contentFit="cover"
          transition={700}
          cachePolicy="memory-disk"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <LinearGradient
          colors={[palette.surface, palette.background, palette.backgroundDeep]}
          style={{ ...fill }}
        />
      )}

      {underlay}

      {/* Flat veil: bright artwork (strobes, neon) never washes out the type. */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: isStrong ? 'rgba(20, 21, 26, 0.62)' : 'rgba(20, 21, 26, 0.42)' },
        ]}
      />

      {/* Scrim under the floating controls. */}
      <LinearGradient
        pointerEvents="none"
        colors={[palette.scrim, palette.transparent]}
        locations={[0, 1]}
        style={{ position: 'absolute', left: 0, top: 0, width, height: height * 0.26 }}
      />

      {/* Bottom weight: the story panel and the choice pills sit on near-black. */}
      <LinearGradient
        pointerEvents="none"
        colors={
          isStrong
            ? [palette.transparent, palette.scrim, palette.scrimStrong]
            : [palette.transparent, palette.scrimSoft, palette.scrim]
        }
        locations={isStrong ? [0.2, 0.55, 1] : [0.3, 0.62, 1]}
        style={{ ...fill }}
      />

      {children}
    </View>
  );
}
