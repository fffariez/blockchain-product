"use client"

import { Package, CheckCircle, Clock } from "lucide-react"

export default function StatsCards() {
  const stats = [
    {
      title: "Registered Products",
      value: 128,
      icon: <Package className="w-6 h-6" />,
    },
    {
      title: "Verified Products",
      value: 94,
      icon: <CheckCircle className="w-6 h-6" />,
    },
    {
      title: "Pending Verifications",
      value: 12,
      icon: <Clock className="w-6 h-6" />,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((s, i) => (
        <div key={i} className="p-6 bg-white dark:bg-neutral-900 rounded-xl border dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{s.title}</p>
              <h3 className="text-2xl font-bold mt-2">{s.value}</h3>
            </div>
            {s.icon}
          </div>
        </div>
      ))}
    </div>
  )
}
