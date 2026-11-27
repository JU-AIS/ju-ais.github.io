export type PartnerTier = 'main' | 'partner' | 'supporter';

export interface Partner {
  name: string;
  logo: string;
  url: string;
  tier: PartnerTier;
}

export const partners: Partner[] = [
  { name: 'Lovable', logo: '/partners/lovable.svg', url: 'https://lovable.dev', tier: 'main' },
];
