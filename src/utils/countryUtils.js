import countries from "../data/countries.json";

/**
 * Resolve a readable country name from an ISO country code.
 * Falls back to the original code when no match is found.
 */
export function getCountryName(countryCode) {
  if (!countryCode) {
    return "";
  }

  const match = countries.find(
    (country) => country.code === countryCode.toUpperCase()
  );

  return match ? match.name : countryCode;
}

/**
 * Return a combined "Location, Country" string when a country code is available.
 */
export function formatLocationWithCountry(location, countryCode) {
  if (!location) {
    return "";
  }

  if (!countryCode) {
    return location;
  }

  return `${location}, ${getCountryName(countryCode)}`;
}
