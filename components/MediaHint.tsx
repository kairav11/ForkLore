import { useEffect } from 'react';
import { View } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { palette } from '@/lib/theme';
import { Mono } from '@/components/ui/Text';

interface MediaHintProps {
  kind: 'art' | 'voice' | 'writing';
}

const COPY: Record<MediaHintProps['kind'], string> = {
  art: 'Painting this scene',
  voice: 'Recording narration',
  writing: 'Writing what happens next',
};

/** Quiet pulsing note while a scene's art, narration or continuation is being made. */
export function MediaHint({ kind }: MediaHintProps) {
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.set(
      withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  }, [pulse]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.get() }));

  return (
    <AnimatedView style={style} className="flex-row items-center gap-2 self-start">
      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: palette.accent }} />
      <Mono className="text-[10px] tracking-[2px] uppercase">{COPY[kind]}</Mono>
    </AnimatedView>
  );
}
