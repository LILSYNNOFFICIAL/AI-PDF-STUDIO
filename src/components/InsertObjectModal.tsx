import React, { useEffect, useRef, useState } from 'react';
import { Table as TableIcon, PieChart, Image as ImageIcon, PenTool, X, Plus, Trash2, Check } from 'lucide-react';
import { DocumentModel, InlineSignatureBlock, SignatureField } from '../types/document';
import { createDefaultSignatureFields, parseSignatureFields } from '../services/signatureBlocks';
import { insertTableBlock, insertChartBlock } from '../orchestrator/orchestrator';

export interface SignatureInsertionTarget {
  sectionId: string;
  start: number;
  end: number;
  selectedText: string;
}

interface InsertObjectModalProps {
  document: DocumentModel;
  isOpen: boolean;
  defaultTab?: 'table' | 'chart' | 'image' | 'signature';
  signatureInsertionTarget?: SignatureInsertionTarget | null;
  onClose: () => void;
  onApplyUpdate: (updatedDoc: DocumentModel, summaryText: string) => void;
}

const SignatureDrawingPad: React.FC<{ onChange: (dataUrl?: string) => void }> = ({ onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height)
    };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    canvas.setPointerCapture(event.pointerId);
    const p = point(event);
    context.beginPath();
    context.moveTo(p.x, p.y);
    context.strokeStyle = '#172033';
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    drawingRef.current = true;
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const p = point(event);
    context.lineTo(p.x, p.y);
    context.stroke();
  };

  const finish = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    onChange(undefined);
  };

  return (
    <div className="space-y-1.5">
      <canvas
        ref={canvasRef}
        width={640}
        height={150}
        aria-label="Draw your signature"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        className="w-full touch-none rounded-lg border border-slate-600 bg-white"
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500">Draw with a mouse, stylus, or finger.</span>
        <button type="button" onClick={clear} className="text-[10px] text-slate-400 hover:text-white">Clear signature</button>
      </div>
    </div>
  );
};

export const InsertObjectModal: React.FC<InsertObjectModalProps> = ({
  document,
  isOpen,
  defaultTab = 'table',
  signatureInsertionTarget = null,
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
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>(createDefaultSignatureFields);
  const [signatureMode, setSignatureMode] = useState<'line' | 'typed' | 'drawn'>('line');
  const [signatureImageDataUrl, setSignatureImageDataUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(defaultTab);
    if (defaultTab === 'signature') {
      setTargetSectionId(signatureInsertionTarget?.sectionId || document.sections[0]?.id || '');
      const parsed = signatureInsertionTarget?.selectedText
        ? parseSignatureFields(signatureInsertionTarget.selectedText)
        : [];
      const fields = parsed.length ? parsed : createDefaultSignatureFields();
      setSignatureFields(fields);
      const signatureValue = fields.find(field => field.kind === 'signature')?.value || '';
      setSignatureMode(signatureValue ? 'typed' : 'line');
      setSignatureImageDataUrl(undefined);
    }
  }, [isOpen, defaultTab, signatureInsertionTarget?.sectionId, signatureInsertionTarget?.selectedText, document.sections]);

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

  const updateSignatureField = (fieldId: string, patch: Partial<SignatureField>) => {
    setSignatureFields(current => current.map(field => field.id === fieldId ? { ...field, ...patch } : field));
  };

  const handleInsertSignatureBlock = () => {
    const targetId = signatureInsertionTarget?.sectionId || targetSectionId;
    const section = document.sections.find(item => item.id === targetId);
    if (!section) {
      window.alert('Choose a section for the signature block.');
      return;
    }

    const originalContent = section.content || '';
    const start = Math.max(0, Math.min(originalContent.length, signatureInsertionTarget?.start ?? originalContent.length));
    const end = Math.max(start, Math.min(originalContent.length, signatureInsertionTarget?.end ?? start));
    const nextContent = originalContent.slice(0, start) + originalContent.slice(end);
    const removedLength = end - start;
    const reposition = (position: number) => position >= end ? position - removedLength : position > start ? start : position;
    const signatureBlock: InlineSignatureBlock = {
      id: 'signature_' + Date.now(),
      title: 'SIGNATURE DETAILS',
      position: start,
      fields: signatureFields.map((field, index) => ({ ...field, id: field.id || 'signature-field-' + (index + 1) })),
      signatureMode,
      ...(signatureMode === 'typed' ? {
        signatureValue: signatureFields.find(field => field.kind === 'signature')?.value || ''
      } : {}),
      ...(signatureMode === 'drawn' && signatureImageDataUrl ? { signatureImageDataUrl } : {})
    };
    const updatedSections = document.sections.map(item => item.id === section.id
      ? {
          ...item,
          content: nextContent,
          signatureBlocks: [
            ...(item.signatureBlocks || []).map(block => ({ ...block, position: reposition(block.position) })),
            signatureBlock
          ].sort((left, right) => left.position - right.position),
          ...(typeof item.imageMarkerPosition === 'number'
            ? { imageMarkerPosition: reposition(item.imageMarkerPosition) }
            : {})
        }
      : item);
    const updatedDoc: DocumentModel = {
      ...document,
      sections: updatedSections,
      version: document.version + 1,
      updatedAt: new Date().toISOString()
    };
    onApplyUpdate(updatedDoc, 'Inserted a formatted signature block into Section ' + (section.sectionNumber || section.title) + '.');
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

          {/* TAB 4: FORMATTED SIGNATURE BLOCK */}
          {activeTab === 'signature' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                <div className="text-[11px] font-semibold text-slate-200">Insert a signature block</div>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                  {signatureInsertionTarget?.selectedText
                    ? 'The selected text has been read into these fields. Review or edit the values before inserting.'
                    : 'No text was selected. Enter the signatory details and choose the fields to include.'}
                </p>
              </div>
              <div className="space-y-2">
                {signatureFields.map(field => (
                  <div key={field.id} className="grid grid-cols-[minmax(105px,0.8fr)_minmax(0,1.5fr)_auto] items-center gap-2">
                    <input
                      aria-label="Signature field label"
                      value={field.label}
                      onChange={event => updateSignatureField(field.id, { label: event.target.value })}
                      className="min-w-0 rounded border border-slate-700 bg-slate-950 px-2 py-2 text-[11px] text-slate-200"
                    />
                    {field.kind === 'signature' && signatureMode === 'line' ? (
                      <div className="border-b border-slate-500 px-2 py-2 text-[10px] text-slate-500">Blank line for handwritten signature</div>
                    ) : field.kind === 'signature' && signatureMode === 'drawn' ? (
                      <div className="px-2 py-2 text-[10px] text-slate-500">{signatureImageDataUrl ? 'Drawn signature captured' : 'Draw in the pad below'}</div>
                    ) : (
                      <input
                        aria-label={field.label + ' value'}
                        value={field.value || ''}
                        onChange={event => updateSignatureField(field.id, { value: event.target.value })}
                        placeholder={field.kind === 'signature' ? 'Type electronic signature' : field.label}
                        className="min-w-0 rounded border border-slate-700 bg-slate-950 px-2 py-2 text-[11px] text-slate-200"
                      />
                    )}
                    <button type="button" onClick={() => setSignatureFields(current => current.filter(item => item.id !== field.id))} aria-label={'Remove ' + field.label} className="rounded px-2 py-1 text-slate-500 hover:bg-rose-950/50 hover:text-rose-300">×</button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSignatureFields(current => [...current, { id: 'signature-field-' + Date.now(), label: 'Additional field', kind: 'text', value: '' }])}
                  className="rounded bg-slate-800 px-3 py-1.5 text-[10px] text-slate-300 hover:bg-slate-700"
                >
                  <Plus className="mr-1 inline h-3 w-3" /> Add field
                </button>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">Signature method</label>
                <select value={signatureMode} onChange={event => setSignatureMode(event.target.value as 'line' | 'typed' | 'drawn')} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200">
                  <option value="line">Printable blank signature line</option>
                  <option value="typed">Typed electronic signature</option>
                  <option value="drawn">Drawn electronic signature</option>
                </select>
              </div>
              {signatureMode === 'drawn' && <SignatureDrawingPad onChange={setSignatureImageDataUrl} />}
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
              else if (activeTab === 'signature') handleInsertSignatureBlock();
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
