import { useState } from 'react';
import { Share, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Text } from 'heroui-native';
import { Check, ChevronLeft, Copy, Link2, Share2 } from 'lucide-react-native';

import { shareCodeFor, shareLinkFor } from '@/lib/share';
import { palette } from '@/lib/theme';
import { useEnsureStory } from '@/hooks/useEnsureStory';
import { ErrorState, LoadingState } from '@/components/StoryStatus';

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
    return <LoadingState title="Preparing your share code..." />;
  }

  const code = shareCodeFor(story);
  const link = shareLinkFor(story);

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
    <View className="bg-background pt-safe-offset-3 pb-safe-offset-5 flex-1 px-5">
      <View className="flex-row items-center gap-2 pb-4">
        <Button
          size="sm"
          variant="ghost"
          className="h-11 w-11 px-0"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
        >
          <ChevronLeft size={22} color={palette.foreground} />
        </Button>
        <Text className="text-foreground text-lg font-semibold">Share this story</Text>
      </View>

      <View className="flex-1 justify-center gap-6">
        <View className="gap-2">
          <Text.Heading type="h2" className="text-3xl leading-tight">
            Send it to a friend
          </Text.Heading>
          <Text.Paragraph color="muted" className="text-base leading-6">
            They read the same story and make their own decisions. When they finish, you both get a
            match score.
          </Text.Paragraph>
        </View>

        <Card className="gap-4 p-5">
          <View className="gap-1">
            <Text className="text-muted text-sm font-semibold tracking-widest uppercase">
              Story code
            </Text>
            <Text selectable className="text-accent text-3xl font-bold tracking-widest">
              {code}
            </Text>
          </View>
          <Button size="md" variant="secondary" onPress={() => void copy('code')}>
            {copied === 'code' ? (
              <Check size={18} color={palette.accent} />
            ) : (
              <Copy size={18} color={palette.foreground} />
            )}
            <Button.Label className="text-base">
              {copied === 'code' ? 'Code copied' : 'Copy code'}
            </Button.Label>
          </Button>
        </Card>

        <Card className="gap-4 p-5">
          <View className="gap-1">
            <Text className="text-muted text-sm font-semibold tracking-widest uppercase">
              Story link
            </Text>
            <Text selectable className="text-foreground text-base leading-6">
              {link}
            </Text>
          </View>
          <Button size="md" variant="secondary" onPress={() => void copy('link')}>
            {copied === 'link' ? (
              <Check size={18} color={palette.accent} />
            ) : (
              <Link2 size={18} color={palette.foreground} />
            )}
            <Button.Label className="text-base">
              {copied === 'link' ? 'Link copied' : 'Copy link'}
            </Button.Label>
          </Button>
        </Card>
      </View>

      <Button size="lg" onPress={() => void openShareSheet()}>
        <Share2 size={20} color={palette.accentForeground} />
        <Button.Label className="text-lg">Share This Story</Button.Label>
      </Button>
    </View>
  );
}
