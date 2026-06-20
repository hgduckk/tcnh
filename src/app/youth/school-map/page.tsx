"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

type MapNote = {
  id: string;
  label: string;
  x: number;
  y: number;
  action: "info" | "scene";
  description?: string;
  targetId?: string;
};

type Scene = {
  id: string;
  image: string;
  imageAlt: string;
  title: string;
  parentId?: string;
  notes: MapNote[];
};

const fallbackScene: Scene = {
  id: "fallback",
  image: "/images/map.png",
  imageAlt: "Bản đồ tổng quan",
  title: "Tổng quan",
  notes: [],
};

export default function YouthSchoolMapPage() {
  const [displaySceneId, setDisplaySceneId] = useState<string>("");
  const [activeNoteText, setActiveNoteText] = useState<string>("");
  const [scenes, setScenes] = useState<Record<string, Scene>>({});
  const [overviewId, setOverviewId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transPhase, setTransPhase] = useState<"idle" | "exit" | "enter">("idle");
  const [transDir, setTransDir] = useState<"forward" | "backward">("forward");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/school-map", { cache: "no-store" });
        if (!res.ok) throw new Error("Không thể tải dữ liệu school map.");
        const json = await res.json();
        const nodes = Array.isArray(json?.data?.nodes) ? json.data.nodes : [];
        const hotspots = Array.isArray(json?.data?.hotspots) ? json.data.hotspots : [];

        const sceneMap: Record<string, Scene> = {};
        let detectedOverviewId = "";

        for (const node of nodes) {
          if (!["overview", "building", "floor"].includes(String(node?.node_type || ""))) continue;

          const sceneId = String(node.id || "").trim();
          if (!sceneId) continue;

          if (String(node.node_type) === "overview" && !detectedOverviewId) {
            detectedOverviewId = sceneId;
          }

          sceneMap[sceneId] = {
            id: sceneId,
            image: String(node.image_url || "").trim() || "/images/map.png",
            imageAlt: String(node.image_alt || "").trim() || String(node.name || "Bản đồ"),
            title: String(node.name || "Scene"),
            parentId: node.parent_id ? String(node.parent_id) : undefined,
            notes: [],
          };
        }

        for (const hotspot of hotspots) {
          const sceneId = String(hotspot.scene_node_id || "").trim();
          if (!sceneMap[sceneId]) continue;

          sceneMap[sceneId].notes.push({
            id: String(hotspot.id || "").trim(),
            label: String(hotspot.label || "Điểm"),
            x: Number(hotspot.x_percent || 50),
            y: Number(hotspot.y_percent || 50),
            action: String(hotspot.action_type) === "info" ? "info" : "scene",
            description: String(hotspot.description || "").trim() || undefined,
            targetId: hotspot.target_node_id ? String(hotspot.target_node_id) : undefined,
          });
        }

        setScenes(sceneMap);
        setOverviewId(detectedOverviewId || Object.keys(sceneMap)[0] || "");
        setDisplaySceneId(detectedOverviewId || Object.keys(sceneMap)[0] || "");
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const activeScene = useMemo(() => scenes[displaySceneId] ?? fallbackScene, [displaySceneId, scenes]);

  // Full ancestry chain from root → current scene
  const breadcrumb = useMemo(() => {
    const path: { id: string; title: string }[] = [];
    let cur: Scene | undefined = scenes[displaySceneId];
    while (cur) {
      path.unshift({ id: cur.id, title: cur.title });
      cur = cur.parentId ? scenes[cur.parentId] : undefined;
    }
    return path;
  }, [displaySceneId, scenes]);

  // "Bạn đang ở: Phòng 102 - Tầng 1 - Tòa A" — deepest → shallowest, skip root
  const locationText = useMemo(() => {
    const parts = breadcrumb.slice(1).reverse();
    if (parts.length === 0) return "";
    return "Bạn đang ở: " + parts.map((p) => p.title).join(" - ");
  }, [breadcrumb]);

  const navigateTo = useCallback((sceneId: string, dir: "forward" | "backward") => {
    if (!scenes[sceneId] || sceneId === displaySceneId) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveNoteText("");
    setTransDir(dir);
    setTransPhase("exit");
    timerRef.current = setTimeout(() => {
      setDisplaySceneId(sceneId);
      setTransPhase("enter");
      timerRef.current = setTimeout(() => setTransPhase("idle"), 360);
    }, 260);
  }, [scenes, displaySceneId]);

  const handleNoteClick = useCallback((note: MapNote) => {
    if (note.action === "scene" && note.targetId) {
      if (scenes[note.targetId]) {
        navigateTo(note.targetId, "forward");
        return;
      }
      setActiveNoteText(note.description || `Thông tin: ${note.label}`);
      return;
    }
    if (note.description) {
      setActiveNoteText(note.description);
      return;
    }
    setActiveNoteText(`Thông tin: ${note.label}`);
  }, [navigateTo, scenes]);

  const animClass =
    transPhase === "exit"  && transDir === "forward"  ? "smv-exit-fwd"  :
    transPhase === "exit"  && transDir === "backward" ? "smv-exit-bwd"  :
    transPhase === "enter" && transDir === "forward"  ? "smv-enter-fwd" :
    transPhase === "enter" && transDir === "backward" ? "smv-enter-bwd" : "";

  const showVignette = transPhase === "exit" && transDir === "forward";

  return (
    <div className="h-full overflow-hidden bg-white">
      <style>{`
        @keyframes mapExitFwd  { from{opacity:1;transform:scale(1)}    to{opacity:0;transform:scale(1.14)} }
        @keyframes mapExitBwd  { from{opacity:1;transform:scale(1)}    to{opacity:0;transform:scale(0.87)} }
        @keyframes mapEnterFwd { from{opacity:0;transform:scale(0.90)} to{opacity:1;transform:scale(1)}    }
        @keyframes mapEnterBwd { from{opacity:0;transform:scale(1.10)} to{opacity:1;transform:scale(1)}    }
        @keyframes smvVignette { from{opacity:0} to{opacity:1} }
        .smv-exit-fwd  { animation: mapExitFwd   260ms ease-in  forwards; pointer-events:none; }
        .smv-exit-bwd  { animation: mapExitBwd   260ms ease-in  forwards; pointer-events:none; }
        .smv-enter-fwd { animation: mapEnterFwd  360ms ease-out forwards; }
        .smv-enter-bwd { animation: mapEnterBwd  360ms ease-out forwards; }
        .smv-vignette  { animation: smvVignette  260ms ease-in  forwards; }
      `}</style>
      <main className="mx-auto flex h-full w-full max-w-[1920px] min-h-0 flex-col px-3 py-2 md:px-6 md:py-3">
        <div className="mb-2 shrink-0">
          <h1 className="font-anton text-[clamp(1.15rem,2.2vw,1.8rem)] text-slate-900">UEL Campus Map</h1>
        </div>

        <div className="relative flex min-h-0 w-full flex-1 items-start justify-center overflow-hidden">
          <div className="absolute left-2 top-2 z-30 w-[min(92%,40rem)] rounded-xl border border-slate-200 bg-white/92 p-3 shadow-[0_10px_35px_rgba(15,23,42,0.12)] backdrop-blur-md md:left-4 md:top-4 md:p-3.5">
            <p className="mb-2 text-xs md:text-sm text-slate-600 min-h-[1.25rem]">
              {loading ? "Đang tải bản đồ..." : error ? error : activeNoteText || locationText}
            </p>

            <div className="flex flex-wrap items-center gap-1">
              {breadcrumb.map((crumb, i) => (
                <span key={crumb.id} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                  {i < breadcrumb.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => navigateTo(crumb.id, "backward")}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                    >
                      {crumb.title}
                    </button>
                  ) : (
                    <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700">
                      {crumb.title}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div
            className={`relative w-full max-w-6xl overflow-hidden rounded-xl bg-white ${animClass}`}
            style={{ aspectRatio: "16 / 9", maxHeight: "100%" }}
          >
            <img
              src={activeScene.image}
              alt={activeScene.imageAlt}
              className="block h-full w-full object-contain"
            />

            {activeScene.notes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => handleNoteClick(note)}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-900 shadow-[0_6px_24px_rgba(15,23,42,0.14)] backdrop-blur transition hover:scale-[1.02]"
                style={{ left: `${note.x}%`, top: `${note.y}%` }}
              >
                {note.label}
              </button>
            ))}

            {showVignette && (
              <div
                className="smv-vignette pointer-events-none absolute inset-0 rounded-xl"
                style={{ background: "radial-gradient(ellipse at center, transparent 15%, rgba(0,0,0,0.93) 100%)" }}
              />
            )}
          </div>
        </div>
        
      </main>
    </div>
  );
}