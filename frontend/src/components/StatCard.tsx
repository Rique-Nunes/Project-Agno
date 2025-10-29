'use client';

interface StatCardProps {
  title: string;
  value: string;
  unit: string;
}

export default function StatCard({ title, value, unit }: StatCardProps) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col justify-between">
      <div>
        <p className="text-sm text-gray-400">{title}</p>
      </div>
      <div className="mt-2">
        <span className="text-4xl font-bold">{value}</span>
        <span className="text-2xl text-gray-400 ml-1">{unit}</span>
      </div>
    </div>
  );
}