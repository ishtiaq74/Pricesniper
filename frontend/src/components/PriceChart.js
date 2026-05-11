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
 * Light-theme version — white background, orange line.
 *
 * Props:
 *  - history  : Array<{ price: Number, recordedAt: String }>
 *  - currency : string — dynamic currency symbol (e.g. '$', '₹', '৳')
 */

const ORANGE = '#F97316';

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-sm">
        <p className="text-gray-400 mb-0.5 text-xs">{label}</p>
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
      <div className="flex items-center justify-center h-20 rounded-xl
                      bg-gray-50 border border-dashed border-gray-200 mt-2">
        <p className="text-gray-400 text-xs text-center px-2">
          Refresh once to see price history
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
    <div className="h-28 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradientLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={ORANGE} stopOpacity={0.15} />
              <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />

          <XAxis
            dataKey="time"
            tick={{ fill: '#9ca3af', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 9 }}
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
            strokeWidth={2}
            dot={{ fill: ORANGE, r: 2.5, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: ORANGE, stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
