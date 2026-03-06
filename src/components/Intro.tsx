import { useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ScrollControls, useScroll, Environment, Sky } from '@react-three/drei';
import * as THREE from 'three';

interface IntroProps {
  onFinish: () => void;
}

const SAYLO_CREAM = "#F2E3D0";
const LOBBY_BG = "#E5ECEF"; 
const WOOD_COLOR = "#8b5a2b"; // Color cálido para las patas de madera

// ============================================================================
// COMPONENTE: El Arco Monolítico
// ============================================================================
const Arch = () => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-30, 0);
    s.lineTo(30, 0);
    s.lineTo(30, 30);
    s.lineTo(-30, 30);
    s.lineTo(-30, 0);

    const hole = new THREE.Path();
    hole.moveTo(-1.6, 0);
    hole.lineTo(-1.6, 3.8);
    hole.absarc(0, 3.8, 1.6, Math.PI, 0, true);
    hole.lineTo(1.6, 0);
    hole.lineTo(-1.6, 0);
    s.holes.push(hole);
    return s;
  }, []);

  const extrudeSettings = { depth: 2, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.01, bevelThickness: 0.01 };

  return (
    <mesh position={[0, 0, 0]} castShadow receiveShadow>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color={SAYLO_CREAM} roughness={0.9} metalness={0.01} />
    </mesh>
  );
};

// ============================================================================
// COMPONENTE: Sillas Lounge de Diseño (Curvadas y con patas de madera)
// ============================================================================
const LoungeChair = ({ position, rotationY }: { position: [number, number, number], rotationY?: number }) => {
  // Perfil curvado de la silla Lounge usando matemáticas
  const chairShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0); // Base trasera del asiento
    s.lineTo(0.5, 0); // Largo del asiento
    s.quadraticCurveTo(0.7, 0, 0.8, 0.2); // Curva hacia el respaldo
    s.lineTo(1.1, 0.9); // Alto del respaldo
    s.quadraticCurveTo(1.2, 1.1, 1.0, 1.2); // Tope redondeado del respaldo
    s.lineTo(0.9, 1.2); // Grosor
    s.lineTo(0.5, 0.2); // Bajada del respaldo
    s.lineTo(0, 0.2); // Vuelta al inicio
    s.lineTo(0, 0);
    return s;
  }, []);

  const extrudeSettings = { depth: 0.6, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };

  return (
    <group position={position} rotation={[0, rotationY || 0, 0]}>
      
      {/* Asiento y Respaldo (Color Crema Saylo) */}
      <mesh position={[-0.4, 0.3, -0.3]} castShadow>
        <extrudeGeometry args={[chairShape, extrudeSettings]} />
        <meshStandardMaterial color={SAYLO_CREAM} roughness={1} />
      </mesh>

      {/* Patas de madera estilo nórdico minimalista */}
      <mesh position={[-0.2, 0.15, 0.2]} castShadow>
         <cylinderGeometry args={[0.03, 0.02, 0.3]} />
         <meshStandardMaterial color={WOOD_COLOR} roughness={0.7} />
      </mesh>
      <mesh position={[-0.2, 0.15, -0.2]} castShadow>
         <cylinderGeometry args={[0.03, 0.02, 0.3]} />
         <meshStandardMaterial color={WOOD_COLOR} roughness={0.7} />
      </mesh>
      <mesh position={[0.25, 0.15, 0.2]} castShadow>
         <cylinderGeometry args={[0.03, 0.02, 0.3]} />
         <meshStandardMaterial color={WOOD_COLOR} roughness={0.7} />
      </mesh>
      <mesh position={[0.25, 0.15, -0.2]} castShadow>
         <cylinderGeometry args={[0.03, 0.02, 0.3]} />
         <meshStandardMaterial color={WOOD_COLOR} roughness={0.7} />
      </mesh>
    </group>
  );
};

// ============================================================================
// COMPONENTE: La mecánica de cámara
// ============================================================================
const Scene = ({ onReachEnd }: { onReachEnd: () => void }) => {
  const scroll = useScroll();
  const { camera } = useThree();
  const [hasFinished, setHasFinished] = useState(false);

  useFrame(() => {
    // Avanzamos desde z=12 cruzando el umbral (z=-12) para revelar las sillas
    const zPos = THREE.MathUtils.lerp(12, -12, scroll.offset);
    camera.position.set(0, 1.8, zPos); 

    if (scroll.offset > 0.98 && !hasFinished) {
      setHasFinished(true);
      onReachEnd();
    }
  });

  return (
    <>
      {/* CIELO REAL (Día Soleado sin texturas externas que rompan) */}
      <Sky sunPosition={[50, 10, 50]} turbidity={0.1} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />

      {/* ILUMINACIÓN */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 20, 15]} intensity={2} castShadow color="#ffeedb" shadow-bias={-0.0001} />
      <Environment preset="city" />

      <Arch />
      
      {/* NUEVAS SILLAS LOUNGE EN LA DISTANCIA */}
      <LoungeChair position={[-1.2, 0, -8]} rotationY={THREE.MathUtils.degToRad(120)} />
      <LoungeChair position={[1.5, 0, -8.5]} rotationY={THREE.MathUtils.degToRad(60)} />

      {/* SUELO (Seguro y funcional) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#4a5e3d" roughness={1} metalness={0} />
      </mesh>
    </>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export const Intro = ({ onFinish }: IntroProps) => {
  const [fadingOut, setFadingOut] = useState(false);

  const handleReachEnd = () => {
    setFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 800);
  };

  return (
    <div className="h-screen w-full overflow-hidden relative" style={{ backgroundColor: LOBBY_BG }}>
      <Canvas shadows camera={{ fov: 45 }} dpr={[1, 2]}>
        <ScrollControls pages={3} damping={0.2} infinite={false}>
          <Scene onReachEnd={handleReachEnd} />
        </ScrollControls>
      </Canvas>

      {/* TEXTO MINIMALISTA */}
      <div 
        className={`absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none z-20 transition-opacity duration-1000 ${fadingOut ? 'opacity-0' : 'opacity-100'}`}
        style={{ fontFamily: "'NeueHaasThin', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
      >
         <span className="text-black/40 text-[15px] tracking-[0.1em] font-bold">
            Scroll to enter Saylo
         </span>
         <div className="w-px h-10 bg-black/20"></div>
      </div>

      {/* TRANSICIÓN INVISIBLE */}
      <div 
        className={`absolute inset-0 z-50 pointer-events-none transition-opacity duration-700 ease-in-out ${fadingOut ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundColor: LOBBY_BG }}
      ></div>
    </div>
  );
};