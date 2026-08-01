import { View } from 'react-native';

import { palette, pathTone } from '@/lib/theme';

interface PathLineProps {
  /** Number of decisions in the story. */
  total: number;
  /** Choices already made, as option index: 0 = path A, 1 = path B. */
  choices: number[];
}

const NODE = 14;

/**
 * The app's visual signature: a subway-line diagram of the story's decisions.
 * One node per decision phase, filled amber when the reader took the first
 * option and violet-blue when they took the second, so the shape of a
 * playthrough is readable at a glance.
 */
export function PathLine({ total, choices }: PathLineProps) {
  const made = Math.min(choices.length, total);

  return (
    <View className="h-4 flex-row items-center">
      {/* Leading stub so the line reads as a route, not a progress bar. */}
      <View
        className="h-[2px] w-2 rounded-full"
        style={{ backgroundColor: made > 0 ? pathTone(choices[0]).color : palette.inactive }}
      />

      {Array.from({ length: total }, (_, index) => {
        const isDone = index < made;
        const isCurrent = index === made;
        const tone = isDone ? pathTone(choices[index]) : null;
        const nextTone = index + 1 < made ? pathTone(choices[index + 1]) : null;

        return (
          <View key={index} className="flex-row items-center">
            {tone ? (
              <View
                className="items-center justify-center rounded-full"
                style={{
                  width: NODE,
                  height: NODE,
                  backgroundColor: tone.color,
                }}
              >
                <View
                  className="rounded-full"
                  style={{ width: 4, height: 4, backgroundColor: palette.background }}
                />
              </View>
            ) : (
              <View
                className="rounded-full border"
                style={{
                  width: isCurrent ? NODE : 8,
                  height: isCurrent ? NODE : 8,
                  borderColor: isCurrent ? palette.foreground : palette.inactive,
                  backgroundColor: isCurrent ? palette.background : palette.transparent,
                }}
              />
            )}

            {index < total - 1 ? (
              <View
                className="h-[2px] w-6"
                style={{ backgroundColor: nextTone ? nextTone.color : palette.inactive }}
              />
            ) : null}
          </View>
        );
      })}

      <View
        className="h-[2px] w-2 rounded-full"
        style={{
          backgroundColor: made >= total ? pathTone(choices[total - 1]).color : palette.inactive,
        }}
      />
    </View>
  );
}
