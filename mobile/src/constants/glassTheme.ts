/**
 * FreshGuard Glassmorphism Design System — Premium Soft Glass Tokens
 * 
 * Aligned with the new theme.ts color palette:
 * - Premium deep agricultural green with warm neutral surfaces
 * - Primary: #145C2E (premium deep green)
 * - Warm off-white base: #FAF9F5
 * - Glass surfaces with subtle frost effect
 * 
 * Glass Levels:
 * - Level 1: Main cards and panels (subtle, readable)
 * - Level 2: Elevated cards, dialogs, important widgets (more elevation)
 * - Level 3: Modals, bottom sheets, high elevation
 */

// ============================================================================
// COLORS — Aligned with theme.ts
// ============================================================================
export const GlassColors = {
  // Brand — Premium deep green (from theme.ts)
  primary: '#145C2E',
  primaryLight: '#145C2E',
  primarySoft: '#145C2E',
  primaryMuted: '#145C2E',
  primaryDeep: '#145C2E',

  // Backgrounds & Surfaces — Warm off-white base (from theme.ts)
  background: '#FAF9F5',     // Warm off-white — screen background
  surface: '#FFFFFF',        // Pure white — solid cards
  surfaceGlass1: 'rgba(255, 255, 255, 0.75)',   // Glass Level 1 — main cards
  surfaceGlass2: 'rgba(255, 255, 255, 0.85)',   // Glass Level 2 — elevated
  surfaceGlass3: 'rgba(255, 255, 255, 0.55)',   // Glass Level 3 — subtle
  surfaceAlt: '#F5F3ED',     // Warm cream — subtle fills, icon circles
  
  // Dividers & Borders — Very low contrast
  divider: '#E8E5DD',        // Subtle divider
  dividerLight: '#F0EDE6',   // Very light divider
  borderGlass: 'rgba(20, 92, 46, 0.12)',
  borderGlassStrong: 'rgba(20, 92, 46, 0.20)',

  // Text — High readability (from theme.ts)
  textPrimary: '#1A1A18',    // Near-black — headings
  textSecondary: '#4A4F48',  // Dark grey — body text
  textMuted: '#8A8F87',      // Medium grey — captions
  textOnPrimary: '#FFFFFF',  // White — on primary
  textOnGlass: '#145C2E',    // Dark green — on glass surfaces
  textPlaceholder: '#A8ADA5', // Input placeholders

  // Status / Semantic — Muted but clear (from theme.ts)
  success: '#145C2E',
  successBg: '#145C2E',
  successLight: '#145C2E',
  warning: '#E8A317',        // Amber — warnings
  warningBg: '#FEF9E7',      // Light amber background
  warningIcon: '#F0A500',    // Warning icons
  error: '#D14343',          // Red — errors (softer)
  errorBg: '#FEF0F0',        // Light error background
  info: '#3A8FD8',           // Blue — informational
  infoBg: '#EBF5FC',         // Light blue background

  // Glass-specific shadows
  shadowGlass1: 'rgba(45, 58, 40, 0.06)',   // Level 1 — subtle
  shadowGlass2: 'rgba(45, 58, 40, 0.10)',   // Level 2 — elevated
  shadowGlass3: 'rgba(45, 58, 40, 0.14)',   // Level 3 — dialogs
  shadowGlassStrong: 'rgba(45, 58, 40, 0.18)', // Strong — modals

  // Highlight / inner glow for glass
  highlightGlass: 'rgba(255, 255, 255, 0.4)', // Top edge highlight
} as const;

// ============================================================================
// GLASS LEVELS — Three-tier glass system
// ============================================================================
export const GlassLevels = {
  // Level 1 — Main cards, panels (subtle, readable content)
  level1: {
    background: 'rgba(255, 255, 255, 0.75)',
    backdropBlur: 20,
    backdropSaturate: 120,
    borderColor: 'rgba(20, 92, 46, 0.12)',
    borderWidth: 1,
    borderRadius: 20,
    shadow: {
      shadowColor: '#2D3A28',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
      elevation: 4,
    },
    innerHighlight: true,
  },

  // Level 2 — Elevated cards, dialogs, important widgets
  level2: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropBlur: 24,
    backdropSaturate: 130,
    borderColor: 'rgba(20, 92, 46, 0.20)',
    borderWidth: 1,
    borderRadius: 24,
    shadow: {
      shadowColor: '#2D3A28',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.08,
      shadowRadius: 32,
      elevation: 8,
    },
    innerHighlight: true,
  },

  // Level 3 — Modals, bottom sheets, high elevation
  level3: {
    background: 'rgba(255, 255, 255, 0.92)',
    backdropBlur: 28,
    backdropSaturate: 140,
    borderColor: 'rgba(20, 92, 46, 0.20)',
    borderWidth: 1,
    borderRadius: 28,
    shadow: {
      shadowColor: '#2D3A28',
      shadowOffset: { width: 0, height: 32 },
      shadowOpacity: 0.12,
      shadowRadius: 48,
      elevation: 16,
    },
    innerHighlight: true,
  },

  // Navigation / Tab bar specific
  navigation: {
    background: 'rgba(255, 255, 255, 0.88)',
    backdropBlur: 20,
    backdropSaturate: 120,
    borderTopColor: '#F0EDE6',
    borderTopWidth: 0.5,
    shadow: {
      shadowColor: '#2D3A28',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
      elevation: 8,
    },
  },

  // Modal / Bottom sheet
  modal: {
    background: 'rgba(255, 255, 255, 0.92)',
    backdropBlur: 28,
    backdropSaturate: 140,
    borderColor: 'rgba(20, 92, 46, 0.20)',
    borderWidth: 1,
    borderRadius: 28,
    shadow: {
      shadowColor: '#2D3A28',
      shadowOffset: { width: 0, height: 32 },
      shadowOpacity: 0.12,
      shadowRadius: 48,
      elevation: 16,
    },
    innerHighlight: true,
  },
} as const;

// ============================================================================
// SPACING — 4px base scale (consistent with theme.ts)
// ============================================================================
export const GlassSpacing = {
  // Base scale (4px increments)
  0: 0,
  1: 4,   // xxs
  2: 8,   // xs
  3: 12,  // sm
  4: 16,  // md
  5: 20,  // lg
  6: 24,  // xl
  7: 28,  // xxl
  8: 32,  // xxxl
  9: 40,  // huge
  10: 48, // massive
  11: 56, // ultra
  12: 64, // max
  
  // Named semantic tokens (aligned with theme.ts Spacing)
  inset: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  gap: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  screenPadding: 20,
  sectionGap: 24,
  majorSectionGap: 32,
  cardPadding: 20,
  cardPaddingSm: 16,
  cardPaddingLg: 28,
} as const;

// ============================================================================
// BORDER RADIUS — Glass-appropriate scale (aligned with theme.ts BorderRadius)
// ============================================================================
export const GlassBorderRadius = {
  xs: 8,      // Chips, badges
  sm: 12,     // Small buttons, chips
  md: 16,     // Buttons, inputs, small cards
  lg: 20,     // Standard cards
  xl: 24,     // Large cards, panels
  xxl: 28,    // Large containers, sheets
  xxxl: 32,   // Modals, large containers
  full: 9999, // Pills, avatars, full round
} as const;

// ============================================================================
// TYPOGRAPHY — Refined scale (Plus Jakarta Sans, aligned with theme.ts)
// ============================================================================
export const GlassTypography = {
  fontFamily: 'PlusJakartaSans',
  fontFamilies: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semibold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
  },
  
  // Scale (aligned with theme.ts Typography)
  display: { fontSize: 32, lineHeight: 40, letterSpacing: -0.02, weight: '700' },
  h1: { fontSize: 28, lineHeight: 34, letterSpacing: -0.01, weight: '600' },
  h2: { fontSize: 24, lineHeight: 30, letterSpacing: -0.01, weight: '700' },
  h3: { fontSize: 22, lineHeight: 28, letterSpacing: -0.01, weight: '600' },
  h4: { fontSize: 20, lineHeight: 26, letterSpacing: -0.01, weight: '600' },
  h5: { fontSize: 18, lineHeight: 24, letterSpacing: -0.01, weight: '600' },
  
  bodyLg: { fontSize: 18, lineHeight: 24, weight: '500' },
  body: { fontSize: 16, lineHeight: 24, weight: '400' },
  bodyBold: { fontSize: 16, lineHeight: 22, weight: '600' },
  bodyMd: { fontSize: 15, lineHeight: 22, weight: '400' },
  bodyMdBold: { fontSize: 15, lineHeight: 22, weight: '600' },
  bodySm: { fontSize: 14, lineHeight: 20, weight: '400' },
  caption: { fontSize: 14, lineHeight: 20, weight: '400' },
  captionBold: { fontSize: 14, lineHeight: 20, weight: '600' },
  small: { fontSize: 13, lineHeight: 18, weight: '400' },
  label: { fontSize: 12, lineHeight: 16, letterSpacing: 0.02, weight: '600', textTransform: 'uppercase' as const },
  labelSm: { fontSize: 11, lineHeight: 14, letterSpacing: 0.03, weight: '600', textTransform: 'uppercase' as const },
  button: { fontSize: 16, lineHeight: 22, weight: '600' },
} as const;

// ============================================================================
// SHADOWS — Glass-appropriate elevations (aligned with theme.ts Shadows)
// ============================================================================
export const GlassShadows = {
  none: {},
  glass1: {
    shadowColor: '#2D3A28',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  glass2: {
    shadowColor: '#2D3A28',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
  },
  glass3: {
    shadowColor: '#2D3A28',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 12,
  },
  modal: {
    shadowColor: '#2D3A28',
    shadowOffset: { width: 0, height: 32 },
    shadowOpacity: 0.12,
    shadowRadius: 48,
    elevation: 20,
  },
  button: {
    shadowColor: '#2D3A28',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonPressed: {
    shadowColor: '#2D3A28',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  nav: {
    shadowColor: '#2D3A28',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

// ============================================================================
// OPACITY / OVERLAY
// ============================================================================
export const GlassOpacity = {
  overlay: 0.35,        // Modal overlay
  overlayLight: 0.2,    // Light overlay
  disabled: 0.5,        // Disabled elements
  hover: 0.08,          // Hover state
  pressed: 0.12,        // Pressed state
  focus: 0.15,          // Focus ring
} as const;

// ============================================================================
// TRANSITION / MOTION — Gentle, premium timing (aligned with MotionSystem)
// ============================================================================
export const GlassMotion = {
  // Durations
  duration: {
    micro: 120,      // Tiny feedback
    fast: 180,       // Button press, toggle
    standard: 250,   // Card entrance, transitions
    moderate: 350,   // Panel transitions
    slow: 450,       // Modal/sheet entrance
    slower: 550,     // Page transitions
    slowest: 700,    // Major transitions
  },
  
  // Easing curves — Gentle deceleration
  easing: {
    standard: 'cubic-bezier(0.22, 1, 0.36, 1)',      // Main ease-out
    entrance: 'cubic-bezier(0.2, 0.9, 0.2, 1)',      // Entrances
    exit: 'cubic-bezier(0.4, 0, 0.6, 1)',            // Exits
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',     // Spring-like
    gentle: 'cubic-bezier(0.25, 0.9, 0.3, 0.99)',    // Gentle settle
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',           // Sharp exit
  },
  
  // Stagger
  stagger: {
    delay: 40,
    maxDelay: 200,
  },
} as const;

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================
export const GlassZIndex = {
  base: 0,
  content: 10,
  sticky: 50,
  dropdown: 100,
  stickyHeader: 200,
  modal: 300,
  modalBackdrop: 290,
  toast: 400,
  tooltip: 500,
} as const;

// ============================================================================
// COMPONENT SIZE PRESETS
// ============================================================================
export const GlassSizes = {
  button: {
    height: { sm: 40, md: 48, lg: 56 },
    padding: { sm: 12, md: 16, lg: 20 },
    borderRadius: 14,
  },
  input: {
    height: { sm: 40, md: 48, lg: 56 },
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  card: {
    padding: { sm: 16, md: 20, lg: 24 },
    borderRadius: 20,
  },
  chip: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  avatar: {
    size: { xs: 28, sm: 36, md: 44, lg: 56, xl: 72 },
    borderRadius: 9999,
  },
  iconButton: {
    size: { sm: 36, md: 44, lg: 52 },
    borderRadius: 12,
  },
} as const;

// ============================================================================
// EXPORT ALL TOKENS
// ============================================================================
export const GlassTokens = {
  colors: GlassColors,
  levels: GlassLevels,
  spacing: GlassSpacing,
  borderRadius: GlassBorderRadius,
  typography: GlassTypography,
  shadows: GlassShadows,
  opacity: GlassOpacity,
  motion: GlassMotion,
  zIndex: GlassZIndex,
  sizes: GlassSizes,
} as const;

// Helper to create style objects from tokens
export const createGlassStyle = (level: keyof typeof GlassLevels) => {
  const config = GlassLevels[level];
  return {
    backgroundColor: config.background,
    borderWidth: 'borderWidth' in config ? config.borderWidth : 0,
    borderColor: 'borderColor' in config ? config.borderColor : 'transparent',
    borderRadius: 'borderRadius' in config ? config.borderRadius : 0,
    ...config.shadow,
  };
};

// Helper to get backdrop filter style (for web)
export const getBackdropFilter = (level: keyof typeof GlassLevels) => {
  const config = GlassLevels[level];
  return {
    backdropFilter: `blur(${config.backdropBlur}px) saturate(${config.backdropSaturate}%)`,
    WebkitBackdropFilter: `blur(${config.backdropBlur}px) saturate(${config.backdropSaturate}%)`,
  };
};

export default {
  colors: GlassColors,
  levels: GlassLevels,
  spacing: GlassSpacing,
  borderRadius: GlassBorderRadius,
  typography: GlassTypography,
  shadows: GlassShadows,
  opacity: GlassOpacity,
  motion: GlassMotion,
  zIndex: GlassZIndex,
  sizes: GlassSizes,
};
