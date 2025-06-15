
import { Node, Edge } from "@/pages/Index";

interface NetworkStatisticsProps {
  nodes: Node[];
  edges: Edge[];
}

const NetworkStatistics = ({ nodes, edges }: NetworkStatisticsProps) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-blue-600">
          {nodes.filter(n => n.type === 'source').length}
        </div>
        <div className="text-sm text-blue-800">Sources</div>
      </div>
      <div className="bg-amber-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-amber-600">
          {nodes.filter(n => n.type === 'intermediate').length}
        </div>
        <div className="text-sm text-amber-800">Intermediates</div>
      </div>
      <div className="bg-emerald-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-emerald-600">
          {nodes.filter(n => n.type === 'customer').length}
        </div>
        <div className="text-sm text-emerald-800">Customers</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-gray-600">{edges.length}</div>
        <div className="text-sm text-gray-800">Connections</div>
      </div>
    </div>
  );
};

export default NetworkStatistics;
