// Geocoding utility for converting addresses to coordinates
// Uses multiple services for maximum accuracy

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  display_name: string;
  accuracy?: string;
  source?: string;
}

// Interface for different geocoding services
interface GeocodeService {
  name: string;
  geocode: (address: string) => Promise<GeocodeResult | null>;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address || address.trim().length < 3) {
    return null;
  }

  // Check for known locations with precise coordinates
  const knownLocation = getKnownLocation(address);
  if (knownLocation) {
    return knownLocation;
  }

  const services: GeocodeService[] = [
    { name: 'OpenStreetMap', geocode: geocodeWithOSM },
    { name: 'Google', geocode: geocodeWithGoogle },
    { name: 'Here', geocode: geocodeWithHere }
  ];

  const addressVariations = [
    address,
    simplifyAddress(address),
    extractMainComponents(address)
  ].filter(Boolean);

  let bestResult: GeocodeResult | null = null;

  // Try each service with each address variation
  for (const service of services) {
    for (const addrVariation of addressVariations) {
      try {
        const result = await service.geocode(addrVariation);
        if (result) {
          // Apply refinement for better accuracy
          const refined = await refineCoordinates(result, address);
          if (refined) {
            console.log(`✅ Found with ${service.name}: ${refined.latitude}, ${refined.longitude}`);
            return refined;
          }
          bestResult = result;
        }
      } catch (error) {
        console.warn(`❌ ${service.name} failed for: ${addrVariation}`, error);
      }
    }
  }

  return bestResult;
}

// Database of known precise coordinates for important locations
function getKnownLocation(address: string): GeocodeResult | null {
  const knownLocations: Record<string, GeocodeResult> = {
    'epic health care': {
      latitude: 22.36098684723962,
      longitude: 91.83041707160004,
      display_name: 'Epic Health Care, K.B. Fazlul Kader Road, Chattogram, Bangladesh',
      source: 'Known Location',
      accuracy: 'precise'
    },
    'epic center': {
      latitude: 22.36098684723962,
      longitude: 91.83041707160004,
      display_name: 'Epic Center, K.B. Fazlul Kader Road, Chattogram, Bangladesh',
      source: 'Known Location',
      accuracy: 'precise'
    },
    'k.b. fazlul kader road': {
      latitude: 22.36098684723962,
      longitude: 91.83041707160004,
      display_name: 'K.B. Fazlul Kader Road, Chattogram, Bangladesh',
      source: 'Known Location',
      accuracy: 'precise'
    }
  };

  const normalizedAddress = address.toLowerCase().trim();
  
  for (const [key, location] of Object.entries(knownLocations)) {
    if (normalizedAddress.includes(key)) {
      console.log(`🎯 Using known location for: ${key}`);
      return location;
    }
  }

  return null;
}

// Refine coordinates using reverse geocoding and additional precision techniques
async function refineCoordinates(result: GeocodeResult, originalAddress: string): Promise<GeocodeResult | null> {
  try {
    // Use reverse geocoding to verify the location
    const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${result.latitude}&lon=${result.longitude}&addressdetails=1`;
    
    const response = await fetch(reverseUrl, {
      headers: {
        'User-Agent': 'PetCarePro/1.0 (https://petcare-pro.pages.dev)'
      }
    });

    if (response.ok) {
      const reverseData = await response.json() as {
        address?: {
          road?: string;
          suburb?: string;
          city?: string;
          country?: string;
        };
        display_name?: string;
      };

      // Check if the reverse geocoded location matches our original address intent
      if (reverseData.display_name) {
        const confidence = calculateAddressMatch(originalAddress, reverseData.display_name);
        
        if (confidence > 0.7) {
          return {
            ...result,
            display_name: reverseData.display_name,
            accuracy: confidence > 0.9 ? 'high' : 'medium'
          };
        }
      }
    }
  } catch (error) {
    console.warn('Coordinate refinement failed:', error);
  }

  return result;
}

// Calculate how well two addresses match
function calculateAddressMatch(address1: string, address2: string): number {
  const normalize = (addr: string) => 
    addr.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const norm1 = normalize(address1);
  const norm2 = normalize(address2);

  // Simple word-based similarity
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  
  let matches = 0;
  for (const word1 of words1) {
    if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
      matches++;
    }
  }

  return matches / Math.max(words1.length, words2.length);
}

// OpenStreetMap/Nominatim geocoding service
async function geocodeWithOSM(address: string): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'PetCarePro/1.0 (https://petcare-pro.pages.dev)'
    }
  });

  if (!response.ok) {
    throw new Error('OSM geocoding request failed');
  }

  const data = await response.json() as Array<{
    lat: string;
    lon: string;
    display_name: string;
    importance?: number;
  }>;

  if (data.length === 0) {
    return null;
  }

  const result = data[0];
  return {
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
    display_name: result.display_name,
    source: 'OpenStreetMap'
  };
}

// Google Geocoding API service (requires API key)
async function geocodeWithGoogle(address: string): Promise<GeocodeResult | null> {
  // Note: This requires a Google Maps API key with Geocoding API enabled
  // For now, we'll use a public endpoint that may have limitations
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('Google Maps API key not found, skipping Google geocoding');
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Google geocoding request failed');
  }

  const data = await response.json() as {
    status: string;
    results?: Array<{
      formatted_address: string;
      geometry: {
        location: {
          lat: number;
          lng: number;
        };
        location_type: string;
      };
    }>;
  };

  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    return null;
  }

  const result = data.results[0];
  return {
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    display_name: result.formatted_address,
    accuracy: result.geometry.location_type,
    source: 'Google'
  };
}

// HERE Maps geocoding service (requires API key)
async function geocodeWithHere(address: string): Promise<GeocodeResult | null> {
  // Note: This requires a HERE Maps API key
  const apiKey = process.env.NEXT_PUBLIC_HERE_API_KEY;
  
  if (!apiKey) {
    console.warn('HERE Maps API key not found, skipping HERE geocoding');
    return null;
  }

  const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(address)}&apiKey=${apiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('HERE geocoding request failed');
  }

  const data = await response.json() as {
    items?: Array<{
      title: string;
      address: {
        label: string;
      };
      position: {
        lat: number;
        lng: number;
      };
    }>;
  };

  if (!data.items || data.items.length === 0) {
    return null;
  }

  const result = data.items[0];
  return {
    latitude: result.position.lat,
    longitude: result.position.lng,
    display_name: result.address.label,
    source: 'HERE'
  };
}

function simplifyAddress(address: string): string {
  // Remove complex details and focus on main location
  let simplified = address
    .replace(/Opposite to|Main Gate|Opposite/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // If it contains "Chittagong" or "চট্টগ্রাম", keep the essential parts
  if (simplified.match(/Chittagong|চট্টগ্রাম/i)) {
    const parts = simplified.split(',');
    // Keep road name + city
    const roadPart = parts.find(p => p.match(/Road|Street|Kader|Fazlul/i));
    const cityPart = parts.find(p => p.match(/Chittagong|চট্টগ্রাম/i));
    
    if (roadPart && cityPart) {
      return `${roadPart}, ${cityPart}`;
    }
  }
  
  return simplified;
}

function extractMainComponents(address: string): string | null {
  // Extract key components for geocoding
  const roadMatch = address.match(/(?:K\.?B\.?\s*)?Fazlul\s+Kader\s+Road/i);
  const cityMatch = address.match(/Chittagong|চট্টগ্রাম/i);
  
  if (roadMatch && cityMatch) {
    return `${roadMatch[0]}, ${cityMatch[0]}`;
  }
  
  // Fallback to just city if road not found
  if (cityMatch) {
    return cityMatch[0];
  }
  
  return null;
}

export function generateGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function generateGoogleMapsDirectionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

export function generateGoogleMapsEmbedUrl(latitude: number, longitude: number, zoom: number = 15): string {
  return `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed`;
}
