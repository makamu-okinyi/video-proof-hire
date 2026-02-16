import { lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { RocketLoader } from "@/components/ui/RocketLoader";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { OrganicBackground } from "@/components/layout/OrganicBackground";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { FounderRoute } from "@/components/auth/FounderRoute";
import { EmployerRoute } from "@/components/auth/EmployerRoute";
import { AuthProvider } from "@/context/AuthContext";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Jobs from "./pages/Jobs";
import Challenges from "./pages/Challenges";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Messages from "./pages/Messages";
import UserProfile from "./pages/UserProfile";
import Ventures from "./pages/Ventures";
import VentureDetail from "./pages/VentureDetail";
import NotFound from "./pages/NotFound";

const Create = lazy(() => import("./pages/Create"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const EmployerDashboard = lazy(() => import("./pages/EmployerDashboard"));
const EmployerSettings = lazy(() => import("./pages/EmployerSettings"));
const CompanyProfileSettings = lazy(() => import("./pages/CompanyProfileSettings"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const MyShortlist = lazy(() => import("./pages/MyShortlist"));
const CreateJob = lazy(() => import("./pages/CreateJob"));
const CreateChallenge = lazy(() => import("./pages/CreateChallenge"));
const JobApplicants = lazy(() => import("./pages/JobApplicants"));
const ChallengeSubmissions = lazy(() => import("./pages/ChallengeSubmissions"));
const FounderWizard = lazy(() => import("./pages/FounderWizard"));
const FounderDashboard = lazy(() => import("./pages/FounderDashboard"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));

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
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/ventures" element={<Ventures />} />
            <Route path="/ventures/:id" element={<VentureDetail />} />
            <Route path="/apply" element={<FounderRoute><FounderWizard /></FounderRoute>} />
            <Route path="/founder" element={<FounderRoute><FounderDashboard /></FounderRoute>} />
            <Route path="/founder/dashboard" element={<Navigate to="/founder" replace />} />
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/create" element={<Create />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            {/* Employer Routes (protected by EmployerRoute) */}
            <Route path="/employer" element={<EmployerRoute />}>
              <Route index element={<EmployerDashboard />} />
              <Route path="settings" element={<EmployerSettings />} />
              <Route path="settings/company" element={<CompanyProfileSettings />} />
              <Route path="settings/account" element={<AccountSettings />} />
              <Route path="shortlist" element={<MyShortlist />} />
              <Route path="jobs/create" element={<CreateJob />} />
              <Route path="jobs/:jobId/edit" element={<CreateJob />} />
              <Route path="jobs/:jobId/applicants" element={<JobApplicants />} />
              <Route path="challenges/create" element={<CreateChallenge />} />
              <Route path="challenges/:challengeId/edit" element={<CreateChallenge />} />
              <Route path="challenges/:challengeId/submissions" element={<ChallengeSubmissions />} />
            </Route>
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