import { MASTERED_LEVEL } from '../hooks/useVocabState';

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function getPlantIcon(level: number): string {
  if (level >= MASTERED_LEVEL) return '✨🌳✨';
  const icons: Record<number, string> = {
    1: '🌰',
    2: '🌱',
    3: '🌿',
    4: '🪴',
    5: '🌳'
  };
  return icons[level] || icons[1];
}
