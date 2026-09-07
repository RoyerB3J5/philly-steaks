import React, { useState, useEffect, useRef } from "react";
import type { BlogCardDTO } from "../lib/ghl/types";

interface BlogSectionProps {
  content: {
    title: string;
  };
  items: BlogCardDTO[];
  lang: string;
  readMoreText?: string;
  previousText?: string;
  nextText?: string;
  noPostsText?: string;
  itemsPerPage?: number;
}

export default function BlogSection({
  content,
  items = [],
  lang = "en",
  readMoreText = "Read More",
  previousText = "Previous",
  nextText = "Next",
  noPostsText = "No blog posts available at the moment.",
  itemsPerPage = 9,
}: BlogSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef<HTMLElement | null>(null);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Client-side pagination slice
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = items.slice(startIndex, startIndex + itemsPerPage);

  // Hook to handle fade-up-a animations consistently with Layout.astro on mount and page changes
  useEffect(() => {
    if (!containerRef.current) return;

    const elements = containerRef.current.querySelectorAll<HTMLElement>(
      ".fade-up-a, .fade-down-a, .fade-left-a, .fade-right-a"
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.getBoundingClientRect(); // Force reflow
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                el.classList.add("active");
              });
            });
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((el) => {
      el.classList.remove("active");
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [currentPage, currentItems.length]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    if (containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <section
      ref={containerRef}
      className="w-full flex flex-col justify-center items-center bg-white"
    >
      <div className="container-full flex flex-col justify-center items-center py-16 md:py-20 lg:py-30 gap-8 md:gap-12">
        <div className="flex flex-col justify-center items-center gap-12">
          <h1
            dangerouslySetInnerHTML={{ __html: content.title }}
            className="title text-center fade-up-a"
          />
        </div>

        {items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="paragraph text-[#717171] fade-up-a">{noPostsText}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7.5 w-full">
              {currentItems.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col justify-start items-start gap-4 fade-up-a"
                >
                  <a
                    href={`/${lang}/blog/${item.id}`}
                    className="w-full h-auto relative overflow-hidden rounded-2xl group block"
                    style={{ aspectRatio: "438.6/251" }}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      width={950}
                      height={650}
                      decoding="async"
                      loading="lazy"
                      className="w-full h-full object-center object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                    />
                  </a>

                  {item.date && (
                    <p className="text-[13px] font-medium leading-[150%] text-[#717171] fade-up-a">
                      {item.date}
                    </p>
                  )}

                  <h2 className="subtitle-sm text-black fade-up-a line-clamp-2">
                    <a
                      href={`/${lang}/blog/${item.id}`}
                      className="hover:text-secondary transition-colors duration-200"
                    >
                      {item.title}
                    </a>
                  </h2>

                  {item.description && (
                    <p className="paragraph fade-up-a line-clamp-3 text-[#4A4A4A]">
                      {item.description}
                    </p>
                  )}

                  <a
                    className="w-[144px] py-3 border-[1.5px] rounded-full border-[#E6E6E6] hover:bg-accent hover:border-accent transition-all duration-300 ease-in-out paragraph-bold flex justify-center items-center uppercase mt-auto"
                    href={`/${lang}/blog/${item.id}`}
                  >
                    {readMoreText}
                  </a>
                </article>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav
                aria-label="Blog pagination"
                className="flex justify-center items-center gap-2 md:gap-3 mt-8 md:mt-12 fade-up-a"
              >
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2.5 rounded-full border-[1.5px] border-[#E6E6E6] text-sm font-semibold transition-all duration-200 ${
                    currentPage === 1
                      ? "opacity-40 cursor-not-allowed text-[#9E9E9E]"
                      : "hover:bg-accent hover:border-accent text-black cursor-pointer"
                  }`}
                >
                  {previousText}
                </button>

                <div className="flex items-center gap-1.5 md:gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => {
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          aria-current={isActive ? "page" : undefined}
                          className={`w-10 h-10 rounded-full border-[1.5px] flex items-center justify-center text-sm font-bold transition-all duration-200 cursor-pointer ${
                            isActive
                              ? "bg-accent border-accent text-black"
                              : "border-[#E6E6E6] text-black hover:bg-accent/30 hover:border-accent"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2.5 rounded-full border-[1.5px] border-[#E6E6E6] text-sm font-semibold transition-all duration-200 ${
                    currentPage === totalPages
                      ? "opacity-40 cursor-not-allowed text-[#9E9E9E]"
                      : "hover:bg-accent hover:border-accent text-black cursor-pointer"
                  }`}
                >
                  {nextText}
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}
