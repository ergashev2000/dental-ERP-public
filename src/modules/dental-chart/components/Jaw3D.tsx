import { Html, OrbitControls } from '@react-three/drei';
import { BackSide } from 'three';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { Button, Segmented, Tooltip } from 'antd';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { BufferGeometry, Vector3 } from 'three';
import { RotateCcw } from '@/shared/icons';
import { TOOTH_CONDITION } from '@/shared/constants/status';
import { toothColors as c } from '@/shared/theme/tokens';
import { cn } from '@/shared/utils/cn';
import { toothName, type ToothType } from '@/shared/utils/fdi';
import { capGeometry, crownGeometry, gumGeometry } from '../jaw3d/geometry';
import { GAP, GUM_RADIUS, jawTeeth, layoutJaw, type JawLayout, type PlacedTooth } from '../jaw3d/layout';
import { toothLook } from '../jaw3d/look';
import type { Jaw3DViewProps, JawView } from '../jaw3d/types';
import type { ToothRecord } from '../types';
import { conditionsLabel } from '../utils';

/**
 * 3D jag' modeli (three.js). Bu fayl faqat `Jaw3DView` orqali lazy yuklanadi —
 * three.js bo'lagi 3D ko'rinish ochilgandagina yuklab olinadi.
 */

const TYPES: ToothType[] = ['incisor', 'canine', 'premolar', 'molar'];
/** Milk — och pushti (pulpa tokeni = danger.soft) */
const GUM_COLOR = c.pulp;
const DIM_OPACITY = 0.22;

/* ---------------- Tish ---------------- */

interface ToothProps {
  p: PlacedTooth;
  geometry: BufferGeometry;
  record?: ToothRecord;
  selected: boolean;
  hovered: boolean;
  dimmed: boolean;
  /** Urg'u berilgan tish — doimiy raqam chipi */
  numbered: boolean;
  presentation: boolean;
  onEnter: (tooth: number) => void;
  onLeave: (tooth: number) => void;
  onPick?: (tooth: number, multi: boolean) => void;
}

const Tooth = memo(({ p, geometry, record, selected, hovered, dimmed, numbered, presentation, onEnter, onLeave, onPick }: ToothProps) => {
  const conditions = record?.conditions ?? [];
  const look = toothLook(conditions);
  const lift = hovered || selected ? 1.06 : 1;
  // implant (koronkasiz) — kichik metall abutment
  const k = look.abutment ? 0.55 : 1;
  const w = p.w * k * lift;
  const d = p.d * k * lift;
  const h = p.h * k * lift;
  const ySign = p.upper ? 1 : -1;
  // bo'yin joyida qoladi, uchi okklyuziv tekislik tomon o'sadi
  const y = ySign * (GAP / 2 + p.h - h / 2);
  const opacity = dimmed ? Math.min(look.opacity, DIM_OPACITY) : look.opacity;
  const outline = dimmed ? undefined : selected ? c.crownStroke : look.outline;

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onEnter(p.tooth);
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // aylantirish (drag) bosish hisoblanmaydi
    if (e.delta > 6 || !onPick) return;
    const n = e.nativeEvent;
    onPick(p.tooth, n.shiftKey || n.ctrlKey || n.metaKey);
  };

  const labelY = ySign * (GAP / 2 + p.h + 13);

  return (
    <group position={[p.x, 0, p.z]} rotation-y={p.angle}>
      <mesh
        geometry={geometry}
        position-y={y}
        rotation-z={p.upper ? Math.PI : 0}
        scale={[w, h, d]}
        onPointerOver={over}
        onPointerOut={() => onLeave(p.tooth)}
        onClick={click}
      >
        <meshStandardMaterial
          key={`${look.key}-${opacity}`}
          color={look.color}
          roughness={look.abutment ? 0.35 : 0.5}
          metalness={look.abutment ? 0.55 : 0}
          transparent={opacity < 1}
          opacity={opacity}
          depthWrite={opacity >= 1}
        />
      </mesh>
      {/* Chegara (koronka, rejada, tanlangan): teskari qobiq — biroz kattaroq nusxa, faqat orqa yuzasi chiziladi.
          drei <Outlines screenspace> ba'zi GPU/brauzerlarda tishdan ancha katta dog' bo'lib chizilardi. */}
      {outline && (
        <mesh geometry={geometry} position-y={y} rotation-z={p.upper ? Math.PI : 0} scale={[w * (selected ? 1.12 : 1.08), h * (selected ? 1.06 : 1.04), d * (selected ? 1.12 : 1.08)]} raycast={() => null}>
          <meshBasicMaterial color={outline} side={BackSide} transparent={opacity < 1} opacity={opacity} />
        </mesh>
      )}
      {hovered ? (
        <Html position={[0, labelY, 4]} center zIndexRange={[20, 0]} pointerEvents="none">
          <div
            className={cn(
              'whitespace-nowrap bg-ink text-on-ink',
              presentation ? 'rounded-md px-4 py-2 text-sm leading-snug' : 'rounded-pill px-3 py-1.5 text-xs',
            )}
          >
            {presentation ? (
              <>
                <div>
                  {p.tooth}-tish · {toothName(p.tooth)}
                </div>
                <div className="text-on-dark-muted">
                  {conditions.filter((x) => x !== 'HEALTHY').map((x) => TOOTH_CONDITION[x].label).join(', ') ||
                    TOOTH_CONDITION.HEALTHY.label}
                </div>
              </>
            ) : (
              <>
                <span className="tabular-nums">{p.tooth}</span> · {conditionsLabel(conditions)}
              </>
            )}
          </div>
        </Html>
      ) : (
        numbered && (
          <Html position={[0, labelY, 4]} center zIndexRange={[20, 0]} pointerEvents="none">
            <div className="grid h-6 min-w-6 place-items-center rounded-pill bg-surface px-1.5 text-xs tabular-nums text-ink ring-1 ring-line">
              {p.tooth}
            </div>
          </Html>
        )
      )}
    </group>
  );
});
Tooth.displayName = 'Tooth';

/* ---------------- Jag' (milk + tishlar) ---------------- */

interface JawProps {
  layout: JawLayout;
  geos: Record<ToothType, BufferGeometry>;
  cap: BufferGeometry;
  byTooth: Map<number, ToothRecord>;
  selected: Set<number>;
  highlight: Set<number> | null;
  hovered: number | null;
  presentation: boolean;
  onEnter: (tooth: number) => void;
  onLeave: (tooth: number) => void;
  onPick?: (tooth: number, multi: boolean) => void;
}

/** Milk tishlarning orqasidagilarni to'sadi — ko'rinmaydigan tish hover/bosilmaydi */
const block = (e: ThreeEvent<PointerEvent | MouseEvent>) => e.stopPropagation();

const Jaw = ({ layout, geos, cap, byTooth, selected, highlight, hovered, presentation, onEnter, onLeave, onPick }: JawProps) => {
  const gum = useMemo(() => gumGeometry(layout.gum, GUM_RADIUS), [layout]);
  useEffect(() => () => gum.tube.dispose(), [gum]);

  const gumMesh = (geometry: BufferGeometry, position?: Vector3) => (
    <mesh geometry={geometry} position={position} onPointerOver={block} onClick={block}>
      <meshStandardMaterial color={GUM_COLOR} roughness={0.85} />
    </mesh>
  );

  return (
    // pastki jag' biroz orqada va kichikroq — yuqori kurak tishlar oldinda turadi
    <group position-z={layout.upper ? 0 : -3} scale={layout.upper ? 1 : 0.97}>
      {gumMesh(gum.tube)}
      {gumMesh(cap, gum.start)}
      {gumMesh(cap, gum.end)}
      {layout.teeth.map((p) => (
        <Tooth
          key={p.tooth}
          p={p}
          geometry={geos[p.type]}
          record={byTooth.get(p.tooth)}
          selected={selected.has(p.tooth)}
          hovered={hovered === p.tooth}
          dimmed={!!highlight && !highlight.has(p.tooth)}
          numbered={!!highlight?.has(p.tooth)}
          presentation={presentation}
          onEnter={onEnter}
          onLeave={onLeave}
          onPick={onPick}
        />
      ))}
    </group>
  );
};

/* ---------------- Kamera ---------------- */

interface ControlsLike {
  target: Vector3;
  minDistance: number;
  maxDistance: number;
  update: () => void;
}

const PRESET: Record<JawView, [number, number, number]> = {
  both: [0, 0.28, 1],
  upper: [0, -1.15, 0.6],
  lower: [0, 1.15, 0.6],
};

/** Ko'rinish tanlanganda kamerani joylaydi; o'lcham o'zgarsa — burchakni saqlab masofani moslaydi */
const CameraRig = ({ view, resetKey, centerZ }: { view: JawView; resetKey: number; centerZ: number }) => {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as ControlsLike | null;
  const invalidate = useThree((s) => s.invalidate);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  // jag' eni ~70 mm, balandligi ~45 mm sig'sin (fov 35°)
  const fit = Math.max(95, 140 / aspect);

  useEffect(() => {
    if (!controls) return;
    const [x, y, z] = PRESET[view];
    const len = Math.hypot(x, y, z);
    const ty = view === 'upper' ? GAP / 2 + 5 : view === 'lower' ? -(GAP / 2 + 5) : 0;
    controls.target.set(0, ty, centerZ);
    camera.position.set((x / len) * fit, ty + (y / len) * fit, centerZ + (z / len) * fit);
    controls.update();
    invalidate();
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- fit alohida effektda: o'lcham o'zgarsa foydalanuvchi burgan burchak saqlanadi
  }, [view, resetKey, controls, centerZ, camera, invalidate]);

  useEffect(() => {
    if (!controls) return;
    const dir = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(dir, fit);
    controls.minDistance = fit * 0.55;
    controls.maxDistance = fit * 1.5;
    controls.update();
    invalidate();
  }, [fit, controls, camera, invalidate]);

  return null;
};

/* ---------------- Sahna ---------------- */

interface SceneProps extends Required<Pick<Jaw3DViewProps, 'records' | 'dentition' | 'presentation'>> {
  selected: Set<number>;
  highlight: Set<number> | null;
  onToothClick?: Jaw3DViewProps['onToothClick'];
  view: JawView;
  resetKey: number;
  hovered: number | null;
  setHovered: (fn: (prev: number | null) => number | null) => void;
}

const Scene = ({ records, dentition, presentation, selected, highlight, onToothClick, view, resetKey, hovered, setHovered }: SceneProps) => {
  // 4 ta umumiy toj geometriyasi + milk uchi — bir marta yaratiladi, unmount'da tozalanadi
  const geos = useMemo(() => Object.fromEntries(TYPES.map((t) => [t, crownGeometry(t)])) as Record<ToothType, BufferGeometry>, []);
  const cap = useMemo(() => capGeometry(GUM_RADIUS), []);
  useEffect(
    () => () => {
      Object.values(geos).forEach((g) => g.dispose());
      cap.dispose();
    },
    [geos, cap],
  );

  const hlKey = highlight ? [...highlight].join(',') : '';
  const jaws = useMemo(() => {
    const j = jawTeeth(dentition, records, hlKey ? hlKey.split(',').map(Number) : []);
    return { upper: layoutJaw(true, j.upperRight, j.upperLeft), lower: layoutJaw(false, j.lowerRight, j.lowerLeft) };
  }, [dentition, records, hlKey]);
  const byTooth = useMemo(() => new Map(records.map((r) => [r.tooth, r])), [records]);

  const zs = jaws.upper.teeth.map((t) => t.z);
  const centerZ = zs.length ? (Math.min(...zs) + Math.max(...zs)) / 2 : -20;

  const onEnter = useCallback((t: number) => setHovered(() => t), [setHovered]);
  const onLeave = useCallback((t: number) => setHovered((h) => (h === t ? null : h)), [setHovered]);

  const common = { geos, cap, byTooth, selected, highlight, hovered, presentation, onEnter, onLeave, onPick: onToothClick };

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[25, 45, 70]} intensity={1.5} />
      <directionalLight position={[-40, -25, 30]} intensity={0.6} />
      <directionalLight position={[0, 20, -80]} intensity={0.5} />
      {view !== 'lower' && <Jaw layout={jaws.upper} {...common} />}
      {view !== 'upper' && <Jaw layout={jaws.lower} {...common} />}
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={presentation}
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={0.7}
        minPolarAngle={Math.PI * 0.1}
        maxPolarAngle={Math.PI * 0.9}
        minAzimuthAngle={-Math.PI * 0.65}
        maxAzimuthAngle={Math.PI * 0.65}
      />
      <CameraRig view={view} resetKey={resetKey} centerZ={centerZ} />
    </>
  );
};

/* ---------------- Tashqi qobiq ---------------- */

const VIEW_OPTIONS: { value: JawView; label: string }[] = [
  { value: 'both', label: 'Ikkala jag‘' },
  { value: 'upper', label: 'Yuqori' },
  { value: 'lower', label: 'Pastki' },
];

export const Jaw3D = ({
  records,
  dentition = 'adult',
  selected,
  highlight,
  presentation = false,
  onToothClick,
  initialView = 'both',
  className,
}: Jaw3DViewProps) => {
  const [view, setView] = useState<JawView>(initialView);
  const [resetKey, setResetKey] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const selectedKey = selected?.join(',') ?? '';
  const highlightKey = highlight?.join(',') ?? '';
  const selectedSet = useMemo(() => new Set(selectedKey ? selectedKey.split(',').map(Number) : []), [selectedKey]);
  const highlightSet = useMemo(
    () => (highlightKey ? new Set(highlightKey.split(',').map(Number)) : null),
    [highlightKey],
  );

  return (
    <section
      aria-label="Jag‘ning 3D modeli. Tahrirlash uchun 2D sxemadan foydalaning"
      className={cn('relative overflow-hidden rounded-md bg-surface', hovered !== null && 'cursor-pointer', className ?? 'h-[320px] md:h-[440px]')}
    >
      <Canvas
        flat
        frameloop="demand"
        // offsetSize: modal ochilish animatsiyasidagi transform (scale) o'lchamni buzmasin
        resize={{ offsetSize: true }}
        dpr={[1, 2]}
        camera={{ fov: 35, near: 1, far: 1000, position: [0, 25, 110] }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene
          records={records}
          dentition={dentition}
          presentation={presentation}
          selected={selectedSet}
          highlight={highlightSet}
          onToothClick={onToothClick}
          view={view}
          resetKey={resetKey}
          hovered={hovered}
          setHovered={setHovered}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
        <Segmented<JawView>
          size={presentation ? 'middle' : 'small'}
          className="pointer-events-auto"
          value={view}
          onChange={(v) => {
            setView(v);
            setHovered(() => null);
          }}
          options={VIEW_OPTIONS}
        />
        <Tooltip title="Ko‘rinishni tiklash">
          <Button
            shape="circle"
            className="pointer-events-auto"
            aria-label="Ko‘rinishni tiklash"
            icon={<RotateCcw size={18} strokeWidth={1.5} />}
            onClick={() => setResetKey((k) => k + 1)}
          />
        </Tooltip>
      </div>
      <div className="pointer-events-none absolute inset-x-3 bottom-3 text-center text-xs text-muted">
        {presentation
          ? 'Aylantirish — torting, yaqinlashtirish — g‘ildirak yoki ikki barmoq'
          : onToothClick
            ? 'Aylantirish — torting, tishni bosing — ma’lumot oynasi'
            : 'Aylantirish — torting'}
      </div>
    </section>
  );
};

export default Jaw3D;
