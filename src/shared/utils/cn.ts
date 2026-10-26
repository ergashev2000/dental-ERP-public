type ClassValue = string | false | null | undefined | 0;

/** Shartli className birlashtirish */
export const cn = (...classes: ClassValue[]) => classes.filter(Boolean).join(' ');
