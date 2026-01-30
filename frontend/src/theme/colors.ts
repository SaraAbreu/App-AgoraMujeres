// Boho-inspired therapeutic color palette for Ágora Mujeres
// Earthy, warm, natural tones that feel organic and calming

export const colors = {
  // Primary colors - warm terracotta and earth tones
  primary: '#C4A484',        // Warm tan/camel
  primaryLight: '#E8DDD4',   // Light sand
  primaryDark: '#A67B5B',    // Terracotta brown
  
  // Secondary colors - sage and olive
  secondary: '#9CAF88',      // Sage green
  secondaryLight: '#D4E2D4', // Light sage
  secondaryDark: '#7A9A65',  // Olive green
  
  // Accent colors - dusty rose and burnt orange
  accent: '#D4A5A5',         // Dusty rose
  accentLight: '#F0E4E4',    // Light blush
  accentDark: '#C08080',     // Muted rose
  
  // Warm accent
  warmAccent: '#D4956A',     // Burnt sienna
  warmAccentLight: '#F0DDD0',// Light peach
  
  // Background colors - natural cream and linen
  background: '#FAF8F5',     // Warm off-white/linen
  backgroundAlt: '#F5F0EB',  // Light beige
  surface: '#FFFFFF',        // Pure white for cards
  
  // Text colors - warm browns
  text: '#5D4E43',           // Warm brown (softer than black)
  textSecondary: '#8B7B6B',  // Muted brown
  textLight: '#A99B8D',      // Light taupe
  textOnPrimary: '#FFFFFF',  // White on primary
  
  // Emotional state colors (earthy, boho palette)
  emotion: {
    calma: '#9CAF88',        // Sage green - peaceful
    fatiga: '#C4A484',       // Warm tan - tired earth
    niebla: '#B8AFA7',       // Warm gray - fog
    dolor: '#D4A5A5',        // Dusty rose - gentle pain
    gratitud: '#D4B896',     // Warm gold - grateful
    tension: '#C9A587',      // Terracotta - tension
  },
  
  // Status colors (muted, natural)
  success: '#9CAF88',        // Sage green
  warning: '#D4956A',        // Burnt sienna
  error: '#C08080',          // Dusty rose
  info: '#A5B8C4',           // Muted blue-gray
  
  // Utility
  border: '#E8E0D8',         // Warm beige border
  shadow: 'rgba(93, 78, 67, 0.08)', // Warm shadow
  overlay: 'rgba(93, 78, 67, 0.4)', // Warm overlay
  
  // Transparent versions
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};

// Spacing scale (8pt grid)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius - softer, more organic
export const borderRadius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  full: 9999,
};

// Typography
export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 26,
    xxl: 34,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  // Font families - will be loaded via expo-font
  fonts: {
    heading: 'Cormorant_600SemiBold',
    headingBold: 'Cormorant_700Bold',
    body: 'Nunito_400Regular',
    bodyMedium: 'Nunito_500Medium',
    bodySemibold: 'Nunito_600SemiBold',
  }
};

export default { colors, spacing, borderRadius, typography };
