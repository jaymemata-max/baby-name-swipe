import type { NameGender } from '@/lib/supabase/database.types';

export const nameGenderStyles: Record<NameGender, {
  label: string;
  card: string;
  name: string;
  badge: string;
  dot: string;
  selected: string;
}> = {
  boy: {
    label: 'Boy',
    card: 'bg-[#eef6ff] dark:bg-[#1d2938] border-[#93bce9] dark:border-[#385b83]',
    name: 'text-[#174b84] dark:text-[#9ac8ff]',
    badge: 'bg-[#d8eaff] dark:bg-[#243e5e] text-[#174b84] dark:text-[#a9d1ff] border-[#83b2e5] dark:border-[#4c79a8]',
    dot: 'bg-[#3579c7]',
    selected: 'bg-[#d8eaff] dark:bg-[#243e5e] border-[#3579c7] text-[#174b84] dark:text-[#a9d1ff]',
  },
  girl: {
    label: 'Girl',
    card: 'bg-[#fff0f6] dark:bg-[#30202a] border-[#e9a3c1] dark:border-[#864364]',
    name: 'text-[#a52d64] dark:text-[#ffacd0]',
    badge: 'bg-[#ffe0ed] dark:bg-[#51283d] text-[#a52d64] dark:text-[#ffacd0] border-[#e38fb6] dark:border-[#a35a7c]',
    dot: 'bg-[#d44e8a]',
    selected: 'bg-[#ffe0ed] dark:bg-[#51283d] border-[#d44e8a] text-[#a52d64] dark:text-[#ffacd0]',
  },
  unisex: {
    label: 'Unisex',
    card: 'bg-[#f5f0ff] dark:bg-[#292238] border-[#b8a0e5] dark:border-[#70549b]',
    name: 'text-[#68419b] dark:text-[#d3b7ff]',
    badge: 'bg-[#e9ddff] dark:bg-[#3d2c59] text-[#68419b] dark:text-[#d3b7ff] border-[#ae8cdd] dark:border-[#8064ae]',
    dot: 'bg-[#8d65c6]',
    selected: 'bg-[#e9ddff] dark:bg-[#3d2c59] border-[#8d65c6] text-[#68419b] dark:text-[#d3b7ff]',
  },
};
