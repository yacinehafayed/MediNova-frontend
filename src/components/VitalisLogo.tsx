
import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  G,
  Circle,
} from 'react-native-svg';

type Props = {
  size?: number;
};

export default function VitalisLogo({ size = 100 }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
    >
      <Defs>
        <LinearGradient
          id="background"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <Stop offset="0%" stopColor="#062F2B" />
          <Stop offset="55%" stopColor="#041E20" />
          <Stop offset="100%" stopColor="#001413" />
        </LinearGradient>

        <LinearGradient
          id="border"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <Stop offset="0%" stopColor="#6EFFE0" />
          <Stop offset="50%" stopColor="#10B981" />
          <Stop offset="100%" stopColor="#047857" />
        </LinearGradient>

        <LinearGradient
          id="ribbon"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <Stop offset="0%" stopColor="#99FFE4" />
          <Stop offset="35%" stopColor="#22D3B1" />
          <Stop offset="70%" stopColor="#059669" />
          <Stop offset="100%" stopColor="#064E46" />
        </LinearGradient>

        <LinearGradient
          id="cross"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#A7F3D0" />
        </LinearGradient>
      </Defs>


      <Rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="27"
        fill="url(#background)"
      />


      <Rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="27"
        fill="none"
        stroke="url(#border)"
        strokeWidth="1.2"
      />


      <Path
        d="
          M 19 29
          L 31 29
          L 48 58
          Q 50 62 53 58
          L 72 31
          L 82 31
          L 58 69
          Q 51 80 44 68
          Z
        "
        fill="url(#ribbon)"
      />


      <Path
        d="
          M 45 16
          Q 45 14 47 14
          L 53 14
          Q 55 14 55 16
          L 55 21
          L 60 21
          Q 62 21 62 23
          L 62 28
          Q 62 30 60 30
          L 55 30
          L 55 35
          Q 55 37 53 37
          L 47 37
          Q 45 37 45 35
          L 45 30
          L 40 30
          Q 38 30 38 28
          L 38 23
          Q 38 21 40 21
          L 45 21
          Z
        "
        fill="url(#cross)"
      />


      <Path
        d="
          M 15 53
          L 28 53
          L 34 48
          L 39 59
          L 46 43
          L 51 53
          L 61 53
          L 67 47
          L 73 53
          L 85 53
        "
        fill="none"
        stroke="#A7F3D0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />


      <Circle
        cx="50"
        cy="53"
        r="1.5"
        fill="#FFFFFF"
      />
    </Svg>
  );
}
