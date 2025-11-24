'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface BookingsByStatus {
  completed: number;
  pending: number;
  cancelled: number;
  others: number;
}

interface BookingsByStatusChartProps {
  data: BookingsByStatus;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

export default function BookingsByStatusChart({ data }: BookingsByStatusChartProps) {
  const chartData = [
    { name: 'Terminées', value: data.completed },
    { name: 'En attente', value: data.pending },
    { name: 'Annulées', value: data.cancelled },
    { name: 'Autres', value: data.others },
  ].filter(item => item.value > 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Répartition des réservations par statut
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => {
              const percentValue = percent ?? 0;
              return `${name}: ${(percentValue * 100).toFixed(0)}%`;
            }}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
            <Tooltip />
            <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
