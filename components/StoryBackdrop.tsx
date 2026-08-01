import type { ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
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
 * story, with per-scene artwork crossfading over it via `underlay`. A top scrim
 * keeps the controls legible, and a deep bottom gradient lets story text sit
 * straight on the artwork without a boxed-in card.
 */
export function StoryBackdrop({
  imageUrl,
  overlay = 'reading',
  underlay,
  children,
}: StoryBackdropProps) {
  const { width, height } = useWindowDimensions();
  const fill = { position: 'absolute', left: 0, top: 0, width, height } as const;

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

      {/* Top scrim for the floating controls. */}
      <LinearGradient
        pointerEvents="none"
        colors={[palette.scrim, palette.transparent]}
        locations={[0, 1]}
        style={{ position: 'absolute', left: 0, top: 0, width, height: height * 0.28 }}
      />

      {/* Reading gradient: art stays visible up top, text sits on near-black. */}
      <LinearGradient
        pointerEvents="none"
        colors={
          overlay === 'strong'
            ? [palette.scrim, palette.scrimStrong, palette.backgroundDeep]
            : [palette.transparent, palette.scrim, palette.scrimStrong]
        }
        locations={overlay === 'strong' ? [0, 0.45, 1] : [0.28, 0.6, 0.92]}
        style={{ ...fill }}
      />

      {children}
    </View>
  );
}
