import { useEffect } from 'react';
import { View } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { TriangleAlert } from 'lucide-react-native';

import { GlowBackground } from '@/components/GlowBackground';
import { PathLine } from '@/components/PathLine';
import { Display } from '@/components/ui/Display';
import { ActionButton } from '@/components/ui/ActionButton';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { Body, Mono } from '@/components/ui/Text';
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

/** Slow amber breath on the step currently running — the only motion here. */
function ActiveDot() {
  const pulse = useSharedValue(0.35);

  useEffect(() => {
    pulse.set(
      withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  }, [pulse]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.get() }));

  return (
    <AnimatedView
      style={[style, { backgroundColor: palette.accent }]}
      className="h-2.5 w-2.5 rounded-full"
    />
  );
}

export function LoadingState({ title, detail, steps }: LoadingStateProps) {
  const total = steps?.length ?? 0;
  const doneCount = steps?.filter((step) => step.state === 'done').length ?? 0;

  return (
    <GlowBackground>
      <View className="px-safe-offset-6 flex-1 justify-center gap-8">
        {total > 0 ? (
          <View className="gap-4">
            <Mono className="text-[11px] tracking-[3px] uppercase">
              {`Step ${Math.min(doneCount + 1, total)} of ${total}`}
            </Mono>
            <PathLine total={total} choices={Array.from({ length: doneCount }, () => 0)} />
          </View>
        ) : null}

        <View className="gap-3">
          <Display className="text-[32px] leading-[38px]">{title}</Display>
          {detail ? <Body className="text-muted text-[15px] leading-6">{detail}</Body> : null}
        </View>

        {steps && steps.length > 0 ? (
          <View
            className="gap-4 rounded-3xl p-5"
            style={{
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.border,
            }}
          >
            {steps.map((step, index) => (
              <View key={step.label} className="flex-row items-center gap-3">
                <Mono className="w-6 text-[11px]">{`0${index + 1}`}</Mono>
                <View className="w-3 items-center">
                  {step.state === 'active' ? (
                    <ActiveDot />
                  ) : (
                    <View
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          step.state === 'done' ? palette.accent : palette.transparent,
                        borderWidth: step.state === 'done' ? 0 : 1,
                        borderColor: palette.inactive,
                      }}
                    />
                  )}
                </View>
                <Body
                  weight={step.state === 'todo' ? 'regular' : 'medium'}
                  className={
                    step.state === 'todo' ? 'text-muted flex-1 text-[15px]' : 'flex-1 text-[15px]'
                  }
                >
                  {step.label}
                </Body>
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
      <View className="pb-safe-offset-6 flex-1 justify-center gap-7 px-6">
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: palette.pathASoft,
            borderWidth: 1,
            borderColor: palette.pathAEdge,
          }}
        >
          <TriangleAlert size={22} color={palette.pathA} />
        </View>

        <View className="gap-3">
          <Display className="text-[30px] leading-9">{title}</Display>
          <Body className="text-muted text-[15px] leading-7">{message}</Body>
        </View>

        <View className="gap-3">
          {actionLabel && onAction ? <ActionButton label={actionLabel} onPress={onAction} /> : null}
          {secondaryLabel && onSecondary ? (
            <ActionButton label={secondaryLabel} variant="secondary" onPress={onSecondary} />
          ) : null}
        </View>
      </View>
    </GlowBackground>
  );
}
