import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { chartRows } from './content';
import type { Content } from './content';
const colors = ['#146f64', '#2f9b87', '#52bca0', '#84d5b8', '#b4e7cd'];
export default function ResearchChart({ content }: { content: Content }) {
  const rows = chartRows(content).filter(row => row.value !== null);
  if (!rows.length) return null;
  return <div className="chart" aria-hidden="true"><ResponsiveContainer width="100%" height="100%">
    <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 22, left: 6, bottom: 0 }} barSize={24}>
      <CartesianGrid strokeDasharray="3 6" horizontal={false} stroke="#dfe9e6" />
      <XAxis type="number" allowDecimals={false} tick={{ fill: '#617470', fontSize: 12 }} axisLine={false} tickLine={false} />
      <YAxis type="category" dataKey="name" width={136} tick={{ fill: '#334e49', fontSize: 12 }} axisLine={false} tickLine={false} />
      <Tooltip cursor={{ fill: '#edf5f0' }} formatter={v => [v, 'Unidades']} contentStyle={{ borderRadius: 12, border: '1px solid #d7e6df' }} />
      <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive={!window.matchMedia('(prefers-reduced-motion: reduce)').matches}>{rows.map((r, i) => <Cell key={r.name} fill={colors[i]} />)}</Bar>
    </BarChart>
  </ResponsiveContainer></div>;
}
