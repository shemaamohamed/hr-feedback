import React from "react";
import { Button } from '@/components/ui/button';


type Feedback = {
  id?: string;
  employeeId?: string;
  employeeName?: string;
  notes?: string;
  score?: number;
  updatedAt?: Timestamp;
};

type EditModalProps = {
  selectedFeedback: Feedback;
  setIsModalOpen: (open: boolean) => void;
  handleSave: () => void;
  setSelectedFeedback: (feedback: Feedback) => void;
};

const EditModal: React.FC<EditModalProps> = ({
  selectedFeedback,
  setIsModalOpen,
  handleSave,
  setSelectedFeedback,
}) => {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
      onClick={() => setIsModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 transform transition-all scale-100"
      >
        <div className="border-b pb-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Edit Feedback for  : {selectedFeedback.employeeName || "Anonymous"}
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Score</label>
           <input
            type="number"
            min="1"
            max="5"
            value={selectedFeedback.score ?? ""}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= 1 && value <= 5) {
                setSelectedFeedback({
                  ...selectedFeedback,
                  score: value,
                });
              }
            }}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />

          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Notes</label>
            <textarea
              value={selectedFeedback.notes || ""}
              onChange={(e) =>
                setSelectedFeedback({
                  ...selectedFeedback,
                  notes: e.target.value,
                })
              }
              rows={4}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            ></textarea>
          </div>
        </div>

        <div className="mt-6 flex grid grid-cols-2 gap-3  pt-3">
          <Button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2  text-white bg-red-500 hover:bg-red-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="px-4 py-2"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
