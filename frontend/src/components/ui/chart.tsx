"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { type TooltipProps } from "recharts";
import { type NameType, type ValueType } from "recharts/types/component/DefaultTooltipContent";

import { cn } from "@/lib/utils";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, cfg]) => cfg.theme || cfg.color);

  if (!colorConfig.length) {
    return null;
  }

  const css = Object.entries(THEMES)
    .map(([theme, prefix]) => {
      const inner = colorConfig
        .map(([key, itemConfig]) => {
          // safe access: if theme object exists use it, otherwise use color
          const themeColor =
            "theme" in itemConfig && itemConfig.theme
              ? (itemConfig.theme as Record<keyof typeof THEMES, string>)[theme as keyof typeof THEMES]
              : itemConfig.color;
          return themeColor ? `  --color-${key}: ${themeColor};` : null;
        })
        .filter(Boolean)
        .join("\n");

      return `${prefix} [data-chart=${id}] {\n${inner}\n}`;
    })
    .join("\n");

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
};

const ChartTooltip = RechartsPrimitive.Tooltip;

/* ------------------------
   TIPAGENS LOCAIS PARA TOOLTIP
   - Evita depender de variações da lib 'recharts'
   ------------------------ */

// item do payload: formato permissivo porque o recharts varia conforme o gráfico
type TooltipPayloadItem = {
  name?: string;
  dataKey?: string | number;
  value?: any;
  color?: string;
  // payload pode ser um object com campos extras (ex: fill)
  payload?: Record<string, any>;
  [k: string]: any;
};

// payload inteiro
type TooltipPayload = TooltipPayloadItem[] | undefined;

// tipo da TooltipProps (não usaremos indexação instável)
type RechartsTooltip = TooltipProps<ValueType, NameType>;

// Props do nosso componente de conteúdo do tooltip
type ChartTooltipContentProps = RechartsTooltip & {
  className?: string;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  nameKey?: string;
  labelKey?: string;
  labelClassName?: string;
  color?: string;

  // declarar explicitamente os campos que usamos, com tipos locais
  payload?: TooltipPayload;
  label?: React.ReactNode;
  labelFormatter?: ((value: any, payload?: TooltipPayload) => React.ReactNode) | undefined;
  formatter?: ((value: any, name?: any, props?: any, index?: number, extra?: any) => React.ReactNode) | undefined;
};

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart();

    // tooltipLabel: memoizar para performance
    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !Array.isArray(payload) || payload.length === 0) {
        return null;
      }

      const item = payload[0] as TooltipPayloadItem;
      const key = `${labelKey || (item && (item.dataKey ?? item.name)) || "value"}`;
      const itemConfig = getPayloadConfigFromPayload(config, item as any, key);
      const value =
        !labelKey && typeof label === "string" ? (config[label as keyof typeof config]?.label || label) : itemConfig?.label;

      if (labelFormatter) {
        return <div className={cn("font-medium", labelClassName)}>{labelFormatter(value, payload)}</div>;
      }

      if (!value) {
        return null;
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>;
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

    if (!active || !Array.isArray(payload) || payload.length === 0) {
      return null;
    }

    const nestLabel = payload.length === 1 && indicator !== "dot";

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item: TooltipPayloadItem, index: number) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item as any, key);
            const indicatorColor = color || (item.payload && item.payload.fill) || item.color;

            return (
              <div
                key={(item.dataKey ?? index) as React.Key}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  // formatter pode retornar ReactNode conforme definição do recharts
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">{itemConfig?.label || item.name}</span>
                      </div>
                      {item.value !== undefined && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {typeof item.value === "number" ? item.value.toLocaleString() : String(item.value)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltip";

const ChartLegend = RechartsPrimitive.Legend;

/* ------------------------------------------------------
   TIPAGEM DO LEGEND CONTENT
   - Evita colisão com props HTML e com propriedades do recharts
   ------------------------------------------------------ */
type LegendContentProps = {
  className?: string;
  hideIcon?: boolean;
  nameKey?: string;
  payload?: RechartsPrimitive.LegendPayload[] | undefined;
  verticalAlign?: RechartsPrimitive.LegendProps["verticalAlign"];
} & React.HTMLAttributes<HTMLDivElement>;

const ChartLegendContent = React.forwardRef<HTMLDivElement, LegendContentProps>(
  ({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
    const { config } = useChart();

    if (!Array.isArray(payload) || payload.length === 0) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item as any, key);

          return (
            <div
              key={(item.value ?? key) as React.Key}
              className={cn("flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground")}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
      </div>
    );
  }
);
ChartLegendContent.displayName = "ChartLegend";

// Helper to extract item config from a payload.
// Tipagem permissiva para lidar com os formatos do recharts.
function getPayloadConfigFromPayload(config: ChartConfig, payload: Record<string, any> | undefined, key: string) {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const innerPayload = payload.payload && typeof payload.payload === "object" ? (payload.payload as Record<string, any>) : undefined;

  let configLabelKey: string = key;

  if (payload && key in payload && typeof payload[key] === "string") {
    configLabelKey = payload[key] as string;
  } else if (innerPayload && key in innerPayload && typeof innerPayload[key] === "string") {
    configLabelKey = innerPayload[key] as string;
  }

  if (configLabelKey in config) {
    return config[configLabelKey];
  }

  return config[key as keyof typeof config];
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
