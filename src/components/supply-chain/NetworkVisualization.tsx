
import { useState } from "react";
import { NetworkVisualizationProps } from "./network/types";
import NetworkLegend from "./network/NetworkLegend";
import NetworkStatistics from "./network/NetworkStatistics";
import MapContainer from "./map/MapContainer";
import LocationPicker from "./map/LocationPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, BarChart3, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExtendedNetworkVisualizationProps extends NetworkVisualizationProps {
  onAddNode?: (node: Omit<import('@/pages/Index').Node, 'id'>) => void;
  onUpdateNode?: (nodeId: string, updates: Partial<import('@/pages/Index').Node>) => void;
  onDeleteNode?: (nodeId: string) => void;
}

const NetworkVisualization = ({ 
  nodes, 
  edges, 
  onAddNode, 
  onUpdateNode, 
  onDeleteNode 
}: ExtendedNetworkVisualizationProps) => {
  const [activeTab, setActiveTab] = useState("location-picker");
  const { toast } = useToast();

  const handleLocationSelect = (lat: number, lng: number, address: string, nodeType?: string) => {
    if (onAddNode) {
      const type = nodeType as 'source' | 'intermediate' | 'customer' || 'source';
      onAddNode({
        name: extractLocationName(address),
        type,
        x: lng,
        y: lat,
        capacity: type === 'source' ? 1000 : undefined,
        perishabilityHours: type === 'customer' ? 24 : undefined
      });
      
      toast({
        title: "Location Added",
        description: `Added ${type} node at ${address}`,
      });
    }
  };

  const handleQuickAdd = (locations: Array<{ lat: number; lng: number; address: string; type: string }>) => {
    if (onAddNode) {
      locations.forEach(location => {
        const type = location.type as 'source' | 'intermediate' | 'customer';
        onAddNode({
          name: extractLocationName(location.address),
          type,
          x: location.lng,
          y: location.lat,
          capacity: type === 'source' ? 1000 : undefined,
          perishabilityHours: type === 'customer' ? 24 : undefined
        });
      });
    }
  };

  const extractLocationName = (address: string): string => {
    // Extract meaningful name from address
    const parts = address.split(',');
    return parts[0].trim() || 'Unknown Location';
  };

  const handleUpdateNode = (nodeId: string, updates: Partial<import('@/pages/Index').Node>) => {
    if (onUpdateNode) {
      onUpdateNode(nodeId, updates);
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    if (onDeleteNode) {
      onDeleteNode(nodeId);
    }
  };

  return (
    <div className="space-y-6">
      <NetworkLegend />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="location-picker" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location Picker
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Interactive Map
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="location-picker" className="space-y-4">
          <LocationPicker
            onLocationSelect={handleLocationSelect}
            onQuickAdd={handleQuickAdd}
          />
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          {/* Interactive Map */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Map className="h-5 w-5" />
                Interactive Supply Chain Map
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div style={{ height: '700px' }}>
                <MapContainer
                  nodes={nodes}
                  edges={edges}
                  onAddNode={onAddNode || (() => {})}
                  onUpdateNode={handleUpdateNode}
                  onDeleteNode={handleDeleteNode}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          {nodes.length > 0 && (
            <NetworkStatistics nodes={nodes} edges={edges} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkVisualization;
