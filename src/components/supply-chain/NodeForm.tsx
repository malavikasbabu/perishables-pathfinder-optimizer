
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Node } from "@/pages/Index";

interface NodeFormProps {
  onAddNode: (node: Omit<Node, 'id'>) => void;
  existingNodes: Node[];
}

const NodeForm = ({ onAddNode, existingNodes }: NodeFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "" as 'source' | 'intermediate' | 'customer' | "",
    x: "",
    y: "",
    capacity: "",
    perishabilityHours: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (existingNodes.some(node => node.name.toLowerCase() === formData.name.toLowerCase())) {
      newErrors.name = "Node name already exists";
    }

    if (!formData.type) {
      newErrors.type = "Type is required";
    }

    if (!formData.x || isNaN(Number(formData.x))) {
      newErrors.x = "Valid X coordinate is required";
    }

    if (!formData.y || isNaN(Number(formData.y))) {
      newErrors.y = "Valid Y coordinate is required";
    }

    if (formData.capacity && isNaN(Number(formData.capacity))) {
      newErrors.capacity = "Capacity must be a valid number";
    }

    if (formData.perishabilityHours && isNaN(Number(formData.perishabilityHours))) {
      newErrors.perishabilityHours = "Perishability hours must be a valid number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const node: Omit<Node, 'id'> = {
      name: formData.name.trim(),
      type: formData.type as 'source' | 'intermediate' | 'customer',
      x: Number(formData.x),
      y: Number(formData.y),
      capacity: formData.capacity ? Number(formData.capacity) : undefined,
      perishabilityHours: formData.perishabilityHours ? Number(formData.perishabilityHours) : undefined
    };

    onAddNode(node);
    
    // Reset form
    setFormData({
      name: "",
      type: "",
      x: "",
      y: "",
      capacity: "",
      perishabilityHours: ""
    });
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Node Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Factory1, ColdStorage A"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Node Type *</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
            <SelectTrigger className={errors.type ? "border-red-500" : ""}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="source">Source (Factory/Supplier)</SelectItem>
              <SelectItem value="intermediate">Intermediate (Warehouse/DC)</SelectItem>
              <SelectItem value="customer">Customer (Retail/End point)</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="x">X Coordinate *</Label>
          <Input
            id="x"
            type="number"
            step="0.01"
            value={formData.x}
            onChange={(e) => setFormData(prev => ({ ...prev, x: e.target.value }))}
            placeholder="0.00"
            className={errors.x ? "border-red-500" : ""}
          />
          {errors.x && <p className="text-sm text-red-500">{errors.x}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="y">Y Coordinate *</Label>
          <Input
            id="y"
            type="number"
            step="0.01"
            value={formData.y}
            onChange={(e) => setFormData(prev => ({ ...prev, y: e.target.value }))}
            placeholder="0.00"
            className={errors.y ? "border-red-500" : ""}
          />
          {errors.y && <p className="text-sm text-red-500">{errors.y}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity (optional)</Label>
          <Input
            id="capacity"
            type="number"
            min="0"
            value={formData.capacity}
            onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
            placeholder="e.g., 10000"
            className={errors.capacity ? "border-red-500" : ""}
          />
          {errors.capacity && <p className="text-sm text-red-500">{errors.capacity}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="perishabilityHours">Max Perishability Time (hours)</Label>
          <Input
            id="perishabilityHours"
            type="number"
            min="0"
            step="0.1"
            value={formData.perishabilityHours}
            onChange={(e) => setFormData(prev => ({ ...prev, perishabilityHours: e.target.value }))}
            placeholder="e.g., 24.5"
            className={errors.perishabilityHours ? "border-red-500" : ""}
          />
          {errors.perishabilityHours && <p className="text-sm text-red-500">{errors.perishabilityHours}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Add Node
      </Button>
    </form>
  );
};

export default NodeForm;
