
import React from 'react';
import { Polyline, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { Node, Edge } from '@/pages/Index';
import { Truck, Clock, DollarSign, Route, Navigation } from 'lucide-react';
import { TRANSPORT_MODES } from '@/services/routing';

interface RouteLayerProps {
  edges: Edge[];
  nodes: Node[];
}

const RouteLayer: React.FC<RouteLayerProps> = ({ edges, nodes }) => {
  const getRouteColor = (edge: Edge) => {
    // Use transport mode color if available, otherwise cost-based
    if (edge.transportMode && TRANSPORT_MODES[edge.transportMode]) {
      return TRANSPORT_MODES[edge.transportMode].color;
    }
    
    // Fallback to cost-based coloring
    if (edge.cost < 500) return '#10B981'; // Green
    if (edge.cost < 1000) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  const getRouteWeight = (edge: Edge) => {
    // Transport mode affects line weight
    if (edge.transportMode === 'driving-hgv') return 5;
    if (edge.transportMode === 'driving-car') return 4;
    if (edge.transportMode === 'cycling') return 3;
    if (edge.transportMode === 'foot-walking') return 2;
    
    // Fallback to distance-based weight
    if (edge.distanceKm > 50) return 4;
    if (edge.distanceKm > 20) return 3;
    return 2;
  };

  return (
    <>
      {edges.map((edge) => {
        const fromNode = nodes.find(n => n.name === edge.from);
        const toNode = nodes.find(n => n.name === edge.to);
        
        if (!fromNode || !toNode) return null;

        // Use real route geometry if available, otherwise straight line
        const positions: LatLngExpression[] = edge.routeGeometry && edge.routeGeometry.length > 0
          ? edge.routeGeometry.map(point => [point.lat, point.lng])
          : [
              [fromNode.y, fromNode.x],
              [toNode.y, toNode.x]
            ];

        return (
          <Polyline
            key={edge.id}
            positions={positions}
            color={getRouteColor(edge)}
            weight={getRouteWeight(edge)}
            opacity={0.8}
            dashArray={edge.transportMode === 'cycling' || edge.transportMode === 'foot-walking' ? "5, 5" : undefined}
          >
            <Popup minWidth={280}>
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  {edge.from} → {edge.to}
                </h4>
                
                {/* Transport Mode Info */}
                {edge.transportMode && TRANSPORT_MODES[edge.transportMode] && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="text-lg">{TRANSPORT_MODES[edge.transportMode].icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-xs">{TRANSPORT_MODES[edge.transportMode].name}</div>
                      <div className="text-xs text-gray-500">{TRANSPORT_MODES[edge.transportMode].description}</div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-3 w-3 text-gray-500" />
                    <span>{edge.distanceKm} km {edge.routeGeometry ? '(real route)' : '(straight line)'}</span>
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

                {/* Turn-by-turn instructions */}
                {edge.instructions && edge.instructions.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="text-xs font-medium mb-1">Route Instructions:</div>
                    <div className="max-h-20 overflow-y-auto text-xs text-gray-600">
                      {edge.instructions.slice(0, 3).map((instruction, idx) => (
                        <div key={idx} className="truncate">• {instruction}</div>
                      ))}
                      {edge.instructions.length > 3 && (
                        <div className="text-gray-400">... and {edge.instructions.length - 3} more steps</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Polyline>
        );
      })}
    </>
  );
};

export default RouteLayer;
