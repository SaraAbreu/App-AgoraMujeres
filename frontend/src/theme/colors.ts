// Ágora Mujeres - Paleta de colores estilo Boho/Natural
// Basada en las imágenes de referencia proporcionadas
// Verde musgo, marrón cálido, beige crema

export const colors = {
  // Verde musgo - Color principal de fondo (de la imagen de referencia)
  mossGreen: '#8A8C6C',
  mossGreenLight: '#A5A78A',
  mossGreenDark: '#6B6D52',
  
  // Marrón cálido/terracota - Para cabeceras y acentos (de la imagen de referencia)
  warmBrown: '#B87333',
  warmBrownLight: '#D4956A',
  warmBrownDark: '#8B5A2B',
  
  // Beige/crema - Para cards y superficies (de la imagen de referencia)
  cream: '#D4C8BE',
  creamLight: '#EDE8E3',
  creamDark: '#C4B5A8',
  
  // Primary (usando verde musgo)
  primary: '#8A8C6C',
  primaryLight: '#A5A78A',
  primaryDark: '#6B6D52',
  
  // Secondary (usando marrón cálido)
  secondary: '#B87333',
  secondaryLight: '#D4956A',
  secondaryDark: '#8B5A2B',
  
  // Accent (dusty rose suave)
  accent: '#C9A59A',
  accentLight: '#E8D5CE',
  accentDark: '#A8857A',
  
  // Background - Verde musgo como principal
  background: '#8A8C6C',
  backgroundAlt: '#7D7F61',
  surface: '#EDE8E3',        // Crema claro para cards
  surfaceAlt: '#D4C8BE',     // Beige para cards secundarias
  
  // Text colors
  text: '#3D3628',           // Marrón muy oscuro para texto principal
  textSecondary: '#5D4E43',  // Marrón medio
  textLight: '#8B7B6B',      // Marrón claro
  textOnDark: '#F5F2EF',     // Blanco cálido para texto sobre fondo oscuro
  textOnPrimary: '#F5F2EF',  // Texto sobre verde musgo
  
  // Emotional state colors (tonos pastel suaves)
  emotion: {
    calma: '#9CAF88',        // Verde salvia suave
    fatiga: '#C4A484',       // Tan cálido
    niebla: '#B8AFA7',       // Gris cálido
    dolor: '#C9A59A',        // Rosa polvo
    gratitud: '#D4B896',     // Dorado cálido
    tension: '#C9A587',      // Terracota suave
  },
  
  // Status colors (versiones suaves)
  success: '#9CAF88',
  warning: '#D4956A',
  error: '#C08080',
  info: '#A5B8C4',
  
  // Utility
  border: '#D4C8BE',
  borderLight: '#EDE8E3',
  shadow: 'rgba(61, 54, 40, 0.12)',
  shadowDark: 'rgba(61, 54, 40, 0.2)',
  overlay: 'rgba(61, 54, 40, 0.5)',
  
  // Transparent
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
  softWhite: '#F5F2EF',
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

// Border radius - más redondeados para sensación orgánica
export const borderRadius = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

// Typography
export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 36,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  fonts: {
    heading: 'Cormorant_600SemiBold',
    headingBold: 'Cormorant_700Bold',
    body: 'Nunito_400Regular',
    bodyMedium: 'Nunito_500Medium',
    bodySemibold: 'Nunito_600SemiBold',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  }
};

export default { colors, spacing, borderRadius, typography };
