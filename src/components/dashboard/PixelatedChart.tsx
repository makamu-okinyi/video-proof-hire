import * as React from "react";
import { cn } from "@/lib/utils";

interface ChartDataPoint {
  label: string;
  applications: number;
  velocity: number;
}

interface PixelatedChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: ChartDataPoint[];
  maxValue?: number;
  pixelSize?: number;
  activeIndex?: number;
}

export function PixelatedChart({
  data,
  maxValue = 60,
  pixelSize = 8,
  activeIndex = 5,
  className,
  ...props
}: PixelatedChartProps) {
  const gridRows = Math.ceil(maxValue / 10);
  const yLabels = Array.from({ length: gridRows + 1 }, (_, i) => (gridRows - i) * 10);

  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="flex">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between pr-4 py-2 text-xs text-cool-grey">
          {yLabels.map((label) => (
            <span key={label} className="h-4 flex items-center">
              {label}k
            </span>
          ))}
        </div>

        {/* Chart grid */}
        <div className="flex-1 relative">
          {/* Background grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {yLabels.map((label) => (
              <div key={label} className="border-t border-border/30 w-full" />
            ))}
          </div>

          {/* Bars */}
          <div className="relative flex items-end justify-between gap-2 h-64 px-2">
            {data.map((point, index) => {
              const isActive = index === activeIndex;
              const appHeight = (point.applications / maxValue) * 100;
              const velHeight = (point.velocity / maxValue) * 100;
              const totalHeight = appHeight + velHeight;
              
              // Calculate number of pixels needed
              const appPixels = Math.ceil(point.applications / 5);
              const velPixels = Math.ceil(point.velocity / 5);

              return (
                <div
                  key={point.label}
                  className="flex-1 flex flex-col items-center relative group"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    <div className="neo-extruded px-3 py-2 rounded-xl text-xs whitespace-nowrap">
                      <p className="font-semibold text-charcoal">{point.label} 2025</p>
                      <p className="text-cool-grey">Applications <span className="text-charcoal font-medium">{point.applications}k</span></p>
                      <p className="text-cool-grey">Velocity <span className="text-charcoal font-medium">{point.velocity}k</span></p>
                    </div>
                  </div>

                  {/* Stacked pixel bars */}
                  <div className="w-full flex flex-col-reverse items-center gap-[2px]">
                    {/* Velocity pixels (lighter) */}
                    {Array.from({ length: velPixels }).map((_, i) => (
                      <div
                        key={`vel-${i}`}
                        className={cn(
                          "w-full transition-all duration-300",
                          isActive ? "bg-charcoal/30" : "bg-foreground/20"
                        )}
                        style={{ 
                          height: pixelSize,
                          maxWidth: '100%',
                          borderRadius: 2,
                        }}
                      />
                    ))}
                    {/* Application pixels (darker) */}
                    {Array.from({ length: appPixels }).map((_, i) => (
                      <div
                        key={`app-${i}`}
                        className={cn(
                          "w-full transition-all duration-300",
                          isActive ? "bg-charcoal" : "bg-foreground/70"
                        )}
                        style={{ 
                          height: pixelSize,
                          maxWidth: '100%',
                          borderRadius: 2,
                        }}
                      />
                    ))}
                  </div>

                  {/* X-axis label */}
                  <span
                    className={cn(
                      "text-xs mt-3 transition-colors duration-200",
                      isActive ? "font-bold text-charcoal" : "text-cool-grey"
                    )}
                  >
                    {point.label}
                  </span>
                  
                  {/* Active indicator dot */}
                  {isActive && (
                    <div className="absolute -bottom-1 h-1 w-1 rounded-full bg-charcoal" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-8 mt-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-charcoal rounded-sm" />
          <span className="text-sm text-cool-grey">New Applications</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-foreground/30 rounded-sm" />
          <span className="text-sm text-cool-grey">Cohort Velocity</span>
        </div>
      </div>
    </div>
  );
}
