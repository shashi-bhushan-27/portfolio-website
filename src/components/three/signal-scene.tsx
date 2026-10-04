'use client';

/* eslint-disable react-hooks/immutability --
   three.js objects (camera, geometries, refs) are mutated inside R3F's frame
   loop, outside React rendering. That is how react-three-fiber animates. */

/*
 * Signal field — a small, literal model of the indoor-positioning work:
 * a translucent floor plan, BLE beacons broadcasting, and a device whose
 * *estimated* position (with its ~1.6 m error envelope) is re-solved from
 * beacon signal strength as it walks a route through the building.
 *
 * Units are metres. The plan spans x ∈ [-10, 10], z ∈ [-6, 6].
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type Palette = {
  dark: boolean;
  fg: string;
  signal: string;
  bg: string;
};

export type Telemetry = { x: number; z: number; beacons: number; heading: number };

/** Mutable pointer position in [-1, 1], written by the host component. */
export type PointerRef = { current: { x: number; y: number } };

const WALL_H = 0.9;
const WALL_T = 0.07;
const SIGNAL_RANGE = 9.5;
const LOOP_SECONDS = 34;
const TRAIL = 90;
const ERROR_RADIUS = 1.6;

// Wall segments [x1, z1, x2, z2]. Gaps in the runs are doorways.
const WALLS: [number, number, number, number][] = [
  // shell
  [-10, -6, 10, -6],
  [10, -6, 10, 6],
  [10, 6, -10, 6],
  [-10, 6, -10, -6],
  // corridor, north side
  [-10, 1, -8.2, 1],
  [-6.8, 1, -2.4, 1],
  [-1.2, 1, 1.2, 1],
  [2.4, 1, 6.1, 1],
  [7.5, 1, 8.2, 1],
  [9.5, 1, 10, 1],
  // corridor, south side
  [-10, -1, -8.0, -1],
  [-6.4, -1, -3.6, -1],
  [-2.4, -1, 7.1, -1],
  [8.5, -1, 10, -1],
  // partitions
  [-4, 1, -4, 6],
  [4, 1, 4, 6],
  [-1, -1, -1, -6],
  [5, -1, 5, -6],
  [5, -3.6, 10, -3.6],
];

const BEACONS: [number, number][] = [
  [-7.4, 3.8],
  [-2.6, 4.9],
  [9.1, 5.1],
  [-8.7, -4.9],
  [2.2, -3.9],
  [7.6, -4.9],
];

// A walk through the building (closed loop): outbound along the south lane of
// the corridor through two rooms with two doors each, back along the north lane.
const ROUTE: [number, number][] = [
  [-7.6, 0.05],
  [-7.1, -2.3],
  [-5.2, -4.4],
  [-3.0, -2.3],
  [-2.7, -0.3],
  [-1.4, 2.3],
  [0.0, 4.3],
  [1.6, 2.3],
  [2.4, -0.2],
  [4.4, -0.3],
  [6.2, -0.1],
  [6.8, 2.3],
  [7.9, 4.5],
  [8.8, 2.3],
  [8.8, 0.45],
  [-8.0, 0.45],
];

function glowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ─── Static geometry: plate, grid, walls ─── */

function Building({ palette }: { palette: Palette }) {
  const { walls, wallEdges, plate, plateEdges, grid } = useMemo(() => {
    const boxes = WALLS.map(([x1, z1, x2, z2]) => {
      const len = Math.hypot(x2 - x1, z2 - z1) + WALL_T;
      const geo = new THREE.BoxGeometry(len, WALL_H, WALL_T);
      geo.rotateY(-Math.atan2(z2 - z1, x2 - x1));
      geo.translate((x1 + x2) / 2, WALL_H / 2, (z1 + z2) / 2);
      return geo;
    });
    const walls = mergeGeometries(boxes)!;
    boxes.forEach((b) => b.dispose());

    const plate = new THREE.BoxGeometry(21.2, 0.12, 13.2);
    plate.translate(0, -0.07, 0);

    const pts: number[] = [];
    for (let i = -18; i <= 18; i++) pts.push(i, -0.14, -13, i, -0.14, 13);
    for (let j = -13; j <= 13; j++) pts.push(-18, -0.14, j, 18, -0.14, j);
    const grid = new THREE.BufferGeometry();
    grid.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));

    return {
      walls,
      wallEdges: new THREE.EdgesGeometry(walls),
      plate,
      plateEdges: new THREE.EdgesGeometry(plate),
      grid,
    };
  }, []);

  useEffect(
    () => () => [walls, wallEdges, plate, plateEdges, grid].forEach((g) => g.dispose()),
    [walls, wallEdges, plate, plateEdges, grid]
  );

  const a = palette.dark ? 1 : 1.4;

  return (
    <group>
      <lineSegments geometry={grid}>
        <lineBasicMaterial color={palette.fg} transparent opacity={0.05 * a} />
      </lineSegments>
      <mesh geometry={plate}>
        <meshBasicMaterial color={palette.fg} transparent opacity={0.035 * a} depthWrite={false} />
      </mesh>
      <lineSegments geometry={plateEdges}>
        <lineBasicMaterial color={palette.fg} transparent opacity={0.22 * a} />
      </lineSegments>
      <mesh geometry={walls}>
        <meshBasicMaterial color={palette.fg} transparent opacity={0.07 * a} depthWrite={false} />
      </mesh>
      <lineSegments geometry={wallEdges}>
        <lineBasicMaterial color={palette.fg} transparent opacity={0.32 * a} />
      </lineSegments>
    </group>
  );
}

/* ─── Beacons with expanding wavefronts ─── */

const RING_GEO = new THREE.RingGeometry(0.965, 1, 72);
const RINGS_PER_BEACON = 3;
const PULSE_SECONDS = 3.6;

function Beacon({
  x,
  z,
  phase,
  palette,
  glow,
}: {
  x: number;
  z: number;
  phase: number;
  palette: Palette;
  glow: THREE.Texture;
}) {
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const stick = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 1.15, 0], 3));
    return g;
  }, []);

  useEffect(() => () => stick.dispose(), [stick]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime / PULSE_SECONDS + phase;
    rings.current.forEach((ring, i) => {
      if (!ring) return;
      const p = (t + i / RINGS_PER_BEACON) % 1;
      const s = 0.25 + p * 5.2;
      ring.scale.setScalar(s);
      (ring.material as THREE.MeshBasicMaterial).opacity = (1 - p) ** 2.2 * (palette.dark ? 0.5 : 0.6);
    });
  });

  return (
    <group position={[x, 0, z]}>
      <lineSegments geometry={stick}>
        <lineBasicMaterial color={palette.fg} transparent opacity={0.45} />
      </lineSegments>
      <mesh position={[0, 1.25, 0]}>
        <octahedronGeometry args={[0.13, 0]} />
        <meshBasicMaterial color={palette.fg} />
      </mesh>
      <sprite position={[0, 1.25, 0]} scale={0.9}>
        <spriteMaterial
          map={glow}
          color={palette.fg}
          transparent
          opacity={palette.dark ? 0.35 : 0.15}
          depthWrite={false}
          blending={palette.dark ? THREE.AdditiveBlending : THREE.NormalBlending}
        />
      </sprite>
      {Array.from({ length: RINGS_PER_BEACON }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            rings.current[i] = m;
          }}
          geometry={RING_GEO}
          rotation-x={-Math.PI / 2}
          position-y={0.015}
        >
          <meshBasicMaterial color={palette.fg} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── The tracked device ─── */

function Device({
  palette,
  glow,
  telemetry,
  startAt,
}: {
  palette: Palette;
  glow: THREE.Texture;
  telemetry: Telemetry;
  startAt: number;
}) {
  const progress = useRef(startAt);
  const lastSample = useRef(0);
  const dot = useRef<THREE.Group>(null);
  const envelope = useRef<THREE.Mesh>(null);

  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        ROUTE.map(([x, z]) => new THREE.Vector3(x, 0.04, z)),
        true,
        'centripetal'
      ),
    []
  );

  const { route, links, trail, trailPositions, trailColors } = useMemo(() => {
    const signal = new THREE.Color(palette.signal);

    const routeGeo = new THREE.BufferGeometry().setFromPoints(curve.getSpacedPoints(500));
    const route = new THREE.Line(
      routeGeo,
      new THREE.LineDashedMaterial({
        color: signal,
        dashSize: 0.22,
        gapSize: 0.26,
        transparent: true,
        opacity: palette.dark ? 0.35 : 0.55,
      })
    );
    route.computeLineDistances();

    const links = BEACONS.map(() => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
      return new THREE.Line(
        g,
        new THREE.LineBasicMaterial({ color: signal, transparent: true, opacity: 0 })
      );
    });

    const trailPositions = new Float32Array(TRAIL * 3);
    const trailColors = new Float32Array(TRAIL * 4);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 4));
    const trail = new THREE.Line(
      trailGeo,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false })
    );
    // Seed the trail at the start position so it doesn't streak from the origin.
    const start = curve.getPointAt(startAt);
    for (let i = 0; i < TRAIL; i++) {
      trailPositions.set([start.x, 0.05, start.z], i * 3);
      trailColors.set([signal.r, signal.g, signal.b, 0], i * 4);
    }

    return { route, links, trail, trailPositions, trailColors };
  }, [curve, palette, startAt]);

  useEffect(
    () => () => {
      [route, trail, ...links].forEach((l) => {
        l.geometry.dispose();
        (l.material as THREE.Material).dispose();
      });
    },
    [route, trail, links]
  );

  const truth = useMemo(() => new THREE.Vector3(), []);
  const ahead = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, delta) => {
    progress.current = (progress.current + Math.min(delta, 0.05) / LOOP_SECONDS) % 1;
    curve.getPointAt(progress.current, truth);
    curve.getPointAt((progress.current + 0.004) % 1, ahead);

    // The estimate wanders around the true position like a real RSSI solve.
    const t = clock.elapsedTime;
    const ex = truth.x + Math.sin(t * 1.9) * 0.16 + Math.sin(t * 0.57 + 1.3) * 0.28;
    const ez = truth.z + Math.cos(t * 1.4) * 0.14 + Math.sin(t * 0.73 + 2.1) * 0.24;

    dot.current?.position.set(ex, 0.05, ez);
    if (envelope.current) {
      envelope.current.position.set(ex, 0.03, ez);
      envelope.current.scale.setScalar(ERROR_RADIUS * (1 + Math.sin(t * 2.2) * 0.04));
    }

    let heard = 0;
    links.forEach((line, i) => {
      const [bx, bz] = BEACONS[i];
      const d = Math.hypot(bx - ex, bz - ez);
      const strength = Math.max(0, 1 - d / SIGNAL_RANGE);
      if (strength > 0) heard++;
      const pos = line.geometry.attributes.position as THREE.BufferAttribute;
      pos.setXYZ(0, bx, 1.25, bz);
      pos.setXYZ(1, ex, 0.06, ez);
      pos.needsUpdate = true;
      (line.material as THREE.LineBasicMaterial).opacity = strength ** 1.6 * (palette.dark ? 0.75 : 0.9);
    });

    if (t - lastSample.current > 0.045) {
      lastSample.current = t;
      trailPositions.copyWithin(3, 0, (TRAIL - 1) * 3);
      trailPositions.set([ex, 0.05, ez], 0);
      for (let i = 0; i < TRAIL; i++) trailColors[i * 4 + 3] = (1 - i / TRAIL) ** 1.5 * 0.9;
      trail.geometry.attributes.position.needsUpdate = true;
      trail.geometry.attributes.color.needsUpdate = true;
    }

    telemetry.x = ex + 10;
    telemetry.z = ez + 6;
    telemetry.beacons = heard;
    telemetry.heading = ((Math.atan2(ahead.x - truth.x, -(ahead.z - truth.z)) * 180) / Math.PI + 360) % 360;
  });

  return (
    <group>
      <primitive object={route} />
      <primitive object={trail} />
      {links.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
      <mesh ref={envelope} geometry={RING_GEO} rotation-x={-Math.PI / 2}>
        <meshBasicMaterial color={palette.signal} transparent opacity={palette.dark ? 0.55 : 0.8} depthWrite={false} />
      </mesh>
      <group ref={dot}>
        <mesh position-y={0.12}>
          <sphereGeometry args={[0.17, 20, 20]} />
          <meshBasicMaterial color={palette.signal} />
        </mesh>
        <sprite position-y={0.12} scale={palette.dark ? 2.4 : 1.4}>
          <spriteMaterial
            map={glow}
            color={palette.signal}
            transparent
            opacity={palette.dark ? 0.8 : 0.35}
            depthWrite={false}
            blending={palette.dark ? THREE.AdditiveBlending : THREE.NormalBlending}
          />
        </sprite>
      </group>
    </group>
  );
}

/* ─── Camera rig: frames the plan for the viewport, eases toward the pointer ─── */

const VIEW_DIR = new THREE.Vector3(0, 17, 15.5).normalize();
const PLAN_CORNERS = [-10.8, 10.8].flatMap((x) =>
  [-6.8, 6.8].flatMap((z) => [0, 1.4].map((y) => new THREE.Vector3(x, y, z)))
);

/** Distance along VIEW_DIR at which the whole plan projects inside ±`margin` NDC. */
function fitDistance(camera: THREE.PerspectiveCamera, target: THREE.Vector3, margin: number) {
  const probe = camera.clone();
  const v = new THREE.Vector3();
  let d = 26;
  for (let i = 0; i < 8; i++) {
    probe.position.copy(target).addScaledVector(VIEW_DIR, d);
    probe.lookAt(target);
    probe.updateMatrixWorld();
    let extent = 0;
    for (const c of PLAN_CORNERS) {
      v.copy(c).project(probe);
      extent = Math.max(extent, Math.abs(v.x), Math.abs(v.y));
    }
    d *= Math.pow(extent / margin, 0.9);
  }
  return d;
}

function Rig({
  pointer,
  animate,
  shift,
}: {
  pointer: PointerRef;
  animate: boolean;
  shift: number;
}) {
  const { camera, size, scene } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 0, 0.4), []);
  const base = useRef(new THREE.Vector3(0, 17, 15.5));
  const settled = useRef(false);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.aspect = size.width / size.height;
    // Slide the image sideways (without changing perspective) when text overlaps the left side.
    if (shift) cam.setViewOffset(size.width, size.height, -shift * size.width, 0, size.width, size.height);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
    const d = fitDistance(cam, target, 0.94);
    base.current.copy(target).addScaledVector(VIEW_DIR, d);
    // Fog starts just past the far edge of the plan so only the ground grid fades out.
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.near = d * 1.05;
      scene.fog.far = d * 1.9;
    }
    if (!settled.current) {
      camera.position.copy(base.current);
      camera.lookAt(target);
      settled.current = true;
    }
  }, [camera, scene, size.width, size.height, target, shift]);

  useFrame((_, delta) => {
    const px = animate ? pointer.current.x : 0;
    const py = animate ? pointer.current.y : 0;
    const k = animate ? 2.2 : 1000;
    const b = base.current;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, b.x + px * 2.4, k, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, b.y - py * 1.5, k, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, b.z, k, delta);
    camera.lookAt(target);
  });

  return null;
}

export function SignalScene({
  palette,
  telemetry,
  pointer,
  animate,
  shift = 0,
}: {
  palette: Palette;
  telemetry: Telemetry;
  pointer: PointerRef;
  animate: boolean;
  /** Fraction of the canvas width to slide the scene to the right. */
  shift?: number;
}) {
  const glow = useMemo(() => glowTexture(), []);
  const world = useRef<THREE.Group>(null);
  // One fog for the scene's lifetime: Rig fits its near/far to the camera distance, and
  // re-creating it on a theme change would reset that range and fog out the whole plan.
  const fog = useMemo(() => new THREE.Fog(palette.bg, 26, 48), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => glow.dispose(), [glow]);
  useEffect(() => {
    fog.color.set(palette.bg);
  }, [fog, palette.bg]);

  useFrame(({ clock }) => {
    if (world.current && animate) {
      world.current.rotation.y = Math.sin(clock.elapsedTime * 0.08) * 0.1 - 0.06;
    }
  });

  return (
    <>
      <primitive attach="fog" object={fog} />
      <Rig pointer={pointer} animate={animate} shift={shift} />
      <group ref={world} rotation-y={-0.06}>
        <Building palette={palette} />
        {BEACONS.map(([x, z], i) => (
          <Beacon key={i} x={x} z={z} phase={i * 0.37} palette={palette} glow={glow} />
        ))}
        <Device palette={palette} glow={glow} telemetry={telemetry} startAt={0.12} />
      </group>
    </>
  );
}
