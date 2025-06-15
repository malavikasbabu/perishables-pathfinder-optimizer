
import { Slider } from "@/components/ui/slider";

interface ScaleSliderProps {
  scale: number[];
  onScaleChange: (value: number[]) => void;
}

const ScaleSlider = ({ scale, onScaleChange }: ScaleSliderProps) => {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Scale:</span>
        <div className="flex-1">
          <Slider
            value={scale}
            onValueChange={onScaleChange}
            min={0.5}
            max={2}
            step={0.1}
            className="w-full"
          />
        </div>
        <span className="text-sm text-gray-600">{scale[0].toFixed(1)}x</span>
      </div>
    </div>
  );
};

export default ScaleSlider;
