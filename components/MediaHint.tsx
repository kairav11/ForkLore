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
import { Brush, Mic, PenLine } from 'lucide-react-native';

import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { palette } from '@/lib/theme';

interface MediaHintProps {
  kind: 'art' | 'voice' | 'writing';
}

const COPY: Record<MediaHintProps['kind'], string> = {
  art: 'Painting this scene…',
  voice: 'Recording the narration…',
  writing: 'Writing what happens next…',
};

/** Quiet pulsing note while a scene's art, narration or continuation is being made. */
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
        ) : kind === 'voice' ? (
          <Mic size={14} color={palette.accent} />
        ) : (
          <PenLine size={14} color={palette.accent} />
        )}
      </View>
      <Text className="text-muted text-sm">{COPY[kind]}</Text>
    </AnimatedView>
  );
}
