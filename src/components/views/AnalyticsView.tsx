import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, TrendingUp, Award, Clock } from "lucide-react";

export function AnalyticsView() {
  const data = [
    { name: "Quiz 1", avg: 85, max: 100 },
    { name: "Quiz 2", avg: 72, max: 100 },
    { name: "Quiz 3", avg: 90, max: 100 },
    { name: "Midterm", avg: 78, max: 100 },
    { name: "Quiz 4", avg: 88, max: 100 },
  ];

  const stats = [
    { label: "Total Students", value: "142", icon: Users, color: "bg-blue-500" },
    { label: "Class Average", value: "82.6%", icon: TrendingUp, color: "bg-green-500" },
    { label: "Top Performer", value: "A+", icon: Award, color: "bg-orange-500" },
    { label: "Avg. Time", value: "24m", icon: Clock, color: "bg-indigo-500" },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8">
      <header className="mb-8">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Performance Analytics</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Automated grading summaries and class performance trends.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-6 flex items-center gap-4">
            <div className={`p-3 rounded-lg text-white ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 border rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Recent Assessment Trends</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} dx={-10} />
              <Tooltip
                cursor={{ fill: "#F1F5F9" }}
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              />
              <Bar dataKey="avg" name="Class Average" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Submissions (Mocked Info)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Student Name</th>
                <th className="px-6 py-4 font-medium">Assessment</th>
                <th className="px-6 py-4 font-medium">Score</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-slate-50 dark:bg-slate-900/50/50">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">Student {i}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Chapter 4 Quiz</td>
                  <td className="px-6 py-4 font-semibold text-indigo-600">{Math.floor(Math.random() * 20 + 80)}/100</td>
                  <td className="px-6 py-4">
                    <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">Graded</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline">View Report</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
