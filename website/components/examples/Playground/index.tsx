"use client";

import { useDomet, type ScrollToPosition } from "domet";
import { useCallback, useMemo, useRef, useState } from "react";

type LogEntry = {
  id: number;
  time: string;
  type: "active" | "enter" | "leave" | "scrollStart" | "scrollEnd" | "info";
  message: string;
};

const OFFSET_REGEX = /^-?\d+(?:\.\d+)?%?$/;
const MAX_OFFSET_PX = 10000;
const MAX_OFFSET_PERCENT = 200;

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

function getColor(index: number) {
  return COLORS[index % COLORS.length];
}

function formatTime() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;
}

export function Playground() {
  const [mode, setMode] = useState<"ids" | "selector">("ids");
  const [sectionCount, setSectionCount] = useState(4);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [scrollBehavior, setScrollBehavior] = useState<
    "smooth" | "instant" | "auto"
  >("auto");
  const [offset, setOffset] = useState<string>("0");
  const [threshold, setThreshold] = useState(0.6);
  const [hysteresis, setHysteresis] = useState(150);
  const [sectionHeight, setSectionHeight] = useState<"full" | "half" | "third">("full");
  const [scrollToPosition, setScrollToPosition] = useState<ScrollToPosition | "auto">("auto");
  const [showTriggerLine, setShowTriggerLine] = useState(true);
  const logIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollStateRef = useRef({ y: 0, triggerLine: 0, maxScroll: 0 });

  const addLog = useCallback(
    (type: LogEntry["type"], message: string) => {
      setLogs((prev) => [
        { id: logIdRef.current++, time: formatTime(), type, message },
        ...prev,
      ]);
    },
    [],
  );

  const sectionIds = Array.from(
    { length: sectionCount },
    (_, i) => `section-${i + 1}`,
  );

  const { parsedOffset, offsetError } = useMemo(() => {
    const trimmed = offset.trim();

    if (trimmed === "") {
      return { parsedOffset: 0 as const, offsetError: null };
    }

    if (!OFFSET_REGEX.test(trimmed)) {
      return {
        parsedOffset: 0 as const,
        offsetError: "Invalid format. Use a number (e.g. 100) or percentage (e.g. 10%)."
      };
    }

    if (trimmed.endsWith("%")) {
      const num = parseFloat(trimmed.slice(0, -1));
      if (Math.abs(num) > MAX_OFFSET_PERCENT) {
        return {
          parsedOffset: `${Math.sign(num) * MAX_OFFSET_PERCENT}%` as `${number}%`,
          offsetError: `Percentage clamped to ±${MAX_OFFSET_PERCENT}%.`
        };
      }
      return { parsedOffset: trimmed as `${number}%`, offsetError: null };
    }

    const num = parseFloat(trimmed);
    if (Math.abs(num) > MAX_OFFSET_PX) {
      return {
        parsedOffset: Math.sign(num) * MAX_OFFSET_PX,
        offsetError: `Value clamped to ±${MAX_OFFSET_PX}px.`
      };
    }
    return { parsedOffset: num, offsetError: null };
  }, [offset]);

  const getScrollInfo = () => {
    const s = scrollStateRef.current;
    return `y=${Math.round(s.y)} trigger=${Math.round(s.triggerLine)} max=${Math.round(s.maxScroll)}`;
  };

  const {
    active,
    index,
    progress,
    direction,
    scroll,
    sections,
    ids,
    scrollTo,
    register,
    link,
  } = useDomet(
    mode === "ids"
      ? {
          ids: sectionIds,
          container: containerRef,
          tracking: { offset: parsedOffset, threshold, hysteresis },
          scrolling: { behavior: scrollBehavior },
          onActive: (id, prevId) =>
            addLog("active", `${prevId} → ${id} (${getScrollInfo()})`),
          onEnter: (id) => addLog("enter", `${id}`),
          onLeave: (id) => addLog("leave", `${id}`),
          onScrollStart: () => addLog("scrollStart", `Started (${getScrollInfo()})`),
          onScrollEnd: () => addLog("scrollEnd", `Ended (${getScrollInfo()})`),
        }
      : {
          selector: "[data-playground-section]",
          container: containerRef,
          tracking: { offset: parsedOffset, threshold, hysteresis },
          scrolling: { behavior: scrollBehavior },
          onActive: (id, prevId) =>
            addLog("active", `${prevId} → ${id} (${getScrollInfo()})`),
          onEnter: (id) => addLog("enter", `${id}`),
          onLeave: (id) => addLog("leave", `${id}`),
          onScrollStart: () => addLog("scrollStart", `Started (${getScrollInfo()})`),
          onScrollEnd: () => addLog("scrollEnd", `Ended (${getScrollInfo()})`),
        },
  );

  scrollStateRef.current = {
    y: scroll.y,
    triggerLine: scroll.triggerLine,
    maxScroll: scroll.maxScroll,
  };

  const handleAddSection = () => {
    setSectionCount((c) => Math.min(c + 1, 10));
    addLog("info", `Added section (total: ${sectionCount + 1})`);
  };

  const handleRemoveSection = () => {
    setSectionCount((c) => Math.max(c - 1, 1));
    addLog("info", `Removed section (total: ${Math.max(sectionCount - 1, 1)})`);
  };

  const handleScrollTo = (id: string) => {
    const sectionState = sections[id];
    const boundsInfo = sectionState
      ? `target=${Math.round(sectionState.bounds.top)}-${Math.round(sectionState.bounds.bottom)}`
      : "not mounted";
    const posInfo = scrollToPosition !== "auto" ? ` position=${scrollToPosition}` : "";
    addLog("info", `scrollTo("${id}")${posInfo} ${boundsInfo} from=${getScrollInfo()}`);
    scrollTo(id, {
      behavior: scrollBehavior,
      position: scrollToPosition === "auto" ? undefined : scrollToPosition,
    });
  };

  const clearLogs = () => setLogs([]);

  const copyLogs = () => {
    const text = logs
      .map((log) => `${log.time} [${log.type}] ${log.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
  };

  const logTypeColors: Record<LogEntry["type"], string> = {
    active: "text-blue-600",
    enter: "text-green-600",
    leave: "text-red-600",
    scrollStart: "text-amber-600",
    scrollEnd: "text-amber-600",
    info: "text-zinc-500",
  };

  return (
    <div className="flex h-screen bg-white text-zinc-900">
      <div className="w-80 border-r border-zinc-200 flex flex-col overflow-y-auto bg-zinc-50">
        <div className="p-4 border-b border-zinc-200">
          <h1 className="text-lg font-semibold mb-4 mt-0">Domet Playground</h1>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("ids")}
                  className={`flex-1 px-3 py-1.5 text-sm rounded font-medium transition-colors ${mode === "ids" ? "bg-blue-600 text-white" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-700"}`}
                >
                  ids
                </button>
                <button
                  onClick={() => setMode("selector")}
                  className={`flex-1 px-3 py-1.5 text-sm rounded font-medium transition-colors ${mode === "selector" ? "bg-blue-600 text-white" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-700"}`}
                >
                  selector
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Sections ({sectionCount})
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleRemoveSection}
                  disabled={sectionCount <= 1}
                  className="flex-1 px-3 py-1.5 text-sm rounded bg-zinc-200 hover:bg-zinc-300 text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  - Remove
                </button>
                <button
                  onClick={handleAddSection}
                  disabled={sectionCount >= 10}
                  className="flex-1 px-3 py-1.5 text-sm rounded bg-zinc-200 hover:bg-zinc-300 text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Section Height
              </label>
              <div className="flex gap-1">
                {(["full", "half", "third"] as const).map((h) => (
                  <button
                    key={h}
                    onClick={() => setSectionHeight(h)}
                    className={`flex-1 px-2 py-1.5 text-xs rounded font-medium transition-colors ${
                      sectionHeight === h
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-200 hover:bg-zinc-300 text-zinc-700"
                    }`}
                  >
                    {h === "full" ? "100vh" : h === "half" ? "50vh" : "33vh"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Scroll Behavior
              </label>
              <select
                value={scrollBehavior}
                onChange={(e) =>
                  setScrollBehavior(
                    e.target.value as "smooth" | "instant" | "auto",
                  )
                }
                className="w-full px-3 py-1.5 text-sm rounded bg-white border border-zinc-300 text-zinc-900"
              >
                <option value="auto">auto</option>
                <option value="smooth">smooth</option>
                <option value="instant">instant</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                ScrollTo Position
              </label>
              <select
                value={scrollToPosition}
                onChange={(e) =>
                  setScrollToPosition(
                    e.target.value as ScrollToPosition | "auto",
                  )
                }
                className="w-full px-3 py-1.5 text-sm rounded bg-white border border-zinc-300 text-zinc-900"
              >
                <option value="auto">auto (trigger line)</option>
                <option value="top">top</option>
                <option value="center">center</option>
                <option value="bottom">bottom</option>
              </select>
              <p className="text-xs text-zinc-400 mt-1">
                Section alignment in viewport on scrollTo
              </p>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Tracking Offset</label>
              <input
                type="text"
                value={offset}
                onChange={(e) => setOffset(e.target.value)}
                placeholder="e.g. 100 or 10%"
                className={`w-full px-3 py-1.5 text-sm rounded bg-white border text-zinc-900 ${
                  offsetError ? "border-red-400" : "border-zinc-300"
                }`}
              />
              {offsetError && (
                <p className="text-xs text-red-500 mt-1">{offsetError}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Threshold ({(threshold * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-xs text-zinc-400 mt-1">
                Visibility % needed for priority scoring
              </p>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Hysteresis ({hysteresis} pts)
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={hysteresis}
                onChange={(e) => setHysteresis(parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-xs text-zinc-400 mt-1">
                Score margin to resist switching (max score ~1500)
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showTriggerLine}
                onChange={(e) => setShowTriggerLine(e.target.checked)}
                className="w-4 h-4 accent-red-500"
              />
              <span className="text-xs text-zinc-500">Show Trigger Line</span>
            </label>
          </div>
        </div>

        <div className="p-4 border-b border-zinc-200">
          <h2 className="text-xs text-zinc-500 mb-2 mt-0">Navigation</h2>
          <div className="flex flex-wrap gap-1">
            {ids.map((id) => (
              <button
                key={id}
                onClick={() => handleScrollTo(id)}
                className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                  active === id
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-200 hover:bg-zinc-300 text-zinc-700"
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-b border-zinc-200">
          <h2 className="text-xs text-zinc-500 mb-2 mt-0">State</h2>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-white border border-zinc-200 p-2 rounded">
              <span className="text-zinc-500">active:</span>{" "}
              <span className="text-blue-600 font-semibold">{active ?? "null"}</span>
            </div>
            <div className="bg-white border border-zinc-200 p-2 rounded">
              <span className="text-zinc-500">index:</span>{" "}
              <span className="text-green-600 font-semibold">{index}</span>
            </div>
            <div className="bg-white border border-zinc-200 p-2 rounded">
              <span className="text-zinc-500">progress:</span>{" "}
              <span className="text-amber-600 font-semibold">{progress.toFixed(3)}</span>
            </div>
            <div className="bg-white border border-zinc-200 p-2 rounded">
              <span className="text-zinc-500">direction:</span>{" "}
              <span className="text-purple-600 font-semibold">{direction ?? "null"}</span>
            </div>
            <div className="bg-white border border-zinc-200 p-2 rounded col-span-2">
              <span className="text-zinc-500">scrolling:</span>{" "}
              <span className={`font-semibold ${scroll.scrolling ? "text-green-600" : "text-red-600"}`}>
                {scroll.scrolling.toString()}
              </span>
            </div>
          </div>
        </div>

        <div className="min-h-48 flex flex-col">
          <div className="p-4 pb-2 flex items-center justify-between">
            <h2 className="text-xs text-zinc-500 mt-0">Event Logs</h2>
            <div className="flex gap-2">
              <button
                onClick={copyLogs}
                className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                Copy
              </button>
              <button
                onClick={clearLogs}
                className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto px-4 pb-4">
            <div className="space-y-1 font-mono text-xs">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-zinc-400 shrink-0">{log.time}</span>
                  <span className={logTypeColors[log.type]}>{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && (
                <span className="text-zinc-400">No events yet...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-white relative"
      >
        {sectionIds.map((id, i) => {
          const sectionState = sections[id];
          const isActive = active === id;

          const heightClass = sectionHeight === "full"
            ? "min-h-screen"
            : sectionHeight === "half"
              ? "min-h-[50vh]"
              : "min-h-[33vh]";

          return (
            <section
              key={id}
              {...(mode === "ids" ? register(id) : {})}
              data-playground-section={mode === "selector" ? id : undefined}
              id={mode === "selector" ? id : undefined}
              className={`${heightClass} flex items-center justify-center relative`}
              style={{ backgroundColor: `${getColor(i)}10` }}
            >
              <div className="text-center">
                <div
                  className="text-8xl font-bold mb-4 transition-transform"
                  style={{
                    color: getColor(i),
                    transform: isActive ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  {i + 1}
                </div>
                <div className="text-2xl font-semibold mb-2 text-zinc-800">{id}</div>
                {sectionState && (
                  <div className="text-sm text-zinc-500 font-mono space-y-1">
                    <div>
                      visibility:{" "}
                      <span className="text-zinc-800 font-semibold">
                        {(sectionState.visibility * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      progress:{" "}
                      <span className="text-zinc-800 font-semibold">
                        {(sectionState.progress * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      inView:{" "}
                      <span
                        className={`font-semibold ${
                          sectionState.inView ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {sectionState.inView.toString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {isActive && (
                <div
                  className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: getColor(i) }}
                >
                  Active
                </div>
              )}
              <button
                {...link(id)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/5 hover:bg-black/10 rounded-lg text-sm text-zinc-700 transition-colors"
              >
                {`scrollTo("${id}")`}
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}
