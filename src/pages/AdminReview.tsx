import { DarkDashboardLayout } from '@/components/layout/DarkDashboardLayout';
import { ReviewQueue } from '@/components/admin/ReviewQueue';

export default function AdminReview() {
  return (
    <DarkDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Application Review</h1>
          <p className="text-white/60">
            Watch founder pitches and make shortlist decisions.
          </p>
        </div>

        <ReviewQueue />
      </div>
    </DarkDashboardLayout>
  );
}
