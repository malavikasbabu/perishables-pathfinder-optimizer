
import { useEffect, useRef } from "react";
import { CanvasRendererProps, PositionedNode } from "./types";

const CanvasRenderer = ({ nodes, edges, scale }: CanvasRendererProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for crisp rendering
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
    const positionedNodes: PositionedNode[] = nodes.map((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      return {
        ...node,
        displayX: 50 + col * cellWidth + cellWidth / 2,
        displayY: 50 + row * cellHeight + cellHeight / 2
      };
    });

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
        const nodeRadius = 30 * scale;
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
      const radius = 30 * scale;

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
      ctx.font = `bold ${Math.max(10, 12 * scale)}px Arial`;
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
      ctx.font = `${Math.max(10, 11 * scale)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const typeText = node.type.charAt(0).toUpperCase() + node.type.slice(1);
      ctx.fillText(typeText, x, y + radius + 5);

      // Draw capacity if available
      if (node.capacity) {
        ctx.font = `${Math.max(8, 9 * scale)}px Arial`;
        ctx.fillStyle = '#6B7280';
        ctx.fillText(`Cap: ${node.capacity}`, x, y + radius + 20);
      }
    });
  }, [nodes, edges, scale]);

  return (
    <div className="border rounded-lg bg-white">
      <canvas
        ref={canvasRef}
        className="w-full block"
        style={{ height: '500px' }}
      />
    </div>
  );
};

export default CanvasRenderer;
