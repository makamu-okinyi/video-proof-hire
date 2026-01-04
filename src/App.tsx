import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
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
import CreateJob from "./pages/CreateJob";
import CreateChallenge from "./pages/CreateChallenge";
import JobApplicants from "./pages/JobApplicants";
import ChallengeSubmissions from "./pages/ChallengeSubmissions";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/write" element={<WriteArticle />} />
            <Route path="/create" element={<Create />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            {/* Employer Routes */}
            <Route path="/employer" element={<EmployerDashboard />} />
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
