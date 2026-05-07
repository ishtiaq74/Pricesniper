import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/**
 * PriceChart
 * Renders a Recharts LineChart from the product's priceHistory array.
 *
 * Props:
 *  - history  : Array<{ price: Number, recordedAt: String }>
 *  - currency : string — dynamic currency symbol (e.g. '$', '₹', '৳')
 */

const ORANGE = '#FF8C00';

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 shadow-xl text-sm">
        <p className="text-gray-400 mb-0.5">{label}</p>
        <p className="font-bold" style={{ color: ORANGE }}>
          {currency}{payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

const PriceChart = ({ history, currency = '$' }) => {
  if (!history || history.length < 2) {
    return (
      <div className="flex items-center justify-center h-28 rounded-xl bg-gray-800/50 border border-dashed border-gray-700">
        <p className="text-gray-500 text-xs text-center">
          Refresh the product at least once to see price history
        </p>
      </div>
    );
  }

  const chartData = history.map((entry) => ({
    time: new Date(entry.recordedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    price: entry.price,
  }));

  return (
    <div className="h-32 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={ORANGE} stopOpacity={0.3} />
              <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />

          <XAxis
            dataKey="time"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${currency}${v}`}
            domain={['auto', 'auto']}
          />

          <Tooltip content={<CustomTooltip currency={currency} />} />

          <Line
            type="monotone"
            dataKey="price"
            stroke={ORANGE}
            strokeWidth={2.5}
            dot={{ fill: ORANGE, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: ORANGE, stroke: '#111827', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
