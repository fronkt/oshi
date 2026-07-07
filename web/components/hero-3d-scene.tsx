"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Image as Cover, useProgress } from "@react-three/drei";
import { damp, damp3, dampC } from "maath/easing";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ANIME_COVERS, type AnimeCover } from "@/lib/anime";

/**
 * Hero cover wall, for real this time: AniList covers as textured planes in
 * 2–3 depth layers on a gentle cylindrical arc. Columns drift like the CSS
 * wall did, plus: pointer parallax, a cursor force-field that shoves covers
 * aside (they spring back), inertial drag-pan with rubber-band edges, click
 * to focus a cover (flies to camera, un-mutes), and a scroll-out dolly where
 * the layers scatter apart. Desktop gets everything; `coarse` trims to two
 * layers, no force-field (no cursor), touch drag + tap still live.
 */

const W = 1.9; // cover width (world units), 2:3 aspect
const H = 2.85;
const GAP = 0.3;
const ARC = 0.045; // cylinder curvature: rotY & z drop per world-x
const LAYER_Z = 3; // depth between layers
const FOCUS_WORLD = new THREE.Vector3(2.4, -0.45, 4.6);
// per-depth-layer muting so distance reads without true DoF (cheap fake fog)
const LAYER_TINT = ["#c9c9d4", "#8d8d9a", "#62626e"];
const LAYER_OPACITY = [0.97, 0.8, 0.62];

type Slot = {
  anime: AnimeCover;
  layer: number;
  baseX: number;
  baseY: number;
  colH: number;
  speed: number; // world units / s (signed)
  ref: React.RefObject<THREE.Mesh | null>;
};

function buildSlots(coarse: boolean): Slot[] {
  // deeper layers get more columns/rows, spread wider by the perspective ratio,
  // so every layer reads as a continuous wall at its depth (not confetti)
  const layerCols = coarse ? [3, 4] : [4, 5, 6];
  const layerRows = coarse ? [4, 5] : [4, 5, 5];
  const covers = coarse ? ANIME_COVERS.slice(0, 18) : ANIME_COVERS;
  const slots: Slot[] = [];
  let k = 0;
  for (let l = 0; l < layerCols.length; l++) {
    // partial perspective compensation: deeper layers spread wider, but not so
    // wide that their far columns sit beyond what drag-panning can reveal
    const spread = 1 + ((l * LAYER_Z) / 9) * 0.55;
    const rows = layerRows[l];
    for (let c = 0; c < layerCols[l]; c++) {
      const colH = rows * (H + GAP);
      const speed = (0.09 + 0.035 * ((c + l) % 3)) * (c % 2 ? 1 : -1);
      // half-column brick offset per layer so gaps never align across depths
      const x = (0.6 + c * (W + GAP) + (l % 2) * (W + GAP) * 0.5 - l * 0.4) * spread;
      for (let r = 0; r < rows; r++) {
        slots.push({
          anime: covers[k++ % covers.length],
          layer: l,
          baseX: x,
          baseY: (r + (c % 2) * 0.5) * (H + GAP) - colH / 2,
          colH,
          speed,
          ref: { current: null },
        });
      }
    }
  }
  return slots;
}

function Wall({
  coarse,
  onFocus,
  progressRef,
  dismissRef,
  missedRef,
}: {
  coarse: boolean;
  onFocus: (a: AnimeCover | null) => void;
  progressRef: React.MutableRefObject<number>;
  dismissRef: React.MutableRefObject<(() => void) | null>;
  missedRef: React.MutableRefObject<(() => void) | null>;
}) {
  const slots = useMemo(() => buildSlots(coarse), [coarse]);
  const rig = useRef<THREE.Group>(null); // parallax rotation
  const pan = useRef<THREE.Group>(null); // drag pan x
  const layerRefs = useRef<(THREE.Group | null)[]>([]);
  const { camera, gl, size, viewport } = useThree();

  const state = useRef({
    t: 0,
    panX: 0,
    panV: 0,
    dragging: false,
    dragStartX: 0,
    dragStartPan: 0,
    dragDist: 0,
    hovered: -1,
    focused: -1,
    pointer: new THREE.Vector2(0, 0), // NDC
    force: slots.map(() => new THREE.Vector3()),
    driftPause: 0,
  });

  // focus handling exposed to click handlers
  const setFocus = (i: number) => {
    const s = state.current;
    s.focused = s.focused === i ? -1 : i;
    onFocus(s.focused >= 0 ? slots[s.focused].anime : null);
  };

  // let the DOM layer (Esc key, caption close button) and canvas click-away
  // clear focus; a drag that ends on empty space must NOT count as a click-away
  useEffect(() => {
    dismissRef.current = () => setFocus(-1);
    missedRef.current = () => {
      if (state.current.dragDist <= 8) setFocus(-1);
    };
  });

  // drag-pan + pointer tracking on the raw canvas element
  useEffect(() => {
    const el = gl.domElement;
    const s = state.current;
    const worldPerPx = () => viewport.width / size.width;

    const down = (e: PointerEvent) => {
      s.dragging = true;
      s.dragDist = 0;
      s.dragStartX = e.clientX;
      s.dragStartPan = s.panX;
      s.panV = 0;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      s.pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1,
      );
      if (!s.dragging) return;
      const dx = e.clientX - s.dragStartX;
      s.dragDist = Math.max(s.dragDist, Math.abs(dx));
      const prev = s.panX;
      let next = s.dragStartPan + dx * worldPerPx() * 1.15;
      // rubber-band resistance past the ends
      const MIN = -5.2,
        MAX = 1.6;
      if (next < MIN) next = MIN + (next - MIN) * 0.3;
      if (next > MAX) next = MAX + (next - MAX) * 0.3;
      s.panV = (next - prev) * 60; // approx per-second velocity
      s.panX = next;
    };
    const up = () => {
      s.dragging = false;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [gl, size, viewport]);

  const pointerWorld = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const tmpLocal = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const s = state.current;
    const p = progressRef.current; // scroll progress 0..1 over the hero
    if (p > 0.985) return; // hero is gone — skip all work
    s.t += dt;

    // scroll choreography: dolly back + slight lift
    camera.position.z = 9 + p * 7;
    camera.position.y = p * 1.2;

    // release focus once the visitor scrolls away
    if (p > 0.25 && s.focused >= 0) setFocus(-1);

    // pointer parallax (skip on touch — no cursor)
    if (rig.current && !coarse) {
      damp(rig.current.rotation, "y", s.pointer.x * 0.055, 0.6, dt);
      damp(rig.current.rotation, "x", -s.pointer.y * 0.035, 0.6, dt);
    }

    // drag inertia + rubber-band spring-back
    if (pan.current) {
      if (!s.dragging) {
        s.panX += s.panV * dt;
        s.panV *= Math.exp(-3.2 * dt); // exponential decay
        const MIN = -5.2,
          MAX = 1.6;
        const clamped = THREE.MathUtils.clamp(s.panX, MIN, MAX);
        if (clamped !== s.panX) {
          s.panX = THREE.MathUtils.damp(s.panX, clamped, 6, dt);
          s.panV = 0;
        } else if (Math.abs(s.panV) < 0.05) {
          // idle: glide home over ~8s so the composed hero always returns
          s.panX = THREE.MathUtils.damp(s.panX, 0, 0.35, dt);
        }
      }
      pan.current.position.x = s.panX;
    }

    // layer scatter on scroll-out
    layerRefs.current.forEach((g, i) => {
      if (g) g.position.z = -LAYER_Z * i - p * (i + 1) * 1.6;
    });

    // cursor force-field point, unprojected onto the wall (z≈0 of pan space)
    if (!coarse) {
      pointerWorld
        .set(s.pointer.x, s.pointer.y, 0.5)
        .unproject(camera)
        .sub(camera.position)
        .normalize();
      const dist = -camera.position.z / pointerWorld.z || 0;
      pointerWorld.multiplyScalar(dist).add(camera.position);
    }

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const mesh = slot.ref.current;
      if (!mesh) continue;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const focused = s.focused === i;

      if (focused) {
        // fly to camera: express the fixed world target in this mesh's parent space
        const parent = mesh.parent!;
        tmpLocal.copy(FOCUS_WORLD);
        parent.worldToLocal(tmpLocal);
        damp3(mesh.position, tmpLocal, 0.28, dt);
        damp3(mesh.scale, [W * 1.18, H * 1.18, 1], 0.28, dt);
        damp(mesh.rotation, "y", -0.08, 0.3, dt);
        dampC(mat.color, "#ffffff", 0.25, dt);
        damp(mat, "opacity", 1, 0.25, dt);
        mesh.renderOrder = 10;
        continue;
      }
      mesh.renderOrder = 0;

      // column drift with seamless wrap
      const drift = slot.baseY + s.t * slot.speed;
      const wrapped =
        ((((drift + slot.colH / 2) % slot.colH) + slot.colH) % slot.colH) -
        slot.colH / 2;

      // force-field shove (desktop only)
      const force = s.force[i];
      if (!coarse) {
        mesh.getWorldPosition(tmp);
        const dx = tmp.x - pointerWorld.x;
        const dy = tmp.y - pointerWorld.y;
        const d = Math.hypot(dx, dy);
        const R = 2.3;
        if (d < R && d > 0.001) {
          const push = ((R - d) / R) * 1.1;
          damp3(force, [(dx / d) * push, (dy / d) * push, push * 0.35], 0.12, dt);
        } else {
          damp3(force, [0, 0, 0], 0.3, dt);
        }
      }

      const arcZ = -slot.baseX * slot.baseX * ARC * 0.18;
      damp3(
        mesh.position,
        [slot.baseX + force.x, wrapped + force.y, arcZ + force.z],
        0.12,
        dt,
      );
      damp3(
        mesh.scale,
        s.hovered === i ? [W * 1.06, H * 1.06, 1] : [W, H, 1],
        0.2,
        dt,
      );
      mesh.rotation.y = -slot.baseX * ARC + force.x * 0.06;
      mesh.rotation.z = force.x * 0.02;

      const dimmed = s.focused >= 0;
      dampC(
        mat.color,
        s.hovered === i ? "#ffffff" : LAYER_TINT[slot.layer],
        0.25,
        dt,
      );
      damp(
        mat,
        "opacity",
        (dimmed ? 0.4 : 1) * LAYER_OPACITY[slot.layer],
        0.25,
        dt,
      );
    }
  });

  const layers = coarse ? 2 : 3;
  return (
    <group ref={rig}>
      <group ref={pan}>
        {Array.from({ length: layers }, (_, l) => (
          <group
            key={l}
            ref={(g) => {
              layerRefs.current[l] = g;
            }}
          >
            {slots
              .map((slot, i) => ({ slot, i }))
              .filter(({ slot }) => slot.layer === l)
              .map(({ slot, i }) => (
                <Cover
                  key={i}
                  ref={slot.ref as React.RefObject<never>}
                  url={slot.anime.cover}
                  scale={[W, H]}
                  radius={0.11}
                  transparent
                  toneMapped={false}
                  color={LAYER_TINT[slot.layer]}
                  opacity={0}
                  position={[slot.baseX, slot.baseY, 0]}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    state.current.hovered = i;
                    document.body.style.cursor = "pointer";
                  }}
                  onPointerOut={() => {
                    state.current.hovered = -1;
                    document.body.style.cursor = "";
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (state.current.dragDist > 8) return; // that was a drag
                    setFocus(i);
                  }}
                />
              ))}
          </group>
        ))}
      </group>
    </group>
  );
}

/** Reports texture-loading progress up so the CSS wall can cross-fade out. */
function ReadyProbe({ onReady }: { onReady: () => void }) {
  const { progress } = useProgress();
  const fired = useRef(false);
  useEffect(() => {
    if (!fired.current && progress > 55) {
      fired.current = true;
      onReady();
    }
  }, [progress, onReady]);
  return null;
}

export default function Hero3DScene({
  coarse,
  onFocus,
  onReady,
  dismissRef,
}: {
  coarse: boolean;
  onFocus: (a: AnimeCover | null) => void;
  onReady: () => void;
  dismissRef: React.MutableRefObject<(() => void) | null>;
}) {
  const progressRef = useRef(0);
  const missedRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: "#top",
      start: "top top",
      end: "bottom top",
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });
    return () => st.kill();
  }, []);

  return (
    <Canvas
      flat
      dpr={[1, coarse ? 1.5 : 2]}
      camera={{ fov: 50, position: [0, 0, 9] }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }} // vertical page scroll stays native on touch
      onPointerMissed={() => missedRef.current?.()}
      aria-hidden
    >
      <Suspense fallback={null}>
        <Wall
          coarse={coarse}
          onFocus={onFocus}
          progressRef={progressRef}
          dismissRef={dismissRef}
          missedRef={missedRef}
        />
        <ReadyProbe onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
