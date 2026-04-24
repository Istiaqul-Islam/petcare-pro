"use client";

import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";

interface MapProps {
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string;
  height?: string;
  showDirections?: boolean;
  className?: string;
}

export function GoogleMap({ 
  address, 
  latitude, 
  longitude, 
  locationName = "Location",
  height = "h-64",
  showDirections = true,
  className = ""
}: MapProps) {
  if (!address && (!latitude || !longitude)) {
    return (
      <div className={`w-full ${height} bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <MapPin className="h-8 w-8 text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Location not available</span>
      </div>
    );
  }

  // Use precise coordinates if available, otherwise fall back to address
  const mapUrl = latitude && longitude
    ? `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`
    : address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`
    : '';

  const directionsUrl = latitude && longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
    : '';

  return (
    <div className={`space-y-4 ${className}`}>
      <div className={`w-full ${height} rounded-lg overflow-hidden border`}>
        {mapUrl ? (
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map showing location of ${locationName}`}
          />
        ) : (
          <div className={`w-full ${height} bg-muted rounded-lg flex items-center justify-center`}>
            <MapPin className="h-8 w-8 text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Map unavailable</span>
          </div>
        )}
      </div>
      
      {showDirections && directionsUrl && (
        <Button asChild className="w-full">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Get Directions on Google Maps
          </a>
        </Button>
      )}
    </div>
  );
}

export function LocationCard({ 
  address, 
  latitude, 
  longitude, 
  locationName 
}: Pick<MapProps, 'address' | 'latitude' | 'longitude' | 'locationName'>) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium">{locationName}</h4>
            {address && (
              <p className="text-sm text-muted-foreground mt-1">{address}</p>
            )}
          </div>
          
          {latitude && longitude && (
            <div className="text-xs text-muted-foreground">
              Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </div>
          )}
          
          <GoogleMap
            address={address}
            latitude={latitude}
            longitude={longitude}
            locationName={locationName}
            height="h-48"
            showDirections={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}
