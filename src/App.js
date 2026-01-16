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

  const exportToPDF = () => {
    const averages = getAverages();
    const sortedReadings = [...readings].reverse();
    
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BP Report - ${patientName || 'Patient'}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
    h1 { color: #1e40af; }
    .summary { background: #eff6ff; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
    .reading { border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
    .bp-value { font-size: 24px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Blood Pressure Report</h1>
    <p><strong>Patient:</strong> ${patientName || 'Not Specified'}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString('en-NG')}</p>
  </div>
  ${averages ? `
  <div class="summary">
    <h2>7-Day Summary</h2>
    <p>Average BP: ${averages.avgSys}/${averages.avgDia} mmHg</p>
    <p>Average Pulse: ${averages.avgPulse} bpm</p>
    <p>Total Readings: ${readings.length}</p>
  </div>
  ` : ''}
  <h2>Reading History</h2>
  ${sortedReadings.map(r => `
    <div class="reading">
      <div class="bp-value">${r.systolic}/${r.diastolic}</div>
      <p>Pulse: ${r.pulse} bpm | ${r.date} at ${r.time}</p>
      ${r.notes ? `<p><em>${r.notes}</em></p>` : ''}
    </div>
  `).join('')}
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
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
    <div className={`min-h-screen ${theme.bg} p-4`}>
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
              <button onClick={() => setShowCharts(!showCharts)} className={`p-2 ${theme.hover} rounded-full`} title="Charts">
                <BarChart3 className={showCharts ? 'text-blue-600' : theme.textSecondary} size={24} />
              </button>
              <button onClick={exportToPDF} className={`p-2 ${theme.hover} rounded-full`} title="Export PDF" disabled={readings.length === 0}>
                <Download className={readings.length === 0 ? 'text-gray-400' : theme.textSecondary} size={24} />
              </button>
              <button onClick={toggleDarkMode} className={`p-2 ${theme.hover} rounded-full`}>
                {darkMode ? <Sun className="text-yellow-400" size={24} /> : <Moon className={theme.textSecondary} size={24} />}
              </button>
              <button onClick={() => setShowSettings(!showSettings)} className={`p-2 ${theme.hover} rounded-full`}>
                <User className={theme.textSecondary} size={24} />
              </button>
            </div>
          </div>

          {showSettings && (
            <div className={`border-t ${theme.border} pt-4 mt-4`}>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>Patient Name</label>
              <div className="flex gap-2">
                <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} 
                  placeholder="Enter name" className={`flex-1 px-4 py-2 border ${theme.input} rounded-lg`} />
                <button onClick={handleNameSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
              </div>
            </div>
          )}

          {patientName && !showSettings && (
            <p className={`${theme.text} mt-2`}><span className="font-medium">Patient:</span> {patientName}</p>
          )}
        </div>

        {showCharts && chartData.length > 0 && (
          <div className={`${theme.card} rounded-2xl shadow-lg p-6 mb-6`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-4`}>BP Trend (Last 30)</h2>
            <div className="h-64 flex items-center justify-center">
              <p className={theme.textSecondary}>Chart visualization here</p>
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
              <p className={`text-3xl font-bold ${theme.text}`}>{averages.avgSys}/{averages.avgDia}</p>
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
                <span className={`text-sm ${theme.textSecondary}`}>Total</span>
              </div>
              <p className={`text-3xl font-bold ${theme.text}`}>{readings.length}</p>
              <p className={`text-xs ${theme.textSecondary} mt-1`}>readings</p>
            </div>
          </div>
        )}

        {!showForm && (
          <button onClick={() => setShowForm(true)} 
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl shadow-lg mb-6 flex items-center justify-center gap-2 font-semibold">
            <Plus size={24} /> Add New Reading
          </button>
        )}

        {showForm && (
          <div className={`${theme.card} rounded-2xl shadow-lg p-6 mb-6`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-4`}>New BP Reading</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-2`}>Systolic</label>
                <input type="number" value={formData.systolic} onChange={(e) => setFormData({...formData, systolic: e.target.value})}
                  placeholder="120" className={`w-full px-4 py-3 border ${theme.input} rounded-lg text-lg`} />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-2`}>Diastolic</label>
                <input type="number" value={formData.diastolic} onChange={(e) => setFormData({...formData, diastolic: e.target.value})}
                  placeholder="80" className={`w-full px-4 py-3 border ${theme.input} rounded-lg text-lg`} />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-2`}>Pulse</label>
                <input type="number" value={formData.pulse} onChange={(e) => setFormData({...formData, pulse: e.target.value})}
                  placeholder="72" className={`w-full px-4 py-3 border ${theme.input} rounded-lg text-lg`} />
              </div>
            </div>
            <div className="mb-4">
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Optional notes" className={`w-full px-4 py-3 border ${theme.input} rounded-lg`} rows="2" />
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.medication} 
                  onChange={(e) => setFormData({...formData, medication: e.target.checked})} className="w-5 h-5" />
                <span className={`text-sm ${theme.text}`}>Took medication today</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold">
                Save Reading
              </button>
              <button onClick={() => setShowForm(false)} 
                className={`px-6 py-3 border-2 ${theme.border} ${theme.text} rounded-lg ${theme.hover} font-semibold`}>
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
              <p className={theme.textSecondary}>Add your first blood pressure reading</p>
            </div>
          ) : (
            readings.map((reading) => {
              const category = getBPCategory(reading.systolic, reading.diastolic);
              return (
                <div key={reading.id} className={`${theme.card} rounded-xl shadow-lg p-5`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-3xl font-bold ${theme.text}`}>{reading.systolic}/{reading.diastolic}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${category.color}`}>{category.level}</span>
                      </div>
                      <div className={`flex items-center gap-4 text-sm ${theme.textSecondary} mb-2`}>
                        <span className="flex items-center gap-1">
                          <Heart size={16} className="text-red-500" /> {reading.pulse} bpm
                        </span>
                        <span>{reading.date} at {reading.time}</span>
                        {reading.medication && <span className="text-green-600">✓ Medication</span>}
                      </div>
                      {reading.notes && <p className={`text-sm ${theme.textSecondary} italic mt-2`}>{reading.notes}</p>}
                      <div className={`mt-3 p-3 ${theme.infoBg} rounded-lg`}>
                        <p className={`text-sm ${theme.infoText}`}>{category.advice}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteReading(reading.id)} className="ml-4 text-red-500 hover:text-red-700 text-sm">Delete</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={`mt-8 ${theme.infoBg} rounded-xl p-6`}>
          <h3 className={`font-semibold ${theme.text} mb-3`}>BP Categories:</h3>
          <div className={`space-y-2 text-sm ${theme.text}`}>
            <div>Normal: Less than 120/80</div>
            <div>Elevated: 120-129/less than 80</div>
            <div>Stage 1: 130-139/80-89</div>
            <div>Stage 2: 140+/90+</div>
            <div>Crisis: 180+/120+ - Emergency!</div>
          </div>
          <p className={`text-xs ${theme.textSecondary} mt-4`}>⚠️ For tracking only. Consult your doctor.</p>
        </div>
      </div>
    </div>
  );
};

export default BPTracker;

