import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { clamp } from "./voxel";
import { engine, track } from "./engine";
import { useUI } from "./store";
import { World } from "./World";
import { Player } from "./Player";
import { Podium } from "./Podium";
import { Backdrop } from "./Backdrop";
import { applyCurveToScene, curveUniforms, disableCurve, curveDisabled } from "./curve";

/**
 * Subway-Surfers style third-person chase camera:
 * behind and above the pigeon, looking slightly down the road, following the track heading.
 */
interface Framing {
  back: number; // distance behind the pigeon (along the road)
  up: number; // height above the road
  lookAhead: number; // how far ahead of the pigeon the camera aims
  lookUp: number; // aim height above the road
  fov: number;
  latFollow: number; // 0..1 how much the camera slides sideways with the lane
  orbit: number; // extra yaw around the pigeon (menu turntable view)
  roll: number; // Dutch action angle / camera tilt (rad)
  curveDown: number;
  curveSide: number;
  hazeNear: number;
  hazeFar: number;
}
const PLAY: Framing = { back: 8.4, up: 5.0, lookAhead: 13, lookUp: 0.38, fov: 60, latFollow: 0.55, orbit: 0, roll: 0, curveDown: 0.0018, curveSide: 0, hazeNear: 78, hazeFar: 160 };
const NOS_F: Framing = { back: 7.6, up: 4.6, lookAhead: 15, lookUp: 0.32, fov: 70, latFollow: 0.55, orbit: 0, roll: 0, curveDown: 0.0022, curveSide: 0, hazeNear: 78, hazeFar: 160 };
// Subway Surfers signature pre-game action angle: Low-Angle Dutch Hero Shot (sudut rendah miring dinamis)
const MENU: Framing = { back: 3.3, up: 0.86, lookAhead: 0.12, lookUp: 0.95, fov: 54, latFollow: 1, orbit: -0.78, roll: -0.095, curveDown: 0.0008, curveSide: 0.0003, hazeNear: 90, hazeFar: 175 };
const SKINS: Framing = { back: 7.6, up: 1.8, lookAhead: 0.15, lookUp: -0.5, fov: 42, latFollow: 1, orbit: -0.55, roll: 0, curveDown: 0.0, curveSide: 0, hazeNear: 90, hazeFar: 180 };
const TRICKS_F: Framing = { back: 9.8, up: 1.8, lookAhead: 0.15, lookUp: -1.4, fov: 42, latFollow: 1, orbit: -0.55, roll: 0, curveDown: 0.0, curveSide: 0, hazeNear: 90, hazeFar: 180 };
const CRASH: Framing = { back: 5.6, up: 3.6, lookAhead: 0, lookUp: 0.35, fov: 56, latFollow: 0.25, orbit: 0, roll: 0, curveDown: 0.0006, curveSide: 0, hazeNear: 85, hazeFar: 165 };

function CameraRig() {
  const { camera, size, scene } = useThree();
  const cur = useRef<Framing>({ ...MENU });
  const yaw = useRef(0);
  const camLat = useRef(0);
  const v = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      target: new THREE.Vector3(),
      fwd: new THREE.Vector3(),
      side: new THREE.Vector3(),
      base: new THREE.Vector3(),
    }),
    [],
  );
  const patchT = useRef(0);

  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    const step = Math.min(dt, 0.05);
    const phase = engine.phase;
    const view = useUI.getState().menuView;
    const des =
      phase === "menu" ? (view === "skins" ? SKINS : view === "tricks" ? TRICKS_F : MENU) : phase === "playing" ? (engine.nosT > 0 ? NOS_F : PLAY) : CRASH;
    // Faster action sweep during crash or intro
    const k = 1 - Math.exp(-step * (phase === "menu" ? 4.5 : engine.runTime < 1.0 ? 5.2 : phase === "crashed" || phase === "gameover" ? 6.5 : 3.2));
    const c = cur.current;
    for (const key of Object.keys(c) as (keyof Framing)[]) c[key] += (des[key] - c[key]) * k;

    // follow the road heading with a little look-ahead so curves read early
    const ahead = 4 + engine.speed * 0.3;
    const th = track.sample(engine.distance + ahead).th;
    yaw.current += (th - yaw.current) * (1 - Math.exp(-step * 3.5));
    const heading = yaw.current + c.orbit;
    v.fwd.set(Math.cos(heading), 0, Math.sin(heading));
    v.side.set(-Math.sin(heading), 0, Math.cos(heading));

    const p = engine.player;

    if (phase === "crashed" || phase === "gameover") {
      const b = p.body;
      const bodyS = b ? b.s : engine.distance;
      const camS = Math.max(0, bodyS - c.back);

      // Keep camera strictly in the central road corridor (lat between -1.1 and 1.1)
      // so it is always over the open asphalt and never behind buildings or sidewalk walls
      const bodyLat = b ? b.lat : 0;
      camLat.current += (bodyLat * c.latFollow - camLat.current) * (1 - Math.exp(-step * 6));
      const safeRoadLat = clamp(camLat.current, -1.1, 1.1);

      // Position camera above the road looking down at the pigeon
      track.frame(camS, safeRoadLat, c.up, v.pos);

      // Spotlight the pigeon: target locks dead-center onto the pigeon's 3D body position!
      v.target.set(p.wx, p.wy + 0.32, p.wz);
      v.base.set(p.wx, v.pos.y, p.wz);
    } else {
      // lateral follow: slide part of the way toward the pigeon's lane
      const lat = phase === "menu" ? 0 : p.lat;
      camLat.current += (lat * c.latFollow - camLat.current) * (1 - Math.exp(-step * 6));

      // base point: on the road under the pigeon
      const ctr = engine.center;
      v.base.set(ctr.x, ctr.y, ctr.z);

      const hFollow = phase === "playing" ? Math.max(0, p.h) * 0.25 : 0;
      // slope follow: the aim point sits on the road ahead, so on a descent the camera tilts down with the hill
      const gAhead = phase === "menu" ? 0 : track.sample(engine.distance + c.lookAhead).y - ctr.y;
      const gBack = phase === "menu" ? 0 : track.sample(Math.max(0, engine.distance - c.back)).y - ctr.y;

      v.pos.copy(v.base).addScaledVector(v.fwd, -c.back).addScaledVector(v.side, camLat.current);
      v.pos.y += c.up + hFollow + gBack * 0.6;

      // Subtle handheld action float while idling in menu
      if (phase === "menu" && view === "main") {
        v.pos.x += Math.sin(engine.time * 1.5) * 0.05;
        v.pos.y += Math.cos(engine.time * 2.0) * 0.035;
      }

      v.target.copy(v.base).addScaledVector(v.fwd, c.lookAhead).addScaledVector(v.side, camLat.current * 0.6);
      v.target.y += c.lookUp + hFollow * 0.8 + gAhead * 0.85;
    }

    const s = phase === "crashed" || phase === "gameover" ? Math.min(engine.shake, 0.35) : engine.shake;
    if (s > 0) {
      v.pos.x += (Math.random() - 0.5) * s * 0.5;
      v.pos.y += (Math.random() - 0.5) * s * 0.5;
      v.pos.z += (Math.random() - 0.5) * s * 0.5;
    }
    // DENYUT kamera: kamera menyentak ke depan + sedikit ke atas tepat saat hewan mental
    if (engine.punch > 0.004) {
      const k = engine.punch * engine.punch; // sentakan paling tajam di awal, cepat reda
      v.pos.addScaledVector(v.fwd, 0.5 * k);
      v.pos.y += 0.32 * k;
    }
    cam.position.copy(v.pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(v.target);
    if (c.roll) cam.rotateZ(c.roll); // Dutch angle action tilt
    const aspect = size.width / size.height;
    // keep the horizontal field of view sane on very tall phones
    // sprint = dynamic zoom-out for fast kick sensation; punch = denyut zoom-in singkat saat hewan mental
    const fov =
      (aspect < 0.56 ? c.fov + (0.56 - aspect) * 40 : c.fov) + engine.sprint * 6.5 - engine.punch * engine.punch * 4.5;
    if (Math.abs(cam.fov - fov) > 0.01 || cam.aspect !== aspect) {
      cam.fov = fov;
      cam.aspect = aspect;
      cam.updateProjectionMatrix();
    }

    // Dynamic world curvature (gentle, smooth horizon without extreme warping)
    const isSubway = useUI.getState().worldCurve === "subway";
    const isHaruna = useUI.getState().trackMode === "haruna";
    const dist = engine.distance;
    // Gentle horizon drift in Tokyo mode; on Haruna mountain touge, actual 3D hairpin curves lead naturally
    const wave = isHaruna ? 0 : Math.sin(dist * 0.006) * 0.0004;
    const targetCurveSide = isSubway
      ? phase === "playing"
        ? wave
        : phase === "menu"
          ? 0.0003
          : 0
      : 0;
    // Subtle downward curvature that gives horizon depth without dropping the track off a cliff
    const targetCurveDown = isSubway ? (isHaruna ? c.curveDown * 0.75 : c.curveDown) : 0;
    c.curveSide += (targetCurveSide - c.curveSide) * (1 - Math.exp(-step * 2.8));

    // world curve: bends everything ahead of the player; haze only touches the far end of the world
    if (!curveDisabled) {
      curveUniforms.uCurveOrigin.value.copy(v.base);
      curveUniforms.uCurveDir.value.set(Math.cos(yaw.current), 0, Math.sin(yaw.current));
      curveUniforms.uCurveDown.value = targetCurveDown;
      curveUniforms.uCurveSide.value = isSubway ? c.curveSide : 0;
      curveUniforms.uCurveStart.value = 8.0; // keeps the first 8m ahead completely flat and clear
      curveUniforms.uHazeRange.value.set(c.hazeNear, c.hazeFar);
    }

    // newly created materials (buildings, thumbnails, etc.) get patched lazily
    patchT.current += step;
    if (patchT.current > 0.5) {
      patchT.current = 0;
      applyCurveToScene(scene);
    }
  });

  useEffect(() => {
    applyCurveToScene(scene);
  }, [scene]);
  return null;
}

function Lights() {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target = target;
    const cam = l.shadow.camera;
    cam.left = -26;
    cam.right = 26;
    cam.top = 26;
    cam.bottom = -26;
    cam.near = 1;
    cam.far = 90;
    cam.updateProjectionMatrix();
    const mobile = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0 && window.innerWidth < 900;
    l.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.03;
    l.shadow.needsUpdate = true;
  }, [target]);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    const c = engine.center;
    // shadow frustum centered a bit ahead of the player
    const th = c.th;
    const fx = Math.cos(th);
    const fz = Math.sin(th);
    l.position.set(c.x - 2 + fx * 12, c.y + 25, c.z + 4.5 + fz * 12);
    target.position.set(c.x + fx * 17, c.y, c.z + fz * 17);
    target.updateMatrixWorld();
  });
  return (
    <>
      <hemisphereLight args={["#ffffff", "#b0c4d8", 1.7]} />
      <ambientLight intensity={0.2} />
      <directionalLight ref={light} position={[-2, 25, 4.5]} intensity={2.1} castShadow />
      <primitive object={target} />
    </>
  );
}

function Loop() {
  useFrame((_, dt) => engine.update(dt), -10);
  return null;
}

/** Sky dome + distant haze so the curved horizon fades nicely. */
function Sky() {
  const mat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
      uniforms: { top: { value: new THREE.Color("#2f86dc") }, mid: { value: new THREE.Color("#cbe6f8") }, bot: { value: new THREE.Color("#e2f1fb") } },
      vertexShader: /* glsl */ `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP;
        void main(){ float h = normalize(vP).y; vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.5)) : mix(mid, bot, clamp(-h*3.0,0.0,1.0)); gl_FragColor = vec4(c,1.0);
          #include <colorspace_fragment>
        }`,
    });
    return m;
  }, []);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => {
    if (ref.current) ref.current.position.copy(camera.position);
  });
  return (
    <mesh ref={ref} material={mat} frustumCulled={false} renderOrder={-100}>
      <sphereGeometry args={[150, 24, 16]} />
    </mesh>
  );
}

export function Scene({ onContextLost }: { onContextLost?: () => void }) {
  return (
    <Canvas
      shadows
      flat
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "default", alpha: false }}
      camera={{ fov: 60, near: 0.3, far: 220, position: [-8, 5, 0] }}
      onCreated={({ scene, gl }) => {
        gl.setClearColor("#bfe3ff");
        // If this GPU/driver rejects the curved-world shader, fall back to stock shaders + plain fog
        gl.debug.onShaderError = (ctx, program, vs, fs) => {
          console.error("[pigeon-sk8] shader failed, disabling world curve:", ctx.getProgramInfoLog(program), ctx.getShaderInfoLog(vs), ctx.getShaderInfoLog(fs));
          disableCurve(scene);
          scene.fog = new THREE.Fog("#dbeeff", 90, 170);
        };
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onContextLost?.();
        });
        (window as unknown as { __pigeon?: Record<string, unknown> }).__pigeon = {
          ...((window as unknown as { __pigeon?: Record<string, unknown> }).__pigeon ?? {}),
          gl,
          scene,
          disableCurve: () => {
            disableCurve(scene);
            scene.fog = new THREE.Fog("#dbeeff", 90, 170);
          },
        };
      }}
      style={{ position: "absolute", inset: 0, touchAction: "none" }}
    >
      <CameraRig />
      <Lights />
      <Loop />
      <Sky />
      <Backdrop />
      <World />
      <Podium />
      <Player />
    </Canvas>
  );
}
