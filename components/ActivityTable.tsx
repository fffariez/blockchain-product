"use client"

export default function ActivityTable() {
  const rows = [
    { id: "PR-0012", action: "Registered", status: "Success", date: "2025-01-20" },
    { id: "PR-0010", action: "Verification", status: "Success", date: "2025-01-19" },
    { id: "PR-0009", action: "Verification", status: "Failed", date: "2025-01-18" },
  ]

  return (
    <table className="w-full text-sm">
      <thead className="text-left border-b dark:border-neutral-700">
        <tr>
          <th className="p-3">Product ID</th>
          <th className="p-3">Action</th>
          <th className="p-3">Status</th>
          <th className="p-3">Date</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b dark:border-neutral-800">
            <td className="p-3">{r.id}</td>
            <td className="p-3">{r.action}</td>
            <td className="p-3">{r.status}</td>
            <td className="p-3">{r.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
