import { useEffect } from 'react';
import { View } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Text } from 'heroui-native';
import { Brush, Mic } from 'lucide-react-native';

import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { palette } from '@/lib/theme';

interface MediaHintProps {
  kind: 'art' | 'voice';
}

/** Quiet pulsing note while a scene's art or narration is still being made. */
export function MediaHint({ kind }: MediaHintProps) {
  const pulse = useSharedValue(0.45);

  useEffect(() => {
    pulse.set(
      withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  }, [pulse]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.get() }));

  return (
    <AnimatedView style={style} className="flex-row items-center gap-2 self-start">
      <View
        className="h-7 w-7 items-center justify-center rounded-full"
        style={{ backgroundColor: palette.accentSoft }}
      >
        {kind === 'art' ? (
          <Brush size={14} color={palette.accent} />
        ) : (
          <Mic size={14} color={palette.accent} />
        )}
      </View>
      <Text className="text-muted text-sm">
        {kind === 'art' ? 'Painting this scene…' : 'Recording the narration…'}
      </Text>
    </AnimatedView>
  );
}
