import { useEffect } from 'react';
import { View } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Button, Text } from 'heroui-native';
import { BookOpen, Check, TriangleAlert } from 'lucide-react-native';

import { GlowBackground } from '@/components/GlowBackground';
import { Display } from '@/components/ui/Display';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { palette } from '@/lib/theme';

export interface LoadingStep {
  label: string;
  state: 'done' | 'active' | 'todo';
}

interface LoadingStateProps {
  title: string;
  detail?: string;
  steps?: LoadingStep[];
}

function PulseRing() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.set(
      withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }), -1, false),
    );
  }, [pulse]);

  const outer = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - pulse.get()),
    transform: [{ scale: 0.75 + pulse.get() * 0.85 }],
  }));

  const inner = useAnimatedStyle(() => ({
    opacity: 0.75 * (1 - Math.abs(pulse.get() - 0.5) * 1.4),
    transform: [{ scale: 0.9 + pulse.get() * 0.35 }],
  }));

  return (
    <View className="h-32 w-32 items-center justify-center">
      <AnimatedView
        pointerEvents="none"
        className="border-accent absolute h-32 w-32 rounded-full border"
        style={outer}
      />
      <AnimatedView
        pointerEvents="none"
        className="border-accent/60 absolute h-24 w-24 rounded-full border"
        style={inner}
      />
      <View
        className="border-accent/30 h-16 w-16 items-center justify-center rounded-full border"
        style={{ backgroundColor: palette.accentSoft }}
      >
        <BookOpen size={26} color={palette.accent} />
      </View>
    </View>
  );
}

export function LoadingState({ title, detail, steps }: LoadingStateProps) {
  return (
    <GlowBackground>
      <View className="flex-1 items-center justify-center gap-7 px-8">
        <PulseRing />

        <View className="items-center gap-3">
          <Display className="text-center text-3xl leading-9">{title}</Display>
          {detail ? (
            <Text className="text-muted text-center text-base leading-6">{detail}</Text>
          ) : null}
        </View>

        {steps && steps.length > 0 ? (
          <View className="border-border/60 w-full gap-3 rounded-3xl border p-5">
            {steps.map((step) => (
              <View key={step.label} className="flex-row items-center gap-3">
                <View
                  className={
                    step.state === 'todo'
                      ? 'border-border h-6 w-6 items-center justify-center rounded-full border'
                      : 'border-accent/50 h-6 w-6 items-center justify-center rounded-full border'
                  }
                  style={{
                    backgroundColor:
                      step.state === 'todo' ? palette.transparent : palette.accentSoft,
                  }}
                >
                  {step.state === 'done' ? <Check size={13} color={palette.accent} /> : null}
                  {step.state === 'active' ? (
                    <View className="bg-accent h-2 w-2 rounded-full" />
                  ) : null}
                </View>
                <Text
                  className={
                    step.state === 'todo'
                      ? 'text-muted flex-1 text-base'
                      : 'text-foreground flex-1 text-base font-medium'
                  }
                >
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </GlowBackground>
  );
}

interface ErrorStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function ErrorState({
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: ErrorStateProps) {
  return (
    <GlowBackground>
      <View className="pb-safe-offset-6 flex-1 justify-center gap-6 px-7">
        <View
          className="border-border/70 h-14 w-14 items-center justify-center rounded-2xl border"
          style={{ backgroundColor: palette.emberSoft }}
        >
          <TriangleAlert size={24} color={palette.ember} />
        </View>

        <View className="gap-3">
          <Display className="text-3xl leading-10">{title}</Display>
          <Text className="text-muted text-base leading-7">{message}</Text>
        </View>

        <View className="gap-3">
          {actionLabel && onAction ? (
            <Button size="lg" onPress={onAction}>
              <Button.Label className="text-base">{actionLabel}</Button.Label>
            </Button>
          ) : null}
          {secondaryLabel && onSecondary ? (
            <Button size="lg" variant="tertiary" onPress={onSecondary}>
              <Button.Label className="text-base">{secondaryLabel}</Button.Label>
            </Button>
          ) : null}
        </View>
      </View>
    </GlowBackground>
  );
}
