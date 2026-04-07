"use client";

import { useMemo, useState } from "react";

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

const overviewScene: Scene = {
  id: "overview",
  image: "/images/map.png",
  imageAlt: "Bản đồ tổng quan khuôn viên",
  title: "Tổng quan khuôn viên",
  notes: [
    {
      id: "building-main",
      label: "Tòa nhà chính",
      x: 39,
      y: 49,
      action: "scene",
      targetId: "main-building",
    },
    {
      id: "overview-water",
      label: "Kênh nước",
      x: 31,
      y: 67,
      action: "info",
      description: "Khu vực cảnh quan bao quanh tòa nhà.",
    },
    {
      id: "overview-hill",
      label: "Đồi cây xanh",
      x: 63,
      y: 17,
      action: "info",
      description: "Không gian xanh phía sau khu giảng đường.",
    },
  ],
};

const scenes: Record<string, Scene> = {
  overview: overviewScene,
  "main-building": {
    id: "main-building",
    image: "/images/floor.png",
    imageAlt: "Sảnh và phân tầng tòa nhà chính",
    title: "Tòa nhà chính",
    parentId: "overview",
    notes: [
      {
        id: "floor-1",
        label: "Tầng 1",
        x: 46,
        y: 60,
        action: "scene",
        targetId: "main-floor-1",
      },
      {
        id: "floor-2",
        label: "Tầng 2",
        x: 46,
        y: 52,
        action: "scene",
        targetId: "main-floor-2",
      },
      {
        id: "helpdesk-info",
        label: "Bàn hỗ trợ",
        x: 38,
        y: 65,
        action: "info",
        description: "Điểm hỗ trợ sinh viên tại sảnh tòa nhà.",
      },
    ],
  },
  "main-floor-1": {
    id: "main-floor-1",
    image: "/images/floor.png",
    imageAlt: "Mặt bằng tầng 1",
    title: "Tầng 1",
    parentId: "main-building",
    notes: [
      {
        id: "room-101",
        label: "P.101",
        x: 44,
        y: 64,
        action: "scene",
        targetId: "room-101-detail",
      },
      {
        id: "room-102",
        label: "P.102",
        x: 52,
        y: 64,
        action: "scene",
        targetId: "room-102-detail",
      },
    ],
  },
  "main-floor-2": {
    id: "main-floor-2",
    image: "/images/floor.png",
    imageAlt: "Mặt bằng tầng 2",
    title: "Tầng 2",
    parentId: "main-building",
    notes: [
      {
        id: "room-201",
        label: "P.201",
        x: 44,
        y: 56,
        action: "scene",
        targetId: "room-201-detail",
      },
      {
        id: "room-202",
        label: "P.202",
        x: 52,
        y: 56,
        action: "scene",
        targetId: "room-202-detail",
      },
    ],
  },
  "room-101-detail": {
    id: "room-101-detail",
    image: "/images/room-1.png",
    imageAlt: "Phòng 101",
    title: "Phòng 101",
    parentId: "main-floor-1",
    notes: [
      {
        id: "room-101-info",
        label: "Thông tin",
        x: 50,
        y: 60,
        action: "info",
        description: "Phòng tiếp nhận thủ tục sinh viên.",
      },
    ],
  },
  "room-102-detail": {
    id: "room-102-detail",
    image: "/images/room-1.png",
    imageAlt: "Phòng 102",
    title: "Phòng 102",
    parentId: "main-floor-1",
    notes: [
      {
        id: "room-102-info",
        label: "Thông tin",
        x: 50,
        y: 60,
        action: "info",
        description: "Phòng hỗ trợ hồ sơ và xác nhận giấy tờ.",
      },
    ],
  },
  "room-201-detail": {
    id: "room-201-detail",
    image: "/images/room-1.png",
    imageAlt: "Phòng 201",
    title: "Phòng 201",
    parentId: "main-floor-2",
    notes: [
      {
        id: "room-201-info",
        label: "Thông tin",
        x: 50,
        y: 60,
        action: "info",
        description: "Phòng học lý thuyết.",
      },
    ],
  },
  "room-202-detail": {
    id: "room-202-detail",
    image: "/images/room-1.png",
    imageAlt: "Phòng 202",
    title: "Phòng 202",
    parentId: "main-floor-2",
    notes: [
      {
        id: "room-202-info",
        label: "Thông tin",
        x: 50,
        y: 60,
        action: "info",
        description: "Phòng họp nhóm.",
      },
    ],
  },
};

export default function YouthSchoolMapPage() {
  const [activeSceneId, setActiveSceneId] = useState<string>("overview");
  const [activeNoteText, setActiveNoteText] = useState<string>("Chọn một điểm trên ảnh để xem chi tiết.");

  const activeScene = useMemo(() => scenes[activeSceneId] ?? overviewScene, [activeSceneId]);

  const handleNoteClick = (note: MapNote) => {
    if (note.action === "scene" && note.targetId) {
      setActiveSceneId(note.targetId);
      setActiveNoteText(`Đang xem: ${note.label}`);
      return;
    }

    if (note.description) {
      setActiveNoteText(note.description);
      return;
    }

    setActiveNoteText(`Thông tin: ${note.label}`);
  };

  const backToOverview = () => {
    setActiveSceneId("overview");
    setActiveNoteText("Chọn một điểm trên ảnh để xem chi tiết.");
  };

  const backOneLevel = () => {
    if (activeSceneId === "overview") {
      return;
    }

    const currentScene = scenes[activeSceneId];
    const parentId = currentScene?.parentId ?? "overview";

    setActiveSceneId(parentId);
    setActiveNoteText(`Đang xem: ${scenes[parentId]?.title ?? "Tổng quan khuôn viên"}`);
  };

  return (
    <div className="min-h-screen bg-[#f2f3f5] px-3 py-4 md:px-6 md:py-6">
      <main className="mx-auto max-w-[1240px] space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={backToOverview}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Tổng quan
          </button>
          <button
            type="button"
            onClick={backOneLevel}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Quay lại
          </button>
          <p className="text-xs font-medium text-slate-700">{activeScene.title}</p>
          <p className="text-xs text-slate-500">{activeNoteText}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
          <img
            src={activeScene.image}
            alt={activeScene.imageAlt}
            className="w-full h-auto block"
          />

          {activeScene.notes.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => handleNoteClick(note)}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-800 shadow hover:bg-white"
              style={{ left: `${note.x}%`, top: `${note.y}%` }}
            >
              {note.label}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
