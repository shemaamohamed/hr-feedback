'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { feedbackService } from '@/lib/firebase/services';
import { Table, Button, Dropdown, Input, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import EditModal from './editModal';
import AddModal from './addModal';
import { FiSearch } from 'react-icons/fi';

interface Feedback {
  id: string;
  employeeName?: string;
  notes?: string;
  score: number;
  updatedAt?: any;
}

export default function HRDashboardPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [filteredList, setFilteredList] = useState<Feedback[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  const isTimestamp = (val: unknown): val is { toDate: () => Date } =>
    typeof val === 'object' && val !== null && typeof (val as { toDate?: unknown }).toDate === 'function';

  // ✅ Load feedbacks
  useEffect(() => {
    const unsubscribe = feedbackService.subscribeFeedback((list) => {
      const formatted = list.map(({ id, employeeName, notes, updatedAt, score }) => ({
        id,
        employeeName,
        notes,
        updatedAt,
        score,
      }));
      setFeedbackList(formatted);
      setFilteredList(formatted);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredList(feedbackList);
      } else {
        const lower = searchQuery.toLowerCase();
        setFilteredList(
          feedbackList.filter(
            (f) =>
              f.employeeName?.toLowerCase().includes(lower) ||
              f.notes?.toLowerCase().includes(lower)
          )
        );
      }
    }, 100);
    return () => clearTimeout(delay);
  }, [searchQuery, feedbackList]);

  // ✅ Delete feedback
  const handleDelete = (record: Feedback) => {
    Modal.confirm({
      title: 'Delete Feedback',
      content: `Are you sure you want to delete ${record.employeeName || 'this'} feedback?`,
      okText: 'Yes, delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        await feedbackService.deleteFeedback(record.id);
      },
    });
  };

  // ✅ Export Excel
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(feedbackList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Feedback');
    XLSX.writeFile(wb, 'feedback.xlsx');
  };

  // ✅ Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Feedback Report', 14, 15);
    autoTable(doc, {
      head: [['Employee', 'Score', 'Notes', 'Date']],
      body: feedbackList.map((f) => [
        f.employeeName || 'Anonymous',
        f.score.toString(),
        f.notes || '',
        f.updatedAt
          ? f.updatedAt instanceof Date
            ? f.updatedAt.toLocaleDateString()
            : isTimestamp(f.updatedAt)
            ? f.updatedAt.toDate().toLocaleDateString()
            : ''
          : '',
      ]),
      theme: 'grid',
    });
    doc.save('feedback.pdf');
  };
  // ✅ Columns
  const columns: ColumnsType<Feedback> = [
    {
      title: 'Date',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      sorter: (a, b) => {
        const toMillis = (val: any) => {
          if (!val) return 0;
          if (val.seconds) return val.seconds * 1000;
          if (val instanceof Date) return val.getTime();
          const parsed = Date.parse(val);
          return isNaN(parsed) ? 0 : parsed;
        };
        return toMillis(a.updatedAt) - toMillis(b.updatedAt);
      },
      render: (value: any) => {
        const date =
          value?.seconds
            ? new Date(value.seconds * 1000)
            : value instanceof Date
            ? value
            : new Date(value);
        return date.toLocaleString();
      },
    },
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      render: (name) => name || 'Anonymous',
      sorter: (a, b) => (a.employeeName || '').localeCompare(b.employeeName || ''),
    },
    {
      title: 'Score',
      dataIndex: 'score',
      render: (score) => '⭐'.repeat(Math.round(score)),
      sorter: (a, b) => a.score - b.score,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      ellipsis: true,
      render: (text: string) => <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                label: '✏️ Edit',
                onClick: () => {
                  setSelectedFeedback(record);
                  setIsModalOpen(true);
                },
              },
              {
                key: 'delete',
                label: '🗑️ Delete',
                danger: true,
                onClick: () => handleDelete(record),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button>⋮</Button>
        </Dropdown>
      ),
    },
  ];

  // ✅ Save Changes
  const handleSave = async () => {
    if (!selectedFeedback) return;
    await feedbackService.updateFeedback(selectedFeedback.id, {
      score: selectedFeedback.score,
      notes: selectedFeedback.notes,
    });
    setIsModalOpen(false);
    setSelectedFeedback(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Feedback Dashboard</h2>
        <div className="flex gap-2">
          <Button onClick={exportExcel}>📊 Excel</Button>
          <Button onClick={exportPDF}>🧾 PDF</Button>
          <Button
            type="primary"
            onClick={() => {
              setIsModalOpen(true);
              setSelectedFeedback(null);
            }}
          >
            + Add Feedback
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-none">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Feedback</CardTitle>
              <CardDescription>Latest feedback submissions</CardDescription>
            </div>

            {/* 🔍 Search Input */}
            <div className="relative w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <Input
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table
            columns={columns}
            dataSource={filteredList.map((f) => ({ ...f, key: f.id }))}
            pagination={{ pageSize: 5 }}
          />
        </CardContent>
      </Card>

      {isModalOpen && selectedFeedback && (
        <EditModal
          setIsModalOpen={setIsModalOpen}
          selectedFeedback={selectedFeedback}
          handleSave={handleSave}
          setSelectedFeedback={setSelectedFeedback}
        />
      )}

      {isModalOpen && !selectedFeedback && <AddModal setIsModalOpen={setIsModalOpen} />}
    </div>
  );
}
