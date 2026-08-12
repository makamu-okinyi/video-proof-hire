import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface EmployerAnalytics {
  activeJobs: number;
  totalApplicants: number;
  challenges: number;
}

export function useEmployerAnalytics(_employerId?: string) {
  const analytics = useQuery(api.jobs.getEmployerAnalytics, {});

  return {
    data: analytics
      ? {
          activeJobs: analytics.jobs,
          totalApplicants: analytics.applications,
          challenges: analytics.challenges,
        }
      : undefined,
    isLoading: analytics === undefined,
    error: null,
  };
}
