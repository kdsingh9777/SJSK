import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  FileCheck, 
  Download,
  RefreshCw,
  Info
} from 'lucide-react';
import { parseExcelFile, ExcelParseResult } from '../lib/excel';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleTitle: string; // e.g. "Income Certificate", "Scholarship", "PAN Center"
  onImportComplete: (rows: Record<string, any>[]) => void;
  sampleColumnsNotice?: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  moduleTitle,
  onImportComplete,
  sampleColumnsNotice,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [parseStep, setParseStep] = useState<string>('');
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setParseResult(null);
      setErrorMsg(null);
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setParseResult(null);
      setErrorMsg(null);
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setIsParsing(true);
    setProgressPercent(15);
    setParseStep('Scanning Excel file data...');

    try {
      await new Promise((r) => setTimeout(r, 400));
      setProgressPercent(45);
      setParseStep('Auto-detecting columns and normalizing...');

      const result = await parseExcelFile(file);
      await new Promise((r) => setTimeout(r, 400));
      setProgressPercent(85);
      setParseStep('Validating detected rows...');

      await new Promise((r) => setTimeout(r, 300));
      setProgressPercent(100);
      setParseStep('Validation complete!');
      setParseResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid file format');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = () => {
    if (parseResult && parseResult.rows.length > 0) {
      onImportComplete(parseResult.rows);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200/80 rounded-2xl w-full max-w-2xl text-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200/80">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                {moduleTitle} • Excel Import System
              </h3>
              <p className="text-xs text-slate-500">
                Automated data entry from .xlsx, .xls, and .csv files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {sampleColumnsNotice && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Recommended column names:</span> {sampleColumnsNotice}
              </div>
            </div>
          )}

          {/* File Upload Dropzone */}
          {!selectedFile && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all group"
            >
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
                id="excel-file-upload-input"
              />
              <label htmlFor="excel-file-upload-input" className="cursor-pointer block">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-900 mb-1">
                  Drag Excel file here or click to browse
                </p>
                <p className="text-xs text-slate-500">
                  Supported formats: .xlsx, .xls, .csv (Max 10MB)
                </p>
              </label>
            </div>
          )}

          {/* Selected File Details & Progress */}
          {selectedFile && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileCheck className="w-8 h-8 text-emerald-600" />
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">{selectedFile.name}</h4>
                    <p className="text-xs text-slate-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Excel File'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setParseResult(null);
                  }}
                  className="text-xs text-slate-500 hover:text-rose-600 underline font-medium"
                >
                  Change File
                </button>
              </div>

              {/* Progress Bar */}
              {isParsing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span className="flex items-center gap-1.5 font-medium">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      {parseStep}
                    </span>
                    <span className="font-bold text-emerald-600">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-rose-800 text-xs font-medium">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parse Summary Report */}
          {parseResult && !isParsing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xl font-bold text-emerald-700">
                      {parseResult.rows.length}
                    </div>
                    <div className="text-xs text-slate-600 font-medium">Successfully importable rows</div>
                  </div>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                  <div>
                    <div className="text-xl font-bold text-rose-700">
                      {parseResult.rejected.length}
                    </div>
                    <div className="text-xs text-slate-600 font-medium">Rejected / Invalid rows</div>
                  </div>
                </div>
              </div>

              {/* Detected Columns */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Detected Excel Columns ({parseResult.detectedColumns.length}):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {parseResult.detectedColumns.map((col, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-slate-700 font-medium shadow-xs"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rejected Rows Table Preview */}
              {parseResult.rejected.length > 0 && (
                <div className="border border-rose-200 rounded-xl overflow-hidden bg-rose-50/50">
                  <div className="bg-rose-100/80 px-3 py-2 text-xs font-semibold text-rose-900 flex items-center justify-between">
                    <span>Rejected Rows List (Invalid Data)</span>
                    <span>{parseResult.rejected.length} rows rejected</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto divide-y divide-rose-100 text-xs">
                    {parseResult.rejected.map((rej, idx) => (
                      <div key={idx} className="p-2.5 flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-rose-800 mr-2">Row #{rej.rowNumber}:</span>
                          <span className="text-slate-700">{rej.reason}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {JSON.stringify(rej.data).slice(0, 40)}...
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
          >
            Cancel
          </button>

          {parseResult && parseResult.rows.length > 0 && (
            <button
              onClick={handleConfirmImport}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Add {parseResult.rows.length} rows to table</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
