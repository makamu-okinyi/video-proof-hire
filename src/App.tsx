import { lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { FeedbackPrompt } from "@/components/feedback/FeedbackPrompt";
import { ProfileGate } from "@/components/auth/ProfileGate";
import { RocketLoader } from "@/components/ui/RocketLoader";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { OrganicBackground } from "@/components/layout/OrganicBackground";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ReviewerRoute } from "@/components/auth/ReviewerRoute";
import { FounderRoute } from "@/components/auth/FounderRoute";
import { EmployerRoute } from "@/components/auth/EmployerRoute";
import { AuthProvider } from "@/context/AuthContext";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { ConsentGate } from "@/components/legal/ConsentGate";
import { PasskeyNudge } from "@/components/auth/PasskeyNudge";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { legalDocs } from "@/data/legal";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Jobs from "./pages/Jobs";
import Challenges from "./pages/Challenges";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import UserProfile from "./pages/UserProfile";
import Ventures from "./pages/Ventures";
import VentureDetail from "./pages/VentureDetail";
import NotFound from "./pages/NotFound";
import ApplicantHome, { FounderHomeRedirect } from "./pages/ApplicantHome";

const Create = lazy(() => import("./pages/Create"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const EmployerDashboard = lazy(() => import("./pages/EmployerDashboard"));
const EmployerSettings = lazy(() => import("./pages/EmployerSettings"));
const CompanyProfileSettings = lazy(() => import("./pages/CompanyProfileSettings"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const Watch = lazy(() => import("./pages/Watch"));
const CreateJob = lazy(() => import("./pages/CreateJob"));
const CreateChallenge = lazy(() => import("./pages/CreateChallenge"));
const JobApplicants = lazy(() => import("./pages/JobApplicants"));
const ChallengeSubmissions = lazy(() => import("./pages/ChallengeSubmissions"));
const FounderWizard = lazy(() => import("./pages/FounderWizard"));
const FounderDashboard = lazy(() => import("./pages/FounderDashboard"));
const ConsoleShell = lazy(() => import("@/components/admin/console/ConsoleShell").then((m) => ({ default: m.ConsoleShell })));
const AdminOverview = lazy(() => import("./pages/admin/Overview"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminReview = lazy(() => import("./pages/admin/Review"));
const AdminGeography = lazy(() => import("./pages/admin/Geography"));
const AdminVelocity = lazy(() => import("./pages/admin/Velocity"));
const AdminModeration = lazy(() => import("./pages/admin/Moderation"));
const AdminPlans = lazy(() => import("./pages/admin/Plans"));
const AdminSystem = lazy(() => import("./pages/admin/System"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const AdminFeedback = lazy(() => import("./pages/admin/Feedback"));
const EmployerPlan = lazy(() => import("./pages/EmployerPlan"));
const Discover = lazy(() => import("./pages/Discover"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Messages = lazy(() => import("./pages/Messages"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false} storageKey="donjo-theme">
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAUpdatePrompt />
        <BrowserRouter>
          <ScrollToTop />
          <PasskeyNudge />
          <ProfileGate />
          <FeedbackPrompt />
          <AnalyticsTracker />
          <ConsentGate />
          <OrganicBackground />
          <ErrorBoundary>
          <Suspense fallback={
            <div className="min-h-dvh flex flex-col items-center justify-center">
              <div className="glass-panel p-8 rounded-2xl">
                <RocketLoader indeterminate label="Loading Donjo..." />
              </div>
            </div>
          }>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/discover" element={<FounderRoute><Discover /></FounderRoute>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/privacy" element={<LegalPage doc={legalDocs.privacy} />} />
            <Route path="/terms" element={<LegalPage doc={legalDocs.terms} />} />
            <Route path="/cookies" element={<LegalPage doc={legalDocs.cookies} />} />
            <Route path="/ventures" element={<ReviewerRoute><Ventures /></ReviewerRoute>} />
            <Route path="/ventures/:id" element={<ReviewerRoute><VentureDetail /></ReviewerRoute>} />
            <Route path="/apply" element={<FounderRoute><FounderWizard /></FounderRoute>} />
            <Route path="/founder" element={<FounderRoute><FounderHomeRedirect /></FounderRoute>} />
            <Route path="/founder/dashboard" element={<Navigate to="/founder" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><ConsoleShell /></AdminRoute>}>
              <Route index element={<AdminOverview />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="review" element={<AdminReview />} />
              <Route path="geography" element={<AdminGeography />} />
              <Route path="velocity" element={<AdminVelocity />} />
              <Route path="moderation" element={<AdminModeration />} />
              <Route path="plans" element={<AdminPlans />} />
              <Route path="system" element={<AdminSystem />} />
              {/* /admin/dashboard and anything else under /admin lands on the overview */}
              <Route path="feedback" element={<AdminFeedback />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/create" element={<Create />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/settings/account" element={<AccountSettings />} />
            <Route path="/watch/:videoId" element={<Watch />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            {/* Employer Routes (protected by EmployerRoute) */}
            <Route path="/employer" element={<EmployerRoute />}>
              <Route index element={<EmployerDashboard />} />
              <Route path="settings" element={<EmployerSettings />} />
              <Route path="settings/company" element={<CompanyProfileSettings />} />
              <Route path="plan" element={<EmployerPlan />} />
              <Route path="settings/account" element={<AccountSettings />} />
              <Route path="jobs/create" element={<CreateJob />} />
              <Route path="jobs/:jobId/edit" element={<CreateJob />} />
              <Route path="jobs/:jobId/applicants" element={<JobApplicants />} />
              <Route path="challenges/create" element={<CreateChallenge />} />
              <Route path="challenges/:challengeId/edit" element={<CreateChallenge />} />
              <Route path="challenges/:challengeId/submissions" element={<ChallengeSubmissions />} />
            </Route>
            <Route path="/:username" element={<ApplicantHome />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;