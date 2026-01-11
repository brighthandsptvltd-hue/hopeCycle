import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to recenter map when location changes
const RecenterMap = ({ lat, lng }: { lat: number, lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 13);
  }, [lat, lng, map]);
  return null;
};

interface DonorNearbyProps {
  onSelectNGO?: (id: string) => void;
}

const DonorNearby: React.FC<DonorNearbyProps> = ({ onSelectNGO }) => {
  const [ngos, setNgos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

  // Haversine formula for distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let currentLoc = { lat: 17.3850, lng: 78.4867 }; // Default Hyderabad

        if (user) {
          const { data: curUser } = await supabase
            .from('profiles')
            .select('latitude, longitude')
            .eq('id', user.id)
            .single();

          if (curUser && curUser.latitude) {
            currentLoc = { lat: curUser.latitude, lng: curUser.longitude };
            setUserLocation(currentLoc);
          }
        }

        // Fetch all NGOs
        const { data: ngoData, error: ngoError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'NGO');

        if (ngoError) throw ngoError;

        let processedNgos = (ngoData || []).map(ngo => {
          let dist = 0;
          if (currentLoc && ngo.latitude && ngo.longitude) {
            dist = calculateDistance(currentLoc.lat, currentLoc.lng, ngo.latitude, ngo.longitude);
          }
          return { ...ngo, distance: dist };
        });

        // Filter by 25km
        processedNgos = processedNgos.filter(n => n.distance <= 25);

        setNgos(processedNgos.sort((a, b) => (a.distance || 999) - (b.distance || 999)));

      } catch (err) {
        console.error('Error fetching nearby NGOs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-brand-text dark:text-white tracking-tight">Nearby Partners</h2>
          <p className="text-brand-muted dark:text-gray-400 mt-1">Discover verified NGOs within 25km of your location.</p>
        </div>
        <div className="flex bg-white dark:bg-brand-surface-dark p-1 rounded-xl border border-gray-200 dark:border-gray-800">
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-deep font-bold text-xs uppercase tracking-widest">Map View</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* NGO List Sidebar */}
        <div className="lg:col-span-4 space-y-4 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="font-bold text-brand-muted">Finding local partners...</p>
            </div>
          ) : ngos.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-brand-surface-dark rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 h-full flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-4">map</span>
              <p className="font-bold text-brand-muted">No NGOs found within 25km.</p>
              <p className="text-xs text-slate-400 mt-2">Try updating your location in settings.</p>
            </div>
          ) : (
            ngos.map((ngo) => (
              <div
                key={ngo.id}
                onClick={() => onSelectNGO?.(ngo.id)}
                className="p-5 bg-white dark:bg-brand-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-primary transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xl uppercase">
                    {(ngo.organization_name || ngo.full_name || 'N')[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{ngo.organization_name || ngo.full_name}</h3>
                    <p className="text-[10px] text-brand-muted uppercase tracking-widest mt-0.5 truncate">{ngo.location || 'Location N/A'}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded-md">
                        <span className="material-symbols-outlined text-xs">location_on</span>
                        {ngo.distance.toFixed(1)} km away
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Interactive Map */}
        <div className="lg:col-span-8 h-[600px] bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] overflow-hidden relative shadow-inner border border-gray-100 dark:border-gray-800">
          <MapContainer
            center={[userLocation?.lat || 17.3850, userLocation?.lng || 78.4867]}
            zoom={12}
            style={{ height: '100%', width: '100%', zIndex: 1 }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup><span className="font-bold">Your Location</span></Popup>
              </Marker>
            )}

            {ngos.map(ngo => (
              ngo.latitude && ngo.longitude && (
                <Marker key={ngo.id} position={[ngo.latitude, ngo.longitude]}>
                  <Popup>
                    <div className="p-1">
                      <h4 className="font-bold text-sm mb-1">{ngo.organization_name || ngo.full_name}</h4>
                      <p className="text-[10px] text-slate-500 mb-2">{ngo.location}</p>
                      <button
                        onClick={() => onSelectNGO?.(ngo.id)}
                        className="w-full py-1.5 bg-primary text-primary-deep text-[10px] font-black uppercase rounded-lg"
                      >
                        View Profile
                      </button>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}

            {userLocation && <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />}
          </MapContainer>

          {/* Map Overlay Controls */}
          <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
            <div className="bg-white/90 dark:bg-brand-surface-dark/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-xl border border-white/50 dark:border-gray-800 flex items-center gap-2">
              <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-text dark:text-white">Active Scan: 25km Radius</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorNearby;
