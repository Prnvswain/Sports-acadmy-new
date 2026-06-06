import { cn } from '@/lib/utils';

export function Badge({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'destructive' | 'outline' }) {
  const variants = {
    default: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
    secondary: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
    destructive: 'bg-[var(--color-destructive)] text-white',
    outline: 'border border-[var(--color-border)] text-foreground',
  };
  return (
    <div className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', variants[variant], className)} {...props} />
  );
}
