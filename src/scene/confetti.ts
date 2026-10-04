import * as THREE from 'three'
import { C } from './helpers'
import { GROUND } from './layout'

interface Piece {
  vy: number
  vx: number
  rs: [number, number, number]
}

export interface Confetti {
  pieces: THREE.Mesh[]
  active: boolean
}

export function buildConfetti(world: THREE.Group): Confetti {
  const mats = [0xff5d73, 0xffc93c, 0x4fc3f7, 0x7ed957, 0xb98cff].map((c) => new THREE.MeshBasicMaterial({ color: C(c), side: THREE.DoubleSide }))
  const geo = new THREE.PlaneGeometry(0.14, 0.08)
  const pieces: THREE.Mesh[] = []
  for (let i = 0; i < 90; i++) {
    const c = new THREE.Mesh(geo, mats[i % 5]!)
    c.visible = false
    world.add(c)
    pieces.push(c)
  }
  return { pieces, active: false }
}

/** Kaşifin üstünden konfeti saç. */
export function spawnConfetti(cf: Confetti) {
  cf.active = true
  for (const c of cf.pieces) {
    c.visible = true
    c.position.set(-5 + (Math.random() - 0.5) * 3, 3 + Math.random() * 2.5, -0.6 + (Math.random() - 0.5) * 3)
    c.userData = { vy: -0.6 - Math.random(), vx: (Math.random() - 0.5) * 0.8, rs: [Math.random() * 6, Math.random() * 6, Math.random() * 6] } satisfies Piece
  }
}

export function resetConfetti(cf: Confetti) {
  cf.active = false
  cf.pieces.forEach((c) => (c.visible = false))
}

export function updateConfetti(cf: Confetti, dt: number) {
  if (!cf.active) return
  for (const c of cf.pieces) {
    if (!c.visible) continue
    const u = c.userData as Piece
    c.position.y += u.vy * dt
    c.position.x += u.vx * dt
    c.rotation.x += u.rs[0] * dt
    c.rotation.y += u.rs[1] * dt
    c.rotation.z += u.rs[2] * dt
    if (c.position.y < GROUND) c.visible = false
  }
}
