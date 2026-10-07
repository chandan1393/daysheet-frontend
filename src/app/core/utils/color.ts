export const SERVICE_COLORS = ['#0E7C86', '#6D5DF6', '#E5487A', '#F2A20C', '#4C9A6A', '#3A86FF', '#9B5DE5', '#E8590C'];

const AVATAR_COLORS = [
  ['#E2F3F3', '#0A5F67'], ['#EEECFE', '#4B3CC9'], ['#FDE8EF', '#B22A58'],
  ['#FFF3DC', '#8F5A06'], ['#E5F3EA', '#2F6E47'], ['#E6F0FF', '#1F5FC7']
];

export function avatarColors(name: string): { bg: string; fg: string } {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const [bg, fg] = AVATAR_COLORS[h % AVATAR_COLORS.length];
  return { bg, fg };
}

/** Light tint of a hex colour for appointment block backgrounds. */
export function tint(hex: string, alpha = 0.14): string {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
