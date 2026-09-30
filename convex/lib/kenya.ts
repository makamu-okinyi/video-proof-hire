/** The 47 counties of Kenya. Single source of truth for validation (server) and the UI. */
export const KENYA_COUNTIES: string[] = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa", "Homa Bay",
  "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii",
  "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera",
  "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi",
  "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita-Taveta", "Tana River",
  "Tharaka-Nithi", "Trans-Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot",
];

/**
 * Tile-grid cartogram layout: one equal-sized tile per county, positioned roughly where the
 * county sits (north at the top). Not to scale - it exists so small counties (Nairobi,
 * Mombasa) are as visible as large ones. [column, row]
 */
export const KENYA_TILE_GRID: Record<string, [number, number]> = {
  "Turkana": [1, 0], "Marsabit": [4, 0], "Mandera": [7, 0],
  "West Pokot": [0, 1], "Samburu": [3, 1], "Isiolo": [4, 1], "Wajir": [6, 1],
  "Trans-Nzoia": [0, 2], "Elgeyo-Marakwet": [1, 2], "Baringo": [2, 2], "Laikipia": [3, 2],
  "Meru": [4, 2], "Garissa": [6, 2],
  "Bungoma": [0, 3], "Uasin Gishu": [1, 3], "Nakuru": [2, 3], "Nyandarua": [3, 3],
  "Nyeri": [4, 3], "Tharaka-Nithi": [5, 3], "Lamu": [8, 3],
  "Busia": [0, 4], "Kakamega": [1, 4], "Nandi": [2, 4], "Murang'a": [3, 4], "Kirinyaga": [4, 4],
  "Embu": [5, 4], "Kitui": [6, 4], "Tana River": [7, 4],
  "Siaya": [0, 5], "Vihiga": [1, 5], "Kericho": [2, 5], "Kiambu": [3, 5], "Nairobi": [4, 5],
  "Machakos": [5, 5], "Kilifi": [8, 5],
  "Kisumu": [0, 6], "Nyamira": [1, 6], "Bomet": [2, 6], "Narok": [3, 6], "Kajiado": [4, 6],
  "Makueni": [5, 6], "Taita-Taveta": [6, 6], "Mombasa": [8, 6],
  "Homa Bay": [0, 7], "Kisii": [1, 7], "Kwale": [8, 7],
  "Migori": [0, 8],
};
