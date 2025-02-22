export interface Country {
  code: string;
  name: string;
  region: string;
}

export const countries: Country[] = [
  { code: 'US', name: 'United States', region: 'North America' },
  { code: 'GB', name: 'United Kingdom', region: 'Europe' },
  { code: 'IN', name: 'India', region: 'Asia' },
  { code: 'CN', name: 'China', region: 'Asia' },
  { code: 'JP', name: 'Japan', region: 'Asia' },
  { code: 'DE', name: 'Germany', region: 'Europe' },
  { code: 'FR', name: 'France', region: 'Europe' },
  { code: 'BR', name: 'Brazil', region: 'South America' },
  { code: 'CA', name: 'Canada', region: 'North America' },
  { code: 'AU', name: 'Australia', region: 'Oceania' },
  { code: 'RU', name: 'Russia', region: 'Europe' },
  { code: 'KR', name: 'South Korea', region: 'Asia' },
  { code: 'IL', name: 'Israel', region: 'Asia' },
  { code: 'NL', name: 'Netherlands', region: 'Europe' },
  { code: 'SE', name: 'Sweden', region: 'Europe' },
  { code: 'PL', name: 'Poland', region: 'Europe' },
  { code: 'SG', name: 'Singapore', region: 'Asia' },
  { code: 'UA', name: 'Ukraine', region: 'Europe' },
  { code: 'KE', name: 'Kenya', region: 'Africa' },
  { code: 'NG', name: 'Nigeria', region: 'Africa' },
  { code: 'ZA', name: 'South Africa', region: 'Africa' },
  { code: 'EG', name: 'Egypt', region: 'Africa' },
  // Add more countries as needed
];

export const regions = [...new Set(countries.map(country => country.region))];

export function getCountriesByRegion(region: string): Country[] {
  return countries.filter(country => country.region === region);
}

export function findCountryByLocation(location: string): Country | undefined {
  const lowercaseLocation = location.toLowerCase();
  return countries.find(country => 
    lowercaseLocation.includes(country.name.toLowerCase()) || 
    lowercaseLocation.includes(country.code.toLowerCase())
  );
}
