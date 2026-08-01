import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RefreshCw, Volume2, VolumeX, X } from 'lucide-react-native';

import { findNode, useCurrentNode, useStoryStore } from '@/lib/storyStore';
import { palette } from '@/lib/theme';
import type { PlayMode } from '@/lib/types';
import { useCrossfade } from '@/hooks/useCrossfade';
import { useEnsureStory } from '@/hooks/useEnsureStory';
import { useNarration } from '@/hooks/useNarration';
import { useSceneBranches } from '@/hooks/useSceneBranches';
import { useSceneMedia } from '@/hooks/useSceneMedia';
import { ChoiceButton } from '@/components/ChoiceButton';
import { MediaHint } from '@/components/MediaHint';
import { NarrationPill } from '@/components/NarrationPill';
import { PathLine } from '@/components/PathLine';
import { StoryBackdrop } from '@/components/StoryBackdrop';
import { ErrorState, LoadingState } from '@/components/StoryStatus';
import { ActionButton } from '@/components/ui/ActionButton';
import { Display } from '@/components/ui/Display';
import { IconButton } from '@/components/ui/IconButton';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { Body, Mono } from '@/components/ui/Text';

const DECISIONS_PER_STORY = 3;

export default function ReaderScreen() {
  const router = useRouter();
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: PlayMode }>();
  const { story, error } = useEnsureStory(id, mode ?? 'owner');
  const playMode = useStoryStore((state) => state.mode);
  const decisions = useStoryStore((state) => state.decisions);
  const ambientEnabled = useStoryStore((state) => state.ambientEnabled);
  const setAmbientEnabled = useStoryStore((state) => state.setAmbientEnabled);
  const choose = useStoryStore((state) => state.choose);
  const clear = useStoryStore((state) => state.clear);

  const node = useCurrentNode();

  // Reaching a node without choices means the story is over.
  useEffect(() => {
    if (node?.isEnding && id) {
      router.replace({ pathname: '/ending/[id]', params: { id } });
    }
  }, [node?.isEnding, id, router]);

  const { shown: shownNodeId, style: crossfadeStyle } = useCrossfade(node?.id ?? null);
  const shownNode = story && shownNodeId ? findNode(story, shownNodeId) : null;
  const audioUrls = useMemo(() => shownNode?.audioUrls ?? [], [shownNode]);
  const narration = useNarration(audioUrls);
  const { isPaintingScene, isRecordingNarration } = useSceneMedia(story, shownNode);
  const branches = useSceneBranches(story, shownNode);

  /** Decisions so far as option indexes, for the branching-path indicator. */
  const takenPath = useMemo(
    () => decisions.map((decision) => (decision.choiceLetter.toLowerCase() === 'a' ? 0 : 1)),
    [decisions],
  );

  if (error) {
    return (
      <ErrorState
        title="This story would not open"
        message={error}
        actionLabel="Back to setup"
        onAction={() => {
          clear();
          router.replace('/');
        }}
      />
    );
  }

  if (!story || !shownNode) {
    return <LoadingState title="Opening your story…" />;
  }

  const choices = shownNode.choices.slice(0, 2);
  const sceneLabel =
    playMode === 'shared' && story.ownerName
      ? `${story.ownerName}'s story`
      : (story.title ?? 'Your story');

  return (
    <StoryBackdrop
      imageUrl={story.backgroundImageUrl}
      underlay={
        shownNode.imageUrl ? (
          <AnimatedView
            pointerEvents="none"
            style={[crossfadeStyle, StyleSheet.absoluteFillObject]}
          >
            <Image
              source={{ uri: shownNode.imageUrl }}
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
      <View className="pt-safe-offset-2 pb-safe-offset-3 flex-1 px-4">
        <View className="flex-row items-start justify-between gap-3">
          <View
            className="gap-2.5 rounded-2xl px-3.5 py-3"
            style={{
              backgroundColor: palette.panel,
              borderWidth: 1,
              borderColor: palette.border,
            }}
          >
            <Mono className="text-[10px] tracking-[2px] uppercase">
              {`Decision ${Math.min(decisions.length + 1, DECISIONS_PER_STORY)} of ${DECISIONS_PER_STORY}`}
            </Mono>
            <PathLine total={DECISIONS_PER_STORY} choices={takenPath} />
          </View>

          <View className="flex-row items-center gap-2">
            <IconButton
              accessibilityLabel={ambientEnabled ? 'Mute ambient sound' : 'Unmute ambient sound'}
              onPress={() => setAmbientEnabled(!ambientEnabled)}
            >
              {ambientEnabled ? (
                <Volume2 size={17} color={palette.foreground} />
              ) : (
                <VolumeX size={17} color={palette.muted} />
              )}
            </IconButton>
            <IconButton
              accessibilityLabel="Leave story"
              onPress={() => {
                narration.stop();
                clear();
                router.replace('/');
              }}
            >
              <X size={17} color={palette.foreground} />
            </IconButton>
          </View>
        </View>

        <View className="flex-1" />

        <AnimatedView style={crossfadeStyle} className="gap-4">
          {/* Translucent charcoal panel: the story stays readable, the art stays visible. */}
          <View
            className="gap-4 rounded-3xl p-5"
            style={{
              backgroundColor: palette.panel,
              borderWidth: 1,
              borderColor: palette.border,
            }}
          >
            <Display weight="medium" className="text-muted text-[15px] leading-5">
              {sceneLabel}
            </Display>

            <ScrollView className="max-h-56" showsVerticalScrollIndicator={false}>
              <Body className="text-[17px] leading-[28px]">{shownNode.text}</Body>
            </ScrollView>

            {narration.hasAudio ? (
              <NarrationPill isPlaying={narration.isPlaying} onPress={narration.toggle} />
            ) : isRecordingNarration ? (
              <MediaHint kind="voice" />
            ) : null}

            {isPaintingScene ? <MediaHint kind="art" /> : null}
            {branches.isWriting ? <MediaHint kind="writing" /> : null}
          </View>

          <View className="gap-2.5">
            {choices.map((choice, index) => (
              <ChoiceButton
                key={`${shownNode.id}-${choice.letter}`}
                letter={choice.letter}
                label={choice.label}
                index={index}
                disabled={!branches.isReady}
                onPress={() => {
                  narration.stop();
                  choose(index);
                }}
              />
            ))}

            {branches.error && !branches.isReady ? (
              <View className="gap-2 pt-1">
                <Body className="text-muted text-[13px] leading-5">{branches.error}</Body>
                <ActionButton
                  label="Write the next scenes"
                  variant="secondary"
                  icon={RefreshCw}
                  onPress={branches.retry}
                />
              </View>
            ) : null}
          </View>
        </AnimatedView>
      </View>
    </StoryBackdrop>
  );
}
