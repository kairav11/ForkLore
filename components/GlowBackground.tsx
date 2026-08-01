import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { palette } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface GlowBackgroundProps {
  children: ReactNode;
  className?: string;
}

/**
 * Shared backdrop for the non-story screens: near-black with two soft light
 * pools (amber, ember) bleeding in from the edges.
 */
export function GlowBackground({ children, className }: GlowBackgroundProps) {
  return (
    <View className={cn('bg-background flex-1', className)}>
      <View
        pointerEvents="none"
        className="absolute -top-28 -left-20 h-80 w-80 rounded-full"
        style={{ backgroundColor: palette.accentSoft }}
      />
      <View
        pointerEvents="none"
        className="absolute top-1/3 -right-24 h-72 w-72 rounded-full"
        style={{ backgroundColor: palette.emberSoft }}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[palette.transparent, palette.background]}
        locations={[0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}
