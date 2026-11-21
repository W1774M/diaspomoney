'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface MonthlyData {
  month: string;
  revenue: number;
  transactions: number;
  bookings: number;
  newUsers: number;
}

interface TransactionsChartProps {
  data: MonthlyData[];
}

export default function TransactionsChart({ data }: TransactionsChartProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Transactions et réservations (12 derniers mois)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="transactions" 
            stroke="#3b82f6" 
            fillOpacity={1}
            fill="url(#colorTransactions)"
            name="Transactions"
          />
          <Area 
            type="monotone" 
            dataKey="bookings" 
            stroke="#f59e0b" 
            fillOpacity={1}
            fill="url(#colorBookings)"
            name="Réservations"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

