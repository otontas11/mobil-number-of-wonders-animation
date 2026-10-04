import * as THREE from 'three'
import type { FrameCtx } from './frame'
import { adder, C, lerp, M, S32 } from './helpers'
import { OWNER_HOME } from './layout'

export interface ExplorerRig {
  root: THREE.Group
  body: THREE.Group
  legs: THREE.Group[]
  arms: THREE.Group[] // [sol, sağ]
  head: THREE.Group
  eyes: THREE.Group[]
  smile: THREE.Mesh
  blink: number
}

/**
 * Prosedürel kaşif (demo sürümündeki çocuk figürü). Doküman §2.1'deki safari şapkalı
 * kaşif GLB modeli gelince burası GLTFLoader ile değişir, davranış `updateExplorer`'da kalır.
 */
export function createExplorer(world: THREE.Group): ExplorerRig {
  const mesh = adder(world)
  const skin = M(0xffe1c6, { roughness: 0.9 })
  const hair = M(0x5b3a22, { roughness: 0.8 })
  const shirt = M(0x2fa39b, { roughness: 0.9 })
  const shorts = M(0x2f4f8f, { roughness: 0.9 })
  const shoe = M(0xf4f4f4, { roughness: 0.7 })
  const sole = M(0xe2453c)
  const irisM = M(0x4a2c14, { roughness: 0.2 })
  const pupilM = M(0x0c0806)
  const shine = new THREE.MeshBasicMaterial({ color: 0xffffff })
  const eyeW = new THREE.MeshPhysicalMaterial({ color: C(0xffffff), roughness: 0.12, clearcoat: 1 })
  const blushM = M(0xff9fb0, { transparent: true, opacity: 0.55 })
  const mouthM = M(0x6a2a20)
  const leash = M(0xe2453c, { roughness: 0.6 })

  const root = new THREE.Group()
  root.rotation.order = 'YXZ'
  world.add(root)
  const body = new THREE.Group()
  root.add(body)

  const legs: THREE.Group[] = []
  for (const s of [-1, 1]) {
    const lg = new THREE.Group()
    lg.position.set(s * 0.17, 0.55, 0)
    body.add(lg)
    mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.36, 12), skin, 0, -0.2, 0, lg)
    mesh(S32(0.15), shoe, 0, -0.42, 0.06, lg).scale.set(1, 0.65, 1.4)
    mesh(new THREE.BoxGeometry(0.28, 0.04, 0.42), sole, 0, -0.49, 0.06, lg)
    legs.push(lg)
  }
  mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.26, 20), shorts, 0, 0.62, 0, body)
  mesh(S32(0.4), shirt, 0, 0.98, 0, body).scale.set(1, 1.08, 0.85)
  mesh(S32(0.2), shirt, 0, 1.3, -0.22, body).scale.set(1.3, 0.7, 0.8)

  const arms: THREE.Group[] = []
  for (const s of [-1, 1]) {
    const a = new THREE.Group()
    a.position.set(s * 0.4, 1.2, 0)
    body.add(a)
    mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.3, 12), shirt, 0, -0.13, 0, a)
    mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.2, 12), skin, 0, -0.36, 0, a)
    mesh(S32(0.1), skin, 0, -0.5, 0, a)
    a.rotation.z = s * 0.2
    arms.push(a)
  }
  const coil = mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 20), leash, 0, -0.5, 0.1, arms[0]!)
  coil.rotation.y = Math.PI / 2

  const head = new THREE.Group()
  head.position.set(0, 1.78, 0.03)
  body.add(head)
  mesh(S32(0.5), skin, 0, 0, 0, head).scale.set(1.04, 0.96, 0.95)
  mesh(S32(0.53), hair, 0, 0.1, -0.1, head).scale.set(1.06, 0.92, 1)
  ;([[-0.24, 0.3, 0.32], [0, 0.36, 0.36], [0.24, 0.3, 0.32], [-0.38, 0.1, 0.2], [0.38, 0.1, 0.2]] as const).forEach(([x, y, z]) =>
    mesh(S32(0.15), hair, x, y, z, head).scale.set(1.2, 0.7, 0.8),
  )
  for (const s of [-1, 1]) mesh(S32(0.08), skin, s * 0.5, -0.02, 0, head)
  const eyes: THREE.Group[] = []
  for (const s of [-1, 1]) {
    const e = new THREE.Group()
    e.position.set(s * 0.18, -0.02, 0.41)
    head.add(e)
    mesh(S32(0.11), eyeW, 0, 0, 0, e).scale.set(1, 1.15, 0.55)
    mesh(S32(0.078), irisM, 0, -0.01, 0.05, e).scale.set(1, 1.15, 0.5)
    mesh(S32(0.045), pupilM, 0, -0.01, 0.075, e)
    mesh(S32(0.024), shine, 0.03, 0.035, 0.09, e)
    eyes.push(e)
    mesh(S32(0.07), blushM, s * 0.3, -0.16, 0.34, head).scale.set(1, 0.6, 0.4)
  }
  const smile = mesh(new THREE.TorusGeometry(0.075, 0.02, 8, 20, Math.PI), mouthM, 0, -0.19, 0.44, head)
  smile.rotation.z = Math.PI
  root.scale.setScalar(0.95)

  return { root, body, legs, arms, head, eyes, smile, blink: 3.2 }
}

export function resetExplorer(O: ExplorerRig) {
  O.root.position.copy(OWNER_HOME)
  O.root.rotation.set(0, 1.4, 0)
}

/** Kaşif davranışları (doküman §7.2). */
export function updateExplorer(O: ExplorerRig, c: FrameCtx) {
  const { t, dt, rescued, rt, hugging, cheerT, walk } = c
  O.blink -= dt
  if (O.blink < -0.13) O.blink = 2.5 + Math.random() * 3
  O.eyes.forEach((e) => (e.scale.y = lerp(e.scale.y, hugging ? 0.3 : O.blink < 0 ? 0.1 : 1, 0.45)))

  if (!hugging) {
    const cheer = cheerT > 0 || (rescued && rt < walk.start + 1)
    const watching = rescued
    const hop = cheer ? Math.abs(Math.sin(t * 9)) * 0.16 : 0
    O.root.position.set(OWNER_HOME.x, OWNER_HOME.y + hop, OWNER_HOME.z)
    // normalde köprüye bakar; sevinirken oyuncuya döner
    const face = cheer && !watching ? -0.9 : watching ? 1.1 : 1.25 + Math.sin(t * 0.4) * 0.15
    O.root.rotation.y = lerp(O.root.rotation.y, face, 0.08)
    const wave = !cheer && !watching && Math.sin(t * 0.7) > 0.55
    O.arms[1]!.rotation.x = lerp(O.arms[1]!.rotation.x, 0, 0.15)
    O.arms[1]!.rotation.z = lerp(O.arms[1]!.rotation.z, cheer ? 2.7 : wave ? 2.5 + Math.sin(t * 10) * 0.35 : 0.2, 0.15)
    O.arms[0]!.rotation.x = lerp(O.arms[0]!.rotation.x, watching ? -1 : 0, 0.15)
    O.arms[0]!.rotation.z = lerp(O.arms[0]!.rotation.z, cheer ? -2.7 : watching ? 0.3 : -0.2, 0.15)
    O.head.rotation.z = lerp(O.head.rotation.z, wave ? 0.12 : 0, 0.1)
    O.root.rotation.x = 0
    O.smile.scale.set(cheer || watching ? 1.3 : 1, cheer || watching ? 1.25 : 1, 1)
  } else {
    // sarılma: kollarını köpeğe sarar
    O.root.position.set(OWNER_HOME.x, OWNER_HOME.y + Math.abs(Math.sin(t * 5)) * 0.05, OWNER_HOME.z)
    O.root.rotation.y = lerp(O.root.rotation.y, -0.4, 0.1)
    O.root.rotation.x = lerp(O.root.rotation.x, 0.12, 0.08)
    O.arms[0]!.rotation.x = lerp(O.arms[0]!.rotation.x, -1.35, 0.12)
    O.arms[0]!.rotation.z = lerp(O.arms[0]!.rotation.z, 0.6, 0.12)
    O.arms[1]!.rotation.x = lerp(O.arms[1]!.rotation.x, -1.35, 0.12)
    O.arms[1]!.rotation.z = lerp(O.arms[1]!.rotation.z, -0.6, 0.12)
    O.head.rotation.set(0.12, 0.25, Math.sin(t * 3) * 0.06)
    O.smile.scale.set(1.35, 1.3, 1)
  }
  O.legs[0]!.rotation.x = 0
  O.legs[1]!.rotation.x = 0
}
