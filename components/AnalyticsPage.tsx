import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Registration } from '../types';
import { Icon } from './icons';

const StatCard: React.FC<{title: string, value: string | number, icon: React.ReactElement}> = ({title, value, icon}) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-cream-200 flex items-center">
        <div className="p-3 rounded-full bg-primary-100 text-primary-700 mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-secondary-700">{title}</p>
            <p className="text-2xl font-bold text-primary-900">{value}</p>
        </div>
    </div>
);


export const AnalyticsPage: React.FC<{onBack: () => void}> = ({ onBack }) => {
  const [registrations] = useLocalStorage<Registration[]>('registrations', []);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const breedData = useMemo(() => {
    const breedCounts: { [key:string]: number } = {};
    registrations.forEach(reg => {
      reg.animals.forEach(animal => {
        if (!animal.aiResult.error) {
          const breedName = animal.aiResult.breedName;
          breedCounts[breedName] = (breedCounts[breedName] || 0) + 1;
        }
      });
    });

    return Object.entries(breedCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [registrations]);

  const stateData = useMemo(() => {
    const stateCounts: { [key: string]: number } = {};
    registrations.forEach(reg => {
      const state = reg.owner.state;
      stateCounts[state] = (stateCounts[state] || 0) + reg.animals.length;
    });

    return Object.entries(stateCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [registrations]);

  const totalAnimals = useMemo(() => registrations.reduce((sum, reg) => sum + reg.animals.length, 0), [registrations]);
  const mostCommonBreed = useMemo(() => breedData[0]?.name || 'N/A', [breedData]);
  
  const COLORS = ['#14532d', '#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80'];
  
  if (registrations.length === 0) {
    return (
       <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-cream-200">
          <Icon name="chart" className="w-16 h-16 mx-auto text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">Not Enough Data for Analytics</h2>
          <p className="mt-2 text-gray-500">Complete some registrations to see analytical insights here.</p>
          <button onClick={onBack} className="mt-6 px-4 py-2 bg-accent-500 text-white rounded-md hover:bg-accent-600 text-sm font-semibold transition-transform duration-150 active:scale-95">Back to Dashboard</button>
       </div>
    );
  }

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-primary-900">Analytics Dashboard</h1>
            <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-md text-secondary-700 font-semibold hover:bg-gray-50 text-sm transition-transform duration-150 active:scale-95">Back to Dashboard</button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className={`transition-all duration-300 ease-out transform ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{transitionDelay: '100ms'}}><StatCard title="Total Animals Registered" value={totalAnimals} icon={<Icon name="cow" className="w-6 h-6" />} /></div>
            <div className={`transition-all duration-300 ease-out transform ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{transitionDelay: '200ms'}}><StatCard title="Total Registrations" value={registrations.length} icon={<Icon name="history" className="w-6 h-6" />} /></div>
            <div className={`transition-all duration-300 ease-out transform ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{transitionDelay: '300ms'}}><StatCard title="Most Common Breed" value={mostCommonBreed} icon={<Icon name="ai-sparkles" className="w-6 h-6" />} /></div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className={`lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-cream-200 transition-all duration-500 ease-out transform ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{transitionDelay: '400ms'}}>
          <h2 className="text-xl font-bold text-primary-900 mb-4">Breed Distribution</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={breedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" height={90} interval={0} tick={{fontSize: 12}} />
              <YAxis allowDecimals={false} />
              <Tooltip cursor={{fill: 'rgba(20, 83, 45, 0.05)'}}/>
              <Legend />
              <Bar dataKey="count" fill="#15803d" name="Number of Animals" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={`lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-cream-200 transition-all duration-500 ease-out transform ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{transitionDelay: '500ms'}}>
          <h2 className="text-xl font-bold text-primary-900 mb-4">Geographic Spread (by State)</h2>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={stateData}
                cx="50%"
                cy="50%"
                labelLine={false}
                // FIX: Ensure 'percent' is treated as a number before multiplication to prevent TypeScript errors.
                label={({ name, percent }) => `${name} ${((Number(percent) || 0) * 100).toFixed(0)}%`}
                outerRadius={130}
                fill="#8884d8"
                dataKey="value"
              >
                {stateData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} animals`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};