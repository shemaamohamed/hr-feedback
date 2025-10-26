'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { feedbackService } from '@/lib/firebase/services';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type Feedback = {
  id: string;
  employeeName?: string;
  notes?: string;
  score: number;
  createdAt?: Date | { toDate: () => Date } | null;
};

export default function HRDashboardPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const tableRef = useRef<HTMLDivElement>(null);

  const isTimestamp = (val: unknown): val is { toDate: () => Date } =>
    typeof val === 'object' && val !== null && typeof (val as { toDate?: unknown }).toDate === 'function';

  useEffect(() => {
    const unsubscribe = feedbackService.subscribeFeedback((list) =>
      setFeedbackList(
        list.map(({ id, employeeName, notes, createdAt, score }) => ({
          id,
          employeeName,
          notes,
          createdAt,
          score,
        }))
      )
    );
    return () => unsubscribe();
  }, []);

  // ✅ Export as Excel
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(feedbackList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Feedback');
    XLSX.writeFile(wb, 'feedback.xlsx');
  };

  // ✅ Export as CSV
  const exportCSV = () => {
    const csvContent = [
      ['Employee', 'Score', 'Notes', 'Date'],
      ...feedbackList.map((f) => [
        f.employeeName || 'Anonymous',
        f.score,
        f.notes || '',
        f.createdAt
          ? f.createdAt instanceof Date
            ? f.createdAt.toLocaleDateString()
            : isTimestamp(f.createdAt)
            ? f.createdAt.toDate().toLocaleDateString()
            : ''
          : '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'feedback.csv';
    link.click();
  };

  // ✅ Export as PDF (with design)
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Feedback Report', 14, 15);
    autoTable(doc, {
      head: [['Employee', 'Score', 'Notes', 'Date']],
      body: feedbackList.map((f) => [
        f.employeeName || 'Anonymous',
        f.score.toString(),
        f.notes || '',
        f.createdAt
          ? f.createdAt instanceof Date
            ? f.createdAt.toLocaleDateString()
            : isTimestamp(f.createdAt)
            ? f.createdAt.toDate().toLocaleDateString()
            : ''
          : '',
      ]),
      theme: 'grid',
    });
    doc.save('feedback.pdf');
  };

  // ✅ Print Table
  const printTable = () => {
    const printContent = tableRef.current?.innerHTML;
    const printWindow = window.open('', '', 'width=900,height=700');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Feedback</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f8f9fa; }
              tr:hover { background-color: #f1f1f1; }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Feedback Dashboard</h2>

        <div className="relative group">
          <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition">
            ⬇️ Export
          </button>
          <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
            <button
              onClick={exportExcel}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              📊 Excel
            </button>
            <button
              onClick={exportCSV}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              📄 CSV
            </button>
            <button
              onClick={exportPDF}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              🧾 PDF
            </button>
            <button
              onClick={printTable}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              🖨️ Print
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>Latest feedback submissions</CardDescription>
        </CardHeader>
        <CardContent ref={tableRef}>
          {feedbackList.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Notes
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                  {feedbackList.slice(0, 5).map((fb) => (
                    <tr key={fb.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {fb.createdAt
                          ? fb.createdAt instanceof Date
                            ? fb.createdAt.toLocaleDateString()
                            : isTimestamp(fb.createdAt)
                            ? fb.createdAt.toDate().toLocaleDateString()
                            : 'Just now'
                          : 'Just now'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {fb.employeeName || 'Anonymous'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-yellow-500">
                        {typeof fb.score === 'number' && fb.score > 0
                          ? '⭐'.repeat(Math.round(fb.score))
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{fb.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-6">No feedback yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
