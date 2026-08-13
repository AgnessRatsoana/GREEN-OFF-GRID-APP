import { create } from 'zustand';

export type PackageApplication = {
  packageId: string;
  status: string;
  submittedAt: number;
};

interface ApplicationsStore {
  applications: PackageApplication[];
  addApplication: (packageId: string, status?: string) => void;
  getApplication: (packageId: string) => PackageApplication | undefined;
}

export const useApplicationsStore = create<ApplicationsStore>((set, get) => ({
  applications: [],
  addApplication: (packageId, status = 'Submitted') =>
    set((state) => {
      const existing = state.applications.find((entry) => entry.packageId === packageId);

      if (existing) {
        return {
          applications: state.applications.map((entry) =>
            entry.packageId === packageId ? { ...entry, status, submittedAt: Date.now() } : entry,
          ),
        };
      }

      return {
        applications: [...state.applications, { packageId, status, submittedAt: Date.now() }],
      };
    }),
  getApplication: (packageId) => get().applications.find((entry) => entry.packageId === packageId),
}));
