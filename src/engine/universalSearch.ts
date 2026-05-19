export interface POIEntity {
  name: string;
  category: 'Education' | 'Health' | 'Transport' | 'Commercial' | 'Food' | 'Services' | 'Infrastructure' | 'Landmarks';
  subCategory: string;
  coordinates: [number, number]; // [lng, lat]
  safetyScore: number; // TSI (0-100)
  status: 'Open' | 'Closed' | 'Active' | 'Open 24/7';
  icon: string;
  address: string;
  popularity: number; // relevance multiplier (1.0 to 2.0)
}

export interface SearchResult {
  name: string;
  category: string;
  subCategory: string;
  coordinates: [number, number];
  distance: number; // in km
  travelTime: number; // in minutes
  routeOptions: string[];
  safetyScore: number;
  status: string;
  icon: string;
  placeName: string;
}

export class UniversalSearchEngine {
  private localPOIs: POIEntity[] = [
    // --- EDUCATION ---
    {
      name: 'University of the Witwatersrand (Wits)',
      category: 'Education',
      subCategory: 'University',
      coordinates: [28.0301, -26.1911],
      safetyScore: 92,
      status: 'Open',
      icon: '🎓',
      address: '1 Jan Smuts Ave, Braamfontein, Johannesburg',
      popularity: 2.0
    },
    {
      name: 'University of Johannesburg (UJ) - Kingsway',
      category: 'Education',
      subCategory: 'University',
      coordinates: [27.9986, -26.1837],
      safetyScore: 88,
      status: 'Open',
      icon: '🎓',
      address: 'Kingsway Ave, Auckland Park, Johannesburg',
      popularity: 1.9
    },
    {
      name: 'Sandton Primary School',
      category: 'Education',
      subCategory: 'School',
      coordinates: [28.0423, -26.0911],
      safetyScore: 95,
      status: 'Closed',
      icon: '🏫',
      address: '115 Wildebeest Ave, Bryanston, Sandton',
      popularity: 1.4
    },
    // --- HEALTH ---
    {
      name: 'Charlotte Maxeke Academic Hospital',
      category: 'Health',
      subCategory: 'Hospital',
      coordinates: [28.0428, -26.1756],
      safetyScore: 85,
      status: 'Open 24/7',
      icon: '🏥',
      address: 'Jubilee Rd, Parktown, Johannesburg',
      popularity: 2.0
    },
    {
      name: 'Netcare Milpark Hospital',
      category: 'Health',
      subCategory: 'Hospital',
      coordinates: [28.0194, -26.1802],
      safetyScore: 94,
      status: 'Open 24/7',
      icon: '🏥',
      address: '9 Guild Rd, Parktown West, Johannesburg',
      popularity: 1.8
    },
    {
      name: 'Chris Hani Baragwanath Hospital',
      category: 'Health',
      subCategory: 'Emergency Hospital',
      coordinates: [27.9406, -26.2625],
      safetyScore: 78,
      status: 'Open 24/7',
      icon: '🏥',
      address: '26 Chris Hani Rd, Diepkloof, Soweto',
      popularity: 2.0
    },
    {
      name: 'Mediclinic Sandton Clinic',
      category: 'Health',
      subCategory: 'Hospital',
      coordinates: [28.0125, -26.0715],
      safetyScore: 95,
      status: 'Open 24/7',
      icon: '🏥',
      address: 'Corner Main St & Peter Place, Bryanston, Sandton',
      popularity: 1.7
    },
    // --- TRANSPORT ---
    {
      name: 'Johannesburg Park Station',
      category: 'Transport',
      subCategory: 'Transit Hub',
      coordinates: [28.0435, -26.1965],
      safetyScore: 72,
      status: 'Active',
      icon: '🚉',
      address: 'Rissik St & Wolmarans St, Johannesburg CBD',
      popularity: 2.0
    },
    {
      name: 'OR Tambo International Airport',
      category: 'Transport',
      subCategory: 'Airport',
      coordinates: [28.2460, -26.1367],
      safetyScore: 90,
      status: 'Open 24/7',
      icon: '✈️',
      address: 'O.R. Tambo Airport Rd, Kempton Park',
      popularity: 2.0
    },
    {
      name: 'Sandton Gautrain Station',
      category: 'Transport',
      subCategory: 'Gautrain Station',
      coordinates: [28.0565, -26.1075],
      safetyScore: 96,
      status: 'Active',
      icon: '🚊',
      address: 'Rivonia Rd & West St, Sandton, Johannesburg',
      popularity: 1.9
    },
    {
      name: 'Bree Street Taxi Rank',
      category: 'Transport',
      subCategory: 'Taxi Rank',
      coordinates: [28.0401, -26.2012],
      safetyScore: 65,
      status: 'Active',
      icon: '🚕',
      address: 'Lilian Ngoyi St, Newtown, Johannesburg CBD',
      popularity: 1.8
    },
    {
      name: 'Noord Street Taxi Rank',
      category: 'Transport',
      subCategory: 'Taxi Rank',
      coordinates: [28.0450, -26.1980],
      safetyScore: 60,
      status: 'Active',
      icon: '🚕',
      address: 'Noord St, Johannesburg CBD',
      popularity: 1.8
    },
    // --- COMMERCIAL ---
    {
      name: 'Sandton City Mall',
      category: 'Commercial',
      subCategory: 'Shopping Mall',
      coordinates: [28.0522, -26.1095],
      safetyScore: 96,
      status: 'Open',
      icon: '🛍️',
      address: '83 Rivonia Rd, Sandown, Sandton',
      popularity: 2.0
    },
    {
      name: 'Mall of Africa',
      category: 'Commercial',
      subCategory: 'Shopping Mall',
      coordinates: [28.1065, -26.0152],
      safetyScore: 94,
      status: 'Open',
      icon: '🛍️',
      address: 'Lone Creek Cres, Waterfall City, Midrand',
      popularity: 1.9
    },
    {
      name: 'Rosebank Mall',
      category: 'Commercial',
      subCategory: 'Shopping Mall',
      coordinates: [28.0423, -26.1460],
      safetyScore: 92,
      status: 'Open',
      icon: '🛍️',
      address: '50 Bath Ave, Rosebank, Johannesburg',
      popularity: 1.8
    },
    {
      name: 'Soweto Spaza Hub',
      category: 'Commercial',
      subCategory: 'Spaza Shop',
      coordinates: [27.8720, -26.2580],
      safetyScore: 75,
      status: 'Open',
      icon: '🏪',
      address: 'Khumalo St, Orlando West, Soweto',
      popularity: 1.2
    },
    // --- FOOD ---
    {
      name: 'The Grillhouse Rosebank',
      category: 'Food',
      subCategory: 'Restaurant',
      coordinates: [28.0431, -26.1468],
      safetyScore: 94,
      status: 'Open',
      icon: '🥩',
      address: '1, The Firs, Biermann Ave, Rosebank',
      popularity: 1.6
    },
    {
      name: 'Sakhumzi Restaurant',
      category: 'Food',
      subCategory: 'Shisanyama & Restaurant',
      coordinates: [27.9065, -26.2378],
      safetyScore: 85,
      status: 'Open',
      icon: '🍖',
      address: '6980 Vilakazi St, Orlando West, Soweto',
      popularity: 1.8
    },
    {
      name: 'Chaf Pozi Soweto Towers',
      category: 'Food',
      subCategory: 'Shisanyama',
      coordinates: [27.9772, -26.2530],
      safetyScore: 82,
      status: 'Open',
      icon: '🔥',
      address: 'Corner Kingsway & Nicholas St, Soweto',
      popularity: 1.7
    },
    {
      name: 'Mugg & Bean Sandton City',
      category: 'Food',
      subCategory: 'Café',
      coordinates: [28.0515, -26.1090],
      safetyScore: 95,
      status: 'Open',
      icon: '☕',
      address: 'Sandton City, Sandton, Johannesburg',
      popularity: 1.5
    },
    // --- SERVICES ---
    {
      name: 'SAPS Johannesburg Central Police Station',
      category: 'Services',
      subCategory: 'Police Station',
      coordinates: [28.0375, -26.2038],
      safetyScore: 80,
      status: 'Open 24/7',
      icon: '🚓',
      address: '1 Commissioner St, Johannesburg CBD',
      popularity: 1.8
    },
    {
      name: 'SAPS Sandton Police Station',
      category: 'Services',
      subCategory: 'Police Station',
      coordinates: [28.0670, -26.0680],
      safetyScore: 95,
      status: 'Open 24/7',
      icon: '🚓',
      address: '2 Summit Rd, Morningside, Sandton',
      popularity: 1.7
    },
    {
      name: 'FNB Bank City Head Office',
      category: 'Services',
      subCategory: 'Bank',
      coordinates: [28.0410, -26.2030],
      safetyScore: 88,
      status: 'Active',
      icon: '🏦',
      address: 'Corner Pritchard & Simmonds St, Johannesburg CBD',
      popularity: 1.9
    },
    {
      name: 'Standard Bank ATM Rosebank',
      category: 'Services',
      subCategory: 'ATM',
      coordinates: [28.0420, -26.1455],
      safetyScore: 92,
      status: 'Open 24/7',
      icon: '🏧',
      address: '50 Bath Ave, Rosebank Mall, Johannesburg',
      popularity: 1.4
    },
    // --- INFRASTRUCTURE ---
    {
      name: 'Shell Ultra City Midrand',
      category: 'Infrastructure',
      subCategory: 'Fuel Station',
      coordinates: [28.1325, -25.9910],
      safetyScore: 92,
      status: 'Open 24/7',
      icon: '⛽',
      address: 'N1 Highway Northbound, Midrand',
      popularity: 1.9
    },
    {
      name: 'BP Garage Sandton Drive',
      category: 'Infrastructure',
      subCategory: 'Fuel Station',
      coordinates: [28.0482, -26.1012],
      safetyScore: 94,
      status: 'Open 24/7',
      icon: '⛽',
      address: 'Corner Sandton Dr & Grayston Dr, Sandton',
      popularity: 1.6
    },
    {
      name: 'M1 Highway Double Decker Section',
      category: 'Infrastructure',
      subCategory: 'Highway Arterial',
      coordinates: [28.0415, -26.1910],
      safetyScore: 85,
      status: 'Active',
      icon: '🛣️',
      address: 'M1 South & North, Johannesburg',
      popularity: 1.5
    },
    // --- LANDMARKS ---
    {
      name: 'FNB Stadium (Soccer City)',
      category: 'Landmarks',
      subCategory: 'Stadium',
      coordinates: [27.9825, -26.2347],
      safetyScore: 88,
      status: 'Active',
      icon: '🏟️',
      address: 'Nasrec Rd, Johannesburg South',
      popularity: 2.0
    },
    {
      name: 'Orlando Towers Soweto',
      category: 'Landmarks',
      subCategory: 'Landmark Attraction',
      coordinates: [27.9772, -26.2530],
      safetyScore: 85,
      status: 'Active',
      icon: '🗼',
      address: 'Corner Dynamo & Nicholas St, Orlando, Soweto',
      popularity: 1.8
    },
    {
      name: 'Constitution Hill Museum',
      category: 'Landmarks',
      subCategory: 'Heritage Site',
      coordinates: [28.0435, -26.1885],
      safetyScore: 90,
      status: 'Open',
      icon: '🏛️',
      address: '11 Kotze St, Braamfontein, Johannesburg',
      popularity: 1.6
    },
    {
      name: 'Carlton Centre Skyscraper',
      category: 'Landmarks',
      subCategory: 'Skyscraper Landmark',
      coordinates: [28.0470, -26.2055],
      safetyScore: 70,
      status: 'Open',
      icon: '🏢',
      address: '150 Commissioner St, Johannesburg CBD',
      popularity: 1.5
    }
  ];

  private intentMap: Record<string, string[]> = {
    // Food
    'hungry': ['Food', 'Commercial'],
    'eat': ['Food', 'Commercial'],
    'food': ['Food', 'Commercial'],
    'shisanyama': ['Food', 'Commercial'],
    'braai': ['Food'],
    'cafe': ['Food'],
    'restaurant': ['Food'],
    'lunch': ['Food'],
    'dinner': ['Food'],
    'starving': ['Food'],
    // Health
    'sick': ['Health'],
    'injured': ['Health'],
    'pain': ['Health'],
    'doctor': ['Health'],
    'ambulance': ['Health'],
    'clinic': ['Health'],
    'hospital': ['Health'],
    'pharmacy': ['Health'],
    'emergency': ['Health', 'Services'],
    // Services / Finance / Security
    'cash': ['Services'],
    'money': ['Services'],
    'atm': ['Services'],
    'withdraw': ['Services'],
    'bank': ['Services'],
    'police': ['Services'],
    'saps': ['Services'],
    'metro': ['Services'],
    'security': ['Services'],
    'robbed': ['Services', 'Health'],
    'stolen': ['Services'],
    // Transport
    'transit': ['Transport'],
    'bus': ['Transport'],
    'taxi': ['Transport'],
    'train': ['Transport'],
    'rank': ['Transport'],
    'airport': ['Transport'],
    'gautrain': ['Transport'],
    'ride': ['Transport'],
    'travel': ['Transport'],
    // Infrastructure
    'breakdown': ['Infrastructure', 'Services'],
    'mechanic': ['Services'],
    'towing': ['Services'],
    'tow': ['Services'],
    'broken': ['Infrastructure', 'Services'],
    'tire': ['Infrastructure', 'Services'],
    'fuel': ['Infrastructure'],
    'petrol': ['Infrastructure'],
    'garage': ['Infrastructure'],
    'refuel': ['Infrastructure'],
    // Education
    'learn': ['Education'],
    'study': ['Education'],
    'school': ['Education'],
    'university': ['Education'],
    'college': ['Education'],
    'varsity': ['Education'],
    'uj': ['Education'],
    'wits': ['Education'],
    // Commercial
    'shop': ['Commercial'],
    'buy': ['Commercial'],
    'mall': ['Commercial'],
    'supermarket': ['Commercial'],
    'groceries': ['Commercial'],
    'spaza': ['Commercial']
  };

  private saDictionary: Record<string, string> = {
    'robot': 'traffic light',
    'robots': 'traffic lights',
    'garage': 'petrol station',
    'rank': 'taxi rank',
    'kasi': 'township',
    'spaza': 'local shop',
    'cbd': 'city center',
    'shisanyama': 'braai restaurant',
    'saps': 'police station',
    'metro': 'metro police',
    'gautrain': 'train station',
    'uj': 'university of johannesburg',
    'wits': 'university of the witwatersrand'
  };

  public search(query: string, userLocation: [number, number] | null): SearchResult[] {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return [];

    // 1. INTENT RECOGNITION & SOUTH AFRICAN LOCALIZATION
    let translated = lowerQuery;
    for (const [slang, formal] of Object.entries(this.saDictionary)) {
      if (translated.includes(slang)) {
        translated = translated.replace(new RegExp(`\\b${slang}\\b`, 'g'), formal);
      }
    }

    // Determine target categories based on keyword mappings
    const targetCategories: Set<string> = new Set();
    for (const [phrase, categories] of Object.entries(this.intentMap)) {
      if (lowerQuery.includes(phrase)) {
        categories.forEach(c => targetCategories.add(c));
      }
    }

    // 2. RETRIEVE AND SCORE LOCAL POINTS OF INTEREST
    const scoredResults: { poi: POIEntity; score: number; distance: number }[] = [];
    const baseLocation: [number, number] = userLocation || [28.0473, -26.2041]; // Jhb default

    for (const poi of this.localPOIs) {
      let score = 0;
      const distance = this.calculateDistance(baseLocation, poi.coordinates);

      // Match A: Direct Name Match (fuzzy / sub-string contains)
      const nameLower = poi.name.toLowerCase();
      if (nameLower.includes(translated) || nameLower.includes(lowerQuery)) {
        score += 100;
        // Boost for starting with query
        if (nameLower.startsWith(translated)) score += 30;
      }

      // Match B: Category / Subcategory Match
      if (poi.category.toLowerCase().includes(translated) || poi.subCategory.toLowerCase().includes(translated)) {
        score += 80;
      }

      // Match C: Intent category mapping match
      if (targetCategories.has(poi.category)) {
        score += 60;
      }

      // Boost by popularity
      score *= poi.popularity;

      // Distance Penalty: Decay score slightly over distance to prioritize local matches
      score -= Math.min(30, distance * 0.5);

      // Safety critical priority boost (Health, Services/Police, Fuel) during urgent intents
      const isUrgentQuery = /help|sick|injured|emergency|police|robbed|fuel|empty|breakdown/i.test(lowerQuery);
      if (isUrgentQuery && (poi.category === 'Health' || poi.subCategory === 'Police Station' || poi.subCategory === 'Fuel Station')) {
        score += 50; // Massively elevate emergency centers
      }

      if (score > 10) {
        scoredResults.push({ poi, score, distance });
      }
    }

    // 3. SORT RESULTS: HIGHEST RELEVANCE CORE & PROXIMITY FIRST
    scoredResults.sort((a, b) => b.score - a.score || a.distance - b.distance);

    // 4. MAP TO DESTINATION INTELLIGENCE OUTPUT SCHEMA
    return scoredResults.map(item => {
      const { poi, distance } = item;
      
      // Calculate estimated travel time: avg driving speed 45 km/h, walking 5 km/h
      // Check if walking intent is present
      const isWalkingIntent = lowerQuery.includes('walk') || lowerQuery.includes('foot');
      const speedKmh = isWalkingIntent ? 5 : 45;
      const travelTime = Math.max(1, Math.round((distance / speedKmh) * 60));

      return {
        name: poi.name,
        category: poi.category,
        subCategory: poi.subCategory,
        coordinates: poi.coordinates,
        distance: parseFloat(distance.toFixed(2)),
        travelTime,
        routeOptions: ['driving', 'walking', 'cycling', 'transit'],
        safetyScore: poi.safetyScore,
        status: poi.status,
        icon: poi.icon,
        placeName: poi.address
      };
    });
  }

  /**
   * Calculate Mapbox feature mapping and enrich it with Destination Intelligence attributes
   */
  public enrichMapboxFeature(feature: any, userLocation: [number, number] | null): SearchResult {
    const baseLocation: [number, number] = userLocation || [28.0473, -26.2041];
    const coords = feature.center as [number, number];
    const distance = this.calculateDistance(baseLocation, coords);
    
    // Categorize Mapbox geocoding result dynamically
    let category = 'Landmarks';
    let subCategory = 'Location';
    let icon = '🏛️';
    let safetyScore = 80; // default TSI
    
    const types = feature.properties?.category || feature.place_type || [];
    const text = (feature.text || '').toLowerCase();
    
    if (types.includes('education') || /school|university|varsity|college/i.test(text)) {
      category = 'Education';
      subCategory = 'Institution';
      icon = '🎓';
      safetyScore = 90;
    } else if (types.includes('healthcare') || /hospital|clinic|pharmacy|medical/i.test(text)) {
      category = 'Health';
      subCategory = 'Medical Facility';
      icon = '🏥';
      safetyScore = 85;
    } else if (types.includes('transit') || /station|airport|taxi|rank|bus/i.test(text)) {
      category = 'Transport';
      subCategory = 'Transport Node';
      icon = '🚌';
      safetyScore = 75;
    } else if (types.includes('commercial') || /mall|shop|store|spaza|market/i.test(text)) {
      category = 'Commercial';
      subCategory = 'Commercial Outlet';
      icon = '🛍️';
      safetyScore = 82;
    } else if (types.includes('food') || /restaurant|food|cafe|braai/i.test(text)) {
      category = 'Food';
      subCategory = 'Eatery';
      icon = '🍔';
      safetyScore = 84;
    } else if (types.includes('services') || /bank|atm|post|police|saps/i.test(text)) {
      category = 'Services';
      subCategory = 'Public Service';
      icon = '🚓';
      safetyScore = 88;
    } else if (types.includes('infrastructure') || /fuel|petrol|garage|parking/i.test(text)) {
      category = 'Infrastructure';
      subCategory = 'Utility Node';
      icon = '⛽';
      safetyScore = 86;
    }

    // Dynamic business hours status generator
    const hour = new Date().getHours();
    const isEmergency = category === 'Health' || subCategory === 'Police Station';
    const status = isEmergency ? 'Open 24/7' : (hour >= 8 && hour < 18 ? 'Open' : 'Closed');

    const travelTime = Math.max(1, Math.round((distance / 45) * 60));

    return {
      name: feature.text || 'Location',
      category,
      subCategory,
      coordinates: coords,
      distance: parseFloat(distance.toFixed(2)),
      travelTime,
      routeOptions: ['driving', 'walking', 'cycling', 'transit'],
      safetyScore,
      status,
      icon,
      placeName: feature.place_name || feature.text || 'South Africa'
    };
  }

  private calculateDistance(p1: [number, number], p2: [number, number]): number {
    const R = 6371; // Earth radius in km
    const dLat = (p2[1] - p1[1]) * Math.PI / 180;
    const dLng = (p2[0] - p1[0]) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(p1[1] * Math.PI / 180) * Math.cos(p2[1] * Math.PI / 180) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const universalSearch = new UniversalSearchEngine();
