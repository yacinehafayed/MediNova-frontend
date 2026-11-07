import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn, ZoomIn } from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle | ViewStyle[];
  animation?: 'down' | 'up' | 'fade' | 'zoom';
}

export default function AnimatedView({ children, delay = 0, style, animation = 'down' }: Props) {
  let entering;

  switch (animation) {
    case 'up': entering = FadeInUp.delay(delay).duration(350); break;
    case 'fade': entering = FadeIn.delay(delay).duration(600); break;
    case 'zoom': entering = ZoomIn.delay(delay).duration(350); break;
    default: entering = FadeInDown.delay(delay).duration(350);
  }

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}