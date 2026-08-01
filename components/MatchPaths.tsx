import { View } from 'react-native';

import { palette } from '@/lib/theme';
import { Body, Mono } from '@/components/ui/Text';

interface MatchPathsProps {
  /** The story owner's decisions, letters in order. */
  ownerLetters: string[];
  /** The reader's own decisions, letters in order. */
  yourLetters: string[];
  /** 1-based decision where the paths split; null when they never did. */
  divergedAt: number | null;
  ownerName: string;
}

/**
 * How a single decision column relates the two readers.
 * - together: same scene, same option.
 * - fork: same scene, different option — this is where the stories split.
 * - apart: after the fork, so the two were choosing between different options.
 */
type ColumnState = 'together' | 'fork' | 'apart';

interface DotProps {
  letter: string | undefined;
  color: string;
  soft: string;
  state: ColumnState;
}

function Dot({ letter, color, soft, state }: DotProps) {
  if (!letter) {
    return (
      <View
        className="h-9 w-9 items-center justify-center rounded-full border"
        style={{ borderColor: palette.inactive }}
      >
        <Mono className="text-xs">·</Mono>
      </View>
    );
  }

  // Past the fork the letters describe different scenes, so they are shown
  // quietly: readable, but clearly not part of the comparison.
  if (state === 'apart') {
    return (
      <View
        className="h-9 w-9 items-center justify-center rounded-full border"
        style={{ borderColor: palette.border, backgroundColor: palette.surface }}
      >
        <Mono className="text-[13px]" color={palette.placeholder}>
          {letter.toUpperCase()}
        </Mono>
      </View>
    );
  }

  const filled = state === 'together';

  return (
    <View
      className="h-9 w-9 items-center justify-center rounded-full border"
      style={{ borderColor: color, backgroundColor: filled ? color : soft }}
    >
      <Mono weight="bold" className="text-[13px]" color={filled ? palette.background : color}>
        {letter.toUpperCase()}
      </Mono>
    </View>
  );
}

function Rung({ state }: { state: ColumnState }) {
  if (state === 'together') {
    return (
      <View className="h-6 justify-center">
        <View
          className="w-[2px] flex-1 rounded-full"
          style={{ backgroundColor: palette.borderStrong }}
        />
      </View>
    );
  }

  if (state === 'fork') {
    return (
      <View className="h-6 justify-between">
        <View className="h-2 w-[2px] rounded-full" style={{ backgroundColor: palette.pathAEdge }} />
        <View className="h-2 w-[2px] rounded-full" style={{ backgroundColor: palette.pathBEdge }} />
      </View>
    );
  }

  return (
    <View className="h-6 justify-between">
      <View className="h-1 w-[2px] rounded-full" style={{ backgroundColor: palette.border }} />
      <View className="h-1 w-[2px] rounded-full" style={{ backgroundColor: palette.border }} />
    </View>
  );
}

/**
 * The match comparison, read as two subway routes stacked on top of each other:
 * the owner's route in amber above the reader's in violet-blue.
 *
 * The story is a binary tree, so the two only ever face the same options while
 * every earlier decision matched. Columns up to the fork are compared; the fork
 * itself is marked in both tones; everything after it is dimmed, because those
 * decisions were taken in scenes the other person never saw.
 */
export function MatchPaths({ ownerLetters, yourLetters, divergedAt, ownerName }: MatchPathsProps) {
  const total = Math.max(ownerLetters.length, yourLetters.length, 1);
  const forkAt = divergedAt ?? Number.POSITIVE_INFINITY;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: palette.pathA }} />
          <Mono className="text-[11px] tracking-[1px] uppercase" color={palette.pathA}>
            {ownerName}
          </Mono>
        </View>
        <View className="flex-row items-center gap-2">
          <Mono className="text-[11px] tracking-[1px] uppercase" color={palette.pathB}>
            You
          </Mono>
          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: palette.pathB }} />
        </View>
      </View>

      <View className="flex-row items-start justify-between">
        {Array.from({ length: total }, (_, index) => {
          const decision = index + 1;
          const state: ColumnState =
            decision < forkAt ? 'together' : decision === forkAt ? 'fork' : 'apart';

          return (
            <View key={index} className="flex-1 items-center gap-2">
              <Dot
                letter={ownerLetters[index]}
                color={palette.pathA}
                soft={palette.pathASoft}
                state={state}
              />

              <Rung state={state} />

              <Dot
                letter={yourLetters[index]}
                color={palette.pathB}
                soft={palette.pathBSoft}
                state={state}
              />

              <Mono
                className="text-[10px] tracking-[1px]"
                color={state === 'fork' ? palette.foreground : palette.muted}
              >
                {state === 'fork' ? 'FORK' : `0${decision}`}
              </Mono>
            </View>
          );
        })}
      </View>

      <Body className="text-muted text-center text-xs leading-5">
        {divergedAt == null
          ? 'Every decision the same — you read the exact same story.'
          : 'Filled dots: the same scene, the same call. From the fork on you were reading different scenes, so those choices are not comparable.'}
      </Body>
    </View>
  );
}
