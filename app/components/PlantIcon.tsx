import { MASTERED_LEVEL } from '../hooks/useVocabState';
import { BeanIcon } from './icons/BeanIcon';
import { FlowerIcon } from './icons/FlowerIcon';
import { LeafIcon } from './icons/LeafIcon';
import { SproutIcon } from './icons/SproutIcon';

const EMOJI_ICONS: Record<number, string> = {
  5: '🌳',
};

interface PlantIconProps {
  level: number;
  className?: string;
}

export function PlantIcon({ level, className = '' }: PlantIconProps) {
  if (level >= MASTERED_LEVEL) {
    return <span className={className}>🏆</span>;
  }

  if (level === 1) {
    return <BeanIcon className={className} />;
  }

  if (level === 2) {
    return <SproutIcon className={className} />;
  }

  if (level === 3) {
    return <LeafIcon className={className} />;
  }

  if (level === 4) {
    return <FlowerIcon className={className} />;
  }

  return <span className={className}>{EMOJI_ICONS[level] || EMOJI_ICONS[5]}</span>;
}
