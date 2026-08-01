import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RefreshCw, Sparkles } from 'lucide-react-native';

import { errorMessage, getMatch } from '@/lib/api';
import { useStoryStore } from '@/lib/storyStore';
import { palette } from '@/lib/theme';
import type { MatchResult } from '@/lib/types';
import { GlowBackground } from '@/components/GlowBackground';
import { MatchPaths } from '@/components/MatchPaths';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ErrorState, LoadingState } from '@/components/StoryStatus';
import { ActionButton } from '@/components/ui/ActionButton';
import { Display } from '@/components/ui/Display';
import { Body, Mono } from '@/components/ui/Text';

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

  const ownerName = result.ownerName ?? owner ?? 'Story owner';

  return (
    <GlowBackground>
      <View className="pt-safe-offset-2 pb-safe-offset-5 flex-1 px-5">
        <ScreenHeader title="Match score" onBack={() => router.back()} />

        <View className="flex-1 justify-center gap-9">
          <View
            className="gap-4 rounded-3xl p-5"
            style={{
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.border,
            }}
          >
            <MatchPaths
              ownerLetters={result.ownerPath}
              yourLetters={result.yourPath}
              ownerName={ownerName}
            />
          </View>

          <View className="items-center">
            <Display className="text-[96px] leading-[100px]">{result.score}</Display>
            <Mono weight="bold" className="text-[11px] tracking-[4px] uppercase">
              {`% match with ${ownerName}`}
            </Mono>
            <Body className="text-muted mt-4 px-4 text-center text-[15px] leading-6">
              {`You agreed on ${result.agreedCount} of ${result.totalCount} ${
                result.totalCount === 1 ? 'decision' : 'decisions'
              }. ${verdict(result.score)}`}
            </Body>
          </View>
        </View>

        <View className="gap-2.5">
          <ActionButton
            label="Replay the whole story"
            variant="secondary"
            icon={RefreshCw}
            onPress={() => router.push({ pathname: '/replay/[id]', params: { id } })}
          />
          <ActionButton
            label="Create my own story"
            icon={Sparkles}
            onPress={() => {
              clear();
              router.replace('/');
            }}
          />
        </View>
      </View>
    </GlowBackground>
  );
}
