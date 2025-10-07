"use client";

/**
 * Usage Chart Component
 * Displays a pie chart showing question usage by subject and remaining quota
 */

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { SubjectUsage } from "@/lib/usage-tracking";

interface UsageChartProps {
    subjectBreakdown: SubjectUsage[];
    remainingQuota: number;
    totalQuota: number;
}

// Color palette for subjects (vibrant, distinguishable colors)
const SUBJECT_COLORS = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#06b6d4", // cyan
    "#ec4899", // pink
    "#f97316", // orange
    "#14b8a6", // teal
    "#6366f1", // indigo
];

// Gray color for remaining quota
const REMAINING_COLOR = "#e5e7eb";

interface ChartData {
    name: string;
    value: number;
    percentage: number;
    color: string;
}

export function UsageChart({ subjectBreakdown, remainingQuota, totalQuota }: UsageChartProps) {
    // Build chart data
    const chartData: ChartData[] = [
        ...subjectBreakdown.map((item, index) => ({
            name: item.subject,
            value: item.count,
            percentage: item.percentage,
            color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
        })),
    ];

    // Add remaining quota as a separate slice
    if (remainingQuota > 0) {
        const remainingPercentage = Math.round((remainingQuota / totalQuota) * 100);
        chartData.push({
            name: "Disponível",
            value: remainingQuota,
            percentage: remainingPercentage,
            color: REMAINING_COLOR,
        });
    }

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <p className="font-semibold text-gray-900">{data.name}</p>
                    <p className="text-sm text-gray-600">
                        {data.value} {data.value === 1 ? "questão" : "questões"} ({data.percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    // Custom legend
    const CustomLegend = ({ payload }: any) => {
        return (
            <div className="flex flex-wrap justify-center gap-4 mt-4">
                {payload.map((entry: any, index: number) => (
                    <div key={`legend-${index}`} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.payload.color }} />
                        <span className="text-sm text-gray-700">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    };

    // If no data, show empty state
    if (chartData.length === 0 || totalQuota === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                <p>Nenhuma questão criada ainda</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
