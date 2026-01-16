import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    const saved = localStorage.getItem('bp_readings');
    const savedName = localStorage.getItem('patient_name');
    const savedDark = localStorage.getItem('dark_mode');
    if (saved) setReadings(JSON.parse(saved));
    if (savedName) setPatientName(savedName);
    if (savedDark) setDarkMode(savedDark === 'true');
  }, []);

  const saveData = (data) => {
    localStorage.setItem('bp_readings', JSON.stringify(data));
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('dark_mode', String(newMode));
  };

  const getBPCategory = (sys, dia) => {
    if (sys < 120 && dia < 80) return { 
      level: 'Normal', 
      color: darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800', 
      advice: 'Keep it up!' 
    };
    if (sys < 130 && dia < 80) return { 
      level: 'Elevated', 
      color: darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800', 
      advice: 'Watch diet' 
    };
    if (sys < 140 || dia < 90) return { 
      level: 'Stage 1', 
      color: darkMode ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800', 
      advice: 'See doctor soon' 
    };
    if (sys < 180 && dia < 120) return { 
      level: 'Stage 2', 
      color: darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800', 
      advice: 'See doctor urgently' 
    };
    return { 
      level: 'Crisis', 
      color: darkMode ? 'bg-red-800 text-red-100' : 'bg-red-200 text-red-900', 
      advice: 'GO TO HOSPITAL NOW!' 
    };
  };

  const handleSubmit = () => {
    if (!formData.systolic || !formData.diastolic || !formData.pulse) return alert('Fill all fields');
    
    const newReading = {
      id: Date.now(),
      systolic: parseInt(formData.systolic),
      diastolic: parseInt(formData.diastolic),
      pulse: parseInt(formData.pulse),
      notes: formData.notes,
      medication: formData.medication,
      date: new Date().toLocaleDateString('en-NG'),
      time: new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [newReading, ...readings];
    setReadings(updated);
    saveData(updated);
    setFormData({ systolic: '', diastolic: '', pulse: '', notes: '', medication: false });
    setShowForm(false);
  };

  const exportToPDF = () => {
    const content = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>BP Report</title>
<style>body{font-family:Arial;max-width:800px;margin:40px auto;padding:20px}
.header{text-align:center;border-bottom:3px solid #2563eb;padding-bottom:20px}
.reading{border:1px solid #ddd;padding:15px;margin:10px 0;border-radius:8px}
.bp-value{font-size:24px;font-weight:bold}</style></head><body>
<div class="header"><h1>BP Report</h1><p>Patient: ${patientName || 'N/A'}</p>
<p>Date: ${new Date().toLocaleDateString('en-NG')}</p></div>
${readings.map(r => `<div class="reading"><div class="bp-value">${r.systolic}/${r.diastolic}</div>
<p>Pulse: ${r.pulse} | ${r.date} ${r.time}</p>${r.notes ? `<p><em>${r.notes}</em></p>` : ''}</div>`).join('')}
</body></html>`;
    const w = window.open('', '_blank');
    w.document.write(content);
    w.document.close();
    setTimeout(() => w.print(), 250);
  };

  const bgColor = darkMode ? 'bg-gray-900 text-gray-100' : 'bg-blue-50 text-gray-800';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const inputClass = darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-800';
  const btnHover = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';

  return (
    <div className={`min-h-screen ${bgColor} p-4 transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto">
        <div className={`${cardBg} rounded-2xl shadow-lg p-6 mb-6`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className={`text-2xl font-bold ${textColor}`}>❤️ BP Naija Tracker</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monitor your blood pressure</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportToPDF} disabled={!readings.length} 
                className={`p-2 ${btnHover} rounded-full transition-colors`} title="Export PDF">
                <span style={{fontSize: '24px'}} className={readings.length ? '' : 'opacity-40'}>⬇️</span>
              </button>
              <button onClick={toggleDarkMode} className={`p-2 ${btnHover} rounded-full transition-colors`}>
                <span style={{fontSize: '24px'}}>{darkMode ? '☀️' : '🌙'}</span>
              </button>
              <button onClick={() => setShowSettings(!showSettings)} className={`p-2 ${btnHover} rounded-full transition-colors`}>
                <span style={{fontSize: '24px'}}>👤</span>
              </button>
            </div>
          </div>

          {showSettings && (
            <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'} pt-4 mt-4`}>
              <label className={`block text-sm font-medium ${textColor} mb-2`}>Patient Name</label>
              <div className="flex gap-2">
                <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)}
                  className={`flex-1 px-4 py-2 border ${inputClass} rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  placeholder="Enter name" />
                <button onClick={() => {localStorage.setItem('patient_name', patientName); setShowSettings(false)}}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Save</button>
              </div>
            </div>
          )}

          {patientName && !showSettings && (
            <p className={`${textColor} mt-2`}><span className="font-medium">Patient:</span> {patientName}</p>
          )}
        </div>

        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transition-all mb-6 font-semibold">
            <span style={{fontSize: '20px'}}>➕</span> Add New Reading
          </button>
        )}

        {showForm && (
          <div className={`${cardBg} rounded-2xl shadow-lg p-6 mb-6`}>
            <h2 className={`text-xl font-bold ${textColor} mb-4`}>New BP Reading</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>Systolic</label>
                <input type="number" value={formData.systolic} 
                  onChange={(e) => setFormData({...formData, systolic: e.target.value})}
                  className={`w-full px-4 py-3 border ${inputClass} rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  placeholder="120" />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>Diastolic</label>
                <input type="number" value={formData.diastolic}
                  onChange={(e) => setFormData({...formData, diastolic: e.target.value})}
                  className={`w-full px-4 py-3 border ${inputClass} rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  placeholder="80" />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>Pulse</label>
                <input type="number" value={formData.pulse}
                  onChange={(e) => setFormData({...formData, pulse: e.target.value})}
                  className={`w-full px-4 py-3 border ${inputClass} rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  placeholder="72" />
              </div>
            </div>
            <div className="mb-4">
              <label className={`block text-sm font-medium ${textColor} mb-2`}>Notes</label>
              <textarea value={formData.notes} 
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className={`w-full px-4 py-3 border ${inputClass} rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                rows="2" placeholder="Optional notes" />
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.medication}
                  onChange={(e) => setFormData({...formData, medication: e.target.checked})} 
                  className="w-5 h-5 rounded" />
                <span className={`text-sm ${textColor}`}>Took medication today</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSubmit} 
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                Save Reading
              </button>
              <button onClick={() => setShowForm(false)} 
                className={`px-6 py-3 border-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'} ${textColor} rounded-lg ${btnHover} transition-colors font-semibold`}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {readings.length === 0 ? (
            <div className={`${cardBg} rounded-2xl shadow-lg p-12 text-center`}>
              <div className="text-6xl mb-4">📅</div>
              <h3 className={`text-xl font-semibold ${textColor} mb-2`}>No readings yet</h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Add your first blood pressure reading</p>
            </div>
          ) : (
            readings.map((reading) => {
              const cat = getBPCategory(reading.systolic, reading.diastolic);
              return (
                <div key={reading.id} className={`${cardBg} rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow`}>
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-3xl font-bold ${textColor}`}>{reading.systolic}/{reading.diastolic}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${cat.color}`}>{cat.level}</span>
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                        <span>❤️ {reading.pulse} bpm</span> | 
                        <span> {reading.date} at {reading.time}</span>
                        {reading.medication && <span> | ✓ Medication</span>}
                      </div>
                      {reading.notes && <p className={`text-sm italic mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{reading.notes}</p>}
                      <div className={`mt-3 p-3 rounded-lg ${darkMode ? 'bg-blue-900' : 'bg-blue-50'}`}>
                        <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>ℹ️ {cat.advice}</p>
                      </div>
                    </div>
                    <button onClick={() => {
                      const updated = readings.filter(r => r.id !== reading.id);
                      setReadings(updated);
                      saveData(updated);
                    }} className="ml-4 text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={`mt-8 rounded-xl p-6 ${darkMode ? 'bg-blue-900' : 'bg-blue-50'}`}>
          <h3 className={`font-semibold ${textColor} mb-3`}>BP Categories:</h3>
          <div className={`space-y-1 text-sm ${textColor}`}>
            <div>✅ Normal: &lt;120/80</div>
            <div>⚠️ Elevated: 120-129/&lt;80</div>
            <div>🟠 Stage 1: 130-139/80-89</div>
            <div>🔴 Stage 2: 140+/90+</div>
            <div>🚨 Crisis: 180+/120+ - Emergency!</div>
          </div>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-4`}>⚠️ For tracking only. Consult your doctor.</p>
        </div>
      </div>
    </div>
  );
};

export default BPTracker;



