from pathlib import Path

updated_cutoptimizer_code = """
import React, { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const PRIMARY = '#61CE70';
const ACCENT = '#2C3E50';

function CutOptimizer() {
  const [units, setUnits] = useState('mm');
  const [showTooltip, setShowTooltip] = useState('');
  const [settings, setSettings] = useState({
    kerf: '',
    thickness: '',
    labelEnabled: false,
    group: '',
    price: '',
    priority: '',
    trimEnabled: false,
    trimLeft: '',
    trimRight: '',
    minimizeLayouts: false,
  });

  const [stock, setStock] = useState([{ length: '', quantity: '', label: '' }]);
  const [parts, setParts] = useState([{ length: '', quantity: '', label: '' }]);
  const [result, setResult] = useState(null);

  const tooltips = {
    kerf: "Leave empty if thickness of the cut is not needed.",
    groups: "Groups feature is useful when you want to use different material types...",
    prices: "Define price per piece. Helps with cost optimization.",
    trim: "Leave empty if left trim cut is not needed.",
    layouts: "Reduces total layouts used (premium/admin only)."
  };

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleStockChange = (i, field, value) => {
    const updated = [...stock];
    updated[i][field] = value;
    setStock(updated);
  };

  const addStockRow = () => {
    setStock([...stock, { length: '', quantity: '', label: '' }]);
  };

  const handlePartChange = (i, field, value) => {
    const updated = [...parts];
    updated[i][field] = value;
    setParts(updated);
  };

  const deletePart = (i) => {
    setParts(parts.filter((_, idx) => idx !== i));
  };

  const addRows = (count) => {
    const newRows = Array.from({ length: count }, () => ({ length: '', quantity: '', label: '' }));
    setParts([...parts, ...newRows]);
  };

  const calculate = async () => {
    try {
      const expandedCuts = parts.flatMap(p =>
        Array.from({ length: Number(p.quantity || 1) }, () =>
          Number(p.length) - (Number(settings.trimLeft || 0) + Number(settings.trimRight || 0) + Number(settings.kerf || 0))
        )
      );
      const expandedStock = stock.flatMap(s => {
        const qty = Number(s.quantity);
        const times = qty > 0 ? qty : 1;
        return Array.from({ length: times }, () => Number(s.length));
      });
      const payload = {
        cuts: expandedCuts,
        stock: expandedStock,
        kerf: Number(settings.kerf),
        minimizeLayouts: settings.minimizeLayouts,
      };
      const res = await axios.post('http://localhost:3001/api/optimize', payload);
      setResult(res.data);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Cut List Result', 14, 16);
    const tableData = result.stock.map(s => [
      s.id,
      s.original,
      s.cuts.join(', '),
      s.remaining
    ]);
    doc.autoTable({
      head: [['Stock #', 'Original Length', 'Cuts', 'Remaining']],
      body: tableData,
      startY: 20
    });
    doc.save('cut-list.pdf');
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(result.stock.map(s => ({
      StockID: s.id,
      OriginalLength: s.original,
      Cuts: s.cuts.join(', '),
      Remaining: s.remaining
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CutList');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), 'cut-list.xlsx');
  };

  return (
    <div style={{ fontFamily: 'Arial', maxWidth: '1200px', margin: 'auto', padding: '2rem' }}>
      <img src="/logotype.png" alt="Logo" style={{ height: '60px', marginBottom: '1rem' }} />
      <h2 style={{ color: PRIMARY }}>Linear Cut List Optimizer</h2>
      <p style={{ color: ACCENT }}>
        Use OptiSmart to calculate the most efficient way to cut linear material such as lumber, pipes, tubes, bars, or beams with minimal waste.
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <label><strong>Units: </strong></label>
        <select value={units} onChange={(e) => setUnits(e.target.value)}>
          <option value="mm">Millimeters (mm)</option>
          <option value="cm">Centimeters (cm)</option>
          <option value="in">Inches (in)</option>
          <option value="ft">Feet (ft)</option>
        </select>
      </div>

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '1.5rem',
        background: '#f4f4f4', padding: '1rem', borderRadius: '8px',
        marginBottom: '2rem', border: `1px solid ${PRIMARY}`
      }}>
        {[
          { label: 'Kerf / Blade thickness', field: 'kerf', type: 'number', tip: 'kerf' },
          { label: 'Thickness of the cut', field: 'thickness', type: 'text' },
          { label: 'Labels', field: 'labelEnabled', type: 'checkbox' },
          { label: 'Material Groups', field: 'group', type: 'text', tip: 'groups' },
          { label: 'Prices', field: 'price', type: 'text', tip: 'prices' },
          { label: 'Prioritization', field: 'priority', type: 'text' },
          {
            label: 'Trim edges', custom: (
              <>
                <input type="checkbox" checked={settings.trimEnabled}
                  onChange={e => handleSettingChange('trimEnabled', e.target.checked)} />
                {settings.trimEnabled && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <input placeholder="Left trim" type="number"
                      value={settings.trimLeft}
                      onChange={e => handleSettingChange('trimLeft', e.target.value)} />
                    <input placeholder="Right trim" type="number"
                      value={settings.trimRight}
                      onChange={e => handleSettingChange('trimRight', e.target.value)} />
                  </div>
                )}
              </>
            ), tip: 'trim'
          },
          { label: 'Minimize cutting layouts', field: 'minimizeLayouts', type: 'checkbox', tip: 'layouts' }
        ].map((item, idx) => (
          <div key={idx} style={{ flex: '1 1 250px', minWidth: '200px' }}>
            <label style={{ fontWeight: 'bold' }}>
              {item.label}
              {item.tip && (
                <span
                  onClick={() => setShowTooltip(showTooltip === item.tip ? '' : item.tip)}
                  style={{ marginLeft: 5, cursor: 'pointer', color: '#333' }}
                >❓</span>
              )}
            </label>
            <div>
              {item.custom ? item.custom : (
                item.type === 'checkbox' ?
                  <input type="checkbox" checked={settings[item.field]} onChange={e => handleSettingChange(item.field, e.target.checked)} />
                  :
                  <input type={item.type} value={settings[item.field]} onChange={e => handleSettingChange(item.field, e.target.value)} />
              )}
            </div>
            {item.tip && showTooltip === item.tip && (
              <div style={{
                backgroundColor: '#fff', border: '1px solid #ccc', padding: '0.5rem',
                marginTop: '0.25rem', borderRadius: '5px', fontSize: '0.85rem'
              }}>
                {tooltips[item.tip]}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card mb-4" style={{ border: `1px solid ${PRIMARY}`, padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3 style={{ textAlign: 'left' }}>Available Stock</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>#</th>
              <th style={{ textAlign: 'left' }}>Length</th>
              <th style={{ textAlign: 'left' }}>Quantity (optional)</th>
              <th style={{ textAlign: 'left' }}>Label</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((s, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td><input type="number" value={s.length} onChange={e => handleStockChange(i, 'length', e.target.value)} /></td>
                <td><input type="number" value={s.quantity} onChange={e => handleStockChange(i, 'quantity', e.target.value)} /></td>
                <td><input type="text" value={s.label} onChange={e => handleStockChange(i, 'label', e.target.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addStockRow}>+ Add Stock Row</button>
      </div>

      <div className="card mb-4" style={{ border: `1px solid ${PRIMARY}`, padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3 style={{ textAlign: 'left' }}>Required Parts</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>#</th>
              <th style={{ textAlign: 'left' }}>Length</th>
              <th style={{ textAlign: 'left' }}>Quantity</th>
              <th style={{ textAlign: 'left' }}>Label</th>
              <th style={{ textAlign: 'left' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td><input type="number" value={p.length} onChange={e => handlePartChange(i, 'length', e.target.value)} /></td>
                <td><input type="number" value={p.quantity} onChange={e => handlePartChange(i, 'quantity', e.target.value)} /></td>
                <td><input type="text" value={p.label} onChange={e => handlePartChange(i, 'label', e.target.value)} /></td>
                <td><button onClick={() => deletePart(i)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div>
          <button onClick={() => addRows(1)}>+ Add 1 row</button>
          <span style={{ marginLeft: '1rem' }}>Add multiple rows:</span>
          {[5, 10, 15, 20].map(n => (
            <button key={n} onClick={() => addRows(n)} style={{ marginLeft: '0.5rem' }}>+{n}</button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button onClick={calculate} style={{ background: PRIMARY, color: 'white', padding: '0.5rem 1rem', marginRight: '1rem', border: 'none', borderRadius: '5px' }}>Calculate</button>
        <button onClick={() => alert('Feedback coming soon')} style={{ background: ACCENT, color: 'white', padding: '0.5rem 1rem', marginRight: '1rem', border: 'none', borderRadius: '5px' }}>Feedback</button>
        {result && (
          <>
            <button onClick={exportToPDF} style={{ marginLeft: '1rem' }}>Export to PDF</button>
            <button onClick={exportToExcel} style={{ marginLeft: '1rem' }}>Export to Excel</button>
          </>
        )}
      </div>
    </div>
  );
}

export default CutOptimizer;
"""

# Save to file
cutoptimizer_path = Path("/mnt/data/CutOptimizer.jsx")
cutoptimizer_path.write_text(updated_cutoptimizer_code)
cutoptimizer_path.name
