import axios from 'axios';
import { logger } from '../utils/logger';
import {
  GOOGLE_MAPS_API_KEY,
  OPENCAGE_API_KEY
} from '../config/env';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface AddressComponents {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  formattedAddress?: string;
}

interface GeocodeResult {
  coordinates: Coordinates;
  address: AddressComponents;
  accuracy: 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE';
}

export class GeocodingService {
  private static readonly GOOGLE_MAPS_API_KEY = GOOGLE_MAPS_API_KEY;
  private static readonly OPENCAGE_API_KEY = OPENCAGE_API_KEY;
  private static readonly GOOGLE_GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
  private static readonly OPENCAGE_GEOCODING_URL = 'https://api.opencagedata.com/geocode/v1/json';

  /**
   * Geocode an address to get coordinates and formatted address
   */
  static async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    try {
      // Try Google Maps first if API key is available
      if (this.GOOGLE_MAPS_API_KEY) {
        const googleResult = await this.geocodeWithGoogle(address);
        if (googleResult) {
          return googleResult;
        }
      }

      // Fallback to OpenCage if Google fails or API key not available
      if (this.OPENCAGE_API_KEY) {
        const opencageResult = await this.geocodeWithOpenCage(address);
        if (opencageResult) {
          return opencageResult;
        }
      }

      // If both fail, try with a free service (limited accuracy)
      return await this.geocodeWithNominatim(address);
    } catch (error) {
      logger.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<AddressComponents | null> {
    try {
      // Try Google Maps first
      if (this.GOOGLE_MAPS_API_KEY) {
        const googleResult = await this.reverseGeocodeWithGoogle(latitude, longitude);
        if (googleResult) {
          return googleResult;
        }
      }

      // Fallback to OpenCage
      if (this.OPENCAGE_API_KEY) {
        const opencageResult = await this.reverseGeocodeWithOpenCage(latitude, longitude);
        if (opencageResult) {
          return opencageResult;
        }
      }

      // Fallback to Nominatim
      return await this.reverseGeocodeWithNominatim(latitude, longitude);
    } catch (error) {
      logger.error('Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Validate and normalize address
   */
  static async validateAddress(address: AddressComponents): Promise<GeocodeResult | null> {
    const addressString = this.formatAddressString(address);
    return await this.geocodeAddress(addressString);
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get delivery zones based on distance from origin
   */
  static getDeliveryZone(
    originLat: number,
    originLon: number,
    destLat: number,
    destLon: number
  ): 'local' | 'regional' | 'national' | 'international' {
    const distance = this.calculateDistance(originLat, originLon, destLat, destLon);
    
    if (distance <= 25) return 'local'; // Within 25km
    if (distance <= 100) return 'regional'; // Within 100km
    if (distance <= 2000) return 'national'; // Within 2000km (Indonesia)
    return 'international';
  }

  /**
   * Geocode with Google Maps API
   */
  private static async geocodeWithGoogle(address: string): Promise<GeocodeResult | null> {
    try {
      const response = await axios.get(this.GOOGLE_GEOCODING_URL, {
        params: {
          address,
          key: this.GOOGLE_MAPS_API_KEY,
          region: 'ID' // Bias towards Indonesia
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;
        const addressComponents = this.parseGoogleAddressComponents(result.address_components);

        return {
          coordinates: {
            latitude: location.lat,
            longitude: location.lng
          },
          address: {
            ...addressComponents,
            formattedAddress: result.formatted_address
          },
          accuracy: result.geometry.location_type as any
        };
      }

      return null;
    } catch (error) {
      logger.error('Google geocoding error:', error);
      return null;
    }
  }

  /**
   * Geocode with OpenCage API
   */
  private static async geocodeWithOpenCage(address: string): Promise<GeocodeResult | null> {
    try {
      const response = await axios.get(this.OPENCAGE_GEOCODING_URL, {
        params: {
          q: address,
          key: this.OPENCAGE_API_KEY,
          countrycode: 'id', // Bias towards Indonesia
          limit: 1
        }
      });

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        const components = result.components;

        return {
          coordinates: {
            latitude: result.geometry.lat,
            longitude: result.geometry.lng
          },
          address: {
            street: components.road || components.street,
            city: components.city || components.town || components.village,
            state: components.state || components.province,
            postalCode: components.postcode,
            country: components.country,
            formattedAddress: result.formatted
          },
          accuracy: 'APPROXIMATE'
        };
      }

      return null;
    } catch (error) {
      logger.error('OpenCage geocoding error:', error);
      return null;
    }
  }

  /**
   * Geocode with Nominatim (OpenStreetMap)
   */
  private static async geocodeWithNominatim(address: string): Promise<GeocodeResult | null> {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          addressdetails: 1,
          limit: 1,
          countrycodes: 'id' // Bias towards Indonesia
        },
        headers: {
          'User-Agent': 'E-commerce-App/1.0'
        }
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        const address_parts = result.address || {};

        return {
          coordinates: {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon)
          },
          address: {
            street: address_parts.road || address_parts.street,
            city: address_parts.city || address_parts.town || address_parts.village,
            state: address_parts.state || address_parts.province,
            postalCode: address_parts.postcode,
            country: address_parts.country,
            formattedAddress: result.display_name
          },
          accuracy: 'APPROXIMATE'
        };
      }

      return null;
    } catch (error) {
      logger.error('Nominatim geocoding error:', error);
      return null;
    }
  }

  /**
   * Reverse geocode with Google Maps
   */
  private static async reverseGeocodeWithGoogle(
    latitude: number,
    longitude: number
  ): Promise<AddressComponents | null> {
    try {
      const response = await axios.get(this.GOOGLE_GEOCODING_URL, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: this.GOOGLE_MAPS_API_KEY
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const addressComponents = this.parseGoogleAddressComponents(result.address_components);

        return {
          ...addressComponents,
          formattedAddress: result.formatted_address
        };
      }

      return null;
    } catch (error) {
      logger.error('Google reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Reverse geocode with OpenCage
   */
  private static async reverseGeocodeWithOpenCage(
    latitude: number,
    longitude: number
  ): Promise<AddressComponents | null> {
    try {
      const response = await axios.get(this.OPENCAGE_GEOCODING_URL, {
        params: {
          q: `${latitude},${longitude}`,
          key: this.OPENCAGE_API_KEY,
          limit: 1
        }
      });

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        const components = result.components;

        return {
          street: components.road || components.street,
          city: components.city || components.town || components.village,
          state: components.state || components.province,
          postalCode: components.postcode,
          country: components.country,
          formattedAddress: result.formatted
        };
      }

      return null;
    } catch (error) {
      logger.error('OpenCage reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Reverse geocode with Nominatim
   */
  private static async reverseGeocodeWithNominatim(
    latitude: number,
    longitude: number
  ): Promise<AddressComponents | null> {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'E-commerce-App/1.0'
        }
      });

      if (response.data && response.data.address) {
        const address = response.data.address;

        return {
          street: address.road || address.street,
          city: address.city || address.town || address.village,
          state: address.state || address.province,
          postalCode: address.postcode,
          country: address.country,
          formattedAddress: response.data.display_name
        };
      }

      return null;
    } catch (error) {
      logger.error('Nominatim reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Parse Google address components
   */
  private static parseGoogleAddressComponents(components: any[]): AddressComponents {
    const result: AddressComponents = {};

    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number') || types.includes('route')) {
        result.street = (result.street || '') + ' ' + component.long_name;
      } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        result.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        result.state = component.long_name;
      } else if (types.includes('postal_code')) {
        result.postalCode = component.long_name;
      } else if (types.includes('country')) {
        result.country = component.long_name;
      }
    });

    if (result.street) {
      result.street = result.street.trim();
    }

    return result;
  }

  /**
   * Format address components into a string
   */
  private static formatAddressString(address: AddressComponents): string {
    const parts = [];
    
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postalCode) parts.push(address.postalCode);
    if (address.country) parts.push(address.country);
    
    return parts.join(', ');
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get map URL for displaying location
   */
  static getMapUrl(
    latitude: number,
    longitude: number,
    zoom: number = 15,
    size: string = '600x400'
  ): string {
    if (this.GOOGLE_MAPS_API_KEY) {
      return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${size}&markers=color:red%7C${latitude},${longitude}&key=${this.GOOGLE_MAPS_API_KEY}`;
    }
    
    // Fallback to OpenStreetMap
    return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=${zoom}`;
  }

  /**
   * Get interactive map embed URL
   */
  static getMapEmbedUrl(
    latitude: number,
    longitude: number,
    zoom: number = 15
  ): string {
    if (this.GOOGLE_MAPS_API_KEY) {
      return `https://www.google.com/maps/embed/v1/place?key=${this.GOOGLE_MAPS_API_KEY}&q=${latitude},${longitude}&zoom=${zoom}`;
    }
    
    // Fallback to OpenStreetMap embed
    return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}`;
  }
}