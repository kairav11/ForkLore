import { type ReactNode, useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { palette } from '@/lib/theme';
import { Defs, RadialGradient, Rect, Stop, Svg } from '@/components/ui/primitives/Svg';

interface RoomBackgroundProps {
  children: ReactNode;
  className?: string;
}

interface Speck {
  key: string;
  x: number;
  y: number;
  size: number;
  isLight: boolean;
}

/** One faint speck per ~3200px², so the grain density holds on any screen. */
const AREA_PER_SPECK = 3200;
const MIN_SPECKS = 40;
const MAX_SPECKS = 260;
/** Re-scatter only on a real size change, not on every sub-pixel layout pass. */
const SIZE_STEP = 24;

/** Deterministic noise, so the grain does not crawl between renders. */
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function scatter(width: number, height: number): Speck[] {
  if (width <= 0 || height <= 0) return [];
  const count = Math.min(
    MAX_SPECKS,
    Math.max(MIN_SPECKS, Math.round((width * height) / AREA_PER_SPECK)),
  );
  const next = random(0x5f0c);
  return Array.from({ length: count }, (_unused, index) => {
    const x = next() * width;
    const y = next() * height;
    return {
      key: `${index}-${Math.round(x)}-${Math.round(y)}`,
      x,
      y,
      size: 0.7 + next() * 0.8,
      isLight: next() > 0.45,
    };
  });
}

/**
 * The atmosphere behind the setup fields: a soft pool of light in the middle
 * fading to charcoal at the edges, with a faint grain over it — a dim room
 * rather than a flat void. The gradient ends on `background`, so it meets the
 * hero's fade and the bottom bar without a seam.
 */
export function RoomBackground({ children, className }: RoomBackgroundProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const specks = useMemo(() => scatter(size.width, size.height), [size.width, size.height]);

  const measure = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) =>
      Math.abs(current.width - width) < SIZE_STEP && Math.abs(current.height - height) < SIZE_STEP
        ? current
        : { width, height },
    );
  };

  return (
    <View className={className} onLayout={measure}>
      {size.width > 0 && size.height > 0 ? (
        <Svg
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          width={size.width}
          height={size.height}
        >
          <Defs>
            <RadialGradient id="room-pool" cx="50%" cy="24%" rx="82%" ry="48%">
              <Stop offset="0" stopColor={palette.surface} />
              <Stop offset="1" stopColor={palette.background} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={size.width} height={size.height} fill="url(#room-pool)" />
          {specks.map((speck) => (
            <Rect
              key={speck.key}
              x={speck.x}
              y={speck.y}
              width={speck.size}
              height={speck.size}
              fill={speck.isLight ? palette.foreground : palette.backgroundDeep}
              fillOpacity={speck.isLight ? 0.05 : 0.07}
            />
          ))}
        </Svg>
      ) : null}
      {children}
    </View>
  );
}
