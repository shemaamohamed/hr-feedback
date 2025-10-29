'use client';

import React, { useState, useEffect } from 'react';
import { feedbackService } from '@/lib/firebase/feedback';
import { getEmployees } from '@/lib/firebase/userService';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';


const AddModal = ({ setIsModalOpen }: { setIsModalOpen: (open: boolean) => void }) => {
  const [formData, setFormData] = useState({
    employees: [] as { id: string; name: string }[],
    selectedEmployeeId: '',
    notes: '',
    score: 3,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmployees() {
      const list = await getEmployees();
      setFormData((prev) => ({
        ...prev,
        employees: list,
        selectedEmployeeId: list.length ? list[0].id : '',
      }));
    }
    fetchEmployees();
  }, []);


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { selectedEmployeeId, employees, notes, score } = formData;
    if (!selectedEmployeeId) return;

    const employee = employees.find((e) => e.id === selectedEmployeeId);
    if (!employee) return;

    setIsLoading(true);
    try {
      await feedbackService.submitFeedback({
        employeeId: employee.id,
        employeeName: employee.name,
        notes,
        score,
      });
      setToast('✅ Feedback submitted successfully');
      setIsModalOpen(false)
      setFormData((prev) => ({
        ...prev,
        notes: '',
        score: 3,
      }));
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast('❌ Failed to submit feedback');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
         onClick={() => setIsModalOpen(false)}>
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded">
          {toast}
        </div>
      )}
      <Card className="w-full max-w-2xl"
                  onClick={(e) => e.stopPropagation()}
>
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
        </CardHeader>

        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="employee">Select Employee</Label>
              <select
                id="employee"
                value={formData.selectedEmployeeId}
                onChange={(e) => setFormData({ ...formData, selectedEmployeeId: e.target.value })}
                className="w-full rounded-md border p-2"
              >
                {formData.employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="w-full rounded-md border p-2"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="score">Score</Label>
              <input
                id="score"
                type="number"
                min={1}
                max={5}
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}

              />
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>

  );
};

export default AddModal;
