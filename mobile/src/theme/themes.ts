import type { ThemeDefinition } from '../store/themeStore';

export const THEMES: Record<string, ThemeDefinition> = {
  default: {
    id: 'default',
    name: 'Enchanted',
    description: 'Classic purple elegance',
    unlocksAtXp: 0,
    lightPalette: {
      primary: '#6D28D9',
      onPrimary: '#F4F4FF',
      secondary: '#4C1D95',
      background: '#F6F3FF',
      surface: 'rgba(255, 255, 255, 0.96)',
      surfaceVariant: '#E8E7FF',
      outline: '#A5A1D6',
      tertiary: '#F59E0B',
      onSurface: '#1F1A3D',
      onSurfaceVariant: '#4B5563'
    },
    darkPalette: {
      primary: '#C4B5FD',
      onPrimary: '#1B1033',
      secondary: '#A855F7',
      background: '#0F172A',
      surface: 'rgba(17, 24, 39, 0.86)',
      surfaceVariant: '#1E1B4B',
      outline: '#433B7C',
      tertiary: '#FBBF24',
      onSurface: '#E5E7EB',
      onSurfaceVariant: '#CBD5F5'
    }
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Lush greens and earthy tones',
    unlocksAtXp: 100,
    lightPalette: {
      primary: '#16A34A',
      onPrimary: '#F0FDF4',
      secondary: '#166534',
      background: '#F7FFEE',
      surface: 'rgba(255, 255, 255, 0.96)',
      surfaceVariant: '#DBEAFE',
      outline: '#86EFAC',
      tertiary: '#CA8A04',
      onSurface: '#1B4332',
      onSurfaceVariant: '#365B37'
    },
    darkPalette: {
      primary: '#86EFAC',
      onPrimary: '#051C15',
      secondary: '#4ADE80',
      background: '#0A2818',
      surface: 'rgba(15, 30, 20, 0.86)',
      surfaceVariant: '#1B4332',
      outline: '#2D5F3F',
      tertiary: '#FACC15',
      onSurface: '#E5E7EB',
      onSurfaceVariant: '#A7E8BD'
    }
  },
  lava: {
    id: 'lava',
    name: 'Lava',
    description: 'Bold reds and warm oranges',
    unlocksAtXp: 250,
    lightPalette: {
      primary: '#DC2626',
      onPrimary: '#FEF2F2',
      secondary: '#7F1D1D',
      background: '#FEF2F2',
      surface: 'rgba(255, 255, 255, 0.96)',
      surfaceVariant: '#FED7AA',
      outline: '#F87171',
      tertiary: '#EA580C',
      onSurface: '#5B0D0D',
      onSurfaceVariant: '#78290B'
    },
    darkPalette: {
      primary: '#FCA5A5',
      onPrimary: '#5B0D0D',
      secondary: '#FCA5A5',
      background: '#1F0F0F',
      surface: 'rgba(32, 15, 15, 0.86)',
      surfaceVariant: '#5B1D1D',
      outline: '#7F3C3C',
      tertiary: '#F97316',
      onSurface: '#E5E7EB',
      onSurfaceVariant: '#F5A99F'
    }
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool blues and aqua waves',
    unlocksAtXp: 500,
    lightPalette: {
      primary: '#0369A1',
      onPrimary: '#F0F9FF',
      secondary: '#003D5B',
      background: '#F0F9FF',
      surface: 'rgba(255, 255, 255, 0.96)',
      surfaceVariant: '#CFFAFE',
      outline: '#38BDF8',
      tertiary: '#06B6D4',
      onSurface: '#0C2340',
      onSurfaceVariant: '#165E7E'
    },
    darkPalette: {
      primary: '#7DD3FC',
      onPrimary: '#082F49',
      secondary: '#0DD9FF',
      background: '#051B2B',
      surface: 'rgba(5, 25, 40, 0.86)',
      surfaceVariant: '#0C3F5C',
      outline: '#165E7E',
      tertiary: '#06B6D4',
      onSurface: '#E5E7EB',
      onSurfaceVariant: '#7DD3FC'
    }
  },
  twilight: {
    id: 'twilight',
    name: 'Twilight',
    description: 'Indigo dusk and violet skies',
    unlocksAtXp: 750,
    lightPalette: {
      primary: '#5B21B6',
      onPrimary: '#FAF5FF',
      secondary: '#312E81',
      background: '#FAF5FF',
      surface: 'rgba(255, 255, 255, 0.96)',
      surfaceVariant: '#E9D5FF',
      outline: '#C4B5FD',
      tertiary: '#7C3AED',
      onSurface: '#371D5C',
      onSurfaceVariant: '#6B21A8'
    },
    darkPalette: {
      primary: '#D8B4FE',
      onPrimary: '#2D1B4E',
      secondary: '#A78BFA',
      background: '#1A0F33',
      surface: 'rgba(25, 10, 45, 0.86)',
      surfaceVariant: '#3E2C5C',
      outline: '#6B21A8',
      tertiary: '#A78BFA',
      onSurface: '#E5E7EB',
      onSurfaceVariant: '#D8B4FE'
    }
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm golds and rosy pinks',
    unlocksAtXp: 1000,
    lightPalette: {
      primary: '#D97706',
      onPrimary: '#FFFBEB',
      secondary: '#92400E',
      background: '#FFFBEB',
      surface: 'rgba(255, 255, 255, 0.96)',
      surfaceVariant: '#FED7AA',
      outline: '#FDBA74',
      tertiary: '#F97316',
      onSurface: '#78350F',
      onSurfaceVariant: '#B45309'
    },
    darkPalette: {
      primary: '#FBBF24',
      onPrimary: '#4B2006',
      secondary: '#FCD34D',
      background: '#2B1F0F',
      surface: 'rgba(35, 25, 10, 0.86)',
      surfaceVariant: '#78350F',
      outline: '#B45309',
      tertiary: '#FB923C',
      onSurface: '#E5E7EB',
      onSurfaceVariant: '#FED7AA'
    }
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep blacks with silver accents',
    unlocksAtXp: 2500,
    lightPalette: {
      primary: '#1F2937',
      onPrimary: '#F3F4F6',
      secondary: '#111827',
      background: '#F9FAFB',
      surface: 'rgba(255, 255, 255, 0.96)',
      surfaceVariant: '#E5E7EB',
      outline: '#D1D5DB',
      tertiary: '#6B7280',
      onSurface: '#030712',
      onSurfaceVariant: '#374151'
    },
    darkPalette: {
      primary: '#E5E7EB',
      onPrimary: '#030712',
      secondary: '#F3F4F6',
      background: '#030712',
      surface: 'rgba(3, 7, 18, 0.86)',
      surfaceVariant: '#111827',
      outline: '#374151',
      tertiary: '#9CA3AF',
      onSurface: '#E5E7EB',
      onSurfaceVariant: '#D1D5DB'
    }
  }
};

export const getTheme = (id: string): ThemeDefinition => {
  return THEMES[id] || THEMES.default;
};
