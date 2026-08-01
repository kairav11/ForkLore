import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { ClipboardPaste, DoorOpen } from 'lucide-react-native';

import { errorMessage, getStory } from '@/lib/api';
import { parseShareInput } from '@/lib/share';
import { useStoryStore } from '@/lib/storyStore';
import { FieldCard } from '@/components/FieldCard';
import { GlowBackground } from '@/components/GlowBackground';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { Display } from '@/components/ui/Display';
import { FieldInput } from '@/components/ui/FieldInput';
import { Body } from '@/components/ui/Text';

export default function EnterSharedStoryScreen() {
  const router = useRouter();
  const loadStory = useStoryStore((state) => state.loadStory);

  const [input, setInput] = useState('');
  const [isFocused, setFocused] = useState(false);
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
            <Display className="text-[34px] leading-[40px]">Read your friend&apos;s story</Display>
            <Body className="text-muted text-[15px] leading-7">
              Same setting, same scenes — your own decisions. At the end you find out how closely
              the two of you matched.
            </Body>
          </View>

          <FieldCard
            label="Story code or link"
            isActive={isFocused}
            error={error}
            hint="Paste the whole link too — we will find the code in it."
          >
            <FieldInput
              value={input}
              onChangeText={(text) => {
                setInput(text);
                if (error) setError(null);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="8FJ3KD"
              variant="code"
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={() => void openStory()}
            />
          </FieldCard>

          <View className="gap-1">
            <ActionButton
              label={isOpening ? 'Opening story…' : 'Open story'}
              icon={DoorOpen}
              disabled={isOpening}
              onPress={() => void openStory()}
            />
            <ActionButton
              label="Paste from clipboard"
              variant="ghost"
              icon={ClipboardPaste}
              onPress={() => void pasteFromClipboard()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GlowBackground>
  );
}
