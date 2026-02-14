export const SRM_AP_CENTER = { lat: 15.7939, lng: 80.0258 };

export const CAMPUS_LOCATIONS = [
  { name: "VS Block", lat: 16.4647518, lng: 80.5076388},
  { name: "Central Library", lat: 16.461960987089963, lng: 80.50574790900878},
  { name: "Boys Hostel", lat: 16.4633927, lng: 80.5059474 },
  { name: "Girls Hostel", lat: 16.4659103, lng: 80.5073565,},
  { name: "Cafeteria", lat: 16.4627374, lng: 80.5066156},
  { name: "Sports Ground", lat: 16.4610169, lng:80.5076187},
  { name: "Auditorium", lat: 16.4639750, lng:80.5073243},
  { name: "SR Block", lat: 16.4627374, lng: 80.5066156},
  { name: "Homi-J Baba Block", lat: 16.4648216, lng:  80.5083040 },
  { name: "CV Block", lat: 16.4618748, lng: 80.5059427 },
] as const;

export const CAMPUS_LOCATION_NAMES = CAMPUS_LOCATIONS.map((l) => l.name);
