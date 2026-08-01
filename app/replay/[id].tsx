import { useEffect, useMemo, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pause, Play, RotateCcw, Square } from 'lucide-react-native';

import { findNode, useCurrentNode, useStoryStore } from '@/lib/storyStore';
import { palette } from '@/lib/theme';
import type { Decision, StoryNode } from '@/lib/types';
import { useEnsureStory } from '@/hooks/useEnsureStory';
import { useStoryNarration } from '@/hooks/useStoryNarration';
import { PathLine } from '@/components/PathLine';
import { ReplaySceneCard } from '@/components/ReplaySceneCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StoryBackdrop } from '@/components/StoryBackdrop';
import { ErrorState, LoadingState } from '@/components/StoryStatus';
import { ActionButton } from '@/components/ui/ActionButton';
import { Display } from '@/components/ui/Display';
import { IconButton } from '@/components/ui/IconButton';
import { Body, Mono } from '@/components/ui/Text';

/** Breathing room kept above the card or line being read. */
const TOP_GAP = 10;
/** Ignore scroll targets closer than this, so the list does not twitch. */
const SCROLL_STEP = 20;
/** Where in the viewport a spoken line is held. */
const FOLLOW_ANCHOR = 0.42;

interface ReplayScene {
  node: StoryNode;
  /** The decision made in this scene, or null for the ending. */
  decision: Decision | null;
}

interface LineBox {
  y: number;
  height: number;
}

export default function ReplayScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { story, error } = useEnsureStory(id);
  const decisions = useStoryStore((state) => state.decisions);
  const restart = useStoryStore((state) => state.restart);
  const endingNode = useCurrentNode();

  // Every scene of the playthrough in order, the ending last. The index of a
  // scene here is what the narration reports as it reads.
  const scenes = useMemo<ReplayScene[]>(() => {
    if (!story) return [];

    const list: ReplayScene[] = [];
    for (const decision of decisions) {
      const node = findNode(story, decision.nodeId);
      if (node) list.push({ node, decision });
    }
    if (endingNode?.isEnding) list.push({ node: endingNode, decision: null });
    return list;
  }, [story, decisions, endingNode]);

  const nodes = useMemo(() => scenes.map((scene) => scene.node), [scenes]);
  const narration = useStoryNarration(story, nodes);

  const scroller = useRef<ScrollView>(null);
  const cardTops = useRef(new Map<number, number>());
  const textTops = useRef(new Map<number, number>());
  const lineBoxes = useRef(new Map<string, LineBox>());
  const viewport = useRef(0);
  const contentHeight = useRef(0);
  const lastTarget = useRef(-1);

  const { activeScene, activeLine, lineProgress } = narration;

  // Follow the voice through the whole story: a new scene brings its card to the
  // top, and within a scene the spoken line is kept in view — creeping through a
  // line taller than the screen rather than jumping.
  useEffect(() => {
    if (activeScene < 0) return;

    const cardTop = cardTops.current.get(activeScene);
    if (cardTop === undefined) return;

    const height = viewport.current;
    const top = Math.max(cardTop - TOP_GAP, 0);
    const box = activeLine >= 0 ? lineBoxes.current.get(`${activeScene}:${activeLine}`) : undefined;

    let target = top;
    if (box && height > 0) {
      const textTop = textTops.current.get(activeScene) ?? 0;
      const creep = Math.max(0, box.height - height * 0.6) * lineProgress;
      const follow = cardTop + textTop + box.y + creep - height * FOLLOW_ANCHOR;
      target = Math.max(top, follow);
    }

    const limit = Math.max(0, contentHeight.current - height);
    const clamped = Math.min(Math.max(target, 0), limit);

    if (Math.abs(clamped - lastTarget.current) < SCROLL_STEP) return;
    lastTarget.current = clamped;
    scroller.current?.scrollTo({ y: clamped, animated: true });
  }, [activeScene, activeLine, lineProgress]);

  if (error) {
    return (
      <ErrorState
        title="We could not load the replay"
        message={error}
        actionLabel="Go back"
        onAction={() => router.back()}
      />
    );
  }

  if (!story) {
    return <LoadingState title="Loading your replay…" />;
  }

  const takenPath = decisions.map((decision) =>
    decision.choiceLetter.toLowerCase() === 'a' ? 0 : 1,
  );

  const status = narration.isPlaying
    ? `Reading scene ${activeScene + 1} of ${scenes.length}`
    : narration.pendingScenes > 0
      ? `Recording ${narration.pendingScenes} scene${narration.pendingScenes === 1 ? '' : 's'}`
      : narration.hasAudio
        ? `Narrator and cast · ${scenes.length} scene${scenes.length === 1 ? '' : 's'}`
        : 'No recordings for this story yet';

  return (
    <StoryBackdrop imageUrl={story.backgroundImageUrl} overlay="strong">
      <View className="pt-safe-offset-2 flex-1">
        <View className="px-4">
          <ScreenHeader
            title="Your path"
            onBack={() => {
              narration.stop();
              router.back();
            }}
          />
        </View>

        <ScrollView
          ref={scroller}
          className="flex-1"
          contentContainerClassName="px-4 pb-6 gap-3 pt-2"
          showsVerticalScrollIndicator={false}
          onLayout={(event) => {
            viewport.current = event.nativeEvent.layout.height;
          }}
          onContentSizeChange={(_width, height) => {
            contentHeight.current = height;
          }}
        >
          <View className="gap-4 pb-2">
            <Display className="text-[30px] leading-[36px]">
              {story.title ?? 'Your story, start to finish'}
            </Display>
            <Body className="text-muted text-[15px] leading-6">
              Every scene you read and every decision you made, in order — or have it read to you,
              narrator and cast.
            </Body>
            {takenPath.length > 0 ? (
              <PathLine total={Math.max(takenPath.length, 3)} choices={takenPath} />
            ) : null}
          </View>

          {scenes.map((scene, index) => (
            <ReplaySceneCard
              key={`${scene.node.id}-${scene.decision?.choiceLetter ?? 'end'}`}
              index={index}
              node={scene.node}
              decision={scene.decision}
              isActive={index === activeScene}
              activeLine={index === activeScene ? activeLine : -1}
              activeWord={narration.activeWord}
              onCardLayout={(at, y) => cardTops.current.set(at, y)}
              onTextLayout={(at, y) => textTops.current.set(at, y)}
              onLineLayout={(at, line, y, height) =>
                lineBoxes.current.set(`${at}:${line}`, { y, height })
              }
            />
          ))}

          {scenes.length === 0 ? (
            <View
              className="gap-2 rounded-3xl p-5"
              style={{
                backgroundColor: palette.panel,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <Body weight="medium" className="text-[16px] leading-6">
                There is no finished playthrough on this device yet.
              </Body>
              <Body className="text-muted text-[15px] leading-6">
                Read the story to the end and your decisions show up here.
              </Body>
            </View>
          ) : null}

          <View className="pt-2">
            <ActionButton
              label="Read it again from the start"
              icon={RotateCcw}
              variant="secondary"
              onPress={() => {
                narration.stop();
                restart();
                router.replace({ pathname: '/reader/[id]', params: { id } });
              }}
            />
          </View>
        </ScrollView>

        {scenes.length > 0 ? (
          <View className="pb-safe-offset-3 px-4 pt-1">
            <View
              className="gap-2.5 rounded-3xl px-4 py-3"
              style={{ backgroundColor: palette.panelReading }}
            >
              <View className="flex-row items-center gap-3">
                <Mono className="flex-1 text-[10px] tracking-[2px] uppercase">{status}</Mono>
                {narration.isPlaying || activeScene >= 0 ? (
                  <IconButton
                    tone="surface"
                    accessibilityLabel="Stop the reading"
                    onPress={narration.stop}
                  >
                    <Square size={14} color={palette.foreground} />
                  </IconButton>
                ) : null}
              </View>

              <ActionButton
                label={
                  narration.isPlaying
                    ? 'Pause the reading'
                    : narration.hasAudio
                      ? 'Read the whole story to me'
                      : 'Preparing the voices…'
                }
                icon={narration.isPlaying ? Pause : Play}
                disabled={!narration.hasAudio}
                onPress={narration.toggle}
              />
            </View>
          </View>
        ) : null}
      </View>
    </StoryBackdrop>
  );
}
