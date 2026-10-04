import * as THREE from 'three'
import type { FrameCtx } from './frame'
import { adder, C, lerp, M, S32 } from './helpers'
import { PUP_HOME } from './layout'

export interface PuppyRig {
  root: THREE.Group
  body: THREE.Group
  legs: THREE.Group[] // [ön sol, ön sağ, arka sol, arka sağ]
  tail: THREE.Group
  head: THREE.Group
  eyes: THREE.Group[]
  brows: THREE.Mesh[]
  ears: THREE.Group[]
  smile: THREE.Mesh
  frown: THREE.Mesh
  tongue: THREE.Mesh
  bang: THREE.Group // başının üstündeki ünlemler
  blink: number
}

/**
 * Prosedürel yavru köpek (doküman §2.2). GLB modeli gelince burası GLTFLoader ile
 * değişir, davranış `updatePuppy` içinde kalır (doküman §13).
 */
export function createPuppy(world: THREE.Group): PuppyRig {
  const mesh = adder(world)
  const fur = M(0xb9692f, { roughness: 0.95 })
  const white = M(0xfff8ee, { roughness: 0.95 })
  const earM = M(0x9c5427, { roughness: 0.95 })
  const noseM = M(0x24160f, { roughness: 0.25 })
  const irisM = M(0x6a3a17, { roughness: 0.2 })
  const pupilM = M(0x0c0806, { roughness: 0.1 })
  const eyeW = new THREE.MeshPhysicalMaterial({ color: C(0xffffff), roughness: 0.12, clearcoat: 1 })
  const shine = new THREE.MeshBasicMaterial({ color: 0xffffff })
  const blushM = M(0xff9fb0, { transparent: true, opacity: 0.5 })
  const tongueM = M(0xf26d7d, { roughness: 0.5 })

  const root = new THREE.Group()
  root.rotation.order = 'YXZ'
  world.add(root)
  const body = new THREE.Group()
  root.add(body)
  mesh(S32(0.5), fur, 0, 0.56, -0.05, body).scale.set(0.85, 0.82, 1.1)
  mesh(S32(0.34), white, 0, 0.55, 0.26, body).scale.set(1, 1.05, 0.85)
  ;([[-0.12, 0.74, 0.3], [0.12, 0.74, 0.3], [0, 0.82, 0.27], [-0.08, 0.4, 0.34], [0.08, 0.4, 0.34]] as const).forEach(([x, y, z]) => mesh(S32(0.13), white, x, y, z, body))

  const legs: THREE.Group[] = []
  for (const [x, z] of [[-0.22, 0.26], [0.22, 0.26], [-0.22, -0.32], [0.22, -0.32]] as const) {
    const lg = new THREE.Group()
    lg.position.set(x, 0.42, z)
    body.add(lg)
    mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.38, 12), z > 0 ? white : fur, 0, -0.19, 0, lg)
    mesh(S32(0.125), white, 0, -0.38, 0.04, lg).scale.set(1, 0.62, 1.25)
    legs.push(lg)
  }
  const tail = new THREE.Group()
  tail.position.set(0, 0.7, -0.55)
  body.add(tail)
  mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.38, 10), fur, 0, 0.18, 0, tail)
  mesh(S32(0.11), white, 0, 0.4, 0, tail).scale.set(1, 1.3, 1)

  const head = new THREE.Group()
  head.position.set(0, 1.08, 0.32)
  body.add(head)
  mesh(S32(0.5), white, 0, 0, 0, head).scale.set(1.08, 0.96, 0.98)
  for (const s of [-1, 1]) mesh(S32(0.36), fur, s * 0.23, 0.1, 0.02, head).scale.set(0.95, 1, 1.05)
  mesh(S32(0.29), white, 0, -0.14, 0.33, head).scale.set(1.2, 0.85, 0.95)
  mesh(S32(0.09), noseM, 0, -0.04, 0.61, head).scale.set(1.3, 0.95, 1)
  mesh(S32(0.022), shine, 0.03, -0.01, 0.69, head)

  const eyes: THREE.Group[] = [], brows: THREE.Mesh[] = [], ears: THREE.Group[] = []
  for (const s of [-1, 1]) {
    const e = new THREE.Group()
    e.position.set(s * 0.21, 0.07, 0.4)
    head.add(e)
    mesh(S32(0.14), eyeW, 0, 0, 0, e).scale.set(1, 1.12, 0.6)
    mesh(S32(0.1), irisM, 0, -0.012, 0.055, e).scale.set(1, 1.12, 0.5)
    mesh(S32(0.058), pupilM, 0, -0.012, 0.088, e)
    mesh(S32(0.032), shine, 0.04, 0.05, 0.104, e)
    mesh(S32(0.015), shine, -0.035, -0.05, 0.1, e)
    eyes.push(e)
    brows.push(mesh(new THREE.BoxGeometry(0.14, 0.032, 0.03), earM, s * 0.21, 0.27, 0.43, head))
    mesh(S32(0.07), blushM, s * 0.32, -0.12, 0.33, head).scale.set(1, 0.6, 0.4)
    const ear = new THREE.Group()
    ear.position.set(s * 0.44, 0.22, -0.04)
    head.add(ear)
    const e1 = mesh(S32(0.22), earM, s * 0.04, -0.3, 0, ear)
    e1.scale.set(0.52, 1.45, 0.85)
    e1.rotation.z = s * 0.12
    mesh(S32(0.16), earM, s * 0.08, -0.58, 0.02, ear).scale.set(0.6, 1, 0.8)
    ears.push(ear)
  }
  const smile = mesh(new THREE.TorusGeometry(0.07, 0.017, 8, 20, Math.PI), noseM, 0, -0.21, 0.54, head)
  smile.rotation.z = Math.PI
  const frown = mesh(new THREE.TorusGeometry(0.05, 0.015, 8, 20, Math.PI), noseM, 0, -0.25, 0.54, head)
  const tongue = mesh(S32(0.06), tongueM, 0, -0.28, 0.51, head)
  tongue.scale.set(0.9, 0.55, 0.4)

  const bang = new THREE.Group()
  bang.position.set(0.35, 0.75, 0)
  head.add(bang)
  const yMat = new THREE.MeshBasicMaterial({ color: C(0xffd23f) })
  ;([[-0.1, 0.1, 0.35], [0.12, 0, -0.35]] as const).forEach(([x, y, r]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.04), yMat)
    b.position.set(x, y, 0)
    b.rotation.z = r
    bang.add(b)
  })
  bang.visible = false

  return { root, body, legs, tail, head, eyes, brows, ears, smile, frown, tongue, bang, blink: 2 }
}

export function resetPuppy(P: PuppyRig) {
  P.root.position.copy(PUP_HOME)
  P.root.rotation.set(0, -1.3, 0)
}

/** Köpek davranışları (doküman §7.1). */
export function updatePuppy(P: PuppyRig, c: FrameCtx) {
  const { t, dt, rescued, rt, keyPhase, hugging, cheerT, sadT, prog, walk } = c
  P.blink -= dt
  if (P.blink < -0.13) P.blink = 2 + Math.random() * 3

  // happy = 0.1 + (placed/8)·0.8 (+0.2 sevinç, −0.15 yanlış), kurtarmada 1
  const happy = rescued ? 1 : Math.min(1, 0.1 + prog * 0.8 + (cheerT > 0 ? 0.2 : 0) - (sadT > 0 ? 0.15 : 0))
  const eyeS = hugging ? 0.3 : P.blink < 0 ? 0.1 : 1
  P.eyes.forEach((e) => (e.scale.y = lerp(e.scale.y, eyeS, 0.45)))
  const sad = Math.max(0, 1 - happy) * 0.45
  P.brows[0]!.rotation.z = lerp(P.brows[0]!.rotation.z, -sad, 0.15)
  P.brows[1]!.rotation.z = lerp(P.brows[1]!.rotation.z, sad, 0.15)
  P.smile.visible = happy > 0.4
  P.frown.visible = happy <= 0.25
  P.tongue.visible = happy > 0.8
  P.bang.visible = keyPhase
  if (keyPhase) P.bang.scale.setScalar(1 + Math.sin(t * 8) * 0.1)
  P.ears.forEach((e, i) => (e.rotation.z = lerp(e.rotation.z, (i ? 1 : -1) * (sad * 0.5 - (cheerT > 0 ? Math.sin(t * 16) * 0.12 : 0)), 0.2)))
  P.tail.rotation.set(-0.8 + (1 - happy) * 0.9, 0, Math.sin(t * (2 + happy * 16)) * (0.2 + happy * 0.5))

  let pLeg = 0
  if (!rescued || rt < walk.start) {
    // kafeste bekleme / zıplama
    const hop = rescued || keyPhase ? Math.abs(Math.sin(t * 9)) * 0.25 : cheerT > 0 ? Math.abs(Math.sin(t * 10)) * 0.2 * Math.min(1, cheerT) : 0
    P.root.position.set(PUP_HOME.x, PUP_HOME.y + hop, PUP_HOME.z)
    // yüzü köprüye ve kaşife dönük (yerel -x), hafif kameraya
    P.root.rotation.y = lerp(P.root.rotation.y, cheerT > 0 || keyPhase || rescued ? -1.45 : -1.25 + Math.sin(t * 0.5) * 0.25, 0.08)
    P.head.rotation.x = lerp(P.head.rotation.x, prog < 0.25 ? 0.12 : -0.08, 0.1)
    P.root.rotation.x = 0
  } else if (!hugging) {
    // köprü boyunca hoplayarak yürüyüş
    const u = Math.min(1, (rt - walk.start) / walk.dur)
    const p = walk.curve.getPointAt(u)
    const tg = walk.curve.getTangentAt(u)
    pLeg = Math.sin(t * 15) * 0.6
    P.root.position.copy(p)
    P.root.position.y += Math.abs(Math.sin(t * 15)) * 0.06
    P.root.rotation.y = lerp(P.root.rotation.y, Math.atan2(tg.x, tg.z), 0.2)
  } else {
    // sarılma: arka ayaklar üstünde doğrulur
    const end = walk.curve.getPointAt(1)
    P.root.position.set(end.x, end.y + 0.18 + Math.abs(Math.sin(t * 5)) * 0.06, end.z)
    P.root.rotation.y = lerp(P.root.rotation.y, -2.85, 0.1)
    P.root.rotation.x = lerp(P.root.rotation.x, -0.45, 0.1)
    P.head.rotation.set(0.2, 0.3, Math.sin(t * 3) * 0.08)
    pLeg = 0
    P.legs[0]!.rotation.x = P.legs[1]!.rotation.x = -1.2
  }
  if (!hugging) {
    P.legs[0]!.rotation.x = pLeg
    P.legs[1]!.rotation.x = -pLeg
  }
  P.legs[3]!.rotation.x = pLeg
  P.legs[2]!.rotation.x = -pLeg
}
