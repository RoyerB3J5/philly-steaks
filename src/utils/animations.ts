// src/utils/animations.ts
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
}

// 2. Exportar las herramientas por si las necesitas directamente
export { gsap, ScrollTrigger, ScrollToPlugin };

// 3. Tus funciones de animación centralizadas y reutilizables
export const initAnimations = () => {
  // Puedes agregar más inicializadores globales aquí abajo...
};
