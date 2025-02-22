export const countries = [
  "Afghanistan", "Albania", "Algeria", /* Add all countries */
  "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Japan", "China", "India", "Brazil",
  "Kenya", "Nigeria", "South Africa", "Egypt", "Ethiopia",
  "Ghana", "Morocco", "Tunisia", "Zimbabwe",
  // Add more countries as needed
] as const;

export type Country = typeof countries[number];
