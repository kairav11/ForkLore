import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Percent, RefreshCw, Share2, Sparkles } from 'lucide-react-native';

import { finishStory } from '@/lib/api';
import { useCurrentNode, usePath, useStoryStore } from '@/lib/storyStore';
import { palette } from '@/lib/theme';
import { useCrossfade } from '@/hooks/useCrossfade';
import { useEnsureStory } from '@/hooks/useEnsureStory';
import { useSceneNarration } from '@/hooks/useNarration';
import { useSceneMedia } from '@/hooks/useSceneMedia';
import { MediaHint } from '@/components/MediaHint';
import { NarrationPill } from '@/components/NarrationPill';
import { PathLine } from '@/components/PathLine';
import { ReadingPanel } from '@/components/ReadingPanel';
import { StoryBackdrop } from '@/components/StoryBackdrop';
import { ErrorState, LoadingState } from '@/components/StoryStatus';
import { ActionButton } from '@/components/ui/ActionButton';
import { Display } from '@/components/ui/Display';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { Mono } from '@/components/ui/Text';

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

  const narration = useSceneNarration(node);
  const { style: fadeStyle } = useCrossfade(node?.id ?? null);
  const { isRecordingNarration } = useSceneMedia(story, node);

  const takenPath = useMemo(
    () => decisions.map((decision) => (decision.choiceLetter.toLowerCase() === 'a' ? 0 : 1)),
    [decisions],
  );

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
              contentPosition="center"
              transition={420}
              cachePolicy="memory-disk"
              accessibilityIgnoresInvertColors
            />
          </AnimatedView>
        ) : null
      }
    >
      <View className="pt-safe-offset-4 pb-safe-offset-3 flex-1 justify-end gap-5 px-4">
        <AnimatedView style={fadeStyle} className="gap-4">
          <View className="gap-3 px-1">
            <Mono className="text-[10px] tracking-[3px] uppercase">Your path</Mono>
            <PathLine total={Math.max(takenPath.length, 3)} choices={takenPath} />
          </View>

          <ReadingPanel
            key={node.id}
            lines={node.lines}
            text={node.text}
            size="ending"
            collapsedHeight={150}
            expandedHeight={320}
            activeLine={narration.activeLine}
            activeWord={narration.activeWord}
            lineProgress={narration.lineProgress}
            header={
              <View className="gap-2">
                <Mono className="text-[10px] tracking-[3px] uppercase" color={palette.accent}>
                  The end
                </Mono>
                {story.title ? (
                  <Display className="text-[28px] leading-[34px]">{story.title}</Display>
                ) : null}
              </View>
            }
            footer={
              narration.hasAudio ? (
                <NarrationPill isPlaying={narration.isPlaying} onPress={narration.toggle} />
              ) : isRecordingNarration ? (
                <MediaHint kind="voice" />
              ) : null
            }
          />
        </AnimatedView>

        <View className="gap-2.5">
          {isShared ? (
            <ActionButton
              label="See your match score"
              icon={Percent}
              onPress={() => {
                narration.stop();
                router.push({
                  pathname: '/match/[id]',
                  params: { id, path: path.join(','), owner },
                });
              }}
            />
          ) : (
            <ActionButton
              label="Share this story"
              icon={Share2}
              onPress={() => {
                narration.stop();
                router.push({ pathname: '/share/[id]', params: { id } });
              }}
            />
          )}

          <ActionButton
            label="Replay the whole story"
            variant="secondary"
            icon={RefreshCw}
            onPress={() => {
              narration.stop();
              router.push({ pathname: '/replay/[id]', params: { id } });
            }}
          />

          <ActionButton
            label="Start a new story"
            variant="ghost"
            icon={Sparkles}
            onPress={() => {
              narration.stop();
              clear();
              router.replace('/');
            }}
          />
        </View>
      </View>
    </StoryBackdrop>
  );
}
