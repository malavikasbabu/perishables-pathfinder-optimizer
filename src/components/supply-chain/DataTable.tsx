
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download, AlertCircle } from "lucide-react";
import { Node, Edge } from "@/pages/Index";

interface DataTableProps {
  nodes: Node[];
  edges: Edge[];
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onClearData: () => void;
}

const DataTable = ({ nodes, edges, onDeleteNode, onDeleteEdge, onClearData }: DataTableProps) => {
  const getNodeTypeVariant = (type: string) => {
    switch (type) {
      case 'source': return 'default';
      case 'intermediate': return 'secondary';
      case 'customer': return 'outline';
      default: return 'default';
    }
  };

  const handleExportData = () => {
    const data = {
      nodes,
      edges,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supply-chain-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Summary and Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 text-sm text-gray-600">
          <span>Nodes: <strong>{nodes.length}</strong></span>
          <span>Connections: <strong>{edges.length}</strong></span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportData} disabled={nodes.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button variant="destructive" size="sm" onClick={onClearData} disabled={nodes.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Nodes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Network Nodes ({nodes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {nodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No nodes added yet. Start by adding nodes to your network.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Max Perishability</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nodes.map((node) => (
                  <TableRow key={node.id}>
                    <TableCell className="font-medium">{node.name}</TableCell>
                    <TableCell>
                      <Badge variant={getNodeTypeVariant(node.type)}>
                        {node.type}
                      </Badge>
                    </TableCell>
                    <TableCell>({node.x}, {node.y})</TableCell>
                    <TableCell>{node.capacity || 'N/A'}</TableCell>
                    <TableCell>{node.perishabilityHours ? `${node.perishabilityHours}h` : 'N/A'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteNode(node.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edges Table */}
      <Card>
        <CardHeader>
          <CardTitle>Network Connections ({edges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {edges.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No connections added yet. Add edges to connect your nodes.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Distance (km)</TableHead>
                  <TableHead>Travel Time (hr)</TableHead>
                  <TableHead>Cost (₹)</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {edges.map((edge) => (
                  <TableRow key={edge.id}>
                    <TableCell className="font-medium">{edge.from}</TableCell>
                    <TableCell className="font-medium">{edge.to}</TableCell>
                    <TableCell>{edge.distanceKm}</TableCell>
                    <TableCell>{edge.travelTimeHr}</TableCell>
                    <TableCell>₹{edge.cost.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteEdge(edge.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataTable;
