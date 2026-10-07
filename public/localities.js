// ponytail: locality centres estimate fees / shop proximity, not street routes. Upgrade to admin-managed areas or routing when needed.
// Chala / Vapi / Chanod: OpenStreetMap; Gunjan: housing.com/pin-code/gunjan-vapi-pin-code-396195.
// Balitha landmark: cgwb.gov.in/sites/default/files/inline-files/nov_2022_data_for_website.pdf.
export const LOCALITIES = [
  { id: 'vapi-chala', zone: 'vapi', name: 'Chala', lat: 20.390253, lng: 72.888417 },
  { id: 'vapi-gunjan', zone: 'vapi', name: 'Gunjan / GIDC Phase 1', lat: 20.3941, lng: 72.9128 },
  { id: 'vapi-town', zone: 'vapi', name: 'Vapi town / railway station', lat: 20.373548, lng: 72.908438 },
  { id: 'vapi-balitha', zone: 'vapi', name: 'Balitha', lat: 20.38, lng: 72.904 },
  { id: 'vapi-chanod', zone: 'vapi', name: 'Chanod Colony', lat: 20.346751, lng: 72.933651 },
  { id: 'vapi-chanod-village', zone: 'vapi', name: 'Chanod Village', lat: 20.34076, lng: 72.928216 },
  { id: 'vapi-other', zone: 'vapi', name: 'Other Vapi locality (town estimate)', lat: 20.371603, lng: 72.91665 },
  { id: 'daman', zone: 'daman', name: 'Daman (area estimate)', lat: 20.398424, lng: 72.89082 },
  { id: 'sarigam', zone: 'sarigam', name: 'Sarigam (area estimate)', lat: 20.27801, lng: 72.84171 },
  { id: 'bhilad', zone: 'bhilad', name: 'Bhilad (area estimate)', lat: 20.258333, lng: 72.883333 }
];

export function kmBetween(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function distanceFee(distance, scheduled = false) {
  const band = distance <= 2 ? 0 : distance <= 4 ? 1 : distance <= 6 ? 2 : distance <= 8 ? 3 : 4;
  return (scheduled ? [10, 15, 20, 25, 25] : [15, 25, 35, 45, 50])[band];
}
