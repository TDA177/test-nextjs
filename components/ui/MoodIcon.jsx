import {
  Heart,
  Smile,
  Flower2,
  Cloud,
  Moon,
  CloudRain,
  Flame,
  Sparkles,
  Utensils,
  Coffee,
  Laptop,
  Balloon,
} from 'lucide-react';

const ICON_MAP = {
  yeu: Heart,
  vui: Smile,
  binhyen: Flower2,
  mongmo: Cloud,
  met: Moon,
  buon: CloudRain,
  tuc: Flame,
  wow: Sparkles,
  an: Utensils,
  caphe: Coffee,
  lam: Laptop,
  choi: Balloon,
};

export default function MoodIcon({ moodId, size = 16, color, strokeWidth = 2.25 }) {
  const Icon = ICON_MAP[moodId] || Heart;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} aria-hidden />;
}
