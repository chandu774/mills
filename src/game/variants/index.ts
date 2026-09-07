import { GameVariant } from '@/lib/types';
import { VariantConfig } from '../engine/types';
import { MILLS_3_CONFIG } from './mills3';
import { MILLS_6_CONFIG } from './mills6';
import { MILLS_9_CONFIG } from './mills9';

export { MILLS_3_CONFIG, MILLS_6_CONFIG, MILLS_9_CONFIG };

export function getVariantConfig(variant: GameVariant): VariantConfig {
  switch (variant) {
    case 'MILLS_3':
      return MILLS_3_CONFIG;
    case 'MILLS_6':
      return MILLS_6_CONFIG;
    case 'MILLS_9':
      return MILLS_9_CONFIG;
    default:
      throw new Error(`Unsupported game variant: ${variant}`);
  }
}
