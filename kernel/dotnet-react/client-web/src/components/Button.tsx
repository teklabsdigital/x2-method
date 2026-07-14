import type { ReactNode } from 'react';
import { tokens } from '../theme/tokens.ts';

export type ButtonVariant = 'primary' | 'danger';

const background: Record<ButtonVariant, string> = {
  primary: tokens.colorPrimary,
  danger: tokens.colorDanger,
};

const foreground: Record<ButtonVariant, string> = {
  primary: tokens.colorPrimaryText,
  danger: tokens.colorDangerText,
};

export interface ButtonProps {
  variant?: ButtonVariant;
  onClick?: () => void;
  children: ReactNode;
}

export function Button({ variant = 'primary', onClick, children }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: background[variant],
        color: foreground[variant],
        fontFamily: tokens.fontFamilySans,
        fontSize: tokens.fontSizeSm,
        fontWeight: tokens.fontWeightSemibold,
        padding: `${tokens.space2} ${tokens.space4}`,
        borderRadius: tokens.radiusMd,
        borderWidth: tokens.borderWidthHairline,
        borderStyle: 'solid',
        borderColor: tokens.colorBorderStrong,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
