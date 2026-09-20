"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsData {
  month: string;
  exams: number;
  revenue: number;
  averagePercentage: number;
}

interface AdminAnalyticsProps {
  data: AnalyticsData[];
}

export default function AdminAnalytics({
  data,
}: AdminAnalyticsProps) {
  return (
    <section className="mt-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">
          Platform Analytics
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Activity and performance trends over the last six months.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Exam Activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="font-bold text-slate-900">
              Exam Activity
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Number of exams created each month.
            </p>
          </div>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                />

                <Tooltip />

                <Bar
                  dataKey="exams"
                  name="Exams"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="font-bold text-slate-900">
              Payment Revenue
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Successful payment revenue by month.
            </p>
          </div>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  tick={{ fontSize: 12 }}
                />

                <Tooltip
                  formatter={(value) =>
                    `GHS ${Number(value ?? 0).toFixed(2)}`
                  }
                />

                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student Performance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div>
            <h3 className="font-bold text-slate-900">
              Student Performance
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Average examination percentage by month.
            </p>
          </div>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                />

                <Tooltip
                  formatter={(value) =>
                    `${Number(value ?? 0).toFixed(2)}%`
                  }
                />

                <Line
                  type="monotone"
                  dataKey="averagePercentage"
                  name="Average Score"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
