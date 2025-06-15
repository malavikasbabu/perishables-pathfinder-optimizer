
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Upload, Plus, Network, BarChart3 } from "lucide-react";
import NodeForm from "@/components/supply-chain/NodeForm";
import EdgeForm from "@/components/supply-chain/EdgeForm";
import DataTable from "@/components/supply-chain/DataTable";
import NetworkVisualization from "@/components/supply-chain/NetworkVisualization";
import OptimizationPanel from "@/components/supply-chain/OptimizationPanel";
import FileUpload from "@/components/supply-chain/FileUpload";
import { useToast } from "@/hooks/use-toast";

export interface Node {
  id: string;
  name: string;
  type: 'source' | 'intermediate' | 'customer';
  x: number;
  y: number;
  capacity?: number;
  perishabilityHours?: number;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  distanceKm: number;
  travelTimeHr: number;
  cost: number;
}

const Index = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [activeTab, setActiveTab] = useState("manual-entry");
  const { toast } = useToast();

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedNodes = localStorage.getItem('supply-chain-nodes');
    const savedEdges = localStorage.getItem('supply-chain-edges');
    
    if (savedNodes) {
      try {
        setNodes(JSON.parse(savedNodes));
      } catch (error) {
        console.error('Error loading nodes from localStorage:', error);
      }
    }
    
    if (savedEdges) {
      try {
        setEdges(JSON.parse(savedEdges));
      } catch (error) {
        console.error('Error loading edges from localStorage:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever nodes or edges change
  useEffect(() => {
    localStorage.setItem('supply-chain-nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('supply-chain-edges', JSON.stringify(edges));
  }, [edges]);

  const handleAddNode = (node: Omit<Node, 'id'>) => {
    const newNode: Node = {
      ...node,
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setNodes(prev => [...prev, newNode]);
    toast({
      title: "Node Added",
      description: `${node.name} has been added to the network.`,
    });
  };

  const handleAddEdge = (edge: Omit<Edge, 'id'>) => {
    const newEdge: Edge = {
      ...edge,
      id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setEdges(prev => [...prev, newEdge]);
    toast({
      title: "Edge Added",
      description: `Connection from ${edge.from} to ${edge.to} has been added.`,
    });
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    // Remove edges connected to this node
    setEdges(prev => prev.filter(edge => edge.from !== nodeId && edge.to !== nodeId));
    toast({
      title: "Node Deleted",
      description: "Node and its connections have been removed.",
    });
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges(prev => prev.filter(edge => edge.id !== edgeId));
    toast({
      title: "Edge Deleted",
      description: "Connection has been removed.",
    });
  };

  const handleClearData = () => {
    setNodes([]);
    setEdges([]);
    localStorage.removeItem('supply-chain-nodes');
    localStorage.removeItem('supply-chain-edges');
    toast({
      title: "Data Cleared",
      description: "All nodes and edges have been removed.",
    });
  };

  const handleFileUpload = (uploadedNodes: Node[], uploadedEdges: Edge[]) => {
    setNodes(uploadedNodes);
    setEdges(uploadedEdges);
    toast({
      title: "Data Imported",
      description: `Imported ${uploadedNodes.length} nodes and ${uploadedEdges.length} edges.`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Supply Chain Network Optimizer
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Design and optimize your perishable FMCG supply chain network for minimum cost, time, and maximum efficiency.
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white">
            <TabsTrigger value="manual-entry" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="file-upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              File Upload
            </TabsTrigger>
            <TabsTrigger value="visualization" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Network View
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Optimization
            </TabsTrigger>
          </TabsList>

          {/* Manual Entry Tab */}
          <TabsContent value="manual-entry" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Node Entry */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add Nodes
                  </CardTitle>
                  <CardDescription>
                    Add sources, intermediate facilities, and customer locations to your network.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <NodeForm onAddNode={handleAddNode} existingNodes={nodes} />
                </CardContent>
              </Card>

              {/* Edge Entry */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Add Connections
                  </CardTitle>
                  <CardDescription>
                    Define routes between nodes with distance, time, and cost parameters.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EdgeForm onAddEdge={handleAddEdge} nodes={nodes} />
                </CardContent>
              </Card>
            </div>

            {/* Data Tables */}
            <div className="space-y-6">
              <DataTable
                nodes={nodes}
                edges={edges}
                onDeleteNode={handleDeleteNode}
                onDeleteEdge={handleDeleteEdge}
                onClearData={handleClearData}
              />
            </div>
          </TabsContent>

          {/* File Upload Tab */}
          <TabsContent value="file-upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Network Data</CardTitle>
                <CardDescription>
                  Upload CSV or XLSX files containing your nodes and edges data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onFileUpload={handleFileUpload} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visualization Tab */}
          <TabsContent value="visualization">
            <Card>
              <CardHeader>
                <CardTitle>Network Visualization</CardTitle>
                <CardDescription>
                  Interactive view of your supply chain network with nodes and connections.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NetworkVisualization nodes={nodes} edges={edges} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimization">
            <Card>
              <CardHeader>
                <CardTitle>Network Optimization</CardTitle>
                <CardDescription>
                  Optimize your supply chain network for cost, time, or balanced objectives.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OptimizationPanel nodes={nodes} edges={edges} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
