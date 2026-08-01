import type { ReactNode } from 'react';
import { View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

import { palette } from '@/lib/theme';
import { Mono } from '@/components/ui/Text';
import { IconButton } from '@/components/ui/IconButton';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

/** Compact top bar shared by the secondary screens. */
export function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  return (
    <View className="h-12 flex-row items-center gap-3">
      {onBack ? (
        <IconButton tone="surface" accessibilityLabel="Go back" onPress={onBack}>
          <ChevronLeft size={20} color={palette.foreground} />
        </IconButton>
      ) : null}
      <Mono className="flex-1 text-[11px] tracking-[3px] uppercase">{title}</Mono>
      {right}
    </View>
  );
}
