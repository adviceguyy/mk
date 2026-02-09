import React, { memo } from "react";
import Svg, {
  Circle,
  Rect,
  Path,
  Line,
  Polygon,
  Ellipse,
  G,
} from "react-native-svg";

export interface SvgArtProps {
  size?: number;
}

// ─── Nature ───────────────────────────────────────────────

const Sun = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx={50} cy={50} r={22} fill="#FFD700" />
    <Line x1={50} y1={5} x2={50} y2={20} stroke="#FF8C00" strokeWidth={3} strokeLinecap="round" />
    <Line x1={50} y1={80} x2={50} y2={95} stroke="#FF8C00" strokeWidth={3} strokeLinecap="round" />
    <Line x1={5} y1={50} x2={20} y2={50} stroke="#FF8C00" strokeWidth={3} strokeLinecap="round" />
    <Line x1={80} y1={50} x2={95} y2={50} stroke="#FF8C00" strokeWidth={3} strokeLinecap="round" />
    <Line x1={18} y1={18} x2={28} y2={28} stroke="#FF8C00" strokeWidth={3} strokeLinecap="round" />
    <Line x1={72} y1={72} x2={82} y2={82} stroke="#FF8C00" strokeWidth={3} strokeLinecap="round" />
    <Line x1={82} y1={18} x2={72} y2={28} stroke="#FF8C00" strokeWidth={3} strokeLinecap="round" />
    <Line x1={28} y1={72} x2={18} y2={82} stroke="#FF8C00" strokeWidth={3} strokeLinecap="round" />
  </Svg>
));

const Moon = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx={50} cy={50} r={30} fill="#F5E6A3" />
    <Circle cx={65} cy={40} r={25} fill="#1a1a2e" />
    <Circle cx={40} cy={42} r={3} fill="#E8D88E" opacity={0.6} />
    <Circle cx={48} cy={60} r={2} fill="#E8D88E" opacity={0.5} />
  </Svg>
));

const Star = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Polygon
      points="50,10 61,40 93,40 67,58 76,90 50,72 24,90 33,58 7,40 39,40"
      fill="#FFD700"
      stroke="#DAA520"
      strokeWidth={2}
    />
  </Svg>
));

const Tree = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={44} y={60} width={12} height={30} fill="#8B4513" rx={2} />
    <Circle cx={50} cy={38} r={28} fill="#228B22" />
    <Circle cx={35} cy={45} r={18} fill="#2E8B57" />
    <Circle cx={65} cy={45} r={18} fill="#2E8B57" />
    <Circle cx={50} cy={28} r={16} fill="#32CD32" opacity={0.7} />
  </Svg>
));

const Water = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M10 50 Q25 40, 40 50 T70 50 T100 50 V90 H10 Z" fill="#4169E1" />
    <Path d="M10 60 Q25 50, 40 60 T70 60 T100 60 V90 H10 Z" fill="#1E90FF" />
    <Path d="M10 70 Q25 60, 40 70 T70 70 T100 70 V90 H10 Z" fill="#00BFFF" />
  </Svg>
));

const Mountain = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Polygon points="50,15 90,85 10,85" fill="#6B7B3A" />
    <Polygon points="50,15 60,35 40,35" fill="#FFFFFF" />
    <Polygon points="70,40 95,85 50,85" fill="#556B2F" opacity={0.6} />
  </Svg>
));

const Fire = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M50 10 C60 30, 80 40, 75 65 C75 85, 25 85, 25 65 C20 40, 40 30, 50 10Z" fill="#FF4500" />
    <Path d="M50 30 C55 42, 68 50, 65 65 C65 80, 35 80, 35 65 C32 50, 45 42, 50 30Z" fill="#FF8C00" />
    <Path d="M50 50 C53 55, 60 60, 58 68 C58 78, 42 78, 42 68 C40 60, 47 55, 50 50Z" fill="#FFD700" />
  </Svg>
));

const Rain = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse cx={50} cy={30} rx={30} ry={18} fill="#778899" />
    <Circle cx={30} cy={35} r={14} fill="#778899" />
    <Circle cx={70} cy={35} r={14} fill="#778899" />
    <Line x1={30} y1={55} x2={26} y2={70} stroke="#4169E1" strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={45} y1={55} x2={41} y2={70} stroke="#4169E1" strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={60} y1={55} x2={56} y2={70} stroke="#4169E1" strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={38} y1={72} x2={34} y2={85} stroke="#4169E1" strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={53} y1={72} x2={49} y2={85} stroke="#4169E1" strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
));

const Cloud = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx={35} cy={55} r={20} fill="#E8E8E8" />
    <Circle cx={55} cy={45} r={24} fill="#F0F0F0" />
    <Circle cx={70} cy={55} r={18} fill="#E8E8E8" />
    <Rect x={20} y={55} width={65} height={18} fill="#ECECEC" rx={8} />
  </Svg>
));

const Flower = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Line x1={50} y1={55} x2={50} y2={92} stroke="#228B22" strokeWidth={4} strokeLinecap="round" />
    <Ellipse cx={38} cy={82} rx={12} ry={5} fill="#228B22" transform="rotate(-30,38,82)" />
    <Circle cx={50} cy={35} r={10} fill="#FF1493" />
    <Circle cx={40} cy={45} r={10} fill="#FF69B4" />
    <Circle cx={60} cy={45} r={10} fill="#FF69B4" />
    <Circle cx={37} cy={32} r={10} fill="#FF69B4" />
    <Circle cx={63} cy={32} r={10} fill="#FF1493" />
    <Circle cx={50} cy={38} r={7} fill="#FFD700" />
  </Svg>
));

// ─── Animals ──────────────────────────────────────────────

const Fish = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse cx={48} cy={50} rx={28} ry={16} fill="#4682B4" />
    <Polygon points="75,50 95,35 95,65" fill="#4682B4" />
    <Circle cx={35} cy={46} r={4} fill="#FFFFFF" />
    <Circle cx={36} cy={45} r={2} fill="#000000" />
    <Path d="M45 42 Q55 50, 45 58" stroke="#5F9EA0" strokeWidth={1.5} fill="none" />
    <Path d="M52 42 Q62 50, 52 58" stroke="#5F9EA0" strokeWidth={1.5} fill="none" />
  </Svg>
));

const Bird = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse cx={50} cy={55} rx={22} ry={15} fill="#E74C3C" />
    <Circle cx={38} cy={42} r={12} fill="#E74C3C" />
    <Circle cx={35} cy={40} r={3} fill="#FFFFFF" />
    <Circle cx={35} cy={40} r={1.5} fill="#000000" />
    <Polygon points="23,42 15,38 23,45" fill="#FF8C00" />
    <Polygon points="70,50 85,40 80,55" fill="#C0392B" />
    <Line x1={42} y1={68} x2={42} y2={82} stroke="#FF8C00" strokeWidth={2.5} />
    <Line x1={55} y1={68} x2={55} y2={82} stroke="#FF8C00" strokeWidth={2.5} />
  </Svg>
));

const Chicken = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse cx={50} cy={58} rx={24} ry={20} fill="#F5DEB3" />
    <Circle cx={42} cy={35} r={14} fill="#F5DEB3" />
    <Circle cx={37} cy={32} r={3} fill="#000000" />
    <Polygon points="25,35 15,33 25,38" fill="#FF8C00" />
    <Path d="M42 21 Q45 12, 48 21" fill="#FF0000" />
    <Path d="M38 21 Q41 14, 44 21" fill="#FF0000" />
    <Path d="M28,40 Q30,48 28,45" fill="#FF0000" />
    <Polygon points="70,55 85,48 80,60" fill="#D2B48C" />
    <Line x1={40} y1={76} x2={38} y2={90} stroke="#FF8C00" strokeWidth={2.5} />
    <Line x1={55} y1={76} x2={53} y2={90} stroke="#FF8C00" strokeWidth={2.5} />
  </Svg>
));

const Pig = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse cx={50} cy={55} rx={30} ry={22} fill="#FFB6C1" />
    <Circle cx={50} cy={40} r={18} fill="#FFB6C1" />
    <Ellipse cx={50} cy={48} rx={10} ry={7} fill="#FF69B4" />
    <Circle cx={46} cy={47} r={2} fill="#DB7093" />
    <Circle cx={54} cy={47} r={2} fill="#DB7093" />
    <Circle cx={40} cy={34} r={3.5} fill="#000000" />
    <Circle cx={60} cy={34} r={3.5} fill="#000000" />
    <Polygon points="32,32 28,18 38,28" fill="#FFB6C1" />
    <Polygon points="68,32 72,18 62,28" fill="#FFB6C1" />
  </Svg>
));

const Dog = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse cx={50} cy={60} rx={22} ry={18} fill="#D2691E" />
    <Circle cx={50} cy={38} r={16} fill="#D2691E" />
    <Path d="M34,30 Q28,12 22,28" fill="#8B4513" strokeWidth={1} />
    <Path d="M66,30 Q72,12 78,28" fill="#8B4513" strokeWidth={1} />
    <Circle cx={43} cy={35} r={3} fill="#000000" />
    <Circle cx={57} cy={35} r={3} fill="#000000" />
    <Ellipse cx={50} cy={44} rx={5} ry={3.5} fill="#000000" />
    <Path d="M45 48 Q50 54, 55 48" stroke="#000" strokeWidth={1.5} fill="none" />
    <Line x1={35} y1={76} x2={35} y2={90} stroke="#D2691E" strokeWidth={4} strokeLinecap="round" />
    <Line x1={65} y1={76} x2={65} y2={90} stroke="#D2691E" strokeWidth={4} strokeLinecap="round" />
  </Svg>
));

const Cat = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse cx={50} cy={60} rx={20} ry={18} fill="#808080" />
    <Circle cx={50} cy={38} r={16} fill="#808080" />
    <Polygon points="34,30 28,10 42,24" fill="#808080" />
    <Polygon points="66,30 72,10 58,24" fill="#808080" />
    <Polygon points="34,30 28,10 42,24" fill="#A9A9A9" />
    <Polygon points="66,30 72,10 58,24" fill="#A9A9A9" />
    <Circle cx={42} cy={35} r={4} fill="#90EE90" />
    <Circle cx={58} cy={35} r={4} fill="#90EE90" />
    <Circle cx={42} cy={35} r={2} fill="#000000" />
    <Circle cx={58} cy={35} r={2} fill="#000000" />
    <Ellipse cx={50} cy={42} rx={3} ry={2} fill="#FFB6C1" />
    <Line x1={18} y1={38} x2={36} y2={42} stroke="#A9A9A9" strokeWidth={1} />
    <Line x1={18} y1={44} x2={36} y2={44} stroke="#A9A9A9" strokeWidth={1} />
    <Line x1={64} y1={42} x2={82} y2={38} stroke="#A9A9A9" strokeWidth={1} />
    <Line x1={64} y1={44} x2={82} y2={44} stroke="#A9A9A9" strokeWidth={1} />
  </Svg>
));

const Horse = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse cx={55} cy={50} rx={28} ry={18} fill="#8B4513" />
    <Path d="M28 50 Q20 30, 30 18 Q35 12, 35 25 L35 38" fill="#8B4513" />
    <Circle cx={28} cy={22} r={3} fill="#000000" />
    <Path d="M26 14 Q22 5, 30 10" fill="#5C3317" />
    <Path d="M30 14 Q28 4, 35 10" fill="#5C3317" />
    <Path d="M35 14 Q34 6, 40 12" fill="#5C3317" />
    <Line x1={40} y1={66} x2={38} y2={88} stroke="#8B4513" strokeWidth={4} strokeLinecap="round" />
    <Line x1={65} y1={66} x2={63} y2={88} stroke="#8B4513" strokeWidth={4} strokeLinecap="round" />
    <Path d="M82 48 Q92 42, 90 52 Q88 58, 82 52" fill="#5C3317" />
  </Svg>
));

const Cow = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse cx={52} cy={52} rx={28} ry={20} fill="#FFFFFF" />
    <Ellipse cx={52} cy={45} rx={12} ry={5} fill="#2F2F2F" />
    <Ellipse cx={38} cy={55} rx={8} ry={6} fill="#2F2F2F" />
    <Circle cx={35} cy={30} r={14} fill="#FFFFFF" />
    <Ellipse cx={35} cy={40} rx={8} ry={5} fill="#FFB6C1" />
    <Circle cx={28} cy={27} r={3} fill="#000000" />
    <Circle cx={42} cy={27} r={3} fill="#000000" />
    <Path d="M20 20 Q14 10, 18 18" fill="#8B4513" stroke="#8B4513" strokeWidth={2} />
    <Path d="M48 20 Q54 10, 50 18" fill="#8B4513" stroke="#8B4513" strokeWidth={2} />
    <Line x1={38} y1={70} x2={38} y2={90} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" />
    <Line x1={65} y1={70} x2={65} y2={90} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" />
  </Svg>
));

const Snake = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M20 30 Q35 15, 50 30 Q65 45, 80 30 Q90 22, 85 40 Q80 55, 65 50 Q50 45, 40 55 Q30 65, 20 60 Q12 55, 20 45 Z"
      fill="#2E8B57"
      stroke="#1B5E20"
      strokeWidth={1.5}
    />
    <Circle cx={22} cy={37} r={6} fill="#2E8B57" />
    <Circle cx={19} cy={35} r={2.5} fill="#FFD700" />
    <Circle cx={19} cy={35} r={1.2} fill="#000000" />
    <Path d="M14 40 L8 38 L14 42" fill="#FF0000" />
  </Svg>
));

const Butterfly = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={49} y={30} width={2} height={40} fill="#2F2F2F" rx={1} />
    <Ellipse cx={35} cy={40} rx={18} ry={14} fill="#FF6347" opacity={0.85} />
    <Ellipse cx={65} cy={40} rx={18} ry={14} fill="#FF6347" opacity={0.85} />
    <Ellipse cx={37} cy={60} rx={14} ry={10} fill="#FF8C00" opacity={0.8} />
    <Ellipse cx={63} cy={60} rx={14} ry={10} fill="#FF8C00" opacity={0.8} />
    <Circle cx={32} cy={40} r={5} fill="#FFD700" opacity={0.7} />
    <Circle cx={68} cy={40} r={5} fill="#FFD700" opacity={0.7} />
    <Line x1={50} y1={30} x2={40} y2={18} stroke="#2F2F2F" strokeWidth={1.5} />
    <Line x1={50} y1={30} x2={60} y2={18} stroke="#2F2F2F" strokeWidth={1.5} />
    <Circle cx={40} cy={17} r={2} fill="#2F2F2F" />
    <Circle cx={60} cy={17} r={2} fill="#2F2F2F" />
  </Svg>
));

// ─── Household ────────────────────────────────────────────

const House = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={22} y={45} width={56} height={42} fill="#CD853F" />
    <Polygon points="50,12 10,48 90,48" fill="#B22222" />
    <Rect x={42} y={60} width={16} height={27} fill="#8B4513" />
    <Circle cx={55} cy={74} r={2} fill="#FFD700" />
    <Rect x={26} y={52} width={12} height={12} fill="#87CEEB" stroke="#FFFFFF" strokeWidth={1} />
    <Rect x={62} y={52} width={12} height={12} fill="#87CEEB" stroke="#FFFFFF" strokeWidth={1} />
  </Svg>
));

const Door = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={25} y={10} width={50} height={80} fill="#8B4513" rx={3} />
    <Rect x={30} y={15} width={18} height={28} fill="#A0522D" rx={2} />
    <Rect x={52} y={15} width={18} height={28} fill="#A0522D" rx={2} />
    <Rect x={30} y={48} width={18} height={28} fill="#A0522D" rx={2} />
    <Rect x={52} y={48} width={18} height={28} fill="#A0522D" rx={2} />
    <Circle cx={68} cy={52} r={4} fill="#FFD700" />
  </Svg>
));

const Table = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={10} y={35} width={80} height={8} fill="#8B4513" rx={2} />
    <Rect x={15} y={43} width={6} height={42} fill="#A0522D" rx={1} />
    <Rect x={79} y={43} width={6} height={42} fill="#A0522D" rx={1} />
    <Rect x={10} y={32} width={80} height={5} fill="#A0522D" rx={2} />
  </Svg>
));

const Chair = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={25} y={40} width={40} height={6} fill="#D2691E" rx={1} />
    <Rect x={28} y={46} width={5} height={38} fill="#A0522D" rx={1} />
    <Rect x={57} y={46} width={5} height={38} fill="#A0522D" rx={1} />
    <Rect x={57} y={10} width={5} height={32} fill="#A0522D" rx={1} />
    <Rect x={57} y={10} width={5} height={4} fill="#D2691E" rx={1} />
    <Line x1={60} y1={14} x2={60} y2={28} stroke="#8B4513" strokeWidth={1} />
  </Svg>
));

const Bed = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={10} y={50} width={80} height={18} fill="#CD853F" rx={3} />
    <Rect x={10} y={30} width={8} height={40} fill="#8B4513" rx={2} />
    <Rect x={82} y={42} width={8} height={28} fill="#8B4513" rx={2} />
    <Rect x={20} y={42} width={25} height={12} fill="#FFFFFF" rx={4} />
    <Rect x={14} y={48} width={74} height={6} fill="#4169E1" opacity={0.5} rx={2} />
    <Line x1={10} y1={68} x2={10} y2={80} stroke="#8B4513" strokeWidth={4} strokeLinecap="round" />
    <Line x1={90} y1={68} x2={90} y2={80} stroke="#8B4513" strokeWidth={4} strokeLinecap="round" />
  </Svg>
));

const Pot = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse cx={50} cy={40} rx={30} ry={5} fill="#555555" />
    <Path d="M20 40 Q18 70, 30 80 Q40 86, 60 86 Q70 86, 80 80 Q82 70, 80 40" fill="#444444" />
    <Ellipse cx={50} cy={40} rx={30} ry={5} fill="#666666" />
    <Line x1={15} y1={40} x2={8} y2={35} stroke="#666" strokeWidth={3} strokeLinecap="round" />
    <Line x1={85} y1={40} x2={92} y2={35} stroke="#666" strokeWidth={3} strokeLinecap="round" />
    <Path d="M42 20 Q44 12, 46 20" stroke="#AAA" strokeWidth={1.5} fill="none" />
    <Path d="M50 18 Q52 10, 54 18" stroke="#AAA" strokeWidth={1.5} fill="none" />
    <Path d="M58 20 Q60 12, 62 20" stroke="#AAA" strokeWidth={1.5} fill="none" />
  </Svg>
));

const Bowl = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M15 45 Q15 80, 50 80 Q85 80, 85 45" fill="#DEB887" />
    <Ellipse cx={50} cy={45} rx={35} ry={8} fill="#F5DEB3" />
    <Ellipse cx={50} cy={45} rx={30} ry={5} fill="#FFFFFF" opacity={0.6} />
    <Ellipse cx={50} cy={82} rx={12} ry={3} fill="#C4A06A" />
  </Svg>
));

const Spoon = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse cx={50} cy={28} rx={14} ry={18} fill="#C0C0C0" />
    <Ellipse cx={50} cy={28} rx={10} ry={13} fill="#D3D3D3" />
    <Rect x={48} y={42} width={4} height={48} fill="#C0C0C0" rx={2} />
  </Svg>
));

const Knife = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M48 8 L52 8 L53 55 L47 55 Z" fill="#C0C0C0" />
    <Path d="M48 8 Q50 5, 52 8" fill="#D3D3D3" />
    <Rect x={44} y={55} width={12} height={6} fill="#8B4513" rx={1} />
    <Rect x={45} y={61} width={10} height={28} fill="#A0522D" rx={2} />
    <Circle cx={50} cy={64} r={1.5} fill="#CD853F" />
    <Circle cx={50} cy={70} r={1.5} fill="#CD853F" />
  </Svg>
));

const Broom = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Line x1={50} y1={8} x2={50} y2={55} stroke="#CD853F" strokeWidth={4} strokeLinecap="round" />
    <Path d="M35 55 L50 52 L65 55 L62 92 L38 92 Z" fill="#DAA520" />
    <Line x1={40} y1={58} x2={39} y2={90} stroke="#B8860B" strokeWidth={1} />
    <Line x1={45} y1={56} x2={44} y2={90} stroke="#B8860B" strokeWidth={1} />
    <Line x1={50} y1={55} x2={50} y2={90} stroke="#B8860B" strokeWidth={1} />
    <Line x1={55} y1={56} x2={56} y2={90} stroke="#B8860B" strokeWidth={1} />
    <Line x1={60} y1={58} x2={61} y2={90} stroke="#B8860B" strokeWidth={1} />
  </Svg>
));

// ─── Food ─────────────────────────────────────────────────

const Rice = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M15 50 Q15 82, 50 82 Q85 82, 85 50" fill="#4169E1" />
    <Ellipse cx={50} cy={50} rx={35} ry={8} fill="#4682B4" />
    <Ellipse cx={50} cy={48} rx={30} ry={12} fill="#FFFFFF" />
    <Circle cx={42} cy={44} r={2.5} fill="#FFFACD" />
    <Circle cx={52} cy={42} r={2.5} fill="#FFFACD" />
    <Circle cx={47} cy={48} r={2.5} fill="#FFFACD" />
    <Circle cx={57} cy={46} r={2.5} fill="#FFFACD" />
    <Circle cx={38} cy={50} r={2.5} fill="#FFFACD" />
    <Circle cx={60} cy={50} r={2.5} fill="#FFFACD" />
  </Svg>
));

const Egg = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M50 12 C30 12, 18 40, 18 58 C18 78, 32 90, 50 90 C68 90, 82 78, 82 58 C82 40, 70 12, 50 12Z"
      fill="#FFF8DC"
      stroke="#DEB887"
      strokeWidth={1.5}
    />
    <Ellipse cx={42} cy={50} rx={8} ry={12} fill="#FFFFFF" opacity={0.5} />
  </Svg>
));

const Meat = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M25 35 Q30 20, 50 22 Q72 24, 78 40 Q82 55, 72 68 Q60 80, 42 78 Q22 74, 20 55 Q18 42, 25 35Z"
      fill="#CD5C5C"
    />
    <Path
      d="M35 40 Q42 32, 55 38 Q62 42, 58 55 Q52 62, 42 60 Q34 55, 35 40Z"
      fill="#FFB6C1"
      opacity={0.6}
    />
    <Circle cx={72} cy={72} r={8} fill="#FFFFFF" stroke="#DDD" strokeWidth={1} />
    <Circle cx={72} cy={72} r={4} fill="#F0F0F0" />
  </Svg>
));

const Salt = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={30} y={25} width={40} height={55} fill="#E8E8E8" rx={4} />
    <Rect x={30} y={25} width={40} height={15} fill="#D3D3D3" rx={4} />
    <Rect x={32} y={25} width={36} height={12} fill="#C0C0C0" rx={3} />
    <Circle cx={45} cy={48} r={1.5} fill="#999" />
    <Circle cx={55} cy={52} r={1.5} fill="#999" />
    <Circle cx={50} cy={58} r={1.5} fill="#999" />
    <Circle cx={43} cy={62} r={1.5} fill="#999" />
    <Circle cx={57} cy={44} r={1.5} fill="#999" />
    <Rect x={44} y={18} width={12} height={8} fill="#C0C0C0" rx={2} />
  </Svg>
));

const Sugar = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={22} y={30} width={56} height={50} fill="#FFF8DC" rx={4} stroke="#DEB887" strokeWidth={1.5} />
    <Rect x={22} y={30} width={56} height={12} fill="#DEB887" rx={4} />
    <Rect x={38} y={50} width={24} height={10} fill="#DEB887" rx={2} opacity={0.5} />
    <Rect x={42} y={53} width={16} height={4} fill="#8B4513" rx={1} opacity={0.3} />
    <Ellipse cx={50} cy={26} rx={10} ry={4} fill="#DEB887" />
  </Svg>
));

const Banana = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M30 75 Q15 55, 22 35 Q28 18, 45 12 Q48 11, 47 14 Q35 22, 30 40 Q26 58, 40 72 Q52 82, 68 78 Q72 77, 70 80 Q55 88, 30 75Z"
      fill="#FFD700"
      stroke="#DAA520"
      strokeWidth={1}
    />
    <Path d="M44 12 Q47 8, 50 12" fill="#8B7355" />
  </Svg>
));

const Mango = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M50 15 Q72 18, 80 42 Q85 62, 72 78 Q58 90, 42 85 Q22 78, 18 55 Q15 35, 30 22 Q40 15, 50 15Z"
      fill="#FF8C00"
    />
    <Path
      d="M50 15 Q58 20, 62 35 Q55 25, 42 22 Q38 18, 50 15Z"
      fill="#FFD700"
      opacity={0.5}
    />
    <Path d="M50 15 Q48 8, 52 10" fill="#228B22" stroke="#228B22" strokeWidth={1} />
  </Svg>
));

const Corn = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M40 15 Q38 10, 42 12 Q50 8, 55 14 Q58 10, 56 16"
      fill="#228B22"
      stroke="#228B22"
      strokeWidth={1.5}
    />
    <Path d="M38 18 Q35 45, 40 80 Q45 90, 55 90 Q60 90, 62 80 Q67 45, 64 18 Q52 12, 38 18Z" fill="#FFD700" />
    <G>
      <Circle cx={45} cy={28} r={3} fill="#FFA500" />
      <Circle cx={55} cy={28} r={3} fill="#FFA500" />
      <Circle cx={45} cy={38} r={3} fill="#FFA500" />
      <Circle cx={55} cy={38} r={3} fill="#FFA500" />
      <Circle cx={45} cy={48} r={3} fill="#FFA500" />
      <Circle cx={55} cy={48} r={3} fill="#FFA500" />
      <Circle cx={45} cy={58} r={3} fill="#FFA500" />
      <Circle cx={55} cy={58} r={3} fill="#FFA500" />
      <Circle cx={50} cy={68} r={3} fill="#FFA500" />
      <Circle cx={50} cy={33} r={3} fill="#FFA500" />
      <Circle cx={50} cy={43} r={3} fill="#FFA500" />
      <Circle cx={50} cy={53} r={3} fill="#FFA500" />
    </G>
  </Svg>
));

const Taro = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M50 25 Q70 28, 75 50 Q78 70, 60 82 Q50 88, 40 82 Q22 70, 25 50 Q28 28, 50 25Z"
      fill="#8B6B8B"
    />
    <Path
      d="M50 25 Q55 30, 56 45 Q50 35, 42 30 Q45 26, 50 25Z"
      fill="#9B7B9B"
      opacity={0.5}
    />
    <Line x1={50} y1={25} x2={48} y2={10} stroke="#228B22" strokeWidth={3} strokeLinecap="round" />
    <Path d="M48 10 Q40 5, 35 12 Q42 8, 48 10Z" fill="#228B22" />
    <Path d="M48 10 Q55 4, 60 10 Q54 7, 48 10Z" fill="#2E8B57" />
  </Svg>
));

const Ginger = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M45 30 Q55 25, 65 32 Q75 38, 72 50 Q70 58, 60 60 Q55 62, 50 58 Q45 62, 35 60 Q25 55, 28 45 Q30 38, 38 34 Q40 30, 45 30Z"
      fill="#DEB887"
      stroke="#C4A06A"
      strokeWidth={1}
    />
    <Path d="M60 35 Q70 28, 78 32 Q82 36, 76 40 Q70 42, 65 38Z" fill="#D2B48C" />
    <Path d="M35 48 Q25 52, 22 60 Q20 66, 28 65 Q34 62, 38 55Z" fill="#D2B48C" />
    <Path d="M50 38 Q52 45, 48 52" stroke="#C4A06A" strokeWidth={1} fill="none" />
  </Svg>
));

// ─── Body ─────────────────────────────────────────────────

const Eye = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M10 50 Q30 20, 50 20 Q70 20, 90 50 Q70 80, 50 80 Q30 80, 10 50Z" fill="#FFFFFF" stroke="#333" strokeWidth={2} />
    <Circle cx={50} cy={50} r={18} fill="#8B4513" />
    <Circle cx={50} cy={50} r={10} fill="#000000" />
    <Circle cx={44} cy={44} r={4} fill="#FFFFFF" />
  </Svg>
));

const Ear = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M55 15 Q80 15, 82 45 Q84 72, 60 85 Q52 88, 50 80 Q58 68, 58 55 Q58 45, 50 42 Q44 40, 44 48 Q44 55, 40 58"
      fill="#FDBCB4"
      stroke="#E8A090"
      strokeWidth={2}
    />
    <Path
      d="M60 25 Q72 28, 72 48 Q72 65, 60 75"
      fill="none"
      stroke="#E8A090"
      strokeWidth={2}
    />
  </Svg>
));

const Hand = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={35} y={55} width={30} height={35} fill="#FDBCB4" rx={6} />
    <Rect x={35} y={18} width={8} height={42} fill="#FDBCB4" rx={4} />
    <Rect x={46} y={12} width={8} height={48} fill="#FDBCB4" rx={4} />
    <Rect x={57} y={18} width={8} height={42} fill="#FDBCB4" rx={4} />
    <Rect x={68} y={28} width={8} height={32} fill="#FDBCB4" rx={4} />
    <Rect x={22} y={42} width={16} height={8} fill="#FDBCB4" rx={4} />
  </Svg>
));

const Foot = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M35 15 Q30 15, 30 50 Q28 70, 20 78 Q15 82, 25 85 Q40 88, 65 88 Q80 88, 80 80 Q80 72, 70 65 Q65 60, 65 50 Q65 15, 60 15 Z"
      fill="#FDBCB4"
      stroke="#E8A090"
      strokeWidth={1.5}
    />
    <Circle cx={28} cy={78} r={5} fill="#F5ADA0" />
    <Circle cx={38} cy={82} r={4.5} fill="#F5ADA0" />
    <Circle cx={48} cy={84} r={4} fill="#F5ADA0" />
    <Circle cx={57} cy={83} r={3.5} fill="#F5ADA0" />
    <Circle cx={65} cy={80} r={3} fill="#F5ADA0" />
  </Svg>
));

const Head = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx={50} cy={42} r={30} fill="#FDBCB4" />
    <Rect x={44} y={70} width={12} height={18} fill="#FDBCB4" rx={4} />
    <Circle cx={38} cy={40} r={3} fill="#333" />
    <Circle cx={62} cy={40} r={3} fill="#333" />
    <Path d="M44 52 Q50 58, 56 52" stroke="#D2691E" strokeWidth={2} fill="none" />
    <Path d="M20 32 Q25 8, 50 8 Q75 8, 80 32 Q75 18, 50 16 Q25 18, 20 32Z" fill="#4A3728" />
  </Svg>
));

const Mouth = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M20 45 Q35 38, 50 42 Q65 38, 80 45 Q75 65, 50 70 Q25 65, 20 45Z"
      fill="#FF6B6B"
      stroke="#E05555"
      strokeWidth={1.5}
    />
    <Path
      d="M20 45 Q35 38, 50 42 Q65 38, 80 45 Q65 50, 50 48 Q35 50, 20 45Z"
      fill="#FFFFFF"
    />
    <Path d="M30 45 L40 44 M45 43 L55 43 M60 44 L70 45" stroke="#F0F0F0" strokeWidth={0.5} />
  </Svg>
));

const Nose = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M50 15 Q48 30, 46 45 Q42 60, 32 70 Q38 78, 50 78 Q62 78, 68 70 Q58 60, 54 45 Q52 30, 50 15Z"
      fill="#FDBCB4"
      stroke="#E8A090"
      strokeWidth={1.5}
    />
    <Circle cx={40} cy={70} r={5} fill="#F5ADA0" opacity={0.5} />
    <Circle cx={60} cy={70} r={5} fill="#F5ADA0" opacity={0.5} />
  </Svg>
));

const Hair = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx={50} cy={50} r={32} fill="#FDBCB4" />
    <Path
      d="M18 50 Q18 15, 50 12 Q82 15, 82 50 Q80 30, 65 22 Q50 16, 35 22 Q20 30, 18 50Z"
      fill="#2F1F14"
    />
    <Path d="M18 50 Q16 35, 22 28 Q18 40, 20 50Z" fill="#2F1F14" />
    <Path d="M82 50 Q84 35, 78 28 Q82 40, 80 50Z" fill="#2F1F14" />
    <Path d="M30 18 Q35 10, 45 12" fill="none" stroke="#3D2B1F" strokeWidth={2} />
    <Path d="M55 12 Q65 10, 72 18" fill="none" stroke="#3D2B1F" strokeWidth={2} />
    <Circle cx={38} cy={48} r={2.5} fill="#333" />
    <Circle cx={62} cy={48} r={2.5} fill="#333" />
    <Path d="M44 58 Q50 62, 56 58" stroke="#D2691E" strokeWidth={1.5} fill="none" />
  </Svg>
));

const Tooth = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M35 20 Q35 15, 50 15 Q65 15, 65 20 Q68 35, 62 55 Q58 72, 56 82 Q54 88, 50 88 Q46 88, 44 82 Q42 72, 38 55 Q32 35, 35 20Z"
      fill="#FFFFFF"
      stroke="#D3D3D3"
      strokeWidth={2}
    />
    <Path d="M50 15 Q50 30, 50 45" stroke="#ECECEC" strokeWidth={1} />
    <Path
      d="M35 20 Q50 28, 65 20"
      fill="none"
      stroke="#E8E8E8"
      strokeWidth={1}
    />
  </Svg>
));

const Heart = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path
      d="M50 85 L20 55 Q5 38, 15 22 Q22 12, 35 15 Q45 18, 50 30 Q55 18, 65 15 Q78 12, 85 22 Q95 38, 80 55 Z"
      fill="#E74C3C"
    />
    <Path
      d="M35 22 Q40 20, 45 28 Q38 18, 30 22 Q22 28, 28 42"
      fill="#FF6B6B"
      opacity={0.5}
    />
  </Svg>
));

// ─── Clothing ────────────────────────────────────────────

const Shirt = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M30 20 L20 30 L10 25 L20 50 L30 45 L30 85 L70 85 L70 45 L80 50 L90 25 L80 30 L70 20 L60 28 Q50 34, 40 28 Z" fill="#4169E1" stroke="#2850A8" strokeWidth={1.5} />
    <Path d="M40 28 Q50 34, 60 28" fill="none" stroke="#2850A8" strokeWidth={1.5} />
    <Line x1={50} y1={34} x2={50} y2={55} stroke="#2850A8" strokeWidth={1} />
    <Circle cx={50} cy={42} r={1.5} fill="#FFFFFF" />
    <Circle cx={50} cy={50} r={1.5} fill="#FFFFFF" />
  </Svg>
));

const Pants = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M25 10 L25 90 L45 90 L45 48 L55 48 L55 90 L75 90 L75 10 Z" fill="#1B3A6B" stroke="#142D52" strokeWidth={1.5} />
    <Line x1={50} y1={10} x2={50} y2={48} stroke="#142D52" strokeWidth={1} />
    <Rect x={38} y={10} width={24} height={5} fill="#8B4513" rx={1} />
    <Rect x={48} y={10} width={4} height={5} fill="#FFD700" rx={1} />
  </Svg>
));

const Shoe = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M20 40 L20 70 Q20 80, 30 80 L85 80 Q92 80, 92 72 Q92 62, 80 60 L70 58 L70 35 Q70 30, 60 30 L30 30 Q20 30, 20 40Z" fill="#8B4513" stroke="#6B3410" strokeWidth={1.5} />
    <Path d="M20 60 L70 58" stroke="#6B3410" strokeWidth={1} />
    <Line x1={35} y1={35} x2={35} y2={55} stroke="#DEB887" strokeWidth={1} />
    <Line x1={45} y1={33} x2={45} y2={55} stroke="#DEB887" strokeWidth={1} />
    <Line x1={55} y1={32} x2={55} y2={55} stroke="#DEB887" strokeWidth={1} />
    <Rect x={20} y={55} width={50} height={6} fill="#A0522D" rx={1} />
  </Svg>
));

const Hat = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse cx={50} cy={72} rx={42} ry={8} fill="#2F4F4F" />
    <Path d="M28 72 Q28 30, 50 20 Q72 30, 72 72" fill="#2F4F4F" />
    <Rect x={28} y={66} width={44} height={8} fill="#3D6B6B" rx={2} />
    <Rect x={44} y={56} width={12} height={14} fill="#FFD700" rx={1} />
  </Svg>
));

const Glove = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M30 50 L30 88 Q30 94, 40 94 L60 94 Q70 94, 70 88 L70 50" fill="#CC2222" stroke="#AA1111" strokeWidth={1.5} />
    <Rect x={30} y={18} width={10} height={36} fill="#CC2222" rx={5} />
    <Rect x={42} y={10} width={10} height={44} fill="#CC2222" rx={5} />
    <Rect x={54} y={14} width={10} height={40} fill="#CC2222" rx={5} />
    <Rect x={66} y={24} width={10} height={30} fill="#CC2222" rx={5} />
    <Rect x={18} y={44} width={14} height={10} fill="#CC2222" rx={5} />
    <Rect x={30} y={50} width={40} height={6} fill="#FFFFFF" opacity={0.3} rx={2} />
  </Svg>
));

const Belt = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={5} y={40} width={90} height={20} fill="#5C3317" rx={3} />
    <Rect x={5} y={40} width={90} height={20} fill="#6B3A1F" rx={3} />
    <Line x1={5} y1={44} x2={95} y2={44} stroke="#4A2810" strokeWidth={1} />
    <Line x1={5} y1={56} x2={95} y2={56} stroke="#4A2810" strokeWidth={1} />
    <Rect x={40} y={36} width={20} height={28} fill="#C0C0C0" rx={2} stroke="#999" strokeWidth={1} />
    <Rect x={44} y={40} width={12} height={20} fill="#D3D3D3" rx={1} />
    <Circle cx={50} cy={50} r={3} fill="#999" />
  </Svg>
));

const Dress = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M40 15 Q45 12, 50 12 Q55 12, 60 15 L62 30 L70 32 L65 38 L68 88 Q55 92, 50 92 Q45 92, 32 88 L35 38 L30 32 L38 30 Z" fill="#8B2F8B" stroke="#6B1F6B" strokeWidth={1.5} />
    <Path d="M40 15 Q50 18, 60 15" fill="none" stroke="#6B1F6B" strokeWidth={1} />
    <Rect x={42} y={38} width={16} height={3} fill="#FFD700" rx={1} />
    <Path d="M35 55 Q50 52, 65 55" fill="none" stroke="#6B1F6B" strokeWidth={0.8} />
    <Path d="M33 70 Q50 67, 67 70" fill="none" stroke="#6B1F6B" strokeWidth={0.8} />
  </Svg>
));

const Sock = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M35 10 L35 65 Q35 82, 50 85 L75 85 Q85 85, 85 75 Q85 65, 75 62 L65 60 L65 10 Z" fill="#FFFFFF" stroke="#DDD" strokeWidth={1.5} />
    <Rect x={35} y={10} width={30} height={8} fill="#E74C3C" rx={2} />
    <Rect x={35} y={22} width={30} height={4} fill="#E74C3C" rx={1} />
    <Rect x={35} y={30} width={30} height={4} fill="#E74C3C" rx={1} />
    <Path d="M35 65 Q50 68, 65 60" fill="none" stroke="#DDD" strokeWidth={1} />
  </Svg>
));

const Ring = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx={50} cy={55} r={28} fill="none" stroke="#FFD700" strokeWidth={10} />
    <Circle cx={50} cy={55} r={28} fill="none" stroke="#DAA520" strokeWidth={8} />
    <Circle cx={50} cy={27} r={10} fill="#4169E1" stroke="#FFD700" strokeWidth={2} />
    <Circle cx={50} cy={27} r={6} fill="#5B8DEF" opacity={0.7} />
    <Circle cx={47} cy={24} r={2} fill="#FFFFFF" opacity={0.6} />
  </Svg>
));

const Scarf = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M15 25 Q30 20, 50 22 Q70 24, 85 20 Q88 22, 85 28 Q70 32, 55 35 L55 80 Q55 90, 48 90 Q40 90, 40 80 L40 40 Q25 35, 15 32 Q12 30, 15 25Z" fill="#CC2222" stroke="#AA1111" strokeWidth={1.5} />
    <Line x1={20} y1={25} x2={80} y2={22} stroke="#E84444" strokeWidth={1} />
    <Line x1={42} y1={45} x2={53} y2={45} stroke="#AA1111" strokeWidth={1} />
    <Line x1={42} y1={55} x2={53} y2={55} stroke="#AA1111" strokeWidth={1} />
    <Line x1={42} y1={65} x2={53} y2={65} stroke="#AA1111" strokeWidth={1} />
    <Line x1={40} y1={85} x2={40} y2={92} stroke="#AA1111" strokeWidth={1.5} />
    <Line x1={44} y1={85} x2={44} y2={93} stroke="#AA1111" strokeWidth={1.5} />
    <Line x1={48} y1={85} x2={48} y2={92} stroke="#AA1111" strokeWidth={1.5} />
  </Svg>
));

// ─── Weather ─────────────────────────────────────────────

const Wind = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M10 35 Q30 30, 50 35 Q70 40, 80 30 Q85 25, 82 20" fill="none" stroke="#87CEEB" strokeWidth={3} strokeLinecap="round" />
    <Path d="M15 50 Q35 45, 55 50 Q75 55, 90 45" fill="none" stroke="#6BB5D9" strokeWidth={3} strokeLinecap="round" />
    <Path d="M10 65 Q25 60, 45 65 Q65 70, 75 62 Q80 58, 78 52" fill="none" stroke="#87CEEB" strokeWidth={3} strokeLinecap="round" />
    <Path d="M20 78 Q40 73, 60 78" fill="none" stroke="#A8D8EA" strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
));

const Snow = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Line x1={50} y1={10} x2={50} y2={90} stroke="#87CEEB" strokeWidth={3} strokeLinecap="round" />
    <Line x1={15} y1={30} x2={85} y2={70} stroke="#87CEEB" strokeWidth={3} strokeLinecap="round" />
    <Line x1={85} y1={30} x2={15} y2={70} stroke="#87CEEB" strokeWidth={3} strokeLinecap="round" />
    <Line x1={50} y1={15} x2={42} y2={22} stroke="#87CEEB" strokeWidth={2} strokeLinecap="round" />
    <Line x1={50} y1={15} x2={58} y2={22} stroke="#87CEEB" strokeWidth={2} strokeLinecap="round" />
    <Line x1={50} y1={85} x2={42} y2={78} stroke="#87CEEB" strokeWidth={2} strokeLinecap="round" />
    <Line x1={50} y1={85} x2={58} y2={78} stroke="#87CEEB" strokeWidth={2} strokeLinecap="round" />
    <Circle cx={50} cy={50} r={5} fill="#B0E0E6" />
  </Svg>
));

const Thunder = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse cx={50} cy={30} rx={32} ry={18} fill="#4A4A5A" />
    <Circle cx={28} cy={35} r={15} fill="#4A4A5A" />
    <Circle cx={72} cy={35} r={15} fill="#4A4A5A" />
    <Ellipse cx={50} cy={35} rx={35} ry={12} fill="#555566" />
    <Path d="M40 50 Q35 55, 38 58 Q32 58, 36 62 Q30 62, 34 67" fill="none" stroke="#888" strokeWidth={2} strokeLinecap="round" />
    <Path d="M60 50 Q55 54, 58 57 Q52 57, 56 61 Q50 61, 54 65" fill="none" stroke="#888" strokeWidth={2} strokeLinecap="round" />
    <Polygon points="50,52 44,68 48,68 42,85 58,64 52,64 56,52" fill="#FFD700" />
  </Svg>
));

const Lightning = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Polygon points="55,5 30,50 46,50 25,95 75,42 56,42 72,5" fill="#FFD700" stroke="#FFA500" strokeWidth={2} />
    <Polygon points="55,15 38,48 50,48 35,82 65,46 54,46 65,15" fill="#FFEC80" opacity={0.6} />
  </Svg>
));

const Fog = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={10} y={20} width={80} height={6} fill="#B0B0B0" rx={3} opacity={0.5} />
    <Rect x={15} y={32} width={70} height={6} fill="#A0A0A0" rx={3} opacity={0.6} />
    <Rect x={8} y={44} width={84} height={6} fill="#909090" rx={3} opacity={0.7} />
    <Rect x={12} y={56} width={76} height={6} fill="#A0A0A0" rx={3} opacity={0.6} />
    <Rect x={18} y={68} width={64} height={6} fill="#B0B0B0" rx={3} opacity={0.5} />
    <Rect x={22} y={80} width={56} height={6} fill="#C0C0C0" rx={3} opacity={0.4} />
  </Svg>
));

const Rainbow = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M5 85 Q5 20, 50 20 Q95 20, 95 85" fill="none" stroke="#FF0000" strokeWidth={5} />
    <Path d="M10 85 Q10 28, 50 28 Q90 28, 90 85" fill="none" stroke="#FF8C00" strokeWidth={5} />
    <Path d="M15 85 Q15 36, 50 36 Q85 36, 85 85" fill="none" stroke="#FFD700" strokeWidth={5} />
    <Path d="M20 85 Q20 44, 50 44 Q80 44, 80 85" fill="none" stroke="#228B22" strokeWidth={5} />
    <Path d="M25 85 Q25 52, 50 52 Q75 52, 75 85" fill="none" stroke="#4169E1" strokeWidth={5} />
    <Path d="M30 85 Q30 60, 50 60 Q70 60, 70 85" fill="none" stroke="#8B00FF" strokeWidth={5} />
  </Svg>
));

const Ice = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Polygon points="50,10 80,30 80,70 50,90 20,70 20,30" fill="#B0E0E6" stroke="#87CEEB" strokeWidth={2} />
    <Polygon points="50,20 70,35 70,65 50,80 30,65 30,35" fill="#D6EFF8" opacity={0.7} />
    <Line x1={50} y1={20} x2={50} y2={80} stroke="#87CEEB" strokeWidth={1} opacity={0.5} />
    <Line x1={30} y1={35} x2={70} y2={65} stroke="#87CEEB" strokeWidth={1} opacity={0.5} />
    <Line x1={70} y1={35} x2={30} y2={65} stroke="#87CEEB" strokeWidth={1} opacity={0.5} />
    <Polygon points="50,30 60,42 60,58 50,70 40,58 40,42" fill="#FFFFFF" opacity={0.4} />
  </Svg>
));

const Storm = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse cx={50} cy={25} rx={32} ry={16} fill="#3A3A4A" />
    <Circle cx={26} cy={30} r={14} fill="#3A3A4A" />
    <Circle cx={74} cy={30} r={14} fill="#3A3A4A" />
    <Ellipse cx={50} cy={30} rx={36} ry={10} fill="#444455" />
    <Line x1={25} y1={48} x2={21} y2={62} stroke="#4169E1" strokeWidth={2} strokeLinecap="round" />
    <Line x1={35} y1={46} x2={31} y2={60} stroke="#4169E1" strokeWidth={2} strokeLinecap="round" />
    <Line x1={65} y1={46} x2={61} y2={60} stroke="#4169E1" strokeWidth={2} strokeLinecap="round" />
    <Line x1={75} y1={48} x2={71} y2={62} stroke="#4169E1" strokeWidth={2} strokeLinecap="round" />
    <Polygon points="50,48 46,62 49,62 44,78 56,58 52,58 55,48" fill="#FFD700" />
  </Svg>
));

const Sunrise = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={0} y={60} width={100} height={40} fill="#8B4513" opacity={0.3} />
    <Line x1={0} y1={60} x2={100} y2={60} stroke="#DAA520" strokeWidth={2} />
    <Circle cx={50} cy={60} r={22} fill="#FFD700" />
    <Rect x={0} y={60} width={100} height={40} fill="#8B6B3A" opacity={0.4} />
    <Line x1={50} y1={25} x2={50} y2={35} stroke="#FF8C00" strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={25} y1={40} x2={32} y2={46} stroke="#FF8C00" strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={75} y1={40} x2={68} y2={46} stroke="#FF8C00" strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={15} y1={55} x2={24} y2={55} stroke="#FF8C00" strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={85} y1={55} x2={76} y2={55} stroke="#FF8C00" strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
));

const Sunset = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={0} y={0} width={100} height={60} fill="#FF6347" opacity={0.2} />
    <Rect x={0} y={60} width={100} height={40} fill="#2F2F4F" opacity={0.4} />
    <Line x1={0} y1={60} x2={100} y2={60} stroke="#FF4500" strokeWidth={2} />
    <Circle cx={50} cy={60} r={22} fill="#FF4500" />
    <Rect x={0} y={60} width={100} height={40} fill="#2F2F4F" opacity={0.5} />
    <Line x1={50} y1={28} x2={50} y2={36} stroke="#FF6347" strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={27} y1={42} x2={33} y2={47} stroke="#FF6347" strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={73} y1={42} x2={67} y2={47} stroke="#FF6347" strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={18} y1={56} x2={25} y2={56} stroke="#FF6347" strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={82} y1={56} x2={75} y2={56} stroke="#FF6347" strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
));

// ─── Tools ───────────────────────────────────────────────

const Hammer = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={46} y={38} width={8} height={52} fill="#8B4513" rx={2} />
    <Rect x={25} y={18} width={50} height={22} fill="#808080" rx={3} />
    <Rect x={25} y={18} width={50} height={22} fill="#A9A9A9" rx={3} />
    <Line x1={25} y1={28} x2={75} y2={28} stroke="#808080" strokeWidth={1} />
    <Rect x={25} y={18} width={12} height={22} fill="#999" rx={3} />
  </Svg>
));

const Axe = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={46} y={30} width={8} height={58} fill="#8B4513" rx={2} />
    <Path d="M30 12 L54 12 L54 42 L30 42 Q15 27, 30 12Z" fill="#A9A9A9" stroke="#808080" strokeWidth={1.5} />
    <Path d="M34 16 L50 16 L50 38 L34 38 Q22 27, 34 16Z" fill="#C0C0C0" opacity={0.5} />
  </Svg>
));

const Bell = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx={50} cy={15} r={5} fill="#DAA520" />
    <Path d="M35 25 Q35 15, 50 12 Q65 15, 65 25 L70 70 Q70 78, 50 78 Q30 78, 30 70 Z" fill="#FFD700" stroke="#DAA520" strokeWidth={1.5} />
    <Ellipse cx={50} cy={78} rx={24} ry={6} fill="#DAA520" />
    <Circle cx={50} cy={82} r={5} fill="#B8860B" />
    <Path d="M40 30 Q45 25, 48 35" fill="none" stroke="#FFF8DC" strokeWidth={1.5} opacity={0.5} />
  </Svg>
));

const Scissors = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Line x1={50} y1={10} x2={35} y2={58} stroke="#C0C0C0" strokeWidth={4} strokeLinecap="round" />
    <Line x1={50} y1={10} x2={65} y2={58} stroke="#C0C0C0" strokeWidth={4} strokeLinecap="round" />
    <Circle cx={30} cy={68} r={12} fill="none" stroke="#808080" strokeWidth={4} />
    <Circle cx={70} cy={68} r={12} fill="none" stroke="#808080" strokeWidth={4} />
    <Circle cx={50} cy={38} r={3} fill="#999" />
  </Svg>
));

const Needle = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Line x1={50} y1={8} x2={50} y2={82} stroke="#C0C0C0" strokeWidth={3} strokeLinecap="round" />
    <Path d="M50 8 L48 15 L52 15 Z" fill="#D3D3D3" />
    <Ellipse cx={50} cy={78} rx={4} ry={6} fill="none" stroke="#C0C0C0" strokeWidth={2.5} />
    <Path d="M54 78 Q65 82, 72 75 Q78 68, 75 58 Q72 50, 68 48" fill="none" stroke="#E74C3C" strokeWidth={1.5} />
    <Path d="M68 48 Q62 45, 58 50 Q55 54, 60 56" fill="none" stroke="#E74C3C" strokeWidth={1.5} />
  </Svg>
));

const Basket = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M20 40 Q30 85, 50 85 Q70 85, 80 40" fill="#DEB887" stroke="#C4A06A" strokeWidth={1.5} />
    <Ellipse cx={50} cy={40} rx={30} ry={8} fill="#D2B48C" stroke="#C4A06A" strokeWidth={1.5} />
    <Path d="M30 40 Q30 15, 50 10 Q70 15, 70 40" fill="none" stroke="#C4A06A" strokeWidth={3} />
    <Line x1={30} y1={50} x2={70} y2={50} stroke="#C4A06A" strokeWidth={1} />
    <Line x1={32} y1={60} x2={68} y2={60} stroke="#C4A06A" strokeWidth={1} />
    <Line x1={36} y1={70} x2={64} y2={70} stroke="#C4A06A" strokeWidth={1} />
    <Line x1={40} y1={45} x2={38} y2={75} stroke="#C4A06A" strokeWidth={1} />
    <Line x1={60} y1={45} x2={62} y2={75} stroke="#C4A06A" strokeWidth={1} />
  </Svg>
));

const Candle = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Line x1={50} y1={25} x2={50} y2={38} stroke="#333" strokeWidth={2} />
    <Path d="M50 10 Q42 20, 44 28 Q46 34, 50 36 Q54 34, 56 28 Q58 20, 50 10Z" fill="#FF8C00" />
    <Path d="M50 15 Q46 22, 47 28 Q48 32, 50 33 Q52 32, 53 28 Q54 22, 50 15Z" fill="#FFD700" opacity={0.8} />
    <Rect x={40} y={36} width={20} height={50} fill="#FFF8DC" rx={2} stroke="#DEB887" strokeWidth={1} />
    <Ellipse cx={50} cy={86} rx={14} ry={5} fill="#DEB887" />
  </Svg>
));

const Key = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx={35} cy={35} r={18} fill="none" stroke="#FFD700" strokeWidth={6} />
    <Circle cx={35} cy={35} r={8} fill="none" stroke="#FFD700" strokeWidth={4} />
    <Rect x={48} y={32} width={40} height={6} fill="#FFD700" rx={2} />
    <Rect x={78} y={32} width={6} height={18} fill="#FFD700" rx={1} />
    <Rect x={68} y={32} width={6} height={14} fill="#FFD700" rx={1} />
    <Circle cx={35} cy={35} r={18} fill="none" stroke="#DAA520" strokeWidth={2} />
  </Svg>
));

const Pen = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={45} y={12} width={10} height={60} fill="#FFD700" rx={2} />
    <Polygon points="45,72 55,72 50,90" fill="#F5DEB3" />
    <Path d="M50 90 L50 94" stroke="#333" strokeWidth={1} />
    <Rect x={45} y={12} width={10} height={8} fill="#FF6347" rx={2} />
    <Rect x={44} y={65} width={12} height={5} fill="#C0C0C0" rx={1} />
    <Line x1={45} y1={30} x2={55} y2={30} stroke="#DAA520" strokeWidth={0.5} />
    <Line x1={45} y1={40} x2={55} y2={40} stroke="#DAA520" strokeWidth={0.5} />
  </Svg>
));

const Book = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M15 20 L15 82 Q50 75, 50 75 L50 15 Q15 15, 15 20Z" fill="#E8D8C0" stroke="#C4A06A" strokeWidth={1} />
    <Path d="M85 20 L85 82 Q50 75, 50 75 L50 15 Q85 15, 85 20Z" fill="#F5EDE0" stroke="#C4A06A" strokeWidth={1} />
    <Line x1={22} y1={30} x2={44} y2={28} stroke="#999" strokeWidth={1} />
    <Line x1={22} y1={38} x2={44} y2={36} stroke="#999" strokeWidth={1} />
    <Line x1={22} y1={46} x2={44} y2={44} stroke="#999" strokeWidth={1} />
    <Line x1={56} y1={28} x2={78} y2={30} stroke="#999" strokeWidth={1} />
    <Line x1={56} y1={36} x2={78} y2={38} stroke="#999" strokeWidth={1} />
    <Line x1={56} y1={44} x2={78} y2={46} stroke="#999" strokeWidth={1} />
    <Line x1={50} y1={15} x2={50} y2={75} stroke="#C4A06A" strokeWidth={2} />
  </Svg>
));

// ─── Plants ──────────────────────────────────────────────

const Leaf = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M50 10 Q80 30, 80 55 Q80 85, 50 90 Q20 85, 20 55 Q20 30, 50 10Z" fill="#228B22" stroke="#1B6B1B" strokeWidth={1.5} />
    <Line x1={50} y1={15} x2={50} y2={88} stroke="#1B6B1B" strokeWidth={2} />
    <Line x1={50} y1={35} x2={32} y2={45} stroke="#1B6B1B" strokeWidth={1.2} />
    <Line x1={50} y1={45} x2={68} y2={55} stroke="#1B6B1B" strokeWidth={1.2} />
    <Line x1={50} y1={55} x2={30} y2={65} stroke="#1B6B1B" strokeWidth={1.2} />
    <Line x1={50} y1={65} x2={70} y2={72} stroke="#1B6B1B" strokeWidth={1.2} />
  </Svg>
));

const Seed = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse cx={50} cy={62} rx={16} ry={22} fill="#8B6914" stroke="#6B4F10" strokeWidth={1.5} />
    <Path d="M50 62 Q48 55, 50 45 Q52 55, 50 62Z" fill="#6B4F10" opacity={0.4} />
    <Line x1={50} y1={40} x2={50} y2={22} stroke="#228B22" strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M50 22 Q42 18, 38 24 Q44 20, 50 22Z" fill="#32CD32" />
    <Path d="M50 22 Q58 18, 62 24 Q56 20, 50 22Z" fill="#228B22" />
  </Svg>
));

const Bamboo = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={30} y={5} width={10} height={90} fill="#2E8B57" rx={3} />
    <Rect x={60} y={10} width={10} height={85} fill="#228B22" rx={3} />
    <Rect x={30} y={25} width={10} height={3} fill="#1B6B1B" rx={1} />
    <Rect x={30} y={50} width={10} height={3} fill="#1B6B1B" rx={1} />
    <Rect x={30} y={75} width={10} height={3} fill="#1B6B1B" rx={1} />
    <Rect x={60} y={30} width={10} height={3} fill="#1B5E20" rx={1} />
    <Rect x={60} y={58} width={10} height={3} fill="#1B5E20" rx={1} />
    <Path d="M40 25 Q48 20, 52 28 Q46 24, 40 25Z" fill="#32CD32" />
    <Path d="M60 58 Q52 54, 48 62 Q54 56, 60 58Z" fill="#32CD32" />
    <Path d="M40 50 Q50 46, 54 52 Q48 48, 40 50Z" fill="#2E8B57" />
  </Svg>
));

const Grass = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={0} y={80} width={100} height={20} fill="#8B6914" opacity={0.3} rx={2} />
    <Path d="M20 82 Q18 50, 15 30" fill="none" stroke="#228B22" strokeWidth={3} strokeLinecap="round" />
    <Path d="M35 82 Q36 45, 40 20" fill="none" stroke="#2E8B57" strokeWidth={3} strokeLinecap="round" />
    <Path d="M50 82 Q48 40, 45 15" fill="none" stroke="#228B22" strokeWidth={3} strokeLinecap="round" />
    <Path d="M65 82 Q66 48, 70 25" fill="none" stroke="#32CD32" strokeWidth={3} strokeLinecap="round" />
    <Path d="M80 82 Q78 55, 82 35" fill="none" stroke="#2E8B57" strokeWidth={3} strokeLinecap="round" />
  </Svg>
));

const Fruit = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx={50} cy={55} r={30} fill="#E74C3C" />
    <Circle cx={50} cy={55} r={30} fill="#FF3B30" />
    <Path d="M50 25 Q52 15, 50 10 Q48 15, 50 25Z" fill="#8B4513" />
    <Path d="M50 20 Q58 12, 65 18 Q58 16, 50 20Z" fill="#228B22" />
    <Path d="M50 20 Q42 12, 35 18 Q42 16, 50 20Z" fill="#2E8B57" />
    <Path d="M38 40 Q42 35, 44 42" fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.4} />
  </Svg>
));

const Mushroom = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={40} y={55} width={20} height={35} fill="#F5DEB3" rx={4} />
    <Path d="M15 58 Q15 20, 50 15 Q85 20, 85 58 Q65 62, 50 62 Q35 62, 15 58Z" fill="#CD5C5C" stroke="#A0444A" strokeWidth={1.5} />
    <Circle cx={35} cy={35} r={5} fill="#FFFFFF" opacity={0.7} />
    <Circle cx={55} cy={28} r={6} fill="#FFFFFF" opacity={0.7} />
    <Circle cx={68} cy={40} r={4} fill="#FFFFFF" opacity={0.7} />
    <Circle cx={45} cy={48} r={4} fill="#FFFFFF" opacity={0.7} />
  </Svg>
));

const Branch = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M25 90 Q30 70, 40 55 Q50 40, 55 25" fill="none" stroke="#8B4513" strokeWidth={5} strokeLinecap="round" />
    <Path d="M40 55 Q50 48, 60 52" fill="none" stroke="#8B4513" strokeWidth={3.5} strokeLinecap="round" />
    <Path d="M60 52 Q68 48, 75 42" fill="none" stroke="#8B4513" strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M48 40 Q40 32, 30 28" fill="none" stroke="#8B4513" strokeWidth={3} strokeLinecap="round" />
    <Path d="M30 28 Q24 24, 18 22" fill="none" stroke="#8B4513" strokeWidth={2} strokeLinecap="round" />
    <Path d="M55 25 Q58 18, 62 12" fill="none" stroke="#8B4513" strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
));

const Root = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={0} y={20} width={100} height={4} fill="#8B6914" opacity={0.4} />
    <Line x1={50} y1={10} x2={50} y2={24} stroke="#228B22" strokeWidth={4} strokeLinecap="round" />
    <Path d="M50 24 Q50 40, 45 55 Q40 70, 30 85" fill="none" stroke="#8B4513" strokeWidth={4} strokeLinecap="round" />
    <Path d="M50 24 Q52 42, 58 58 Q64 72, 75 82" fill="none" stroke="#8B4513" strokeWidth={3.5} strokeLinecap="round" />
    <Path d="M45 45 Q38 52, 22 58" fill="none" stroke="#A0522D" strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M58 50 Q66 55, 82 56" fill="none" stroke="#A0522D" strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M42 62 Q35 68, 20 72" fill="none" stroke="#A0522D" strokeWidth={2} strokeLinecap="round" />
  </Svg>
));

const Petal = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M50 10 Q75 30, 75 55 Q75 80, 50 90 Q25 80, 25 55 Q25 30, 50 10Z" fill="#FF69B4" stroke="#FF1493" strokeWidth={1.5} />
    <Path d="M50 15 Q50 50, 50 85" fill="none" stroke="#FF1493" strokeWidth={1.5} opacity={0.5} />
    <Path d="M50 35 Q38 42, 32 55" fill="none" stroke="#FF1493" strokeWidth={1} opacity={0.4} />
    <Path d="M50 35 Q62 42, 68 55" fill="none" stroke="#FF1493" strokeWidth={1} opacity={0.4} />
    <Path d="M50 55 Q40 62, 35 72" fill="none" stroke="#FF1493" strokeWidth={1} opacity={0.4} />
    <Path d="M50 55 Q60 62, 65 72" fill="none" stroke="#FF1493" strokeWidth={1} opacity={0.4} />
  </Svg>
));

const Vine = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M50 5 Q30 20, 40 35 Q50 50, 35 60 Q20 70, 35 80 Q50 90, 45 95" fill="none" stroke="#228B22" strokeWidth={3} strokeLinecap="round" />
    <Path d="M40 20 Q32 15, 28 22 Q34 18, 40 20Z" fill="#32CD32" />
    <Path d="M40 20 Q48 16, 52 22 Q46 18, 40 20Z" fill="#228B22" />
    <Path d="M38 45 Q30 40, 26 46 Q32 42, 38 45Z" fill="#32CD32" />
    <Path d="M38 45 Q46 42, 50 48 Q44 44, 38 45Z" fill="#228B22" />
    <Path d="M32 70 Q24 65, 20 72 Q26 68, 32 70Z" fill="#32CD32" />
    <Path d="M32 70 Q40 67, 44 74 Q38 70, 32 70Z" fill="#228B22" />
    <Path d="M42 85 Q48 82, 52 86 Q48 84, 42 85Z" fill="#32CD32" />
  </Svg>
));

// ─── Sky / Geography ─────────────────────────────────────

const Sky = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={0} y={0} width={100} height={100} fill="#87CEEB" />
    <Rect x={0} y={0} width={100} height={40} fill="#6BB5D9" opacity={0.5} />
    <Circle cx={25} cy={35} r={10} fill="#FFFFFF" opacity={0.8} />
    <Circle cx={38} cy={30} r={12} fill="#FFFFFF" opacity={0.8} />
    <Circle cx={48} cy={35} r={9} fill="#FFFFFF" opacity={0.8} />
    <Rect x={18} y={35} width={35} height={8} fill="#FFFFFF" opacity={0.7} rx={4} />
    <Circle cx={72} cy={65} r={8} fill="#FFFFFF" opacity={0.6} />
    <Circle cx={82} cy={62} r={10} fill="#FFFFFF" opacity={0.6} />
    <Rect x={65} y={65} width={22} height={6} fill="#FFFFFF" opacity={0.5} rx={3} />
  </Svg>
));

const Earth = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx={50} cy={50} r={40} fill="#4169E1" />
    <Path d="M30 25 Q38 20, 48 22 Q55 24, 52 32 Q48 40, 38 38 Q28 35, 30 25Z" fill="#228B22" />
    <Path d="M58 18 Q68 15, 72 22 Q75 28, 70 30 Q62 32, 58 25 Q56 20, 58 18Z" fill="#228B22" />
    <Path d="M25 48 Q35 42, 45 48 Q55 54, 50 62 Q42 70, 32 65 Q20 58, 25 48Z" fill="#2E8B57" />
    <Path d="M62 45 Q72 40, 80 48 Q85 56, 78 62 Q70 66, 62 58 Q58 52, 62 45Z" fill="#228B22" />
    <Path d="M45 72 Q55 68, 60 75 Q62 82, 55 85 Q48 86, 45 80 Q42 76, 45 72Z" fill="#2E8B57" />
    <Circle cx={35} cy={30} r={40} fill="#FFFFFF" opacity={0.08} />
  </Svg>
));

const Rock = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M20 75 Q15 60, 25 45 Q35 30, 50 25 Q68 22, 80 35 Q90 48, 85 65 Q82 78, 70 82 Q55 86, 35 82 Q22 80, 20 75Z" fill="#808080" stroke="#666" strokeWidth={1.5} />
    <Path d="M30 50 Q40 35, 55 32 Q65 30, 72 38" fill="none" stroke="#999" strokeWidth={1.5} />
    <Path d="M25 65 Q35 55, 50 52 Q60 50, 70 55" fill="none" stroke="#6E6E6E" strokeWidth={1} />
    <Path d="M55 30 Q58 28, 62 30" fill="#999" opacity={0.3} />
    <Path d="M35 42 Q45 35, 52 38" fill="#999" opacity={0.2} />
  </Svg>
));

const River = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M35 0 Q20 20, 30 35 Q45 50, 35 65 Q20 80, 35 100 L65 100 Q80 80, 65 65 Q50 50, 65 35 Q80 20, 65 0 Z" fill="#4169E1" />
    <Path d="M42 5 Q32 22, 38 35 Q48 48, 40 62 Q30 78, 42 95" fill="none" stroke="#6B9BEF" strokeWidth={2} opacity={0.5} />
    <Path d="M55 8 Q48 25, 55 38 Q62 48, 55 60 Q45 75, 55 92" fill="none" stroke="#87CEEB" strokeWidth={1.5} opacity={0.4} />
  </Svg>
));

const Lake = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse cx={50} cy={55} rx={40} ry={30} fill="#4169E1" />
    <Ellipse cx={50} cy={52} rx={38} ry={28} fill="#4682B4" />
    <Ellipse cx={45} cy={48} rx={20} ry={8} fill="#6B9BEF" opacity={0.4} />
    <Path d="M25 55 Q35 50, 45 55 Q55 60, 65 55" fill="none" stroke="#87CEEB" strokeWidth={1.5} opacity={0.5} />
    <Path d="M30 65 Q40 60, 50 65 Q60 70, 70 65" fill="none" stroke="#87CEEB" strokeWidth={1} opacity={0.4} />
    <Rect x={0} y={78} width={100} height={22} fill="#8B6914" opacity={0.2} rx={2} />
  </Svg>
));

const Ocean = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={0} y={0} width={100} height={100} fill="#1E3A6E" />
    <Path d="M0 30 Q15 22, 30 30 Q45 38, 60 30 Q75 22, 90 30 L100 30 L100 45 Q85 37, 70 45 Q55 53, 40 45 Q25 37, 10 45 L0 45 Z" fill="#2558A0" />
    <Path d="M0 50 Q15 42, 30 50 Q45 58, 60 50 Q75 42, 90 50 L100 50 L100 65 Q85 57, 70 65 Q55 73, 40 65 Q25 57, 10 65 L0 65 Z" fill="#3068B0" />
    <Path d="M0 70 Q15 62, 30 70 Q45 78, 60 70 Q75 62, 90 70 L100 70 L100 85 Q85 77, 70 85 Q55 93, 40 85 Q25 77, 10 85 L0 85 Z" fill="#4080C0" />
    <Circle cx={75} cy={18} r={4} fill="#FFFFFF" opacity={0.3} />
  </Svg>
));

const Bridge = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x={0} y={55} width={100} height={10} fill="#808080" rx={2} />
    <Path d="M10 55 Q30 30, 50 55" fill="none" stroke="#A9A9A9" strokeWidth={4} />
    <Path d="M50 55 Q70 30, 90 55" fill="none" stroke="#A9A9A9" strokeWidth={4} />
    <Rect x={8} y={55} width={6} height={30} fill="#666" rx={1} />
    <Rect x={47} y={55} width={6} height={30} fill="#666" rx={1} />
    <Rect x={86} y={55} width={6} height={30} fill="#666" rx={1} />
    <Line x1={0} y1={53} x2={100} y2={53} stroke="#999" strokeWidth={2} />
    <Rect x={0} y={80} width={100} height={20} fill="#4169E1" opacity={0.3} rx={2} />
  </Svg>
));

const Road = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Polygon points="30,100 70,100 58,0 42,0" fill="#555555" />
    <Polygon points="32,100 68,100 57,0 43,0" fill="#666666" />
    <Rect x={48} y={5} width={4} height={14} fill="#FFFFFF" rx={1} />
    <Rect x={48} y={28} width={4} height={14} fill="#FFFFFF" rx={1} />
    <Rect x={48} y={52} width={4} height={14} fill="#FFFFFF" rx={1} />
    <Rect x={48} y={76} width={4} height={14} fill="#FFFFFF" rx={1} />
    <Line x1={35} y1={100} x2={44} y2={0} stroke="#FFD700" strokeWidth={1.5} />
    <Line x1={65} y1={100} x2={56} y2={0} stroke="#FFD700" strokeWidth={1.5} />
  </Svg>
));

const Cave = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M5 90 Q5 40, 20 25 Q35 10, 50 8 Q65 10, 80 25 Q95 40, 95 90 Z" fill="#808080" />
    <Path d="M20 90 Q22 55, 35 42 Q45 32, 50 30 Q55 32, 65 42 Q78 55, 80 90 Z" fill="#2F2F2F" />
    <Path d="M30 90 Q32 62, 42 50 Q48 44, 50 42 Q52 44, 58 50 Q68 62, 70 90 Z" fill="#1A1A1A" />
    <Polygon points="35,90 38,80 42,90" fill="#808080" opacity={0.5} />
    <Polygon points="55,90 58,82 62,90" fill="#808080" opacity={0.5} />
    <Polygon points="42,42 44,48 40,48" fill="#666" opacity={0.6} />
    <Polygon points="58,42 60,48 56,48" fill="#666" opacity={0.6} />
  </Svg>
));

const Island = memo(({ size = 80 }: SvgArtProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Path d="M0 60 Q15 55, 30 58 Q45 62, 60 58 Q75 54, 100 60 L100 100 L0 100 Z" fill="#4169E1" opacity={0.5} />
    <Ellipse cx={50} cy={65} rx={30} ry={10} fill="#F4D03F" />
    <Ellipse cx={50} cy={63} rx={28} ry={8} fill="#D4AC0D" opacity={0.4} />
    <Rect x={48} y={25} width={4} height={40} fill="#8B4513" rx={1} />
    <Path d="M52 28 Q68 22, 72 32 Q65 28, 52 30Z" fill="#228B22" />
    <Path d="M52 32 Q66 28, 70 38 Q62 33, 52 35Z" fill="#2E8B57" />
    <Path d="M48 30 Q35 24, 30 34 Q37 29, 48 32Z" fill="#228B22" />
    <Path d="M0 70 Q20 65, 40 70 Q60 75, 80 70 Q90 68, 100 72 L100 100 L0 100 Z" fill="#4169E1" opacity={0.3} />
  </Svg>
));

// ─── SVG Art Map ──────────────────────────────────────────

export const SVG_ART_MAP: Record<string, React.ComponentType<SvgArtProps>> = {
  // Nature
  sun: Sun,
  moon: Moon,
  star: Star,
  tree: Tree,
  water: Water,
  mountain: Mountain,
  fire: Fire,
  rain: Rain,
  cloud: Cloud,
  flower: Flower,
  // Animals
  fish: Fish,
  bird: Bird,
  chicken: Chicken,
  pig: Pig,
  dog: Dog,
  cat: Cat,
  horse: Horse,
  cow: Cow,
  snake: Snake,
  butterfly: Butterfly,
  // Household
  house: House,
  door: Door,
  table: Table,
  chair: Chair,
  bed: Bed,
  pot: Pot,
  bowl: Bowl,
  spoon: Spoon,
  knife: Knife,
  broom: Broom,
  // Food
  rice: Rice,
  egg: Egg,
  meat: Meat,
  salt: Salt,
  sugar: Sugar,
  banana: Banana,
  mango: Mango,
  corn: Corn,
  taro: Taro,
  ginger: Ginger,
  // Body
  eye: Eye,
  ear: Ear,
  hand: Hand,
  foot: Foot,
  head: Head,
  mouth: Mouth,
  nose: Nose,
  hair: Hair,
  tooth: Tooth,
  heart: Heart,
  // Clothing
  shirt: Shirt,
  pants: Pants,
  shoe: Shoe,
  hat: Hat,
  glove: Glove,
  belt: Belt,
  dress: Dress,
  sock: Sock,
  ring: Ring,
  scarf: Scarf,
  // Weather
  wind: Wind,
  snow: Snow,
  thunder: Thunder,
  lightning: Lightning,
  fog: Fog,
  rainbow: Rainbow,
  ice: Ice,
  storm: Storm,
  sunrise: Sunrise,
  sunset: Sunset,
  // Tools
  hammer: Hammer,
  axe: Axe,
  bell: Bell,
  scissors: Scissors,
  needle: Needle,
  basket: Basket,
  candle: Candle,
  key: Key,
  pen: Pen,
  book: Book,
  // Plants
  leaf: Leaf,
  seed: Seed,
  bamboo: Bamboo,
  grass: Grass,
  fruit: Fruit,
  mushroom: Mushroom,
  branch: Branch,
  root: Root,
  petal: Petal,
  vine: Vine,
  // Sky / Geography
  sky: Sky,
  earth: Earth,
  rock: Rock,
  river: River,
  lake: Lake,
  ocean: Ocean,
  bridge: Bridge,
  road: Road,
  cave: Cave,
  island: Island,
};

// ─── Convenience Component ────────────────────────────────

interface VocabArtProps {
  svgKey: string;
  size?: number;
}

export const VocabArt = memo(({ svgKey, size = 80 }: VocabArtProps) => {
  const Component = SVG_ART_MAP[svgKey];
  if (!Component) return null;
  return <Component size={size} />;
});
