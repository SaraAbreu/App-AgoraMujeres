// Therapeutic color palette for Ágora Mujeres
// Designed to feel warm, safe, and calming

export const colors = {
  // Primary colors - soft and calming
  primary: '#B8A9C9',      // Soft lavender
  primaryLight: '#E6E0ED', // Light lavender
  primaryDark: '#8B7A9E',  // Darker lavender
  
  // Secondary colors - warm and comforting
  secondary: '#E8D5D5',    // Warm blush
  secondaryLight: '#F5EDED', // Light blush
  secondaryDark: '#C9ABAB',  // Darker blush
  
  // Accent colors - nature-inspired
  accent: '#C1D9C6',       // Sage green (calm, healing)
  accentLight: '#E4EFE6',  // Light sage
  accentDark: '#9BBF9E',   // Darker sage
  
  // Background colors
  background: '#FDFBF9',   // Warm cream white
  backgroundAlt: '#F7F3EF', // Slightly darker cream
  surface: '#FFFFFF',      // Pure white for cards
  
  // Text colors
  text: '#4A4A4A',         // Warm charcoal (not harsh black)
  textSecondary: '#7A7A7A', // Muted gray
  textLight: '#A0A0A0',    // Light gray
  textOnPrimary: '#FFFFFF', // White on primary
  
  // Emotional state colors (soft, not alarming)
  emotion: {
    calma: '#A8D5BA',      // Soft green
    fatiga: '#D4C5A9',     // Muted gold
    niebla: '#C5C5D4',     // Soft gray-blue
    dolor: '#D4A9A9',      // Soft rose
    gratitud: '#A9C5D4',   // Soft blue
    tension: '#D4B8A9',    // Soft coral
  },
  
  // Status colors (gentle versions)
  success: '#9BBF9E',      // Soft green
  warning: '#D4C08A',      // Soft amber
  error: '#C9A0A0',        // Soft red
  info: '#A0B8C9',         // Soft blue
  
  // Utility
  border: '#E8E4E0',       // Soft border
  shadow: 'rgba(0, 0, 0, 0.05)', // Very subtle shadow
  overlay: 'rgba(74, 74, 74, 0.3)', // Soft overlay
  
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

// Border radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Typography
export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export default { colors, spacing, borderRadius, typography };
