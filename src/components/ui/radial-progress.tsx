import { useEffect, type ReactNode } from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * A circular progress ring (SVG). Renders a muted track + a colored arc that
 * fills clockwise from the top to `value`%, with `children` centered inside
 * (e.g. a percentage label). Colors are passed in as resolved values because
 * SVG components don't read `className` — use `useCSSVariable` at the call site.
 */
export function RadialProgress({
  value,
  color,
  trackColor,
  size = 120,
  strokeWidth = 12,
  children,
}: {
  /** 0–100; clamped. */
  value: number;
  /** Progress arc color (resolved, e.g. from useCSSVariable). */
  color: string;
  /** Track color (resolved). */
  trackColor: string;
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(clamped / 100, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
    >
      {/* Rotate the whole canvas so the arc starts at 12 o'clock. The overlaid
          children sit outside the Svg, so they stay upright. */}
      <Svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
      </Svg>
      {children}
    </View>
  );
}
