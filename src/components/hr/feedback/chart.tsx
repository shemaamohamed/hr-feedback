"use client";
import { ResponsivePieCanvas } from "@nivo/pie";
import { useEffect, useState } from "react";
import { feedbackService } from "@/lib/firebase/feedback";

interface Feedback {
  id: string;
  employeeName: string;
  notes: string;
  updatedAt: string;
  score: number;
}

export default function KpiScoreChart() {
  const [data, setData] = useState<{ id: string; label: string; value: number }[]>([]);

  useEffect(() => {
    const unsubscribe = feedbackService.subscribeFeedback((list: Feedback[]) => {
      const scoreCounts = [1, 2, 3, 4, 5].map((score) => ({
        id: `${score} Stars`,
        label: `${score} Stars`,
        value: list.filter((f) => f.score === score).length, // ← استخدم list بدل feedbackList
      }));

      setData(scoreCounts);
    });

    return () => unsubscribe();
  }, []);
  const colorMap: Record<string, string> = {
    "1 Stars": "#B3E5FC", // أزرق سماوي فاتح جدًا
    "2 Stars": "#81D4FA", // أزرق فاتح
    "3 Stars": "#4FC3F7", // أزرق متوسط
    "4 Stars": "#29B6F6", // أزرق ساطع
    "5 Stars": "#0076C8", // الأزرق الأساسي XonTel
  };

  return (
    <div style={{ height: 400 }}>
      <ResponsivePieCanvas
        data={data}
        margin={{ top: 40, right: 200, bottom: 40, left: 80 }}
        innerRadius={0.5}
        padAngle={0.6}
        colors={({ id }) => colorMap[id as string]} // ← استخدم خريطة الألوان
        cornerRadius={2}
        activeOuterRadiusOffset={8}
        arcLabelsTextColor="#333"
        legends={[
          {
            anchor: "right",
            direction: "column",
            translateX: 140,
            itemWidth: 60,
            itemHeight: 16,
          },
        ]}
      />
    </div>
  );
}
