import * as THREE from 'three'
import { CFG } from '@/config'

// Dünya yerelde x ekseninde kurulur, sonra `world` grubu 90° döndürülerek derinliğe çevrilir.
// Yerel +x = uzak taraf (kafes), yerel -x = yakın taraf (kaşif).

export const GROUND = 0.05
export const EDGE = 3.9 // kanyon kenarı

// Köprü
export const N_PLANKS = CFG.planks
export const XA = -3.75
export const XB = 3.75
export const SAG = 0.42
export const PLANK_STEP = (XB - XA) / N_PLANKS
/** Köprü sarkması: y = -0.12 - 0.42 · sin(π · konum) */
export const bridgeY = (x: number) => -0.12 - SAG * Math.sin((Math.PI * (x - XA)) / (XB - XA))
export const plankX = (i: number) => XA + PLANK_STEP * (i + 0.5)

// Kafes
export const CX = 6.2
export const BASE = 0.42
export const HC = 2.2
export const W2 = 1.05
export const D2 = 1.2
export const DW = 2 * D2 - 0.1

export const PUP_HOME = new THREE.Vector3(CX + 0.1, BASE, 0)
export const OWNER_HOME = new THREE.Vector3(-5.1, GROUND, -0.85)
