import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Truck, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Route,
  Zap
} from 'lucide-react';
import { Node, Edge } from '@/pages/Index';
import { routingService, TRANSPORT_MODES, TransportMode } from '@/services/routing';

interface TransportOptimizerProps {
  nodes: Node[];
  edges: Edge[];
  onOptimizationApplied: (optimizedEdges: Edge[]) => void;
}

interface OptimizationResult {
  mode: 'cost' | 'time' | 'distance' | 'balanced';
  totalCost: number;
  totalTime: number;
  totalDistance: number;
  savings: {
    cost: number;
    time: number;
    distance: number;
  };
  recommendations: Array<{
    from: string;
    to: string;
    currentMode: TransportMode;
    recommendedMode: TransportMode;
    reason: string;
    savings: number;
  }>;
}

const TransportOptimizer: React.FC<TransportOptimizerProps> = ({
  nodes,
  edges,
  onOptimizationApplied
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [optimizationMode, setOptimizationMode] = useState<'cost' | 'time' | 'distance' | 'balanced'>('balanced');

  const calculateCurrentMetrics = () => {
    const totalCost = edges.reduce((sum, edge) => sum + edge.cost, 0);
    const totalTime = edges.reduce((sum, edge) => sum + edge.travelTimeHr, 0);
    const totalDistance = edges.reduce((sum, edge) => sum + edge.distanceKm, 0);

    return { totalCost, totalTime, totalDistance };
  };

  const optimizeTransportModes = async () => {
    if (edges.length === 0) return;

    setIsOptimizing(true);

    try {
      const recommendations: OptimizationResult['recommendations'] = [];
      let totalCostSavings = 0;
      let totalTimeSavings = 0;
      let totalDistanceSavings = 0;

      for (const edge of edges) {
        const fromNode = nodes.find(n => n.name === edge.from);
        const toNode = nodes.find(n => n.name === edge.to);

        if (!fromNode || !toNode) continue;

        // Test different transport modes for this route
        const routeOptions = await Promise.all(
          Object.keys(TRANSPORT_MODES).map(async (mode) => {
            try {
              const result = await routingService.calculateRoute(
                { lat: fromNode.y, lng: fromNode.x },
                { lat: toNode.y, lng: toNode.x },
                mode as TransportMode
              );
              
              return {
                mode: mode as TransportMode,
                cost: result.cost,
                time: result.duration / 3600,
                distance: result.distance / 1000
              };
            } catch {
              return null;
            }
          })
        );

        const validOptions = routeOptions.filter(Boolean);
        if (validOptions.length === 0) continue;

        // Find optimal mode based on optimization criteria
        let bestOption = validOptions[0];
        let reason = '';

        switch (optimizationMode) {
          case 'cost':
            bestOption = validOptions.reduce((best, option) => 
              option!.cost < best!.cost ? option : best
            )!;
            reason = 'Lowest cost option';
            break;
          case 'time':
            bestOption = validOptions.reduce((best, option) => 
              option!.time < best!.time ? option : best
            )!;
            reason = 'Fastest delivery time';
            break;
          case 'distance':
            bestOption = validOptions.reduce((best, option) => 
              option!.distance < best!.distance ? option : best
            )!;
            reason = 'Shortest distance';
            break;
          case 'balanced':
            // Weighted score: 40% cost, 30% time, 30% distance
            bestOption = validOptions.reduce((best, option) => {
              const maxCost = Math.max(...validOptions.map(o => o!.cost));
              const maxTime = Math.max(...validOptions.map(o => o!.time));
              const maxDistance = Math.max(...validOptions.map(o => o!.distance));
              
              const optionScore = (option!.cost / maxCost) * 0.4 + 
                                (option!.time / maxTime) * 0.3 + 
                                (option!.distance / maxDistance) * 0.3;
              
              const bestScore = (best!.cost / maxCost) * 0.4 + 
                              (best!.time / maxTime) * 0.3 + 
                              (best!.distance / maxDistance) * 0.3;
              
              return optionScore < bestScore ? option : best;
            })!;
            reason = 'Best balanced option';
            break;
        }

        // Calculate savings if different from current
        const currentMode = edge.transportMode || 'driving-hgv';
        if (bestOption.mode !== currentMode) {
          const costSaving = edge.cost - bestOption.cost;
          const timeSaving = edge.travelTimeHr - bestOption.time;
          const distanceSaving = edge.distanceKm - bestOption.distance;

          if (costSaving > 0 || timeSaving > 0 || distanceSaving > 0) {
            recommendations.push({
              from: edge.from,
              to: edge.to,
              currentMode,
              recommendedMode: bestOption.mode,
              reason,
              savings: optimizationMode === 'cost' ? costSaving : 
                      optimizationMode === 'time' ? timeSaving : 
                      optimizationMode === 'distance' ? distanceSaving : 
                      (costSaving + timeSaving * 50 + distanceSaving * 10) // Balanced score
            });

            totalCostSavings += costSaving;
            totalTimeSavings += timeSaving;
            totalDistanceSavings += distanceSaving;
          }
        }
      }

      const current = calculateCurrentMetrics();
      
      setOptimization({
        mode: optimizationMode,
        totalCost: current.totalCost - totalCostSavings,
        totalTime: current.totalTime - totalTimeSavings,
        totalDistance: current.totalDistance - totalDistanceSavings,
        savings: {
          cost: totalCostSavings,
          time: totalTimeSavings,
          distance: totalDistanceSavings
        },
        recommendations
      });

    } catch (error) {
      console.error('Optimization error:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const applyOptimization = async () => {
    if (!optimization) return;

    const optimizedEdges = [...edges];

    // Apply recommendations
    for (const rec of optimization.recommendations) {
      const edgeIndex = optimizedEdges.findIndex(e => e.from === rec.from && e.to === rec.to);
      if (edgeIndex !== -1) {
        const edge = optimizedEdges[edgeIndex];
        const fromNode = nodes.find(n => n.name === edge.from);
        const toNode = nodes.find(n => n.name === edge.to);

        if (fromNode && toNode) {
          try {
            const newRoute = await routingService.calculateRoute(
              { lat: fromNode.y, lng: fromNode.x },
              { lat: toNode.y, lng: toNode.x },
              rec.recommendedMode
            );

            optimizedEdges[edgeIndex] = {
              ...edge,
              transportMode: rec.recommendedMode,
              cost: newRoute.cost,
              travelTimeHr: Number((newRoute.duration / 3600).toFixed(2)),
              distanceKm: Number((newRoute.distance / 1000).toFixed(2)),
              routeGeometry: newRoute.geometry,
              instructions: newRoute.segments.flatMap(s => s.instructions)
            };
          } catch (error) {
            console.error('Error applying optimization for route:', rec.from, '->', rec.to);
          }
        }
      }
    }

    onOptimizationApplied(optimizedEdges);
    setOptimization(null);
  };

  const current = calculateCurrentMetrics();

  return (
    <div className="space-y-6">
      {/* Current Network Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Current Network Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ₹{current.totalCost.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {current.totalTime.toFixed(1)}h
              </div>
              <div className="text-sm text-gray-500">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {current.totalDistance.toFixed(1)}km
              </div>
              <div className="text-sm text-gray-500">Total Distance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Transport Mode Optimization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={optimizationMode} onValueChange={(value: any) => setOptimizationMode(value)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="cost">Minimize Cost</TabsTrigger>
              <TabsTrigger value="time">Minimize Time</TabsTrigger>
              <TabsTrigger value="distance">Minimize Distance</TabsTrigger>
              <TabsTrigger value="balanced">Balanced</TabsTrigger>
            </TabsList>

            <TabsContent value="cost">
              <Alert>
                <DollarSign className="h-4 w-4" />
                <AlertDescription>
                  Find the most cost-effective transport modes for each route.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="time">
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Optimize for fastest delivery times across the network.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="distance">
              <Alert>
                <Route className="h-4 w-4" />
                <AlertDescription>
                  Minimize total distance traveled for environmental efficiency.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="balanced">
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Balance cost, time, and distance for optimal overall performance.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          <Button 
            onClick={optimizeTransportModes} 
            disabled={isOptimizing || edges.length === 0}
            className="w-full"
          >
            {isOptimizing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing Routes...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Optimize Transport Modes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Optimization Results */}
      {optimization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Optimization Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Savings Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  ₹{optimization.savings.cost.toFixed(0)}
                </div>
                <div className="text-sm text-gray-500">Cost Savings</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {optimization.savings.time.toFixed(1)}h
                </div>
                <div className="text-sm text-gray-500">Time Savings</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-xl font-bold text-orange-600">
                  {optimization.savings.distance.toFixed(1)}km
                </div>
                <div className="text-sm text-gray-500">Distance Savings</div>
              </div>
            </div>

            {/* Recommendations */}
            {optimization.recommendations.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium">Recommended Changes:</h4>
                {optimization.recommendations.map((rec, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{rec.from} → {rec.to}</span>
                      <Badge variant="secondary">
                        {rec.savings > 0 ? '+' : ''}₹{rec.savings.toFixed(0)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        From: {TRANSPORT_MODES[rec.currentMode].icon} {TRANSPORT_MODES[rec.currentMode].name}
                      </span>
                      <span>→</span>
                      <span>
                        To: {TRANSPORT_MODES[rec.recommendedMode].icon} {TRANSPORT_MODES[rec.recommendedMode].name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{rec.reason}</div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <TrendingDown className="h-4 w-4" />
                <AlertDescription>
                  Your current transport mode selection is already optimal for the chosen criteria.
                </AlertDescription>
              </Alert>
            )}

            {optimization.recommendations.length > 0 && (
              <Button onClick={applyOptimization} className="w-full">
                Apply Optimization
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TransportOptimizer;