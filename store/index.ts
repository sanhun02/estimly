import { create } from "zustand";
import { Session, User } from "@supabase/supabase-js";
import { Company, Client, Estimate } from "@/lib/supabase/types";

interface AppState {
    // auth
    session: Session | null;
    user: User | null;
    company: Company | null;

    // data
    clients: Client[];
    estimates: Estimate[];

    // actions
    setSession: (session: Session | null) => void;
    setUser: (user: User | null) => void;
    setCompany: (company: Company | null) => void;
    setClients: (clients: Client[]) => void;
    setEstimates: (estimates: Estimate[]) => void;

    // helpers
    addClient: (client: Client) => void;
    updateClient: (id: string, updates: Partial<Client>) => void;
    deleteClient: (id: string) => void;

    addEstimate: (estimate: Estimate) => void;
    updateEstimate: (id: string, updates: Partial<Estimate>) => void;
    deleteEstimate: (id: string) => void;

    reset: () => void;
}

export const useStore = create<AppState>((set) => ({
    // initial state
    session: null,
    user: null,
    company: null,
    clients: [],
    estimates: [],

    // setters
    setSession: (session) => set({ session }),
    setUser: (user) => set({ user }),
    setCompany: (company) => set({ company }),
    setClients: (clients) => set({ clients }),
    setEstimates: (estimates) => set({ estimates }),

    // helpers
    addClient: (client) =>
        set((state) => ({
            clients: [...state.clients, client],
        })),

    updateClient: (id, updates) =>
        set((state) => ({
            clients: state.clients.map((c) =>
                c.id === id ? { ...c, ...updates } : c
            ),
        })),

    deleteClient: (id) =>
        set((state) => ({
            clients: state.clients.filter((c) => c.id !== id),
        })),

    addEstimate: (estimate) =>
        set((state) => ({
            estimates: [...state.estimates, estimate],
        })),

    updateEstimate: (id, updates) =>
        set((state) => ({
            estimates: state.estimates.map((e) =>
                e.id === id ? { ...e, ...updates } : e
            ),
        })),

    deleteEstimate: (id) =>
        set((state) => ({
            estimates: state.estimates.filter((e) => e.id !== id),
        })),

    reset: () =>
        set({
            session: null,
            user: null,
            company: null,
            clients: [],
            estimates: [],
        }),
}));
