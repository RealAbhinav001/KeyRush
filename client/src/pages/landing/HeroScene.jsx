import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles, Trail } from "@react-three/drei";
import * as THREE from "three";

// The track is a closed loop. The road surface is painted with code,
// so the cars literally drive on the passage they are typing.
const TRACK_POINTS = [
  [0, 0, 0],
  [14, 0.6, -6],
  [24, 1.4, -22],
  [16, 2.2, -38],
  [-2, 1.6, -44],
  [-18, 0.8, -34],
  [-24, 0.2, -16],
  [-14, -0.2, -2],
];

const ROAD_WIDTH = 4.2;

const CODE_LINES = [
  "const lap = await race.start(room);",
  "for (const key of passage) {",
  "  if (key === typed) car.advance();",
  "  else car.penalty(120);",
  "}",
  "socket.emit('progress', { wpm, accuracy });",
  "export const ghost = replay(bestRun);",
  "if (finished) leaderboard.add(driver);",
  "const delta = you.time - ghost.time;",
  "while (!lightsOut) await tick();",
];

const makeRoadTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#131726";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = "500 26px 'JetBrains Mono', Consolas, monospace";
  ctx.textBaseline = "top";
  CODE_LINES.forEach((line, i) => {
    const y = 40 + i * 98;
    ctx.fillStyle = i % 3 === 0 ? "rgba(139, 92, 246, 0.55)" : "rgba(160, 172, 200, 0.32)";
    ctx.fillText(line, 46, y);
  });

  // Track edges: kerb stripes on both sides.
  for (let y = 0; y < canvas.height; y += 64) {
    ctx.fillStyle = (y / 64) % 2 === 0 ? "#e0352b" : "#f2f4f8";
    ctx.fillRect(0, y, 16, 64);
    ctx.fillRect(canvas.width - 16, y, 16, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const buildRoad = (curve) => {
  const segments = 600;
  const positions = [];
  const uvs = [];
  const indices = [];
  const up = new THREE.Vector3(0, 1, 0);
  const length = curve.getLength();

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const side = new THREE.Vector3().crossVectors(tangent, up).normalize();
    const left = point.clone().addScaledVector(side, -ROAD_WIDTH / 2);
    const right = point.clone().addScaledVector(side, ROAD_WIDTH / 2);
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    const v = (t * length) / 9;
    uvs.push(0, v, 1, v);
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};

// Everything moves on one shared clock, so the cars stay in front of the
// camera and keep trading places instead of drifting apart.
const BASE_SPEED = 0.018;

const Car = ({ curve, offset, swing, phase, lane, color, ghost = false }) => {
  const ref = useRef();
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const t = (((time * BASE_SPEED + offset + Math.sin(time * 0.35 + phase) * swing) % 1) + 1) % 1;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const side = new THREE.Vector3().crossVectors(tangent, up).normalize();
    point.addScaledVector(side, lane).y += 0.18;
    ref.current.position.copy(point);
    ref.current.lookAt(point.clone().add(tangent));
  });

  return (
    <Trail width={0.9} length={9} color={color} attenuation={(w) => w * w}>
      <mesh ref={ref}>
        <boxGeometry args={[0.46, 0.2, 1.05]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={ghost ? 0.6 : 1.6}
          transparent={ghost}
          opacity={ghost ? 0.45 : 1}
        />
      </mesh>
    </Trail>
  );
};

const ChaseCamera = ({ curve }) => {
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera, pointer, clock }) => {
    const t = (clock.elapsedTime * BASE_SPEED) % 1;
    const eye = curve.getPointAt(t);
    const look = curve.getPointAt((t + 0.06) % 1);
    eye.y += 2.6 + pointer.y * 0.6;
    eye.x += pointer.x * 1.2;
    camera.position.lerp(eye, 0.1);
    target.lerp(look, 0.1);
    camera.lookAt(target);
  });

  return null;
};

const Track = () => {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        TRACK_POINTS.map((p) => new THREE.Vector3(...p)),
        true,
        "catmullrom",
        0.4,
      ),
    [],
  );
  const road = useMemo(() => buildRoad(curve), [curve]);
  const texture = useMemo(() => makeRoadTexture(), []);

  return (
    <>
      <mesh geometry={road} receiveShadow>
        <meshStandardMaterial map={texture} roughness={0.85} metalness={0.1} />
      </mesh>
      <Car curve={curve} offset={0.062} swing={0.008} phase={0} lane={-1} color="#8b5cf6" />
      <Car curve={curve} offset={0.055} swing={0.009} phase={2.1} lane={0.95} color="#22c55e" />
      <Car curve={curve} offset={0.047} swing={0.006} phase={4.2} lane={0} color="#c9d1e3" ghost />
      <ChaseCamera curve={curve} />
    </>
  );
};

const HeroScene = ({ running }) => {
  return (
    <Canvas
      className="kr3-canvas"
      frameloop={running ? "always" : "never"}
      resize={{ scroll: false, debounce: 0 }}
      dpr={[1, 1.75]}
      camera={{ fov: 55, near: 0.1, far: 120, position: [0, 4, 6] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#0b0d14"]} />
      <fog attach="fog" args={["#0b0d14", 12, 52]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[10, 18, 6]} intensity={1.1} color="#c7d2fe" />
      <pointLight position={[0, 6, -20]} intensity={60} distance={40} color="#8b5cf6" />
      <Track />
      <Sparkles
        count={140}
        scale={[60, 12, 60]}
        position={[0, 4, -20]}
        size={2.2}
        speed={0.3}
        color="#a5b4fc"
        opacity={0.55}
      />
    </Canvas>
  );
};

export default HeroScene;
