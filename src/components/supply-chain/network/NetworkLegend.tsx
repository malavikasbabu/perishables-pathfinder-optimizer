
const NetworkLegend = () => {
  return (
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
  );
};

export default NetworkLegend;
