"use client";

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base — uses CSS variable so it flips with theme */}
      <div className="absolute inset-0 bg-[var(--aurora-bg)]" />

      {/* Aurora blobs — opacity controlled by CSS variable */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[120px] animate-pulse"
        style={{
          background: "radial-gradient(circle, #4F8EF7 0%, #7C5CFC 50%, transparent 70%)",
          opacity: "var(--aurora-blob-opacity)",
          animationDuration: "8s",
        }}
      />
      <div
        className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full blur-[120px]"
        style={{
          background: "radial-gradient(circle, #7C5CFC 0%, #4F8EF7 50%, transparent 70%)",
          opacity: "var(--aurora-blob-opacity)",
          animation: "ab-float 12s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full blur-[100px]"
        style={{
          background: "radial-gradient(circle, #4F8EF7 0%, transparent 70%)",
          opacity: "calc(var(--aurora-blob-opacity) * 0.6)",
          animation: "ab-float 10s ease-in-out infinite reverse",
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(var(--aurora-grid-color) 1px, transparent 1px),
                            linear-gradient(90deg, var(--aurora-grid-color) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <style>{`
        @keyframes ab-float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33%       { transform: translateY(-30px) translateX(20px); }
          66%       { transform: translateY(20px) translateX(-20px); }
        }
      `}</style>
    </div>
  );
}