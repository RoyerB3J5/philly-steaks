import { useEffect, useId, useState } from "react";

export default function NuvisionForm() {
  const [loaded, setLoaded] = useState(false);
  const iframeId = useId();

  useEffect(() => {
    // Only run in the browser
    if (typeof window === "undefined" || typeof document === "undefined")
      return;

    const SRC = "https://link.inkshapecrm.com/js/form_embed.js";
    // Avoid injecting the script multiple times
    let addedByUs = false;
    let script = document.querySelector(
      `script[src="${SRC}"]`,
    ) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.src = SRC;
      script.async = true;
      script.setAttribute("data-treehubly-embed", "1");
      document.body.appendChild(script);
      addedByUs = true;
    }

    return () => {
      if (addedByUs && script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "350px",
        height: "650px", // Altura específica basada en data-height
        padding: 0,
        overflow: "hidden",
        // Oculta cualquier contenido que se desborde
      }}
      className="px-4"
    >
      {!loaded && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "300px",
            margin: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#b52132",
            overflow: "hidden",
          }}
        >
          Cargando…
        </div>
      )}
      <iframe
        id="inline-5LZIKkpSGVy5SzDqnLmU"
        src="https://link.inkshapecrm.com/widget/form/5LZIKkpSGVy5SzDqnLmU"
        title="Form Reviews"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        style={{
          width: "100%",
          height: "580px",
          border: "none",
          borderRadius: 3,
          background: "transparent",
          padding: 0,
          overflow: "hidden", // Oculta el scroll interno del iframe
        }}
        // Note: 'scrolling' is non-standard and can cause React warnings; use CSS overflow to control scroll
        data-layout="{'id':'INLINE'}"
        data-trigger-type="alwaysShow"
        data-activation-type="alwaysActivated"
        data-deactivation-type="neverDeactivate"
        data-form-name="Form Reviews"
        data-height="510"
        data-layout-iframe-id="inline-5LZIKkpSGVy5SzDqnLmU"
        data-form-id="5LZIKkpSGVy5SzDqnLmU"
      />
    </div>
  );
}
