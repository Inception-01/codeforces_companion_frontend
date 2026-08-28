export const RATING_BANDS = [
  { min: 0, max: 1199, label: '<1200', color: '#808080' },
  { min: 1200, max: 1399, label: '1200-1399', color: '#1FA61F' },
  { min: 1400, max: 1599, label: '1400-1599', color: '#03A89E' },
  { min: 1600, max: 1899, label: '1600-1899', color: '#3366CC' },
  { min: 1900, max: 2099, label: '1900-2099', color: '#AA00AA' },
  { min: 2100, max: 2399, label: '2100-2399', color: '#FF8C00' },
  { min: 2400, max: 9999, label: '2400+', color: '#FF3030' },
];

export function ratingColor(r: number | null | undefined): string {
  if (r == null) return '#808080';
  for (const band of RATING_BANDS) {
    if (r >= band.min && r <= band.max) return band.color;
  }
  return '#808080';
}

export function ratingLabel(r: number | null | undefined): string {
  if (r == null) return 'Unrated';
  for (const band of RATING_BANDS) {
    if (r >= band.min && r <= band.max) return band.label;
  }
  return 'Unrated';
}
