import { type ReactNode, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { palette } from '@/lib/theme';
import { Line, Path, Svg } from '@/components/ui/primitives/Svg';
import { Body, Mono } from '@/components/ui/Text';

interface TicketCardProps {
  /** Ticket field name — kept short, monospace, like "DESTINATION". */
  label: string;
  /** Small right-hand code, e.g. "01" or "03 · optional". */
  code?: string;
  /** Quiet helper line under the field. */
  hint?: string;
  /** Replaces the hint and turns the stub outline amber-red. */
  error?: string | null;
  /** Focused / open — draws the amber outline. */
  isActive?: boolean;
  children: ReactNode;
}

const CORNER = 22;
const NOTCH = 7;
/** The band the perforation runs through, between the label and the field. */
const PERFORATION_BAND = 13;

/**
 * Outline of a ticket stub: rounded corners, a circular notch bitten out of each
 * side, and the perforation line running between them. Drawn as one path so the
 * notches are genuinely cut out and the room gradient shows through them.
 */
function stubPath(width: number, height: number, notchY: number): string {
  const left = 0.5;
  const top = 0.5;
  const right = width - 0.5;
  const bottom = height - 0.5;
  const hasNotch = notchY - NOTCH > top + CORNER && notchY + NOTCH < bottom - CORNER;

  const rightEdge = hasNotch
    ? `V ${notchY - NOTCH} A ${NOTCH} ${NOTCH} 0 0 0 ${right} ${notchY + NOTCH}`
    : '';
  const leftEdge = hasNotch
    ? `V ${notchY + NOTCH} A ${NOTCH} ${NOTCH} 0 0 0 ${left} ${notchY - NOTCH}`
    : '';

  return [
    `M ${left + CORNER} ${top}`,
    `H ${right - CORNER}`,
    `A ${CORNER} ${CORNER} 0 0 1 ${right} ${top + CORNER}`,
    rightEdge,
    `V ${bottom - CORNER}`,
    `A ${CORNER} ${CORNER} 0 0 1 ${right - CORNER} ${bottom}`,
    `H ${left + CORNER}`,
    `A ${CORNER} ${CORNER} 0 0 1 ${left} ${bottom - CORNER}`,
    leftEdge,
    `V ${top + CORNER}`,
    `A ${CORNER} ${CORNER} 0 0 1 ${left + CORNER} ${top}`,
    'Z',
  ]
    .filter((segment) => segment.length > 0)
    .join(' ');
}

/**
 * Every input on the setup screen is one of these: a charcoal ticket stub with
 * its field name printed above a dashed perforation, notches cut into both
 * edges, and the control itself on the tear-off half.
 */
export function TicketCard({
  label,
  code,
  hint,
  error,
  isActive = false,
  children,
}: TicketCardProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [bandTop, setBandTop] = useState(0);

  const edgeColor = error ? palette.pathA : isActive ? palette.accent : palette.border;
  const dashColor = error || isActive ? palette.pathAEdge : palette.borderStrong;
  const labelColor = error ? palette.pathA : isActive ? palette.accent : palette.muted;
  const notchY = bandTop + PERFORATION_BAND / 2;

  const measure = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) =>
      Math.abs(current.width - width) < 0.5 && Math.abs(current.height - height) < 0.5
        ? current
        : { width, height },
    );
  };

  return (
    <View onLayout={measure}>
      {size.width > 0 && size.height > 0 ? (
        <Svg
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          width={size.width}
          height={size.height}
        >
          <Path
            d={stubPath(size.width, size.height, notchY)}
            fill={palette.surface}
            stroke={edgeColor}
            strokeWidth={1}
          />
          <Line
            x1={NOTCH + 8}
            y1={notchY}
            x2={size.width - NOTCH - 8}
            y2={notchY}
            stroke={dashColor}
            strokeWidth={1}
            strokeDasharray={[2, 5]}
            strokeLinecap="round"
          />
        </Svg>
      ) : null}

      <View className="flex-row items-center justify-between gap-3 px-4 pt-3.5">
        <Mono
          className="flex-1 text-[10px] tracking-[3px] uppercase"
          weight="bold"
          color={labelColor}
        >
          {label}
        </Mono>
        {code ? (
          <Mono className="text-[9px] tracking-[2px] uppercase" color={palette.placeholder}>
            {code}
          </Mono>
        ) : null}
      </View>

      <View
        style={{ height: PERFORATION_BAND }}
        onLayout={(event) => setBandTop(event.nativeEvent.layout.y)}
      />

      <View className="gap-3 px-4 pb-4">
        {children}
        {error ? (
          <Body className="text-[13px] leading-5" color={palette.pathA}>
            {error}
          </Body>
        ) : hint ? (
          <Body className="text-muted text-[13px] leading-5">{hint}</Body>
        ) : null}
      </View>
    </View>
  );
}
