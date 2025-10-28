
const EditModal = ({selectedFeedback,setIsModalOpen ,handleSave ,setSelectedFeedback}
    
) => {
  

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
                Edit Feedback for {selectedFeedback.employeeName || 'Anonymous'}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Score</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={selectedFeedback.score}
                  onChange={(e) =>
                    setSelectedFeedback({ ...selectedFeedback, score: Number(e.target.value) })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Notes</label>
                <textarea
                  value={selectedFeedback.notes || ''}
                  onChange={(e) =>
                    setSelectedFeedback({ ...selectedFeedback, notes: e.target.value })
                  }
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                ></textarea>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t pt-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
  );
};

export default EditModal;
