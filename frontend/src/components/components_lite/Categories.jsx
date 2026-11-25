import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "../ui/carousel";
import { Button } from "../ui/button";

const defaultCategories = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist",
  "DevOps Engineer",
  "UI/UX Designer",
  "Mobile App Developer",
  "Machine Learning Engineer",
  "Cloud Engineer",
  "QA Engineer",
  "Software Engineer",
  "Product Manager",
  "Data Analyst",
  "Security Engineer",
  "Blockchain Developer",
  "Graphic Designer",
  "Video Editor",
  "Technical Architect",
  "SEO Specialist",
];

export const Categories = ({ categories }) => {
  const navigate = useNavigate();
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const categoryList = categories?.length ? categories : defaultCategories;

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  const onCategoryClick = useCallback(
    (category) => {
      navigate(`/jobs?keyword=${encodeURIComponent(category)}`);
    },
    [navigate]
  );

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="rounded-xl border border-slate-300 bg-white p-5">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Job Categories</p>
            <h2 className="text-2xl font-bold text-slate-900">Browse Categories</h2>
          </div>
          <p className="text-xs text-slate-500">{categoryList.length} categories</p>
        </div>

        <Carousel
          setApi={setApi}
          opts={{
            loop: true,
            align: "start",
            dragFree: true,
            slidesToScroll: 2,
          }}
          className="relative w-full px-8 sm:px-10"
        >
          <CarouselContent className="-ml-3">
            {categoryList.map((category, index) => (
              <CarouselItem key={index} className="basis-full pl-3 sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                <Button
                  variant="outline"
                  className="h-11 w-full justify-start rounded-lg border-slate-300 bg-white px-3 text-left text-sm text-slate-700 hover:bg-slate-100"
                  onClick={() => onCategoryClick(category)}
                >
                  {category}
                </Button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0 z-10 border-slate-300 bg-white text-slate-700 hover:bg-slate-100" />
          <CarouselNext className="right-0 z-10 border-slate-300 bg-white text-slate-700 hover:bg-slate-100" />
        </Carousel>

        {count > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {Array.from({ length: count }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => api?.scrollTo(index)}
                className={`h-2.5 w-2.5 rounded-full transition ${index === current ? "bg-blue-600" : "bg-slate-300"}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
