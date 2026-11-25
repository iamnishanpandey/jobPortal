import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import Signin from "@/components/authentication/Signin";
import Signup from "@/components/authentication/Signup";
import HomePage from "@/pages/HomePage";
import BrowseJobsPage from "@/pages/BrowseJobsPage";
import JobDetailsPage from "@/pages/JobDetailsPage";
import ApplicationsPage from "@/pages/ApplicationsPage";
import ApplicationStatusDetailsPage from "@/pages/ApplicationStatusDetailsPage";
import CompanyProfilePage from "@/pages/CompanyProfilePage";
import ProfilePage from "@/pages/ProfilePage";
import RecruiterCompaniesPage from "@/pages/RecruiterCompaniesPage";
import RecruiterCompanyEditPage from "@/pages/RecruiterCompanyEditPage";
import RecruiterJobsPage from "@/pages/RecruiterJobsPage";
import CreateJobPage from "@/pages/CreateJobPage";
import ApplicantsPage from "@/pages/ApplicantsPage";
import ApplicantProfilePage from "@/pages/ApplicantProfilePage";
import SuperAdminDashboardPage from "@/pages/SuperAdminDashboardPage";
import SuperAdminLoginPage from "@/pages/SuperAdminLoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { APPLICANT_ROLE_VALUES, USER_ROLES } from "@/utils/data";

const appRouter = createBrowserRouter([
  {
    path: "/super-admin/access",
    element: <SuperAdminLoginPage />,
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "signin",
        element: <Signin />,
      },
      {
        path: "login",
        element: <Signin />,
      },
      {
        path: "signup",
        element: <Signup />,
      },
      {
        path: "register",
        element: <Signup />,
      },
      {
        path: "jobs",
        element: <BrowseJobsPage />,
      },
      {
        path: "jobs/:id",
        element: <JobDetailsPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "profile",
            element: <ProfilePage />,
          },
        ],
      },
      {
        element: <ProtectedRoute allowRoles={APPLICANT_ROLE_VALUES} />,
        children: [
          {
            path: "applications",
            element: <ApplicationsPage />,
          },
          {
            path: "applications/:id",
            element: <ApplicationStatusDetailsPage />,
          },
          {
            path: "companies/:id",
            element: <CompanyProfilePage />,
          },
        ],
      },
      {
        element: <ProtectedRoute allowRoles={[USER_ROLES.RECRUITER]} />,
        children: [
          {
            path: "recruiter/companies",
            element: <RecruiterCompaniesPage />,
          },
          {
            path: "recruiter/companies/:id",
            element: <RecruiterCompanyEditPage />,
          },
          {
            path: "recruiter/jobs",
            element: <RecruiterJobsPage />,
          },
          {
            path: "recruiter/jobs/create",
            element: <CreateJobPage />,
          },
          {
            path: "recruiter/jobs/:id/applicants",
            element: <ApplicantsPage />,
          },
          {
            path: "recruiter/applicants/:id",
            element: <ApplicantProfilePage />,
          },
        ],
      },
      {
        element: <ProtectedRoute allowRoles={[USER_ROLES.SUPER_ADMIN]} />,
        children: [
          {
            path: "super-admin/dashboard",
            element: <SuperAdminDashboardPage />,
          },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={appRouter} />;
}

export default App;
