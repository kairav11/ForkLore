import { useEffect } from 'react';
import { View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Text } from 'heroui-native';

import { Display } from '@/components/ui/Display';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { Circle, Svg } from '@/components/ui/primitives/Svg';
import { palette } from '@/lib/theme';

interface MatchRingProps {
  /** 0 - 100 */
  score: number;
}

const SIZE = 224;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Big amber dial for the match score. */
export function MatchRing({ score }: MatchRingProps) {
  const appear = useSharedValue(0);

  useEffect(() => {
    appear.set(withTiming(1, { duration: 520 }));
  }, [appear]);

  const style = useAnimatedStyle(() => ({
    opacity: appear.get(),
    transform: [{ scale: 0.92 + appear.get() * 0.08 }],
  }));

  return (
    <AnimatedView style={style} className="items-center justify-center">
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={palette.border}
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={palette.accent}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={CIRCUMFERENCE * (1 - Math.max(0, Math.min(100, score)) / 100)}
          fill="none"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>

      <View className="absolute items-center">
        <Display className="text-accent text-6xl leading-[64px]">{`${score}%`}</Display>
        <Text className="text-muted mt-1 text-xs font-semibold tracking-[3px] uppercase">
          Match
        </Text>
      </View>
    </AnimatedView>
  );
}
