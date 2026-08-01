import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Text } from 'heroui-native';
import { RefreshCw, Sparkles } from 'lucide-react-native';

import { errorMessage, getMatch } from '@/lib/api';
import { useStoryStore } from '@/lib/storyStore';
import { palette } from '@/lib/theme';
import type { MatchResult } from '@/lib/types';
import { GlowBackground } from '@/components/GlowBackground';
import { MatchRing } from '@/components/MatchRing';
import { ErrorState, LoadingState } from '@/components/StoryStatus';
import { Display } from '@/components/ui/Display';

function verdict(score: number): string {
  if (score >= 80) return 'Almost the same story — you two think alike.';
  if (score >= 40) return 'Some shared instincts, some very different turns.';
  return 'You took this story somewhere else entirely.';
}

export default function MatchScreen() {
  const router = useRouter();
  const { id, path, owner } = useLocalSearchParams<{ id: string; path: string; owner?: string }>();
  const clear = useStoryStore((state) => state.clear);

  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const letters = useMemo(
    () => (path ?? '').split(',').filter((letter) => letter.length > 0),
    [path],
  );

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    setError(null);

    getMatch(id, letters)
      .then((match) => {
        if (!cancelled) setResult(match);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(errorMessage(cause));
      });

    return () => {
      cancelled = true;
    };
  }, [id, letters, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  if (error) {
    return (
      <ErrorState
        title="We could not compare your choices"
        message={error}
        actionLabel="Try again"
        onAction={retry}
        secondaryLabel="Back to the story"
        onSecondary={() => router.back()}
      />
    );
  }

  if (!result) {
    return <LoadingState title="Comparing your decisions…" />;
  }

  const ownerName = result.ownerName ?? owner ?? 'the story owner';

  return (
    <GlowBackground>
      <View className="pt-safe-offset-6 pb-safe-offset-5 flex-1 justify-between px-5">
        <View className="flex-1 items-center justify-center gap-8">
          <MatchRing score={result.score} />

          <View className="items-center gap-3">
            <Display className="text-center text-[30px] leading-9">
              You matched {result.score}% with {ownerName}
            </Display>
            <Text className="text-muted text-center text-lg leading-7">
              You agreed on {result.agreedCount} of {result.totalCount}{' '}
              {result.totalCount === 1 ? 'decision' : 'decisions'}.
            </Text>
          </View>

          <View
            className="border-border/60 w-full rounded-3xl border p-5"
            style={{ backgroundColor: 'rgba(36, 29, 22, 0.6)' }}
          >
            <Text className="text-foreground text-base leading-7">{verdict(result.score)}</Text>
          </View>
        </View>

        <View className="gap-3">
          <Button
            size="lg"
            variant="tertiary"
            className="border-border/70 h-13 rounded-2xl border"
            onPress={() => router.push({ pathname: '/replay/[id]', params: { id } })}
          >
            <RefreshCw size={16} color={palette.foreground} />
            <Button.Label className="text-base">Replay the whole story</Button.Label>
          </Button>
          <Button
            size="lg"
            className="h-14 rounded-2xl"
            onPress={() => {
              clear();
              router.replace('/');
            }}
          >
            <Sparkles size={20} color={palette.accentForeground} />
            <Button.Label className="text-lg font-semibold">Create My Own Story</Button.Label>
          </Button>
        </View>
      </View>
    </GlowBackground>
  );
}
