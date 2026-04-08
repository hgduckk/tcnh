"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [activeSceneId, setActiveSceneId] = useState<string>("");
  const [activeNoteText, setActiveNoteText] = useState<string>("");
  const [scenes, setScenes] = useState<Record<string, Scene>>({});
  const [overviewId, setOverviewId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setActiveSceneId(detectedOverviewId || Object.keys(sceneMap)[0] || "");
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const activeScene = useMemo(() => scenes[activeSceneId] ?? fallbackScene, [activeSceneId, scenes]);
  const parentScene = useMemo(() => (activeScene.parentId ? scenes[activeScene.parentId] : null), [activeScene.parentId, scenes]);

  const handleNoteClick = (note: MapNote) => {
    if (note.action === "scene" && note.targetId) {
      if (scenes[note.targetId]) {
        setActiveSceneId(note.targetId);
        setActiveNoteText(`Bạn đang ở: ${note.label}`);
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
  };

  const backToOverview = () => {
    if (!overviewId) return;
    setActiveSceneId(overviewId);
  };

  const backOneLevel = () => {
    if (!activeScene.parentId) {
      return;
    }

    const parentId = activeScene.parentId;

    setActiveSceneId(parentId);
    setActiveNoteText(`Bạn đang ở: ${scenes[parentId]?.title ?? "Tổng quan"}`);
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-white">
      <main className="mx-auto flex h-full w-full max-w-[1920px] flex-col gap-3 px-0 py-3 md:gap-4 md:py-4">
        <div className="px-3 md:px-6">
          <h1 className="font-anton text-[clamp(1.25rem,2.5vw,2rem)] text-slate-900">UEL Campus Map</h1>
          <p className="text-xs md:text-sm text-slate-500">{activeNoteText}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-3 md:px-6">
          <button
            type="button"
            onClick={backToOverview}
            disabled={!overviewId || activeSceneId === overviewId}
            className="rounded-full bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Về tổng quan
          </button>
          <button
            type="button"
            onClick={backOneLevel}
            disabled={!activeScene.parentId}
            className="rounded-full bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {parentScene ? `Quay lại ${parentScene.title}` : "Quay lại"}
          </button>

          <p className="rounded-full bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">{activeScene.title}</p>
        </div>

        {loading ? <p className="px-3 text-sm text-slate-500 md:px-6">Đang tải bản đồ...</p> : null}
        {error ? <p className="px-3 text-sm text-red-600 md:px-6">{error}</p> : null}

        <div className="flex min-h-0 w-full flex-1 items-center justify-center bg-white px-3 md:px-6">
          <div className="relative inline-block max-h-full max-w-full overflow-hidden rounded-xl bg-white">
            <img
              src={activeScene.image}
              alt={activeScene.imageAlt}
              className="block h-auto max-h-[100%] max-w-full w-auto"
              style={{ maxHeight: "100%" }}
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
          </div>
        </div>
        
      </main>
    </div>
  );
}
