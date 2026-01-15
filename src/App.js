import React, { useState, useEffect } from 'react';
import { Heart, Plus, TrendingUp, Calendar, AlertCircle, User, Activity, Moon, Sun, Download, BarChart3 } from 'lucide-react';

const BPTracker = () => {
  const [readings, setReadings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    systolic: '',
    diastolic: '',
    pulse: '',
    notes: '',
    medication: false
  });
  const [patientName, setPatientName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedReadings = await window.storage.get('bp_readings');
      const storedName = await window.storage.get('patient_name');
      const storedDarkMode = await window.storage.get('dark_mode');
      
      if (storedReadings) {
        setReadings(JSON.parse(storedReadings.value));
      }
      if (storedName) {
        setPatientName(storedName.value);
      }
      if (storedDarkMode) {
        setDarkMode(storedDarkMode.value === 'true');
      }
    } catch (error) {
      console.log('No previous data found');
    }
  };

  const saveData = async (newReadings) => {
    try {
      await window.storage.set('bp_readings', JSON.stringify(newReadings));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const saveName = async (name) => {
    try {
      await window.storage.set('patient_name', name);
    } catch (error) {
      console.error('Error saving name:', error);
    }
  };

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    try {
      await window.storage.set('dark_mode', String(newMode));
    } catch (error) {
      console.error('Error saving dark mode:', error);
    }
  };

  const getBPCategory = (sys, dia) => {
    if (sys < 120 && dia < 80) return { 
      level: 'Normal', 
      color: darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800', 
      advice: 'Keep up the good work!' 
    };
    if (sys < 130 && dia < 80) return { 
      level: 'Elevated', 
      color: darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800', 
      advice: 'Watch your diet, reduce salt' 
    };
    if (sys < 140 || dia < 90) return { 
      level: 'Stage 1', 
      color: darkMode ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800', 
      advice: 'See doctor soon, lifestyle changes needed' 
    };
    if (sys < 180 && dia < 120) return { 
      level: 'Stage 2', 
      color: darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800', 
      advice: 'See doctor urgently, medication likely needed' 
    };
    return { 
      level: 'Crisis', 
      color: darkMode ? 'bg-red-800 text-red-100' : 'bg-red-200 text-red-900', 
      advice: 'GO TO HOSPITAL NOW! Emergency!' 
    };
  };

  const handleSubmit = () => {
    if (!formData.systolic || !formData.diastolic || !formData.pulse) {
      alert('Please fill in all BP and pulse values');
      return;
    }
    
    const newReading = {
      id: Date.now(),
      systolic: parseInt(formData.systolic),
      diastolic: parseInt(formData.diastolic),
      pulse: parseInt(formData.pulse),
      notes: formData.notes,
      medication: formData.medication,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-NG'),
      time: new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedReadings = [newReading, ...readings];
    setReadings(updatedReadings);
    saveData(updatedReadings);
    
    setFormData({ systolic: '', diastolic: '', pulse: '', notes: '', medication: false });
    setShowForm(false);
  };

  const deleteReading = async (id) => {
    const updatedReadings = readings.filter(r => r.id !== id);
    setReadings(updatedReadings);
    await saveData(updatedReadings);
  };

  const getAverages = () => {
    if (readings.length === 0) return null;
    const recent = readings.slice(0, 7);
    const avgSys = Math.round(recent.reduce((sum, r) => sum + r.systolic, 0) / recent.length);
    const avgDia = Math.round(recent.reduce((sum, r) => sum + r.diastolic, 0) / recent.length);
    const avgPulse = Math.round(recent.reduce((sum, r) => sum + r.pulse, 0) / recent.length);
    return { avgSys, avgDia, avgPulse };
  };

  const handleNameSave = () => {
    saveName(patientName);
    setShowSettings(false);
  };

  // PDF EXPORT FUNCTION - THIS IS THE PDF FEATURE!
  const exportToPDF = () => {
    const averages = getAverages();
    const sortedReadings = [...readings].reverse();
    
    let pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BP Tracker Report - ${patientName || 'Patient'}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
    .header h1 { color: #1e40af; margin: 0; }
    .header p { color: #64748b; margin: 5px 0; }
    .summary { background: #eff6ff; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px; }
    .stat-box { text-align: center; background: white; padding: 15px; border-radius: 8px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }
    .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; }
    .reading { border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
    .reading-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .bp-value { font-size: 28px; font-weight: bold; color: #1f2937; }
    .badge { padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block; }
    .badge-normal { background: #d1fae5; color: #065f46; }
    .badge-elevated { background: #fef3c7; color: #92400e; }
    .badge-stage1 { background: #fed7aa; color: #9a3412; }
    .badge-stage2 { background: #fecaca; color: #991b1b; }
    .badge-crisis { background: #fca5a5; color: #7f1d1d; }
    .reading-details { color: #64748b; font-size: 14px; margin-top: 10px; }
    .notes { background: #f9fafb; padding: 10px; border-radius: 5px; margin-top: 10px; font-style: italic; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #64748b; font-size: 12px; }
    .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    @media print { body { margin: 0; padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🫀 Blood Pressure Report</h1>
    <p><strong>Patient:</strong> ${patientName || 'Not Specified'}</p>
    <p><strong>Report Generated:</strong> ${new Date().toLocaleString('en-NG')}</p>
    <p><strong>Total Readings:</strong> ${readings.length}</p>
  </div>

  ${averages ? `
  <div class="summary">
    <h2 style="margin-top: 0; color: #1e40af;">7-Day Summary</h2>
    <div class="summary-grid">
      <div class="stat-box">
        <div class="stat-value">${averages.avgSys}/${averages.avgDia}</div>
        <div class="stat-label">Average BP (mmHg)</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${averages.avgPulse}</div>
        <div class="stat-label">Average Pulse (bpm)</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${readings.length}</div>
        <div class="stat-label">Total Readings</div>
      </div>
    </div>
  </div>
  ` : ''}

  <h2 style="color: #1e40af; margin-bottom: 20px;">Reading History</h2>

  ${sortedReadings.map(reading => {
    const category = getBPCategory(reading.systolic, reading.diastolic);
    const badgeClass = category.level === 'Normal' ? 'badge-normal' :
                       category.level === 'Elevated' ? 'badge-elevated' :
                       category.level === 'Stage 1' ? 'badge-stage1' :
                       category.level === 'Stage 2' ? 'badge-stage2' : 'badge-crisis';
    
    return `
    <div class="reading">
      <div class="reading-header">
        <div class="bp-value">${reading.systolic}/${reading.diastolic}</div>
        <span class="badge ${badgeClass}">${category.level}</span>
      </div>
      <div class="reading-details">
        <div>❤️ Pulse: <strong>${reading.pulse} bpm</strong></div>
        <div>📅 ${reading.date} at ${reading.time}</div>
        ${reading.medication ? '<div>💊 Medication taken</div>' : ''}
      </div>
      ${reading.notes ? `<div class="notes">📝 ${reading.notes}</div>` : ''}
      <div class="info-box" style="margin-top: 10px; font-size: 13px;">
        <strong>Advice:</strong> ${category.advice}
      </div>
    </div>
    `;
  }).join('')}

  <div class="info-box">
    <h3 style="margin-top: 0;">Blood Pressure Categories:</h3>
    <ul style="margin: 10px 0;">
      <li><strong>Normal:</strong> Less than 120/80 mmHg</li>
      <li><strong>Elevated:</strong> 120-129/less than 80 mmHg</li>
      <li><strong>Stage 1 Hypertension:</strong> 130-139/80-89 mmHg</li>
      <li><strong>Stage 2 Hypertension:</strong> 140+/90+ mmHg</li>
      <li><strong>Hypertensive Crisis:</strong> 180+/120+ mmHg - Seek emergency care!</li>
    </ul>
  </div>

  <div class="footer">
    <p><strong>⚠️ Medical Disclaimer:</strong> This report is for tracking purposes only and does not replace professional medical advice.</p>
    <p>Generated by BP Naija Tracker | Always consult your healthcare provider</p>
  </div>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const averages = getAverages();

  const theme = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-green-50',
    card: darkMode ? 'bg-gray-800' : 'bg-white',
    text: darkMode ? 'text-gray-100' : 'text-gray-800',
    textSecondary: darkMode ? 'text-gray-400' : 'text-gray-600',
    border: darkMode ? 'border-gray-700' : 'border-gray-300',
    input: darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900',
    hover: darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
    infoBg: darkMode ? 'bg-blue-900' : 'bg-blue-50',
    infoText: darkMode ? 'text-blue-200' : 'text-blue-800'
  };

  const chartData = readings.slice(0, 30).reverse();

  return (
    <div className={`min-h-screen ${theme.bg} p-4 transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto">
        <div className={`${theme.card} rounded-2xl shadow-lg p-6 mb-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-full">
                <Heart className="text-red-600" size={28} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${theme.text}`}>BP Naija Tracker</h1>
                <p className={`text-sm ${theme.textSecondary}`}>Monitor your blood pressure</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* CHART BUTTON - THIS SHOWS/HIDES GRAPHS! */}
              <button 
                onClick={() => setShowCharts(!showCharts)}
                className={`p-2 ${theme.hover} rounded-full transition-colors`}
                title="View Charts"
              >
                <BarChart3 className={showCharts ? 'text-blue-600' : theme.textSecondary} size={24} />
              </button>
              
              {/* PDF EXPORT BUTTON - THIS CREATES PDF! */}
              <button 
                onClick={exportToPDF}
                className={`p-2 ${theme.hover} rounded-full transition-colors`}
                title="Export to PDF"
                disabled={readings.length === 0}
              >
                <Download className={readings.length === 0 ? 'text-gray-400' : theme.textSecondary} size={24} />
              </button>
              
              <button 
                onClick={toggleDarkMode}
                className={`p-2 ${theme.hover} rounded-full transition-colors`}
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {darkMode ? <Sun className="text-yellow-400" size={24} /> : <Moon className={theme.textSecondary} size={24} />}
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 ${theme.hover} rounded-full transition-colors`}
              >
                <User className={theme.textSecondary} size={24} />
              </button>
            </div>
          </div>

          {showSettings && (
            <div className={`border-t ${theme.border} pt-4 mt-4`}>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Patient Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter your name"
                  className={`flex-1 px-4 py-2 border ${theme.input} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                <button
                  onClick={handleNameSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {patientName && !showSettings && (
            <p className={`${theme.text} mt-2`}>
              <span className="font-medium">Patient:</span> {patientName}
            </p>
          )}
        </div>

        {/* CHARTS SECTION - THIS IS WHERE GRAPHS APPEAR! */}
        {showCharts && chartData.length > 0 && (
          <div className={`${theme.card} rounded-2xl shadow-lg p-6 mb-6`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-4`}>BP Trend (Last 30 Readings)</h2>
            
            <div className="mb-8">
              <h3 className={`text-sm font-semibold ${theme.text} mb-3`}>Blood Pressure</h3>
              <div className="relative h-64">
                <svg width="100%" height="100%" viewBox="0 0 800 250" preserveAspectRatio="xMidYMid meet">
                  <line x1="50" y1="220" x2="750" y2="220" stroke={darkMode ? '#4b5563' : '#e5e7eb'} strokeWidth="2"/>
                  <line x1="50" y1="20" x2="50" y2="220" stroke={darkMode ? '#4b5563' : '#e5e7eb'} strokeWidth="2"/>
                  
                  {[60, 80, 100, 120, 140, 160, 180].map((val) => (
                    <g key={val}>
                      <line x1="50" y1={220 - (val - 60) * 1.6} x2="750" y2={220 - (val - 60) * 1.6} 
                            stroke={darkMode ? '#374151' : '#f3f4f6'} strokeWidth="1" strokeDasharray="5,5"/>
                      <text x="35" y={225 - (val - 60) * 1.6} fill={darkMode ? '#9ca3af' : '#6b7280'} fontSize="12" textAnchor="end">{val}</text>
                    </g>
                  ))}
                  
                  <polyline
                    points={chartData.map((r, i) => `${50 + (i * (700 / (chartData.length - 1)))},${220 - (r.systolic - 60) * 1.6}`).join(' ')}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                  />
                  <polyline
                    points={chartData.map((r, i) => `${50 + (i * (700 / (chartData.length - 1)))},${220 - (r.diastolic - 60) * 1.6}`).join(' ')}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />
                  
                  {chartData.map((r, i) => (
                    <g key={i}>
                      <circle cx={50 + (i * (700 / (chartData.length - 1)))} cy={220 - (r.systolic - 60) * 1.6} 
                              r="4" fill="#ef4444"/>
                      <circle cx={50 + (i * (700 / (chartData.length - 1)))} cy={220 - (r.diastolic - 60) * 1.6} 
                              r="4" fill="#3b82f6"/>
                    </g>
                  ))}
                </svg>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className={`text-sm ${theme.text}`}>Systolic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className={`text-sm ${theme.text}`}>Diastolic</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className={`text-sm font-semibold ${theme.text} mb-3`}>Heart Rate (Pulse)</h3>
              <div className="relative h-48">
                <svg width="100%" height="100%" viewBox="0 0 800 180" preserveAspectRatio="xMidYMid meet">
                  <line x1="50" y1="160" x2="750" y2="160" stroke={darkMode ? '#4b5563' : '#e5e7eb'} strokeWidth="2"/>
                  <line x1="50" y1="20" x2="50" y2="160" stroke={darkMode ? '#4b5563' : '#e5e7eb'} strokeWidth="2"/>
                  
                  {[50, 70, 90, 110, 130].map((val) => (
                    <g key={val}>
                      <line x1="50" y1={160 - (val - 50) * 1.5} x2="750" y2={160 - (val - 50) * 1.5} 
                            stroke={darkMode ? '#374151' : '#f3f4f6'} strokeWidth="1" strokeDasharray="5,5"/>
                      <text x="35" y={165 - (val - 50) * 1.5} fill={darkMode ? '#9ca3af' : '#6b7280'} fontSize="12" textAnchor="end">{val}</text>
                    </g>
                  ))}
                  
                  <polyline
                    points={chartData.map((r, i) => `${50 + (i * (700 / (chartData.length - 1)))},${160 - (r.pulse - 50) * 1.5}`).join(' ')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                  />
                  
                  {chartData.map((r, i) => (
                    <circle key={i} cx={50 + (i * (700 / (chartData.length - 1)))} cy={160 - (r.pulse - 50) * 1.5} 
                            r="4" fill="#10b981"/>
                  ))}
                </svg>
              </div>
              <div className="flex justify-center mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className={`text-sm ${theme.text}`}>Pulse (bpm)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {averages && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`${theme.card} rounded-xl shadow p-4`}>
              <div className="flex items-center gap-3 mb-2">
                <Activity className="text-blue-600" size={20} />
                <span className={`text-sm ${theme.textSecondary}`}>7-Day Average</span>
              </div>
              <p className={`text-3xl font-bold ${theme.text}`}>
                {averages.avgSys}/{averages.avgDia}
              </p>
              <p className={`text-xs ${theme.textSecondary} mt-1`}>mmHg</p>
            </div>
            
            <div className={`${theme.card} rounded-xl shadow p-4`}>
              <div className="flex items-center gap-3 mb-2">
                <Heart className="text-red-600" size={20} />
                <span className={`text-sm ${theme.textSecondary}`}>Avg Pulse</span>
              </div>
              <p className={`text-3xl font-bold ${theme.text}`}>{averages.avgPulse}</p>
              <p className={`text-xs ${theme.textSecondary} mt-1`}>bpm</p>
            </div>
            
            <div className={`${theme.card} rounded-xl shadow p-4`}>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="text-green-600" size={20} />
                <span className={`text-sm ${theme.textSecondary}`}>Total Readings</span>
              </div>
              <p className={`text-3xl font-bold ${theme.text}`}>{readings.length}</p>
              <p className={`text-xs ${theme.textSecondary} mt-1`}>recorded</p>
            </div>
          </div>
        )}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transition-all mb-6 flex items-center justify-center gap-2 font-semibold"
          >
            <Plus size={24} />
            Add New Reading
          </button>
        )}

        {showForm && (
          <div className={`${theme.card} rounded-2xl shadow-lg p-6 mb-6`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-4`}>New BP Reading</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                  Pulse (Heart Rate)
                </label>
                <input
                  type="number"
                  value={formData.pulse}
                  onChange={(e) => setFormData({...formData, pulse: e.target.value})}
                  placeholder="72"
                  className={`w-full px-4 py-3 border ${theme.input} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg`}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="E.g., After exercise, feeling stressed, etc."
                className={`w-full px-4 py-3 border ${theme.input} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                rows="2"
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.medication}
                  onChange={(e) => setFormData({...formData, medication: e.target.checked})}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className={`text-sm ${theme.text}`}>I took my medication today</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Save Reading
              </button>
              <button
                onClick={() => setShowForm(false)}
                className={`px-6 py-3 border-2 ${theme.border} ${theme.text} rounded-lg ${theme.hover} transition-colors font-semibold`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {readings.length === 0 ? (
            <div className={`${theme.card} rounded-2xl shadow-lg p-12 text-center`}>
              <Calendar className={`mx-auto ${theme.textSecondary} mb-4`} size={48} />
              <h3 className={`text-xl font-semibold ${theme.textSecondary} mb-2`}>No readings yet</h3>
              <p className={theme.textSecondary}>Start tracking your blood pressure by adding your first reading</p>
            </div>
          ) : (
            readings.map((reading) => {
              const category = getBPCategory(reading.systolic, reading.diastolic);
              return (
                <div key={reading.id} className={`${theme.card} rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-3xl font-bold ${theme.text}`}>
                          {reading.systolic}/{reading.diastolic}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${category.color}`}>
                          {category.level}
                        </span>
                      </div>
                      <div className={`flex items-center gap-4 text-sm ${theme.textSecondary} mb-2`}>
                        <span className="flex items-center gap-1">
                          <Heart size={16} className="text-red-500" />
                          {reading.pulse} bpm
                        </span>
                        <span>{reading.date} at {reading.time}</span>
                        {reading.medication && (
                          <span className="text-green-600 font-medium">✓ Medication taken</span>
                        )}
                      </div>
                      {reading.notes && (
                        <p className={`text-sm ${theme.textSecondary} italic mt-2`}>{reading.notes}</p>
                      )}
                      <div className={`flex items-start gap-2 mt-3 p-3 ${theme.infoBg} rounded-lg`}>
                        <AlertCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className={`text-sm ${theme.infoText}`}>{category.advice}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteReading(reading.id)}
                      className="ml-4 text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={`mt-8 ${theme.infoBg} rounded-xl p-6`}>
          <h3 className={`font-semibold ${theme.text} mb-3`}>Understanding Your Numbers:</h3>
          <div className={`space-y-2 text-sm ${theme.text}`}>
            <div className="flex gap-2">
              <span className="font-medium">Normal:</span>
              <span>Less than 120/80</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">Elevated:</span>
              <span>120-129/less than 80</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">Stage 1:</span>
              <span>130-139/80-89</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">Stage 2:</span>
              <span>140+/90+</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">Crisis:</span>
              <span>180+/120+ - Seek emergency care!</span>
            </div>
          </div>
          <p className={`text-xs ${theme.textSecondary} mt-4`}>
            ⚠️ This app is for tracking only. Always consult your doctor for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BPTracker;theme.text} mb-2`}>
                  Systolic (Top Number)
                </label>
                <input
                  type="number"
                  value={formData.systolic}
                  onChange={(e) => setFormData({...formData, systolic: e.target.value})}
                  placeholder="120"
                  className={`w-full px-4 py-3 border ${theme.input} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                  Diastolic (Bottom Number)
                </label>
                <input
                  type="number"
                  value={formData.diastolic}
                  onChange={(e) => setFormData({...formData, diastolic: e.target.value})}
                  placeholder="80"
                  className={`w-full px-4 py-3 border ${theme.input} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${
