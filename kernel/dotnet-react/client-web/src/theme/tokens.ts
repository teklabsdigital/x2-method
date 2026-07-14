/**
 * The sole token source (UI-1, UI-3). This is a transcription of design/colors_and_type.css: it reads nothing at
 * runtime. Every CSS variable in that export has a matching token here (tokenCoverage.test.ts enforces it), and
 * only the primitives in src/components import this module (eslint no-restricted-imports + namingPlacement.test).
 */
export const tokens = {
  colorBackground: '#0b0c0e',
  colorSurface: '#16181c',
  colorSurfaceRaised: '#1e2126',
  colorSurfaceSunken: '#0f1013',
  colorBorder: '#2a2e35',
  colorBorderStrong: '#3a3f48',
  colorTextPrimary: '#f2f4f7',
  colorTextSecondary: '#b3b9c4',
  colorTextMuted: '#7d838f',
  colorTextInverse: '#0b0c0e',

  colorPrimary: '#4c8dff',
  colorPrimaryHover: '#6ba0ff',
  colorPrimaryActive: '#3a78e6',
  colorPrimaryText: '#ffffff',
  colorDanger: '#e5484d',
  colorDangerHover: '#ec5d61',
  colorDangerText: '#ffffff',
  colorSuccess: '#46a758',
  colorWarning: '#f0a020',
  colorFocusRing: '#4c8dff',
  colorOverlay: '#00000099',
  colorSelection: '#4c8dff44',

  fontFamilySans: '"Inter", system-ui, -apple-system, sans-serif',
  fontFamilyMono: '"JetBrains Mono", ui-monospace, monospace',

  fontSize2xs: '11px',
  fontSizeXs: '12px',
  fontSizeSm: '14px',
  fontSizeMd: '16px',
  fontSizeLg: '18px',
  fontSizeXl: '22px',
  fontSize2xl: '28px',
  fontSize3xl: '36px',

  fontWeightRegular: '400',
  fontWeightMedium: '500',
  fontWeightSemibold: '600',
  fontWeightBold: '700',

  lineHeightTight: '1.2',
  lineHeightNormal: '1.5',
  lineHeightRelaxed: '1.75',
  letterSpacingTight: '-0.01em',
  letterSpacingWide: '0.04em',

  space0: '0px',
  space1: '4px',
  space2: '8px',
  space3: '12px',
  space4: '16px',
  space5: '24px',
  space6: '32px',
  space8: '48px',

  radiusSm: '4px',
  radiusMd: '8px',
  radiusLg: '14px',
  radiusFull: '9999px',

  shadowSm: '0 1px 2px #00000040',
  shadowMd: '0 4px 12px #00000059',
  shadowLg: '0 12px 32px #00000073',

  borderWidthHairline: '1px',
  borderWidthThick: '2px',
} as const;

export type TokenName = keyof typeof tokens;
