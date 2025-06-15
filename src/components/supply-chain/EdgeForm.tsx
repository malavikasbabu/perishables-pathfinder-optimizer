
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edge, Node } from "@/pages/Index";

interface EdgeFormProps {
  onAddEdge: (edge: Omit<Edge, 'id'>) => void;
  nodes: Node[];
}

const EdgeForm = ({ onAddEdge, nodes }: EdgeFormProps) => {
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    distanceKm: "",
    travelTimeHr: "",
    cost: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.from) {
      newErrors.from = "From node is required";
    }

    if (!formData.to) {
      newErrors.to = "To node is required";
    }

    if (formData.from === formData.to) {
      newErrors.to = "From and To nodes cannot be the same";
    }

    if (!formData.distanceKm || isNaN(Number(formData.distanceKm)) || Number(formData.distanceKm) <= 0) {
      newErrors.distanceKm = "Valid distance (> 0) is required";
    }

    if (!formData.travelTimeHr || isNaN(Number(formData.travelTimeHr)) || Number(formData.travelTimeHr) <= 0) {
      newErrors.travelTimeHr = "Valid travel time (> 0) is required";
    }

    if (!formData.cost || isNaN(Number(formData.cost)) || Number(formData.cost) <= 0) {
      newErrors.cost = "Valid cost (> 0) is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const edge: Omit<Edge, 'id'> = {
      from: formData.from,
      to: formData.to,
      distanceKm: Number(formData.distanceKm),
      travelTimeHr: Number(formData.travelTimeHr),
      cost: Number(formData.cost)
    };

    onAddEdge(edge);
    
    // Reset form
    setFormData({
      from: "",
      to: "",
      distanceKm: "",
      travelTimeHr: "",
      cost: ""
    });
    setErrors({});
  };

  if (nodes.length < 2) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Add at least 2 nodes to create connections.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="from">From Node *</Label>
          <Select value={formData.from} onValueChange={(value) => setFormData(prev => ({ ...prev, from: value }))}>
            <SelectTrigger className={errors.from ? "border-red-500" : ""}>
              <SelectValue placeholder="Select from node" />
            </SelectTrigger>
            <SelectContent>
              {nodes.map((node) => (
                <SelectItem key={node.id} value={node.name}>
                  {node.name} ({node.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.from && <p className="text-sm text-red-500">{errors.from}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="to">To Node *</Label>
          <Select value={formData.to} onValueChange={(value) => setFormData(prev => ({ ...prev, to: value }))}>
            <SelectTrigger className={errors.to ? "border-red-500" : ""}>
              <SelectValue placeholder="Select to node" />
            </SelectTrigger>
            <SelectContent>
              {nodes.map((node) => (
                <SelectItem key={node.id} value={node.name}>
                  {node.name} ({node.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.to && <p className="text-sm text-red-500">{errors.to}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="distanceKm">Distance (km) *</Label>
          <Input
            id="distanceKm"
            type="number"
            min="0.01"
            step="0.01"
            value={formData.distanceKm}
            onChange={(e) => setFormData(prev => ({ ...prev, distanceKm: e.target.value }))}
            placeholder="e.g., 15.5"
            className={errors.distanceKm ? "border-red-500" : ""}
          />
          {errors.distanceKm && <p className="text-sm text-red-500">{errors.distanceKm}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="travelTimeHr">Travel Time (hours) *</Label>
          <Input
            id="travelTimeHr"
            type="number"
            min="0.01"
            step="0.1"
            value={formData.travelTimeHr}
            onChange={(e) => setFormData(prev => ({ ...prev, travelTimeHr: e.target.value }))}
            placeholder="e.g., 2.5"
            className={errors.travelTimeHr ? "border-red-500" : ""}
          />
          {errors.travelTimeHr && <p className="text-sm text-red-500">{errors.travelTimeHr}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost">Transport Cost (₹) *</Label>
          <Input
            id="cost"
            type="number"
            min="0.01"
            step="0.01"
            value={formData.cost}
            onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
            placeholder="e.g., 500.00"
            className={errors.cost ? "border-red-500" : ""}
          />
          {errors.cost && <p className="text-sm text-red-500">{errors.cost}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Add Connection
      </Button>
    </form>
  );
};

export default EdgeForm;
