import { scaleLinear } from 'd3';

const negativeScale = scaleLinear<string>()
  .domain([-3, -2, -0.5, 0])
  .range(['#1a5da8', '#2f7fd4', '#4a8fd4', '#3a3a4a'])
  .clamp(true);

const positiveScale = scaleLinear<string>()
  .domain([0, 0.5, 2, 3])
  .range(['#3a3a4a', '#b03030', '#d42020', '#a01818'])
  .clamp(true);

export function getColor(changePercent: number): string {
  if (changePercent <= 0) return negativeScale(changePercent);
  return positiveScale(changePercent);
}
