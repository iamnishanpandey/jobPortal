import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const Header = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const query = keyword.trim();
    if (query) {
      navigate(`/jobs?keyword=${encodeURIComponent(query)}`);
      return;
    }
    navigate("/jobs");
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 h-[calc(100vh-4rem)] flex items-center justify-center px-6">
      <div className="text-center max-w-7xl">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">Find Your <span className='text-[#FF6C4C]'> Dream Job </span> Today</h1>
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">Discover thousands of job opportunities and connect with top employers in your industry. Start your career journey now.</p>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 max-w-2xl mx-auto">
          <form className="flex flex-col md:flex-row gap-4" onSubmit={handleSubmit}>
            <Input
              placeholder="Job title, keywords, or company"
              className="flex-1"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            {/* <Input placeholder="Location" className="flex-1" /> */}
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
              Search Jobs
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Header
