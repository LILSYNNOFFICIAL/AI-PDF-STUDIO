import React, { useState } from 'react';
import { Table as TableIcon, PieChart, Image as ImageIcon, PenTool, X, Plus, Trash2, Check } from 'lucide-react';
import { DocumentModel } from '../types/document';
import { insertTableBlock, insertChartBlock } from '../orchestrator/orchestrator';

interface InsertObjectModalProps {
  document: DocumentModel;
  isOpen: boolean;
  defaultTab?: 'table' | 'chart' | 'image' | 'signature';
  onClose: () => void;
  onApplyUpdate: (updatedDoc: DocumentModel, summaryText: string) => void;
}

export const InsertObjectModal: React.FC<InsertObjectModalProps> = ({
  document,
  isOpen,
  defaultTab = 'table',
  onClose,
  onApplyUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'table' | 'chart' | 'image' | 'signature'>(defaultTab);
  const [targetSectionId, setTargetSectionId] = useState<string>(document.sections[0]?.id || '');

  // Table form state
  const [tableTitle, setTableTitle] = useState('Commercial Payout & Allocation Schedule');
  const [tableCaption, setTableCaption] = useState('Table: Verified contractual terms');
  const [headers, setHeaders] = useState<string[]>(['Party / Entity', 'Role', 'Share (%)', 'Payout Term']);
  const [rowCount, setRowCount] = useState<number>(3);

  // Chart form state
  const [chartTitle, setChartTitle] = useState('Revenue & Ownership Breakdown');
  const [chartType, setChartType] = useState<'donut' | 'bar' | 'pie' | 'line'>('donut');
  const [chartLabels, setChartLabels] = useState<string[]>(['Primary Licensor', 'Co-Producer', 'Publishing Reserve']);
  const [chartValues, setChartValues] = useState<number[]>([50, 35, 15]);
  const [chartUnit, setChartUnit] = useState('%');

  // Image form state
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80');
  const [imageCaption, setImageCaption] = useState('Official Studio Master Recording Seal & Archival Stamp');
  const [isInsertingImage, setIsInsertingImage] = useState(false);

  // Signature form state
  const [partyRole, setPartyRole] = useState('EXECUTIVE WITNESS / LEGAL COUNSEL');
  const [partyName, setPartyName] = useState('Jonathan Reynolds, Esq.');
  const [partyTitle, setPartyTitle] = useState('General Counsel');
  const [partyCompany, setPartyCompany] = useState('Reynolds & Associates LLP');

  if (!isOpen) return null;

  // Insert Table
  const handleInsertTable = () => {
    if (!targetSectionId) return;
    const initialRows: string[][] = Array.from({ length: rowCount }).map((_, rIdx) => 
      headers.map((h, cIdx) => `Data ${rIdx + 1}.${cIdx + 1}`)
    );
    // Preset mock content for nicer demo
    if (initialRows[0]) initialRows[0] = ['Primary Producer (Syntient)', 'Composition / Beat', '50.0%', 'Monthly Direct'];
    if (initialRows[1]) initialRows[1] = ['Featured Vocalist (Elena)', 'Topline & Lyrics', '35.0%', 'Monthly Direct'];
    if (initialRows[2]) initialRows[2] = ['Publishing Administrator', 'Global Collection', '15.0%', 'Quarterly Statutory'];

    try {
      const res = insertTableBlock(document, targetSectionId, headers, initialRows, tableTitle, tableCaption);
      onApplyUpdate(res.updatedDoc, `Inserted table "${tableTitle}" with ${headers.length} columns.`);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Table insertion failed');
    }
  };

  // Insert Chart
  const handleInsertChart = () => {
    if (!targetSectionId) return;
    try {
      const res = insertChartBlock(
        document,
        targetSectionId,
        chartType,
        chartTitle,
        chartLabels,
        chartValues,
        chartUnit
      );
      onApplyUpdate(res.updatedDoc, `Inserted ${chartType} chart "${chartTitle}".`);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Chart insertion failed');
    }
  };

  // Embed remote artwork so the editor and PDF renderer share a self-contained asset.
  const handleInsertImage = async () => {
    if (!targetSectionId || isInsertingImage) return;
    setIsInsertingImage(true);
    try {
      let storedImageUrl = imageUrl.trim();
      if (!storedImageUrl) throw new Error('Enter an image URL or asset.');
      if (!storedImageUrl.startsWith('data:image/')) {
        const response = await fetch(storedImageUrl, { mode: 'cors' });
        if (!response.ok) throw new Error('Image server returned HTTP ' + response.status + '.');
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) throw new Error('The supplied URL did not return an image.');
        if (blob.size > 15 * 1024 * 1024) throw new Error('The image must be 15 MB or smaller.');
        storedImageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Unable to read the downloaded image asset.'));
          reader.readAsDataURL(blob);
        });
      }
      const updatedSections = document.sections.map(section => section.id === targetSectionId
        ? { ...section, images: [...(section.images || []), {
            id: 'img_' + Date.now(), url: storedImageUrl, caption: imageCaption,
            altText: imageCaption || 'Document artwork', alignment: 'center' as const, widthPercent: 80
          }] }
        : section);
      const updatedDoc: DocumentModel = { ...document, sections: updatedSections, version: document.version + 1, updatedAt: new Date().toISOString() };
      onApplyUpdate(updatedDoc, 'Inserted artwork/image into the selected section.');
      onClose();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Image insertion failed.');
    } finally {
      setIsInsertingImage(false);
    }
  };

  // Add Signatory Party
  const handleAddSignatureParty = () => {
    const newParty = {
      id: `party_${Date.now()}`,
      role: partyRole,
      name: partyName,
      title: partyTitle,
      company: partyCompany,
      date: new Date().toLocaleDateString(),
      signaturePlaceholder: `/s/ ${partyName}`,
      hasWitness: true,
      witnessName: 'Notary Public',
      signed: false
    };

    const updatedDoc: DocumentModel = {
      ...document,
      signatures: {
        id: document.signatures?.id || `sig_${Date.now()}`,
        title: document.signatures?.title || 'SIGNATURES & EXECUTION',
        layout: document.signatures?.layout || 'side_by_side',
        onDedicatedPage: document.signatures?.onDedicatedPage || false,
        parties: [...(document.signatures?.parties || []), newParty]
      },
      version: document.version + 1,
      updatedAt: new Date().toISOString()
    };
    onApplyUpdate(updatedDoc, `Added signatory execution party: ${partyName} (${partyRole}).`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl text-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <h2 className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <span>Insert Document Object</span>
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 text-xs">
          <button
            onClick={() => setActiveTab('table')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
              activeTab === 'table' ? 'border-blue-500 text-blue-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Data Table</span>
          </button>
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
              activeTab === 'chart' ? 'border-amber-500 text-amber-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Chart Visual</span>
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
              activeTab === 'image' ? 'border-purple-500 text-purple-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image / Artwork</span>
          </button>
          <button
            onClick={() => setActiveTab('signature')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
              activeTab === 'signature' ? 'border-emerald-500 text-emerald-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Signature</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Target Section Selector (for table, chart, image) */}
          {activeTab !== 'signature' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Section</label>
              <select
                value={targetSectionId}
                onChange={(e) => setTargetSectionId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
              >
                {document.sections.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.sectionNumber} - {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* TAB 1: DATA TABLE */}
          {activeTab === 'table' && (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Table Title</label>
                <input
                  type="text"
                  value={tableTitle}
                  onChange={(e) => setTableTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Columns / Headers</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {headers.map((h, idx) => (
                    <span key={idx} className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded flex items-center gap-1.5 text-slate-200">
                      <span>{h}</span>
                      {headers.length > 2 && (
                        <button
                          onClick={() => setHeaders(headers.filter((_, i) => i !== idx))}
                          className="hover:text-rose-400 text-slate-400"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHeaders([...headers, `Column ${headers.length + 1}`])}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[11px]"
                  >
                    <Plus className="w-3 h-3 text-emerald-400" />
                    <span>Add Column</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeaders(['Party', 'Role', 'Royalty Share (%)', 'Accounting Basis'])}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[11px]"
                  >
                    Load Royalty Template
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Initial Data Rows</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={rowCount}
                  onChange={(e) => setRowCount(parseInt(e.target.value) || 3)}
                  className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CHART */}
          {activeTab === 'chart' && (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Chart Title</label>
                <input
                  type="text"
                  value={chartTitle}
                  onChange={(e) => setChartTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Chart Type</label>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="donut">Donut Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Trend</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Unit</label>
                  <input
                    type="text"
                    value={chartUnit}
                    onChange={(e) => setChartUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Labels &amp; Values</label>
                <div className="space-y-2">
                  {chartLabels.map((lbl, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={lbl}
                        onChange={(e) => {
                          const updated = [...chartLabels];
                          updated[idx] = e.target.value;
                          setChartLabels(updated);
                        }}
                        placeholder="Label"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs"
                      />
                      <input
                        type="number"
                        value={chartValues[idx]}
                        onChange={(e) => {
                          const updated = [...chartValues];
                          updated[idx] = parseFloat(e.target.value) || 0;
                          setChartValues(updated);
                        }}
                        className="w-20 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 font-mono text-xs"
                      />
                      {chartLabels.length > 2 && (
                        <button
                          onClick={() => {
                            setChartLabels(chartLabels.filter((_, i) => i !== idx));
                            setChartValues(chartValues.filter((_, i) => i !== idx));
                          }}
                          className="text-slate-400 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setChartLabels([...chartLabels, `Segment ${chartLabels.length + 1}`]);
                      setChartValues([...chartValues, 10]);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[11px]"
                  >
                    <Plus className="w-3 h-3 text-amber-400" />
                    <span>Add Data Point</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IMAGE */}
          {activeTab === 'image' && (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Image URL / Asset</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Caption / Attribution</label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800 flex items-center gap-3">
                <img src={imageUrl} alt="Preview" className="w-16 h-16 object-cover rounded border border-slate-700" />
                <span className="text-[11px] text-slate-400">Preview: Artwork will be centered with high resolution export.</span>
              </div>
            </div>
          )}

          {/* TAB 4: SIGNATURE PARTY */}
          {activeTab === 'signature' && (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Party Role / Legal Capacity</label>
                <input
                  type="text"
                  value={partyRole}
                  onChange={(e) => setPartyRole(e.target.value)}
                  placeholder="e.g. PARTY C (EXECUTIVE PRODUCER)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Signatory Name</label>
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Title / Designation</label>
                  <input
                    type="text"
                    value={partyTitle}
                    onChange={(e) => setPartyTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Company / Entity</label>
                  <input
                    type="text"
                    value={partyCompany}
                    onChange={(e) => setPartyCompany(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (activeTab === 'table') handleInsertTable();
              else if (activeTab === 'chart') handleInsertChart();
              else if (activeTab === 'image') void handleInsertImage();
              else if (activeTab === 'signature') handleAddSignatureParty();
            }}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{activeTab === 'image' && isInsertingImage ? 'Preparing Image…' : 'Insert Object'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
