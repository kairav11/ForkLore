import { useEffect, useState } from 'react';
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';

const FADE_OUT_MS = 190;
const FADE_IN_MS = 340;

interface Crossfade<T> {
  /** The value currently rendered — swaps only while faded out. */
  shown: T;
  style: AnimatedStyle<ViewStyle>;
}

/**
 * Fades content out, swaps to the new value, then fades back in so story nodes
 * never cut abruptly.
 */
export function useCrossfade<T>(value: T): Crossfade<T> {
  const [shown, setShown] = useState<T>(value);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (shown === value) {
      opacity.set(withTiming(1, { duration: FADE_IN_MS }));
      return;
    }
    opacity.set(
      withTiming(0, { duration: FADE_OUT_MS }, (finished) => {
        if (finished) runOnJS(setShown)(value);
      }),
    );
  }, [value, shown, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return { shown, style };
}
