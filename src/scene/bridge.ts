import * as THREE from 'three'
import { PLANK } from '@/game/timeline'
import { adder, C, easeOutBounce, M } from './helpers'
import { bridgeY, N_PLANKS, PLANK_STEP, plankX, XA, XB } from './layout'

interface Dust {
  mat: THREE.MeshStandardMaterial
  puffs: THREE.Mesh[]
  x: number
  y: number
}

interface PlankData {
  t0: number
  baseY: number
  spin: number
}

export interface Bridge {
  planks: THREE.Group[]
  ghosts: THREE.Mesh[]
  ghostMat: THREE.MeshBasicMaterial
  dusts: Dust[]
}

/** Direkler, halatlar, hayalet tahtalar ve düşecek gerçek tahtalar (doküman §2.3, §6.1). */
export function buildBridge(world: THREE.Group): Bridge {
  const mesh = adder(world)
  const woodMat = M(0x8a5a32)
  const ropeMat = M(0xcfae78, { roughness: 1 })
  const plankCols = [0xa06a3b, 0x94602f, 0xad7845, 0x8b5a2d].map((c) => M(c, { roughness: 0.8 }))

  for (const x of [XA - 0.05, XB + 0.05])
    for (const z of [-0.9, 0.9]) {
      mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.25, 8), woodMat, x, 0.55, z)
      mesh(new THREE.SphereGeometry(0.12, 10, 8), ropeMat, x, 1.0, z)
    }
  function rope(fn: (x: number) => number, z: number, r: number) {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 24; i++) {
      const x = XA + ((XB - XA) * i) / 24
      pts.push(new THREE.Vector3(x, fn(x), z))
    }
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, r, 6), ropeMat)
  }
  for (const z of [-0.9, 0.9]) rope((x) => 1.0 + (bridgeY(x) + 0.12) * 0.7, z, 0.035)
  for (const z of [-0.66, 0.66]) rope((x) => bridgeY(x) - 0.07, z, 0.03)

  const planks: THREE.Group[] = []
  const ghosts: THREE.Mesh[] = []
  const dusts: Dust[] = []
  const plankGeo = new THREE.BoxGeometry(PLANK_STEP - 0.1, 0.11, 1.6)
  const connGeo = new THREE.CylinderGeometry(0.015, 0.015, 1, 4)
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false })
  const dustGeo = new THREE.SphereGeometry(0.08, 6, 5)

  for (let i = 0; i < N_PLANKS; i++) {
    const x = plankX(i), y = bridgeY(x)
    const gh = new THREE.Mesh(plankGeo, ghostMat)
    gh.position.set(x, y, 0)
    world.add(gh)
    ghosts.push(gh)

    const g = new THREE.Group()
    g.position.set(x, y, 0)
    world.add(g)
    mesh(plankGeo, plankCols[i % 4]!, 0, 0, 0, g).rotation.y = (Math.random() - 0.5) * 0.06
    const railY = 1.0 + (y + 0.12) * 0.7 - y
    for (const z of [-0.85, 0.85]) {
      const c = mesh(connGeo, ropeMat, 0, railY / 2, z, g)
      c.scale.y = railY
      c.castShadow = false
    }
    g.visible = false
    g.userData = { t0: 0, baseY: y, spin: (Math.random() - 0.5) * 1.2 } satisfies PlankData
    planks.push(g)

    const dm = new THREE.MeshStandardMaterial({ color: C(0xe8dcc4), transparent: true, opacity: 0, depthWrite: false })
    const puffs: THREE.Mesh[] = []
    for (let k = 0; k < 7; k++) {
      const p = new THREE.Mesh(dustGeo, dm)
      p.visible = false
      world.add(p)
      puffs.push(p)
    }
    dusts.push({ mat: dm, puffs, x, y })
  }

  return { planks, ghosts, ghostMat, dusts }
}

export function resetBridge(b: Bridge) {
  b.planks.forEach((p) => (p.visible = false))
  b.ghosts.forEach((g) => (g.visible = true))
  b.dusts.forEach((d) => d.puffs.forEach((p) => (p.visible = false)))
}

/** `i` numaralı tahtayı `t` anında düşürmeye başla. */
export function dropPlank(b: Bridge, i: number, t: number) {
  const pl = b.planks[i]
  if (!pl) return
  ;(pl.userData as PlankData).t0 = t
  pl.visible = true
}

/**
 * @param nextIndex sıradaki (henüz yerleşmemiş) hayalet tahtanın indeksi
 * @param wobbleT   yanlış cevap titremesinin kalan süresi
 */
export function updateBridge(b: Bridge, t: number, nextIndex: number, wobbleT: number) {
  b.planks.forEach((pl, i) => {
    if (!pl.visible) return
    const { t0, baseY, spin } = pl.userData as PlankData
    const age = t - t0
    const d = b.dusts[i]!
    const p = Math.min(1, age / PLANK.LAND_DUR)
    pl.position.y = baseY + (1 - easeOutBounce(p)) * PLANK.DROP_HEIGHT
    pl.rotation.z = (1 - p) * spin
    b.ghosts[i]!.visible = false
    const da = age - PLANK.DUST_START
    if (da > 0 && da < PLANK.DUST_DUR) {
      d.mat.opacity = 0.7 * (1 - da / PLANK.DUST_DUR)
      d.puffs.forEach((pf, k) => {
        const a = (k / d.puffs.length) * Math.PI * 2
        pf.visible = true
        pf.position.set(d.x + Math.cos(a) * (0.3 + da * 0.9), d.y + 0.05 + da * 0.4, Math.sin(a) * (0.5 + da * 0.9))
        pf.scale.setScalar(1 + da * 2.5)
      })
    } else d.puffs.forEach((pf) => (pf.visible = false))
  })
  b.ghosts.forEach((g, i) => {
    g.position.z = i === nextIndex && wobbleT > 0 ? Math.sin(t * 50) * 0.08 : 0
  })
  b.ghostMat.opacity = 0.16 + Math.sin(t * 3) * 0.06
}
