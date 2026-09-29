import { memo, useEffect, useMemo, useReducer, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildVoxelGeometry, getGeometry, voxelMaterial } from "./voxel";
import { applyCurve } from "./curve";
import {
  CHUNK_LEN,
  barrierParts,
  benchParts,
  boxesParts,
  breadParts,
  buildingParts,
  bushParts,
  carParts,
  chickenParts,
  coneParts,
  flowersParts,
  hydrantParts,
  lampParts,
  planterParts,
  rampParts,
  railParts,
  signDiamondParts,
  signExclaimParts,
  trashParts,
  treeParts,
  railsParts,
  gatePoleParts,
  gateArmParts,
  trainSignParts,
  stopPoleParts,
  crossingNameplateParts,
  GATE_LAT,
  ARM_PIVOT_H,
  TRAIN_CAR_LEN,
  TRAIN_GAP,
  roadworkSignParts,
  roadworkFenceParts,
  jackhammerParts,
  dirtPileParts,
  workerParts,
  pedestrianHeadParts,
  pedestrianTorsoParts,
  pedestrianArmParts,
  pedestrianLegParts,
  overpassParts,
  overpassCarParts,
  puddleParts,
  OVERPASS_H,
  nosCanParts,
  sakuraParts,
  stoneLanternParts,
  petalParts,
  ramenShopParts,
  machiyaShopParts,
  japaneseHouseParts,
  japaneseVillageHouseParts,
  hakoneTrainCarParts,
  catenaryParts,
  intersectionRoadParts,
  trafficLightParts,
  intersectionSignParts,
  crossingCarParts,
  guardrailParts,
  chevronSignParts,
  autumnTreeParts,
  mountainRockParts,
  vendingParts,
  mamachariParts,
  konbiniShopParts,
  neonSignboardParts,
  tougeRouteSignParts,
  tougeStreetlampParts,
  momijiLeafParts,
  catSleepingParts,
  catWalkParts,
  catRagdollFlyingParts,
} from "./models";
import { useUI } from "./store";
import {
  engine,
  track,
  SIGN_AHEAD,
  ARM_S,
  CAT_SCALE,
  CHICKEN_SCALE,
  CHICKEN_SIZE_BOOST,
  OBSTACLE_DEFS,
  type Chunk,
  type Crossing,
  type Intersection,
  type CrossTrafficCar,
  type Decor,
  type Mover,
  type Obstacle,
  type Train,
} from "./engine";
import { buildGroundGeometry } from "./ground";

/* ---------- Decorations ---------- */
const DecorView = memo(function DecorView({ d }: { d: Decor }) {
  const geo = useMemo(() => {
    switch (d.kind) {
      case "building":
        return buildVoxelGeometry(buildingParts(d.spec!));
      case "tree":
        return getGeometry(`tree-${d.variant}`, () => treeParts(d.variant));
      case "lamp":
        return getGeometry("lamp", lampParts);
      case "hydrant":
        return getGeometry("hydrant", hydrantParts);
      case "bush":
        return getGeometry(`bush-${d.variant}`, () => bushParts(d.variant));
      case "flowers":
        return getGeometry(`flowers-${d.variant}`, () => flowersParts(d.variant));
      case "roadsign":
        return getGeometry("roadsign", roadworkSignParts);
      case "overpass":
        return getGeometry("overpass", overpassParts);
      case "puddle":
        return getGeometry(`puddle-${d.variant}`, () => puddleParts(d.variant));
      case "sakura":
        return getGeometry(`sakura-${d.variant}`, () => sakuraParts(d.variant, 1 + (d.variant % 2) * 0.18));
      case "lantern":
        return getGeometry("lantern", stoneLanternParts);
      case "ramen":
        return getGeometry("ramen", ramenShopParts);
      case "machiya":
        return getGeometry(`machiya-${d.variant % 2}`, () => machiyaShopParts(d.variant));
      case "house":
        return getGeometry(`house-${d.variant % 2}`, () => japaneseHouseParts(d.variant));
      case "village_house":
        return getGeometry(`village_house-${Math.abs(d.variant) % 3}`, () => japaneseVillageHouseParts(d.variant));
      case "guardrail":
        return getGeometry("guardrail", () => guardrailParts(CHUNK_LEN));
      case "chevron":
        return getGeometry(`chevron-${d.variant > 0 ? 1 : -1}`, () => chevronSignParts(d.variant > 0 ? 1 : -1));
      case "autumn_tree":
        return getGeometry(`autumn-${d.variant % 3}`, () => autumnTreeParts(d.variant));
      case "rock":
        return getGeometry(`rock-${d.variant % 2}`, () => mountainRockParts(d.variant));
      case "vending":
        return getGeometry(`vending-${d.variant % 3}`, () => vendingParts(d.variant));
      case "mamachari":
        return getGeometry(`mamachari-${d.variant % 4}`, () => mamachariParts(d.variant));
      case "konbini":
        return getGeometry("konbini", konbiniShopParts);
      case "neon_sign":
        return getGeometry(`neon-${d.variant % 2}`, () => neonSignboardParts(d.variant));
      case "touge_sign":
        return getGeometry("touge-sign", tougeRouteSignParts);
      case "touge_lamp":
        return getGeometry("touge-lamp", tougeStreetlampParts);
    }
  }, [d]);
  useEffect(() => {
    if (d.kind === "building") return () => geo.dispose();
  }, [d, geo]);
  const facing =
    d.kind === "house" ||
    d.kind === "ramen" ||
    d.kind === "machiya" ||
    d.kind === "building" ||
    d.kind === "village_house" ||
    d.kind === "konbini" ||
    d.kind === "vending" ||
    d.kind === "neon_sign" ||
    d.kind === "touge_sign" ||
    d.kind === "touge_lamp";
  // buildings face +z (toward the road); those placed on the camera side (front) are turned around
  const flip = facing && d.frontSide ? Math.PI : 0;
  return <mesh geometry={geo} material={voxelMaterial} position={d.pos} rotation-y={d.rotY + flip} castShadow={d.kind !== "flowers"} receiveShadow />;
});

const ChunkView = memo(function ChunkView({ chunk }: { chunk: Chunk }) {
  const geo = useMemo(() => buildGroundGeometry(track, chunk.s0, CHUNK_LEN, chunk.kind), [chunk]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group>
      <mesh geometry={geo} material={voxelMaterial} receiveShadow />
      {chunk.decor.map((d, i) => (
        <DecorView key={i} d={d} />
      ))}
    </group>
  );
});

/* ---------- Obstacles ---------- */
function obstacleGeometry(o: Obstacle) {
  switch (o.kind) {
    case "cone":
      return getGeometry("cone", coneParts);
    case "trash":
      return getGeometry(`trash-${o.variant % 3}`, () => trashParts(o.variant));
    case "barrier":
      return getGeometry("barrier", barrierParts);
    case "bench":
      return getGeometry("bench", benchParts);
    case "boxes":
      return getGeometry("boxes", boxesParts);
    case "planter":
      return getGeometry("planter", planterParts);
    case "car":
      return getGeometry(`car-${o.variant % 7}`, () => carParts(o.variant));
    case "ramp":
      return getGeometry("ramp", rampParts);
    case "rail": {
      const L = (o.half ?? OBSTACLE_DEFS.rail.halfLen) * 2;
      return getGeometry(`rail-${L}-${o.variant}`, () => railParts(L, o.variant));
    }
    case "fence":
      return getGeometry("fence", roadworkFenceParts);
    case "dirt":
      return getGeometry("dirt", dirtPileParts);
    case "jackhammer":
      return getGeometry("jackhammer", jackhammerParts);
    case "worker":
      return getGeometry(`worker-${o.variant % 2}`, () => workerParts(o.variant));
  }
}

const ObstacleView = memo(function ObstacleView({ o }: { o: Obstacle }) {
  const geo = useMemo(() => obstacleGeometry(o), [o]);
  const rotY = o.kind === "car" && o.flip ? Math.PI : o.kind === "fence" ? Math.PI / 2 : 0;
  const ref = useRef<THREE.Mesh>(null);
  const catRef = useRef<THREE.Mesh>(null);
  const animated = o.kind === "jackhammer" || o.kind === "worker";
  const hasSleepingCat = o.kind === "car" && o.catVariant !== undefined;
  const catGeo = useMemo(() => {
    if (!hasSleepingCat || o.catVariant === undefined) return null;
    return getGeometry(`cat-sleep-${o.catVariant % 4}`, () => catSleepingParts(o.catVariant!));
  }, [hasSleepingCat, o.catVariant]);

  useFrame(() => {
    if (catRef.current) {
      catRef.current.visible = !o.catHit;
      if (!o.catHit) {
        const t = engine.time;
        const breath = Math.sin(t * 3.5 + o.id) * 0.015;
        catRef.current.scale.set(CAT_SCALE * (1 + breath), CAT_SCALE * (1 + breath * 1.5), CAT_SCALE * (1 + breath));
      }
    }
    if (!animated || !ref.current) return;
    const t = engine.time;
    if (o.kind === "jackhammer") ref.current.position.y = Math.abs(Math.sin(t * 28)) * 0.06;
    else ref.current.position.y = Math.abs(Math.sin(t * 28)) * 0.03;
  });
  return (
    <group position={o.pos} quaternion={o.quat}>
      <mesh ref={ref} geometry={geo} material={voxelMaterial} rotation-y={rotY} castShadow receiveShadow />
      {catGeo && (
        <group position={[-0.15, 1.495, 0]} rotation-y={rotY}>
          <mesh ref={catRef} geometry={catGeo} material={voxelMaterial} castShadow receiveShadow />
        </group>
      )}
    </group>
  );
});

/* ---------- Movers: oncoming cars, crossing chickens & pedestrians ---------- */
const PED_SCALE = 1.8;
/* CAT_SCALE / CHICKEN_SCALE (ukuran hewan, sudah termasuk boost 1.7x & 1.2x)
   diimpor dari engine.ts supaya hitbox di sana selalu sinkron dengan model di sini. */

const PedestrianMover = memo(function PedestrianMover({ m }: { m: Mover }) {
  const rootRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const headNormalRef = useRef<THREE.Mesh>(null);
  const headHitRef = useRef<THREE.Mesh>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);
  const legLRef = useRef<THREE.Group>(null);
  const legRRef = useRef<THREE.Group>(null);
  const accRef = useRef<THREE.Group>(null);

  const headNormalGeo = useMemo(() => getGeometry(`ped-head-${m.variant % 5}-normal`, () => pedestrianHeadParts(m.variant, false)), [m.variant]);
  const headHitGeo = useMemo(() => getGeometry(`ped-head-${m.variant % 5}-hit`, () => pedestrianHeadParts(m.variant, true)), [m.variant]);
  const torsoGeo = useMemo(() => getGeometry(`ped-torso-${m.variant % 5}`, () => pedestrianTorsoParts(m.variant)), [m.variant]);
  const armLGeo = useMemo(() => getGeometry(`ped-arm-${m.variant % 5}-L`, () => pedestrianArmParts(m.variant, 1)), [m.variant]);
  const armRGeo = useMemo(() => getGeometry(`ped-arm-${m.variant % 5}-R`, () => pedestrianArmParts(m.variant, -1)), [m.variant]);
  const legLGeo = useMemo(() => getGeometry(`ped-leg-${m.variant % 5}-L`, () => pedestrianLegParts(m.variant, 1)), [m.variant]);
  const legRGeo = useMemo(() => getGeometry(`ped-leg-${m.variant % 5}-R`, () => pedestrianLegParts(m.variant, -1)), [m.variant]);

  const accGeo = useMemo(() => {
    if (m.variant % 3 === 1) {
      return getGeometry("ped-bag", () => [
        { x: 0.05, y: -0.28, z: 0.1, w: 0.28, h: 0.34, d: 0.1, color: "#f4e1b5" },
        { x: 0.05, y: -0.06, z: 0.1, w: 0.24, h: 0.12, d: 0.04, color: "#d2b988" },
      ]);
    }
    if (m.variant % 3 === 2) {
      const color = m.variant % 2 ? "#ff5c8a" : "#4cc9f0";
      return getGeometry(`ped-umb-${m.variant % 2}`, () => [
        { x: 0.1, y: 0.52, z: 0, w: 0.05, h: 1.1, d: 0.05, color: "#333333" },
        { x: 0.1, y: 1.12, z: 0, w: 1.0, h: 0.12, d: 1.0, color },
        { x: 0.1, y: 1.22, z: 0, w: 0.6, h: 0.1, d: 0.6, color: m.variant % 2 ? "#ff8fb1" : "#7fdbff" },
      ]);
    }
    return null;
  }, [m.variant]);

  useFrame(() => {
    const root = rootRef.current;
    const inner = innerRef.current;
    const torso = torsoRef.current;
    const headN = headNormalRef.current;
    const headH = headHitRef.current;
    const headG = headGroupRef.current;
    const armL = armLRef.current;
    const armR = armRRef.current;
    const legL = legLRef.current;
    const legR = legRRef.current;
    if (!root || !inner || !torso || !headN || !headH || !headG || !armL || !armR || !legL || !legR) return;

    track.frame(m.s, m.lat, m.h, root.position);
    track.quat(m.s, root.quaternion);

    const isHit = m.phase === "hit" && !!m.rag;
    headN.visible = !isHit;
    headH.visible = isHit;

    if (isHit && m.rag) {
      // ---- FLOPPY DYNAMIC RAGDOLL PHYSICS (NOT STIFF!) ----
      inner.position.set(0, m.rag.radius, 0);
      inner.rotation.set(
        m.rag.rx,
        m.rag.ry + (m.dir > 0 ? -Math.PI / 2 : Math.PI / 2),
        m.rag.rz
      );
      inner.scale.setScalar(PED_SCALE);
      torso.position.set(0, 0, 0);

      const t = m.hitT;
      if (!m.rag.rest) {
        // Tumble in the air: flailing limbs, lolling head
        const flail = Math.sin(t * 18);
        const flail2 = Math.cos(t * 15);
        armL.rotation.set(Math.sin(t * 13) * 0.7, 0, 1.8 + flail * 0.6);
        armR.rotation.set(Math.cos(t * 13) * 0.7, 0, -1.8 - flail2 * 0.6);
        legL.rotation.set(Math.sin(t * 14 + 1) * 0.8, 0, 0.45 + Math.sin(t * 10) * 0.35);
        legR.rotation.set(-Math.sin(t * 14) * 0.8, 0, -0.45 - Math.sin(t * 10) * 0.35);
        headG.rotation.set(0.65 + Math.sin(t * 12) * 0.3, 0, Math.cos(t * 9) * 0.4);
        if (accRef.current) {
          accRef.current.rotation.set(t * 8, t * 10, t * 6);
        }
      } else {
        // Settled limp sprawl on the pavement with X X eyes and gaping open mouth
        armL.rotation.set(0.4, 0, 1.5);
        armR.rotation.set(-0.35, 0, -1.5);
        legL.rotation.set(-0.3, 0, 0.5);
        legR.rotation.set(0.5, 0, -0.25);
        headG.rotation.set(0.55, 0, -0.4);
      }
    } else {
      // ---- NATURAL WALKING / WAITING ANIMATION ----
      inner.position.set(0, 0.98, 0);
      inner.rotation.set(0, m.dir > 0 ? -Math.PI / 2 : Math.PI / 2, 0);
      inner.scale.setScalar(PED_SCALE);
      torso.position.set(0, 0, 0);

      if (m.phase === "hop") {
        const swing = Math.sin(m.hopT * 10);
        legL.rotation.set(swing * 0.55, 0, 0);
        legR.rotation.set(-swing * 0.55, 0, 0);
        armL.rotation.set(-swing * 0.45, 0, 0);
        armR.rotation.set(swing * 0.45, 0, 0);
        headG.rotation.set(0, 0, Math.sin(m.hopT * 20) * 0.04);
        inner.position.y = 0.98 + Math.abs(Math.sin(m.hopT * 10)) * 0.05;
      } else {
        legL.rotation.set(0, 0, 0);
        legR.rotation.set(0, 0, 0);
        armL.rotation.set(0, 0, 0);
        armR.rotation.set(0, 0, 0);
        headG.rotation.set(0, 0, 0);
      }
      if (accRef.current) {
        accRef.current.rotation.set(0, 0, 0);
      }
    }
  });

  return (
    <group ref={rootRef}>
      <group ref={innerRef}>
        <group ref={torsoRef}>
          <mesh geometry={torsoGeo} material={voxelMaterial} castShadow receiveShadow />

          {/* Head & Face (switches to X X eyes and gaping mouth on hit) */}
          <group ref={headGroupRef} position={[0, 0.34, 0]}>
            <mesh ref={headNormalRef} geometry={headNormalGeo} material={voxelMaterial} castShadow />
            <mesh ref={headHitRef} geometry={headHitGeo} material={voxelMaterial} visible={false} castShadow />
          </group>

          {/* Left Arm & Accessory */}
          <group ref={armLRef} position={[0, 0.27, 0.34]}>
            <mesh geometry={armLGeo} material={voxelMaterial} castShadow />
            {accGeo && (
              <group ref={accRef}>
                <mesh geometry={accGeo} material={voxelMaterial} castShadow />
              </group>
            )}
          </group>

          {/* Right Arm */}
          <group ref={armRRef} position={[0, 0.27, -0.34]}>
            <mesh geometry={armRGeo} material={voxelMaterial} castShadow />
          </group>

          {/* Left Leg */}
          <group ref={legLRef} position={[0, -0.34, 0.11]}>
            <mesh geometry={legLGeo} material={voxelMaterial} castShadow receiveShadow />
          </group>

          {/* Right Leg */}
          <group ref={legRRef} position={[0, -0.34, -0.11]}>
            <mesh geometry={legRGeo} material={voxelMaterial} castShadow receiveShadow />
          </group>
        </group>
      </group>
    </group>
  );
});

const MoverView = memo(function MoverView({
  m,
  register,
  registerSign,
}: {
  m: Mover;
  register: (id: number, g: THREE.Group | null) => void;
  registerSign: (id: number, g: THREE.Group | null) => void;
}) {
  const isAnimal = m.kind === "cat" || m.kind === "chicken";
  /**
   * Kilatan putih ("denyut") pada tubuh hewan tepat setelah di-YEET: material
   * klon dari voxelMaterial dengan emissive, dipakai hanya oleh hewan.
   */
  const flashMat = useMemo(() => {
    if (!isAnimal) return null;
    const mat = applyCurve(voxelMaterial.clone());
    mat.emissive = new THREE.Color("#fff8e1");
    mat.emissiveIntensity = 0;
    return mat;
  }, [isAnimal]);
  useEffect(() => () => flashMat?.dispose(), [flashMat]);

  useFrame(() => {
    if (!flashMat) return;
    // denyut kilat: nyala terang lalu berkedip cepat sambil meredup
    if (m.phase === "hit") {
      const fade = Math.max(0, 1 - m.hitT / 0.34);
      flashMat.emissiveIntensity = fade * (1.5 + 0.55 * Math.sin(m.hitT * 70));
    } else {
      flashMat.emissiveIntensity = 0;
    }
  });

  const geo = useMemo(() => {
    if (m.kind === "car") {
      return getGeometry(`car-${m.variant % 7}`, () => carParts(m.variant));
    }
    if (m.kind === "cat") {
      if (m.phase === "hit") {
        return getGeometry(`cat-fly-${m.variant % 4}`, () => catRagdollFlyingParts(m.variant));
      }
      return getGeometry(`cat-walk-${m.variant % 4}`, () => catWalkParts(m.variant));
    }
    return getGeometry("chicken", chickenParts);
  }, [m.kind, m.variant, m.phase]);
  const diamond = useMemo(() => getGeometry("sign-diamond", signDiamondParts), []);
  const exclaim = useMemo(() => getGeometry("sign-ex", signExclaimParts), []);
  const innerRot = m.kind === "car" ? Math.PI : m.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
  return (
    <>
      <group ref={(g) => register(m.id, g)}>
        <group rotation-y={innerRot}>
          <mesh geometry={geo} material={flashMat ?? voxelMaterial} castShadow receiveShadow />
        </group>
      </group>
      {m.kind === "car" && (
        <group ref={(g) => registerSign(m.id, g)} visible={false}>
          <group rotation-z={Math.PI / 4}>
            <mesh geometry={diamond} material={voxelMaterial} />
          </group>
          <mesh geometry={exclaim} material={voxelMaterial} />
        </group>
      )}
    </>
  );
});

function Movers() {
  const { camera } = useThree();
  const refs = useRef(new Map<number, THREE.Group>());
  const signs = useRef(new Map<number, THREE.Group>());
  const seen = useRef(-1);
  const [, force] = useReducer((x: number) => x + 1, 0);
  const register = useMemo(
    () => (id: number, g: THREE.Group | null) => {
      if (g) refs.current.set(id, g);
      else refs.current.delete(id);
    },
    [],
  );
  const registerSign = useMemo(
    () => (id: number, g: THREE.Group | null) => {
      if (g) signs.current.set(id, g);
      else signs.current.delete(id);
    },
    [],
  );

  useFrame(() => {
    if (engine.moverVersion !== seen.current) {
      seen.current = engine.moverVersion;
      force();
    }
    const t = engine.time;
    const d = engine.distance;
    for (const m of engine.movers) {
      if (m.kind === "pedestrian") continue; // PedestrianMover handles its own transform & limbs
      const g = refs.current.get(m.id);
      if (g) {
        track.frame(m.s, m.lat, m.h, g.position);
        track.quat(m.s, g.quaternion);
        if (m.phase === "hit" && m.rag) {
          // ragdoll: tumble with the rigid body, pivot at its center
          const inner = g.children[0];
          inner.position.set(0, m.rag.radius, 0);
          inner.rotation.set(m.rag.rx, m.rag.ry + (m.kind === "car" ? Math.PI : m.dir > 0 ? -Math.PI / 2 : Math.PI / 2), m.rag.rz);
          if (m.kind === "cat") {
            const flutter = !m.rag.rest ? Math.sin(t * 24 + m.id) * 0.08 : 0;
            inner.scale.set(CAT_SCALE * (1 + flutter), CAT_SCALE * (1 - flutter * 0.5), CAT_SCALE * (1 + flutter));
          } else if (m.kind === "chicken") {
            inner.scale.setScalar(CHICKEN_SCALE);
          } else {
            inner.scale.setScalar(1);
          }
          const child = inner.children[0];
          // Body offset from the ragdoll pivot also follows the size boost, so the
          // bigger chicken/cat still lies flat on the asphalt during the ragdoll tumble.
          if (child) {
            child.position.set(0, m.kind === "cat" ? 0 : m.kind === "chicken" ? -0.32 * CHICKEN_SIZE_BOOST : -0.55, 0);
          }
        } else if (m.kind === "cat") {
          const inner = g.children[0];
          inner.position.set(0, 0, 0);
          if (inner.children[0]) inner.children[0].position.set(0, 0, 0);
          // Walking/trotting animation across the road
          const walk = Math.abs(Math.sin(m.hopT * 12)) * 0.04;
          inner.position.y = walk;
          inner.rotation.x = Math.sin(m.hopT * 12) * 0.05;
          inner.scale.setScalar(CAT_SCALE);
        } else if (m.kind === "chicken") {
          const inner = g.children[0];
          inner.position.set(0, 0, 0);
          if (inner.children[0]) inner.children[0].position.set(0, 0, 0);
          if (m.phase === "hop") {
            const u = Math.min(1, m.hopT);
            const st = Math.sin(Math.PI * u);
            inner.scale.set(CHICKEN_SCALE * (1 - 0.12 * st), CHICKEN_SCALE * (1 + 0.25 * st), CHICKEN_SCALE * (1 - 0.12 * st));
            inner.rotation.x = 0;
          } else {
            const sq = m.squash * 0.25;
            const peck = m.phase === "wait" ? Math.abs(Math.sin(t * 5 + m.variant)) * 0.06 : 0;
            inner.scale.set(CHICKEN_SCALE * (1 + sq), CHICKEN_SCALE * (1 - sq - peck), CHICKEN_SCALE * (1 + sq));
            inner.rotation.x = 0;
          }
        } else if (m.kind === "car") {
          const inner = g.children[0];
          inner.position.set(0, 0, 0);
          if (inner.children[0]) inner.children[0].position.set(0, 0, 0);
          inner.rotation.set(0, 0, 0);
          const sq = (m.squash || 0) * 0.14;
          inner.scale.set(1 + sq * 0.35, 1 - sq, 1 + sq * 0.35);
          inner.position.y = Math.sin(t * 18 + m.variant) * 0.015 - sq * 0.25;
        }
      }
      const sg = signs.current.get(m.id);
      if (sg) {
        const show = m.warned && engine.phase === "playing" && m.s > d + 1;
        sg.visible = show;
        if (show) {
          const s = Math.min(m.s - 2.2, d + SIGN_AHEAD);
          track.frame(s, m.lat, 1.9 + Math.sin(t * 6) * 0.12, sg.position);
          sg.quaternion.copy(camera.quaternion);
          const pulse = 1 + 0.12 * Math.sin(t * 10);
          sg.scale.setScalar(pulse);
        }
      }
    }
  });

  return (
    <>
      {engine.movers.map((m) =>
        m.kind === "pedestrian" ? (
          <PedestrianMover key={m.id} m={m} />
        ) : (
          <MoverView key={m.id} m={m} register={register} registerSign={registerSign} />
        )
      )}
    </>
  );
}

/* ---------- Railway crossings (Japanese style) ---------- */
const lampOn = new THREE.MeshBasicMaterial({ color: "#ff2a2a" });
const lampOff = new THREE.MeshBasicMaterial({ color: "#4d1010" });
const lampGeo = new THREE.BoxGeometry(0.06, 0.3, 0.3);
const glowGeo = new THREE.PlaneGeometry(0.9, 0.9);
const glowMat = new THREE.MeshBasicMaterial({ color: "#ff3b3b", transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });

const CrossingView = memo(function CrossingView({ cr }: { cr: Crossing }) {
  const rails = useMemo(() => getGeometry("rails", railsParts), []);
  const pole = useMemo(() => getGeometry("gate-pole", gatePoleParts), []);
  const arm = useMemo(() => getGeometry("gate-arm", gateArmParts), []);
  const sign = useMemo(() => getGeometry("train-sign", trainSignParts), []);
  const stopPole = useMemo(() => getGeometry("stop-pole", stopPoleParts), []);
  const plate = useMemo(() => getGeometry("crossing-plate", crossingNameplateParts), []);
  const catenary = useMemo(() => getGeometry("catenary", () => catenaryParts()), []);
  const arms = useRef<(THREE.Group | null)[]>([]);
  const lamps = useRef<(THREE.Mesh | null)[]>([]);
  const glows = useRef<(THREE.Mesh | null)[]>([]);
  const glowMats = useMemo(() => [0, 1, 2, 3].map(() => glowMat.clone()), []);
  const signPos2 = useMemo(() => {
    // second sign on the far side of the road, same distance before the rails
    const v = track.frame(cr.s - 24, -4.9, 0.12);
    return [v.x, v.y, v.z] as [number, number, number];
  }, [cr]);

  useFrame(() => {
    const a = -(Math.PI / 2) * (1 - cr.armT);
    for (const g of arms.current) if (g) g.rotation.x = a;
    const active = cr.state === "warning" || cr.state === "clearing";
    const phase = Math.floor(cr.lightPhase / 0.42) % 2;
    lamps.current.forEach((m, i) => {
      if (m) m.material = active && i % 2 === phase ? lampOn : lampOff;
    });
    glows.current.forEach((m, i) => {
      if (!m) return;
      const on = active && i % 2 === phase;
      glowMats[i].opacity = on ? 0.45 : 0;
    });
  });

  return (
    <group>
      <group position={cr.pos} rotation-y={cr.rotY}>
        <mesh geometry={rails} material={voxelMaterial} receiveShadow />
        <mesh geometry={catenary} material={voxelMaterial} />
        {[-1, 1].map((side, gi) => (
          <group key={side} position={[ARM_S, 0, side * GATE_LAT]} scale={[1, 1, -side]}>
            <mesh geometry={pole} material={voxelMaterial} castShadow />
            <mesh geometry={plate} material={voxelMaterial} />
            {/* boom pivots on the motor box behind the mast, arm swings over the road */}
            <group
              ref={(g) => {
                arms.current[gi] = g;
              }}
              position={[0.3, ARM_PIVOT_H, 0.2]}
            >
              <mesh geometry={arm} material={voxelMaterial} castShadow />
            </group>
            {/* twin flashers: lens + soft glow */}
            {[-0.32, 0.32].map((lz, li) => (
              <group key={li} position={[-0.29, 2.62, lz]}>
                <mesh
                  ref={(m) => {
                    lamps.current[gi * 2 + li] = m;
                  }}
                  geometry={lampGeo}
                  material={lampOff}
                />
                <mesh
                  ref={(m) => {
                    glows.current[gi * 2 + li] = m;
                  }}
                  geometry={glowGeo}
                  material={glowMats[gi * 2 + li]}
                  position={[-0.06, 0, 0]}
                  rotation-y={-Math.PI / 2}
                />
              </group>
            ))}
            {/* stop-line bollards at the curb before the gate */}
            <mesh geometry={stopPole} material={voxelMaterial} position={[-1.6, 0, -0.55]} castShadow />
          </group>
        ))}
      </group>
      <mesh geometry={sign} material={voxelMaterial} position={cr.signPos} rotation-y={cr.signRotY} castShadow />
      <mesh geometry={sign} material={voxelMaterial} position={signPos2} rotation-y={cr.signRotY} castShadow />
    </group>
  );
});

function Crossings() {
  const seen = useRef(-1);
  const [, force] = useReducer((x: number) => x + 1, 0);
  useFrame(() => {
    if (engine.listVersion !== seen.current) {
      seen.current = engine.listVersion;
      force();
    }
  });
  return (
    <>
      {engine.crossings.map((c) => (
        <CrossingView key={c.id} cr={c} />
      ))}
    </>
  );
}

const TrainView = memo(function TrainView({ tr }: { tr: Train }) {
  const cars = useRef<(THREE.Group | null)[]>([]);
  const geos = useMemo(
    () =>
      Array.from({ length: tr.nCars }, (_, i) => {
        const cab = i === 0 ? tr.dir : i === tr.nCars - 1 ? -tr.dir : 0;
        const panto = i % 2 === 1;
        return getGeometry(`htrain-${cab}-${panto ? 1 : 0}`, () => hakoneTrainCarParts(cab as 0 | 1 | -1, panto));
      }),
    [tr],
  );
  const q = useMemo(() => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), tr.crossing.rotY), [tr]);
  useFrame(() => {
    for (let i = 0; i < tr.nCars; i++) {
      const g = cars.current[i];
      if (!g) continue;
      const lat = tr.head - tr.dir * (TRAIN_CAR_LEN / 2 + i * (TRAIN_CAR_LEN + TRAIN_GAP));
      track.frame(tr.crossing.s, lat, 0.16, g.position);
      g.quaternion.copy(q);
    }
  });
  return (
    <>
      {geos.map((g, i) => (
        <group
          key={i}
          ref={(el) => {
            cars.current[i] = el;
          }}
        >
          <mesh geometry={g} material={voxelMaterial} castShadow receiveShadow />
        </group>
      ))}
    </>
  );
});

function Trains() {
  const seen = useRef(-1);
  const [, force] = useReducer((x: number) => x + 1, 0);
  useFrame(() => {
    if (engine.moverVersion !== seen.current) {
      seen.current = engine.moverVersion;
      force();
    }
  });
  return (
    <>
      {engine.trains.map((t) => (
        <TrainView key={t.id} tr={t} />
      ))}
    </>
  );
}

/* ---------- Perempatan (4-Way Crossroads / Intersections) ---------- */
const IntersectionView = memo(function IntersectionView({ inter }: { inter: Intersection }) {
  const roadGeo = useMemo(() => getGeometry("intersection-road", intersectionRoadParts), []);
  const signGeo = useMemo(() => getGeometry("intersection-sign", intersectionSignParts), []);
  const tlGeoGreen = useMemo(() => getGeometry("tl-green", () => trafficLightParts("green")), []);
  const tlGeoYellow = useMemo(() => getGeometry("tl-yellow", () => trafficLightParts("yellow")), []);
  const tlGeoRed = useMemo(() => getGeometry("tl-red", () => trafficLightParts("red")), []);

  const signPos2 = useMemo(() => {
    const v = track.frame(inter.s - 26, -4.9, 0.12);
    return [v.x, v.y, v.z] as [number, number, number];
  }, [inter]);

  const tlGeo = inter.lightState === "green" ? tlGeoGreen : inter.lightState === "yellow" ? tlGeoYellow : tlGeoRed;

  return (
    <group>
      {/* Crossroad asphalt and zebra crossings */}
      <group position={inter.pos} rotation-y={inter.rotY}>
        <mesh geometry={roadGeo} material={voxelMaterial} receiveShadow />
        {/* 4 Traffic light posts at the corner sidewalk curbs */}
        {[-4.6, 4.6].map((x) =>
          [-4.8, 4.8].map((z) => (
            <mesh
              key={`${x}-${z}`}
              geometry={tlGeo}
              material={voxelMaterial}
              position={[x, 0, z]}
              rotation-y={z > 0 ? 0 : Math.PI}
              castShadow
            />
          ))
        )}
      </group>
      {/* ⚠️ Perempatan warning signs placed ahead on both sides of the road */}
      <mesh geometry={signGeo} material={voxelMaterial} position={inter.signPos} rotation-y={inter.signRotY} castShadow />
      <mesh geometry={signGeo} material={voxelMaterial} position={signPos2} rotation-y={inter.signRotY} castShadow />
    </group>
  );
});

function Intersections() {
  const seen = useRef(-1);
  const [, force] = useReducer((x: number) => x + 1, 0);
  useFrame(() => {
    if (engine.listVersion !== seen.current) {
      seen.current = engine.listVersion;
      force();
    }
  });
  return (
    <>
      {engine.intersections.map((inter) => (
        <IntersectionView key={inter.id} inter={inter} />
      ))}
    </>
  );
}

const CrossCarView = memo(function CrossCarView({ cc }: { cc: CrossTrafficCar }) {
  const geo = useMemo(() => getGeometry(`cross-car-${cc.variant % 7}`, () => crossingCarParts(cc.variant)), [cc.variant]);
  const rootRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const root = rootRef.current;
    const inner = innerRef.current;
    if (!root || !inner) return;
    const h = Math.abs(cc.lat) > 4.2 ? 0.145 : Math.max(0, (Math.abs(cc.lat) - 3.4) / 0.8) * 0.145;
    track.frame(cc.s, cc.lat, h, root.position);
    track.quat(cc.s, root.quaternion);
    // Face lateral travel direction:
    // +lat (+z) => -Math.PI / 2
    // -lat (-z) => Math.PI / 2
    inner.rotation.y = cc.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
  });

  return (
    <group ref={rootRef}>
      <group ref={innerRef}>
        <mesh geometry={geo} material={voxelMaterial} castShadow receiveShadow />
      </group>
    </group>
  );
});

function CrossCars() {
  const seen = useRef(-1);
  const [, force] = useReducer((x: number) => x + 1, 0);
  useFrame(() => {
    if (engine.moverVersion !== seen.current) {
      seen.current = engine.moverVersion;
      force();
    }
  });
  return (
    <>
      {engine.crossCars.map((cc) => (
        <CrossCarView key={cc.id} cc={cc} />
      ))}
    </>
  );
}

/* ---------- Puddles & overpass traffic ---------- */
const puddleMat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.85 });

function Puddles() {
  const seen = useRef(-1);
  const [, force] = useReducer((x: number) => x + 1, 0);
  useFrame(() => {
    if (engine.listVersion !== seen.current) {
      seen.current = engine.listVersion;
      force();
    }
  });
  return (
    <>
      {engine.puddles.map((pu) => (
        <mesh key={pu.id} geometry={getGeometry(`puddle-${pu.variant}`, () => puddleParts(pu.variant))} material={puddleMat} position={pu.pos} rotation-y={pu.rotY} receiveShadow />
      ))}
    </>
  );
}

function RoadSigns() {
  const seen = useRef(-1);
  const [, force] = useReducer((x: number) => x + 1, 0);
  useFrame(() => {
    if (engine.listVersion !== seen.current) {
      seen.current = engine.listVersion;
      force();
    }
  });
  const geo = useMemo(() => getGeometry("roadsign", roadworkSignParts), []);
  return (
    <>
      {engine.roadSigns.map((d) => (
        <mesh key={d.variant} geometry={geo} material={voxelMaterial} position={d.pos} rotation-y={d.rotY} castShadow />
      ))}
    </>
  );
}

function OverpassCars() {
  const seen = useRef(-1);
  const [, force] = useReducer((x: number) => x + 1, 0);
  const refs = useRef(new Map<number, THREE.Group>());
  useFrame(() => {
    if (engine.moverVersion !== seen.current) {
      seen.current = engine.moverVersion;
      force();
    }
    for (const c of engine.overpassCars) {
      const g = refs.current.get(c.id);
      if (!g) continue;
      track.frame(c.s, c.lat, OVERPASS_H + 0.27, g.position);
      track.quat(c.s, g.quaternion);
      g.children[0].rotation.y = c.dir > 0 ? 0 : Math.PI;
    }
  });
  return (
    <>
      {engine.overpassCars.map((c) => (
        <group
          key={c.id}
          ref={(g) => {
            if (g) refs.current.set(c.id, g);
            else refs.current.delete(c.id);
          }}
        >
          <group>
            <mesh geometry={getGeometry(`opcar-${c.variant % 7}`, () => overpassCarParts(c.variant))} material={voxelMaterial} castShadow />
          </group>
        </group>
      ))}
    </>
  );
}

/* ---------- Sakura / Momiji petals & leaves (instanced) ---------- */
const MAX_PETALS = 90;
function Petals() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const trackMode = useUI((s) => s.trackMode);
  const geo = useMemo(
    () => (trackMode === "haruna" ? getGeometry("momiji", momijiLeafParts) : getGeometry("petal", petalParts)),
    [trackMode],
  );
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), []);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    let i = 0;
    for (const p of engine.petals) {
      if (i >= MAX_PETALS) break;
      tmpObj.position.set(p.x, p.y, p.z);
      tmpObj.rotation.set(p.rx, p.ry, p.rz);
      tmpObj.scale.setScalar(1);
      tmpObj.updateMatrix();
      m.setMatrixAt(i++, tmpObj.matrix);
    }
    m.count = i;
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, MAX_PETALS]} frustumCulled={false} />;
}

/* ---------- NOS cans ---------- */
function NosCans() {
  const seen = useRef(-1);
  const [, force] = useReducer((x: number) => x + 1, 0);
  const geo = useMemo(() => getGeometry("nos-can", nosCanParts), []);
  const refs = useRef(new Map<number, THREE.Group>());
  useFrame(() => {
    if (engine.listVersion !== seen.current) {
      seen.current = engine.listVersion;
      force();
    }
    const t = engine.time;
    for (const c of engine.nosCans) {
      const g = refs.current.get(c.id);
      if (!g) continue;
      g.visible = !c.taken;
      g.position.set(c.wx, c.wy + 0.35 + Math.sin(t * 3 + c.phase) * 0.1, c.wz);
      g.rotation.y = t * 2.5 + c.phase;
    }
  });
  return (
    <>
      {engine.nosCans.map((c) => (
        <group
          key={c.id}
          ref={(g) => {
            if (g) refs.current.set(c.id, g);
            else refs.current.delete(c.id);
          }}
        >
          <mesh geometry={geo} material={voxelMaterial} castShadow />
        </group>
      ))}
    </>
  );
}

/* ---------- Bread (instanced) ---------- */
const MAX_BREAD = 140;
const tmpObj = new THREE.Object3D();

function Breads() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => getGeometry("bread", breadParts), []);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    let i = 0;
    const t = engine.time;
    for (const b of engine.breads) {
      if (b.taken || i >= MAX_BREAD) continue;
      tmpObj.position.set(b.wx, b.wy + Math.sin(t * 3 + b.phase) * 0.08, b.wz);
      tmpObj.rotation.set(0, t * 2.2 + b.phase, 0);
      tmpObj.scale.setScalar(1);
      tmpObj.updateMatrix();
      m.setMatrixAt(i++, tmpObj.matrix);
    }
    m.count = i;
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, voxelMaterial, MAX_BREAD]} frustumCulled={false} castShadow />;
}

/* ---------- Denyut: cincin shockwave + kilatan saat hewan mental ---------- */
const PULSE_POOL = 6;

function Pulses() {
  const { camera } = useThree();
  const ringGeo = useMemo(() => new THREE.RingGeometry(0.62, 1, 44), []);
  const discGeo = useMemo(() => new THREE.CircleGeometry(1, 28), []);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const discRefs = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useMemo(
    () =>
      Array.from({ length: PULSE_POOL * 2 }, () =>
        new THREE.MeshBasicMaterial({
          color: "#ffffff",
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        }),
      ),
    [],
  );
  useEffect(
    () => () => {
      ringGeo.dispose();
      discGeo.dispose();
      mats.forEach((m) => m.dispose());
    },
    [ringGeo, discGeo, mats],
  );

  useFrame(() => {
    let ri = 0;
    let di = 0;
    for (const q of engine.pulses) {
      const isRing = q.kind === "ring";
      const idx = isRing ? ri : di;
      if (idx >= PULSE_POOL) continue;
      const mesh = isRing ? ringRefs.current[ri] : discRefs.current[di];
      const mat = isRing ? mats[ri] : mats[PULSE_POOL + di];
      if (isRing) ri++;
      else di++;
      if (!mesh) continue;
      const k = Math.min(1, q.t / q.max);
      const grow = 1 - Math.pow(1 - k, 3); // melesat cepat lalu melambat
      const radius = q.r0 + (q.r1 - q.r0) * grow;
      mesh.visible = true;
      mesh.position.set(q.x, q.y, q.z);
      if (q.flat) mesh.rotation.set(-Math.PI / 2, 0, 0);
      else mesh.quaternion.copy(camera.quaternion); // billboard: selalu menghadap pemain
      mesh.scale.setScalar(radius);
      mat.color.setRGB(q.cr, q.cg, q.cb);
      mat.opacity = (q.kind === "flash" ? 0.9 : 0.95) * Math.pow(1 - k, 1.5);
    }
    // sembunyikan sisa pool
    for (let i = ri; i < PULSE_POOL; i++) if (ringRefs.current[i]) ringRefs.current[i]!.visible = false;
    for (let i = di; i < PULSE_POOL; i++) if (discRefs.current[i]) discRefs.current[i]!.visible = false;
  });

  return (
    <group>
      {Array.from({ length: PULSE_POOL }, (_, i) => (
        <mesh
          key={`ring${i}`}
          ref={(m) => {
            ringRefs.current[i] = m;
          }}
          geometry={ringGeo}
          material={mats[i]}
          visible={false}
          frustumCulled={false}
        />
      ))}
      {Array.from({ length: PULSE_POOL }, (_, i) => (
        <mesh
          key={`flash${i}`}
          ref={(m) => {
            discRefs.current[i] = m;
          }}
          geometry={discGeo}
          material={mats[PULSE_POOL + i]}
          visible={false}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}

/* ---------- Particles (instanced) ---------- */
const MAX_PARTICLES = 150;
const tmpColor = new THREE.Color();

function Particles() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ color: "#ffffff" }), []);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    let i = 0;
    for (const pt of engine.particles) {
      if (i >= MAX_PARTICLES) break;
      const k = 1 - pt.life / pt.max;
      const s = pt.size * (0.4 + 0.6 * k);
      tmpObj.position.set(pt.x, pt.y, pt.z);
      tmpObj.rotation.set(pt.rx, pt.ry, 0);
      tmpObj.scale.set(s, s * (pt.size > 0.15 && pt.gravity < 5 ? 0.35 : 1), s);
      tmpObj.updateMatrix();
      m.setMatrixAt(i, tmpObj.matrix);
      tmpColor.setRGB(pt.r, pt.g, pt.b);
      m.setColorAt(i, tmpColor);
      i++;
    }
    m.count = i;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, MAX_PARTICLES]} frustumCulled={false} castShadow />;
}

/* ---------- World root ---------- */
export function World() {
  const seen = useRef(-1);
  const [, force] = useReducer((x: number) => x + 1, 0);

  useFrame(() => {
    if (engine.listVersion !== seen.current) {
      seen.current = engine.listVersion;
      force();
    }
  });

  return (
    <group>
      {engine.chunks.map((c) => (
        <ChunkView key={c.id} chunk={c} />
      ))}
      {engine.obstacles.map((o) => (
        <ObstacleView key={o.id} o={o} />
      ))}
      <Intersections />
      <CrossCars />
      <Crossings />
      <Trains />
      <Puddles />
      <Petals />
      <NosCans />
      <RoadSigns />
      <OverpassCars />
      <Movers />
      <Breads />
      <Particles />
      <Pulses />
    </group>
  );
}
