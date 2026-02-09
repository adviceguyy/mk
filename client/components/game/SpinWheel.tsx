import React, { useRef, useCallback } from "react";
import { View, Pressable, Animated, StyleSheet, Platform } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";

const SEGMENTS = [
  { value: 300, label: "300", color: "#E74C3C" },
  { value: 500, label: "500", color: "#3498DB" },
  { value: 100, label: "100", color: "#2ECC71" },
  { value: 800, label: "800", color: "#9B59B6" },
  { value: -1, label: "BANKRUPT", color: "#1A1A2E" },
  { value: 400, label: "400", color: "#E67E22" },
  { value: 1000, label: "1000", color: "#1ABC9C" },
  { value: 200, label: "200", color: "#F39C12" },
  { value: 1500, label: "1500", color: "#E91E63" },
  { value: 0, label: "LOSE\nTURN", color: "#607D8B" },
  { value: 600, label: "600", color: "#00BCD4" },
  { value: 250, label: "250", color: "#8BC34A" },
];

const WHEEL_SIZE = 280;
const RADIUS = WHEEL_SIZE / 2;
const CENTER = RADIUS;

interface SpinWheelProps {
  onSpinResult: (value: number) => void;
  disabled?: boolean;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

export default function SpinWheel({ onSpinResult, disabled }: SpinWheelProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);
  const spinning = useRef(false);

  const handleSpin = useCallback(() => {
    if (spinning.current || disabled) return;
    spinning.current = true;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    // Random segment index
    const segmentIndex = Math.floor(Math.random() * SEGMENTS.length);
    const segmentAngle = 360 / SEGMENTS.length;
    // Land in the middle of the chosen segment
    const targetSegmentCenter = segmentIndex * segmentAngle + segmentAngle / 2;
    // Add extra full rotations for spin effect
    const extraRotations = 5 + Math.floor(Math.random() * 3);
    const totalDegrees = extraRotations * 360 + (360 - targetSegmentCenter);

    const startRotation = currentRotation.current;
    const endRotation = startRotation + totalDegrees;

    spinAnim.setValue(0);

    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 3500,
      useNativeDriver: true,
    }).start(() => {
      currentRotation.current = endRotation % 360;
      spinning.current = false;

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      onSpinResult(SEGMENTS[segmentIndex].value);
    });
  }, [disabled, onSpinResult, spinAnim]);

  const rotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      `${currentRotation.current}deg`,
      `${currentRotation.current + 360 * 6}deg`,
    ],
  });

  const segmentAngle = 360 / SEGMENTS.length;

  return (
    <View style={styles.container}>
      {/* Pointer */}
      <View style={styles.pointer} pointerEvents="none">
        <View style={styles.pointerTriangle} />
      </View>

      <Pressable onPress={handleSpin} disabled={disabled}>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
            <G>
              {SEGMENTS.map((seg, i) => {
                const startAngle = i * segmentAngle;
                const endAngle = startAngle + segmentAngle;
                const midAngle = startAngle + segmentAngle / 2;
                const labelR = RADIUS * 0.65;
                const labelPos = polarToCartesian(CENTER, CENTER, labelR, midAngle);

                return (
                  <G key={i}>
                    <Path
                      d={describeArc(CENTER, CENTER, RADIUS - 2, startAngle, endAngle)}
                      fill={seg.color}
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                    />
                    <SvgText
                      x={labelPos.x}
                      y={labelPos.y}
                      fill="#FFFFFF"
                      fontSize={seg.value === -1 || seg.value === 0 ? 8 : 12}
                      fontWeight="bold"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      rotation={midAngle}
                      origin={`${labelPos.x}, ${labelPos.y}`}
                    >
                      {seg.label}
                    </SvgText>
                  </G>
                );
              })}
            </G>
          </Svg>
        </Animated.View>
      </Pressable>

      {/* Center button */}
      <View style={styles.centerButton} pointerEvents="none">
        <ThemedText style={styles.centerText}>
          {disabled ? "..." : "SPIN"}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pointer: {
    position: "absolute",
    top: -8,
    zIndex: 10,
    alignItems: "center",
  },
  pointerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 20,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#C4942A",
  },
  centerButton: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#C4942A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  centerText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
});
