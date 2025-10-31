"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, Dropdown, Input, Modal, DatePicker } from "antd";
import { Button } from "@/components/ui/button";
import type { ColumnsType } from "antd/es/table";
import type { Feedback } from "@/types/feedback";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import EditModal from "@/components/hr/feedback/editModal";
import AddModal from "@/components/hr/feedback/addModal";
import { FiSearch } from "react-icons/fi";
import { FileSpreadsheet, FileText } from "lucide-react";
import { Edit, Trash2, MoreVertical } from "lucide-react";
import { useFeedback } from "@/contexts/FeedbackContext";

const { RangePicker } = DatePicker;

export default function Feedback() {
  const { state, setSearchQuery, setDateRangeAction, openModalAction, closeModalAction, updateFeedback: ctxUpdateFeedback, deleteFeedback: ctxDeleteFeedback } = useFeedback();
  const feedbackList = (state.feedbackList || []) as Feedback[];
  const [filteredList, setFilteredList] = useState<Feedback[]>([]);
  const searchQuery = state.searchQuery || "";
  const dateRange = state.dateRange as [Date, Date] | null;

  const isHasToDate = (v: unknown): v is { toDate: () => Date } =>
    typeof v === "object" && v !== null && typeof (v as { toDate?: unknown }).toDate === "function";

  const isHasSeconds = (v: unknown): v is { seconds?: number } =>
    typeof v === "object" && v !== null && "seconds" in (v as object);

  const toDate = (val: unknown): Date | null => {
    if (!val) return null;
    if (isHasToDate(val)) return val.toDate();
    if (val instanceof Date) return val;
    if (isHasSeconds(val)) return new Date((val as { seconds?: number }).seconds! * 1000);
    const s = String(val);
    const parsed = new Date(s);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const convertRangeToDates = (dates: unknown): [Date, Date] | null => {
    if (!Array.isArray(dates) || dates.length < 2) return null;
    const a = toDate(dates[0]);
    const b = toDate(dates[1]);
    return a && b ? [a, b] : null;
  };

  const isTimestamp = (val: unknown): val is { toDate: () => Date } =>
    typeof val === "object" && val !== null && typeof (val as { toDate?: unknown }).toDate === "function";

  useEffect(() => {
    setFilteredList(
      feedbackList.map(({ id, employeeName, notes, updatedAt, score }) => ({ id, employeeName, notes, updatedAt, score }))
    );
  }, [feedbackList]);

  useEffect(() => {
    const delay = setTimeout(() => {
      let filtered = feedbackList.slice();

      if (searchQuery?.trim()) {
        const lower = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (f) => f.employeeName?.toLowerCase().includes(lower) || f.notes?.toLowerCase().includes(lower)
        );
      }

      if (dateRange && dateRange[0] && dateRange[1]) {
        const [start, end] = dateRange;
        filtered = filtered.filter((f) => {
          if (!f.updatedAt) return false;
          let date: Date;
          if (f.updatedAt instanceof Date) {
            date = f.updatedAt;
          } else if (typeof f.updatedAt === "object" && "seconds" in (f.updatedAt as { seconds?: number })) {
            date = new Date((f.updatedAt as { seconds?: number }).seconds! * 1000);
          } else {
            date = new Date(String(f.updatedAt));
          }
          return date >= start && date <= end;
        });
      }

      setFilteredList(filtered);
    }, 100);
    return () => clearTimeout(delay);
  }, [searchQuery, feedbackList, dateRange]);

  const handleDelete = (record: Feedback) => {
    Modal.confirm({
      title: "Delete Feedback",
      content: `Are you sure you want to delete ${record.employeeName || "this"} feedback?`,
      okText: "Yes, delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        if (!record.id) return;
        await ctxDeleteFeedback(record.id);
      },
    });
  };

  const exportExcel = () => {
    const data = feedbackList.map((f) => ({
      "Employee Name": f.employeeName || "Anonymous",
      Score: f.score.toString(),
      Notes: f.notes || "",
      "Last Updated": f.updatedAt
        ? f.updatedAt instanceof Date
          ? f.updatedAt.toLocaleDateString()
          : isTimestamp(f.updatedAt)
          ? f.updatedAt.toDate().toLocaleDateString()
          : ""
        : "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Feedback");
    XLSX.writeFile(wb, "feedback.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Feedback Report", 14, 15);
    autoTable(doc, {
      head: [["Employee", "Score", "Notes", "Date"]],
      body: feedbackList.map((f) => [
        f.employeeName || "Anonymous",
        f.score.toString(),
        f.notes || "",
        f.updatedAt
          ? f.updatedAt instanceof Date
            ? f.updatedAt.toLocaleDateString()
            : isTimestamp(f.updatedAt)
            ? f.updatedAt.toDate().toLocaleDateString()
            : ""
          : "",
      ]),
      theme: "grid",
    });
    doc.save("feedback.pdf");
  };

  const columns: ColumnsType<Feedback> = [
    {
      title: "Date",
      dataIndex: "updatedAt",
      key: "updatedAt",
      sorter: (a, b) => {
        const toMillis = (val: unknown): number => {
          if (!val) return 0;
          if (typeof val === "object" && val !== null && "seconds" in (val as { seconds?: number })) return (val as { seconds?: number }).seconds! * 1000;
          if (val instanceof Date) return val.getTime();
          const parsed = Date.parse(String(val));
          return isNaN(parsed) ? 0 : parsed;
        };
        return toMillis(a.updatedAt) - toMillis(b.updatedAt);
      },
      render: (value: unknown) => {
        const date = typeof value === "object" && value !== null && "seconds" in (value as { seconds?: number }) ? new Date((value as { seconds?: number }).seconds! * 1000) : value instanceof Date ? value : new Date(String(value || ""));
        return date.toLocaleString();
      },
    },
    {
      title: "Employee",
      dataIndex: "employeeName",
      render: (name: string | undefined) => name || "Anonymous",
      sorter: (a, b) => (a.employeeName || "").localeCompare(b.employeeName || ""),
    },
    {
      title: "Score",
      dataIndex: "score",
      render: (score: number) => "⭐".repeat(Math.round(score)),
      sorter: (a, b) => a.score - b.score,
    },
    {
      title: "Notes",
      dataIndex: "notes",
      ellipsis: true,
      render: (text: string | undefined) => <span style={{ whiteSpace: "pre-wrap" }}>{text}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Dropdown
          menu={{
                items: [
              {
                key: "edit",
                label: (
                  <div className="flex items-center gap-2">
                    <Edit size={16} className="text-blue-500" />
                    <span>Edit</span>
                  </div>
                ),
                onClick: () => {
                  // record is compatible with the shared Feedback type
                  openModalAction(record);
                },
              },
              {
                key: "delete",
                label: (
                  <div className="flex items-center gap-2">
                    <Trash2 size={16} className="text-red-500" />
                    <span>Delete</span>
                  </div>
                ),
                danger: true,
                onClick: () => handleDelete(record),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button className="bg-white text-primary hover:bg-secondary flex items-center justify-center">
            <MoreVertical size={18} />
          </Button>
        </Dropdown>
      ),
    },
  ];

  const handleSave = async () => {
    const selectedFeedback = state.selectedFeedback as Feedback | null;
    if (!selectedFeedback || !selectedFeedback.id) return;
    await ctxUpdateFeedback(selectedFeedback.id, {
      score: selectedFeedback.score,
      notes: selectedFeedback.notes,
    });
    closeModalAction();
  };

  const setSelectedFeedbackDispatcher: React.Dispatch<React.SetStateAction<Feedback | null>> = (value) => {
    if (typeof value === 'function') {
      const res = (value as (prev: Feedback | null) => Feedback | null)(state.selectedFeedback as Feedback | null);
      openModalAction(res);
    } else {
      openModalAction(value);
    }
  };

  return (
    <div>
      <div className="flex justify-end items-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2">
          <Button onClick={exportExcel} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium">
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </Button>

          <Button onClick={exportPDF} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium">
            <FileText className="w-4 h-4" />
            PDF
          </Button>

          <Button
            onClick={() => {
              openModalAction(null);
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

            <div className="flex gap-2 items-center">
              <div className="relative w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <Input placeholder="Search feedback..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="h-full">
                <RangePicker className="pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500" onChange={(dates: unknown) => setDateRangeAction(convertRangeToDates(dates))} allowClear />
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
                cell: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => <th {...props} className="bg-[#0076C8] text-white text-center font-semibold " />,
              },
            }}
          />
        </CardContent>
      </Card>

      {state.isModalOpen && state.selectedFeedback && (
        <EditModal
          setIsModalOpen={(v: boolean) => (v ? openModalAction(state.selectedFeedback) : closeModalAction())}
          selectedFeedback={state.selectedFeedback as Feedback}
          handleSave={handleSave}
          setSelectedFeedback={setSelectedFeedbackDispatcher}
        />
      )}

      {state.isModalOpen && !state.selectedFeedback && (
        <AddModal setIsModalOpen={(v: boolean) => (v ? openModalAction(null) : closeModalAction())} />
      )}
    </div>
  );
}
