"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  InfoWindow,
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";
import { MapPin, Navigation } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DeliveryOrder } from "@/contexts/delivery-context";

interface DeliveryMapProps {
  currentLocation: { lat: number; lng: number } | null;
  orders: DeliveryOrder[];
  currentOrder?: DeliveryOrder | null;
  height?: number;
  onMarkerClick?: (orderId: string) => void;
  showDirections?: boolean;
}

// Google Maps API key - in a real application, use environment variables
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY"; // Replace with your actual API key

// Map container style
const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

// Default center (used before current location is available)
const defaultCenter = {
  lat: 7.8731, // Sri Lanka center coordinates (approximate)
  lng: 80.7718,
};

// Map options
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

export default function DeliveryMap({
  currentLocation,
  orders,
  currentOrder,
  height = 400,
  onMarkerClick,
  showDirections = false,
}: DeliveryMapProps) {
  // Load the Google Maps JavaScript API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyBa-KJNay-s95ncvsyOQChLjgn1_zHEEPY",
    libraries: ["places", "routes"],
  });

  // Map references and state
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(
    null
  );
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);

  // Store the map instance when the map is loaded
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Calculate the map center based on current location
  const center = useMemo(() => {
    return currentLocation || defaultCenter;
  }, [currentLocation]);

  // Get directions between current location and destination
  useEffect(() => {
    if (!isLoaded || !currentLocation || !showDirections || !currentOrder) {
      setDirections(null);
      return;
    }

    const directionsService = new google.maps.DirectionsService();

    // Determine whether to route to restaurant or customer based on order status
    const destination =
      currentOrder.status === "ready_for_pickup"
        ? {
            lat: currentOrder.restaurantLocation.lat,
            lng: currentOrder.restaurantLocation.lng,
          }
        : {
            lat: currentOrder.customerLocation.lat,
            lng: currentOrder.customerLocation.lng,
          };

    directionsService.route(
      {
        origin: currentLocation,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error(`Directions request failed: ${status}`);
        }
      }
    );
  }, [isLoaded, currentLocation, currentOrder, showDirections]);

  // Handle order marker click
  const handleMarkerClick = (order: DeliveryOrder) => {
    setSelectedOrder(order);
    onMarkerClick?.(order.id);
  };

  // Show loading spinner when Google Maps API is loading
  if (!isLoaded) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border bg-gray-50"
        style={{ height: `${height}px` }}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  // Show error if Google Maps API failed to load
  if (loadError) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border bg-gray-50"
        style={{ height: `${height}px` }}
      >
        <div className="text-center">
          <MapPin className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p>Error loading maps</p>
          <p className="text-sm text-gray-500">{loadError.message}</p>
        </div>
      </div>
    );
  }

  // Show message if location data is unavailable
  if (!currentLocation) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border bg-gray-50"
        style={{ height: `${height}px` }}
      >
        <div className="text-center">
          <Navigation className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p>Location data not available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-lg overflow-hidden"
      style={{ height: `${height}px` }}
    >
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        {/* Current location marker */}
        <Marker
          position={currentLocation}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          }}
          zIndex={1000}
          animation={google.maps.Animation.BOUNCE}
          title="Your Location"
        />

        {/* Order markers - only show available orders if there's no current order */}
        {(!currentOrder || !showDirections) &&
          orders.map((order) => (
            <Marker
              key={order.id}
              position={{
                lat:
                  order.status === "ready_for_pickup"
                    ? order.restaurantLocation.lat
                    : order.customerLocation.lat,
                lng:
                  order.status === "ready_for_pickup"
                    ? order.restaurantLocation.lng
                    : order.customerLocation.lng,
              }}
              icon={{
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 6,
                fillColor:
                  currentOrder?.id === order.id ? "#FF8C00" : "#F44336",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 1,
              }}
              onClick={() => handleMarkerClick(order)}
            />
          ))}

        {/* If a current order exists and showDirections is true, show directions */}
        {currentOrder && showDirections && directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeColor: "#FF8C00",
                strokeOpacity: 0.8,
                strokeWeight: 5,
              },
              suppressMarkers: false,
            }}
          />
        )}

        {/* Info window for selected order */}
        {selectedOrder && (
          <InfoWindow
            position={{
              lat:
                selectedOrder.status === "ready_for_pickup"
                  ? selectedOrder.restaurantLocation.lat
                  : selectedOrder.customerLocation.lat,
              lng:
                selectedOrder.status === "ready_for_pickup"
                  ? selectedOrder.restaurantLocation.lng
                  : selectedOrder.customerLocation.lng,
            }}
            onCloseClick={() => setSelectedOrder(null)}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-medium text-sm mb-1">
                {selectedOrder.status === "ready_for_pickup"
                  ? selectedOrder.restaurantName
                  : selectedOrder.customerName}
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                {selectedOrder.status === "ready_for_pickup"
                  ? "Restaurant"
                  : "Customer"}{" "}
                • {selectedOrder.distance.toFixed(1)} km
              </p>
              {!currentOrder && (
                <Button
                  size="sm"
                  className="w-full text-xs bg-orange-500 hover:bg-orange-600"
                  onClick={() => onMarkerClick?.(selectedOrder.id)}
                >
                  Accept Order
                </Button>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
