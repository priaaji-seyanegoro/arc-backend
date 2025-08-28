import axios from 'axios';
import { logger } from '../utils/logger';
import {
  RAJAONGKIR_API_KEY,
  GOJEK_API_KEY,
  GRAB_API_KEY,
  DHL_API_KEY,
  FEDEX_API_KEY,
  DEFAULT_ORIGIN_CITY,
  DEFAULT_ORIGIN_PROVINCE,
  DEFAULT_ORIGIN_COORDINATES
} from '../config/env';

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface ShippingOption {
  courier: string;
  service: string;
  description: string;
  cost: number;
  estimatedDays: string;
  type: 'domestic' | 'instant' | 'international';
}

interface ShippingCalculationRequest {
  origin: ShippingAddress;
  destination: ShippingAddress;
  weight: number; // in grams
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export class ShippingService {
  private static readonly RAJAONGKIR_API_KEY = RAJAONGKIR_API_KEY;
  private static readonly GOJEK_API_KEY = GOJEK_API_KEY;
  private static readonly GRAB_API_KEY = GRAB_API_KEY;
  private static readonly DHL_API_KEY = DHL_API_KEY;
  private static readonly FEDEX_API_KEY = FEDEX_API_KEY;
  private static readonly RAJAONGKIR_BASE_URL = 'https://api.rajaongkir.com/starter';
  
  // Default origin (your warehouse/store location)
  private static readonly DEFAULT_ORIGIN = {
    city: DEFAULT_ORIGIN_CITY,
    state: DEFAULT_ORIGIN_PROVINCE,
    country: 'Indonesia',
    postalCode: '10110',
    coordinates: DEFAULT_ORIGIN_COORDINATES
  };

  /**
   * Calculate shipping costs for all available options
   */
  static async calculateShippingCosts(
    destination: ShippingAddress,
    weight: number,
    dimensions?: { length: number; width: number; height: number }
  ): Promise<ShippingOption[]> {
    try {
      const shippingOptions: ShippingOption[] = [];

      // Get domestic shipping options
      const domesticOptions = await this.getDomesticShippingOptions(destination, weight);
      shippingOptions.push(...domesticOptions);

      // Get instant delivery options (for Jakarta area)
      if (this.isJakartaArea(destination)) {
        const instantOptions = await this.getInstantDeliveryOptions(destination, weight);
        shippingOptions.push(...instantOptions);
      }

      // Get international shipping options
      if (destination.country !== 'Indonesia') {
        const internationalOptions = await this.getInternationalShippingOptions(destination, weight, dimensions);
        shippingOptions.push(...internationalOptions);
      }

      return shippingOptions;
    } catch (error) {
      logger.error('Error calculating shipping costs:', error);
      // Return fallback options
      return this.getFallbackShippingOptions(destination, weight);
    }
  }

  /**
   * Get domestic shipping options using RajaOngkir API
   */
  private static async getDomesticShippingOptions(
    destination: ShippingAddress,
    weight: number
  ): Promise<ShippingOption[]> {
    try {
      if (!this.RAJAONGKIR_API_KEY) {
        logger.warn('RajaOngkir API key not configured, using fallback rates');
        return this.getFallbackDomesticOptions(weight);
      }

      // Get city ID from RajaOngkir
      const cityId = await this.getCityId(destination.city);
      if (!cityId) {
        return this.getFallbackDomesticOptions(weight);
      }

      const response = await axios.post(
        `${this.RAJAONGKIR_BASE_URL}/cost`,
        {
          origin: '153', // Jakarta city ID
          destination: cityId,
          weight: weight,
          courier: 'jne:jnt:pos'
        },
        {
          headers: {
            'key': this.RAJAONGKIR_API_KEY,
            'content-type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const options: ShippingOption[] = [];
      
      if (response.data.rajaongkir.status.code === 200) {
        const results = response.data.rajaongkir.results;
        
        results.forEach((courier: any) => {
          courier.costs.forEach((cost: any) => {
            options.push({
              courier: courier.code.toUpperCase(),
              service: cost.service,
              description: cost.description,
              cost: cost.cost[0].value,
              estimatedDays: cost.cost[0].etd,
              type: 'domestic'
            });
          });
        });
      }

      return options.length > 0 ? options : this.getFallbackDomesticOptions(weight);
    } catch (error) {
      logger.error('Error getting domestic shipping options:', error);
      return this.getFallbackDomesticOptions(weight);
    }
  }

  /**
   * Get instant delivery options (Gojek, Grab)
   */
  private static async getInstantDeliveryOptions(
    destination: ShippingAddress,
    weight: number
  ): Promise<ShippingOption[]> {
    const options: ShippingOption[] = [];

    // Gojek GoSend
    if (weight <= 20000) { // 20kg limit
      const gojekCost = this.calculateGojekCost(weight);
      options.push({
        courier: 'GOJEK',
        service: 'GoSend',
        description: 'Same day delivery by Gojek',
        cost: gojekCost,
        estimatedDays: '0-4 hours',
        type: 'instant'
      });
    }

    // Grab Express
    if (weight <= 15000) { // 15kg limit
      const grabCost = this.calculateGrabCost(weight);
      options.push({
        courier: 'GRAB',
        service: 'GrabExpress',
        description: 'Same day delivery by Grab',
        cost: grabCost,
        estimatedDays: '0-6 hours',
        type: 'instant'
      });
    }

    return options;
  }

  /**
   * Get international shipping options
   */
  private static async getInternationalShippingOptions(
    destination: ShippingAddress,
    weight: number,
    dimensions?: { length: number; width: number; height: number }
  ): Promise<ShippingOption[]> {
    const options: ShippingOption[] = [];

    // DHL Express
    const dhlCost = this.calculateDHLCost(destination, weight, dimensions);
    options.push({
      courier: 'DHL',
      service: 'Express Worldwide',
      description: 'International express delivery',
      cost: dhlCost,
      estimatedDays: '3-5 days',
      type: 'international'
    });

    // FedEx International
    const fedexCost = this.calculateFedExCost(destination, weight, dimensions);
    options.push({
      courier: 'FEDEX',
      service: 'International Priority',
      description: 'International priority delivery',
      cost: fedexCost,
      estimatedDays: '4-7 days',
      type: 'international'
    });

    // EMS Pos Indonesia
    const emsCost = this.calculateEMSCost(destination, weight);
    options.push({
      courier: 'POS',
      service: 'EMS',
      description: 'Express Mail Service',
      cost: emsCost,
      estimatedDays: '7-14 days',
      type: 'international'
    });

    return options;
  }

  /**
   * Get city ID from RajaOngkir API
   */
  private static async getCityId(cityName: string): Promise<string | null> {
    try {
      const response = await axios.get(
        `${this.RAJAONGKIR_BASE_URL}/city`,
        {
          headers: {
            'key': this.RAJAONGKIR_API_KEY
          }
        }
      );

      const cities = response.data.rajaongkir.results;
      const city = cities.find((c: any) => 
        c.city_name.toLowerCase().includes(cityName.toLowerCase())
      );

      return city ? city.city_id : null;
    } catch (error) {
      logger.error('Error getting city ID:', error);
      return null;
    }
  }

  /**
   * Check if destination is in Jakarta area
   */
  private static isJakartaArea(destination: ShippingAddress): boolean {
    const jakartaAreas = ['jakarta', 'bekasi', 'depok', 'tangerang', 'bogor'];
    return jakartaAreas.some(area => 
      destination.city.toLowerCase().includes(area) ||
      destination.state.toLowerCase().includes(area)
    );
  }

  /**
   * Calculate Gojek GoSend cost
   */
  private static calculateGojekCost(weight: number): number {
    const baseCost = 15000; // Base cost 15k
    const weightCost = Math.ceil(weight / 1000) * 2000; // 2k per kg
    return baseCost + weightCost;
  }

  /**
   * Calculate Grab Express cost
   */
  private static calculateGrabCost(weight: number): number {
    const baseCost = 18000; // Base cost 18k
    const weightCost = Math.ceil(weight / 1000) * 2500; // 2.5k per kg
    return baseCost + weightCost;
  }

  /**
   * Calculate DHL cost (simplified)
   */
  private static calculateDHLCost(
    destination: ShippingAddress,
    weight: number,
    dimensions?: { length: number; width: number; height: number }
  ): number {
    const baseRate = 250000; // Base rate 250k
    const weightRate = Math.ceil(weight / 1000) * 50000; // 50k per kg
    
    // Zone multiplier based on destination
    let zoneMultiplier = 1;
    if (destination.country === 'Singapore' || destination.country === 'Malaysia') {
      zoneMultiplier = 1.2;
    } else if (destination.country === 'United States' || destination.country === 'Europe') {
      zoneMultiplier = 1.8;
    } else {
      zoneMultiplier = 1.5;
    }

    return Math.round((baseRate + weightRate) * zoneMultiplier);
  }

  /**
   * Calculate FedEx cost (simplified)
   */
  private static calculateFedExCost(
    destination: ShippingAddress,
    weight: number,
    dimensions?: { length: number; width: number; height: number }
  ): number {
    const baseRate = 280000; // Base rate 280k
    const weightRate = Math.ceil(weight / 1000) * 55000; // 55k per kg
    
    let zoneMultiplier = 1;
    if (destination.country === 'Singapore' || destination.country === 'Malaysia') {
      zoneMultiplier = 1.1;
    } else if (destination.country === 'United States' || destination.country === 'Europe') {
      zoneMultiplier = 1.7;
    } else {
      zoneMultiplier = 1.4;
    }

    return Math.round((baseRate + weightRate) * zoneMultiplier);
  }

  /**
   * Calculate EMS cost
   */
  private static calculateEMSCost(destination: ShippingAddress, weight: number): number {
    const baseRate = 150000; // Base rate 150k
    const weightRate = Math.ceil(weight / 1000) * 25000; // 25k per kg
    return baseRate + weightRate;
  }

  /**
   * Fallback shipping options when API is unavailable
   */
  private static getFallbackShippingOptions(
    destination: ShippingAddress,
    weight: number
  ): ShippingOption[] {
    if (destination.country === 'Indonesia') {
      return this.getFallbackDomesticOptions(weight);
    } else {
      return this.getFallbackInternationalOptions(destination, weight);
    }
  }

  /**
   * Fallback domestic options
   */
  private static getFallbackDomesticOptions(weight: number): ShippingOption[] {
    const baseWeight = Math.ceil(weight / 1000); // Convert to kg
    
    return [
      {
        courier: 'JNE',
        service: 'REG',
        description: 'Regular Service',
        cost: Math.max(15000, baseWeight * 8000),
        estimatedDays: '2-3 days',
        type: 'domestic'
      },
      {
        courier: 'JNE',
        service: 'YES',
        description: 'Yakin Esok Sampai',
        cost: Math.max(25000, baseWeight * 12000),
        estimatedDays: '1-2 days',
        type: 'domestic'
      },
      {
        courier: 'JNT',
        service: 'REG',
        description: 'Regular Service',
        cost: Math.max(12000, baseWeight * 7000),
        estimatedDays: '2-4 days',
        type: 'domestic'
      },
      {
        courier: 'POS',
        service: 'Nextday',
        description: 'Next Day Service',
        cost: Math.max(20000, baseWeight * 10000),
        estimatedDays: '1-2 days',
        type: 'domestic'
      }
    ];
  }

  /**
   * Fallback international options
   */
  private static getFallbackInternationalOptions(
    destination: ShippingAddress,
    weight: number
  ): ShippingOption[] {
    return [
      {
        courier: 'DHL',
        service: 'Express',
        description: 'International Express',
        cost: this.calculateDHLCost(destination, weight),
        estimatedDays: '3-5 days',
        type: 'international'
      },
      {
        courier: 'FEDEX',
        service: 'Priority',
        description: 'International Priority',
        cost: this.calculateFedExCost(destination, weight),
        estimatedDays: '4-7 days',
        type: 'international'
      },
      {
        courier: 'POS',
        service: 'EMS',
        description: 'Express Mail Service',
        cost: this.calculateEMSCost(destination, weight),
        estimatedDays: '7-14 days',
        type: 'international'
      }
    ];
  }

  /**
   * Get shipping option by courier and service
   */
  static async getShippingOption(
    courier: string,
    service: string,
    destination: ShippingAddress,
    weight: number
  ): Promise<ShippingOption | null> {
    const options = await this.calculateShippingCosts(destination, weight);
    return options.find(option => 
      option.courier === courier && option.service === service
    ) || null;
  }
}