/**
 * Universal CSV Export & Download Utility for NLAMS
 */

export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T | string; label: string; formatter?: (val: any, row: T) => any }[]
) {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  let headers: string[];
  let getRowData: (row: T) => string[];

  if (columns && columns.length > 0) {
    headers = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`);
    getRowData = (row: T) => {
      return columns.map((col) => {
        let val: any;
        if (col.formatter) {
          val = col.formatter(row[col.key as keyof T], row);
        } else {
          val = row[col.key as keyof T];
        }
        if (val === null || val === undefined) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      });
    };
  } else {
    const keys = Object.keys(data[0]);
    headers = keys.map((k) => `"${k.replace(/"/g, '""')}"`);
    getRowData = (row: T) => {
      return keys.map((k) => {
        let val = row[k];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      });
    };
  }

  const csvContent = [headers.join(','), ...data.map((row) => getRowData(row).join(','))].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('download', cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
