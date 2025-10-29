import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type MetricCardProps = {
  title: string;
  value: number | string;
  unit?: string; // Tornar unidade opcional
  icon?: LucideIcon; // Tornar ícone opcional
  change?: string; // Tornar change opcional
  changeType?: 'increase' | 'decrease'; // Tornar changeType opcional
};

export function MetricCard({
  title,
  value,
  unit,
  icon: Icon, // Renomeia 'icon' para 'Icon' para usar como componente
  change,
  changeType,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {/* Renderiza o ícone APENAS se ele for fornecido */}
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {/* Renderiza a unidade APENAS se ela for fornecida */}
          {unit && <span className="text-base font-medium">{unit}</span>}
        </div>
        {/* Renderiza a mudança APENAS se ela for fornecida */}
        {change && (
          <p
            className={cn(
              'text-xs text-muted-foreground',
              changeType === 'increase' ? 'text-green-500' : 'text-red-500' // Corrigi cores: aumento=verde, decréscimo=vermelho
            )}
          >
            {change} from last hour
          </p>
        )}
      </CardContent>
    </Card>
  );
}