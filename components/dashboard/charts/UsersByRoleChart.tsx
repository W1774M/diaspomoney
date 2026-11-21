'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface UsersByRole {
  customers: number;
  providers: number;
  admins: number;
  others: number;
}

interface UsersByRoleChartProps {
  data: UsersByRole;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function UsersByRoleChart({ data }: UsersByRoleChartProps) {
  const chartData = [
    { name: 'Clients', value: data.customers },
    { name: 'Prestataires', value: data.providers },
    { name: 'Administrateurs', value: data.admins },
    { name: 'Autres', value: data.others },
  ].filter(item => item.value > 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Répartition des utilisateurs par rôle
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent || 0 * 100).toFixed(0)}%`}
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

