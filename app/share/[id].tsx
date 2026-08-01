import { useState } from 'react';
import { Share, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Text } from 'heroui-native';
import { Check, Copy, Link2, Share2 } from 'lucide-react-native';

import { shareCodeFor, shareLinkFor } from '@/lib/share';
import { palette } from '@/lib/theme';
import { useEnsureStory } from '@/hooks/useEnsureStory';
import { GlowBackground } from '@/components/GlowBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ErrorState, LoadingState } from '@/components/StoryStatus';
import { Display } from '@/components/ui/Display';

type CopyTarget = 'code' | 'link' | null;

export default function ShareScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { story, error } = useEnsureStory(id);
  const [copied, setCopied] = useState<CopyTarget>(null);

  if (error) {
    return (
      <ErrorState
        title="We could not build a share code"
        message={error}
        actionLabel="Go back"
        onAction={() => router.back()}
      />
    );
  }

  if (!story) {
    return <LoadingState title="Preparing your share code…" />;
  }

  const code = shareCodeFor(story);
  const link = shareLinkFor(story);
  const codeTiles = code.split('').map((character, index) => ({
    id: `${index}-${character}`,
    character,
  }));

  const copy = async (target: Exclude<CopyTarget, null>) => {
    await Clipboard.setStringAsync(target === 'code' ? code : link);
    setCopied(target);
  };

  const openShareSheet = async () => {
    await Share.share({
      message: `Read my StoryBranch story and make your own choices: ${link}\n\nOr enter the code: ${code}`,
    });
  };

  return (
    <GlowBackground>
      <View className="pt-safe-offset-2 pb-safe-offset-5 flex-1 px-5">
        <ScreenHeader title="Share" onBack={() => router.back()} />

        <View className="flex-1 justify-center gap-8">
          <View className="gap-3">
            <Display className="text-[34px] leading-[42px]">Send it to a friend</Display>
            <Text className="text-muted text-base leading-7">
              They read the same story and make their own decisions. When they finish, you both see
              how closely you matched.
            </Text>
          </View>

          <View className="items-center gap-4">
            <Text className="text-muted text-[11px] font-bold tracking-[4px] uppercase">
              Story code
            </Text>
            <View className="flex-row gap-2">
              {codeTiles.map((tile) => (
                <View
                  key={tile.id}
                  className="border-accent/35 h-14 w-11 items-center justify-center rounded-xl border"
                  style={{ backgroundColor: palette.accentSoft }}
                >
                  <Display className="text-accent text-2xl">{tile.character}</Display>
                </View>
              ))}
            </View>
            <Button
              size="sm"
              variant="tertiary"
              className="border-border/70 h-11 rounded-full border px-4"
              onPress={() => void copy('code')}
            >
              {copied === 'code' ? (
                <Check size={16} color={palette.accent} />
              ) : (
                <Copy size={16} color={palette.foreground} />
              )}
              <Button.Label className="text-sm font-semibold">
                {copied === 'code' ? 'Code copied' : 'Copy code'}
              </Button.Label>
            </Button>
          </View>

          <View className="border-border/60 gap-3 rounded-3xl border p-5">
            <Text className="text-muted text-[11px] font-bold tracking-[4px] uppercase">
              Story link
            </Text>
            <Text selectable className="text-foreground text-base leading-6">
              {link}
            </Text>
            <Button
              size="sm"
              variant="tertiary"
              className="h-11 self-start rounded-full px-4"
              onPress={() => void copy('link')}
            >
              {copied === 'link' ? (
                <Check size={16} color={palette.accent} />
              ) : (
                <Link2 size={16} color={palette.foreground} />
              )}
              <Button.Label className="text-sm font-semibold">
                {copied === 'link' ? 'Link copied' : 'Copy link'}
              </Button.Label>
            </Button>
          </View>
        </View>

        <Button size="lg" className="h-14 rounded-2xl" onPress={() => void openShareSheet()}>
          <Share2 size={20} color={palette.accentForeground} />
          <Button.Label className="text-lg font-semibold">Share This Story</Button.Label>
        </Button>
      </View>
    </GlowBackground>
  );
}
