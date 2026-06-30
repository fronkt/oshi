"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, DepthOfField } from "@react-three/postprocessing";
import * as THREE from "three";

type Progress = { current: number };

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

function Bonsai({ progress }: { progress: Progress }) {
  const group = useRef<THREE.Group>(null);
  const mount = useRef(0);

  const { trunkGeo, branchGeos } = useMemo(() => {
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.05, 0),
      new THREE.Vector3(0.14, 0.5, 0.05),
      new THREE.Vector3(-0.12, 1.0, -0.05),
      new THREE.Vector3(0.2, 1.45, 0.06),
    ]);
    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 64, 0.12, 14, false);

    const branchDefs: number[][][] = [
      [[0.0, 0.9, 0], [0.5, 1.05, 0.2], [0.9, 1.16, 0.26]],
      [[0.0, 1.1, 0], [-0.45, 1.26, -0.1], [-0.85, 1.32, -0.16]],
      [[0.12, 1.3, 0], [0.36, 1.5, 0.15], [0.58, 1.64, 0.22]],
    ];
    const branchGeos = branchDefs.map((pts) => {
      const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
      return new THREE.TubeGeometry(c, 32, 0.05, 10, false);
    });
    return { trunkGeo, branchGeos };
  }, []);

  const pads = useMemo(
    () => [
      { p: [0.95, 1.2, 0.26] as const, s: 0.58 },
      { p: [-0.9, 1.36, -0.16] as const, s: 0.52 },
      { p: [0.62, 1.74, 0.2] as const, s: 0.46 },
      { p: [0.22, 1.66, -0.2] as const, s: 0.44 },
      { p: [-0.22, 1.52, 0.32] as const, s: 0.42 },
    ],
    [],
  );

  const barkMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2a2018", roughness: 0.95, metalness: 0 }),
    [],
  );
  const leafMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#3f7a55", roughness: 0.5, metalness: 0 }),
    [],
  );
  const potMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#14141b", roughness: 0.55, metalness: 0.2 }),
    [],
  );
  const soilMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#0c0c11", roughness: 1 }),
    [],
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    mount.current = Math.min(1, mount.current + delta * 0.7);
    const m = easeOutCubic(mount.current);
    const t = state.clock.elapsedTime;
    group.current.rotation.y = t * 0.1 + progress.current * Math.PI * 1.4;
    group.current.position.y = -0.55;
    group.current.scale.setScalar(0.9 + 0.1 * m);
  });

  return (
    <group ref={group}>
      <mesh material={potMat} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.85, 0.62, 0.45, 48]} />
      </mesh>
      <mesh material={soilMat} position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.06, 48]} />
      </mesh>

      <mesh geometry={trunkGeo} material={barkMat} position={[0, 0.45, 0]} />
      {branchGeos.map((g, i) => (
        <mesh key={i} geometry={g} material={barkMat} position={[0, 0.45, 0]} />
      ))}

      {pads.map((pad, i) => (
        <mesh
          key={i}
          material={leafMat}
          position={[pad.p[0], pad.p[1] + 0.45, pad.p[2]]}
          scale={[pad.s, pad.s * 0.62, pad.s]}
        >
          <icosahedronGeometry args={[1, 2]} />
        </mesh>
      ))}
    </group>
  );
}

export function BonsaiScene({ progress }: { progress: Progress }) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 0.4, 5.2], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 4]} intensity={2.1} color="#fff3e6" />
      <directionalLight position={[-5, 2, 1]} intensity={2.4} color="#ff2e74" />
      <pointLight position={[0, 1.6, 3]} intensity={6} color="#ff7aa6" distance={9} />

      <Bonsai progress={progress} />

      <ContactShadows position={[0, -0.42, 0]} opacity={0.55} scale={6} blur={2.6} far={3} color="#000000" />

      <Environment resolution={256}>
        <Lightformer intensity={2} position={[0, 4, -2]} scale={[6, 4, 1]} color="#ffffff" />
        <Lightformer intensity={1.5} position={[-4, 1, 2]} scale={[3, 3, 1]} color="#ff5e94" />
        <Lightformer intensity={1} position={[4, 2, 2]} scale={[3, 3, 1]} color="#88aaff" />
      </Environment>

      <EffectComposer>
        <DepthOfField focusDistance={0.008} focalLength={0.03} bokehScale={1.6} height={460} />
        <Bloom luminanceThreshold={0.62} luminanceSmoothing={0.3} intensity={0.7} mipmapBlur />
        <Vignette offset={0.26} darkness={0.72} eskil={false} />
      </EffectComposer>
    </Canvas>
  );
}
