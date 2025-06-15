
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Node, Edge } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileUpload: (nodes: Node[], edges: Edge[]) => void;
}

const FileUpload = ({ onFileUpload }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row: any = {};
      headers.forEach((header, index) => {
        const value = values[index]?.trim() || '';
        row[header] = value;
      });
      data.push(row);
    }
    
    return data;
  };

  const validateNodesData = (data: any[]): Node[] => {
    const nodes: Node[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Check required fields
      if (!row.name || !row.type || row.x === undefined || row.y === undefined) {
        throw new Error(`Row ${i + 2}: Missing required fields (name, type, x, y)`);
      }
      
      // Validate type
      if (!['source', 'intermediate', 'customer'].includes(row.type)) {
        throw new Error(`Row ${i + 2}: Invalid type '${row.type}'. Must be 'source', 'intermediate', or 'customer'`);
      }
      
      // Validate coordinates
      const x = parseFloat(row.x);
      const y = parseFloat(row.y);
      if (isNaN(x) || isNaN(y)) {
        throw new Error(`Row ${i + 2}: Invalid coordinates`);
      }
      
      const node: Node = {
        id: `node-${Date.now()}-${i}`,
        name: row.name,
        type: row.type as 'source' | 'intermediate' | 'customer',
        x,
        y,
        capacity: row.capacity ? parseInt(row.capacity) : undefined,
        perishabilityHours: row.perishability_hours || row.perishabilityhours ? 
          parseFloat(row.perishability_hours || row.perishabilityhours) : undefined
      };
      
      nodes.push(node);
    }
    
    return nodes;
  };

  const validateEdgesData = (data: any[], nodeNames: string[]): Edge[] => {
    const edges: Edge[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Check required fields
      if (!row.from || !row.to || row.distance_km === undefined || 
          row.travel_time_hr === undefined || row.cost === undefined) {
        throw new Error(`Row ${i + 2}: Missing required fields (from, to, distance_km, travel_time_hr, cost)`);
      }
      
      // Validate node names exist
      if (!nodeNames.includes(row.from)) {
        throw new Error(`Row ${i + 2}: From node '${row.from}' not found in nodes data`);
      }
      if (!nodeNames.includes(row.to)) {
        throw new Error(`Row ${i + 2}: To node '${row.to}' not found in nodes data`);
      }
      
      // Validate numeric values
      const distanceKm = parseFloat(row.distance_km || row.distancekm);
      const travelTimeHr = parseFloat(row.travel_time_hr || row.traveltimehr);
      const cost = parseFloat(row.cost);
      
      if (isNaN(distanceKm) || distanceKm <= 0) {
        throw new Error(`Row ${i + 2}: Invalid distance`);
      }
      if (isNaN(travelTimeHr) || travelTimeHr <= 0) {
        throw new Error(`Row ${i + 2}: Invalid travel time`);
      }
      if (isNaN(cost) || cost <= 0) {
        throw new Error(`Row ${i + 2}: Invalid cost`);
      }
      
      const edge: Edge = {
        id: `edge-${Date.now()}-${i}`,
        from: row.from,
        to: row.to,
        distanceKm,
        travelTimeHr,
        cost
      };
      
      edges.push(edge);
    }
    
    return edges;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    
    try {
      let nodesData: any[] = [];
      let edgesData: any[] = [];
      
      for (const file of files) {
        const text = await file.text();
        const data = parseCSV(text);
        
        if (file.name.toLowerCase().includes('node')) {
          nodesData = data;
        } else if (file.name.toLowerCase().includes('edge')) {
          edgesData = data;
        }
      }
      
      if (nodesData.length === 0) {
        throw new Error('No nodes data found. Please upload a file with "node" in its name.');
      }
      
      if (edgesData.length === 0) {
        throw new Error('No edges data found. Please upload a file with "edge" in its name.');
      }
      
      const nodes = validateNodesData(nodesData);
      const nodeNames = nodes.map(n => n.name);
      const edges = validateEdgesData(edgesData, nodeNames);
      
      onFileUpload(nodes, edges);
      
      toast({
        title: "Files uploaded successfully!",
        description: `Loaded ${nodes.length} nodes and ${edges.length} edges.`
      });
      
    } catch (error) {
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to process files",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Clear the input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* File Format Instructions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Nodes File Format
            </CardTitle>
            <CardDescription>CSV file containing node information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-3 rounded-md text-sm font-mono">
              <div className="font-semibold mb-2">Required columns:</div>
              <div>name, type, x, y</div>
              <div className="mt-2 font-semibold">Optional columns:</div>
              <div>capacity, perishability_hours</div>
              <div className="mt-2 font-semibold">Example:</div>
              <div className="text-xs mt-1">
                name,type,x,y,capacity,perishability_hours<br/>
                Factory1,source,0,0,10000,<br/>
                ColdStorage,intermediate,10,5,5000,6<br/>
                Retail1,customer,18,7,,12
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Edges File Format
            </CardTitle>
            <CardDescription>CSV file containing connection information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-3 rounded-md text-sm font-mono">
              <div className="font-semibold mb-2">Required columns:</div>
              <div>from, to, distance_km, travel_time_hr, cost</div>
              <div className="mt-2 font-semibold">Example:</div>
              <div className="text-xs mt-1">
                from,to,distance_km,travel_time_hr,cost<br/>
                Factory1,ColdStorage,12,1.5,500<br/>
                ColdStorage,Retail1,15,2,600<br/>
                Factory1,Retail1,20,3,800
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Select both nodes and edges CSV files. Files should contain "node" and "edge" in their names.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select CSV Files</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>Upload both nodes and edges files simultaneously</span>
            </div>
            
            {uploading && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Processing files...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUpload;
