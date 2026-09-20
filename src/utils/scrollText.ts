export function initScrollText(): void {
  const textElement = document.querySelector(
    "[data-scroll-text]",
  ) as HTMLElement | null;

  if (!textElement) return;

  let isActive = false;
  let ticking = false;

  const MAX_TRANSLATE = 150; // distancia máxima en px

  const updatePosition = (): void => {
    const rect = textElement.getBoundingClientRect();

    // Progreso de 0 a 1 mientras cruza la pantalla
    const progress =
      (window.innerHeight - rect.top) / (window.innerHeight + rect.height);

    // Limitar entre 0 y 1
    const clampedProgress = Math.max(0, Math.min(progress, 1));

    const currentX = -clampedProgress * MAX_TRANSLATE;

    textElement.style.transform = `translate3d(${currentX}px, 0, 0)`;

    ticking = false;
  };

  const handleScroll = (): void => {
    if (!ticking) {
      requestAnimationFrame(updatePosition);
      ticking = true;
    }
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !isActive) {
        isActive = true;

        updatePosition();

        window.addEventListener("scroll", handleScroll, {
          passive: true,
        });
      }

      if (!entry.isIntersecting && isActive) {
        isActive = false;

        window.removeEventListener("scroll", handleScroll);
      }
    },
    { threshold: 0 },
  );

  observer.observe(textElement);
}
