import React, { useState } from 'react';
import { Download, FileText, Table, Loader2 } from 'lucide-react';
import { ExportService } from '../../services/exportService';
import { Client, Project, RevenueEntry } from '../../types/database';
import { useToast } from '../../contexts/ToastContext';

interface ExportButtonProps {
  clients: Client[];
  projects: Project[];
  revenue: RevenueEntry[];
  selectedYear: number;
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  clients,
  projects,
  revenue,
  selectedYear,
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'excel' | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const { success, error } = useToast();

  const handleExport = async (type: 'pdf' | 'excel') => {
    setIsExporting(true);
    setExportType(type);
    setShowDropdown(false);

    try {
      const exportData = ExportService.prepareExportData(clients, projects, revenue, selectedYear);

      if (type === 'pdf') {
        await ExportService.exportToPDF(exportData);
        success(
          'PDF Export Complete',
          `Your ${selectedYear} tax agency report has been downloaded successfully.`
        );
      } else {
        await ExportService.exportToExcel(exportData);
        success(
          'Excel Export Complete',
          `Your comprehensive ${selectedYear} data analysis has been downloaded successfully.`
        );
      }
    } catch (exportError) {
      console.error('Export failed:', exportError);
      error(
        'Export Failed',
        `There was an error generating your ${type.toUpperCase()} report. Please try again.`
      );
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting}
        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{isExporting ? `Exporting ${exportType?.toUpperCase()}...` : 'Export Report'}</span>
      </button>

      {showDropdown && !isExporting && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center space-x-3 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-4 h-4 text-red-500" />
              <div>
                <div className="font-medium">Export as PDF</div>
                <div className="text-xs text-gray-500">Professional report format</div>
              </div>
            </button>

            <button
              onClick={() => handleExport('excel')}
              className="flex items-center space-x-3 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Table className="w-4 h-4 text-green-500" />
              <div>
                <div className="font-medium">Export as Excel</div>
                <div className="text-xs text-gray-500">Detailed data analysis</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {showDropdown && <div className="fixed inset-0 z-0" onClick={() => setShowDropdown(false)} />}
    </div>
  );
};

export default ExportButton;
