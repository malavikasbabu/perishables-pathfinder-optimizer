import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Node, Edge } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onFileUpload: (nodes: Node[], edges: Edge[]) => void;
}

const FileUpload = ({ onFileUpload }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const parseFile = async (file: File): Promise<any[]> => {
    console.log(`Processing file: ${file.name}, type: ${file.type}`);
    
    if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
      // Handle Excel files
      console.log('Processing as Excel file');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) return [];
      
      const headers = (jsonData[0] as string[]).map(h => h?.toString().trim().toLowerCase() || '');
      console.log('Excel Headers found:', headers);
      
      const data = [];
      for (let i = 1; i < jsonData.length; i++) {
        const values = jsonData[i] as any[];
        const row: any = {};
        headers.forEach((header, index) => {
          const value = values[index]?.toString().trim() || '';
          row[header] = value;
        });
        console.log(`Excel Row ${i + 1} data:`, row);
        data.push(row);
      }
      
      return data;
    } else {
      // Handle CSV files
      console.log('Processing as CSV file');
      const text = await file.text();
      console.log(`CSV content preview:`, text.substring(0, 200));
      
      const lines = text.trim().split('\n');
      if (lines.length < 2) return [];
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      console.log('CSV Headers found:', headers);
      const data = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row: any = {};
        headers.forEach((header, index) => {
          const value = values[index]?.trim() || '';
          row[header] = value;
        });
        console.log(`CSV Row ${i + 1} data:`, row);
        data.push(row);
      }
      
      return data;
    }
  };

  const validateNodesData = (data: any[]): Node[] => {
    const nodes: Node[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      console.log(`Validating node row ${i + 2}:`, row);
      
      // Log which fields are missing
      const missingFields = [];
      if (!row.name) missingFields.push('name');
      if (!row.type) missingFields.push('type');
      if (row.x === undefined || row.x === '') missingFields.push('x');
      if (row.y === undefined || row.y === '') missingFields.push('y');
      
      if (missingFields.length > 0) {
        console.error(`Row ${i + 2} missing fields:`, missingFields);
        throw new Error(`Row ${i + 2}: Missing required fields (${missingFields.join(', ')})`);
      }
      
      // Validate type
      if (!['source', 'intermediate', 'customer'].includes(row.type)) {
        throw new Error(`Row ${i + 2}: Invalid type '${row.type}'. Must be 'source', 'intermediate', or 'customer'`);
      }
      
      // Validate coordinates
      const x = parseFloat(row.x);
      const y = parseFloat(row.y);
      if (isNaN(x) || isNaN(y)) {
        console.error(`Row ${i + 2} coordinate parsing:`, { x: row.x, y: row.y, parsedX: x, parsedY: y });
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
      
      console.log(`Successfully created node:`, node);
      nodes.push(node);
    }
    
    return nodes;
  };

  const validateEdgesData = (data: any[], nodeNames: string[]): Edge[] => {
    const edges: Edge[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      console.log(`Validating edge row ${i + 2}:`, row);
      
      // Log which fields are missing
      const missingFields = [];
      if (!row.from) missingFields.push('from');
      if (!row.to) missingFields.push('to');
      if (row.distance_km === undefined || row.distance_km === '') {
        if (row.distancekm === undefined || row.distancekm === '') {
          missingFields.push('distance_km');
        }
      }
      if (row.travel_time_hr === undefined || row.travel_time_hr === '') {
        if (row.traveltimehr === undefined || row.traveltimehr === '') {
          missingFields.push('travel_time_hr');
        }
      }
      if (row.cost === undefined || row.cost === '') missingFields.push('cost');
      
      if (missingFields.length > 0) {
        console.error(`Row ${i + 2} missing fields:`, missingFields);
        throw new Error(`Row ${i + 2}: Missing required fields (${missingFields.join(', ')})`);
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
        console.error(`Row ${i + 2} distance parsing:`, { distance_km: row.distance_km, distancekm: row.distancekm, parsed: distanceKm });
        throw new Error(`Row ${i + 2}: Invalid distance`);
      }
      if (isNaN(travelTimeHr) || travelTimeHr <= 0) {
        console.error(`Row ${i + 2} travel time parsing:`, { travel_time_hr: row.travel_time_hr, traveltimehr: row.traveltimehr, parsed: travelTimeHr });
        throw new Error(`Row ${i + 2}: Invalid travel time`);
      }
      if (isNaN(cost) || cost <= 0) {
        console.error(`Row ${i + 2} cost parsing:`, { cost: row.cost, parsed: cost });
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
      
      console.log(`Successfully created edge:`, edge);
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
      
      console.log('Processing files:', Array.from(files).map(f => f.name));
      
      for (const file of files) {
        const data = await parseFile(file);
        
        if (file.name.toLowerCase().includes('node')) {
          console.log('Identified as nodes file');
          nodesData = data;
        } else if (file.name.toLowerCase().includes('edge')) {
          console.log('Identified as edges file');
          edgesData = data;
        }
      }
      
      if (nodesData.length === 0) {
        throw new Error('No nodes data found. Please upload a file with "node" in its name.');
      }
      
      if (edgesData.length === 0) {
        throw new Error('No edges data found. Please upload a file with "edge" in its name.');
      }
      
      console.log('Starting validation...');
      const nodes = validateNodesData(nodesData);
      const nodeNames = nodes.map(n => n.name);
      const edges = validateEdgesData(edgesData, nodeNames);
      
      onFileUpload(nodes, edges);
      
      toast({
        title: "Files uploaded successfully!",
        description: `Loaded ${nodes.length} nodes and ${edges.length} edges.`
      });
      
    } catch (error) {
      console.error('Upload error:', error);
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
            <CardDescription>CSV or Excel file containing node information</CardDescription>
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
            <CardDescription>CSV or Excel file containing connection information</CardDescription>
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

      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Select both nodes and edges CSV or Excel files. Files should contain "node" and "edge" in their names.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select CSV or Excel Files</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>Upload both nodes and edges files simultaneously (CSV or Excel format)</span>
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
