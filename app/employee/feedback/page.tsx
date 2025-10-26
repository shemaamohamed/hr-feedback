"use client";

import React, { useState } from 'react';
import { feedbackService } from '@/lib/firebase/services';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmployeeFeedbackPage() {
  const [notes, setNotes] = useState('');
  const [score, setscore] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
    const { user } = useAuth();


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !user?.name) {
      setToast('You must be signed in to submit feedback');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setIsLoading(true);
    try {
      // In a real app, employeeId/name would come from current user context
      await feedbackService.submitFeedback({
        employeeId: user.uid,
        employeeName: user.name,
        notes,
        score,
      });
      setToast('Feedback submitted');
      setNotes('');
      setscore(3);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast('Failed to submit feedback');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded">{toast}</div>
      )}
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-4">
          
            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea id="notes" className="w-full rounded-md border p-2" value={notes} onChange={(e) => setNotes(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="score">Score</Label>
              <input id="score" type="number" min={1} max={5} value={score} onChange={(e) => setscore(Number(e.target.value))} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">{isLoading ? 'Submitting...' : 'Submit Feedback'}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
