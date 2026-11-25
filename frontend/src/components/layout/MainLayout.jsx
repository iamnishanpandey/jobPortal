import { Outlet } from "react-router-dom";
import Navbar from "@/components/components_lite/Navbar";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
