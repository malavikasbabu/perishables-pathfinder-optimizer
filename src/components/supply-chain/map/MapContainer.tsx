
import React, { useState, useRef, useCallback } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { LatLngExpression, Map as LeafletMap, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Node, Edge } from '@/pages/Index';
import DraggableMarker from './DraggableMarker';
import RouteLayer from './RouteLayer';
import { Button } from '@/components/ui/button';
import { MapPin, Factory, Warehouse, Store, Truck } from 'lucide-react';

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

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (isAddingNode) {
      const nodeName = prompt(`Enter name for new ${newNodeType} node:`);
      if (nodeName) {
        onAddNode({
          name: nodeName,
          type: newNodeType,
          x: lng, // Longitude as X
          y: lat, // Latitude as Y
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
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-2 space-y-2">
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-medium">Add Node Type:</label>
          <select 
            value={newNodeType} 
            onChange={(e) => setNewNodeType(e.target.value as any)}
            className="text-xs border rounded px-1 py-0.5"
          >
            <option value="source">🏭 Source</option>
            <option value="intermediate">📦 Distribution</option>
            <option value="customer">🏪 Customer</option>
          </select>
        </div>
        <Button
          size="sm"
          variant={isAddingNode ? "destructive" : "default"}
          onClick={() => setIsAddingNode(!isAddingNode)}
          className="w-full text-xs"
        >
          <MapPin className="h-3 w-3 mr-1" />
          {isAddingNode ? 'Cancel' : 'Add Node'}
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3">
        <h3 className="text-sm font-semibold mb-2">Legend</h3>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>Sources (Manufacturing)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500"></div>
            <span>Distribution Centers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
            <span>Customers (Retail)</span>
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

      {/* Instructions */}
      {isAddingNode && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm">Click on the map to add a {newNodeType} node</p>
        </div>
      )}
    </div>
  );
};

export default MapContainer;
