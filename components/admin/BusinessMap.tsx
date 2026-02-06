'use client';

import { useEffect, useRef, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BusinessData, formatMoney } from '@/lib/business-analytics-data';

interface BusinessMapProps {
  data: BusinessData[];
}

// You'll need to set your Mapbox token
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example';

function blendColors(color1: string, color2: string, ratio: number): string {
  const hex = (c: string) => parseInt(c, 16);
  const r1 = hex(color1.substring(1, 3));
  const g1 = hex(color1.substring(3, 5));
  const b1 = hex(color1.substring(5, 7));
  const r2 = hex(color2.substring(1, 3));
  const g2 = hex(color2.substring(3, 5));
  const b2 = hex(color2.substring(5, 7));

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function BusinessMap({ data }: BusinessMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const geojsonData = useMemo(() => {
    const minMinutes = 5;
    const maxMinutes = 300;

    return {
      type: 'FeatureCollection' as const,
      features: data.map((business) => {
        const ratio = Math.max(0, Math.min(1, (business.weekly_minutes - minMinutes) / (maxMinutes - minMinutes)));
        const color = blendColors('#A78BFA', '#6EE7F9', ratio); // purple to aqua
        const radius = 3 + ratio * 5;

        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [business.lng, business.lat]
          },
          properties: {
            city: business.city,
            sector: business.sector,
            size: business.size,
            employees: business.employees,
            revenue: formatMoney(business.annual_revenue_mxn),
            weeklyMinutes: Math.round(business.weekly_minutes),
            color,
            radius
          }
        };
      })
    };
  }, [data]);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return; // Initialize map only once

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-102.5528, 23.6345], // Center of Mexico
      zoom: 4.5
    });

    map.current.on('load', () => {
      if (!map.current) return;

      map.current.addSource('businesses', {
        type: 'geojson',
        data: geojsonData
      });

      map.current.addLayer({
        id: 'businesses-layer',
        type: 'circle',
        source: 'businesses',
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.85,
          'circle-stroke-width': 0.8,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-opacity': 0.7
        }
      });

      // Add click handler for popups
      map.current.on('click', 'businesses-layer', (e) => {
        if (!e.features || !e.features[0] || !e.features[0].properties) return;

        const coordinates = (e.features[0].geometry as any).coordinates.slice();
        const props = e.features[0].properties;

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div style="padding: 8px; font-family: system-ui;">
              <div style="font-weight: bold; margin-bottom: 4px;">${props.city} · ${props.sector}</div>
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${props.size} · ${props.employees} emp.</div>
              <div style="font-size: 13px;">Facturación: ${props.revenue}</div>
              <div style="font-size: 13px;">Min/semana: ${props.weeklyMinutes}</div>
            </div>
          `)
          .addTo(map.current!);
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'businesses-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'businesses-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update data when it changes
  useEffect(() => {
    if (!map.current) return;

    const source = map.current.getSource('businesses') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(geojsonData);

      // Fit bounds to data
      if (geojsonData.features.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        geojsonData.features.forEach((feature) => {
          bounds.extend(feature.geometry.coordinates as [number, number]);
        });
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
      }
    }
  }, [geojsonData]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-[520px] rounded-xl overflow-hidden"
    />
  );
}
