import { View } from 'react-native';

import { palette } from '@/lib/theme';
import { Body, Mono } from '@/components/ui/Text';

interface MatchPathsProps {
  /** The story owner's decisions, letters in order. */
  ownerLetters: string[];
  /** The reader's own decisions, letters in order. */
  yourLetters: string[];
  ownerName: string;
}

interface DotProps {
  letter: string | undefined;
  color: string;
  soft: string;
  agreed: boolean;
}

function Dot({ letter, color, soft, agreed }: DotProps) {
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

  return (
    <View
      className="h-9 w-9 items-center justify-center rounded-full border"
      style={{
        borderColor: color,
        backgroundColor: agreed ? color : soft,
      }}
    >
      <Mono weight="bold" className="text-[13px]" color={agreed ? palette.background : color}>
        {letter.toUpperCase()}
      </Mono>
    </View>
  );
}

/**
 * The match comparison, read as two subway routes stacked on top of each other:
 * the owner's path in amber, the reader's in violet-blue. A solid rung between
 * two dots means they agreed; a broken rung means the story forked there.
 */
export function MatchPaths({ ownerLetters, yourLetters, ownerName }: MatchPathsProps) {
  const total = Math.max(ownerLetters.length, yourLetters.length, 1);

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
          const ownerLetter = ownerLetters[index];
          const yourLetter = yourLetters[index];
          const agreed = Boolean(ownerLetter) && ownerLetter === yourLetter;

          return (
            <View key={index} className="flex-1 items-center gap-2">
              <Dot
                letter={ownerLetter}
                color={palette.pathA}
                soft={palette.pathASoft}
                agreed={agreed}
              />

              <View className="h-6 justify-center">
                {agreed ? (
                  <View
                    className="w-[2px] flex-1 rounded-full"
                    style={{ backgroundColor: palette.borderStrong }}
                  />
                ) : (
                  <View className="flex-1 justify-between">
                    <View
                      className="h-1.5 w-[2px] rounded-full"
                      style={{ backgroundColor: palette.pathAEdge }}
                    />
                    <View
                      className="h-1.5 w-[2px] rounded-full"
                      style={{ backgroundColor: palette.pathBEdge }}
                    />
                  </View>
                )}
              </View>

              <Dot
                letter={yourLetter}
                color={palette.pathB}
                soft={palette.pathBSoft}
                agreed={agreed}
              />

              <Mono className="text-[10px] tracking-[1px]">{`0${index + 1}`}</Mono>
            </View>
          );
        })}
      </View>

      <Body className="text-muted text-center text-xs leading-5">
        Solid rung: same decision. Split rung: the story forked.
      </Body>
    </View>
  );
}
