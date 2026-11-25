import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";
import { getApiErrorMessage } from "@/lib/apiError";
import { extractTopCategories, rankJobsByMatch } from "@/lib/algorithms";
import SectionHeader from "@/components/shared/SectionHeader";
import EmptyState from "@/components/shared/EmptyState";
import JobCard from "@/components/jobs/JobCard";
import { Categories } from "@/components/components_lite/Categories";
import { USER_ROLES } from "@/utils/data";

const HomePage = () => {
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setJobs([]);
      return;
    }

    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/job/get");
        setJobs(response.data?.jobs || []);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not load jobs"));
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user]);

  const rankedJobs = useMemo(() => {
    if (!jobs.length) return [];
    return rankJobsByMatch(jobs, { user, keyword });
  }, [jobs, user, keyword]);

  const topCategories = useMemo(() => extractTopCategories(jobs, 10), [jobs]);
  const dashboardPath =
    user?.role === USER_ROLES.RECRUITER
      ? "/recruiter/jobs"
      : user?.role === USER_ROLES.SUPER_ADMIN
        ? "/super-admin/dashboard"
        : "/applications";

  const handleHeroSearch = (event) => {
    event.preventDefault();
    const query = keyword.trim();
    if (query) {
      navigate(`/jobs?keyword=${encodeURIComponent(query)}`);
      return;
    }
    navigate("/jobs");
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-300 bg-slate-100 px-6 py-10">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-600">CC CareerCloud</p>
            <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
              Find Jobs and Apply Easily
            </h1>
            <p className="mt-4 text-sm text-slate-700 md:text-base">
              Discover roles based on your skills, apply in one click, and track every application in one place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {user ? (
                <>
                  <Link to="/jobs">
                    <Button className="bg-blue-500 text-white hover:bg-blue-600">
                      Browse Jobs <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to={dashboardPath}>
                    <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
                      Go to Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/signup">
                    <Button className="bg-blue-500 text-white hover:bg-blue-600">Create Account</Button>
                  </Link>
                  <Link to="/signin">
                    <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <form
            className="rounded-lg border border-slate-300 bg-white p-5"
            onSubmit={handleHeroSearch}
          >
            <p className="mb-2 text-sm font-medium text-slate-700">Quick Search</p>
            <div className="flex gap-2">
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Search by title, skill, or keyword"
                className="h-11 border-slate-300 bg-white text-slate-900"
              />
              <Button type="submit" className="h-11 bg-blue-500 text-white hover:bg-blue-600">
                Search
              </Button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Find openings faster and jump straight to filtered job listings.
            </p>
          </form>
        </div>
      </section>

      <Categories categories={topCategories.length ? topCategories : undefined} />

      <section className="rounded-xl border border-slate-300 bg-white p-6 md:p-8">
        <SectionHeader
          eyebrow={user ? "Personalized Picks" : "Featured Jobs"}
          title={user ? "Recommended for You" : "Sign in to See Personalized Matches"}
          description={
            user
              ? "Top opportunities sorted by simple relevance."
              : "Authentication is required by your backend before jobs can be loaded."
          }
          actions={
            user ? (
              <Link to="/jobs">
                <Button variant="outline">View All Jobs</Button>
              </Link>
            ) : null
          }
        />

        {!user && (
          <EmptyState
            title="No public job feed configured"
            description="Sign in to access your protected jobs API and unlock recommendations."
          />
        )}

        {user && loading && <p className="text-sm text-slate-600">Loading jobs...</p>}

        {user && !loading && rankedJobs.length === 0 && (
          <EmptyState title="No jobs found yet" description="Post jobs as a recruiter or try again later." />
        )}

        {user && !loading && rankedJobs.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rankedJobs.slice(0, 6).map((job) => (
              <JobCard key={job._id} job={job} showActions />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
