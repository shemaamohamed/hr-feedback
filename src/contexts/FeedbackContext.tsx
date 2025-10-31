"use client";

import React, { createContext, useContext, useEffect, useReducer } from "react";
import { feedbackService } from "@/lib/firebase/feedback";
import type { Feedback as FB } from "@/types/feedback";

type FeedbackItem = FB;

type State = {
  feedbackList: FeedbackItem[];
  filteredList: FeedbackItem[];
  searchQuery: string;
  dateRange: [unknown, unknown] | null;
  isModalOpen: boolean;
  selectedFeedback: FeedbackItem | null;
};

type Action =
  | { type: "setFeedbackList"; payload: FeedbackItem[] }
  | { type: "setFilteredList"; payload: FeedbackItem[] }
  | { type: "setSearchQuery"; payload: string }
  | { type: "setDateRange"; payload: [unknown, unknown] | null }
  | { type: "openModal"; payload?: FeedbackItem | null }
  | { type: "closeModal" }
  | { type: "setSelected"; payload: FeedbackItem | null };

const initialState: State = {
  feedbackList: [],
  filteredList: [],
  searchQuery: "",
  dateRange: null,
  isModalOpen: false,
  selectedFeedback: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setFeedbackList":
      return { ...state, feedbackList: action.payload, filteredList: action.payload };
    case "setFilteredList":
      return { ...state, filteredList: action.payload };
    case "setSearchQuery":
      return { ...state, searchQuery: action.payload };
    case "setDateRange":
      return { ...state, dateRange: action.payload };
    case "openModal":
      return { ...state, isModalOpen: true, selectedFeedback: action.payload ?? null };
    case "closeModal":
      return { ...state, isModalOpen: false, selectedFeedback: null };
    case "setSelected":
      return { ...state, selectedFeedback: action.payload };
    default:
      return state;
  }
}

const FeedbackContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
  // convenience actions
  setSearchQuery: (q: string) => void;
  setDateRangeAction: (r: [unknown, unknown] | null) => void;
  openModalAction: (f?: FeedbackItem | null) => void;
  closeModalAction: () => void;
  submitFeedback: (payload: Omit<import('@/lib/firebase/feedback').Feedback, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateFeedback: (id: string, data: Partial<import('@/lib/firebase/feedback').Feedback>) => Promise<void>;
  deleteFeedback: (id: string) => Promise<void>;
} | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const unsubscribe = feedbackService.subscribeFeedback((list: FeedbackItem[]) => {
      dispatch({ type: 'setFeedbackList', payload: list });
    });
    return () => unsubscribe();
  }, []);

  // convenience wrappers
  const setSearchQuery = (q: string) => dispatch({ type: 'setSearchQuery', payload: q });
  const setDateRangeAction = (r: [unknown, unknown] | null) => dispatch({ type: 'setDateRange', payload: r });
  const openModalAction = (f?: FeedbackItem | null) => dispatch({ type: 'openModal', payload: f ?? null });
  const closeModalAction = () => dispatch({ type: 'closeModal' });

  const submitFeedback = async (payload: Omit<import('@/lib/firebase/feedback').Feedback, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await feedbackService.submitFeedback(payload);
  };

  const updateFeedback = async (id: string, data: Partial<import('@/lib/firebase/feedback').Feedback>) => {
    return await feedbackService.updateFeedback(id, data);
  };

  const deleteFeedback = async (id: string) => {
    return await feedbackService.deleteFeedback(id);
  };

  return (
    <FeedbackContext.Provider
      value={{
        state,
        dispatch,
        setSearchQuery,
        setDateRangeAction,
        openModalAction,
        closeModalAction,
        submitFeedback,
        updateFeedback,
        deleteFeedback,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used within a FeedbackProvider');
  return ctx;
}
