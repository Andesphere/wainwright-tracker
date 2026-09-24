import {
  useEffect,
  useLayoutEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

export type Detent = { id: string; height: number };

type Drag = {
  pointerId: number;
  startY: number;
  startHeight: number;
  dragging: boolean;
  history: { y: number; t: number }[];
};

/** Apple's projection: where a flick would come to rest (Designing Fluid Interfaces, WWDC 2018). */
const project = (velocity: number, rate = 0.998) =>
  ((velocity / 1000) * rate) / (1 - rate);

const rubberband = (overshoot: number, dimension: number) =>
  (overshoot * dimension * 0.55) / (dimension + 0.55 * Math.abs(overshoot));

/**
 * The persistent Apple Maps style sheet for phones. It tracks the finger 1:1, projects a flick
 * to the nearest detent and settles with a spring. Only the largest detent scrolls its content.
 */
export function BottomSheet({
  children,
  detent,
  detents,
  header,
  label,
  onDetent,
}: {
  children: ReactNode;
  detent: string;
  detents: Detent[];
  header?: ReactNode;
  label: string;
  onDetent: (id: string) => void;
}) {
  const sheet = useRef<HTMLDivElement | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);
  const height = useRef(0);
  const frame = useRef(0);
  const drag = useRef<Drag | null>(null);
  const releaseVelocity = useRef(0);
  const suppressClick = useRef(false);

  const sorted = [...detents].sort((a, b) => a.height - b.height);
  const smallest = sorted[0]?.height ?? 0;
  const largest = sorted.at(-1)?.height ?? 0;
  const target = detents.find((item) => item.id === detent) ?? sorted[0];
  const isLargest = target?.id === sorted.at(-1)?.id;

  const apply = (value: number) => {
    height.current = value;
    if (sheet.current) {
      sheet.current.style.transform = `translate3d(0, ${largest - value}px, 0)`;
    }
  };

  const springTo = (to: number, velocity: number, damping: number) => {
    cancelAnimationFrame(frame.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(to);
      return;
    }
    const response = 0.36;
    const stiffness = ((2 * Math.PI) / response) ** 2;
    const friction = (4 * Math.PI * damping) / response;
    let x = height.current;
    let v = velocity;
    let last = performance.now();
    const step = (now: number) => {
      // Integrate the real elapsed time in small fixed steps, so dropped frames catch up.
      const elapsed = Math.min(0.1, (now - last) / 1000);
      last = now;
      const steps = Math.max(1, Math.ceil(elapsed / 0.004));
      const dt = elapsed / steps;
      for (let i = 0; i < steps; i += 1) {
        v += (-stiffness * (x - to) - friction * v) * dt;
        x += v * dt;
      }
      if (Math.abs(x - to) < 0.4 && Math.abs(v) < 10) {
        apply(to);
        return;
      }
      apply(x);
      frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };

  // First paint at the detent, then spring whenever the detent or the viewport changes.
  const placed = useRef(false);
  useLayoutEffect(() => {
    if (!target) return;
    if (!placed.current) {
      placed.current = true;
      apply(target.height);
      return;
    }
    const velocity = releaseVelocity.current;
    releaseVelocity.current = 0;
    springTo(target.height, velocity, velocity === 0 ? 1 : 0.82);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.id, target?.height, largest]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    drag.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: height.current,
      dragging: false,
      history: [{ y: event.clientY, t: event.timeStamp }],
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dy = event.clientY - current.startY;
    if (!current.dragging) {
      if (Math.abs(dy) < 8) return;
      const list = scroller.current;
      const inList = list?.contains(event.target as Node) ?? false;
      // In the largest detent the list scrolls; the sheet moves only when pulled down from the top.
      if (isLargest && inList && list && !(list.scrollTop <= 0 && dy > 0)) {
        drag.current = null;
        return;
      }
      current.dragging = true;
      current.startY = event.clientY;
      current.startHeight = height.current;
      cancelAnimationFrame(frame.current);
      sheet.current?.setPointerCapture(event.pointerId);
    }
    let next = current.startHeight - (event.clientY - current.startY);
    if (next > largest) next = largest + rubberband(next - largest, largest);
    if (next < smallest)
      next = smallest - rubberband(smallest - next, smallest);
    apply(next);
    current.history.push({ y: event.clientY, t: event.timeStamp });
    if (current.history.length > 6) current.history.shift();
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    drag.current = null;
    if (!current?.dragging || current.pointerId !== event.pointerId) return;
    suppressClick.current = true;
    const first = current.history[0];
    const last = current.history.at(-1)!;
    const elapsed = Math.max(1, last.t - first.t);
    // Upward is positive: the sheet grows.
    const velocity =
      last.t - first.t > 120 ? 0 : (-(last.y - first.y) / elapsed) * 1000;
    const projected = height.current + project(velocity);
    const nearest = sorted.reduce((best, item) =>
      Math.abs(item.height - projected) < Math.abs(best.height - projected)
        ? item
        : best,
    );
    if (nearest.id === target?.id) {
      springTo(nearest.height, velocity, 0.82);
    } else {
      releaseVelocity.current = velocity;
      onDetent(nearest.id);
    }
  };

  const cycle = () => {
    const index = sorted.findIndex((item) => item.id === target?.id);
    const next = index >= sorted.length - 1 ? sorted[0] : sorted[index + 1];
    if (next) onDetent(next.id);
  };

  return (
    <div
      ref={sheet}
      className="wb-sheet wb-glass"
      style={{ height: largest }}
      data-scrollable={isLargest}
      role="region"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current = null)}
      onClickCapture={(event) => {
        if (!suppressClick.current) return;
        suppressClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <button
        type="button"
        className="wb-grabber"
        onClick={cycle}
        aria-label={isLargest ? "Collapse sheet" : "Expand sheet"}
      />
      {header}
      <div ref={scroller} className="wb-sheet-scroll">
        {children}
      </div>
    </div>
  );
}
