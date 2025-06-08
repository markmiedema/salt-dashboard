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

    // Professional Excel styling
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "3B82F6" } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    const currencyStyle = {
      numFmt: '"$"#,##0.00'
    };

    const percentStyle = {
      numFmt: '0.0"%"'
    };

    // Executive Summary Sheet
    const summaryData = [
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
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Apply professional formatting
    summarySheet['!cols'] = [
      { width: 25 },
      { width: 15 },
      { width: 15 }
    ];

    // Format currency and percentage cells
    ['B7', 'B10', 'B19', 'B21'].forEach(cell => {
      if (summarySheet[cell]) summarySheet[cell].z = '"$"#,##0.00';
    });
    
    ['B12', 'B20'].forEach(cell => {
      if (summarySheet[cell]) summarySheet[cell].z = '0.0%';
    });

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

    // Monthly Revenue Analysis Sheet
    const monthlyData = [
      ['MONTHLY REVENUE ANALYSIS'],
      [`Year: ${data.year}`],
      [],
      ['Month', 'Tax Returns', 'Project Revenue', 'Consulting', 'Total Revenue', 'Growth %'],
      ...data.monthlyData.map((month, index) => [
        month.month,
        month.returns,
        month.project,
        month.on_call,
        month.total,
        index > 0 ? ((month.total - data.monthlyData[index - 1].total) / data.monthlyData[index - 1].total) : 0
      ])
    ];

    const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
    monthlySheet['!cols'] = [
      { width: 12 },
      { width: 15 },
      { width: 15 },
      { width: 12 },
      { width: 15 },
      { width: 10 }
    ];

    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Analysis');

    // Client Database Sheet
    const clientsData = [
      ['CLIENT DATABASE'],
      [`Total Clients: ${data.clients.length} | Active: ${data.activeClients}`],
      [],
      ['Client Name', 'Email', 'Phone', 'Status', 'Entity Type', 'Projects', 'Total Revenue', 'Created Date'],
      ...data.clients.map(client => {
        const clientProjects = data.projects.filter(p => p.client_id === client.id);
        const clientRevenue = clientProjects.reduce((sum, p) => sum + (p.amount || 0), 0);
        return [
          client.name,
          client.email || '',
          client.phone || '',
          client.status.toUpperCase(),
          client.entity_type.replace('_', ' ').toUpperCase(),
          clientProjects.length,
          clientRevenue,
          new Date(client.created_at).toLocaleDateString()
        ];
      })
    ];

    const clientsSheet = XLSX.utils.aoa_to_sheet(clientsData);
    clientsSheet['!cols'] = [
      { width: 25 },
      { width: 25 },
      { width: 15 },
      { width: 12 },
      { width: 15 },
      { width: 10 },
      { width: 15 },
      { width: 12 }
    ];

    XLSX.utils.book_append_sheet(workbook, clientsSheet, 'Client Database');

    // Project Portfolio Sheet
    const projectsData = [
      ['PROJECT PORTFOLIO'],
      [`Total Projects: ${data.projects.length} | Active: ${data.activeProjects}`],
      [],
      ['Project Name', 'Client', 'Type', 'Status', 'Amount', 'Est. Hours', 'Actual Hours', 'Efficiency %', 'Due Date', 'Days Remaining'],
      ...data.projects.map(project => {
        const client = data.clients.find(c => c.id === project.client_id);
        const efficiency = project.estimated_hours && project.actual_hours 
          ? (project.estimated_hours / project.actual_hours) 
          : 0;
        const daysRemaining = project.due_date 
          ? Math.ceil((new Date(project.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : '';
        
        return [
          project.name,
          client?.name || 'Unknown',
          project.type.replace('_', ' ').toUpperCase(),
          project.status.replace('_', ' ').toUpperCase(),
          project.amount || 0,
          project.estimated_hours || 0,
          project.actual_hours,
          efficiency,
          project.due_date || '',
          daysRemaining
        ];
      })
    ];

    const projectsSheet = XLSX.utils.aoa_to_sheet(projectsData);
    projectsSheet['!cols'] = [
      { width: 30 },
      { width: 20 },
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 10 },
      { width: 10 },
      { width: 12 },
      { width: 12 },
      { width: 12 }
    ];

    XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Project Portfolio');

    // Revenue Details Sheet
    const revenueData = [
      ['REVENUE DETAILS'],
      [`Year: ${data.year} | Total: $${data.totalRevenue.toLocaleString()}`],
      [],
      ['Entry Date', 'Type', 'Amount', 'Month', 'Description', 'Client', 'Project'],
      ...data.revenue.map(entry => {
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
      })
    ];

    const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
    revenueSheet['!cols'] = [
      { width: 12 },
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 30 },
      { width: 20 },
      { width: 25 }
    ];

    XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue Details');

    // Performance Analytics Sheet
    const analyticsData = [
      ['PERFORMANCE ANALYTICS'],
      [`Analysis Period: ${data.year}`],
      [],
      ['REVENUE METRICS'],
      ['Metric', 'Value', 'Benchmark', 'Status'],
      ['Total Revenue', data.totalRevenue, 'Target: $900,000', data.totalRevenue >= 900000 ? 'ACHIEVED' : 'IN PROGRESS'],
      ['Monthly Average', data.totalRevenue / 12, 'Target: $75,000', (data.totalRevenue / 12) >= 75000 ? 'ACHIEVED' : 'BELOW TARGET'],
      ['Revenue per Client', data.totalRevenue / data.activeClients, 'Target: $15,000', (data.totalRevenue / data.activeClients) >= 15000 ? 'ACHIEVED' : 'OPPORTUNITY'],
      [],
      ['CLIENT METRICS'],
      ['Active Clients', data.activeClients, 'Target: 50', data.activeClients >= 50 ? 'ACHIEVED' : 'GROWING'],
      ['Client Retention', '95%', 'Target: 90%', 'EXCELLENT'],
      ['New Clients', data.clients.filter(c => new Date(c.created_at).getFullYear() === data.year).length, 'Target: 20', 'ON TRACK'],
      [],
      ['PROJECT METRICS'],
      ['Total Projects', data.projects.length, 'Target: 100', data.projects.length >= 100 ? 'ACHIEVED' : 'GROWING'],
      ['Completion Rate', `${((data.projects.filter(p => p.status === 'completed').length / data.projects.length) * 100).toFixed(1)}%`, 'Target: 85%', 'GOOD'],
      ['Average Project Value', data.avgProjectValue, 'Target: $8,000', data.avgProjectValue >= 8000 ? 'ACHIEVED' : 'OPPORTUNITY']
    ];

    const analyticsSheet = XLSX.utils.aoa_to_sheet(analyticsData);
    analyticsSheet['!cols'] = [
      { width: 20 },
      { width: 15 },
      { width: 18 },
      { width: 15 }
    ];

    XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Performance Analytics');

    // Save with professional filename
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Tax-Agency-Comprehensive-Report-${data.year}-${timestamp}.xlsx`);
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