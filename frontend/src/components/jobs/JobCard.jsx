import { Link } from "react-router-dom";
import { Briefcase, MapPin, Wallet, CalendarDays, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  formatDate,
  formatPostingEndDate,
  isPostingClosed,
} from "@/lib/formatters";

const JobCard = ({ job, showActions = true, onApply, applying = false }) => {
  const postingClosed = isPostingClosed(job?.createdAt, job?.postingDurationDays);

  return (
    <article className="rounded-xl border border-slate-300 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{job?.title}</h3>
          <p className="text-sm text-slate-600">{job?.location}</p>
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-700">{job?.description}</p>

      <div className="mb-4 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <p className="inline-flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-slate-500" /> {job?.jobType || "N/A"}
        </p>
        <p className="inline-flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-500" /> {job?.location || "N/A"}
        </p>
        <p className="inline-flex items-center gap-2">
          <Wallet className="h-4 w-4 text-slate-500" /> {formatCurrency(job?.salary)}
        </p>
        <p className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-500" /> Posted {formatDate(job?.createdAt)}
        </p>
        <p className="inline-flex items-center gap-2">
          <Timer className="h-4 w-4 text-slate-500" /> {postingClosed ? "Ended" : "Ends"}{" "}
          {formatPostingEndDate(job?.createdAt, job?.postingDurationDays)}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(job?.requirements ?? []).slice(0, 4).map((requirement, index) => (
          <span
            key={`${job?._id}-req-${index}`}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            {requirement}
          </span>
        ))}
      </div>

      {showActions && (
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/jobs/${job?._id}`}>
            <Button variant="outline">View Details</Button>
          </Link>
          {onApply && (
            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => onApply(job?._id)} disabled={applying}>
              {applying ? "Applying..." : "Apply Now"}
            </Button>
          )}
        </div>
      )}
    </article>
  );
};

export default JobCard;
