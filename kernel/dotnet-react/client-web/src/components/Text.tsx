import type { CSSProperties, ReactNode } from 'react';
import { tokens } from '../theme/tokens.ts';

export type TextVariant = 'heading' | 'title' | 'body' | 'caption';
export type TextTone = 'primary' | 'secondary' | 'muted';

const variantStyles: Record<TextVariant, CSSProperties> = {
  heading: { fontSize: tokens.fontSize2xl, fontWeight: tokens.fontWeightBold, lineHeight: tokens.lineHeightTight, letterSpacing: tokens.letterSpacingTight },
  title: { fontSize: tokens.fontSizeLg, fontWeight: tokens.fontWeightSemibold, lineHeight: tokens.lineHeightTight },
  body: { fontSize: tokens.fontSizeMd, fontWeight: tokens.fontWeightRegular, lineHeight: tokens.lineHeightNormal },
  caption: { fontSize: tokens.fontSizeXs, fontWeight: tokens.fontWeightMedium, lineHeight: tokens.lineHeightNormal, letterSpacing: tokens.letterSpacingWide },
};

const toneColor: Record<TextTone, string> = {
  primary: tokens.colorTextPrimary,
  secondary: tokens.colorTextSecondary,
  muted: tokens.colorTextMuted,
};

export interface TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  children: ReactNode;
}

export function Text({ variant = 'body', tone = 'primary', children }: TextProps) {
  return (
    <span style={{ ...variantStyles[variant], color: toneColor[tone], fontFamily: tokens.fontFamilySans }}>
      {children}
    </span>
  );
}
