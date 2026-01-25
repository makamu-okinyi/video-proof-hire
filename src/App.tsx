import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Jobs from "./pages/Jobs";
import Challenges from "./pages/Challenges";
import Create from "./pages/Create";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Articles from "./pages/Articles";
import WriteArticle from "./pages/WriteArticle";
import EmployerDashboard from "./pages/EmployerDashboard";
import EmployerSettings from "./pages/EmployerSettings";
import CompanyProfileSettings from "./pages/CompanyProfileSettings";
import AccountSettings from "./pages/AccountSettings";
import MyShortlist from "./pages/MyShortlist";
import CreateJob from "./pages/CreateJob";
import CreateChallenge from "./pages/CreateChallenge";
import JobApplicants from "./pages/JobApplicants";
import ChallengeSubmissions from "./pages/ChallengeSubmissions";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Messages from "./pages/Messages";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAUpdatePrompt />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/write" element={<WriteArticle />} />
            <Route path="/create" element={<Create />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            {/* Employer Routes */}
            <Route path="/employer" element={<EmployerDashboard />} />
            <Route path="/employer/settings" element={<EmployerSettings />} />
            <Route path="/employer/settings/company" element={<CompanyProfileSettings />} />
            <Route path="/employer/settings/account" element={<AccountSettings />} />
            <Route path="/employer/shortlist" element={<MyShortlist />} />
            <Route path="/employer/jobs/create" element={<CreateJob />} />
            <Route path="/employer/jobs/:jobId/edit" element={<CreateJob />} />
            <Route path="/employer/jobs/:jobId/applicants" element={<JobApplicants />} />
            <Route path="/employer/challenges/create" element={<CreateChallenge />} />
            <Route path="/employer/challenges/:challengeId/edit" element={<CreateChallenge />} />
            <Route path="/employer/challenges/:challengeId/submissions" element={<ChallengeSubmissions />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
