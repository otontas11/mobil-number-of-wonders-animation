import * as THREE from 'three'
import { TL } from '@/game/timeline'
import { adder, lerp, M } from './helpers'
import { BASE, CX, D2, DW, HC, W2 } from './layout'

export interface Cage {
  door: THREE.Group
  lock: THREE.Group
  shackle: THREE.Group
  spark: THREE.Sprite
}

const LOCK_POS = new THREE.Vector3(-0.12, 1.1, -DW - 0.02)

/** Taş kaide, paslı kafes, köprüye bakan kapı, pirinç kilit ve kıvılcım sprite'ı. */
export function buildCage(world: THREE.Group, scene: THREE.Scene): Cage {
  const mesh = adder(world)
  const stoneMat = M(0x8f8b84, { flatShading: true, roughness: 0.95 })
  mesh(new THREE.BoxGeometry(2.9, 0.22, 3.1), stoneMat, CX, 0.11, 0)
  mesh(new THREE.BoxGeometry(2.6, 0.2, 2.8), stoneMat, CX, 0.32, 0)

  const rust = M(0x7a6f63, { metalness: 0.55, roughness: 0.6 })
  const rustDark = M(0x5a5147, { metalness: 0.5, roughness: 0.65 })
  for (const dx of [-W2, W2]) for (const dz of [-D2, D2]) mesh(new THREE.BoxGeometry(0.18, HC, 0.18), rust, CX + dx, BASE + HC / 2, dz)
  for (const dx of [-W2, W2]) {
    mesh(new THREE.BoxGeometry(0.16, 0.16, 2 * D2 + 0.2), rust, CX + dx, BASE + HC, 0)
    mesh(new THREE.BoxGeometry(0.14, 0.14, 2 * D2), rustDark, CX + dx, BASE + 0.08, 0)
  }
  for (const dz of [-D2, D2]) {
    mesh(new THREE.BoxGeometry(2 * W2, 0.16, 0.16), rust, CX, BASE + HC, dz)
    mesh(new THREE.BoxGeometry(2 * W2, 0.14, 0.14), rustDark, CX, BASE + 0.08, dz)
  }
  mesh(new THREE.BoxGeometry(2 * W2 + 0.3, 0.1, 2 * D2 + 0.3), rustDark, CX, BASE + HC + 0.12, 0)
  const barGeo = new THREE.CylinderGeometry(0.045, 0.045, HC - 0.1, 8)
  for (let k = 1; k <= 5; k++) mesh(barGeo, rust, CX + W2, BASE + HC / 2, -D2 + k * ((2 * D2) / 6))
  for (const dz of [-D2, D2]) for (let k = 1; k <= 3; k++) mesh(barGeo, rust, CX - W2 + k * ((2 * W2) / 4), BASE + HC / 2, dz)

  // kapı: yerel -x yüzünde, +z kenarından menteşeli
  const door = new THREE.Group()
  door.position.set(CX - W2 - 0.02, BASE, D2 - 0.02)
  world.add(door)
  for (let k = 1; k <= 5; k++) mesh(barGeo, rust, 0, HC / 2, -k * (DW / 6), door)
  mesh(new THREE.BoxGeometry(0.12, 0.13, DW), rust, 0, 0.2, -DW / 2, door)
  mesh(new THREE.BoxGeometry(0.12, 0.13, DW), rust, 0, HC - 0.2, -DW / 2, door)
  mesh(new THREE.BoxGeometry(0.12, HC - 0.1, 0.12), rust, 0, HC / 2, -DW + 0.02, door)

  const lock = new THREE.Group()
  lock.position.copy(LOCK_POS)
  lock.rotation.y = -Math.PI / 2
  door.add(lock)
  const brass = M(0xc9a35a, { metalness: 0.75, roughness: 0.35 })
  const brassDark = M(0x8b6d34, { metalness: 0.6, roughness: 0.5 })
  mesh(new THREE.BoxGeometry(0.34, 0.32, 0.12), brass, 0, 0, 0, lock)
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12), M(0x2a1e0e), 0, -0.02, 0.065, lock).rotation.x = Math.PI / 2
  const shackle = new THREE.Group()
  shackle.position.set(0.1, 0.16, 0)
  lock.add(shackle)
  mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 18, Math.PI), brassDark, -0.1, 0, 0, shackle)

  // kıvılcım: canvas'tan dört köşeli yıldız dokusu
  const cv = document.createElement('canvas')
  cv.width = cv.height = 128
  const g = cv.getContext('2d')!
  g.translate(64, 64)
  g.fillStyle = '#fff6b0'
  for (let i = 0; i < 4; i++) {
    g.rotate(Math.PI / 4)
    g.beginPath()
    g.moveTo(0, -60)
    g.lineTo(8, 0)
    g.lineTo(0, 60)
    g.lineTo(-8, 0)
    g.fill()
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  const spark = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, color: 0xffe066, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  spark.visible = false
  scene.add(spark)

  return { door, lock, shackle, spark }
}

export function resetCage(c: Cage) {
  c.door.rotation.y = 0
  c.lock.visible = true
  c.lock.position.copy(LOCK_POS)
  c.lock.rotation.set(0, -Math.PI / 2, 0)
  c.shackle.rotation.set(0, 0, 0)
}

const lockWorld = new THREE.Vector3()
const off = new THREE.Vector3()

interface CageCtx {
  t: number
  dt: number
  rescued: boolean
  rt: number
  keyPhase: boolean
  sadT: number
}

/** Kilit kıvılcımı, kırılma, kapının açılması (doküman §6.2). */
export function updateCage(c: Cage, { t, dt, rescued, rt, keyPhase, sadT }: CageCtx) {
  c.lock.getWorldPosition(lockWorld)
  const sparkMat = c.spark.material
  if (rescued && rt < TL.SPARK_END) {
    const p = rt / TL.SPARK_END
    c.spark.visible = true
    c.spark.position.copy(lockWorld).add(off.set(0.2, 0.15, 0.25))
    c.spark.scale.setScalar(0.3 + Math.sin(p * Math.PI) * 1.3)
    sparkMat.rotation = p * 2
  } else if (keyPhase) {
    const p = (t % 1.6) / 1.6
    c.spark.visible = p < 0.4
    c.spark.position.copy(lockWorld).add(off.set(0.2, 0.15, 0.25))
    c.spark.scale.setScalar(Math.sin((p / 0.4) * Math.PI) * 0.6)
    sparkMat.rotation = t
  } else c.spark.visible = false

  // kilit aşamasında yanlış cevap: kilit titrer
  c.lock.position.z = sadT > 0.6 && keyPhase ? LOCK_POS.z + Math.sin(t * 60) * 0.015 : LOCK_POS.z

  let doorTarget = 0
  if (rescued) {
    c.shackle.rotation.z = lerp(c.shackle.rotation.z, 1, Math.min(1, dt * 6))
    const q = Math.max(0, Math.min(1, (rt - TL.LOCK_BREAK) / 0.7))
    c.lock.position.y = LOCK_POS.y - q * q * LOCK_POS.y
    c.lock.rotation.z = q * 2.4
    c.lock.visible = q < 1
    if (rt > TL.DOOR_OPEN) doorTarget = -1.9
  }
  c.door.rotation.y = lerp(c.door.rotation.y, doorTarget, Math.min(1, dt * 3))
}
