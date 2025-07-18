
import React, { useRef, useMemo, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Node } from '@/pages/Index';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, MapPin, Clock, Thermometer, Package } from 'lucide-react';

interface DraggableMarkerProps {
  node: Node;
  onDrag: (nodeId: string, lat: number, lng: number) => void;
  onDelete: () => void;
  icon: Icon;
}

const DraggableMarker: React.FC<DraggableMarkerProps> = ({
  node,
  onDrag,
  onDelete,
  icon
}) => {
  const markerRef = useRef<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          onDrag(node.id, lat, lng);
        }
      },
    }),
    [node.id, onDrag],
  );

  const getNodeTypeDisplay = (type: string) => {
    switch (type) {
      case 'source': return '🏭 Manufacturing';
      case 'intermediate': return '📦 Distribution Center';
      case 'customer': return '🏪 Customer/Retail';
      default: return type;
    }
  };

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[node.y, node.x]}
      ref={markerRef}
      icon={icon}
    >
      <Popup minWidth={250}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{node.name}</h3>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className="h-6 w-6 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={onDelete}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Node Details */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-gray-500" />
              <span className="font-medium">{getNodeTypeDisplay(node.type)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-500">📍</span>
              <span>{node.y.toFixed(4)}, {node.x.toFixed(4)}</span>
            </div>

            {node.capacity && (
              <div className="flex items-center gap-2">
                <Package className="h-3 w-3 text-gray-500" />
                <span>Capacity: {node.capacity.toLocaleString()} units</span>
              </div>
            )}

            {node.perishabilityHours && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-gray-500" />
                <span>Max time: {node.perishabilityHours}h</span>
              </div>
            )}
          </div>

          {/* Operating Status */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-gray-500">Status:</span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              ✓ Active
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button size="sm" variant="outline" className="flex-1 text-xs h-7">
              View Details
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs h-7">
              Connect Route
            </Button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default DraggableMarker;
