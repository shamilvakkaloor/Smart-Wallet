"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function DashboardChart({ data }: { data: { label: string; income: number; expense: number }[] }) {
  return <div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis dataKey="label"/><YAxis/><Tooltip/><Bar dataKey="income" fill="#10b981" radius={[4,4,0,0]}/><Bar dataKey="expense" fill="#f43f5e" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>;
}
