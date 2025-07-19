import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Route, Clock, DollarSign, Navigation } from 'lucide-react';
import { Node, Edge } from '@/pages/Index';
import { routingService, TransportMode, TRANSPORT_MODES } from '@/services/routing';
import { useToast } from '@/hooks/use-toast';

interface RouteCalculatorProps {
  nodes: Node[];
  onRouteCalculated: (edge: Omit<Edge, 'id'>) => void;
}

const RouteCalculator: React.FC<RouteCalculatorProps> = ({ nodes, onRouteCalculated }) => {
  const [fromNode, setFromNode] = useState<string>('');
  const [toNode, setToNode] = useState<string>('');
  const [transportMode, setTransportMode] = useState<TransportMode>('driving-hgv');
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastCalculation, setLastCalculation] = useState<any>(null);
  const { toast } = useToast();

  const handleCalculateRoute = async () => {
    if (!fromNode || !toNode) {
      toast({
        title: "Selection Required",
        description: "Please select both start and end nodes.",
        variant: "destructive"
      });
      return;
    }

    if (fromNode === toNode) {
      toast({
        title: "Invalid Route",
        description: "Start and end nodes must be different.",
        variant: "destructive"
      });
      return;
    }

    const startNode = nodes.find(n => n.id === fromNode);
    const endNode = nodes.find(n => n.id === toNode);

    if (!startNode || !endNode) {
      toast({
        title: "Node Not Found",
        description: "Could not find selected nodes.",
        variant: "destructive"
      });
      return;
    }

    setIsCalculating(true);

    try {
      const routeResponse = await routingService.calculateRoute(
        { lat: startNode.y, lng: startNode.x },
        { lat: endNode.y, lng: endNode.x },
        transportMode
      );

      const newEdge: Omit<Edge, 'id'> = {
        from: startNode.name,
        to: endNode.name,
        distanceKm: Number((routeResponse.distance / 1000).toFixed(2)),
        travelTimeHr: Number((routeResponse.duration / 3600).toFixed(2)),
        cost: routeResponse.cost,
        transportMode,
        routeGeometry: routeResponse.geometry,
        instructions: routeResponse.segments.flatMap(s => s.instructions)
      };

      setLastCalculation({
        ...newEdge,
        modeConfig: TRANSPORT_MODES[transportMode]
      });

      toast({
        title: "Route Calculated",
        description: `${routeResponse.distance / 1000}km route calculated successfully.`,
      });
    } catch (error) {
      console.error('Route calculation error:', error);
      toast({
        title: "Calculation Failed",
        description: "Could not calculate route. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAddRoute = () => {
    if (lastCalculation) {
      onRouteCalculated(lastCalculation);
      setLastCalculation(null);
      setFromNode('');
      setToNode('');
      toast({
        title: "Route Added",
        description: "Route has been added to your network.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Real-World Route Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Node Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Node</label>
              <Select value={fromNode} onValueChange={setFromNode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select start node" />
                </SelectTrigger>
                <SelectContent>
                  {nodes.map(node => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.name} ({node.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">To Node</label>
              <Select value={toNode} onValueChange={setToNode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select end node" />
                </SelectTrigger>
                <SelectContent>
                  {nodes.map(node => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.name} ({node.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transport Mode Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Transport Mode</label>
            <Select value={transportMode} onValueChange={(value: TransportMode) => setTransportMode(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TRANSPORT_MODES).map(([mode, config]) => (
                  <SelectItem key={mode} value={mode}>
                    <div className="flex items-center gap-2">
                      <span>{config.icon}</span>
                      <span>{config.name}</span>
                      <Badge variant="secondary" className="ml-auto">
                        ₹{config.costPerKm}/km
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Calculate Button */}
          <Button 
            onClick={handleCalculateRoute} 
            disabled={!fromNode || !toNode || isCalculating}
            className="w-full"
          >
            {isCalculating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculating Route...
              </>
            ) : (
              <>
                <Route className="h-4 w-4 mr-2" />
                Calculate Real Route
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Route Results */}
      {lastCalculation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Route Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {lastCalculation.distanceKm}km
                </div>
                <div className="text-sm text-gray-500">Distance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {lastCalculation.travelTimeHr}h
                </div>
                <div className="text-sm text-gray-500">Travel Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  ₹{lastCalculation.cost.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total Cost</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">{lastCalculation.modeConfig.icon}</span>
                <span className="font-medium">{lastCalculation.modeConfig.name}</span>
              </div>
              <Badge style={{ backgroundColor: lastCalculation.modeConfig.color, color: 'white' }}>
                {lastCalculation.modeConfig.description}
              </Badge>
            </div>

            <Alert>
              <Navigation className="h-4 w-4" />
              <AlertDescription>
                This route uses real road networks and traffic patterns. 
                The route will be displayed on the map with turn-by-turn directions.
              </AlertDescription>
            </Alert>

            <Button onClick={handleAddRoute} className="w-full">
              Add Route to Network
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RouteCalculator;