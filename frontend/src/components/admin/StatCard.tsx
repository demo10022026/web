import type { LucideIcon } from 'lucide-react'

interface Props {
    title: string
    value: string | number
    subtitle?: string
    icon: LucideIcon
    color: 'violet' | 'blue' | 'green' | 'orange' | 'red' | 'yellow'
    trend?: { value: number; label: string }
}

const COLORS = {
    violet: { bg: 'bg-violet-500',  light: 'bg-violet-50',  text: 'text-violet-600',  ring: 'ring-violet-100' },
    blue:   { bg: 'bg-blue-500',    light: 'bg-blue-50',    text: 'text-blue-600',    ring: 'ring-blue-100'   },
    green:  { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100'},
    orange: { bg: 'bg-orange-500',  light: 'bg-orange-50',  text: 'text-orange-600',  ring: 'ring-orange-100' },
    red:    { bg: 'bg-red-500',     light: 'bg-red-50',     text: 'text-red-600',     ring: 'ring-red-100'    },
    yellow: { bg: 'bg-yellow-500',  light: 'bg-yellow-50',  text: 'text-yellow-600',  ring: 'ring-yellow-100' },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color, trend }: Props) {
    const c = COLORS[color]

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100
                    hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${c.light} rounded-2xl flex items-center justify-center ring-4 ${c.ring}`}>
                    <Icon className={`h-5 w-5 ${c.text}`} />
                </div>

                {trend && (
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg
            ${trend.value >= 0
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-red-50 text-red-500'}`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
                )}
            </div>

            <div>
                <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                {subtitle && (
                    <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
                )}
                {trend && (
                    <p className="text-xs text-gray-400 mt-1">{trend.label}</p>
                )}
            </div>
        </div>
    )
}