import { gsap } from "./animations";

export function initGlobalScrollSnap() {
  const sections = Array.from(
    document.querySelectorAll("[data-scroll-snap]"),
  ) as HTMLElement[];

  if (sections.length < 2) return;

  let isAnimating = false;
  let currentIndex = 0;
  let isInsideSnapped = false;

  // FUNCIÓN AUXILIAR: Verifica si la pantalla actual debe ignorar el snap (<= 729px)
  const isMobile = () => window.innerWidth <= 1280;

  // Solo alteramos el comportamiento del scroll por defecto en pantallas grandes
  if (!isMobile()) {
    document.documentElement.style.scrollBehavior = "auto";
  }

  const getRealContainer = (sec: HTMLElement) => {
    return sec.parentElement?.classList.contains("pin-spacer")
      ? sec.parentElement
      : sec;
  };

  // 1. UPDATE INDEX
  const updateIndex = () => {
    // Si es móvil, no calculamos índices ni bloqueamos nada
    if (isMobile()) {
      isInsideSnapped = false;
      return;
    }

    const scrollY = window.scrollY;
    const viewportCenter = scrollY + window.innerHeight / 2;
    let found = false;

    sections.forEach((sec, i) => {
      const container = getRealContainer(sec);
      const rect = container.getBoundingClientRect();
      const top = scrollY + rect.top;
      const bottom = scrollY + rect.bottom;

      if (viewportCenter >= top && viewportCenter <= bottom) {
        currentIndex = i;
        found = true;
      }
    });

    isInsideSnapped = found;
  };

  updateIndex();

  window.addEventListener("scroll", () => {
    if (!isAnimating) updateIndex();
  });

  // 2. IR A LA SECCIÓN
  const goToSection = (index: number, fromBottom: boolean = false) => {
    if (index < 0 || index >= sections.length || isMobile()) return;

    isAnimating = true;
    currentIndex = index;

    const targetSection = sections[index];
    const container = getRealContainer(targetSection);
    const rect = container.getBoundingClientRect();

    let targetY = window.scrollY + rect.top;

    if (fromBottom) {
      targetY = window.scrollY + rect.bottom - window.innerHeight;
    }

    gsap.to(window, {
      scrollTo: { y: targetY, autoKill: false },
      duration: 0.8,
      ease: "power3.inOut",
      onComplete: () => {
        setTimeout(() => {
          isAnimating = false;
          updateIndex();
        }, 50);
      },
    });
  };

  // --- EVENTO RATÓN / TRACKPAD ---
  window.addEventListener(
    "wheel",
    (e) => {
      // SI ES MÓVIL/TABLET DE 729PX O MENOS, permitimos el scroll nativo libremente
      if (isMobile()) return;

      if (isAnimating) {
        e.preventDefault();
        return;
      }

      if (!isInsideSnapped) return;

      const currentSection = sections[currentIndex];
      const container = getRealContainer(currentSection);
      const rect = container.getBoundingClientRect();

      const isFirst = currentIndex === 0;
      const isLast = currentIndex === sections.length - 1;

      const direction = e.deltaY > 0 ? "DOWN" : "UP";
      const delta = e.deltaY;

      if (direction === "DOWN" && !isLast) {
        if (rect.bottom - delta <= window.innerHeight + 5) {
          const nextSection = sections[currentIndex + 1];
          const nextContainer = getRealContainer(nextSection);
          const nextRect = nextContainer.getBoundingClientRect();
          const distanceToNext = nextRect.top - rect.bottom;

          if (distanceToNext < 50) {
            e.preventDefault();
            goToSection(currentIndex + 1, false);
          }
        }
      } else if (direction === "UP" && !isFirst) {
        if (rect.top - delta >= -5) {
          const prevSection = sections[currentIndex - 1];
          const prevContainer = getRealContainer(prevSection);
          const prevRect = prevContainer.getBoundingClientRect();
          const distanceToPrev = rect.top - prevRect.bottom;

          if (distanceToPrev < 50) {
            e.preventDefault();
            goToSection(currentIndex - 1, true);
          }
        }
      }
    },
    { passive: false },
  );

  // --- EVENTO TÁCTIL (MÓVILES) ---
  let touchStartY = 0;
  window.addEventListener(
    "touchstart",
    (e) => {
      touchStartY = e.touches[0].clientY;
    },
    { passive: false },
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      // SI ES MÓVIL/TABLET DE 729PX O MENOS, cancelamos la lógica táctil personalizada
      if (isMobile()) return;

      if (isAnimating) {
        e.preventDefault();
        return;
      }

      if (!isInsideSnapped) return;

      const touchEndY = e.touches[0].clientY;
      const deltaY = touchStartY - touchEndY;

      const currentSection = sections[currentIndex];
      const container = getRealContainer(currentSection);
      const rect = container.getBoundingClientRect();

      if (Math.abs(deltaY) < 30) return;

      const direction = deltaY > 0 ? "DOWN" : "UP";
      const isFirst = currentIndex === 0;
      const isLast = currentIndex === sections.length - 1;

      if (direction === "DOWN" && !isLast) {
        if (rect.bottom - deltaY <= window.innerHeight + 5) {
          const nextSection = sections[currentIndex + 1];
          const nextContainer = getRealContainer(nextSection);
          const nextRect = nextContainer.getBoundingClientRect();
          const distanceToNext = nextRect.top - rect.bottom;

          if (distanceToNext < 50) {
            e.preventDefault();
            goToSection(currentIndex + 1, false);
          }
        }
      } else if (direction === "UP" && !isFirst) {
        if (rect.top - deltaY >= -5) {
          const prevSection = sections[currentIndex - 1];
          const prevContainer = getRealContainer(prevSection);
          const prevRect = prevContainer.getBoundingClientRect();
          const distanceToPrev = rect.top - prevRect.bottom;

          if (distanceToPrev < 50) {
            e.preventDefault();
            goToSection(currentIndex - 1, true);
          }
        }
      }
    },
    { passive: false },
  );
}
