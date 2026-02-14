export const SRM_AP_CENTER = { lat: 15.7939, lng: 80.0258 };

export const CAMPUS_LOCATIONS = [
  { name: "Main Academic Block", lat: 15.7945, lng: 80.0260 },
  { name: "Library", lat: 15.7935, lng: 80.0250 },
  { name: "Boys Hostel", lat: 15.7955, lng: 80.0270 },
  { name: "Girls Hostel", lat: 15.7925, lng: 80.0240 },
  { name: "Cafeteria", lat: 15.7940, lng: 80.0265 },
  { name: "Sports Complex", lat: 15.7960, lng: 80.0245 },
  { name: "Auditorium", lat: 15.7930, lng: 80.0255 },
  { name: "Computer Lab", lat: 15.7948, lng: 80.0252 },
  { name: "Admin Block", lat: 15.7938, lng: 80.0262 },
  { name: "Innovation Lab", lat: 15.7942, lng: 80.0248 },
] as const;

export const CAMPUS_LOCATION_NAMES = CAMPUS_LOCATIONS.map((l) => l.name);
