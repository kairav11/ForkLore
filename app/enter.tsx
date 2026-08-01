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
import { ClipboardPaste, DoorOpen } from 'lucide-react-native';

import { errorMessage, getStory } from '@/lib/api';
import { parseShareInput } from '@/lib/share';
import { useStoryStore } from '@/lib/storyStore';
import { palette } from '@/lib/theme';
import { GlowBackground } from '@/components/GlowBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Display } from '@/components/ui/Display';

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
    <GlowBackground>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-safe-offset-2 pb-10 gap-7"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title="Shared story" onBack={() => router.back()} />

          <View className="gap-3">
            <Display className="text-[34px] leading-[42px]">Read your friend&apos;s story</Display>
            <Text className="text-muted text-base leading-7">
              Same setting, same scenes — your own decisions. At the end you find out how closely
              the two of you matched.
            </Text>
          </View>

          <TextField isInvalid={error !== null}>
            <Label className="text-base">Story code or link</Label>
            <Input
              value={input}
              onChangeText={(text) => {
                setInput(text);
                if (error) setError(null);
              }}
              placeholder="8FJ3KD"
              autoCapitalize="characters"
              autoCorrect={false}
              className="h-14 rounded-2xl text-xl tracking-[3px]"
              onSubmitEditing={() => void openStory()}
            />
            {error ? (
              <FieldError>{error}</FieldError>
            ) : (
              <Description>Paste the whole link too — we will find the code in it.</Description>
            )}
          </TextField>

          <View className="gap-2">
            <Button
              size="lg"
              className="h-14 rounded-2xl"
              isDisabled={isOpening}
              onPress={() => void openStory()}
            >
              {isOpening ? (
                <Spinner size="sm" color={palette.accentForeground} />
              ) : (
                <DoorOpen size={20} color={palette.accentForeground} />
              )}
              <Button.Label className="text-lg font-semibold">
                {isOpening ? 'Opening story…' : 'Open Story'}
              </Button.Label>
            </Button>
            <Button size="md" variant="ghost" onPress={() => void pasteFromClipboard()}>
              <ClipboardPaste size={16} color={palette.muted} />
              <Button.Label className="text-muted text-base">Paste from clipboard</Button.Label>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GlowBackground>
  );
}
