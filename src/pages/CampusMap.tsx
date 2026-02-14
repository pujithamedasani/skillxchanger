import { useEffect, useMemo, useRef } from "react";
import Layout from "@/components/Layout";
import { useProfile, useAllProfiles } from "@/hooks/useProfile";
import { useConnections } from "@/hooks/useConnections";
import { SRM_AP_CENTER, CAMPUS_LOCATIONS } from "@/lib/campusLocations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function CampusMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  const { data: profile } = useProfile();
  const { data: allProfiles } = useAllProfiles();
  const { data: connections } = useConnections();

  // Get connected profiles
  const connectedProfiles = useMemo(() => {
    if (!profile || !connections || !allProfiles) return [];

    const acceptedConns = connections.filter((c) => c.status === "accepted");

    const connectedIds = new Set<string>();
    acceptedConns.forEach((c) => {
      if (c.requester_id === profile.id) connectedIds.add(c.receiver_id);
      else connectedIds.add(c.requester_id);
    });

    return allProfiles.filter(
      (p) => connectedIds.has(p.id) && p.campus_location
    );
  }, [profile, connections, allProfiles]);

  // 🔥 Create map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current);

    // Tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Add campus markers
    CAMPUS_LOCATIONS.forEach((loc) => {
      L.marker([loc.lat, loc.lng])
        .addTo(map)
        .bindPopup(`<b>${loc.name}</b><br/>SRM AP Campus`);
    });

    // ⭐ Force map to center correctly AFTER render
    setTimeout(() => {
      map.setView([SRM_AP_CENTER.lat, SRM_AP_CENTER.lng], 17);
      map.invalidateSize();
    }, 200);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // 🔵 Add connected user markers
  useEffect(() => {
    if (!mapInstance.current) return;

    const connectedIcon = L.divIcon({
      className: "custom-marker",
      html: `
        <div style="
          background:#2563eb;
          color:white;
          border-radius:50%;
          width:32px;
          height:32px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:14px;
          font-weight:bold;
          border:2px solid white;
          box-shadow:0 2px 4px rgba(0,0,0,.3)
        ">👤</div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    connectedProfiles.forEach((p) => {
      const loc = CAMPUS_LOCATIONS.find(
        (l) => l.name === p.campus_location
      );
      if (!loc) return;

      L.marker([loc.lat, loc.lng], { icon: connectedIcon })
        .addTo(mapInstance.current!)
        .bindPopup(
          `<b>${p.full_name}</b><br/>${p.department || ""}<br/>${p.campus_location}`
        );
    });
  }, [connectedProfiles]);

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">SRM AP Campus Map</h1>
        <p className="text-sm text-muted-foreground">
          See your connected students on the campus map. Only accepted
          connections are shown for privacy.
        </p>

        <Card>
          <CardContent className="p-0">
            <div ref={mapRef} className="h-[600px] w-full rounded-lg" />
          </CardContent>
        </Card>

        {connectedProfiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Connected Students on Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {connectedProfiles.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-lg border p-3"
                  >
                    <span className="text-lg">👤</span>
                    <div>
                      <p className="text-sm font-medium">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.campus_location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
