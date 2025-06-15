
import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Node, Edge } from "@/pages/Index";

interface NetworkVisualizationProps {
  nodes: Node[];
  edges: Edge[];
}

const NetworkVisualization = ({ nodes, edges }: NetworkVisualizationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (nodes.length === 0) {
      // Draw placeholder text
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Add nodes to see network visualization', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Calculate bounds for scaling
    const xCoords = nodes.map(n => n.x);
    const yCoords = nodes.map(n => n.y);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);

    // Add padding and scale to canvas
    const padding = 50;
    const scaleX = (canvas.width - 2 * padding) / (maxX - minX || 1);
    const scaleY = (canvas.height - 2 * padding) / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY);

    const transformX = (x: number) => padding + (x - minX) * scale;
    const transformY = (y: number) => padding + (y - minY) * scale;

    // Draw edges first (so they appear behind nodes)
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.name === edge.from);
      const toNode = nodes.find(n => n.name === edge.to);
      
      if (fromNode && toNode) {
        const x1 = transformX(fromNode.x);
        const y1 = transformY(fromNode.y);
        const x2 = transformX(toNode.x);
        const y2 = transformY(toNode.y);

        // Draw arrow line
        ctx.strokeStyle = '#6B7280';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;

        ctx.fillStyle = '#6B7280';
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - arrowLength * Math.cos(angle - arrowAngle),
          y2 - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.lineTo(
          x2 - arrowLength * Math.cos(angle + arrowAngle),
          y2 - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.closePath();
        ctx.fill();

        // Draw edge label (cost)
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        ctx.fillStyle = '#374151';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`₹${edge.cost}`, midX, midY - 5);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const x = transformX(node.x);
      const y = transformY(node.y);
      const radius = 20;

      // Node color based on type
      let nodeColor = '#3B82F6'; // blue for source
      if (node.type === 'intermediate') nodeColor = '#F59E0B'; // amber
      if (node.type === 'customer') nodeColor = '#10B981'; // emerald

      // Draw node circle
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw node border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw node label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, x, y + 4);

      // Draw node type below
      ctx.fillStyle = '#374151';
      ctx.font = '10px Arial';
      ctx.fillText(node.type, x, y + radius + 15);
    });
  }, [nodes, edges]);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex justify-center gap-6 text-sm">
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

      {/* Canvas */}
      <div className="border rounded-lg bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-96 rounded-lg"
          style={{ minHeight: '400px' }}
        />
      </div>

      {/* Network Statistics */}
      {nodes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{nodes.filter(n => n.type === 'source').length}</div>
            <div className="text-sm text-blue-800">Sources</div>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">{nodes.filter(n => n.type === 'intermediate').length}</div>
            <div className="text-sm text-amber-800">Intermediates</div>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-emerald-600">{nodes.filter(n => n.type === 'customer').length}</div>
            <div className="text-sm text-emerald-800">Customers</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{edges.length}</div>
            <div className="text-sm text-gray-800">Connections</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkVisualization;
