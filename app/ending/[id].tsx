import { useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Text } from 'heroui-native';
import { Pause, Percent, Play, RefreshCw, Share2, Sparkles } from 'lucide-react-native';

import { finishStory } from '@/lib/api';
import { useCurrentNode, usePath, useStoryStore } from '@/lib/storyStore';
import { palette } from '@/lib/theme';
import { useCrossfade } from '@/hooks/useCrossfade';
import { useEnsureStory } from '@/hooks/useEnsureStory';
import { useNarration } from '@/hooks/useNarration';
import { useSceneMedia } from '@/hooks/useSceneMedia';
import { MediaHint } from '@/components/MediaHint';
import { StoryBackdrop } from '@/components/StoryBackdrop';
import { ErrorState, LoadingState } from '@/components/StoryStatus';
import { Display } from '@/components/ui/Display';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';

export default function EndingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { story, error } = useEnsureStory(id);
  const mode = useStoryStore((state) => state.mode);
  const decisions = useStoryStore((state) => state.decisions);
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
    finishStory(id, path, decisions, mode).catch(() => {
      // A failed recording should never block the ending screen.
      reported.current = false;
    });
  }, [id, path, decisions, mode]);

  const audioUrls = useMemo(() => node?.audioUrls ?? [], [node]);
  const narration = useNarration(audioUrls);
  const { style: fadeStyle } = useCrossfade(node?.id ?? null);
  const { isRecordingNarration } = useSceneMedia(story, node);

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
    return <LoadingState title="Wrapping up your story…" />;
  }

  const isShared = mode === 'shared';
  const owner = story.ownerName ?? 'the story owner';

  return (
    <StoryBackdrop
      imageUrl={story.backgroundImageUrl}
      overlay="strong"
      underlay={
        node.imageUrl ? (
          <AnimatedView pointerEvents="none" style={[fadeStyle, StyleSheet.absoluteFillObject]}>
            <Image
              source={{ uri: node.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              contentPosition="top"
              transition={420}
              cachePolicy="memory-disk"
              accessibilityIgnoresInvertColors
            />
          </AnimatedView>
        ) : null
      }
    >
      <View className="pt-safe-offset-4 pb-safe-offset-4 flex-1 justify-end gap-6 px-5">
        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="bg-accent h-[2px] w-7 rounded-full" />
            <Display className="text-accent text-lg tracking-wide">The End</Display>
          </View>

          {story.title ? <Display className="text-3xl leading-10">{story.title}</Display> : null}

          <ScrollView className="max-h-52" showsVerticalScrollIndicator={false}>
            <Text className="text-foreground text-xl leading-8">{node.text}</Text>
          </ScrollView>

          {narration.hasAudio ? (
            <Button
              size="sm"
              variant="tertiary"
              className="border-accent/35 h-11 self-start rounded-full border px-4"
              onPress={narration.toggle}
            >
              {narration.isPlaying ? (
                <Pause size={16} color={palette.accent} />
              ) : (
                <Play size={16} color={palette.accent} />
              )}
              <Button.Label className="text-accent text-sm font-semibold">
                {narration.isPlaying ? 'Pause narration' : 'Listen'}
              </Button.Label>
            </Button>
          ) : isRecordingNarration ? (
            <MediaHint kind="voice" />
          ) : null}
        </View>

        <View className="gap-3">
          {isShared ? (
            <Button
              size="lg"
              className="h-14 rounded-2xl"
              onPress={() => {
                narration.stop();
                router.push({
                  pathname: '/match/[id]',
                  params: { id, path: path.join(','), owner },
                });
              }}
            >
              <Percent size={20} color={palette.accentForeground} />
              <Button.Label className="text-lg font-semibold">See Your Match Score</Button.Label>
            </Button>
          ) : (
            <Button
              size="lg"
              className="h-14 rounded-2xl"
              onPress={() => {
                narration.stop();
                router.push({ pathname: '/share/[id]', params: { id } });
              }}
            >
              <Share2 size={20} color={palette.accentForeground} />
              <Button.Label className="text-lg font-semibold">Share This Story</Button.Label>
            </Button>
          )}

          <Button
            size="lg"
            variant="tertiary"
            className="border-border/70 h-13 rounded-2xl border"
            onPress={() => {
              narration.stop();
              router.push({ pathname: '/replay/[id]', params: { id } });
            }}
          >
            <RefreshCw size={16} color={palette.foreground} />
            <Button.Label className="text-base">Replay the whole story</Button.Label>
          </Button>

          <Button
            size="md"
            variant="ghost"
            onPress={() => {
              narration.stop();
              clear();
              router.replace('/');
            }}
          >
            <Sparkles size={16} color={palette.muted} />
            <Button.Label className="text-muted text-base">Start a new story</Button.Label>
          </Button>
        </View>
      </View>
    </StoryBackdrop>
  );
}
