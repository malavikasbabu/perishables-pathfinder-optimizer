
import { Node, Edge } from "@/pages/Index";

export interface PositionedNode extends Node {
  displayX: number;
  displayY: number;
}

export interface NetworkVisualizationProps {
  nodes: Node[];
  edges: Edge[];
}

export interface CanvasRendererProps {
  nodes: Node[];
  edges: Edge[];
  scale: number;
}
