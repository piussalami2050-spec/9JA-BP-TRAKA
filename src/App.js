import React, { useState, useEffect } from 'react';

const BPTracker = () => {
  const [readings, setReadings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ systolic: '', diastolic: '', pulse: '', notes: '', medication: false });
  const [patientName, setPatientName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('7days');

  useEffect(() => {
    const saved = localStorage.getItem('bp_readings');
    const savedName = localStorage.getItem('patient_name');
    const savedDark = localStorage.getItem('dark_mode');
    if (saved) setReadings(JSON.parse(saved));
    if (savedName) setPatientName(savedName);
    if (savedDark) setDarkMode(savedDark === 'true');
  }, []);

  const saveData = (data) => localStorage.setItem('bp_readings', JSON.stringify(data));
  
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('dark_mode', String(newMode));
  };

  const getBPCategory = (sys, dia) => {
    if (sys < 120 && dia < 80) return { level: 'Normal', color: darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800', emoji: '✅' };
    if (sys < 130 && dia < 80) return { level: 'Elevated', color: darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800', emoji: '⚠️' };
    if (sys < 140 || dia < 90) return { level: 'Stage 1', color: darkMode ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800', emoji: '🟠' };
    if (sys < 180 && dia < 120) return { level: 'Stage 2', color: darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800', emoji: '🔴' };
    return { level: 'Crisis', color: darkMode ? 'bg-red-800 text-red-100' : 'bg-red-200 text-red-900', emoji: '🚨' };
  };

  const handleSubmit = () => {
    if (!formData.systolic || !formData.diastolic || !formData.pulse) return alert('Fill all fields');
    const newReading = {
      id: Date.now(), systolic: parseInt(formData.systolic), diastolic: parseInt(formData.diastolic),
      pulse: parseInt(formData.pulse), notes: formData.notes, medication: formData.medication,
      date: new Date().toLocaleDateString('en-NG'),
      time: new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };
    const updated = [newReading, ...readings];
    setReadings(updated);
    saveData(updated);
    setFormData({ systolic: '', diastolic: '', pulse: '', notes: '', medication: false });
    setShowForm(false);
  };

  const getDetailedStats = () => {
    if (readings.length === 0) return null;
    const recent = readings.slice(0, 7);
    const avgSys = Math.round(recent.reduce((sum, r) => sum + r.systolic, 0) / recent.length);
    const avgDia = Math.round(recent.reduce((sum, r) => sum + r.diastolic, 0) / recent.length);
    const avgPulse = Math.round(recent.reduce((sum, r) => sum + r.pulse, 0) / recent.length);
    
    const categories = { normal: 0, elevated: 0, stage1: 0, stage2: 0, crisis: 0 };
    readings.forEach(r => {
      const cat = getBPCategory(r.systolic, r.diastolic);
      if (cat.level === 'Normal') categories.normal++;
      else if (cat.level === 'Elevated') categories.elevated++;
      else if (cat.level === 'Stage 1') categories.stage1++;
      else if (cat.level === 'Stage 2') categories.stage2++;
      else categories.crisis++;
    });
    
    let trend = 'stable';
    if (readings.length >= 14) {
      const lastWeek = readings.slice(0, 7);
      const prevWeek = readings.slice(7, 14);
      const lastWeekAvg = lastWeek.reduce((sum, r) => sum + r.systolic + r.diastolic, 0) / (lastWeek.length * 2);
      const prevWeekAvg = prevWeek.reduce((sum, r) => sum + r.systolic + r.diastolic, 0) / (prevWeek.length * 2);
      if (lastWeekAvg < prevWeekAvg - 5) trend = 'improving';
      else if (lastWeekAvg > prevWeekAvg + 5) trend = 'worsening';
    }
    
    return { avgSys, avgDia, avgPulse, categories, total: readings.length, trend };
  };

  const getChartData = () => {
    const now = Date.now();
    const periods = { '7days': 7 * 24 * 60 * 60 * 1000, '30days': 30 * 24 * 60 * 60 * 1000, '90days': 90 * 24 * 60 * 60 * 1000 };
    const cutoff = now - periods[chartPeriod];
    return readings.filter(r => r.timestamp > cutoff).reverse().slice(0, 50);
  };

  const getTimeOfDayStats = () => {
    const timeSlots = { morning: [], afternoon: [], evening: [], night: [] };
    readings.forEach(r => {
      const hour = parseInt(r.time.split(':')[0]);
      if (hour >= 6 && hour < 12) timeSlots.morning.push(r);
      else if (hour >= 12 && hour < 17) timeSlots.afternoon.push(r);
      else if (hour >= 17 && hour < 22) timeSlots.evening.push(r);
      else timeSlots.night.push(r);
    });
    return Object.entries(timeSlots).map(([time, data]) => ({
      time, count: data.length,
      avgSys: data.length > 0 ? Math.round(data.reduce((sum, r) => sum + r.systolic, 0) / data.length) : 0,
      avgDia: data.length > 0 ? Math.round(data.reduce((sum, r) => sum + r.diastolic, 0) / data.length) : 0
    }));
  };

  const exportToPDF = () => {
    const stats = getDetailedStats();
    const content = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>BP Report</title>
<style>body{font-family:Arial;max-width:800px;margin:40px auto;padding:20px}
.header{text-align:center;border-bottom:3px solid #2563eb;padding-bottom:20px}
.reading{border:1px solid #ddd;padding:15px;margin:10px 0;border-radius:8px}
.bp-value{font-size:24px;font-weight:bold}</style></head><body>
<div class="header"><h1>BP Report</h1><p>Patient: ${patientName || 'N/A'}</p>
<p>Date: ${new Date().toLocaleDateString('en-NG')}</p></div>
${stats ? `<p>7-Day Average: ${stats.avgSys}/${stats.avgDia} mmHg | Pulse: ${stats.avgPulse} bpm</p>` : ''}
${readings.slice(0, 20).map(r => {
  const cat = getBPCategory(r.systolic, r.diastolic);
  return `<div class="reading"><div class="bp-value">${r.systolic}/${r.diastolic} ${cat.emoji}</div>
  <p>Pulse: ${r.pulse} bpm | ${r.date} ${r.time}</p>${r.notes ? `<p><em>${r.notes}</em></p>` : ''}</div>`;
}).join('')}
</body></html>`;
    const w = window.open('', '_blank');
    w.document.write(content);
    w.document.close();
    setTimeout(() => w.print(), 250);
  };

  const stats = getDetailedStats();
  const chartData = getChartData();
  const timeStats = getTimeOfDayStats();
  const bgColor = darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gradient-to-br from-blue-50 to-green-50 text-gray-800';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const inputClass = darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-800';
  const btnHover = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';

  return (
    <div className={`min-h-screen ${bgColor} p-4 transition-colors duration-300`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className={`${cardBg} rounded-2xl shadow-lg p-6 mb-6`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className={`text-2xl font-bold ${textColor}`}>❤️ BP Naija Tracker Pro</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Enhanced with Charts & Analytics</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCharts(!showCharts)} className={`p-2 ${btnHover} rounded-full transition-colors`} title={showCharts ? 'Hide Charts' : 'Show Charts'}>
                <span style={{fontSize: '24px'}}>{showCharts ? '📊' : '📈'}</span>
              </button>
              <button onClick={exportToPDF} disabled={!readings.length} className={`p-2 ${btnHover} rounded-full`} title="Export">
                <span style={{fontSize: '24px'}} className={readings.length ? '' : 'opacity-40'}>⬇️</span>
              </button>
              <button onClick={toggleDarkMode} className={`p-2 ${btnHover} rounded-full`}>
                <span style={{fontSize: '24px'}}>{darkMode ? '☀️' : '🌙'}</span>
              </button>
              <button onClick={() => setShowSettings(!showSettings)} className={`p-2 ${btnHover} rounded-full`}>
                <span style={{fontSize: '24px'}}>👤</span>
              </button>
            </div>
          </div>

          {showSettings && (
            <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'} pt-4 mt-4`}>
              <label className={`block text-sm font-medium ${textColor} mb-2`}>Patient Name</label>
              <div className="flex gap-2">
                <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)}
                  className={`flex-1 px-4 py-2 border ${inputClass} rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`} placeholder="Enter name" />
                <button onClick={() => {localStorage.setItem('patient_name', patientName); setShowSettings(false)}}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`${cardBg} rounded-xl shadow-lg p-5`}>
              <div className="flex items-center gap-3 mb-2">
                <span style={{fontSize: '24px'}}>📊</span>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>7-Day Avg BP</span>
              </div>
              <p className={`text-3xl font-bold ${textColor}`}>{stats.avgSys}/{stats.avgDia}</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>mmHg</p>
            </div>
            <div className={`${cardBg} rounded-xl shadow-lg p-5`}>
              <div className="flex items-center gap-3 mb-2">
                <span style={{fontSize: '24px'}}>❤️</span>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Pulse</span>
              </div>
              <p className={`text-3xl font-bold ${textColor}`}>{stats.avgPulse}</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>bpm</p>
            </div>
            <div className={`${cardBg} rounded-xl shadow-lg p-5`}>
              <div className="flex items-center gap-3 mb-2">
                <span style={{fontSize: '24px'}}>📈</span>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Readings</span>
              </div>
              <p className={`text-3xl font-bold ${textColor}`}>{stats.total}</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>recorded</p>
            </div>
          </div>
        )}

        {/* ENHANCED CHARTS SECTION */}
        {showCharts && readings.length > 0 && (
          <div className="space-y-6 mb-6">
            {/* Trend Indicator */}
            {stats && readings.length >= 14 && (
              <div className={`${cardBg} rounded-2xl shadow-lg p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-lg font-bold ${textColor} mb-2`}>📈 Overall Trend</h3>
                    <p className={`text-3xl font-bold ${stats.trend === 'improving' ? 'text-green-600' : stats.trend === 'worsening' ? 'text-red-600' : 'text-yellow-600'}`}>
                      {stats.trend === 'improving' ? '↓ Improving' : stats.trend === 'worsening' ? '↑ Needs Attention' : '→ Stable'}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Compared to previous week</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Current Avg</p>
                    <p className={`text-3xl font-bold ${textColor}`}>{stats.avgSys}/{stats.avgDia}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Main Line Chart */}
            <div className={`${cardBg} rounded-2xl shadow-lg p-6`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-xl font-bold ${textColor}`}>📊 Blood Pressure Trends</h2>
                <div className="flex gap-2">
                  {['7days', '30days', '90days'].map(period => (
                    <button key={period} onClick={() => setChartPeriod(period)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${chartPeriod === period ? 'bg-blue-600 text-white' : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}`}>
                      {period === '7days' ? '7D' : period === '30days' ? '30D' : '90D'}
                    </button>
                  ))}
                </div>
              </div>

              {chartData.length > 0 && (
                <>
                  <div className="mb-8">
                    <div className="h-80 relative">
                      <svg width="100%" height="100%" viewBox="0 0 900 300" preserveAspectRatio="xMidYMid meet">
                        <line x1="60" y1="260" x2="850" y2="260" stroke={darkMode ? '#4b5563' : '#e5e7eb'} strokeWidth="2"/>
                        <line x1="60" y1="20" x2="60" y2="260" stroke={darkMode ? '#4b5563' : '#e5e7eb'} strokeWidth="2"/>
                        {[60, 80, 100, 120, 140, 160, 180, 200].map(val => (
                          <g key={val}>
                            <line x1="60" y1={260 - (val - 60) * 1.7} x2="850" y2={260 - (val - 60) * 1.7} 
                              stroke={darkMode ? '#374151' : '#f3f4f6'} strokeWidth="1" strokeDasharray="5,5"/>
                            <text x="45" y={265 - (val - 60) * 1.7} fill={darkMode ? '#9ca3af' : '#6b7280'} fontSize="12" textAnchor="end">{val}</text>
                          </g>
                        ))}
                        <rect x="60" y="20" width="790" height={260 - (140 - 60) * 1.7 - 20} fill={darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'} />
                        <rect x="60" y={260 - (140 - 60) * 1.7} width="790" height={(140 - 130) * 1.7} fill={darkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.05)'} />
                        <polyline points={chartData.map((r, i) => `${60 + (i * (790 / Math.max(chartData.length - 1, 1)))},${260 - (r.systolic - 60) * 1.7}`).join(' ')}
                          fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
                        <polyline points={chartData.map((r, i) => `${60 + (i * (790 / Math.max(chartData.length - 1, 1)))},${260 - (r.diastolic - 60) * 1.7}`).join(' ')}
                          fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round"/>
                        {chartData.map((r, i) => (
                          <g key={i}>
                            <circle cx={60 + (i * (790 / Math.max(chartData.length - 1, 1)))} cy={260 - (r.systolic - 60) * 1.7} r="5" fill="#ef4444" stroke="white" strokeWidth="2"/>
                            <circle cx={60 + (i * (790 / Math.max(chartData.length - 1, 1)))} cy={260 - (r.diastolic - 60) * 1.7} r="5" fill="#3b82f6" stroke="white" strokeWidth="2"/>
                          </g>
                        ))}
                      </svg>
                    </div>
                    <div className="flex justify-center gap-8 mt-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-1 bg-red-500 rounded"></div>
                        <span className={`text-sm ${textColor}`}>Systolic</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-1 bg-blue-500 rounded"></div>
                        <span className={`text-sm ${textColor}`}>Diastolic</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  {chartData.length >= 3 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Highest</p>
                        <p className={`text-xl font-bold ${textColor}`}>
                          {Math.max(...chartData.map(r => r.systolic))}/{Math.max(...chartData.map(r => r.diastolic))}
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Lowest</p>
                        <p className={`text-xl font-bold ${textColor}`}>
                          {Math.min(...chartData.map(r => r.systolic))}/{Math.min(...chartData.map(r => r.diastolic))}
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Average</p>
                        <p className={`text-xl font-bold ${textColor}`}>{stats.avgSys}/{stats.avgDia}</p>
                      </div>
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-yellow-50'}`}>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Readings</p>
                        <p className={`text-xl font-bold ${textColor}`}>{chartData.length}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Category Distribution */}
            {stats && (
              <div className={`${cardBg} rounded-2xl shadow-lg p-6`}>
                <h3 className={`text-lg font-bold ${textColor} mb-6`}>📊 Reading Distribution</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Normal', count: stats.categories.normal, color: 'bg-green-500', emoji: '✅' },
                    { label: 'Elevated', count: stats.categories.elevated, color: 'bg-yellow-500', emoji: '⚠️' },
                    { label: 'Stage 1', count: stats.categories.stage1, color: 'bg-orange-500', emoji: '🟠' },
                    { label: 'Stage 2', count: stats.categories.stage2, color: 'bg-red-500', emoji: '🔴' },
                    { label: 'Crisis', count: stats.categories.crisis, color: 'bg-red-700', emoji: '🚨' }
                  ].map(cat => {
                    const percentage = stats.total > 0 ? (cat.count / stats.total * 100) : 0;
                    return (
                      <div key={cat.label} className="flex items-center gap-3">
                        <span style={{fontSize: '24px'}}>{cat.emoji}</span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className={`text-sm font-medium ${textColor}`}>{cat.label}</span>
                            <span className={`text-sm font-bold ${textColor}`}>{cat.count} ({Math.round(percentage)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8">
                            <div className={`${cat.color} h-full rounded-full transition-all duration-500`} style={{width: `${Math.max(percentage, 3)}%`}}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Time of Day Analysis */}
            {timeStats.some(t => t.count > 0) && (
              <div className={`${cardBg} rounded-2xl shadow-lg p-6`}>
                <h3 className={`text-lg font-bold ${textColor} mb-6`}>🕐 BP by Time of Day</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {timeStats.map(slot => (
                    <div key={slot.time} className={`p-4 rounded-lg text-center ${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
                      <p className="text-3xl mb-2">{slot.time === 'morning' ? '🌅' : slot.time === 'afternoon' ? '☀️' : slot.time === 'evening' ? '🌆' : '🌙'}</p>
                      <p className={`text-xs font-medium ${textColor} mb-2`}>{slot.time.charAt(0).toUpperCase() + slot.time.slice(1)}</p>
                      {slot.count > 0 ? (
                        <>
                          <p className={`text-2xl font-bold ${textColor}`}>{slot.avgSys}/{slot.avgDia}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{slot.count} reading{slot.count > 1 ? 's' : ''}</p>
                        </>
                      ) : (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No data</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Reading Button */}
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl shadow-lg hover:shadow-xl mb-6 font-bold">
            ➕ Add New BP Reading
          </button>
        )}

        {/* Add Reading Form */}
        {showForm && (
          <div className={`${cardBg} rounded-2xl shadow-lg p-6 mb-6`}>
            <h3 className={`text-lg font-bold ${textColor} mb-4`}>New BP Reading</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>Systolic</label>
                <input type="number" value={formData.systolic} onChange={(e) => setFormData({...formData, systolic: e.target.value})}
                  className={`w-full px-4 py-3 border ${inputClass} rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`} placeholder="120" />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>Diastolic</label>
                <input type="number" value={formData.diastolic} onChange={(e) => setFormData({...formData, diastolic: e.target.value})}
                  className={`w-full px-4 py-3 border ${inputClass} rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`} placeholder="80" />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>Pulse</label>
                <input type="number" value={formData.pulse} onChange={(e) => setFormData({...formData, pulse: e.target.value})}
                  className={`w-full px-4 py-3 border ${inputClass} rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`} placeholder="72" />
              </div>
            </div>
            <div className="mb-4">
              <label className={`block text-sm font-medium ${textColor} mb-2`}>Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className={`w-full px-4 py-3 border ${inputClass} rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`} rows="2" placeholder="Optional notes" />
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.medication} onChange={(e) => setFormData({...formData, medication: e.target.checked})} className="w-5 h-5" />
                <span className={`text-sm ${textColor}`}>Took medication today</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold">Save Reading</button>
              <button onClick={() => setShowForm(false)} className={`px-6 py-3 border-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'} ${textColor} rounded-lg ${btnHover} font-bold`}>Cancel</button>
            </div>
          </div>
        )}

        {/* Readings List */}
        <div className="space-y-4">
          {readings.length === 0 ? (
            <div className={`${cardBg} rounded-2xl shadow-lg p-12 text-center`}>
              <div className="text-6xl mb-4">📅</div>
              <h3 className={`text-xl font-semibold ${textColor} mb-2`}>No readings yet</h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Add your first blood pressure reading to see charts and trends</p>
            </div>
          ) : (
            readings.map(reading => {
              const cat = getBPCategory(reading.systolic, reading.diastolic);
              return (
                <div key={reading.id} className={`${cardBg} rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-3xl font-bold ${textColor}`}>{reading.systolic}/{reading.diastolic}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${cat.color}`}>{cat.emoji} {cat.level}</span>
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                        ❤️ {reading.pulse} bpm | {reading.date} at {reading.time}
                        {reading.medication && <span className="ml-2 text-green-600 font-medium">✓ Medication</span>}
                      </div>
                      {reading.notes && <p className={`text-sm italic ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{reading.notes}</p>}
                    </div>
                    <button onClick={() => {
                      const updated = readings.filter(r => r.id !== reading.id);
                      setReadings(updated);
                      saveData(updated);
                    }} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info Footer */}
        <div className={`mt-8 ${darkMode ? 'bg-blue-900' : 'bg-blue-50'} rounded-xl p-6`}>
          <h3 className={`font-semibold ${textColor} mb-3`}>Understanding Your Numbers:</h3>
          <div className={`space-y-2 text-sm ${textColor}`}>
            <div className="flex gap-2"><span className="font-medium">Normal:</span><span>Less than 120/80</span></div>
            <div className="flex gap-2"><span className="font-medium">Elevated:</span><span>120-129/less than 80</span></div>
            <div className="flex gap-2"><span className="font-medium">Stage 1:</span><span>130-139/80-89</span></div>
            <div className="flex gap-2"><span className="font-medium">Stage 2:</span><span>140+/90+</span></div>
            <div className="flex gap-2"><span className="font-medium">Crisis:</span><span>180+/120+ - Emergency!</span></div>
          </div>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-4`}>⚠️ For tracking only. Consult your doctor.</p>
        </div>
      </div>
    </div>
  );
};

export default BPTracker;



