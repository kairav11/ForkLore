import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Text } from 'heroui-native';
import { RefreshCw, Sparkles } from 'lucide-react-native';

import { errorMessage, getMatch } from '@/lib/api';
import { useStoryStore } from '@/lib/storyStore';
import { palette } from '@/lib/theme';
import type { MatchResult } from '@/lib/types';
import { ErrorState, LoadingState } from '@/components/StoryStatus';

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
    return <LoadingState title="Comparing your decisions..." />;
  }

  const ownerName = result.ownerName ?? owner ?? 'the story owner';

  return (
    <View className="bg-background pt-safe-offset-6 pb-safe-offset-5 flex-1 justify-between px-5">
      <View className="flex-1 justify-center gap-8">
        <View className="items-center gap-3">
          <Text className="text-accent text-sm font-semibold tracking-widest uppercase">
            Match score
          </Text>
          <Text className="text-accent text-8xl font-bold">{result.score}%</Text>
          <Text.Heading type="h2" align="center" className="text-2xl leading-tight">
            You matched {result.score}% with {ownerName}
          </Text.Heading>
          <Text.Paragraph align="center" color="muted" className="text-lg leading-7">
            You agreed on {result.agreedCount} of {result.totalCount}{' '}
            {result.totalCount === 1 ? 'decision' : 'decisions'}.
          </Text.Paragraph>
        </View>

        <Card className="gap-2 p-5">
          <Text className="text-foreground text-base leading-6">
            {result.score >= 80
              ? 'Almost the same story — you two think alike.'
              : result.score >= 40
                ? 'Some shared instincts, some very different turns.'
                : 'You took this story somewhere else entirely.'}
          </Text>
        </Card>
      </View>

      <View className="gap-3">
        <Button
          size="lg"
          variant="secondary"
          onPress={() => router.push({ pathname: '/replay/[id]', params: { id } })}
        >
          <RefreshCw size={18} color={palette.foreground} />
          <Button.Label className="text-base">Replay The Whole Story</Button.Label>
        </Button>
        <Button
          size="lg"
          onPress={() => {
            clear();
            router.replace('/');
          }}
        >
          <Sparkles size={20} color={palette.accentForeground} />
          <Button.Label className="text-lg">Create My Own Story</Button.Label>
        </Button>
      </View>
    </View>
  );
}
