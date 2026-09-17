/**
 * US States Dictionary, Region Groupings, and SQL Condition Builders
 * Supports state-by-state directory browsing across all 50 US States + DC.
 */

export interface UsStateInfo {
  code: string;
  name: string;
  region: "midwest" | "west" | "northeast" | "south" | "mountain";
  majorCities: string[];
}

export const US_STATES: Record<string, UsStateInfo> = {
  // ---------------------------------------------------------------------------
  // US-Midwest (12 States)
  // ---------------------------------------------------------------------------
  IL: { code: "IL", name: "Illinois", region: "midwest", majorCities: ["Chicago", "Naperville", "Champaign", "Evanston"] },
  IN: { code: "IN", name: "Indiana", region: "midwest", majorCities: ["Indianapolis", "Carmel", "Bloomington", "West Lafayette", "Fishers"] },
  WI: { code: "WI", name: "Wisconsin", region: "midwest", majorCities: ["Madison", "Milwaukee", "Green Bay"] },
  MN: { code: "MN", name: "Minnesota", region: "midwest", majorCities: ["Minneapolis", "St. Paul", "Rochester", "Duluth"] },
  OH: { code: "OH", name: "Ohio", region: "midwest", majorCities: ["Columbus", "Cincinnati", "Cleveland", "Dayton", "Akron"] },
  MI: { code: "MI", name: "Michigan", region: "midwest", majorCities: ["Detroit", "Ann Arbor", "Grand Rapids", "Lansing"] },
  MO: { code: "MO", name: "Missouri", region: "midwest", majorCities: ["St. Louis", "Kansas City", "Columbia", "Springfield"] },
  IA: { code: "IA", name: "Iowa", region: "midwest", majorCities: ["Des Moines", "Cedar Rapids", "Iowa City", "Ames"] },
  KS: { code: "KS", name: "Kansas", region: "midwest", majorCities: ["Overland Park", "Wichita", "Lawrence", "Kansas City"] },
  NE: { code: "NE", name: "Nebraska", region: "midwest", majorCities: ["Omaha", "Lincoln"] },
  ND: { code: "ND", name: "North Dakota", region: "midwest", majorCities: ["Fargo", "Bismarck"] },
  SD: { code: "SD", name: "South Dakota", region: "midwest", majorCities: ["Sioux Falls", "Rapid City"] },

  // ---------------------------------------------------------------------------
  // US-West (6 States)
  // ---------------------------------------------------------------------------
  CA: { code: "CA", name: "California", region: "west", majorCities: ["San Francisco", "San Jose", "Los Angeles", "San Diego", "Oakland", "Sunnyvale", "Palo Alto", "Irvine"] },
  WA: { code: "WA", name: "Washington", region: "west", majorCities: ["Seattle", "Bellevue", "Redmond", "Tacoma", "Spokane"] },
  OR: { code: "OR", name: "Oregon", region: "west", majorCities: ["Portland", "Eugene", "Beaverton", "Bend"] },
  NV: { code: "NV", name: "Nevada", region: "west", majorCities: ["Las Vegas", "Reno", "Henderson"] },
  HI: { code: "HI", name: "Hawaii", region: "west", majorCities: ["Honolulu"] },
  AK: { code: "AK", name: "Alaska", region: "west", majorCities: ["Anchorage", "Fairbanks"] },

  // ---------------------------------------------------------------------------
  // US-Northeast (9 States)
  // ---------------------------------------------------------------------------
  NY: { code: "NY", name: "New York", region: "northeast", majorCities: ["New York", "NYC", "Brooklyn", "Manhattan", "Buffalo", "Rochester", "Albany"] },
  MA: { code: "MA", name: "Massachusetts", region: "northeast", majorCities: ["Boston", "Cambridge", "Somerville", "Worcester"] },
  PA: { code: "PA", name: "Pennsylvania", region: "northeast", majorCities: ["Philadelphia", "Pittsburgh", "Allentown"] },
  NJ: { code: "NJ", name: "New Jersey", region: "northeast", majorCities: ["Jersey City", "Hoboken", "Newark", "Princeton"] },
  CT: { code: "CT", name: "Connecticut", region: "northeast", majorCities: ["Stamford", "New Haven", "Hartford", "Greenwich"] },
  RI: { code: "RI", name: "Rhode Island", region: "northeast", majorCities: ["Providence"] },
  VT: { code: "VT", name: "Vermont", region: "northeast", majorCities: ["Burlington"] },
  NH: { code: "NH", name: "New Hampshire", region: "northeast", majorCities: ["Manchester", "Nashua", "Portsmouth"] },
  ME: { code: "ME", name: "Maine", region: "northeast", majorCities: ["Portland"] },

  // ---------------------------------------------------------------------------
  // US-South (16 States + DC)
  // ---------------------------------------------------------------------------
  TX: { code: "TX", name: "Texas", region: "south", majorCities: ["Austin", "Dallas", "Houston", "San Antonio", "Fort Worth", "Plano"] },
  FL: { code: "FL", name: "Florida", region: "south", majorCities: ["Miami", "Tampa", "Orlando", "Jacksonville", "Fort Lauderdale"] },
  GA: { code: "GA", name: "Georgia", region: "south", majorCities: ["Atlanta", "Alpharetta", "Savannah"] },
  NC: { code: "NC", name: "North Carolina", region: "south", majorCities: ["Raleigh", "Durham", "Charlotte", "Cary", "Chapel Hill"] },
  VA: { code: "VA", name: "Virginia", region: "south", majorCities: ["Arlington", "Richmond", "Tysons", "Alexandria", "Reston"] },
  TN: { code: "TN", name: "Tennessee", region: "south", majorCities: ["Nashville", "Memphis", "Knoxville", "Chattanooga"] },
  MD: { code: "MD", name: "Maryland", region: "south", majorCities: ["Baltimore", "Bethesda", "Rockville", "Silver Spring"] },
  SC: { code: "SC", name: "South Carolina", region: "south", majorCities: ["Charleston", "Columbia", "Greenville"] },
  AL: { code: "AL", name: "Alabama", region: "south", majorCities: ["Birmingham", "Huntsville", "Mobile"] },
  LA: { code: "LA", name: "Louisiana", region: "south", majorCities: ["New Orleans", "Baton Rouge"] },
  KY: { code: "KY", name: "Kentucky", region: "south", majorCities: ["Louisville", "Lexington"] },
  OK: { code: "OK", name: "Oklahoma", region: "south", majorCities: ["Oklahoma City", "Tulsa"] },
  AR: { code: "AR", name: "Arkansas", region: "south", majorCities: ["Bentonville", "Fayetteville", "Little Rock"] },
  MS: { code: "MS", name: "Mississippi", region: "south", majorCities: ["Jackson"] },
  WV: { code: "WV", name: "West Virginia", region: "south", majorCities: ["Charleston", "Morgantown"] },
  DE: { code: "DE", name: "Delaware", region: "south", majorCities: ["Wilmington"] },
  DC: { code: "DC", name: "District of Columbia", region: "south", majorCities: ["Washington"] },

  // ---------------------------------------------------------------------------
  // US-Mountain (7 States)
  // ---------------------------------------------------------------------------
  CO: { code: "CO", name: "Colorado", region: "mountain", majorCities: ["Denver", "Boulder", "Colorado Springs", "Fort Collins"] },
  UT: { code: "UT", name: "Utah", region: "mountain", majorCities: ["Salt Lake City", "Lehi", "Provo", "Draper", "Sandy"] },
  AZ: { code: "AZ", name: "Arizona", region: "mountain", majorCities: ["Phoenix", "Scottsdale", "Tempe", "Tucson", "Chandler"] },
  ID: { code: "ID", name: "Idaho", region: "mountain", majorCities: ["Boise", "Meridian"] },
  NM: { code: "NM", name: "New Mexico", region: "mountain", majorCities: ["Albuquerque", "Santa Fe"] },
  MT: { code: "MT", name: "Montana", region: "mountain", majorCities: ["Bozeman", "Missoula"] },
  WY: { code: "WY", name: "Wyoming", region: "mountain", majorCities: ["Cheyenne", "Jackson"] },
};

/**
 * Resolves a state code or name into a normalized UsStateInfo object.
 */
export function getUsState(codeOrName: string): UsStateInfo | null {
  if (!codeOrName) return null;
  const trimmed = codeOrName.trim();
  const upper = trimmed.toUpperCase();
  if (US_STATES[upper]) {
    return US_STATES[upper];
  }

  const lower = trimmed.toLowerCase();
  for (const s of Object.values(US_STATES)) {
    if (s.name.toLowerCase() === lower) {
      return s;
    }
  }

  return null;
}

/**
 * Builds a SQL WHERE condition snippet and parameters for filtering by US state.
 */
export function buildStateSqlCondition(
  stateCodeOrName: string,
  column = "location_hint"
): { sql: string; bindings: string[] } {
  const state = getUsState(stateCodeOrName);
  const code = (state ? state.code : stateCodeOrName.trim()).toLowerCase();
  const name = (state ? state.name : stateCodeOrName.trim()).toLowerCase();

  const sql = `(
    LOWER(COALESCE(${column}, '')) LIKE '% ' || ? || ' %'
    OR LOWER(COALESCE(${column}, '')) LIKE '%, ' || ? || ' %'
    OR LOWER(COALESCE(${column}, '')) LIKE '%, ' || ? || ',%'
    OR LOWER(COALESCE(${column}, '')) LIKE '%, ' || ?
    OR LOWER(COALESCE(${column}, '')) LIKE '%(' || ? || ')%'
    OR LOWER(COALESCE(${column}, '')) LIKE '%, ' || ? || '/%'
    OR LOWER(COALESCE(${column}, '')) LIKE '%' || ? || '%'
  )`;

  const bindings = [code, code, code, code, code, code, name];
  return { sql, bindings };
}

/**
 * Checks in-memory if a given location string matches a specified state.
 */
export function matchesUsState(locationText: string | null | undefined, stateCodeOrName: string): boolean {
  if (!locationText || !stateCodeOrName) return false;
  const state = getUsState(stateCodeOrName);
  const code = state ? state.code : stateCodeOrName.trim().toUpperCase();
  const name = state ? state.name.toLowerCase() : stateCodeOrName.trim().toLowerCase();
  const lower = locationText.toLowerCase();

  if (lower.includes(name)) return true;

  // Check state code boundaries: e.g. ", IN", " IN ", "(IN)", ", IN,"
  const regex = new RegExp(`(?:,\\s*|\\s+|\\()${code}(?:\\s+|,|\\)|/|$)`, "i");
  if (regex.test(locationText)) return true;

  // Check major cities if state resolved
  if (state && state.majorCities) {
    for (const city of state.majorCities) {
      if (lower.includes(city.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
}
