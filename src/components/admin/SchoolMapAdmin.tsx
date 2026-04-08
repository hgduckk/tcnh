"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building2, ChevronDown, ChevronRight, DoorOpen, Layers3, Map as MapIcon } from "lucide-react";
import type { SchoolMapHotspotRow, SchoolMapNodeRow, SchoolMapNodeType } from "@/lib/schoolMap";

type NodeEditor = {
  id: string | null;
  parentId: string;
  nodeType: SchoolMapNodeType;
  name: string;
  code: string;
  functionText: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  isPublished: boolean;
  displayOrder: number;
  imageFile: File | null;
};

type HotspotEditor = {
  id: string | null;
  sceneNodeId: string;
  targetNodeId: string;
  label: string;
  actionType: "navigate" | "info";
  xPercent: number;
  yPercent: number;
  description: string;
  isPublished: boolean;
  displayOrder: number;
};

const initialNodeEditor: NodeEditor = {
  id: null,
  parentId: "",
  nodeType: "building",
  name: "",
  code: "",
  functionText: "",
  description: "",
  imageUrl: "",
  imageAlt: "",
  isPublished: true,
  displayOrder: 0,
  imageFile: null,
};

const initialHotspotEditor: HotspotEditor = {
  id: null,
  sceneNodeId: "",
  targetNodeId: "",
  label: "",
  actionType: "navigate",
  xPercent: 50,
  yPercent: 50,
  description: "",
  isPublished: true,
  displayOrder: 0,
};

const SCENE_TYPES: SchoolMapNodeType[] = ["overview", "building", "floor"];

export function SchoolMapAdmin({ adminPassword }: { adminPassword: string }) {
  const [nodes, setNodes] = useState<SchoolMapNodeRow[]>([]);
  const [hotspots, setHotspots] = useState<SchoolMapHotspotRow[]>([]);
  const [nodeEditor, setNodeEditor] = useState<NodeEditor>(initialNodeEditor);
  const [hotspotEditor, setHotspotEditor] = useState<HotspotEditor>(initialHotspotEditor);
  const [activeSceneId, setActiveSceneId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [savingNode, setSavingNode] = useState(false);
  const [savingHotspot, setSavingHotspot] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = useState<string[]>([]);

  const nodePreviewUrl = useMemo(() => {
    if (nodeEditor.imageFile) {
      return URL.createObjectURL(nodeEditor.imageFile);
    }
    return nodeEditor.imageUrl;
  }, [nodeEditor.imageFile, nodeEditor.imageUrl]);

  const authHeaders = useMemo(() => ({ "x-admin-password": adminPassword }), [adminPassword]);

  const nodeById = useMemo(() => {
    const map = new Map<string, SchoolMapNodeRow>();
    for (const node of nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [nodes]);

  const getNodeAncestors = (node: SchoolMapNodeRow) => {
    const ancestors: SchoolMapNodeRow[] = [];
    let currentParentId = node.parent_id;

    while (currentParentId) {
      const parent = nodeById.get(currentParentId);
      if (!parent) break;
      ancestors.unshift(parent);
      currentParentId = parent.parent_id;
    }

    return ancestors;
  };

  const getNodePathLabel = (node: SchoolMapNodeRow) => {
    return [...getNodeAncestors(node), node].map((item) => item.name).join(" / ");
  };

  const getAllowedParentTypes = (nodeType: SchoolMapNodeType): SchoolMapNodeType[] => {
    if (nodeType === "building") return ["overview"];
    if (nodeType === "floor") return ["building"];
    if (nodeType === "room") return ["floor"];
    return [];
  };

  const sceneNodes = useMemo(() => nodes.filter((n) => SCENE_TYPES.includes(n.node_type)), [nodes]);
  const currentScene = useMemo(() => sceneNodes.find((n) => n.id === activeSceneId) || null, [sceneNodes, activeSceneId]);

  const parentCandidates = useMemo(() => {
    if (nodeEditor.nodeType === "overview") return [];
    const allowedParentTypes = getAllowedParentTypes(nodeEditor.nodeType);

    return nodes
      .filter((n) => n.id !== nodeEditor.id && allowedParentTypes.includes(n.node_type))
      .sort((a, b) => getNodePathLabel(a).localeCompare(getNodePathLabel(b)));
  }, [nodes, nodeEditor.id, nodeEditor.nodeType]);

  const childMap = useMemo(() => {
    const grouped = new Map<string | null, SchoolMapNodeRow[]>();

    for (const node of nodes) {
      const key = node.parent_id ?? null;
      const current = grouped.get(key) || [];
      current.push(node);
      grouped.set(key, current);
    }

    for (const [key, value] of grouped.entries()) {
      grouped.set(
        key,
        [...value].sort((a, b) => {
          if (a.display_order !== b.display_order) {
            return a.display_order - b.display_order;
          }
          return a.name.localeCompare(b.name);
        })
      );
    }

    return grouped;
  }, [nodes]);

  const rootNodes = useMemo(() => childMap.get(null) || [], [childMap]);

  const currentSceneHotspots = useMemo(
    () => hotspots.filter((h) => h.scene_node_id === activeSceneId),
    [hotspots, activeSceneId]
  );

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [nodesRes, hotspotsRes] = await Promise.all([
        fetch("/api/admin/school-map/nodes", { headers: authHeaders }),
        fetch("/api/admin/school-map/hotspots", { headers: authHeaders }),
      ]);

      if (!nodesRes.ok) throw new Error(await nodesRes.text());
      if (!hotspotsRes.ok) throw new Error(await hotspotsRes.text());

      const nodesJson = await nodesRes.json();
      const hotspotsJson = await hotspotsRes.json();

      const nodeRows = Array.isArray(nodesJson?.data) ? (nodesJson.data as SchoolMapNodeRow[]) : [];
      const hotspotRows = Array.isArray(hotspotsJson?.data) ? (hotspotsJson.data as SchoolMapHotspotRow[]) : [];

      setNodes(nodeRows);
      setHotspots(hotspotRows);
      setExpandedNodeIds(
        nodeRows
          .filter((node) => node.node_type !== "room")
          .map((node) => node.id)
      );

      const firstScene = nodeRows.find((n) => SCENE_TYPES.includes(n.node_type));
      if (!activeSceneId && firstScene) {
        setActiveSceneId(firstScene.id);
        setHotspotEditor((prev) => ({ ...prev, sceneNodeId: firstScene.id }));
      }
    } catch (e) {
      setError(String(e));
      setNodes([]);
      setHotspots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetNode = () => setNodeEditor(initialNodeEditor);
  const resetHotspot = () =>
    setHotspotEditor((prev) => ({
      ...initialHotspotEditor,
      sceneNodeId: activeSceneId || prev.sceneNodeId,
    }));

  const uploadImage = async (): Promise<string> => {
    if (!nodeEditor.imageFile) return nodeEditor.imageUrl;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", nodeEditor.imageFile);
      if (nodeEditor.id) {
        formData.append("nodeId", nodeEditor.id);
      }

      const res = await fetch("/api/admin/school-map/upload-image", {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Upload ảnh thất bại.");

      return String(json?.data?.imageUrl || "");
    } finally {
      setUploadingImage(false);
    }
  };

  const saveNode = async () => {
    setError(null);
    if (!nodeEditor.name.trim()) {
      setError("Vui lòng nhập tên mục.");
      return;
    }

    setSavingNode(true);
    try {
      const imageUrl = await uploadImage();

      const payload = {
        id: nodeEditor.id ?? undefined,
        parentId: nodeEditor.nodeType === "overview" ? null : nodeEditor.parentId || null,
        nodeType: nodeEditor.nodeType,
        name: nodeEditor.name,
        code: nodeEditor.code,
        functionText: nodeEditor.functionText,
        description: nodeEditor.description,
        imageUrl,
        imageAlt: nodeEditor.imageAlt,
        isPublished: nodeEditor.isPublished,
        displayOrder: nodeEditor.displayOrder,
      };

      const res = await fetch("/api/admin/school-map/nodes", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      await refresh();
      resetNode();
      alert("Đã lưu node.");
    } catch (e) {
      setError(String(e));
    } finally {
      setSavingNode(false);
    }
  };

  const saveHotspot = async () => {
    setError(null);

    if (!activeSceneId) {
      setError("Vui lòng chọn ảnh cảnh (scene).");
      return;
    }

    if (!currentScene?.image_url) {
      setError("Scene này chưa có ảnh, nên chưa thể tạo hotspot. Hãy cập nhật ảnh trước.");
      return;
    }

    if (!hotspotEditor.label.trim()) {
      setError("Vui lòng nhập tên điểm.");
      return;
    }

    if (hotspotEditor.actionType === "navigate" && !hotspotEditor.targetNodeId) {
      setError("Điểm chuyển cảnh cần chọn đích.");
      return;
    }

    if (hotspotEditor.actionType === "info" && !hotspotEditor.description.trim()) {
      setError("Điểm info cần mô tả.");
      return;
    }

    setSavingHotspot(true);
    try {
      const payload = {
        id: hotspotEditor.id ?? undefined,
        sceneNodeId: activeSceneId,
        targetNodeId: hotspotEditor.actionType === "navigate" ? hotspotEditor.targetNodeId : null,
        label: hotspotEditor.label,
        actionType: hotspotEditor.actionType,
        xPercent: hotspotEditor.xPercent,
        yPercent: hotspotEditor.yPercent,
        description: hotspotEditor.description,
        isPublished: hotspotEditor.isPublished,
        displayOrder: hotspotEditor.displayOrder,
      };

      const res = await fetch("/api/admin/school-map/hotspots", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      await refresh();
      resetHotspot();
      alert("Đã lưu hotspot.");
    } catch (e) {
      setError(String(e));
    } finally {
      setSavingHotspot(false);
    }
  };

  const removeNode = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa node này?")) return;

    setError(null);
    try {
      const res = await fetch(`/api/admin/school-map/nodes/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!res.ok) throw new Error(await res.text());
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  };

  const removeHotspot = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa điểm này?")) return;

    setError(null);
    try {
      const res = await fetch(`/api/admin/school-map/hotspots/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!res.ok) throw new Error(await res.text());
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  };

  const editNode = (node: SchoolMapNodeRow) => {
    setNodeEditor({
      id: node.id,
      parentId: node.parent_id || "",
      nodeType: node.node_type,
      name: node.name,
      code: node.code,
      functionText: node.function_text,
      description: node.description,
      imageUrl: node.image_url,
      imageAlt: node.image_alt,
      isPublished: node.is_published,
      displayOrder: node.display_order,
      imageFile: null,
    });
  };

  const editHotspot = (hotspot: SchoolMapHotspotRow) => {
    setActiveSceneId(hotspot.scene_node_id);
    setHotspotEditor({
      id: hotspot.id,
      sceneNodeId: hotspot.scene_node_id,
      targetNodeId: hotspot.target_node_id || "",
      label: hotspot.label,
      actionType: hotspot.action_type,
      xPercent: hotspot.x_percent,
      yPercent: hotspot.y_percent,
      description: hotspot.description,
      isPublished: hotspot.is_published,
      displayOrder: hotspot.display_order,
    });
  };

  const toggleNodeExpanded = (id: string) => {
    setExpandedNodeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getNodeIcon = (nodeType: SchoolMapNodeType) => {
    if (nodeType === "overview") return MapIcon;
    if (nodeType === "building") return Building2;
    if (nodeType === "floor") return Layers3;
    return DoorOpen;
  };

  const getNodeTypeLabel = (nodeType: SchoolMapNodeType) => {
    if (nodeType === "overview") return "Tổng quan";
    if (nodeType === "building") return "Tòa nhà";
    if (nodeType === "floor") return "Tầng";
    return "Phòng";
  };

  const renderNodeBranch = (node: SchoolMapNodeRow, depth = 0): React.ReactNode => {
    const children = childMap.get(node.id) || [];
    const isExpanded = expandedNodeIds.includes(node.id);
    const hasChildren = children.length > 0;
    const Icon = getNodeIcon(node.node_type);
    const pathLabel = getNodePathLabel(node);

    return (
      <div key={node.id} className="space-y-3">
        <div
          className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4"
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <button
            type="button"
            onClick={() => hasChildren && toggleNodeExpanded(node.id)}
            className={`flex h-7 w-7 items-center justify-center rounded-md ${
              hasChildren ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-300"
            }`}
            disabled={!hasChildren}
          >
            {hasChildren ? (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : <span className="text-xs">-</span>}
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Icon className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">{node.name}</p>
              <Badge variant="outline">{getNodeTypeLabel(node.node_type)}</Badge>
              <span className="text-xs text-slate-400">order: {node.display_order}</span>
              {node.code ? <span className="text-xs text-slate-500">Mã: {node.code}</span> : null}
            </div>
            <p className="text-xs text-slate-400">Đường dẫn: {pathLabel}</p>
            <p className="text-xs leading-5 text-slate-500">
              {node.function_text || node.description || (hasChildren ? `Có ${children.length} mục con` : "Chưa có mô tả")}
            </p>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => editNode(node)}>Sửa</Button>
            <Button size="sm" variant="destructive" onClick={() => removeNode(node.id)}>Xóa</Button>
          </div>
        </div>

        {hasChildren && isExpanded ? <div className="space-y-3">{children.map((child) => renderNodeBranch(child, depth + 1))}</div> : null}
      </div>
    );
  };

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setHotspotEditor((prev) => ({
      ...prev,
      sceneNodeId: activeSceneId,
      xPercent: Math.max(0, Math.min(100, Number(x.toFixed(2)))),
      yPercent: Math.max(0, Math.min(100, Number(y.toFixed(2)))),
    }));
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Thêm dữ liệu map (Tổng quan / Tòa / Tầng / Phòng)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8 md:grid-cols-2">
          <div className="space-y-5">
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Thể loại</label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={nodeEditor.nodeType}
                onChange={(e) => setNodeEditor((prev) => ({ ...prev, nodeType: e.target.value as SchoolMapNodeType }))}
              >
                <option value="overview">Tổng quan</option>
                <option value="building">Tòa nhà</option>
                <option value="floor">Tầng</option>
                <option value="room">Phòng</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Thẻ cha</label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={nodeEditor.parentId}
                onChange={(e) => setNodeEditor((prev) => ({ ...prev, parentId: e.target.value }))}
                disabled={nodeEditor.nodeType === "overview"}
              >
                <option value="">Không có</option>
                {parentCandidates.map((node) => (
                  <option key={node.id} value={node.id}>
                    {getNodePathLabel(node)} ({getNodeTypeLabel(node.node_type)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Tên</label>
              <Input value={nodeEditor.name} onChange={(e) => setNodeEditor((prev) => ({ ...prev, name: e.target.value }))} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Mã/Số phòng</label>
              <Input value={nodeEditor.code} onChange={(e) => setNodeEditor((prev) => ({ ...prev, code: e.target.value }))} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Chức năng</label>
              <Input value={nodeEditor.functionText} onChange={(e) => setNodeEditor((prev) => ({ ...prev, functionText: e.target.value }))} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Mô tả</label>
              <Textarea value={nodeEditor.description} onChange={(e) => setNodeEditor((prev) => ({ ...prev, description: e.target.value }))} rows={3} />
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Upload ảnh</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setNodeEditor((prev) => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
              />
            </div>

            {nodePreviewUrl ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500">Preview khung 16:9 (khong thay doi anh goc)</p>
                <div className="relative aspect-video w-full overflow-hidden rounded-md bg-slate-100">
                  <img src={nodePreviewUrl} alt="Preview node" className="h-full w-full object-cover" />
                </div>
              </div>
            ) : null}

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Alt ảnh</label>
              <Input value={nodeEditor.imageAlt} onChange={(e) => setNodeEditor((prev) => ({ ...prev, imageAlt: e.target.value }))} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Thứ tự</label>
              <Input
                type="number"
                value={nodeEditor.displayOrder}
                onChange={(e) => setNodeEditor((prev) => ({ ...prev, displayOrder: Number(e.target.value || 0) }))}
              />
            </div>

            <label className="inline-flex items-center gap-2 pt-1 text-sm">
              <input
                type="checkbox"
                checked={nodeEditor.isPublished}
                onChange={(e) => setNodeEditor((prev) => ({ ...prev, isPublished: e.target.checked }))}
              />
              Công khai
            </label>

            <div className="flex gap-2">
              <Button onClick={saveNode} disabled={savingNode || uploadingImage}>
                {savingNode || uploadingImage ? "Đang lưu..." : "Lưu node"}
              </Button>
              <Button variant="outline" onClick={resetNode}>Làm mới form</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Node list</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {loading ? <p className="text-sm text-slate-500">Đang tải...</p> : null}
          {!loading && nodes.length === 0 ? <p className="text-sm text-slate-500">Chưa có dữ liệu.</p> : null}

          {!loading && rootNodes.length > 0 ? <div className="space-y-3">{rootNodes.map((node) => renderNodeBranch(node))}</div> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thêm hotspot vào map</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold">Chọn scene để đặt điểm</label>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={activeSceneId}
                onChange={(e) => {
                  setActiveSceneId(e.target.value);
                  setHotspotEditor((prev) => ({ ...prev, sceneNodeId: e.target.value }));
                }}
              >
                <option value="">Chọn scene...</option>
                {sceneNodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {getNodePathLabel(node)} ({getNodeTypeLabel(node.node_type)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentScene?.image_url ? (
            <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img
                src={currentScene.image_url}
                alt={currentScene.image_alt || currentScene.name}
                className="block h-full w-full cursor-crosshair object-cover"
                onClick={handleImageClick}
              />

              <div
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${hotspotEditor.xPercent}%`, top: `${hotspotEditor.yPercent}%` }}
              >
                <span className="block h-3 w-3 rounded-full bg-rose-500 ring-4 ring-rose-200/80" />
              </div>

              {currentSceneHotspots.map((point) => (
                <button
                  key={point.id}
                  type="button"
                  onClick={() => editHotspot(point)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] shadow"
                  style={{ left: `${point.x_percent}%`, top: `${point.y_percent}%` }}
                >
                  {point.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Scene chưa có ảnh để đặt điểm.</p>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <label className="mb-1 block text-sm font-semibold">Tên điểm</label>
              <Input value={hotspotEditor.label} onChange={(e) => setHotspotEditor((prev) => ({ ...prev, label: e.target.value }))} />

              <label className="mb-1 block text-sm font-semibold">Kiểu điểm</label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={hotspotEditor.actionType}
                onChange={(e) => setHotspotEditor((prev) => ({ ...prev, actionType: e.target.value as "navigate" | "info" }))}
              >
                <option value="navigate">Điều hướng</option>
                <option value="info">Thông tin</option>
              </select>

            </div>

            <div className="space-y-4">
              <label className="mb-1 block text-sm font-semibold">Đích điều hướng</label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={hotspotEditor.targetNodeId}
                onChange={(e) => setHotspotEditor((prev) => ({ ...prev, targetNodeId: e.target.value }))}
                disabled={hotspotEditor.actionType !== "navigate"}
              >
                <option value="">Chọn đích...</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {getNodePathLabel(node)} ({getNodeTypeLabel(node.node_type)})
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold">X (%)</label>
                  <Input
                    type="number"
                    value={hotspotEditor.xPercent}
                    onChange={(e) => setHotspotEditor((prev) => ({ ...prev, xPercent: Number(e.target.value || 0) }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Y (%)</label>
                  <Input
                    type="number"
                    value={hotspotEditor.yPercent}
                    onChange={(e) => setHotspotEditor((prev) => ({ ...prev, yPercent: Number(e.target.value || 0) }))}
                  />
                </div>
              </div>

              <label className="mb-1 block text-sm font-semibold">Mô tả (cho kiểu điểm thông tin)</label>
              <Textarea
                rows={2}
                value={hotspotEditor.description}
                onChange={(e) => setHotspotEditor((prev) => ({ ...prev, description: e.target.value }))}
              />

              <label className="inline-flex items-center gap-2 pt-1 text-sm">
                <input
                  type="checkbox"
                  checked={hotspotEditor.isPublished}
                  onChange={(e) => setHotspotEditor((prev) => ({ ...prev, isPublished: e.target.checked }))}
                />
                Công khai
              </label>

              <div className="flex gap-2 pt-1">
                <Button onClick={saveHotspot} disabled={savingHotspot}>
                  {savingHotspot ? "Saving" : "Save"}
                </Button>
                <Button variant="outline" onClick={resetHotspot}>Refesh</Button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Hotspot theo scene hiện tại</p>
            {currentSceneHotspots.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có hotspot.</p>
            ) : (
              currentSceneHotspots.map((h) => (
                <div key={h.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                  <Badge variant="outline">{h.action_type}</Badge>
                  <span className="text-sm">{h.label}</span>
                  <span className="text-xs text-slate-500">({h.x_percent}%, {h.y_percent}%)</span>
                  <span className="ml-auto flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => editHotspot(h)}>Sửa</Button>
                    <Button size="sm" variant="destructive" onClick={() => removeHotspot(h.id)}>Xóa</Button>
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
