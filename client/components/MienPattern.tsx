import React, { memo } from "react";
import Svg, { Rect, Circle, G, Line } from "react-native-svg";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

interface MienSymbolProps {
  size: number;
  color?: string;
}

/**
 * MienSymbol - Single elegant traditional symbol
 * Simplified cross-stitch inspired motif
 */
export const MienSymbol = memo(function MienSymbol({
  size,
  color,
}: MienSymbolProps) {
  const { isDark } = useTheme();
  const fillColor = color || (isDark ? Colors.dark.primary : Colors.light.primary);
  const unit = size / 8;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G>
        {/* Top horizontal bar */}
        <Rect x={unit} y={unit} width={size - unit * 2} height={unit} fill={fillColor} />
        {/* Left top vertical */}
        <Rect x={unit} y={unit} width={unit} height={unit * 2} fill={fillColor} />
        {/* Right top vertical */}
        <Rect x={size - unit * 2} y={unit} width={unit} height={unit * 2} fill={fillColor} />
        {/* Center vertical stem */}
        <Rect x={size / 2 - unit / 2} y={unit * 2} width={unit} height={size - unit * 4} fill={fillColor} />
        {/* Left bottom vertical */}
        <Rect x={unit} y={size - unit * 3} width={unit} height={unit * 2} fill={fillColor} />
        {/* Right bottom vertical */}
        <Rect x={size - unit * 2} y={size - unit * 3} width={unit} height={unit * 2} fill={fillColor} />
        {/* Bottom horizontal bar */}
        <Rect x={unit} y={size - unit * 2} width={size - unit * 2} height={unit} fill={fillColor} />
      </G>
    </Svg>
  );
});

interface SimpleDividerProps {
  width: number;
  color?: string;
}

/**
 * SimpleDivider - Clean horizontal line
 */
export const SimpleDivider = memo(function SimpleDivider({
  width,
  color,
}: SimpleDividerProps) {
  const { isDark } = useTheme();
  const lineColor = color || (isDark ? Colors.dark.primary : Colors.light.primary);

  return (
    <Svg width={width} height={2} viewBox={`0 0 ${width} 2`}>
      <Rect x={0} y={0} width={width} height={2} fill={lineColor} />
    </Svg>
  );
});

interface CentralMotifProps {
  size: number;
  color?: string;
}

/**
 * CentralMotif - Elegant centered symbol with ring
 */
export const CentralMotif = memo(function CentralMotif({
  size,
  color,
}: CentralMotifProps) {
  const { isDark } = useTheme();
  const fillColor = color || (isDark ? Colors.dark.primary : Colors.light.primary);
  const center = size / 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Outer ring */}
      <Circle
        cx={center}
        cy={center}
        r={size * 0.4}
        fill="none"
        stroke={fillColor}
        strokeWidth={2}
      />
      {/* Inner filled circle */}
      <Circle
        cx={center}
        cy={center}
        r={size * 0.15}
        fill={fillColor}
      />
    </Svg>
  );
});

interface PatternRowProps {
  width: number;
  color?: string;
}

/**
 * PatternRow - Simple repeating symbol row
 */
export const PatternRow = memo(function PatternRow({
  width,
  color,
}: PatternRowProps) {
  const { isDark } = useTheme();
  const fillColor = color || (isDark ? Colors.dark.primary : Colors.light.primary);

  const symbolSize = 12;
  const spacing = 40;
  const height = symbolSize + 8;
  const elements: React.ReactNode[] = [];

  for (let x = spacing / 2; x < width; x += spacing) {
    const cx = x;
    const cy = height / 2;
    const s = symbolSize / 2;

    // Simple diamond shape
    elements.push(
      <G key={x}>
        <Rect
          x={cx - s / 2}
          y={cy - s}
          width={s}
          height={s}
          fill={fillColor}
          transform={`rotate(45 ${cx} ${cy})`}
        />
      </G>
    );
  }

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {elements}
    </Svg>
  );
});

// Legacy exports for compatibility
export const MienMandala = CentralMotif;
export const PatternBand = PatternRow;
export const DecorativeLine = SimpleDivider;
export const CornerOrnament = () => null;
export const SmallDiamondsRow = () => null;
export const Diamond = MienSymbol;
export const Cross = MienSymbol;
export const SteppedDiamond = MienSymbol;
