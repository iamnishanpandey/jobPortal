import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFoundPage = () => {
  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">
        The page you are looking for does not exist or was moved.
      </p>
      <div className="mt-5">
        <Link to="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </section>
  );
};

export default NotFoundPage;
