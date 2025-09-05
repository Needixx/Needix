import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import clsx from 'clsx';


export function Button({
children,
asChild,
variant = 'primary',
className,
...props
}: {
children: ReactNode;
asChild?: boolean;
variant?: 'primary' | 'secondary' | 'ghost';
} & ComponentPropsWithoutRef<'button'>) {
const base = 'inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition hover:opacity-90';
const styles = {
primary: 'bg-white text-black',
secondary: 'bg-white/10 text-white',
ghost: 'bg-transparent text-white border border-white/10',
}[variant];


if (asChild) {
return (
<span className={clsx(base, styles, className)} {...props}>
{children}
</span>
);
}
return (
<button className={clsx(base, styles, className)} {...props}>
{children}
</button>
);
}