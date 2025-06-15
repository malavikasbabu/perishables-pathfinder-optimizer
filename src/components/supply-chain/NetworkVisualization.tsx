
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
      // Draw placeholder text with better styling
      ctx.fillStyle = '#6B7280';
      ctx.font = 'bold 18px Arial';
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
    const padding = 80;
    const scaleX = (rect.width - 2 * padding) / (maxX - minX || 1);
    const scaleY = (rect.height - 2 * padding) / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY, 1.5); // Limit maximum scale

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

        // Draw arrow line with better styling
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 5;

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

        // Draw edge label (cost) with better positioning and styling
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        // Add background rectangle for cost label
        const costText = `₹${edge.cost}`;
        ctx.font = 'bold 12px Arial';
        const textMetrics = ctx.measureText(costText);
        const textWidth = textMetrics.width;
        const textHeight = 16;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(midX - textWidth/2 - 4, midY - textHeight/2 - 2, textWidth + 8, textHeight + 4);
        
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        ctx.strokeRect(midX - textWidth/2 - 4, midY - textHeight/2 - 2, textWidth + 8, textHeight + 4);
        
        ctx.fillStyle = '#111827';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(costText, midX, midY);
      }
    });

    // Draw nodes with improved styling
    nodes.forEach(node => {
      const x = transformX(node.x);
      const y = transformY(node.y);
      const radius = 35;

      // Node color based on type
      let nodeColor = '#3B82F6'; // blue for source
      let nodeColorLight = '#DBEAFE';
      if (node.type === 'intermediate') {
        nodeColor = '#F59E0B'; // amber
        nodeColorLight = '#FEF3C7';
      }
      if (node.type === 'customer') {
        nodeColor = '#10B981'; // emerald
        nodeColorLight = '#D1FAE5';
      }

      // Draw node shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.beginPath();
      ctx.arc(x + 2, y + 2, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw node background circle
      ctx.fillStyle = nodeColorLight;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw node main circle
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(x, y, radius - 5, 0, 2 * Math.PI);
      ctx.fill();

      // Draw node border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw node label with better typography
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.name, x, y - 2);

      // Draw node type below with improved styling
      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 12px Arial';
      ctx.textBaseline = 'top';
      
      // Capitalize and format type text
      const typeText = node.type.charAt(0).toUpperCase() + node.type.slice(1);
      ctx.fillText(typeText, x, y + radius + 8);

      // Add capacity info if available
      if (node.capacity) {
        ctx.font = '10px Arial';
        ctx.fillStyle = '#6B7280';
        ctx.fillText(`Cap: ${node.capacity}`, x, y + radius + 25);
      }
    });
  }, [nodes, edges]);

  return (
    <div className="space-y-6">
      {/* Legend with improved styling */}
      <div className="flex justify-center gap-8 text-sm bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
          <span className="font-medium text-gray-700">Source</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-sm"></div>
          <span className="font-medium text-gray-700">Intermediate</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
          <span className="font-medium text-gray-700">Customer</span>
        </div>
      </div>

      {/* Canvas with improved styling */}
      <div className="border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white shadow-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full block"
          style={{ height: '500px' }}
        />
      </div>

      {/* Network Statistics with improved design */}
      {nodes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 text-center">
            <div className="text-3xl font-bold text-blue-700 mb-1">{nodes.filter(n => n.type === 'source').length}</div>
            <div className="text-sm font-medium text-blue-800 uppercase tracking-wide">Sources</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200 text-center">
            <div className="text-3xl font-bold text-amber-700 mb-1">{nodes.filter(n => n.type === 'intermediate').length}</div>
            <div className="text-sm font-medium text-amber-800 uppercase tracking-wide">Intermediates</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200 text-center">
            <div className="text-3xl font-bold text-emerald-700 mb-1">{nodes.filter(n => n.type === 'customer').length}</div>
            <div className="text-sm font-medium text-emerald-800 uppercase tracking-wide">Customers</div>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 text-center">
            <div className="text-3xl font-bold text-gray-700 mb-1">{edges.length}</div>
            <div className="text-sm font-medium text-gray-800 uppercase tracking-wide">Connections</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkVisualization;
