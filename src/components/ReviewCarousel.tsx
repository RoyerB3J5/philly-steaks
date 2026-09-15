import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  type MouseEvent,
  type TouchEvent,
} from "react";

const AUTOPLAY_INTERVAL = 8000;

type ReviewItem = {
  description: string;
  name: string;
};

interface CarouselReviewProps {
  items: ReviewItem[];
}

export default function ReviewCarousel({ items }: CarouselReviewProps) {
  const N = items.length;
  const expandedItems = [...items, ...items, ...items];

  const [currentIndex, setCurrentIndex] = useState(N);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const dragStart = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoplayTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isResetting = useRef(false);

  const measureContainerWidth = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.getBoundingClientRect().width);
    }
  }, []);

  // True once we know the real viewport width. Before that every slide
  // would compute width 0 and pile up at translate 0, so the track stays
  // hidden and unanimated until measurement lands.
  const isMeasured = containerWidth > 0;

  // useLayoutEffect so the width is measured before the browser paints —
  // otherwise the zero-width (piled-up) layout flashes on load.
  useLayoutEffect(() => {
    const handleResize = () => {
      setIsTransitioning(false);
      measureContainerWidth();
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // The carousel fills remaining flex space, so its width can change
    // without a window resize (e.g. siblings loading). Observe it directly.
    const el = containerRef.current;
    let observer: ResizeObserver | null = null;
    if (el && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        setIsTransitioning(false);
        measureContainerWidth();
      });
      observer.observe(el);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (observer) observer.disconnect();
    };
  }, [measureContainerWidth]);

  useEffect(() => {
    if (!isTransitioning && isMeasured) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true);
        isResetting.current = false;
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [currentIndex, isTransitioning, isMeasured]);

  const stopAutoplay = useCallback(() => {
    if (autoplayTimer.current) {
      clearInterval(autoplayTimer.current);
      autoplayTimer.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    autoplayTimer.current = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, AUTOPLAY_INTERVAL);
  }, [stopAutoplay]);

  useEffect(() => {
    if (!isMeasured) return;
    startAutoplay();
    return () => stopAutoplay();
  }, [isMeasured, startAutoplay, stopAutoplay]);

  const handleTransitionEnd = () => {
    if (isResetting.current) return;

    if (currentIndex >= 2 * N || currentIndex < N) {
      isResetting.current = true;
      setIsTransitioning(false);
      const equivalentIndex = N + (((currentIndex % N) + N) % N);
      setCurrentIndex(equivalentIndex);
    }
  };

  const slide = useCallback(
    (direction: 1 | -1) => {
      stopAutoplay();
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + direction);
      startAutoplay();
    },
    [stopAutoplay, startAutoplay],
  );

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    stopAutoplay();
    setIsTransitioning(false);
    dragStart.current = e.clientX;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.current;
    setDragOffset(deltaX);
  };

  const handleMouseUpOrLeave = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 50;
    setIsTransitioning(true);

    if (dragOffset < -threshold) {
      setCurrentIndex((prev) => prev + 1);
    } else if (dragOffset > threshold) {
      setCurrentIndex((prev) => prev - 1);
    }

    setDragOffset(0);
    startAutoplay();
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    stopAutoplay();
    setIsTransitioning(false);
    if (e.touches.length > 0) {
      dragStart.current = e.touches[0].clientX;
    }
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length === 0) return;
    const deltaX = e.touches[0].clientX - dragStart.current;
    setDragOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 50;
    setIsTransitioning(true);

    if (dragOffset < -threshold) {
      setCurrentIndex((prev) => prev + 1);
    } else if (dragOffset > threshold) {
      setCurrentIndex((prev) => prev - 1);
    }

    setDragOffset(0);
    startAutoplay();
  };

  if (N === 0) return null;

  // One slide fills the viewport exactly. The track has no inter-item gap,
  // so each step is exactly one container width — no sliver of the next
  // slide can peek through (including subpixel rounding cases).
  const itemWidth = containerWidth > 0 ? containerWidth : 0;
  const stepWidth = itemWidth;
  const translateX = -currentIndex * stepWidth + dragOffset;

  const arrowClass =
    "w-8 h-8 rounded-full border border-black text-black flex items-center justify-center transition-colors duration-300 hover:border-secondary hover:text-secondary cursor-pointer";

  return (
    <section className="w-full lg:w-auto lg:flex-1 min-w-0 flex flex-col justify-center items-center">
      <div className="w-full ">
        <div
          ref={containerRef}
          className="w-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: "pan-y" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDragStart={(e) => e.preventDefault()}
        >
          <div
            className="flex items-stretch"
            style={{
              gap: 0,
              transform: `translate3d(${translateX}px, 0, 0)`,
              transition:
                isTransitioning && isMeasured
                  ? "transform 300ms ease-out"
                  : "none",
              visibility: isMeasured ? "visible" : "hidden",
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {expandedItems.map((item, index) => (
              <div
                className={`shrink-0 flex flex-col md:flex-row justify-center items-start md:items-stretch gap-4 md:gap-6`}
                style={{ width: itemWidth }}
                key={index}
              >
                <p className="self-start md:[writing-mode:vertical-lr] rotate-0 md:rotate-180 text-[16px] font-medium leading-[120%] tracking-[5.12px] uppercase text-secondary">
                  {item.name}
                </p>
                <div className="w-full md:w-[1px] h-[1px] md:h-auto bg-black/10" />
                <div className="flex flex-col justify-center items-start gap-4 md:gap-6">
                  <p className="paragraph text-paragraph">{item.description}</p>
                  <div className="flex justify-center items-center gap-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <img
                        key={i}
                        src="/icons/star-small.svg"
                        alt="Star"
                        decoding="async"
                        loading="eager"
                        width="8"
                        height="8"
                        className="w-4 h-4"
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-start gap-4 mt-8 w-full">
          <button
            type="button"
            onClick={() => slide(-1)}
            aria-label="Previous review"
            className={arrowClass}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => slide(1)}
            aria-label="Next review"
            className={arrowClass}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
