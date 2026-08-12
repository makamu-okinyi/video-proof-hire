import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface ApplicantJobApplication {
  id: string;
  job_id: string;
  status: string;
  cover_message: string | null;
  created_at: string;
  job: {
    id: string;
    title: string;
    company_name: string | null;
  };
}

export function useApplicantJobApplications(_userId?: string) {
  const applications = useQuery(api.jobs.getMyApplications, {});

  const data: ApplicantJobApplication[] = (applications ?? []).map((app) => ({
    id: app._id,
    job_id: app.jobId,
    status: app.status,
    cover_message: app.coverMessage ?? null,
    created_at: new Date(app._creationTime).toISOString(),
    job: app.job
      ? {
          id: app.job._id,
          title: app.job.title,
          company_name: app.job.companyName ?? null,
        }
      : { id: app.jobId, title: "Job", company_name: null },
  }));

  return {
    data,
    isLoading: applications === undefined,
    error: null,
  };
}
