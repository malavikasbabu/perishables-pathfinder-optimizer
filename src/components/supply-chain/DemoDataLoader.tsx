
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Truck, Database } from 'lucide-react';
import { bengaluruDemoLocations, bengaluruDemoRoutes } from '@/data/bengaluruLocations';
import { Node, Edge } from '@/pages/Index';

interface DemoDataLoaderProps {
  onLoadDemo: (nodes: Node[], edges: Edge[]) => void;
}

const DemoDataLoader: React.FC<DemoDataLoaderProps> = ({ onLoadDemo }) => {
  const handleLoadDemo = () => {
    // Convert demo data to Node format
    const nodes: Node[] = [
      ...bengaluruDemoLocations.sources.map((loc, index) => ({
        id: `source-${index}`,
        name: loc.name,
        type: loc.type,
        x: loc.lng,
        y: loc.lat,
        capacity: loc.capacity
      })),
      ...bengaluruDemoLocations.intermediate.map((loc, index) => ({
        id: `intermediate-${index}`,
        name: loc.name,
        type: loc.type,
        x: loc.lng,
        y: loc.lat,
        capacity: loc.capacity
      })),
      ...bengaluruDemoLocations.customers.map((loc, index) => ({
        id: `customer-${index}`,
        name: loc.name,
        type: loc.type,
        x: loc.lng,
        y: loc.lat,
        perishabilityHours: loc.perishabilityHours
      }))
    ];

    // Convert demo routes to Edge format
    const edges: Edge[] = bengaluruDemoRoutes.map((route, index) => ({
      id: `route-${index}`,
      from: route.from,
      to: route.to,
      distanceKm: route.distanceKm,
      travelTimeHr: route.travelTimeHr,
      cost: route.cost
    }));

    onLoadDemo(nodes, edges);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Bengaluru Demo Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          Load sample supply chain network for Bengaluru with real locations including:
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-2">
            <div className="font-medium text-blue-600 flex items-center gap-1">
              🏭 Sources ({bengaluruDemoLocations.sources.length})
            </div>
            <ul className="space-y-1 text-gray-600">
              {bengaluruDemoLocations.sources.map((loc, index) => (
                <li key={index}>• {loc.name}</li>
              ))}
            </ul>
          </div>
          
          <div className="space-y-2">
            <div className="font-medium text-amber-600 flex items-center gap-1">
              📦 Distribution ({bengaluruDemoLocations.intermediate.length})
            </div>
            <ul className="space-y-1 text-gray-600">
              {bengaluruDemoLocations.intermediate.map((loc, index) => (
                <li key={index}>• {loc.name}</li>
              ))}
            </ul>
          </div>
          
          <div className="space-y-2">
            <div className="font-medium text-emerald-600 flex items-center gap-1">
              🏪 Customers ({bengaluruDemoLocations.customers.length})
            </div>
            <ul className="space-y-1 text-gray-600">
              {bengaluruDemoLocations.customers.map((loc, index) => (
                <li key={index}>• {loc.name}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <Truck className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {bengaluruDemoRoutes.length} optimized routes included
          </span>
        </div>

        <Button onClick={handleLoadDemo} className="w-full">
          <MapPin className="h-4 w-4 mr-2" />
          Load Bengaluru Demo Network
        </Button>
      </CardContent>
    </Card>
  );
};

export default DemoDataLoader;
