import { useState, useEffect } from 'react';
import ModernDealCard from './modern-deal-card';
import { Button } from '@/components/ui/button';

// Sample data for testing
const sampleDeals = [
  {
    id: 1,
    title: 'Beer Special',
    alcoholCategory: 'beer',
    brandName: 'heineken',
    servingStyle: 'glass',
    discountedPrice: 6,
    regularPrice: 9.5,
    discountPercentage: 30,
    startTime: '16:00',
    endTime: '18:00',
    isOneForOne: false,
    isPremium: false,
    bgImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/beer_background.jpg',
    brandImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/heineken_glass.png',
    establishment: {
      name: 'The Beer House',
      latitude: 1.3521,
      longitude: 103.8198,
    }
  },
  {
    id: 2,
    title: 'Red Wine Special',
    alcoholCategory: 'red_wine',
    brandName: 'yellowtail',
    servingStyle: 'glass',
    discountedPrice: 7,
    regularPrice: 12,
    discountPercentage: 40,
    startTime: '17:00',
    endTime: '20:00',
    isOneForOne: false,
    isPremium: false,
    bgImageUrl: '',
    brandImageUrl: '',
    establishment: {
      name: 'Wine & Dine',
      latitude: 1.3521,
      longitude: 103.8198,
    }
  },
  {
    id: 5,
    title: 'White Wine Special',
    alcoholCategory: 'white_wine',
    brandName: 'chardonnay',
    servingStyle: 'glass',
    discountedPrice: 8,
    regularPrice: 14,
    discountPercentage: 45,
    startTime: '17:00',
    endTime: '20:00',
    isOneForOne: false,
    isPremium: false,
    bgImageUrl: '',
    brandImageUrl: '',
    establishment: {
      name: 'Wine Cellar',
      latitude: 1.3421,
      longitude:
      103.8298,
    }
  },
  {
    id: 6,
    title: 'Bubbly Special',
    alcoholCategory: 'bubbly',
    brandName: 'prosecco',
    servingStyle: 'glass',
    discountedPrice: 9,
    regularPrice: 18,
    discountPercentage: 50,
    startTime: '17:00',
    endTime: '21:00',
    isOneForOne: true,
    isPremium: true,
    bgImageUrl: '',
    brandImageUrl: '',
    establishment: {
      name: 'Bubbles Bar',
      latitude: 1.3621,
      longitude: 103.8098,
    }
  },
  {
    id: 3,
    title: 'Cocktail Special',
    alcoholCategory: 'cocktail',
    brandName: 'margarita',
    servingStyle: 'glass',
    discountedPrice: 3,
    regularPrice: 3.9,
    discountPercentage: 23,
    startTime: '18:00',
    endTime: '22:00',
    isOneForOne: false,
    isPremium: false,
    bgImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/cocktail_background.jpg',
    brandImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/margarita_glass.png',
    establishment: {
      name: 'Cocktail Lounge',
      latitude: 1.3521,
      longitude: 103.8198,
    }
  },
  {
    id: 4,
    title: 'Spirit Special',
    alcoholCategory: 'whisky',
    brandName: 'johnniewalker',
    servingStyle: 'bottle',
    discountedPrice: 12,
    regularPrice: 17,
    discountPercentage: 30,
    startTime: '19:00',
    endTime: '23:00',
    isOneForOne: false,
    isPremium: true,
    bgImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/whisky_background.jpg',
    brandImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/johnnie_walker_bottle.png',
    establishment: {
      name: 'Spirits & Co',
      latitude: 1.3521,
      longitude: 103.8198,
    }
  }
];

export default function ModernDealsGrid() {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [deals, setDeals] = useState(sampleDeals);
  
  // Simulate user location for testing
  useEffect(() => {
    // Default to Singapore location
    setUserLocation({ lat: 1.3521, lng: 103.8198 });
    
    // Or get actual location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Error getting location:', error);
        }
      );
    }
  }, []);
  
  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  };
  
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };
  
  // Get the current location from API test endpoint (for testing only)
  const loadDealsFromAPI = async () => {
    try {
      const response = await fetch(`/api/test-cloudinary`);
      const data = await response.json();
      console.log('Cloudinary test data:', data);
      
      // Using Cloudinary sample/demo images for testing until we upload our own
      const cloudName = "demo"; // Use demo account for sample images
      
      // Sample images from Cloudinary demo account
      const beerBgUrl = "https://res.cloudinary.com/demo/image/upload/beer_q6pl5z.jpg";
      const cocktailBgUrl = "https://res.cloudinary.com/demo/image/upload/cocktail_ngvkuf.jpg";
      const beerBottleUrl = "https://res.cloudinary.com/demo/image/upload/bottle_zx4wae.png";
      const beerGlassUrl = "https://res.cloudinary.com/demo/image/upload/wine-glass_kfrr9f.png";
      const margaritaGlassUrl = "https://res.cloudinary.com/demo/image/upload/cocktail-glass_b14htu.png";
      
      console.log("Using exact URLs from API for testing...");
      console.log("Beer background:", beerBgUrl);
      console.log("Cocktail background:", cocktailBgUrl);
      console.log("Beer bottle:", beerBottleUrl);
      console.log("Beer glass:", beerGlassUrl);
      console.log("Margarita glass:", margaritaGlassUrl);
      
      // Update the deal's bgImageUrl and brandImageUrl with hardcoded Cloudinary URLs
      const updatedDeals = deals.map(deal => {
        const category = deal.alcoholCategory.toLowerCase();
        
        // Get background image URL
        let bgImageUrl = '';
        if (category === 'beer') {
          bgImageUrl = beerBgUrl;
        } else if (category === 'cocktail') {
          bgImageUrl = cocktailBgUrl;
        }
        
        // Get brand image URL
        let brandImageUrl = '';
        if (category === 'beer' && deal.servingStyle === 'bottle') {
          brandImageUrl = beerBottleUrl;
        } else if (category === 'beer' && deal.servingStyle === 'glass') {
          brandImageUrl = beerGlassUrl;
        } else if (category === 'cocktail' && deal.brandName === 'margarita') {
          brandImageUrl = margaritaGlassUrl;
        }
        
        return {
          ...deal,
          bgImageUrl,
          brandImageUrl
        };
      });
      
      setDeals(updatedDeals);
    } catch (error) {
      console.error('Error fetching Cloudinary test data:', error);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Happy Hour Deals</h1>
      
      <Button onClick={loadDealsFromAPI} className="mb-6">
        Load Cloudinary Images
      </Button>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {deals.map((deal) => {
          // Calculate distance if user location is available
          const distance = userLocation ? 
            calculateDistance(
              userLocation.lat, 
              userLocation.lng,
              deal.establishment.latitude,
              deal.establishment.longitude
            ) : null;
            
          return (
            <ModernDealCard
              key={deal.id}
              deal={deal}
              distance={distance}
            />
          );
        })}
      </div>
    </div>
  );
}