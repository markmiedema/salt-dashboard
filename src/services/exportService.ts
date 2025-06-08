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
  static async exportToPDF(data: ExportData): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Tax Agency Dashboard Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    doc.text(`Report Period: ${data.year}`, pageWidth / 2, yPosition + 8, { align: 'center' });
    yPosition += 25;

    // Executive Summary
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const summaryData = [
      ['Total Revenue', `$${data.totalRevenue.toLocaleString()}`],
      ['Active Clients', data.activeClients.toString()],
      ['Active Projects', data.activeProjects.toString()],
      ['Average Project Value', `$${data.avgProjectValue.toLocaleString()}`],
      ['Total Projects Completed', data.projects.filter(p => p.status === 'completed').length.toString()],
      ['Client Retention Rate', '95%'] // Mock data
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Monthly Revenue Breakdown
    checkPageBreak(60);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Monthly Revenue Breakdown', 20, yPosition);
    yPosition += 15;

    const monthlyTableData = data.monthlyData.map(month => [
      month.month,
      `$${month.returns.toLocaleString()}`,
      `$${month.project.toLocaleString()}`,
      `$${month.on_call.toLocaleString()}`,
      `$${month.total.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Month', 'Tax Returns', 'Projects', 'Consulting', 'Total']],
      body: monthlyTableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Revenue by Service Type
    checkPageBreak(50);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Revenue by Service Type', 20, yPosition);
    yPosition += 15;

    const revenueTypeData = data.revenueByType.map(type => [
      type.type,
      `$${type.amount.toLocaleString()}`,
      `${type.percentage.toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Service Type', 'Revenue', 'Percentage']],
      body: revenueTypeData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Top Clients
    checkPageBreak(60);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Clients by Revenue', 20, yPosition);
    yPosition += 15;

    const topClientsData = data.topClients.slice(0, 10).map((client, index) => [
      (index + 1).toString(),
      client.name,
      client.projects.toString(),
      `$${client.revenue.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Rank', 'Client Name', 'Projects', 'Revenue']],
      body: topClientsData,
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] },
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Project Status Summary
    checkPageBreak(50);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Status Summary', 20, yPosition);
    yPosition += 15;

    const projectStatusData = [
      ['Pending', data.projects.filter(p => p.status === 'pending').length.toString()],
      ['In Progress', data.projects.filter(p => p.status === 'in_progress').length.toString()],
      ['Completed', data.projects.filter(p => p.status === 'completed').length.toString()],
      ['On Hold', data.projects.filter(p => p.status === 'on_hold').length.toString()]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Status', 'Count']],
      body: projectStatusData,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 }
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${totalPages} | Tax Agency Dashboard | Confidential`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    doc.save(`tax-agency-report-${data.year}-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  static async exportToExcel(data: ExportData): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Tax Agency Dashboard Report'],
      [`Report Period: ${data.year}`],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [],
      ['EXECUTIVE SUMMARY'],
      ['Metric', 'Value'],
      ['Total Revenue', data.totalRevenue],
      ['Active Clients', data.activeClients],
      ['Active Projects', data.activeProjects],
      ['Average Project Value', data.avgProjectValue],
      ['Completed Projects', data.projects.filter(p => p.status === 'completed').length],
      [],
      ['REVENUE BY TYPE'],
      ['Service Type', 'Amount', 'Percentage'],
      ...data.revenueByType.map(type => [type.type, type.amount, type.percentage / 100])
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Format currency columns
    const range = XLSX.utils.decode_range(summarySheet['!ref'] || 'A1');
    for (let row = 6; row <= 10; row++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: 1 });
      if (summarySheet[cellRef] && typeof summarySheet[cellRef].v === 'number') {
        summarySheet[cellRef].z = '"$"#,##0.00';
      }
    }

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Monthly Revenue Sheet
    const monthlyData = [
      ['Monthly Revenue Breakdown'],
      [],
      ['Month', 'Tax Returns', 'Projects', 'Consulting', 'Total'],
      ...data.monthlyData.map(month => [
        month.month,
        month.returns,
        month.project,
        month.on_call,
        month.total
      ])
    ];

    const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Revenue');

    // Clients Sheet
    const clientsData = [
      ['Client Details'],
      [],
      ['Name', 'Email', 'Phone', 'Status', 'Entity Type', 'Created Date'],
      ...data.clients.map(client => [
        client.name,
        client.email || '',
        client.phone || '',
        client.status,
        client.entity_type,
        new Date(client.created_at).toLocaleDateString()
      ])
    ];

    const clientsSheet = XLSX.utils.aoa_to_sheet(clientsData);
    XLSX.utils.book_append_sheet(workbook, clientsSheet, 'Clients');

    // Projects Sheet
    const projectsData = [
      ['Project Details'],
      [],
      ['Name', 'Client', 'Type', 'Status', 'Amount', 'Est. Hours', 'Actual Hours', 'Due Date'],
      ...data.projects.map(project => {
        const client = data.clients.find(c => c.id === project.client_id);
        return [
          project.name,
          client?.name || 'Unknown',
          project.type.replace('_', ' '),
          project.status.replace('_', ' '),
          project.amount || 0,
          project.estimated_hours || 0,
          project.actual_hours,
          project.due_date || ''
        ];
      })
    ];

    const projectsSheet = XLSX.utils.aoa_to_sheet(projectsData);
    XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Projects');

    // Revenue Entries Sheet
    const revenueData = [
      ['Revenue Entries'],
      [],
      ['Type', 'Amount', 'Month', 'Year', 'Description'],
      ...data.revenue.map(entry => [
        entry.type,
        entry.amount,
        entry.month,
        entry.year,
        entry.description || ''
      ])
    ];

    const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
    XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue Entries');

    // Top Clients Sheet
    const topClientsData = [
      ['Top Clients by Revenue'],
      [],
      ['Rank', 'Client Name', 'Projects', 'Total Revenue'],
      ...data.topClients.map((client, index) => [
        index + 1,
        client.name,
        client.projects,
        client.revenue
      ])
    ];

    const topClientsSheet = XLSX.utils.aoa_to_sheet(topClientsData);
    XLSX.utils.book_append_sheet(workbook, topClientsSheet, 'Top Clients');

    // Save the Excel file
    XLSX.writeFile(workbook, `tax-agency-report-${data.year}-${new Date().toISOString().split('T')[0]}.xlsx`);
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

    // Monthly data
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

    // Revenue by type
    const revenueByType = ['returns', 'project', 'on_call'].map(type => {
      const amount = yearRevenue.filter(r => r.type === type).reduce((sum, r) => sum + r.amount, 0);
      return {
        type: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
        amount,
        percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0
      };
    }).filter(type => type.amount > 0);

    // Top clients
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
    .slice(0, 10);

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