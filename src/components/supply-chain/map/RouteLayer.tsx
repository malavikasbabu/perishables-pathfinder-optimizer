
import React from 'react';
import { Polyline, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { Node, Edge } from '@/pages/Index';
import { Truck, Clock, DollarSign, Route } from 'lucide-react';

interface RouteLayerProps {
  edges: Edge[];
  nodes: Node[];
}

const RouteLayer: React.FC<RouteLayerProps> = ({ edges, nodes }) => {
  const getRouteColor = (cost: number) => {
    // Color code routes based on cost (green = cheap, red = expensive)
    if (cost < 500) return '#10B981'; // Green
    if (cost < 1000) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  const getRouteWeight = (distance: number) => {
    // Thicker lines for longer routes
    if (distance > 50) return 4;
    if (distance > 20) return 3;
    return 2;
  };

  return (
    <>
      {edges.map((edge) => {
        const fromNode = nodes.find(n => n.name === edge.from);
        const toNode = nodes.find(n => n.name === edge.to);
        
        if (!fromNode || !toNode) return null;

        const positions: LatLngExpression[] = [
          [fromNode.y, fromNode.x],
          [toNode.y, toNode.x]
        ];

        return (
          <Polyline
            key={edge.id}
            positions={positions}
            color={getRouteColor(edge.cost)}
            weight={getRouteWeight(edge.distanceKm)}
            opacity={0.8}
            dashArray={edge.cost > 1000 ? "10, 10" : undefined} // Dashed for expensive routes
          >
            <Popup>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  {edge.from} → {edge.to}
                </h4>
                
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Truck className="h-3 w-3 text-gray-500" />
                    <span>{edge.distanceKm} km</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span>{edge.travelTimeHr}h travel time</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-gray-500" />
                    <span>₹{edge.cost.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Cost per km:</span>
                    <span className="font-medium">₹{(edge.cost / edge.distanceKm).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Polyline>
        );
      })}
    </>
  );
};

export default RouteLayer;
