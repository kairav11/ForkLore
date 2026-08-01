import { View } from 'react-native';
import { Button, Spinner, Text } from 'heroui-native';

interface LoadingStateProps {
  title: string;
  detail?: string;
}

export function LoadingState({ title, detail }: LoadingStateProps) {
  return (
    <View className="bg-background flex-1 items-center justify-center gap-5 px-8">
      <Spinner size="lg" />
      <Text.Heading type="h3" align="center">
        {title}
      </Text.Heading>
      {detail ? (
        <Text.Paragraph align="center" color="muted" className="text-base">
          {detail}
        </Text.Paragraph>
      ) : null}
    </View>
  );
}

interface ErrorStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function ErrorState({
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: ErrorStateProps) {
  return (
    <View className="bg-background flex-1 items-center justify-center gap-4 px-8">
      <Text.Heading type="h3" align="center">
        {title}
      </Text.Heading>
      <Text.Paragraph align="center" color="muted" className="text-base leading-6">
        {message}
      </Text.Paragraph>
      <View className="mt-2 w-full gap-3">
        {actionLabel && onAction ? (
          <Button size="lg" onPress={onAction}>
            {actionLabel}
          </Button>
        ) : null}
        {secondaryLabel && onSecondary ? (
          <Button size="lg" variant="tertiary" onPress={onSecondary}>
            {secondaryLabel}
          </Button>
        ) : null}
      </View>
    </View>
  );
}
