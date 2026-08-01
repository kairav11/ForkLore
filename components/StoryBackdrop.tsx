import type { ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';

import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { palette } from '@/lib/theme';

interface StoryBackdropProps {
  imageUrl: string | null;
  children?: ReactNode;
}

/**
 * The setting's background image fills the screen and stays fixed for the whole
 * story, with a gradient scrim so story text stays readable on top of it.
 */
export function StoryBackdrop({ imageUrl, children }: StoryBackdropProps) {
  const { width, height } = useWindowDimensions();

  return (
    <View className="bg-background flex-1">
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ position: 'absolute', left: 0, top: 0, width, height }}
          contentFit="cover"
          transition={600}
          cachePolicy="memory-disk"
          accessibilityIgnoresInvertColors
        />
      ) : null}
      <LinearGradient
        colors={[palette.scrim, palette.scrimSoft, palette.scrim, palette.background]}
        locations={[0, 0.32, 0.7, 1]}
        style={{ position: 'absolute', left: 0, top: 0, width, height }}
      />
      {children}
    </View>
  );
}
