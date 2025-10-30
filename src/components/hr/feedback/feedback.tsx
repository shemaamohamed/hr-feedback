'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { feedbackService } from '@/lib/firebase/feedback';
import { Table, Dropdown, Input, Modal, DatePicker } from 'antd';
import { Button } from '@/components/ui/button';

import type { ColumnsType } from 'antd/es/table';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import EditModal from '@/components/hr/feedback/editModal'
import AddModal from '@/components/hr/feedback/addModal';
import { FiSearch } from 'react-icons/fi';
import moment, { Moment } from 'moment';
import { FileSpreadsheet, FileText } from "lucide-react";


const { RangePicker } = DatePicker;

interface Feedback {
  id: string;
  employeeName?: string;
  notes?: string;
  score: number;
  updatedAt?: Timestamp | any;
}


export default function Feedback() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [filteredList, setFilteredList] = useState<Feedback[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Moment | null, Moment | null] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  const isTimestamp = (val: unknown): val is { toDate: () => Date } =>
    typeof val === 'object' &&
    val !== null &&
    typeof (val as { toDate?: unknown }).toDate === 'function';

  useEffect(() => {
    const unsubscribe = feedbackService.subscribeFeedback((list: Feedback[]) => {
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
      let filtered = feedbackList;

      if (searchQuery.trim()) {
        const lower = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (f) =>
            f.employeeName?.toLowerCase().includes(lower) ||
            f.notes?.toLowerCase().includes(lower)
        );
      }

      // 📅 Date range
      if (dateRange && dateRange[0] && dateRange[1]) {
        const [start, end] = dateRange;
        filtered = filtered.filter((f) => {
          if (!f.updatedAt) return false;
          const date = f.updatedAt.toDate ? f.updatedAt.toDate() : new Date(f.updatedAt);
          return date >= start.toDate() && date <= end.toDate();
        });
      }

      setFilteredList(filtered);
    }, 100);
    return () => clearTimeout(delay);
  }, [searchQuery, feedbackList, dateRange]);

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
    const data = feedbackList.map((f) => ({
      'Employee Name': f.employeeName || 'Anonymous',
      Score: f.score.toString(),
      Notes: f.notes || '',
      'Last Updated': f.updatedAt
        ? f.updatedAt instanceof Date
          ? f.updatedAt.toLocaleDateString()
          : isTimestamp(f.updatedAt)
          ? f.updatedAt.toDate().toLocaleDateString()
          : ''
        : '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
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

  // ✅ Table Columns
  const columns: ColumnsType<Feedback> = [
    {
      title: 'Date',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      sorter: (a, b) => {
        const toMillis = (val: any): number => {
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
      render: (name: string | undefined) => name || 'Anonymous',
      sorter: (a, b) => (a.employeeName || '').localeCompare(b.employeeName || ''),
    },
    {
      title: 'Score',
      dataIndex: 'score',
      render: (score: number) => '⭐'.repeat(Math.round(score)),
      sorter: (a, b) => a.score - b.score,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      ellipsis: true,
      render: (text: string | undefined) => (
        <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>
      ),
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
          <Button className="bg-white text-primary hover:bg-secondary">⋮</Button>
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
    <div >
      <div className="flex justify-end items-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2">
       <Button
  onClick={exportExcel}
  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium"
>
  <FileSpreadsheet className="w-4 h-4" />
  Excel
</Button>

<Button
  onClick={exportPDF}
  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium"
>
  <FileText className="w-4 h-4" />
  PDF
</Button>
          <Button
            onClick={() => {
              setIsModalOpen(true);
              setSelectedFeedback(null);
            }}
          >
            Add Feedback +
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-none">
        <CardHeader>
          <div className=" grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <CardTitle>Recent Feedback</CardTitle>
              <CardDescription>Latest feedback submissions</CardDescription>
            </div>

            {/* 🔍 Search + Date Range */}
            <div className="flex gap-2 items-center">
              <div className="relative w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <Input
                  placeholder="Search feedback..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="h-full ">  <RangePicker
                                className="pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"

                onChange={(dates) => setDateRange(dates as [Moment | null, Moment | null])}
                allowClear
              />

                </div>
            
            </div>
          </div>
        </CardHeader>

        <CardContent>
         <Table
  columns={columns}
  scroll={{ x: "max-content" }}
  dataSource={filteredList.map((f) => ({ ...f, key: f.id }))}
  pagination={{ pageSize: 5 }}
  components={{
    header: {
      cell: (props: any) => (
        <th
          {...props}
          className="bg-[#0076C8] text-white text-center font-semibold "
        />
      ),
    },
  }}
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

      {isModalOpen && !selectedFeedback && (
        <AddModal setIsModalOpen={setIsModalOpen} />
      )}
    </div>
  );
}
