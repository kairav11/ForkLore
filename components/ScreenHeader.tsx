import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'heroui-native';
import { ChevronLeft } from 'lucide-react-native';

import { palette } from '@/lib/theme';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

/** Compact top bar shared by the secondary screens. */
export function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  return (
    <View className="h-12 flex-row items-center justify-between gap-2">
      <View className="flex-1 flex-row items-center gap-1">
        {onBack ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-11 w-11 px-0"
            accessibilityLabel="Go back"
            onPress={onBack}
          >
            <ChevronLeft size={22} color={palette.foreground} />
          </Button>
        ) : null}
        <Text className="text-muted flex-1 text-xs font-semibold tracking-[3px] uppercase">
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}
