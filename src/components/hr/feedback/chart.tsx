"use client";
import { ResponsivePieCanvas } from "@nivo/pie";
import { useMemo } from "react";
import { useFeedback } from "@/contexts/FeedbackContext";

export default function KpiScoreChart() {
  const { state } = useFeedback();

  const data = useMemo(() => {
    const feedbackList = (state.feedbackList || []) as { score?: number }[];
    return [1, 2, 3, 4, 5].map((score) => ({
      id: `${score} Stars`,
      label: `${score} Stars`,
      value: feedbackList.filter((f) => Math.round(Number(f.score || 0)) === score).length,
    }));
  }, [state.feedbackList]);
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
