import { Injectable } from '@angular/core';

export interface ExportColumn {
  key: string;
  header: string;
  format?: (value: any) => string;
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  // ========== EXCEL/CSV EXPORT ==========

  exportToExcel(data: any[], columns: ExportColumn[], filename: string): void {
    const csvContent = this.generateCSV(data, columns);
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, `${filename}.csv`);
  }

  private generateCSV(data: any[], columns: ExportColumn[]): string {
    const headers = columns.map(col => `"${col.header}"`).join(';');

    const rows = data.map(item => {
      return columns.map(col => {
        let value = this.getNestedValue(item, col.key);
        if (col.format) {
          value = col.format(value);
        }
        if (value === null || value === undefined) {
          value = '';
        }
        // Escape quotes and wrap in quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(';');
    });

    return [headers, ...rows].join('\n');
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // ========== PDF EXPORT ==========

  exportToPDF(title: string, content: HTMLElement | string, filename: string): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les popups pour exporter en PDF');
      return;
    }

    const htmlContent = typeof content === 'string' ? content : content.outerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            color: #1f2937;
            line-height: 1.6;
          }
          .report-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          .report-title {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 8px;
          }
          .report-date {
            font-size: 14px;
            color: #6b7280;
          }
          .report-logo {
            font-size: 32px;
            margin-bottom: 16px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td {
            font-size: 14px;
          }
          tr:hover {
            background: #f9fafb;
          }
          .stat-card {
            display: inline-block;
            padding: 20px;
            margin: 10px;
            background: #f9fafb;
            border-radius: 8px;
            min-width: 150px;
            text-align: center;
          }
          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
          }
          .stat-label {
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
          }
          .section-title {
            font-size: 18px;
            font-weight: 600;
            margin: 30px 0 15px;
            color: #374151;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div class="report-logo">Bazar'Be</div>
          <h1 class="report-title">${title}</h1>
          <p class="report-date">Généré le ${new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
        ${htmlContent}
        <div class="footer">
          <p>Bazar'Be - Centre Commercial en Ligne</p>
          <p>Ce document a été généré automatiquement</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }

  // ========== TABLE EXPORT HELPERS ==========

  generateTableHTML(data: any[], columns: ExportColumn[], title?: string): string {
    let html = '';

    if (title) {
      html += `<h2 class="section-title">${title}</h2>`;
    }

    html += '<table><thead><tr>';
    columns.forEach(col => {
      html += `<th>${col.header}</th>`;
    });
    html += '</tr></thead><tbody>';

    data.forEach(item => {
      html += '<tr>';
      columns.forEach(col => {
        let value = this.getNestedValue(item, col.key);
        if (col.format) {
          value = col.format(value);
        }
        html += `<td>${value ?? ''}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
  }

  generateStatsHTML(stats: { label: string; value: string | number }[]): string {
    let html = '<div class="stats-container">';
    stats.forEach(stat => {
      html += `
        <div class="stat-card">
          <div class="stat-value">${stat.value}</div>
          <div class="stat-label">${stat.label}</div>
        </div>
      `;
    });
    html += '</div>';
    return html;
  }

  // ========== UTILITY ==========

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // ========== COMMON FORMATTERS ==========

  formatPrice(amount: number): string {
    if (amount === null || amount === undefined) return '';
    return Math.round(amount).toLocaleString('fr-FR') + ' Ar';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('fr-FR');
  }

  formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'En attente',
      'confirmed': 'Confirmé',
      'processing': 'En cours',
      'shipped': 'Expédié',
      'delivered': 'Livré',
      'cancelled': 'Annulé',
      'active': 'Actif',
      'inactive': 'Inactif',
      'paid': 'Payé',
      'unpaid': 'Non payé',
      'overdue': 'En retard'
    };
    return statusMap[status] || status;
  }
}
