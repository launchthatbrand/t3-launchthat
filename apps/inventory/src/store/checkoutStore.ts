import { create } from "zustand";

// Basic checkout store structure
interface CheckoutState {
  // Add your checkout state here
  currentStep: number;
  setStep: (step: number) => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  currentStep: 0,
  setStep: (step) => set({ currentStep: step }),
}));

export default useCheckoutStore;
