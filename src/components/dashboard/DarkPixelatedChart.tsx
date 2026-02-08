import { cn } from '@/lib/utils';

interface ChartDataPoint {
  label: string;
  applications: number;
  velocity?: number;
}

interface DarkPixelatedChartProps {
  data: ChartDataPoint[];
  maxValue?: number;
  pixelSize?: number;
  activeIndex?: number;
  className?: string;
}

export function DarkPixelatedChart({
  data,
  maxValue,
  pixelSize = 8,
  activeIndex,
  className,
}: DarkPixelatedChartProps) {
  const calculatedMax = maxValue || Math.max(...data.map(d => d.applications)) * 1.2;
  const gridRows = Math.ceil(calculatedMax / 5);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Y-axis labels and chart area */}
      <div className="flex gap-4">
        {/* Y-axis */}
        <div className="flex flex-col justify-between text-xs text-white/40 w-10 text-right">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i}>{Math.round((5 - i) * (calculatedMax / 5))}</span>
          ))}
        </div>

        {/* Chart Grid */}
        <div className="flex-1">
          <div className="flex items-end justify-between gap-2 h-64">
            {data.map((point, colIndex) => {
              const normalizedValue = point.applications / calculatedMax;
              const filledPixels = Math.round(normalizedValue * gridRows);
              const isActive = colIndex === activeIndex;

              return (
                <div 
                  key={point.label}
                  className="flex-1 flex flex-col justify-end gap-1"
                >
                  {/* Pixel stack */}
                  <div className="flex flex-col-reverse gap-1">
                    {Array.from({ length: gridRows }, (_, rowIndex) => {
                      const isFilled = rowIndex < filledPixels;
                      return (
                        <div
                          key={rowIndex}
                          className={cn(
                            "w-full rounded-sm transition-all duration-300",
                            isFilled
                              ? isActive
                                ? "bg-primary"
                                : "bg-white/60"
                              : "bg-white/10"
                          )}
                          style={{ 
                            height: pixelSize,
                            opacity: isFilled ? 1 - (rowIndex * 0.03) : 1
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex gap-4">
        <div className="w-10" /> {/* Spacer for Y-axis */}
        <div className="flex-1 flex justify-between">
          {data.map((point, i) => (
            <span 
              key={point.label} 
              className={cn(
                "text-xs text-center flex-1",
                i === activeIndex ? "text-white font-medium" : "text-white/40"
              )}
            >
              {point.label}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-white/60" />
          <span className="text-xs text-white/60">Applications</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-primary" />
          <span className="text-xs text-white/60">Current Month</span>
        </div>
      </div>
    </div>
  );
}
