import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import {
  Button,
  Description,
  FieldError,
  Input,
  Label,
  Spinner,
  Text,
  TextField,
} from 'heroui-native';
import { ChevronLeft, ClipboardPaste, DoorOpen } from 'lucide-react-native';

import { errorMessage, getStory } from '@/lib/api';
import { parseShareInput } from '@/lib/share';
import { useStoryStore } from '@/lib/storyStore';
import { palette } from '@/lib/theme';

export default function EnterSharedStoryScreen() {
  const router = useRouter();
  const loadStory = useStoryStore((state) => state.loadStory);

  const [input, setInput] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openStory = async () => {
    const code = parseShareInput(input);
    if (!code) {
      setError('Paste the story code or link your friend sent you.');
      return;
    }

    setError(null);
    setIsOpening(true);
    try {
      const story = await getStory(code);
      loadStory(story, 'shared');
      router.replace({ pathname: '/reader/[id]', params: { id: story.id, mode: 'shared' } });
    } catch (cause) {
      setError(errorMessage(cause));
      setIsOpening(false);
    }
  };

  const pasteFromClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    if (text.trim().length > 0) {
      setInput(text.trim());
      setError(null);
    }
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-safe-offset-3 pb-10 gap-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-11 w-11 px-0"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
          >
            <ChevronLeft size={22} color={palette.foreground} />
          </Button>
          <Text className="text-foreground text-lg font-semibold">Enter a shared story</Text>
        </View>

        <View className="gap-2">
          <Text.Heading type="h2" className="text-3xl leading-tight">
            Read your friend&apos;s story
          </Text.Heading>
          <Text.Paragraph color="muted" className="text-base leading-6">
            Make your own decisions, then see how closely you matched.
          </Text.Paragraph>
        </View>

        <TextField isInvalid={error !== null}>
          <Label className="text-lg">Story code or link</Label>
          <Input
            value={input}
            onChangeText={(text) => {
              setInput(text);
              if (error) setError(null);
            }}
            placeholder="e.g. 8FJ3KD or storybranch://story/8FJ3KD"
            autoCapitalize="characters"
            autoCorrect={false}
            className="h-14 text-lg"
            onSubmitEditing={() => void openStory()}
          />
          {error ? (
            <FieldError>{error}</FieldError>
          ) : (
            <Description>Paste the whole link — we will find the code in it.</Description>
          )}
        </TextField>

        <View className="gap-3">
          <Button size="lg" isDisabled={isOpening} onPress={() => void openStory()}>
            {isOpening ? (
              <Spinner size="sm" color={palette.accentForeground} />
            ) : (
              <DoorOpen size={20} color={palette.accentForeground} />
            )}
            <Button.Label className="text-lg">
              {isOpening ? 'Opening story...' : 'Open Story'}
            </Button.Label>
          </Button>
          <Button size="lg" variant="ghost" onPress={() => void pasteFromClipboard()}>
            <ClipboardPaste size={18} color={palette.muted} />
            <Button.Label className="text-base">Paste from clipboard</Button.Label>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
