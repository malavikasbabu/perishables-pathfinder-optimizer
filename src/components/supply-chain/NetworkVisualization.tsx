
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

    // Set canvas size with high DPI support
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (nodes.length === 0) {
      // Draw placeholder text
      ctx.fillStyle = '#6B7280';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add nodes to see network visualization', rect.width / 2, rect.height / 2);
      ctx.font = '14px Arial';
      ctx.fillStyle = '#9CA3AF';
      ctx.fillText('Use the Manual Entry tab to create your supply chain network', rect.width / 2, rect.height / 2 + 30);
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
    const padding = 100;
    const scaleX = (rect.width - 2 * padding) / (maxX - minX || 1);
    const scaleY = (rect.height - 2 * padding) / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY, 2);

    const transformX = (x: number) => padding + (x - minX) * scale;
    const transformY = (y: number) => padding + (y - minY) * scale;

    // Draw edges first
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.name === edge.from);
      const toNode = nodes.find(n => n.name === edge.to);
      
      if (fromNode && toNode) {
        const x1 = transformX(fromNode.x);
        const y1 = transformY(fromNode.y);
        const x2 = transformX(toNode.x);
        const y2 = transformY(toNode.y);

        // Draw arrow line
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLength = 12;
        const arrowAngle = Math.PI / 6;

        ctx.fillStyle = '#374151';
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

        // Draw cost label
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        const costText = `₹${edge.cost}`;
        ctx.font = '12px Arial';
        const textMetrics = ctx.measureText(costText);
        const textWidth = textMetrics.width;
        
        // Background for cost
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(midX - textWidth/2 - 3, midY - 8, textWidth + 6, 16);
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        ctx.strokeRect(midX - textWidth/2 - 3, midY - 8, textWidth + 6, 16);
        
        ctx.fillStyle = '#111827';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(costText, midX, midY);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const x = transformX(node.x);
      const y = transformY(node.y);
      const radius = 40;

      // Node colors
      let nodeColor = '#3B82F6';
      if (node.type === 'intermediate') nodeColor = '#F59E0B';
      if (node.type === 'customer') nodeColor = '#10B981';

      // Draw node circle
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw node border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw node name (center of circle)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Split long names into multiple lines
      const maxWidth = radius * 1.5;
      const words = node.name.split(' ');
      let lines = [];
      let currentLine = words[0];
      
      for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i];
        const testWidth = ctx.measureText(testLine).width;
        if (testWidth > maxWidth) {
          lines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);
      
      // Draw text lines
      const lineHeight = 14;
      const startY = y - (lines.length - 1) * lineHeight / 2;
      lines.forEach((line, index) => {
        ctx.fillText(line, x, startY + index * lineHeight);
      });

      // Draw node type below the circle
      ctx.fillStyle = '#1F2937';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const typeText = node.type.charAt(0).toUpperCase() + node.type.slice(1);
      ctx.fillText(typeText, x, y + radius + 10);

      // Draw capacity if available
      if (node.capacity) {
        ctx.font = '10px Arial';
        ctx.fillStyle = '#6B7280';
        ctx.fillText(`Capacity: ${node.capacity}`, x, y + radius + 25);
      }
    });
  }, [nodes, edges]);

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
