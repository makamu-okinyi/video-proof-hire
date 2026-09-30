/**
 * Approximate country from a browser IANA timezone. This is a coarse hint (a phone set to
 * another timezone, a VPN-free traveller, shared zones such as Africa/Nairobi covering
 * several East African countries) - it is NOT geolocation and no IP address is used.
 */
export const TZ_COUNTRY: Record<string, string> = {
  "Africa/Nairobi": "Kenya", "Africa/Lagos": "Nigeria", "Africa/Johannesburg": "South Africa",
  "Africa/Cairo": "Egypt", "Africa/Accra": "Ghana", "Africa/Addis_Ababa": "Ethiopia",
  "Africa/Dar_es_Salaam": "Tanzania", "Africa/Kampala": "Uganda", "Africa/Kigali": "Rwanda",
  "Africa/Algiers": "Algeria", "Africa/Casablanca": "Morocco", "Africa/Tunis": "Tunisia",
  "Africa/Kinshasa": "DR Congo", "Africa/Lubumbashi": "DR Congo", "Africa/Luanda": "Angola",
  "Africa/Harare": "Zimbabwe", "Africa/Lusaka": "Zambia", "Africa/Maputo": "Mozambique",
  "Africa/Abidjan": "Cote d'Ivoire", "Africa/Dakar": "Senegal", "Africa/Khartoum": "Sudan",
  "Africa/Juba": "South Sudan", "Africa/Mogadishu": "Somalia", "Africa/Djibouti": "Djibouti",
  "Africa/Asmara": "Eritrea", "Africa/Windhoek": "Namibia", "Africa/Gaborone": "Botswana",
  "Africa/Blantyre": "Malawi", "Africa/Bujumbura": "Burundi", "Africa/Libreville": "Gabon",
  "Africa/Douala": "Cameroon", "Africa/Brazzaville": "Congo", "Africa/Bamako": "Mali",
  "Africa/Ouagadougou": "Burkina Faso", "Africa/Niamey": "Niger", "Africa/Ndjamena": "Chad",
  "Africa/Lome": "Togo", "Africa/Porto-Novo": "Benin", "Africa/Conakry": "Guinea",
  "Africa/Freetown": "Sierra Leone", "Africa/Monrovia": "Liberia", "Africa/Nouakchott": "Mauritania",
  "Africa/Tripoli": "Libya", "Africa/Maseru": "Lesotho", "Africa/Mbabane": "Eswatini",
  "Indian/Antananarivo": "Madagascar", "Indian/Mauritius": "Mauritius",
  "Europe/London": "United Kingdom", "Europe/Paris": "France", "Europe/Berlin": "Germany",
  "Europe/Amsterdam": "Netherlands", "Europe/Dublin": "Ireland", "Europe/Madrid": "Spain",
  "Europe/Rome": "Italy", "Europe/Stockholm": "Sweden", "Europe/Zurich": "Switzerland",
  "America/New_York": "United States", "America/Chicago": "United States",
  "America/Denver": "United States", "America/Los_Angeles": "United States",
  "America/Toronto": "Canada", "America/Vancouver": "Canada", "America/Sao_Paulo": "Brazil",
  "Asia/Dubai": "United Arab Emirates", "Asia/Kolkata": "India", "Asia/Calcutta": "India",
  "Asia/Shanghai": "China", "Asia/Singapore": "Singapore", "Asia/Tokyo": "Japan",
  "Asia/Riyadh": "Saudi Arabia", "Asia/Qatar": "Qatar", "Australia/Sydney": "Australia",
  "Pacific/Auckland": "New Zealand",
};

export function countryFromTimezone(tz: string | undefined): string {
  if (!tz) return "Unknown";
  return TZ_COUNTRY[tz] ?? "Other / unknown";
}
