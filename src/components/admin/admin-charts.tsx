"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from "recharts";

const COLORS = ["#6f4e37", "#a07a5f", "#c9a882", "#e2cdb8", "#8b6850", "#54382a"];

type MonthlyData = { month: string; revenue: number; orders: number };
type WilayaData = { name: string; count: number; revenue: number };
type StatusData = { name: string; value: number };

export function RevenueChart({ data }: { data: MonthlyData[] }) {
  const formatted = data.map((d) => ({ ...d, revenue: d.revenue / 1000 }));
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0e6dd" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#927e73" }} />
          <YAxis tick={{ fontSize: 10, fill: "#927e73" }} />
          <Tooltip
            contentStyle={{ borderRadius: 16, border: "1px solid #e8dfd8", fontSize: 12 }}
            formatter={(value) => [`${(Number(value ?? 0) * 1000).toLocaleString("fr-DZ")} DA`, "Revenu"]}
          />
          <Bar dataKey="revenue" fill="#6f4e37" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrdersByWilayaChart({ data }: { data: WilayaData[] }) {
  const top10 = data.slice(0, 10);
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={top10} layout="vertical" margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0e6dd" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: "#927e73" }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#70605a" }} width={80} />
          <Tooltip
            contentStyle={{ borderRadius: 16, border: "1px solid #e8dfd8", fontSize: 12 }}
            formatter={(value, name) => [name === "revenue" ? `${Number(value).toLocaleString("fr-DZ")} DA` : value, name === "revenue" ? "Revenu" : "Commandes"]}
          />
          <Bar dataKey="count" fill="#a07a5f" radius={[0, 6, 6, 0]} name="Commandes" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrderStatusChart({ data }: { data: StatusData[] }) {
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
            {data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #e8dfd8", fontSize: 12 }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
