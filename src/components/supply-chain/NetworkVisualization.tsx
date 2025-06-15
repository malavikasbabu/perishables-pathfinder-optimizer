
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Node, Edge } from "@/pages/Index";

interface NetworkVisualizationProps {
  nodes: Node[];
  edges: Edge[];
}

const NetworkVisualization = ({ nodes, edges }: NetworkVisualizationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState([1]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (nodes.length === 0) {
      // Draw placeholder text
      ctx.fillStyle = '#6B7280';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add nodes to see network visualization', rect.width / 2, rect.height / 2);
      return;
    }

    // Simple grid layout for better positioning
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const rows = Math.ceil(nodes.length / cols);
    const cellWidth = (rect.width - 100) / cols;
    const cellHeight = (rect.height - 100) / rows;

    // Position nodes in a grid to avoid overlap
    const positionedNodes = nodes.map((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      return {
        ...node,
        displayX: 50 + col * cellWidth + cellWidth / 2,
        displayY: 50 + row * cellHeight + cellHeight / 2
      };
    });

    const currentScale = scale[0];

    // Draw edges first
    edges.forEach(edge => {
      const fromNode = positionedNodes.find(n => n.name === edge.from);
      const toNode = positionedNodes.find(n => n.name === edge.to);
      
      if (fromNode && toNode) {
        const x1 = fromNode.displayX;
        const y1 = fromNode.displayY;
        const x2 = toNode.displayX;
        const y2 = toNode.displayY;

        // Draw line
        ctx.strokeStyle = '#6B7280';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;

        // Adjust arrow position to node edge
        const nodeRadius = 30 * currentScale;
        const adjustedX2 = x2 - nodeRadius * Math.cos(angle);
        const adjustedY2 = y2 - nodeRadius * Math.sin(angle);

        ctx.fillStyle = '#6B7280';
        ctx.beginPath();
        ctx.moveTo(adjustedX2, adjustedY2);
        ctx.lineTo(
          adjustedX2 - arrowLength * Math.cos(angle - arrowAngle),
          adjustedY2 - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.lineTo(
          adjustedX2 - arrowLength * Math.cos(angle + arrowAngle),
          adjustedY2 - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.closePath();
        ctx.fill();

        // Draw cost label
        const midX = (x1 + adjustedX2) / 2;
        const midY = (y1 + adjustedY2) / 2;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(midX - 25, midY - 10, 50, 20);
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        ctx.strokeRect(midX - 25, midY - 10, 50, 20);
        
        ctx.fillStyle = '#1F2937';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`₹${edge.cost}`, midX, midY);
      }
    });

    // Draw nodes
    positionedNodes.forEach(node => {
      const x = node.displayX;
      const y = node.displayY;
      const radius = 30 * currentScale;

      // Node colors based on type
      let nodeColor = '#3B82F6'; // Source - blue
      if (node.type === 'intermediate') nodeColor = '#F59E0B'; // Intermediate - amber
      if (node.type === 'customer') nodeColor = '#10B981'; // Customer - emerald

      // Draw node circle
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw node border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw node name inside circle
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.max(10, 12 * currentScale)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Truncate long names
      let displayName = node.name;
      if (displayName.length > 8) {
        displayName = displayName.substring(0, 8) + '...';
      }
      ctx.fillText(displayName, x, y);

      // Draw node type label below
      ctx.fillStyle = '#1F2937';
      ctx.font = `${Math.max(10, 11 * currentScale)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const typeText = node.type.charAt(0).toUpperCase() + node.type.slice(1);
      ctx.fillText(typeText, x, y + radius + 5);

      // Draw capacity if available
      if (node.capacity) {
        ctx.font = `${Math.max(8, 9 * currentScale)}px Arial`;
        ctx.fillStyle = '#6B7280';
        ctx.fillText(`Cap: ${node.capacity}`, x, y + radius + 20);
      }
    });
  }, [nodes, edges, scale]);

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex justify-center gap-6 text-sm bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
          <span>Source</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-amber-500"></div>
          <span>Intermediate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
          <span>Customer</span>
        </div>
      </div>

      {/* Scale Slider */}
      {nodes.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Scale:</span>
            <div className="flex-1">
              <Slider
                value={scale}
                onValueChange={setScale}
                min={0.5}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>
            <span className="text-sm text-gray-600">{scale[0].toFixed(1)}x</span>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="border rounded-lg bg-white">
        <canvas
          ref={canvasRef}
          className="w-full block"
          style={{ height: '500px' }}
        />
      </div>

      {/* Statistics */}
      {nodes.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{nodes.filter(n => n.type === 'source').length}</div>
            <div className="text-sm text-blue-800">Sources</div>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-amber-600">{nodes.filter(n => n.type === 'intermediate').length}</div>
            <div className="text-sm text-amber-800">Intermediates</div>
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-emerald-600">{nodes.filter(n => n.type === 'customer').length}</div>
            <div className="text-sm text-emerald-800">Customers</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-600">{edges.length}</div>
            <div className="text-sm text-gray-800">Connections</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkVisualization;
