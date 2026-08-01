import { View } from 'react-native';

import { palette } from '@/lib/theme';
import { Display } from '@/components/ui/Display';
import { Circle, Path, Svg } from '@/components/ui/primitives/Svg';

interface ForkloreMarkProps {
  /** Icon edge length; the wordmark scales with it. */
  size?: number;
}

/**
 * The app mark: one stem dot that forks into two, the left branch amber and the
 * right violet-blue — the same two colours every choice in a story is coded
 * with. Drawn rather than assembled from views so the curves read at any size.
 */
export function ForkloreMark({ size = 24 }: ForkloreMarkProps) {
  return (
    <View className="flex-row items-center gap-2.5">
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="M12 17.9 C 12 13.2 9.6 9.4 6.2 6.4"
          stroke={palette.pathA}
          strokeWidth={2.1}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M12 17.9 C 12 13.2 14.4 9.4 17.8 6.4"
          stroke={palette.pathB}
          strokeWidth={2.1}
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx={4.6} cy={4.6} r={2.6} fill={palette.pathA} />
        <Circle cx={19.4} cy={4.6} r={2.6} fill={palette.pathB} />
        <Circle cx={12} cy={20.1} r={2.6} fill={palette.foreground} />
      </Svg>
      <Display
        weight="medium"
        style={{ fontSize: size * 0.82, lineHeight: size * 1.02, letterSpacing: 0.2 }}
      >
        Forklore
      </Display>
    </View>
  );
}
