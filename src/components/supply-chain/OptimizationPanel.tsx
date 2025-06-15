
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Download, Play } from "lucide-react";
import { Node, Edge } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";

interface OptimizationPanelProps {
  nodes: Node[];
  edges: Edge[];
}

interface Route {
  id: string;
  from: string;
  to: string;
  path: string[];
  totalTime: number;
  totalCost: number;
  perishabilityOk: boolean;
  distance: number;
}

interface OptimizationResult {
  routes: Route[];
  totalCost: number;
  totalTime: number;
  facilitiesUsed: number;
  perishabilityViolations: number;
  objective: string;
}

const OptimizationPanel = ({ nodes, edges }: OptimizationPanelProps) => {
  const [objective, setObjective] = useState("cost");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const { toast } = useToast();

  // Simple pathfinding algorithm (Dijkstra's shortest path)
  const findShortestPaths = (sourceNodes: Node[], customerNodes: Node[], objective: string) => {
    const routes: Route[] = [];
    
    // Create adjacency list
    const graph: Record<string, Array<{to: string, cost: number, time: number, distance: number}>> = {};
    
    // Initialize graph
    nodes.forEach(node => {
      graph[node.name] = [];
    });
    
    // Add edges to graph
    edges.forEach(edge => {
      graph[edge.from]?.push({
        to: edge.to,
        cost: edge.cost,
        time: edge.travelTimeHr,
        distance: edge.distanceKm
      });
    });

    // For each source-customer pair, find the shortest path
    sourceNodes.forEach(source => {
      customerNodes.forEach(customer => {
        const path = findPath(graph, source.name, customer.name, objective);
        if (path) {
          routes.push(path);
        }
      });
    });

    return routes;
  };

  const findPath = (
    graph: Record<string, Array<{to: string, cost: number, time: number, distance: number}>>,
    start: string,
    end: string,
    objective: string
  ): Route | null => {
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const costs: Record<string, number> = {};
    const times: Record<string, number> = {};
    const totalDistances: Record<string, number> = {};
    const unvisited = new Set<string>();

    // Initialize
    Object.keys(graph).forEach(node => {
      distances[node] = Infinity;
      costs[node] = Infinity;
      times[node] = Infinity;
      totalDistances[node] = Infinity;
      previous[node] = null;
      unvisited.add(node);
    });

    distances[start] = 0;
    costs[start] = 0;
    times[start] = 0;
    totalDistances[start] = 0;

    while (unvisited.size > 0) {
      // Find unvisited node with smallest distance
      let current: string | null = null;
      let minDistance = Infinity;
      
      unvisited.forEach(node => {
        if (distances[node] < minDistance) {
          minDistance = distances[node];
          current = node;
        }
      });

      if (!current || current === end) break;
      if (distances[current] === Infinity) break;

      unvisited.delete(current);

      // Check neighbors
      graph[current]?.forEach(neighbor => {
        if (!unvisited.has(neighbor.to)) return;

        let weight = 0;
        switch (objective) {
          case 'cost':
            weight = neighbor.cost;
            break;
          case 'time':
            weight = neighbor.time;
            break;
          case 'balanced':
            weight = 0.5 * neighbor.cost + 0.5 * neighbor.time * 100; // Scale time to match cost magnitude
            break;
          default:
            weight = neighbor.cost;
        }

        const alt = distances[current] + weight;
        if (alt < distances[neighbor.to]) {
          distances[neighbor.to] = alt;
          costs[neighbor.to] = costs[current] + neighbor.cost;
          times[neighbor.to] = times[current] + neighbor.time;
          totalDistances[neighbor.to] = totalDistances[current] + neighbor.distance;
          previous[neighbor.to] = current;
        }
      });
    }

    // Reconstruct path
    if (distances[end] === Infinity) return null;

    const path: string[] = [];
    let current: string | null = end;
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }

    // Check perishability
    const customerNode = nodes.find(n => n.name === end);
    const perishabilityOk = !customerNode?.perishabilityHours || 
                           times[end] <= customerNode.perishabilityHours;

    return {
      id: `route-${start}-${end}`,
      from: start,
      to: end,
      path,
      totalTime: times[end],
      totalCost: costs[end],
      distance: totalDistances[end],
      perishabilityOk
    };
  };

  const handleOptimize = () => {
    if (nodes.length === 0 || edges.length === 0) {
      toast({
        title: "No Data",
        description: "Please add nodes and edges before optimizing.",
        variant: "destructive"
      });
      return;
    }

    const sourceNodes = nodes.filter(n => n.type === 'source');
    const customerNodes = nodes.filter(n => n.type === 'customer');

    if (sourceNodes.length === 0 || customerNodes.length === 0) {
      toast({
        title: "Invalid Network",
        description: "Network needs at least one source and one customer node.",
        variant: "destructive"
      });
      return;
    }

    setIsOptimizing(true);

    // Simulate optimization delay
    setTimeout(() => {
      const routes = findShortestPaths(sourceNodes, customerNodes, objective);
      
      const totalCost = routes.reduce((sum, route) => sum + route.totalCost, 0);
      const totalTime = Math.max(...routes.map(route => route.totalTime));
      const facilitiesUsed = new Set(routes.flatMap(route => route.path.slice(1, -1))).size;
      const perishabilityViolations = routes.filter(route => !route.perishabilityOk).length;

      const optimizationResult: OptimizationResult = {
        routes,
        totalCost,
        totalTime,
        facilitiesUsed,
        perishabilityViolations,
        objective
      };

      setResult(optimizationResult);
      setIsOptimizing(false);

      toast({
        title: "Optimization Complete",
        description: `Found ${routes.length} optimal routes with total cost of ₹${totalCost.toLocaleString('en-IN')}.`
      });
    }, 2000);
  };

  const handleExportResults = () => {
    if (!result) return;

    const exportData = {
      summary: {
        totalCost: result.totalCost,
        totalTime: result.totalTime,
        facilitiesUsed: result.facilitiesUsed,
        perishabilityViolations: result.perishabilityViolations,
        objective: result.objective
      },
      routes: result.routes,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimization-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Network Data</h3>
        <p className="text-gray-500">Add nodes and edges to start optimization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Optimization Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Settings</CardTitle>
          <CardDescription>Choose your optimization objective</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Optimization Objective</Label>
            <RadioGroup value={objective} onValueChange={setObjective}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cost" id="cost" />
                <Label htmlFor="cost">Minimize Total Cost</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="time" id="time" />
                <Label htmlFor="time">Minimize Total Time</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="balanced" id="balanced" />
                <Label htmlFor="balanced">Balanced (Cost + Time)</Label>
              </div>
            </RadioGroup>

            <Button 
              onClick={handleOptimize} 
              disabled={isOptimizing}
              className="w-full"
            >
              {isOptimizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Optimizing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Optimize Network
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Optimization Results</CardTitle>
                <CardDescription>Network performance summary</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportResults}>
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">₹{result.totalCost.toLocaleString('en-IN')}</div>
                  <div className="text-sm text-blue-800">Total Cost</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{result.totalTime.toFixed(1)}h</div>
                  <div className="text-sm text-green-800">Max Time</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">{result.facilitiesUsed}</div>
                  <div className="text-sm text-amber-800">Facilities Used</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{result.perishabilityViolations}</div>
                  <div className="text-sm text-red-800">Perishability Issues</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Routes Table */}
          <Card>
            <CardHeader>
              <CardTitle>Optimal Routes ({result.routes.length})</CardTitle>
              <CardDescription>Detailed routing recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Time (hr)</TableHead>
                    <TableHead>Cost (₹)</TableHead>
                    <TableHead>Distance (km)</TableHead>
                    <TableHead>Perishability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.routes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">{route.from}</TableCell>
                      <TableCell className="font-medium">{route.to}</TableCell>
                      <TableCell>{route.path.join(' → ')}</TableCell>
                      <TableCell>{route.totalTime.toFixed(2)}</TableCell>
                      <TableCell>₹{route.totalCost.toLocaleString('en-IN')}</TableCell>
                      <TableCell>{route.distance.toFixed(1)}</TableCell>
                      <TableCell>
                        <Badge variant={route.perishabilityOk ? "default" : "destructive"}>
                          {route.perishabilityOk ? "OK" : "Violation"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default OptimizationPanel;
