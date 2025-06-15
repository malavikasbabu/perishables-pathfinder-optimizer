
import { useState } from "react";
import { NetworkVisualizationProps } from "./network/types";
import NetworkLegend from "./network/NetworkLegend";
import ScaleSlider from "./network/ScaleSlider";
import NetworkStatistics from "./network/NetworkStatistics";
import CanvasRenderer from "./network/CanvasRenderer";

const NetworkVisualization = ({ nodes, edges }: NetworkVisualizationProps) => {
  const [scale, setScale] = useState([1]);

  return (
    <div className="space-y-6">
      <NetworkLegend />

      {nodes.length > 0 && (
        <ScaleSlider scale={scale} onScaleChange={setScale} />
      )}

      <CanvasRenderer nodes={nodes} edges={edges} scale={scale[0]} />

      {nodes.length > 0 && (
        <NetworkStatistics nodes={nodes} edges={edges} />
      )}
    </div>
  );
};

export default NetworkVisualization;
