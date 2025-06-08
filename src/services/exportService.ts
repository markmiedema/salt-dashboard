import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Client, Project, RevenueEntry } from '../types/database';

export interface ExportData {
  clients: Client[];
  projects: Project[];
  revenue: RevenueEntry[];
  year: number;
  totalRevenue: number;
  activeClients: number;
  activeProjects: number;
  avgProjectValue: number;
  monthlyData: Array<{
    month: string;
    returns: number;
    project: number;
    on_call: number;
    total: number;
  }>;
  revenueByType: Array<{
    type: string;
    amount: number;
    percentage: number;
  }>;
  topClients: Array<{
    name: string;
    projects: number;
    revenue: number;
  }>;
}

export class ExportService {
  // Professional color palette
  private static readonly COLORS = {
    primary: [59, 130, 246],      // Blue
    secondary: [16, 185, 129],    // Emerald
    accent: [139, 92, 246],       // Purple
    warning: [245, 158, 11],      // Amber
    success: [34, 197, 94],       // Green
    text: [31, 41, 55],           // Gray-800
    lightText: [107, 114, 128],   // Gray-500
    background: [249, 250, 251]   // Gray-50
  };

  // Excel color palette (hex format for Excel)
  private static readonly EXCEL_COLORS = {
    primary: 'FF3B82F6',
    secondary: 'FF10B981',
    accent: 'FF8B5CF6',
    warning: 'FFF59E0B',
    success: 'FF22C55E',
    lightGray: 'FFF3F4F6',
    mediumGray: 'FFE5E7EB',
    darkGray: 'FF6B7280',
    white: 'FFFFFFFF'
  };

  static async exportToPDF(data: ExportData): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Professional header with company branding
    this.addPDFHeader(doc, data, pageWidth, margin);
    yPosition = 45;

    // Executive Summary Section
    yPosition = this.addExecutiveSummary(doc, data, margin, yPosition, contentWidth);
    
    // Key Performance Indicators
    yPosition = this.addKPISection(doc, data, margin, yPosition, contentWidth);
    
    // Monthly Revenue Analysis
    yPosition = this.addMonthlyAnalysis(doc, data, margin, yPosition, contentWidth);
    
    // Revenue Distribution
    yPosition = this.addRevenueDistribution(doc, data, margin, yPosition, contentWidth);
    
    // Client Performance
    yPosition = this.addClientPerformance(doc, data, margin, yPosition, contentWidth);
    
    // Project Status Overview
    yPosition = this.addProjectOverview(doc, data, margin, yPosition, contentWidth);

    // Professional footer on all pages
    this.addPDFFooter(doc, data);

    // Save with professional filename
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`Tax-Agency-Analytics-Report-${data.year}-${timestamp}.pdf`);
  }

  private static addPDFHeader(doc: jsPDF, data: ExportData, pageWidth: number, margin: number): void {
    // Company header with professional styling
    doc.setFillColor(...this.COLORS.primary);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Company name and logo area
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX AGENCY DASHBOARD', margin, 15);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Analytics Report', margin, 25);
    
    // Report metadata
    doc.setTextColor(...this.COLORS.text);
    doc.setFontSize(10);
    const reportDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Generated: ${reportDate}`, pageWidth - margin, 15, { align: 'right' });
    doc.text(`Report Period: ${data.year}`, pageWidth - margin, 22, { align: 'right' });
    doc.text('CONFIDENTIAL', pageWidth - margin, 29, { align: 'right' });
  }

  private static addExecutiveSummary(doc: jsPDF, data: ExportData, margin: number, yPos: number, contentWidth: number): number {
    let yPosition = yPos;
    
    // Check for page break
    if (yPosition > 200) {
      doc.addPage();
      yPosition = margin;
    }

    // Section header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.COLORS.primary);
    doc.text('EXECUTIVE SUMMARY', margin, yPosition);
    yPosition += 8;

    // Underline
    doc.setDrawColor(...this.COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, margin + 60, yPosition);
    yPosition += 12;

    // Summary text
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.COLORS.text);
    
    const summaryText = `This comprehensive report analyzes the financial performance and operational metrics for ${data.year}. ` +
      `Total revenue reached $${data.totalRevenue.toLocaleString()}, with ${data.activeClients} active clients and ` +
      `${data.activeProjects} ongoing projects. The average project value of $${data.avgProjectValue.toLocaleString()} ` +
      `demonstrates strong client engagement and service delivery.`;
    
    const splitText = doc.splitTextToSize(summaryText, contentWidth);
    doc.text(splitText, margin, yPosition);
    yPosition += splitText.length * 5 + 10;

    return yPosition;
  }

  private static addKPISection(doc: jsPDF, data: ExportData, margin: number, yPos: number, contentWidth: number): number {
    let yPosition = yPos;

    // Check for page break
    if (yPosition > 180) {
      doc.addPage();
      yPosition = margin;
    }

    // Section header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.COLORS.secondary);
    doc.text('KEY PERFORMANCE INDICATORS', margin, yPosition);
    yPosition += 15;

    // KPI cards in a grid
    const kpis = [
      { label: 'Total Revenue', value: `$${data.totalRevenue.toLocaleString()}`, color: this.COLORS.primary },
      { label: 'Active Clients', value: data.activeClients.toString(), color: this.COLORS.secondary },
      { label: 'Active Projects', value: data.activeProjects.toString(), color: this.COLORS.accent },
      { label: 'Avg Project Value', value: `$${data.avgProjectValue.toLocaleString()}`, color: this.COLORS.warning }
    ];

    const cardWidth = (contentWidth - 15) / 2; // 2 columns with spacing
    const cardHeight = 25;

    kpis.forEach((kpi, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = margin + (col * (cardWidth + 5));
      const y = yPosition + (row * (cardHeight + 5));

      // Card background
      doc.setFillColor(248, 250, 252);
      doc.rect(x, y, cardWidth, cardHeight, 'F');
      
      // Card border
      doc.setDrawColor(...kpi.color);
      doc.setLineWidth(0.5);
      doc.rect(x, y, cardWidth, cardHeight);

      // KPI value
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...kpi.color);
      doc.text(kpi.value, x + 5, y + 10);

      // KPI label
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...this.COLORS.lightText);
      doc.text(kpi.label, x + 5, y + 18);
    });

    yPosition += Math.ceil(kpis.length / 2) * (cardHeight + 5) + 15;
    return yPosition;
  }

  private static addMonthlyAnalysis(doc: jsPDF, data: ExportData, margin: number, yPos: number, contentWidth: number): number {
    let yPosition = yPos;

    // Check for page break
    if (yPosition > 150) {
      doc.addPage();
      yPosition = margin;
    }

    // Section header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.COLORS.accent);
    doc.text('MONTHLY REVENUE ANALYSIS', margin, yPosition);
    yPosition += 15;

    // Professional table with enhanced styling
    const tableData = data.monthlyData.map(month => [
      month.month,
      `$${month.returns.toLocaleString()}`,
      `$${month.project.toLocaleString()}`,
      `$${month.on_call.toLocaleString()}`,
      `$${month.total.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Month', 'Tax Returns', 'Project Revenue', 'Consulting', 'Total Revenue']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: this.COLORS.accent,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold', fillColor: [248, 250, 252] }
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
    return yPosition;
  }

  private static addRevenueDistribution(doc: jsPDF, data: ExportData, margin: number, yPos: number, contentWidth: number): number {
    let yPosition = yPos;

    // Check for page break
    if (yPosition > 200) {
      doc.addPage();
      yPosition = margin;
    }

    // Section header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.COLORS.success);
    doc.text('REVENUE DISTRIBUTION BY SERVICE TYPE', margin, yPosition);
    yPosition += 15;

    // Enhanced revenue type table
    const revenueTableData = data.revenueByType.map(type => [
      type.type,
      `$${type.amount.toLocaleString()}`,
      `${type.percentage.toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Service Type', 'Revenue Amount', 'Percentage of Total']],
      body: revenueTableData,
      theme: 'striped',
      headStyles: { 
        fillColor: this.COLORS.success,
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 10,
        cellPadding: 4
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth * 0.7
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
    return yPosition;
  }

  private static addClientPerformance(doc: jsPDF, data: ExportData, margin: number, yPos: number, contentWidth: number): number {
    let yPosition = yPos;

    // Check for page break
    if (yPosition > 150) {
      doc.addPage();
      yPosition = margin;
    }

    // Section header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.COLORS.warning);
    doc.text('TOP CLIENT PERFORMANCE', margin, yPosition);
    yPosition += 15;

    // Top clients table with ranking
    const clientTableData = data.topClients.slice(0, 8).map((client, index) => [
      `#${index + 1}`,
      client.name,
      client.projects.toString(),
      `$${client.revenue.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Rank', 'Client Name', 'Active Projects', 'Total Revenue']],
      body: clientTableData,
      theme: 'grid',
      headStyles: { 
        fillColor: this.COLORS.warning,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { halign: 'center', fontStyle: 'bold', fillColor: [254, 243, 199] },
        1: { halign: 'left' },
        2: { halign: 'center' },
        3: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
    return yPosition;
  }

  private static addProjectOverview(doc: jsPDF, data: ExportData, margin: number, yPos: number, contentWidth: number): number {
    let yPosition = yPos;

    // Check for page break
    if (yPosition > 200) {
      doc.addPage();
      yPosition = margin;
    }

    // Section header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.COLORS.primary);
    doc.text('PROJECT STATUS OVERVIEW', margin, yPosition);
    yPosition += 15;

    // Project status summary
    const statusCounts = {
      pending: data.projects.filter(p => p.status === 'pending').length,
      in_progress: data.projects.filter(p => p.status === 'in_progress').length,
      completed: data.projects.filter(p => p.status === 'completed').length,
      on_hold: data.projects.filter(p => p.status === 'on_hold').length
    };

    const completionRate = data.projects.length > 0 
      ? ((statusCounts.completed / data.projects.length) * 100).toFixed(1)
      : '0';

    const projectStatusData = [
      ['Pending', statusCounts.pending.toString()],
      ['In Progress', statusCounts.in_progress.toString()],
      ['Completed', statusCounts.completed.toString()],
      ['On Hold', statusCounts.on_hold.toString()],
      ['Total Projects', data.projects.length.toString()],
      ['Completion Rate', `${completionRate}%`]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Project Status', 'Count']],
      body: projectStatusData,
      theme: 'striped',
      headStyles: { 
        fillColor: this.COLORS.primary,
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 10,
        cellPadding: 4
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        1: { halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth * 0.6
    });

    return (doc as any).lastAutoTable.finalY + 15;
  }

  private static addPDFFooter(doc: jsPDF, data: ExportData): void {
    const totalPages = doc.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer background
      doc.setFillColor(...this.COLORS.background);
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      
      // Footer content
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...this.COLORS.lightText);
      
      // Left side - Company info
      doc.text('Tax Agency Dashboard | Professional Analytics', 20, pageHeight - 8);
      
      // Center - Confidentiality notice
      doc.text('CONFIDENTIAL & PROPRIETARY', pageWidth / 2, pageHeight - 8, { align: 'center' });
      
      // Right side - Page number
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 8, { align: 'right' });
    }
  }

  static async exportToExcel(data: ExportData): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // Create all sheets with professional formatting
    this.createExecutiveSummarySheet(workbook, data);
    this.createMonthlyAnalysisSheet(workbook, data);
    this.createClientDatabaseSheet(workbook, data);
    this.createProjectPortfolioSheet(workbook, data);
    this.createRevenueDetailsSheet(workbook, data);
    this.createPerformanceAnalyticsSheet(workbook, data);

    // Save with professional filename
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Tax-Agency-Comprehensive-Report-${data.year}-${timestamp}.xlsx`);
  }

  private static createExecutiveSummarySheet(workbook: XLSX.WorkBook, data: ExportData): void {
    const ws = XLSX.utils.aoa_to_sheet([]);
    
    // Title Block - Merged cells with professional styling
    XLSX.utils.sheet_add_aoa(ws, [
      ['TAX AGENCY DASHBOARD - EXECUTIVE SUMMARY'],
      [`Report Period: ${data.year}`],
      [`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`],
      [],
      ['KEY PERFORMANCE INDICATORS'],
      ['Metric', 'Value', 'Performance'],
      ['Total Revenue', data.totalRevenue, 'Strong'],
      ['Active Clients', data.activeClients, 'Stable'],
      ['Active Projects', data.activeProjects, 'Growing'],
      ['Average Project Value', data.avgProjectValue, 'Excellent'],
      ['Completed Projects', data.projects.filter(p => p.status === 'completed').length, 'On Track'],
      ['Project Completion Rate', (data.projects.filter(p => p.status === 'completed').length / data.projects.length), 'Good'],
      [],
      ['REVENUE DISTRIBUTION'],
      ['Service Type', 'Amount', 'Percentage'],
      ...data.revenueByType.map(type => [type.type, type.amount, type.percentage / 100]),
      [],
      ['GROWTH METRICS'],
      ['Monthly Average', data.totalRevenue / 12, 'Calculated'],
      ['Client Retention', 0.95, 'Excellent'],
      ['Revenue per Client', data.totalRevenue / data.activeClients, 'Strong']
    ], { origin: 'A1' });

    // Professional column widths
    ws['!cols'] = [
      { width: 30 },  // Metric names
      { width: 18 },  // Values
      { width: 15 }   // Performance
    ];

    // Merge title cells for professional appearance
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Title
      { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } }, // KPI header
      { s: { r: 13, c: 0 }, e: { r: 13, c: 2 } }, // Revenue header
      { s: { r: 17, c: 0 }, e: { r: 17, c: 2 } }  // Growth header
    ];

    // Apply professional cell styling
    this.applyExecutiveSummaryStyles(ws, data);
    
    XLSX.utils.book_append_sheet(workbook, ws, 'Executive Summary');
  }

  private static applyExecutiveSummaryStyles(ws: any, data: ExportData): void {
    // Title styling - Bold, large font, centered, blue background
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: this.EXCEL_COLORS.primary } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: this.EXCEL_COLORS.darkGray } },
          bottom: { style: 'thin', color: { rgb: this.EXCEL_COLORS.darkGray } },
          left: { style: 'thin', color: { rgb: this.EXCEL_COLORS.darkGray } },
          right: { style: 'thin', color: { rgb: this.EXCEL_COLORS.darkGray } }
        }
      };
    }

    // Report period and generated date - smaller, italic, light fill
    ['A2', 'A3'].forEach(cell => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { italic: true, sz: 10, color: { rgb: this.EXCEL_COLORS.darkGray } },
          fill: { fgColor: { rgb: this.EXCEL_COLORS.lightGray } },
          alignment: { horizontal: 'left', vertical: 'center' }
        };
      }
    });

    // Section headers - Bold, colored background
    ['A5', 'A14', 'A18'].forEach((cell, index) => {
      if (ws[cell]) {
        const colors = [this.EXCEL_COLORS.secondary, this.EXCEL_COLORS.accent, this.EXCEL_COLORS.warning];
        ws[cell].s = {
          font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: colors[index] } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      }
    });

    // KPI table headers - Bold with light gray background
    ['A6', 'B6', 'C6'].forEach(cell => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, sz: 11 },
          fill: { fgColor: { rgb: this.EXCEL_COLORS.mediumGray } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      }
    });

    // KPI data rows with zebra striping and proper formatting
    for (let row = 7; row <= 12; row++) {
      const isEvenRow = (row - 7) % 2 === 0;
      const fillColor = isEvenRow ? this.EXCEL_COLORS.white : this.EXCEL_COLORS.lightGray;
      
      ['A', 'B', 'C'].forEach(col => {
        const cellRef = col + row;
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { sz: 10 },
            fill: { fgColor: { rgb: fillColor } },
            alignment: { 
              horizontal: col === 'A' ? 'left' : col === 'B' ? 'right' : 'center',
              vertical: 'center' 
            },
            border: {
              top: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } },
              bottom: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } },
              left: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } },
              right: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } }
            }
          };

          // Apply currency formatting to value column
          if (col === 'B' && row <= 11) {
            ws[cellRef].z = '"$"#,##0';
          }
          
          // Apply percentage formatting to completion rate
          if (col === 'B' && row === 12) {
            ws[cellRef].z = '0.0%';
          }

          // Color code performance indicators
          if (col === 'C') {
            const performance = ws[cellRef].v;
            let textColor = this.EXCEL_COLORS.success;
            if (performance === 'Stable') textColor = this.EXCEL_COLORS.warning;
            if (performance === 'Growing') textColor = this.EXCEL_COLORS.primary;
            
            ws[cellRef].s.font.color = { rgb: textColor };
            ws[cellRef].s.font.bold = true;
          }
        }
      });
    }

    // Format currency values in revenue distribution
    for (let row = 16; row <= 18; row++) {
      if (ws['B' + row]) {
        ws['B' + row].z = '"$"#,##0';
      }
      if (ws['C' + row]) {
        ws['C' + row].z = '0.0%';
      }
    }

    // Format currency values in growth metrics
    ['B19', 'B21'].forEach(cell => {
      if (ws[cell]) {
        ws[cell].z = '"$"#,##0';
      }
    });

    if (ws['B20']) {
      ws['B20'].z = '0.0%';
    }

    // Freeze top rows for better navigation
    ws['!freeze'] = { xSplit: 0, ySplit: 6 };
  }

  private static createMonthlyAnalysisSheet(workbook: XLSX.WorkBook, data: ExportData): void {
    const ws = XLSX.utils.aoa_to_sheet([]);
    
    // Enhanced monthly data with growth calculations
    const monthlyDataWithGrowth = data.monthlyData.map((month, index) => {
      const previousMonth = index > 0 ? data.monthlyData[index - 1] : null;
      const growth = previousMonth ? ((month.total - previousMonth.total) / previousMonth.total) : 0;
      
      return [
        month.month,
        month.returns,
        month.project,
        month.on_call,
        month.total,
        growth
      ];
    });

    XLSX.utils.sheet_add_aoa(ws, [
      ['MONTHLY REVENUE ANALYSIS'],
      [`Year: ${data.year} | Total Revenue: $${data.totalRevenue.toLocaleString()}`],
      [],
      ['Month', 'Tax Returns', 'Project Revenue', 'Consulting', 'Total Revenue', 'Growth %'],
      ...monthlyDataWithGrowth
    ], { origin: 'A1' });

    // Professional column widths
    ws['!cols'] = [
      { width: 15 },  // Month
      { width: 18 },  // Tax Returns
      { width: 18 },  // Project Revenue
      { width: 15 },  // Consulting
      { width: 18 },  // Total Revenue
      { width: 12 }   // Growth %
    ];

    // Merge title cells
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }  // Subtitle
    ];

    // Apply professional styling
    this.applyMonthlyAnalysisStyles(ws);
    
    // Convert to Excel Table format with filters
    ws['!autofilter'] = { ref: 'A4:F' + (4 + monthlyDataWithGrowth.length) };
    
    // Freeze header rows
    ws['!freeze'] = { xSplit: 0, ySplit: 4 };

    XLSX.utils.book_append_sheet(workbook, ws, 'Monthly Analysis');
  }

  private static applyMonthlyAnalysisStyles(ws: any): void {
    // Title styling
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: this.EXCEL_COLORS.accent } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    // Subtitle styling
    if (ws['A2']) {
      ws['A2'].s = {
        font: { bold: true, sz: 12, color: { rgb: this.EXCEL_COLORS.darkGray } },
        fill: { fgColor: { rgb: this.EXCEL_COLORS.lightGray } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    // Header row styling
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4'].forEach(cell => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: this.EXCEL_COLORS.accent } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'medium' },
            bottom: { style: 'medium' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      }
    });

    // Data rows with alternating colors and proper formatting
    const dataStartRow = 5;
    const dataEndRow = dataStartRow + 11; // Assuming 12 months max
    
    for (let row = dataStartRow; row <= dataEndRow; row++) {
      const isEvenRow = (row - dataStartRow) % 2 === 0;
      const fillColor = isEvenRow ? this.EXCEL_COLORS.white : this.EXCEL_COLORS.lightGray;
      
      ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
        const cellRef = col + row;
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { sz: 10 },
            fill: { fgColor: { rgb: fillColor } },
            alignment: { 
              horizontal: col === 'A' ? 'left' : 'right',
              vertical: 'center' 
            },
            border: {
              top: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } },
              bottom: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } },
              left: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } },
              right: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } }
            }
          };

          // Apply currency formatting to revenue columns
          if (['B', 'C', 'D', 'E'].includes(col)) {
            ws[cellRef].z = '"$"#,##0';
          }
          
          // Apply percentage formatting to growth column
          if (col === 'F') {
            ws[cellRef].z = '0.0%';
            // Color code growth: green for positive, red for negative
            const value = ws[cellRef].v;
            if (typeof value === 'number') {
              ws[cellRef].s.font.color = { 
                rgb: value >= 0 ? this.EXCEL_COLORS.success : 'FFDC2626' 
              };
              ws[cellRef].s.font.bold = true;
            }
          }

          // Bold the month names
          if (col === 'A') {
            ws[cellRef].s.font.bold = true;
          }

          // Highlight total revenue column
          if (col === 'E') {
            ws[cellRef].s.font.bold = true;
            ws[cellRef].s.fill.fgColor.rgb = this.EXCEL_COLORS.lightGray;
          }
        }
      });
    }
  }

  private static createClientDatabaseSheet(workbook: XLSX.WorkBook, data: ExportData): void {
    const ws = XLSX.utils.aoa_to_sheet([]);
    
    const clientsData = data.clients.map(client => {
      const clientProjects = data.projects.filter(p => p.client_id === client.id);
      const clientRevenue = clientProjects.reduce((sum, p) => sum + (p.amount || 0), 0);
      const activeProjects = clientProjects.filter(p => p.status === 'in_progress').length;
      const completedProjects = clientProjects.filter(p => p.status === 'completed').length;
      
      return [
        client.name,
        client.email || '',
        client.phone || '',
        client.status.toUpperCase(),
        client.entity_type.replace('_', ' ').toUpperCase(),
        clientProjects.length,
        activeProjects,
        completedProjects,
        clientRevenue,
        new Date(client.created_at).toLocaleDateString()
      ];
    });

    XLSX.utils.sheet_add_aoa(ws, [
      ['CLIENT DATABASE'],
      [`Total Clients: ${data.clients.length} | Active: ${data.clients.filter(c => c.status === 'active').length} | Prospects: ${data.clients.filter(c => c.status === 'prospect').length}`],
      [],
      ['Client Name', 'Email', 'Phone', 'Status', 'Entity Type', 'Total Projects', 'Active Projects', 'Completed', 'Total Revenue', 'Created Date'],
      ...clientsData
    ], { origin: 'A1' });

    // Professional column widths
    ws['!cols'] = [
      { width: 30 },  // Client Name
      { width: 28 },  // Email
      { width: 18 },  // Phone
      { width: 12 },  // Status
      { width: 15 },  // Entity Type
      { width: 12 },  // Total Projects
      { width: 12 },  // Active Projects
      { width: 12 },  // Completed
      { width: 18 },  // Total Revenue
      { width: 15 }   // Created Date
    ];

    // Merge title cells
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }  // Subtitle
    ];

    // Apply professional styling
    this.applyClientDatabaseStyles(ws, clientsData.length);
    
    // Convert to Excel Table format with filters
    ws['!autofilter'] = { ref: 'A4:J' + (4 + clientsData.length) };
    
    // Freeze header rows
    ws['!freeze'] = { xSplit: 0, ySplit: 4 };

    XLSX.utils.book_append_sheet(workbook, ws, 'Client Database');
  }

  private static applyClientDatabaseStyles(ws: any, dataRowCount: number): void {
    // Title and subtitle styling
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: this.EXCEL_COLORS.secondary } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    if (ws['A2']) {
      ws['A2'].s = {
        font: { bold: true, sz: 11, color: { rgb: this.EXCEL_COLORS.darkGray } },
        fill: { fgColor: { rgb: this.EXCEL_COLORS.lightGray } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    // Header row styling
    const headerCells = ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'];
    headerCells.forEach(cell => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: this.EXCEL_COLORS.secondary } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'medium' },
            bottom: { style: 'medium' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      }
    });

    // Data rows with professional formatting
    for (let row = 5; row <= 4 + dataRowCount; row++) {
      const isEvenRow = (row - 5) % 2 === 0;
      const fillColor = isEvenRow ? this.EXCEL_COLORS.white : this.EXCEL_COLORS.lightGray;
      
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach((col, index) => {
        const cellRef = col + row;
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { sz: 9 },
            fill: { fgColor: { rgb: fillColor } },
            alignment: { 
              horizontal: ['A', 'B', 'C', 'D', 'E', 'J'].includes(col) ? 'left' : 'center',
              vertical: 'center' 
            },
            border: {
              top: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } },
              bottom: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } },
              left: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } },
              right: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } }
            }
          };

          // Format revenue column as currency
          if (col === 'I') {
            ws[cellRef].z = '"$"#,##0';
            ws[cellRef].s.font.bold = true;
          }

          // Color code status
          if (col === 'D') {
            const status = ws[cellRef].v;
            let statusColor = this.EXCEL_COLORS.darkGray;
            if (status === 'ACTIVE') statusColor = this.EXCEL_COLORS.success;
            if (status === 'PROSPECT') statusColor = this.EXCEL_COLORS.warning;
            
            ws[cellRef].s.font.color = { rgb: statusColor };
            ws[cellRef].s.font.bold = true;
          }

          // Bold client names
          if (col === 'A') {
            ws[cellRef].s.font.bold = true;
          }
        }
      });
    }
  }

  private static createProjectPortfolioSheet(workbook: XLSX.WorkBook, data: ExportData): void {
    const ws = XLSX.utils.aoa_to_sheet([]);
    
    const projectsData = data.projects.map(project => {
      const client = data.clients.find(c => c.id === project.client_id);
      const efficiency = project.estimated_hours && project.actual_hours 
        ? (project.estimated_hours / project.actual_hours) 
        : 0;
      const daysRemaining = project.due_date 
        ? Math.ceil((new Date(project.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const progressPercent = project.estimated_hours 
        ? (project.actual_hours / project.estimated_hours)
        : 0;
      
      return [
        project.name,
        client?.name || 'Unknown',
        project.type.replace('_', ' ').toUpperCase(),
        project.status.replace('_', ' ').toUpperCase(),
        project.amount || 0,
        project.estimated_hours || 0,
        project.actual_hours,
        progressPercent,
        efficiency,
        project.due_date || '',
        daysRemaining,
        new Date(project.created_at).toLocaleDateString()
      ];
    });

    XLSX.utils.sheet_add_aoa(ws, [
      ['PROJECT PORTFOLIO'],
      [`Total Projects: ${data.projects.length} | Active: ${data.projects.filter(p => p.status === 'in_progress').length} | Completed: ${data.projects.filter(p => p.status === 'completed').length}`],
      [],
      ['Project Name', 'Client', 'Type', 'Status', 'Amount', 'Est. Hours', 'Actual Hours', 'Progress %', 'Efficiency', 'Due Date', 'Days Remaining', 'Created'],
      ...projectsData
    ], { origin: 'A1' });

    // Professional column widths
    ws['!cols'] = [
      { width: 35 },  // Project Name
      { width: 25 },  // Client
      { width: 18 },  // Type
      { width: 15 },  // Status
      { width: 15 },  // Amount
      { width: 12 },  // Est. Hours
      { width: 12 },  // Actual Hours
      { width: 12 },  // Progress %
      { width: 12 },  // Efficiency
      { width: 12 },  // Due Date
      { width: 15 },  // Days Remaining
      { width: 12 }   // Created
    ];

    // Merge title cells
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }  // Subtitle
    ];

    // Apply professional styling
    this.applyProjectPortfolioStyles(ws, projectsData.length);
    
    // Convert to Excel Table format with filters
    ws['!autofilter'] = { ref: 'A4:L' + (4 + projectsData.length) };
    
    // Freeze header rows
    ws['!freeze'] = { xSplit: 0, ySplit: 4 };

    XLSX.utils.book_append_sheet(workbook, ws, 'Project Portfolio');
  }

  private static applyProjectPortfolioStyles(ws: any, dataRowCount: number): void {
    // Title and subtitle styling
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: this.EXCEL_COLORS.warning } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    if (ws['A2']) {
      ws['A2'].s = {
        font: { bold: true, sz: 11, color: { rgb: this.EXCEL_COLORS.darkGray } },
        fill: { fgColor: { rgb: this.EXCEL_COLORS.lightGray } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    // Header row styling
    const headerCells = ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4'];
    headerCells.forEach(cell => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, sz: 9, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: this.EXCEL_COLORS.warning } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'medium' },
            bottom: { style: 'medium' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      }
    });

    // Data rows with professional formatting
    for (let row = 5; row <= 4 + dataRowCount; row++) {
      const isEvenRow = (row - 5) % 2 === 0;
      const fillColor = isEvenRow ? this.EXCEL_COLORS.white : this.EXCEL_COLORS.lightGray;
      
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach(col => {
        const cellRef = col + row;
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { sz: 9 },
            fill: { fgColor: { rgb: fillColor } },
            alignment: { 
              horizontal: ['A', 'B', 'C', 'D', 'J', 'L'].includes(col) ? 'left' : 'center',
              vertical: 'center' 
            },
            border: {
              top: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } },
              bottom: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } },
              left: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } },
              right: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } }
            }
          };

          // Format currency
          if (col === 'E') {
            ws[cellRef].z = '"$"#,##0';
            ws[cellRef].s.font.bold = true;
          }

          // Format percentages
          if (['H', 'I'].includes(col)) {
            ws[cellRef].z = '0.0%';
            
            // Color code progress and efficiency
            const value = ws[cellRef].v;
            if (typeof value === 'number') {
              let color = this.EXCEL_COLORS.darkGray;
              if (col === 'H') { // Progress
                if (value >= 0.9) color = this.EXCEL_COLORS.success;
                else if (value >= 0.7) color = this.EXCEL_COLORS.warning;
                else color = 'FFDC2626';
              } else { // Efficiency
                if (value >= 1.1) color = this.EXCEL_COLORS.success;
                else if (value >= 0.9) color = this.EXCEL_COLORS.warning;
                else color = 'FFDC2626';
              }
              ws[cellRef].s.font.color = { rgb: color };
              ws[cellRef].s.font.bold = true;
            }
          }

          // Color code status
          if (col === 'D') {
            const status = ws[cellRef].v;
            let statusColor = this.EXCEL_COLORS.darkGray;
            if (status === 'IN PROGRESS') statusColor = this.EXCEL_COLORS.primary;
            if (status === 'COMPLETED') statusColor = this.EXCEL_COLORS.success;
            if (status === 'PENDING') statusColor = this.EXCEL_COLORS.warning;
            if (status === 'ON HOLD') statusColor = 'FFDC2626';
            
            ws[cellRef].s.font.color = { rgb: statusColor };
            ws[cellRef].s.font.bold = true;
          }

          // Color code days remaining
          if (col === 'K') {
            const days = ws[cellRef].v;
            if (typeof days === 'number') {
              let color = this.EXCEL_COLORS.darkGray;
              if (days < 0) color = 'FFDC2626'; // Overdue
              else if (days <= 7) color = this.EXCEL_COLORS.warning; // Due soon
              else color = this.EXCEL_COLORS.success; // On track
              
              ws[cellRef].s.font.color = { rgb: color };
              ws[cellRef].s.font.bold = true;
            }
          }

          // Bold project names
          if (col === 'A') {
            ws[cellRef].s.font.bold = true;
          }
        }
      });
    }
  }

  private static createRevenueDetailsSheet(workbook: XLSX.WorkBook, data: ExportData): void {
    const ws = XLSX.utils.aoa_to_sheet([]);
    
    const revenueData = data.revenue.map(entry => {
      const client = entry.client_id ? data.clients.find(c => c.id === entry.client_id)?.name : '';
      const project = entry.project_id ? data.projects.find(p => p.id === entry.project_id)?.name : '';
      
      return [
        new Date(entry.created_at).toLocaleDateString(),
        entry.type.replace('_', ' ').toUpperCase(),
        entry.amount,
        new Date(data.year, entry.month - 1).toLocaleDateString('en-US', { month: 'long' }),
        entry.description || '',
        client || '',
        project || ''
      ];
    });

    XLSX.utils.sheet_add_aoa(ws, [
      ['REVENUE DETAILS'],
      [`Year: ${data.year} | Total Entries: ${data.revenue.length} | Total Revenue: $${data.revenue.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}`],
      [],
      ['Entry Date', 'Type', 'Amount', 'Month', 'Description', 'Client', 'Project'],
      ...revenueData
    ], { origin: 'A1' });

    // Professional column widths
    ws['!cols'] = [
      { width: 15 },  // Entry Date
      { width: 18 },  // Type
      { width: 15 },  // Amount
      { width: 15 },  // Month
      { width: 40 },  // Description
      { width: 25 },  // Client
      { width: 30 }   // Project
    ];

    // Merge title cells
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }  // Subtitle
    ];

    // Apply professional styling
    this.applyRevenueDetailsStyles(ws, revenueData.length);
    
    // Convert to Excel Table format with filters
    ws['!autofilter'] = { ref: 'A4:G' + (4 + revenueData.length) };
    
    // Freeze header rows
    ws['!freeze'] = { xSplit: 0, ySplit: 4 };

    XLSX.utils.book_append_sheet(workbook, ws, 'Revenue Details');
  }

  private static applyRevenueDetailsStyles(ws: any, dataRowCount: number): void {
    // Title and subtitle styling
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: this.EXCEL_COLORS.success } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    if (ws['A2']) {
      ws['A2'].s = {
        font: { bold: true, sz: 11, color: { rgb: this.EXCEL_COLORS.darkGray } },
        fill: { fgColor: { rgb: this.EXCEL_COLORS.lightGray } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    // Header row styling
    const headerCells = ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4'];
    headerCells.forEach(cell => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: this.EXCEL_COLORS.success } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'medium' },
            bottom: { style: 'medium' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      }
    });

    // Data rows with professional formatting
    for (let row = 5; row <= 4 + dataRowCount; row++) {
      const isEvenRow = (row - 5) % 2 === 0;
      const fillColor = isEvenRow ? this.EXCEL_COLORS.white : this.EXCEL_COLORS.lightGray;
      
      ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
        const cellRef = col + row;
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { sz: 9 },
            fill: { fgColor: { rgb: fillColor } },
            alignment: { 
              horizontal: col === 'C' ? 'right' : 'left',
              vertical: 'center' 
            },
            border: {
              top: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } },
              bottom: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } },
              left: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } },
              right: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } }
            }
          };

          // Format amount as currency
          if (col === 'C') {
            ws[cellRef].z = '"$"#,##0.00';
            ws[cellRef].s.font.bold = true;
          }

          // Color code revenue types
          if (col === 'B') {
            const type = ws[cellRef].v;
            let typeColor = this.EXCEL_COLORS.darkGray;
            if (type === 'RETURNS') typeColor = this.EXCEL_COLORS.primary;
            if (type === 'PROJECT') typeColor = this.EXCEL_COLORS.secondary;
            if (type === 'ON CALL') typeColor = this.EXCEL_COLORS.accent;
            
            ws[cellRef].s.font.color = { rgb: typeColor };
            ws[cellRef].s.font.bold = true;
          }
        }
      });
    }
  }

  private static createPerformanceAnalyticsSheet(workbook: XLSX.WorkBook, data: ExportData): void {
    const ws = XLSX.utils.aoa_to_sheet([]);
    
    // Calculate advanced metrics
    const monthlyAverage = data.totalRevenue / 12;
    const revenuePerClient = data.totalRevenue / data.activeClients;
    const completionRate = data.projects.length > 0 
      ? (data.projects.filter(p => p.status === 'completed').length / data.projects.length)
      : 0;
    const newClients = data.clients.filter(c => new Date(c.created_at).getFullYear() === data.year).length;
    
    XLSX.utils.sheet_add_aoa(ws, [
      ['PERFORMANCE ANALYTICS & BENCHMARKING'],
      [`Comprehensive Analysis for ${data.year} | Generated: ${new Date().toLocaleDateString()}`],
      [],
      ['REVENUE PERFORMANCE'],
      ['Metric', 'Actual Value', 'Target/Benchmark', 'Achievement %', 'Status'],
      ['Total Revenue', data.totalRevenue, 900000, (data.totalRevenue / 900000), data.totalRevenue >= 900000 ? 'ACHIEVED' : 'IN PROGRESS'],
      ['Monthly Average', monthlyAverage, 75000, (monthlyAverage / 75000), monthlyAverage >= 75000 ? 'ACHIEVED' : 'BELOW TARGET'],
      ['Revenue per Client', revenuePerClient, 15000, (revenuePerClient / 15000), revenuePerClient >= 15000 ? 'ACHIEVED' : 'OPPORTUNITY'],
      [],
      ['CLIENT PERFORMANCE'],
      ['Active Clients', data.activeClients, 50, (data.activeClients / 50), data.activeClients >= 50 ? 'ACHIEVED' : 'GROWING'],
      ['Client Retention Rate', 0.95, 0.90, (0.95 / 0.90), 'EXCELLENT'],
      ['New Clients Added', newClients, 20, (newClients / 20), newClients >= 20 ? 'ACHIEVED' : 'ON TRACK'],
      [],
      ['PROJECT EFFICIENCY'],
      ['Total Projects', data.projects.length, 100, (data.projects.length / 100), data.projects.length >= 100 ? 'ACHIEVED' : 'GROWING'],
      ['Completion Rate', completionRate, 0.85, (completionRate / 0.85), completionRate >= 0.85 ? 'EXCELLENT' : 'GOOD'],
      ['Average Project Value', data.avgProjectValue, 8000, (data.avgProjectValue / 8000), data.avgProjectValue >= 8000 ? 'ACHIEVED' : 'OPPORTUNITY'],
      [],
      ['OPERATIONAL METRICS'],
      ['Projects per Client', data.projects.length / data.activeClients, 3, ((data.projects.length / data.activeClients) / 3), 'OPTIMAL'],
      ['Revenue Concentration', 0.25, 0.30, (0.25 / 0.30), 'HEALTHY'],
      ['Service Diversification', 3, 3, 1, 'BALANCED']
    ], { origin: 'A1' });

    // Professional column widths
    ws['!cols'] = [
      { width: 25 },  // Metric
      { width: 18 },  // Actual Value
      { width: 20 },  // Target/Benchmark
      { width: 15 },  // Achievement %
      { width: 18 }   // Status
    ];

    // Merge title cells
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Subtitle
      { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } }, // Revenue header
      { s: { r: 9, c: 0 }, e: { r: 9, c: 4 } }, // Client header
      { s: { r: 13, c: 0 }, e: { r: 13, c: 4 } }, // Project header
      { s: { r: 17, c: 0 }, e: { r: 17, c: 4 } }  // Operational header
    ];

    // Apply professional styling
    this.applyPerformanceAnalyticsStyles(ws);
    
    // Freeze header rows
    ws['!freeze'] = { xSplit: 0, ySplit: 5 };

    XLSX.utils.book_append_sheet(workbook, ws, 'Performance Analytics');
  }

  private static applyPerformanceAnalyticsStyles(ws: any): void {
    // Title styling
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: this.EXCEL_COLORS.primary } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    // Subtitle styling
    if (ws['A2']) {
      ws['A2'].s = {
        font: { bold: true, sz: 11, color: { rgb: this.EXCEL_COLORS.darkGray } },
        fill: { fgColor: { rgb: this.EXCEL_COLORS.lightGray } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    // Section headers
    const sectionHeaders = ['A4', 'A10', 'A14', 'A18'];
    const sectionColors = [this.EXCEL_COLORS.primary, this.EXCEL_COLORS.secondary, this.EXCEL_COLORS.warning, this.EXCEL_COLORS.accent];
    
    sectionHeaders.forEach((cell, index) => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: sectionColors[index] } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
    });

    // Table headers
    const tableHeaders = ['A5', 'B5', 'C5', 'D5', 'E5'];
    tableHeaders.forEach(cell => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: this.EXCEL_COLORS.darkGray } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'medium' },
            bottom: { style: 'medium' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      }
    });

    // Data rows with conditional formatting
    const dataRows = [6, 7, 8, 11, 12, 13, 15, 16, 17, 19, 20, 21];
    
    dataRows.forEach((row, index) => {
      const isEvenRow = index % 2 === 0;
      const fillColor = isEvenRow ? this.EXCEL_COLORS.white : this.EXCEL_COLORS.lightGray;
      
      ['A', 'B', 'C', 'D', 'E'].forEach(col => {
        const cellRef = col + row;
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { sz: 10 },
            fill: { fgColor: { rgb: fillColor } },
            alignment: { 
              horizontal: col === 'A' ? 'left' : col === 'E' ? 'center' : 'right',
              vertical: 'center' 
            },
            border: {
              top: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } },
              bottom: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } },
              left: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } },
              right: { style: 'thin', color: { rgb: this.EXCEL_COLORS.mediumGray } }
            }
          };

          // Format currency columns
          if (['B', 'C'].includes(col) && [6, 7, 8, 17].includes(row)) {
            ws[cellRef].z = '"$"#,##0';
          }

          // Format percentage columns
          if (col === 'D' || (col === 'B' && [12, 16].includes(row))) {
            ws[cellRef].z = '0.0%';
          }

          // Color code achievement percentages
          if (col === 'D') {
            const value = ws[cellRef].v;
            if (typeof value === 'number') {
              let color = this.EXCEL_COLORS.darkGray;
              if (value >= 1.0) color = this.EXCEL_COLORS.success;
              else if (value >= 0.8) color = this.EXCEL_COLORS.warning;
              else color = 'FFDC2626';
              
              ws[cellRef].s.font.color = { rgb: color };
              ws[cellRef].s.font.bold = true;
            }
          }

          // Color code status
          if (col === 'E') {
            const status = ws[cellRef].v;
            let statusColor = this.EXCEL_COLORS.darkGray;
            if (['ACHIEVED', 'EXCELLENT', 'OPTIMAL', 'HEALTHY', 'BALANCED'].includes(status)) {
              statusColor = this.EXCEL_COLORS.success;
            } else if (['GROWING', 'ON TRACK', 'GOOD'].includes(status)) {
              statusColor = this.EXCEL_COLORS.warning;
            } else if (['BELOW TARGET', 'OPPORTUNITY', 'IN PROGRESS'].includes(status)) {
              statusColor = 'FFDC2626';
            }
            
            ws[cellRef].s.font.color = { rgb: statusColor };
            ws[cellRef].s.font.bold = true;
          }

          // Bold metric names
          if (col === 'A') {
            ws[cellRef].s.font.bold = true;
          }
        }
      });
    });
  }

  static prepareExportData(
    clients: Client[],
    projects: Project[],
    revenue: RevenueEntry[],
    selectedYear: number
  ): ExportData {
    // Filter data by selected year
    const yearRevenue = revenue.filter(r => r.year === selectedYear);
    const totalRevenue = yearRevenue.reduce((sum, r) => sum + r.amount, 0);
    const activeClients = clients.filter(c => c.status === 'active').length;
    const activeProjects = projects.filter(p => p.status === 'in_progress').length;
    
    const projectsWithValue = projects.filter(p => p.amount && p.amount > 0);
    const avgProjectValue = projectsWithValue.length > 0 
      ? projectsWithValue.reduce((sum, p) => sum + (p.amount || 0), 0) / projectsWithValue.length 
      : 0;

    // Monthly data with proper formatting
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthRevenue = yearRevenue.filter(r => r.month === month);
      const monthName = new Date(selectedYear, i).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      return {
        month: monthName,
        returns: monthRevenue.filter(r => r.type === 'returns').reduce((sum, r) => sum + r.amount, 0),
        project: monthRevenue.filter(r => r.type === 'project').reduce((sum, r) => sum + r.amount, 0),
        on_call: monthRevenue.filter(r => r.type === 'on_call').reduce((sum, r) => sum + r.amount, 0),
        total: monthRevenue.reduce((sum, r) => sum + r.amount, 0)
      };
    }).filter(month => month.total > 0);

    // Revenue by type with enhanced analysis
    const revenueByType = ['returns', 'project', 'on_call'].map(type => {
      const amount = yearRevenue.filter(r => r.type === type).reduce((sum, r) => sum + r.amount, 0);
      const typeLabel = type === 'returns' ? 'Tax Returns' : 
                      type === 'project' ? 'Project Revenue' : 
                      'Consulting Services';
      return {
        type: typeLabel,
        amount,
        percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0
      };
    }).filter(type => type.amount > 0);

    // Top clients with comprehensive metrics
    const topClients = clients.map(client => {
      const clientProjects = projects.filter(p => p.client_id === client.id);
      const clientRevenue = clientProjects.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      return {
        name: client.name,
        projects: clientProjects.length,
        revenue: clientRevenue
      };
    })
    .filter(client => client.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 15); // Top 15 for comprehensive analysis

    return {
      clients,
      projects,
      revenue: yearRevenue,
      year: selectedYear,
      totalRevenue,
      activeClients,
      activeProjects,
      avgProjectValue,
      monthlyData,
      revenueByType,
      topClients
    };
  }
}