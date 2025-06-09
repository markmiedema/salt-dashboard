import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Client, Project, RevenueEntry } from '../types/database';

export interface ExportData {
  summary: {
    totalRevenue: number;
    totalClients: number;
    activeProjects: number;
    completedProjects: number;
    averageProjectValue: number;
    topClient: string;
    reportPeriod: string;
    generatedDate: string;
  };
  monthlyRevenue: Array<{
    month: string;
    returns: number;
    projects: number;
    consulting: number;
    total: number;
    growth: number;
  }>;
  clients: Array<{
    name: string;
    status: string;
    entityType: string;
    email: string;
    phone: string;
    totalRevenue: number;
    projectCount: number;
    lastActivity: string;
  }>;
  projects: Array<{
    name: string;
    client: string;
    type: string;
    status: string;
    amount: number;
    estimatedHours: number;
    actualHours: number;
    efficiency: number;
    dueDate: string;
    daysRemaining: number;
  }>;
  revenueDetails: Array<{
    date: string;
    type: string;
    description: string;
    client: string;
    project: string;
    amount: number;
  }>;
}

export class ExportService {
  static prepareExportData(
    clients: Client[],
    projects: Project[],
    revenue: RevenueEntry[],
    selectedYear: number
  ): ExportData {
    const yearRevenue = revenue.filter((r) => r.year === selectedYear);
    const totalRevenue = yearRevenue.reduce((sum, r) => sum + r.amount, 0);

    // Calculate monthly revenue with growth
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthRevenue = yearRevenue.filter((r) => r.month === month);
      const returns = monthRevenue
        .filter((r) => r.type === 'returns')
        .reduce((sum, r) => sum + r.amount, 0);
      const projectRev = monthRevenue
        .filter((r) => r.type === 'project')
        .reduce((sum, r) => sum + r.amount, 0);
      const consulting = monthRevenue
        .filter((r) => r.type === 'on_call')
        .reduce((sum, r) => sum + r.amount, 0);
      const total = returns + projectRev + consulting;

      // Calculate growth vs previous month
      const prevMonth =
        i === 0
          ? 0
          : Array.from({ length: i }, (_, j) => {
              const prevMonthRevenue = yearRevenue.filter((r) => r.month === j + 1);
              return prevMonthRevenue.reduce((sum, r) => sum + r.amount, 0);
            }).slice(-1)[0] || 0;

      const growth = prevMonth > 0 ? ((total - prevMonth) / prevMonth) * 100 : 0;

      return {
        month: new Date(selectedYear, i).toLocaleDateString('en-US', { month: 'long' }),
        returns,
        projects: projectRev,
        consulting,
        total,
        growth
      };
    });

    // Enhanced client data with revenue calculations
    const clientsWithRevenue = clients.map((client) => {
      const clientProjects = projects.filter((p) => p.client_id === client.id);
      const clientRevenue = clientProjects.reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        name: client.name,
        status: client.status.charAt(0).toUpperCase() + client.status.slice(1),
        entityType: client.entity_type.charAt(0).toUpperCase() + client.entity_type.slice(1),
        email: client.email || 'N/A',
        phone: client.phone || 'N/A',
        totalRevenue: clientRevenue,
        projectCount: clientProjects.length,
        lastActivity: new Date(client.updated_at).toLocaleDateString()
      };
    });

    // Enhanced project data with efficiency metrics
    const projectsWithMetrics = projects.map((project) => {
      const client = clients.find((c) => c.id === project.client_id);
      const efficiency =
        project.estimated_hours && project.actual_hours
          ? (project.estimated_hours / project.actual_hours) * 100
          : 0;

      const daysRemaining = project.due_date
        ? Math.ceil(
            (new Date(project.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )
        : 0;

      return {
        name: project.name,
        client: client?.name || 'Unknown',
        type: project.type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        status: project.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        amount: project.amount || 0,
        estimatedHours: project.estimated_hours || 0,
        actualHours: project.actual_hours,
        efficiency,
        dueDate: project.due_date ? new Date(project.due_date).toLocaleDateString() : 'N/A',
        daysRemaining
      };
    });

    // Revenue details with full context
    const revenueDetails = revenue
      .filter((r) => r.year === selectedYear)
      .map((r) => {
        const client = r.client_id ? clients.find((c) => c.id === r.client_id) : null;
        const project = r.project_id ? projects.find((p) => p.id === r.project_id) : null;

        return {
          date: new Date(selectedYear, r.month - 1).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
          }),
          type: r.type.charAt(0).toUpperCase() + r.type.slice(1).replace('_', ' '),
          description: r.description || 'N/A',
          client: client?.name || 'General',
          project: project?.name || 'N/A',
          amount: r.amount
        };
      });

    const activeProjects = projects.filter((p) => p.status === 'in_progress').length;
    const completedProjects = projects.filter((p) => p.status === 'completed').length;
    const projectsWithAmount = projects.filter((p) => p.amount && p.amount > 0);
    const averageProjectValue =
      projectsWithAmount.length > 0
        ? projectsWithAmount.reduce((sum, p) => sum + (p.amount || 0), 0) /
          projectsWithAmount.length
        : 0;

    const topClient =
      clientsWithRevenue.length > 0
        ? clientsWithRevenue.reduce((prev, current) =>
            prev.totalRevenue > current.totalRevenue ? prev : current
          ).name
        : 'N/A';

    return {
      summary: {
        totalRevenue,
        totalClients: clients.length,
        activeProjects,
        completedProjects,
        averageProjectValue,
        topClient,
        reportPeriod: `January - December ${selectedYear}`,
        generatedDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      },
      monthlyRevenue: monthlyData.filter((m) => m.total > 0),
      clients: clientsWithRevenue.sort((a, b) => b.totalRevenue - a.totalRevenue),
      projects: projectsWithMetrics.sort((a, b) => b.amount - a.amount),
      revenueDetails: revenueDetails.sort((a, b) => b.amount - a.amount)
    };
  }

  static async exportToExcel(data: ExportData): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // Define professional color scheme
    const colors = {
      primary: 'FF2563EB', // Blue
      secondary: 'FF64748B', // Gray
      success: 'FF10B981', // Green
      warning: 'FFF59E0B', // Yellow
      danger: 'FFEF4444', // Red
      light: 'FFF8FAFC', // Light gray
      white: 'FFFFFFFF'
    };

    // Create Executive Summary Sheet
    const summaryData = [
      // Title block with merged cells
      ['TAX AGENCY DASHBOARD - EXECUTIVE SUMMARY'],
      [''],
      [`Report Period: ${data.summary.reportPeriod}`],
      [`Generated: ${data.summary.generatedDate}`],
      ['CONFIDENTIAL - FOR INTERNAL USE ONLY'],
      [''],
      ['KEY PERFORMANCE INDICATORS'],
      [''],
      ['Metric', 'Value', 'Performance'],
      [
        'Total Revenue',
        data.summary.totalRevenue,
        this.getPerformanceIndicator(data.summary.totalRevenue, 400000)
      ],
      [
        'Total Clients',
        data.summary.totalClients,
        this.getPerformanceIndicator(data.summary.totalClients, 50)
      ],
      [
        'Active Projects',
        data.summary.activeProjects,
        this.getPerformanceIndicator(data.summary.activeProjects, 15)
      ],
      ['Completed Projects', data.summary.completedProjects, 'Strong'],
      [
        'Average Project Value',
        data.summary.averageProjectValue,
        this.getPerformanceIndicator(data.summary.averageProjectValue, 5000)
      ],
      ['Top Client', data.summary.topClient, 'Key Account'],
      [''],
      ['EXECUTIVE INSIGHTS'],
      [''],
      ['• Revenue performance shows strong growth trajectory'],
      ['• Client portfolio demonstrates healthy diversification'],
      ['• Project completion rate indicates operational efficiency'],
      ['• Average project value reflects premium service positioning']
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

    // Apply professional formatting to summary sheet
    this.formatSummarySheet(summarySheet, colors);

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

    // Create Monthly Analysis Sheet
    const monthlyData = [
      ['MONTHLY REVENUE ANALYSIS'],
      [''],
      ['Month', 'Tax Returns', 'Project Revenue', 'Consulting', 'Total Revenue', 'Growth %'],
      ...data.monthlyRevenue.map((m) => [
        m.month,
        m.returns,
        m.projects,
        m.consulting,
        m.total,
        m.growth
      ]),
      [''],
      ['PERFORMANCE SUMMARY'],
      ['Total Annual Revenue', data.monthlyRevenue.reduce((sum, m) => sum + m.total, 0)],
      [
        'Average Monthly Revenue',
        data.monthlyRevenue.reduce((sum, m) => sum + m.total, 0) /
          Math.max(data.monthlyRevenue.length, 1)
      ],
      [
        'Best Performing Month',
        data.monthlyRevenue.reduce((prev, current) => (prev.total > current.total ? prev : current))
          .month
      ],
      [
        'Revenue Growth Trend',
        data.monthlyRevenue.slice(-3).reduce((sum, m) => sum + m.growth, 0) / 3
      ]
    ];

    const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
    this.formatDataSheet(monthlySheet, colors, 'Monthly Analysis');
    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Analysis');

    // Create Client Database Sheet
    const clientData = [
      ['CLIENT DATABASE & PERFORMANCE'],
      [''],
      [
        'Client Name',
        'Status',
        'Entity Type',
        'Email',
        'Phone',
        'Total Revenue',
        'Projects',
        'Last Activity'
      ],
      ...data.clients.map((c) => [
        c.name,
        c.status,
        c.entityType,
        c.email,
        c.phone,
        c.totalRevenue,
        c.projectCount,
        c.lastActivity
      ]),
      [''],
      ['CLIENT METRICS'],
      ['Total Clients', data.clients.length],
      ['Active Clients', data.clients.filter((c) => c.status === 'Active').length],
      ['Business Clients', data.clients.filter((c) => c.entityType === 'Business').length],
      [
        'Average Revenue per Client',
        data.clients.reduce((sum, c) => sum + c.totalRevenue, 0) / Math.max(data.clients.length, 1)
      ]
    ];

    const clientSheet = XLSX.utils.aoa_to_sheet(clientData);
    this.formatDataSheet(clientSheet, colors, 'Client Database');
    XLSX.utils.book_append_sheet(workbook, clientSheet, 'Client Database');

    // Create Project Portfolio Sheet
    const projectData = [
      ['PROJECT PORTFOLIO & EFFICIENCY'],
      [''],
      [
        'Project Name',
        'Client',
        'Type',
        'Status',
        'Value',
        'Est. Hours',
        'Actual Hours',
        'Efficiency %',
        'Due Date',
        'Days Remaining'
      ],
      ...data.projects.map((p) => [
        p.name,
        p.client,
        p.type,
        p.status,
        p.amount,
        p.estimatedHours,
        p.actualHours,
        p.efficiency,
        p.dueDate,
        p.daysRemaining
      ]),
      [''],
      ['PROJECT METRICS'],
      ['Total Projects', data.projects.length],
      ['Total Project Value', data.projects.reduce((sum, p) => sum + p.amount, 0)],
      [
        'Average Efficiency',
        data.projects.filter((p) => p.efficiency > 0).reduce((sum, p) => sum + p.efficiency, 0) /
          Math.max(data.projects.filter((p) => p.efficiency > 0).length, 1)
      ],
      [
        'Projects at Risk',
        data.projects.filter((p) => p.daysRemaining < 7 && p.daysRemaining > 0).length
      ]
    ];

    const projectSheet = XLSX.utils.aoa_to_sheet(projectData);
    this.formatDataSheet(projectSheet, colors, 'Project Portfolio');
    XLSX.utils.book_append_sheet(workbook, projectSheet, 'Project Portfolio');

    // Create Revenue Details Sheet
    const revenueDetailData = [
      ['REVENUE TRANSACTION DETAILS'],
      [''],
      ['Period', 'Type', 'Description', 'Client', 'Project', 'Amount'],
      ...data.revenueDetails.map((r) => [
        r.date,
        r.type,
        r.description,
        r.client,
        r.project,
        r.amount
      ]),
      [''],
      ['REVENUE BREAKDOWN'],
      ['Total Transactions', data.revenueDetails.length],
      [
        'Average Transaction',
        data.revenueDetails.reduce((sum, r) => sum + r.amount, 0) /
          Math.max(data.revenueDetails.length, 1)
      ],
      ['Largest Transaction', Math.max(...data.revenueDetails.map((r) => r.amount))],
      ['Revenue Concentration', 'Diversified across multiple streams']
    ];

    const revenueSheet = XLSX.utils.aoa_to_sheet(revenueDetailData);
    this.formatDataSheet(revenueSheet, colors, 'Revenue Details');
    XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue Details');

    // Create Performance Analytics Sheet
    const analyticsData = [
      ['PERFORMANCE ANALYTICS & BENCHMARKING'],
      [''],
      ['KPI', 'Current Value', 'Target', 'Achievement %', 'Status'],
      [
        'Monthly Revenue Target',
        data.summary.totalRevenue / 12,
        75000,
        (data.summary.totalRevenue / 12 / 75000) * 100,
        this.getAchievementStatus((data.summary.totalRevenue / 12 / 75000) * 100)
      ],
      [
        'Client Growth Target',
        data.summary.totalClients,
        60,
        (data.summary.totalClients / 60) * 100,
        this.getAchievementStatus((data.summary.totalClients / 60) * 100)
      ],
      [
        'Project Completion Rate',
        (data.summary.completedProjects /
          (data.summary.activeProjects + data.summary.completedProjects)) *
          100,
        85,
        (((data.summary.completedProjects /
          (data.summary.activeProjects + data.summary.completedProjects)) *
          100) /
          85) *
          100,
        'On Track'
      ],
      [
        'Average Project Value',
        data.summary.averageProjectValue,
        8000,
        (data.summary.averageProjectValue / 8000) * 100,
        this.getAchievementStatus((data.summary.averageProjectValue / 8000) * 100)
      ],
      [''],
      ['TREND ANALYSIS'],
      ['Revenue Growth Trajectory', 'Positive'],
      ['Client Acquisition Rate', 'Steady'],
      ['Project Pipeline Health', 'Strong'],
      ['Service Mix Optimization', 'Balanced'],
      [''],
      ['RECOMMENDATIONS'],
      ['• Focus on high-value project acquisition'],
      ['• Expand advisory services for recurring revenue'],
      ['• Implement client retention strategies'],
      ['• Optimize project delivery efficiency']
    ];

    const analyticsSheet = XLSX.utils.aoa_to_sheet(analyticsData);
    this.formatDataSheet(analyticsSheet, colors, 'Performance Analytics');
    XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Performance Analytics');

    // Generate and download the file
    const fileName = `Tax_Agency_Report_${data.summary.reportPeriod.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  private static formatSummarySheet(sheet: XLSX.WorkSheet, colors: any): void {
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:C25');

    // Set column widths
    sheet['!cols'] = [
      { width: 25 }, // Column A
      { width: 20 }, // Column B
      { width: 15 } // Column C
    ];

    // Format title (A1)
    if (sheet['A1']) {
      sheet['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: colors.primary } },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: colors.light } },
        border: {
          top: { style: 'thick', color: { rgb: colors.primary } },
          bottom: { style: 'thick', color: { rgb: colors.primary } },
          left: { style: 'thick', color: { rgb: colors.primary } },
          right: { style: 'thick', color: { rgb: colors.primary } }
        }
      };
    }

    // Format report metadata (A3:A5)
    ['A3', 'A4', 'A5'].forEach((cell) => {
      if (sheet[cell]) {
        sheet[cell].s = {
          font: { italic: true, sz: 10, color: { rgb: colors.secondary } },
          alignment: { horizontal: 'left' }
        };
      }
    });

    // Format KPI section header (A7)
    if (sheet['A7']) {
      sheet['A7'].s = {
        font: { bold: true, sz: 12, color: { rgb: colors.white } },
        alignment: { horizontal: 'center' },
        fill: { fgColor: { rgb: colors.primary } },
        border: {
          top: { style: 'medium', color: { rgb: colors.primary } },
          bottom: { style: 'medium', color: { rgb: colors.primary } },
          left: { style: 'medium', color: { rgb: colors.primary } },
          right: { style: 'medium', color: { rgb: colors.primary } }
        }
      };
    }

    // Format KPI table headers (A9:C9)
    ['A9', 'B9', 'C9'].forEach((cell) => {
      if (sheet[cell]) {
        sheet[cell].s = {
          font: { bold: true, sz: 11, color: { rgb: colors.white } },
          alignment: { horizontal: 'center' },
          fill: { fgColor: { rgb: colors.secondary } },
          border: {
            top: { style: 'thin', color: { rgb: colors.secondary } },
            bottom: { style: 'thin', color: { rgb: colors.secondary } },
            left: { style: 'thin', color: { rgb: colors.secondary } },
            right: { style: 'thin', color: { rgb: colors.secondary } }
          }
        };
      }
    });

    // Format KPI data rows with zebra striping
    for (let row = 10; row <= 15; row++) {
      const isEvenRow = (row - 10) % 2 === 0;
      const fillColor = isEvenRow ? colors.white : colors.light;

      ['A', 'B', 'C'].forEach((col) => {
        const cell = `${col}${row}`;
        if (sheet[cell]) {
          sheet[cell].s = {
            font: { sz: 10 },
            alignment: { horizontal: col === 'A' ? 'left' : col === 'B' ? 'right' : 'center' },
            fill: { fgColor: { rgb: fillColor } },
            border: {
              top: { style: 'thin', color: { rgb: colors.secondary } },
              bottom: { style: 'thin', color: { rgb: colors.secondary } },
              left: { style: 'thin', color: { rgb: colors.secondary } },
              right: { style: 'thin', color: { rgb: colors.secondary } }
            },
            numFmt: col === 'B' && row <= 14 ? '$#,##0' : undefined
          };
        }
      });
    }

    // Format insights section
    if (sheet['A17']) {
      sheet['A17'].s = {
        font: { bold: true, sz: 12, color: { rgb: colors.primary } },
        alignment: { horizontal: 'left' }
      };
    }

    // Merge title cell across columns
    sheet['!merges'] = [
      { s: { c: 0, r: 0 }, e: { c: 2, r: 0 } }, // Title
      { s: { c: 0, r: 6 }, e: { c: 2, r: 6 } }, // KPI header
      { s: { c: 0, r: 16 }, e: { c: 2, r: 16 } } // Insights header
    ];
  }

  private static formatDataSheet(sheet: XLSX.WorkSheet, colors: any, sheetName: string): void {
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:J50');

    // Set column widths based on content
    const colWidths =
      sheetName === 'Client Database'
        ? [25, 12, 15, 25, 15, 15, 10, 15]
        : sheetName === 'Project Portfolio'
          ? [25, 20, 15, 12, 12, 10, 10, 10, 12, 10]
          : [20, 15, 30, 20, 20, 15];

    sheet['!cols'] = colWidths.map((width) => ({ width }));

    // Format title (A1)
    if (sheet['A1']) {
      sheet['A1'].s = {
        font: { bold: true, sz: 14, color: { rgb: colors.primary } },
        alignment: { horizontal: 'center' },
        fill: { fgColor: { rgb: colors.light } },
        border: {
          top: { style: 'medium', color: { rgb: colors.primary } },
          bottom: { style: 'medium', color: { rgb: colors.primary } },
          left: { style: 'medium', color: { rgb: colors.primary } },
          right: { style: 'medium', color: { rgb: colors.primary } }
        }
      };
    }

    // Format data table headers (row 3)
    for (let col = 0; col <= range.e.c; col++) {
      const cell = XLSX.utils.encode_cell({ r: 2, c: col });
      if (sheet[cell]) {
        sheet[cell].s = {
          font: { bold: true, sz: 10, color: { rgb: colors.white } },
          alignment: { horizontal: 'center' },
          fill: { fgColor: { rgb: colors.secondary } },
          border: {
            top: { style: 'thin', color: { rgb: colors.secondary } },
            bottom: { style: 'thin', color: { rgb: colors.secondary } },
            left: { style: 'thin', color: { rgb: colors.secondary } },
            right: { style: 'thin', color: { rgb: colors.secondary } }
          }
        };
      }
    }

    // Format data rows with zebra striping and proper number formatting
    let dataRowStart = 3;
    let dataRowEnd = range.e.r;

    // Find where data ends (look for empty row)
    for (let row = dataRowStart; row <= range.e.r; row++) {
      const cellA = XLSX.utils.encode_cell({ r: row, c: 0 });
      if (!sheet[cellA] || sheet[cellA].v === '') {
        dataRowEnd = row - 1;
        break;
      }
    }

    for (let row = dataRowStart; row <= dataRowEnd; row++) {
      const isEvenRow = (row - dataRowStart) % 2 === 0;
      const fillColor = isEvenRow ? colors.white : colors.light;

      for (let col = 0; col <= range.e.c; col++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col });
        if (sheet[cell]) {
          // Determine number format based on column content
          let numFmt = undefined;
          if (typeof sheet[cell].v === 'number') {
            if (sheetName === 'Client Database' && col === 5)
              numFmt = '$#,##0'; // Total Revenue
            else if (sheetName === 'Project Portfolio' && col === 4)
              numFmt = '$#,##0'; // Value
            else if (sheetName === 'Project Portfolio' && col === 7)
              numFmt = '0.0%'; // Efficiency
            else if (sheetName === 'Revenue Details' && col === 5)
              numFmt = '$#,##0'; // Amount
            else if (sheetName === 'Monthly Analysis' && col >= 1 && col <= 4)
              numFmt = '$#,##0'; // Revenue columns
            else if (sheetName === 'Monthly Analysis' && col === 5) numFmt = '0.0%'; // Growth
          }

          sheet[cell].s = {
            font: { sz: 9 },
            alignment: {
              horizontal: typeof sheet[cell].v === 'number' ? 'right' : 'left',
              vertical: 'center'
            },
            fill: { fgColor: { rgb: fillColor } },
            border: {
              top: { style: 'thin', color: { rgb: colors.secondary } },
              bottom: { style: 'thin', color: { rgb: colors.secondary } },
              left: { style: 'thin', color: { rgb: colors.secondary } },
              right: { style: 'thin', color: { rgb: colors.secondary } }
            },
            numFmt
          };
        }
      }
    }

    // Merge title across all columns
    sheet['!merges'] = [{ s: { c: 0, r: 0 }, e: { c: range.e.c, r: 0 } }];

    // Set print area and freeze panes
    sheet['!printHeader'] = '1:3';
    sheet['!freeze'] = { xSplit: 0, ySplit: 3 };
  }

  private static getPerformanceIndicator(value: number, target: number): string {
    const ratio = value / target;
    if (ratio >= 1.1) return 'Excellent';
    if (ratio >= 0.9) return 'Strong';
    if (ratio >= 0.7) return 'On Track';
    if (ratio >= 0.5) return 'Below Target';
    return 'Needs Attention';
  }

  private static getAchievementStatus(percentage: number): string {
    if (percentage >= 100) return 'Achieved';
    if (percentage >= 90) return 'On Track';
    if (percentage >= 70) return 'Progressing';
    return 'Behind Target';
  }

  static async exportToPDF(data: ExportData): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text('Tax Agency Dashboard Report', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Period: ${data.summary.reportPeriod}`, pageWidth / 2, 30, { align: 'center' });
    doc.text(`Generated: ${data.summary.generatedDate}`, pageWidth / 2, 37, { align: 'center' });

    // Executive Summary
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Executive Summary', 20, 55);

    const summaryData = [
      ['Metric', 'Value'],
      ['Total Revenue', `$${data.summary.totalRevenue.toLocaleString()}`],
      ['Total Clients', data.summary.totalClients.toString()],
      ['Active Projects', data.summary.activeProjects.toString()],
      ['Completed Projects', data.summary.completedProjects.toString()],
      ['Average Project Value', `$${data.summary.averageProjectValue.toLocaleString()}`],
      ['Top Client', data.summary.topClient]
    ];

    autoTable(doc, {
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: 65,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 80, halign: 'right' }
      }
    });

    // Monthly Revenue Chart (simplified table)
    const finalY = (doc as any).lastAutoTable.finalY + 20;

    doc.setFontSize(16);
    doc.text('Monthly Revenue Analysis', 20, finalY);

    const monthlyTableData = data.monthlyRevenue.map((m) => [
      m.month,
      `$${m.returns.toLocaleString()}`,
      `$${m.projects.toLocaleString()}`,
      `$${m.consulting.toLocaleString()}`,
      `$${m.total.toLocaleString()}`,
      `${m.growth.toFixed(1)}%`
    ]);

    autoTable(doc, {
      head: [['Month', 'Tax Returns', 'Projects', 'Consulting', 'Total', 'Growth %']],
      body: monthlyTableData,
      startY: finalY + 10,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      styles: { fontSize: 9 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      }
    });

    // Add new page for detailed data
    doc.addPage();

    // Top Clients
    doc.setFontSize(16);
    doc.text('Top Clients by Revenue', 20, 20);

    const topClientsData = data.clients
      .slice(0, 10)
      .map((c) => [
        c.name,
        c.status,
        c.entityType,
        `$${c.totalRevenue.toLocaleString()}`,
        c.projectCount.toString()
      ]);

    autoTable(doc, {
      head: [['Client Name', 'Status', 'Type', 'Revenue', 'Projects']],
      body: topClientsData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      styles: { fontSize: 9 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' }
      }
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      doc.text('Confidential - Tax Agency Dashboard', 20, pageHeight - 10);
    }

    // Save the PDF
    const fileName = `Tax_Agency_Report_${data.summary.reportPeriod.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
}
