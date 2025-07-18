
import React, { useState, useRef, useCallback } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { LatLngExpression, Map as LeafletMap, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Node, Edge } from '@/pages/Index';
import DraggableMarker from './DraggableMarker';
import RouteLayer from './RouteLayer';
import { Button } from '@/components/ui/button';
import { MapPin, Factory, Warehouse, Store, Truck, Target, Navigation } from 'lucide-react';
import { geocodingService } from '@/services/geocoding';

// Fix for default markers in React Leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapContainerProps {
  nodes: Node[];
  edges: Edge[];
  onAddNode: (node: Omit<Node, 'id'>) => void;
  onUpdateNode: (nodeId: string, updates: Partial<Node>) => void;
  onDeleteNode: (nodeId: string) => void;
}

// Bengaluru city bounds
const BENGALURU_CENTER: LatLngExpression = [12.9716, 77.5946];
const BENGALURU_BOUNDS: [[number, number], [number, number]] = [
  [12.7342, 77.4272], // Southwest
  [13.1394, 77.7814]  // Northeast
];

// Custom icons for different node types
const getNodeIcon = (type: string, color: string) => {
  const getIconSymbol = (nodeType: string) => {
    switch (nodeType) {
      case 'source': return 'F'; // Factory
      case 'intermediate': return 'D'; // Distribution
      case 'customer': return 'S'; // Store
      default: return 'N'; // Node
    }
  };

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">
        ${getIconSymbol(type)}
      </text>
    </svg>
  `;

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgString)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const getNodeColor = (type: string) => {
  switch (type) {
    case 'source': return '#3B82F6'; // Blue
    case 'intermediate': return '#F59E0B'; // Amber  
    case 'customer': return '#10B981'; // Emerald
    default: return '#6B7280'; // Gray
  }
};

// Component to handle map clicks
const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapContainer: React.FC<MapContainerProps> = ({
  nodes,
  edges,
  onAddNode,
  onUpdateNode,
  onDeleteNode
}) => {
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [newNodeType, setNewNodeType] = useState<'source' | 'intermediate' | 'customer'>('source');
  const mapRef = useRef<LeafletMap>(null);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    if (isAddingNode) {
      try {
        // Get address for the clicked location
        const reverseResult = await geocodingService.reverseGeocode(lat, lng);
        const address = reverseResult?.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        // Extract a meaningful name from the address
        const addressParts = address.split(',');
        const nodeName = addressParts[0].trim() || `${newNodeType} Node`;

        onAddNode({
          name: nodeName,
          type: newNodeType,
          x: lng, // Longitude as X
          y: lat, // Latitude as Y
          capacity: newNodeType === 'source' ? 1000 : undefined,
          perishabilityHours: newNodeType === 'customer' ? 24 : undefined
        });
      } catch (error) {
        console.error('Error getting address:', error);
        // Fallback to coordinates
        onAddNode({
          name: `${newNodeType} at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          type: newNodeType,
          x: lng,
          y: lat,
          capacity: newNodeType === 'source' ? 1000 : undefined,
          perishabilityHours: newNodeType === 'customer' ? 24 : undefined
        });
      }
      setIsAddingNode(false);
    }
  }, [isAddingNode, newNodeType, onAddNode]);

  const handleNodeDrag = useCallback((nodeId: string, lat: number, lng: number) => {
    onUpdateNode(nodeId, { x: lng, y: lat });
  }, [onUpdateNode]);

  return (
    <div className="relative h-full w-full">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3 space-y-3">
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Add Node Type:</label>
          <select 
            value={newNodeType} 
            onChange={(e) => setNewNodeType(e.target.value as any)}
            className="text-sm border rounded px-2 py-1 min-w-[140px]"
          >
            <option value="source">🏭 Manufacturing</option>
            <option value="intermediate">📦 Distribution</option>
            <option value="customer">🏪 Retail</option>
          </select>
        </div>
        
        <Button
          size="sm"
          variant={isAddingNode ? "destructive" : "default"}
          onClick={() => setIsAddingNode(!isAddingNode)}
          className="w-full text-sm"
        >
          <Target className="h-4 w-4 mr-2" />
          {isAddingNode ? 'Cancel Adding' : 'Click to Add Node'}
        </Button>
        
        {isAddingNode && (
          <div className="text-xs text-gray-600 border-t pt-2">
            <p className="font-medium">📍 Click anywhere on the map</p>
            <p>to add a {newNodeType} node</p>
          </div>
        )}
      </div>

      {/* Enhanced Legend */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-4 min-w-[200px]">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Navigation className="h-4 w-4" />
          Supply Chain Network
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">F</div>
            <span>Manufacturing Facilities</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">D</div>
            <span>Distribution Centers</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">S</div>
            <span>Retail Stores</span>
          </div>
          <hr className="my-2" />
          <div className="text-gray-600">
            <p>• Drag nodes to reposition</p>
            <p>• Click nodes for details</p>
            <p>• Routes show connections</p>
          </div>
        </div>
      </div>

      {/* Map */}
      <LeafletMapContainer
        center={BENGALURU_CENTER}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        maxBounds={BENGALURU_BOUNDS}
        maxBoundsViscosity={1.0}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Map click handler */}
        <MapClickHandler onMapClick={handleMapClick} />

        {/* Render routes first (so they appear under markers) */}
        <RouteLayer edges={edges} nodes={nodes} />

        {/* Render draggable markers for nodes */}
        {nodes.map((node) => (
          <DraggableMarker
            key={node.id}
            node={node}
            onDrag={handleNodeDrag}
            onDelete={() => onDeleteNode(node.id)}
            icon={getNodeIcon(node.type, getNodeColor(node.type))}
          />
        ))}
      </LeafletMapContainer>

      {/* Enhanced Instructions */}
      {isAddingNode && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg max-w-md text-center">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <Target className="h-5 w-5" />
            <p className="font-medium">Adding {newNodeType} node</p>
          </div>
          <p className="text-sm opacity-90">Click anywhere on the map to place your node</p>
        </div>
      )}
    </div>
  );
};

export default MapContainer;
