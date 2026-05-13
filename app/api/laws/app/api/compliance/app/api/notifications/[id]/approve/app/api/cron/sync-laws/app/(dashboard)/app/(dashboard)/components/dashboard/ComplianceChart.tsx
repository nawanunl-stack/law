// components/dashboard/ComplianceChart.tsx
'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

const COLORS = {
  COMPLIANT: '#22c55e',
  PARTIAL: '#eab308',
  NON_COMPLIANT: '#ef4444',
  NOT_APPLICABLE: '#94a3b8',
  NOT_ASSESSED: '#d1d5db',
}

const LABELS = {
  COMPLIANT: 'สอดคล้อง',
  PARTIAL: 'สอดคล้องบางส่วน',
  NON_COMPLIANT: 'ไม่สอดคล้อง',
  NOT_APPLICABLE: 'ไม่เกี่ยวข้อง',
  NOT_ASSESSED: 'ยังไม่ประเมิน',
}

export function ComplianceChart({
  data,
}: {
  data: Record<string, number>
}) {
  const chartData = Object.entries(data).map(([status, count]) => ({
    name: LABELS[status as keyof typeof LABELS] || status,
    value: count,
    color: COLORS[status as keyof typeof COLORS] || '#94a3b8',
  }))

  if (chartData.every((d) => d.value === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        ยังไม่มีข้อมูลการประเมิน
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
