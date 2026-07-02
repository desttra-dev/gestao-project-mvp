'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartPoint {
  month: string
  entradas: number
  saidas: number
}

interface DashboardChartProps {
  data12months: ChartPoint[]
  currency: 'BRL' | 'EUR'
}

const periods = [
  { label: '3 meses', value: 3 },
  { label: '6 meses', value: 6 },
  { label: '12 meses', value: 12 },
]

export function DashboardChart({ data12months, currency }: DashboardChartProps) {
  const [period, setPeriod] = useState(6)

  const data = data12months.slice(-period)

  const symbol = currency === 'EUR' ? '€' : 'R$'
  const fmt = (v: number) =>
    `${symbol} ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`

  const tickFmt = (v: number) =>
    currency === 'EUR'
      ? `€${(v / 1000).toFixed(0)}k`
      : `R$${(v / 1000).toFixed(0)}k`

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-h2">
            Fluxo Financeiro ({currency})
          </CardTitle>
          <div className="flex gap-1">
            {periods.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                style={{
                  backgroundColor: period === p.value ? '#1e6b40' : '#e8faf0',
                  color: period === p.value ? '#ffffff' : '#1e6b40',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.every(d => d.entradas === 0 && d.saidas === 0) ? (
          <div className="h-52 flex items-center justify-center" style={{ color: '#9dbfa9' }}>
            <p className="text-sm">Nenhum lançamento em {currency} registrado ainda.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradEntradas${currency}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2da862" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2da862" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`gradSaidas${currency}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8faf0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b8c6b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b8c6b' }} axisLine={false} tickLine={false} tickFormatter={tickFmt} />
              <Tooltip
                formatter={(value, name) => [fmt(Number(value ?? 0)), name === 'entradas' ? 'Entradas' : 'Saídas']}
                contentStyle={{ borderRadius: 8, border: '1px solid #d4e8d4', fontSize: 12 }}
              />
              <Legend formatter={v => v === 'entradas' ? 'Entradas' : 'Saídas'} iconType="circle" iconSize={8} />
              <Area type="monotone" dataKey="entradas" stroke="#1e6b40" strokeWidth={2} fill={`url(#gradEntradas${currency})`} />
              <Area type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={2} fill={`url(#gradSaidas${currency})`} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
