import { cva, type VariantProps } from 'class-variance-authority';

export const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] font-medium transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-signal text-on-signal hover:bg-signal/85',
        secondary:
          'border border-border bg-transparent text-fg hover:border-fg-faint hover:bg-surface',
        ghost: 'text-fg-muted hover:bg-surface hover:text-fg',
        danger:
          'border border-danger/40 text-danger hover:border-danger hover:bg-danger/10',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-5 text-[15px]',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  }
);

export type ButtonStyleProps = VariantProps<typeof buttonStyles>;
