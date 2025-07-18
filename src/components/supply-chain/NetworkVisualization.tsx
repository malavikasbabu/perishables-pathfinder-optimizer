
import { useState } from "react";
import { NetworkVisualizationProps } from "./network/types";
import NetworkLegend from "./network/NetworkLegend";
import NetworkStatistics from "./network/NetworkStatistics";
import MapContainer from "./map/MapContainer";
import AddressInput from "./map/AddressInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, BarChart3 } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("map");

  const handleAddressSelect = (lat: number, lng: number, address: string) => {
    if (onAddNode) {
      const nodeName = prompt(`Enter name for node at: ${address}`);
      if (nodeName) {
        const nodeType = prompt('Enter node type (source/intermediate/customer):') as 'source' | 'intermediate' | 'customer';
        if (nodeType && ['source', 'intermediate', 'customer'].includes(nodeType)) {
          onAddNode({
            name: nodeName,
            type: nodeType,
            x: lng,
            y: lat,
            capacity: nodeType === 'source' ? 1000 : undefined,
            perishabilityHours: nodeType === 'customer' ? 24 : undefined
          });
        }
      }
    }
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Interactive Map
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          {/* Address Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Map className="h-5 w-5" />
                Location Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AddressInput
                onLocationSelect={handleAddressSelect}
                placeholder="Search for addresses, landmarks, or enter coordinates in Bengaluru..."
              />
              <div className="mt-2 text-xs text-gray-500">
                💡 You can search by address, landmark, or enter coordinates as "lat,lng" format
              </div>
            </CardContent>
          </Card>

          {/* Interactive Map */}
          <Card>
            <CardContent className="p-0">
              <div style={{ height: '600px' }}>
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
