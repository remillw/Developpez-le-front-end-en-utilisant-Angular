import { Olympic } from './Olympic';
import { Color } from '@swimlane/ngx-charts';

export interface PieChartData {
  name: string;
  value: number;
  extra?: {
    country: Olympic;
  };
}

export interface LineChartSeries {
  name: string;
  value: number;
}

export interface LineChartData {
  name: string;
  series: LineChartSeries[];
}

export type ColorScheme = string | Color;

export interface ChartSelectEvent {
  name: string;
  value: number;
  extra?: {
    country: Olympic;
  };
}

export interface TooltipData {
  name: string;
  value: number;
  data?: {
    name: string;
    value: number;
  };
}
