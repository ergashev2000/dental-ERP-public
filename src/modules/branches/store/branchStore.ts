import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Joriy filial. null — barcha filiallar (faqat Egasi). Brauzerda eslab qolinadi. */
export const useBranchStore = create<{ branchId: string | null; setBranch: (id: string | null) => void }>()(
  persist((set) => ({ branchId: 'b1', setBranch: (branchId) => set({ branchId }) }), { name: 'oq-tabassum-branch' }),
);
