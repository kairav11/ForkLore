import { useEffect, useMemo, useRef } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Text } from 'heroui-native';
import { Percent, RefreshCw, Share2, Sparkles } from 'lucide-react-native';

import { finishStory } from '@/lib/api';
import { useCurrentNode, usePath, useStoryStore } from '@/lib/storyStore';
import { palette } from '@/lib/theme';
import { useCrossfade } from '@/hooks/useCrossfade';
import { useEnsureStory } from '@/hooks/useEnsureStory';
import { useNarration } from '@/hooks/useNarration';
import { StoryBackdrop } from '@/components/StoryBackdrop';
import { ErrorState, LoadingState } from '@/components/StoryStatus';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';

export default function EndingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { height } = useWindowDimensions();

  const { story, error } = useEnsureStory(id);
  const mode = useStoryStore((state) => state.mode);
  const clear = useStoryStore((state) => state.clear);
  const node = useCurrentNode();
  const path = usePath();

  const reported = useRef(false);

  // Opened without a finished playthrough (deep link / reload): read it instead.
  useEffect(() => {
    if (story && node && !node.isEnding && id) {
      router.replace({ pathname: '/reader/[id]', params: { id } });
    }
  }, [story, node, id, router]);

  // Record the player's path for the owner's reference / friend comparison.
  useEffect(() => {
    if (reported.current || !id || path.length === 0) return;
    reported.current = true;
    finishStory(id, path).catch(() => {
      // A failed recording should never block the ending screen.
      reported.current = false;
    });
  }, [id, path]);

  const audioUrls = useMemo(() => node?.audioUrls ?? [], [node]);
  const narration = useNarration(audioUrls);
  const { style: fadeStyle } = useCrossfade(node?.id ?? null);

  if (error) {
    return (
      <ErrorState
        title="This story would not open"
        message={error}
        actionLabel="Start a new story"
        onAction={() => {
          clear();
          router.replace('/');
        }}
      />
    );
  }

  if (!story || !node) {
    return <LoadingState title="Wrapping up your story..." />;
  }

  const isShared = mode === 'shared';
  const owner = story.ownerName ?? 'the story owner';

  return (
    <StoryBackdrop imageUrl={story.backgroundImageUrl}>
      {node.imageUrl ? (
        <AnimatedView
          pointerEvents="none"
          style={[
            fadeStyle,
            { position: 'absolute', left: 0, right: 0, bottom: 0, height: height * 0.6 },
          ]}
        >
          <Image
            source={{ uri: node.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            contentPosition="bottom"
            transition={420}
            cachePolicy="memory-disk"
            accessibilityIgnoresInvertColors
          />
        </AnimatedView>
      ) : null}

      <View className="pt-safe-offset-4 pb-safe-offset-4 flex-1 justify-end gap-4 px-5">
        <View className="bg-background/85 border-border/60 rounded-3xl border p-5">
          <Text className="text-accent mb-2 text-sm font-semibold tracking-widest uppercase">
            The End
          </Text>
          <ScrollView className="max-h-56" showsVerticalScrollIndicator={false}>
            <Text className="text-foreground text-xl leading-8">{node.text}</Text>
          </ScrollView>
          {narration.hasAudio ? (
            <Button
              size="md"
              variant="tertiary"
              className="mt-4 self-start"
              onPress={narration.toggle}
            >
              <Button.Label className="text-base">
                {narration.isPlaying ? 'Pause narration' : 'Play narration'}
              </Button.Label>
            </Button>
          ) : null}
        </View>

        <View className="gap-3">
          {isShared ? (
            <Button
              size="lg"
              onPress={() => {
                narration.stop();
                router.push({
                  pathname: '/match/[id]',
                  params: { id, path: path.join(','), owner },
                });
              }}
            >
              <Percent size={20} color={palette.accentForeground} />
              <Button.Label className="text-lg">See Your Match Score</Button.Label>
            </Button>
          ) : (
            <Button
              size="lg"
              onPress={() => {
                narration.stop();
                router.push({ pathname: '/share/[id]', params: { id } });
              }}
            >
              <Share2 size={20} color={palette.accentForeground} />
              <Button.Label className="text-lg">Share This Story</Button.Label>
            </Button>
          )}

          <Button
            size="lg"
            variant="secondary"
            onPress={() => {
              narration.stop();
              router.push({ pathname: '/replay/[id]', params: { id } });
            }}
          >
            <RefreshCw size={18} color={palette.foreground} />
            <Button.Label className="text-base">Replay The Whole Story</Button.Label>
          </Button>

          <Button
            size="lg"
            variant="ghost"
            onPress={() => {
              narration.stop();
              clear();
              router.replace('/');
            }}
          >
            <Sparkles size={18} color={palette.muted} />
            <Button.Label className="text-base">Start A New Story</Button.Label>
          </Button>
        </View>
      </View>
    </StoryBackdrop>
  );
}
