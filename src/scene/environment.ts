import * as THREE from 'three'
import { adder, C, M, noise3 } from './helpers'
import { EDGE, GROUND } from './layout'

export interface Environment {
  clouds: THREE.Group[]
  streamMat: THREE.MeshStandardMaterial
}

/** Kanyon, dere, bitki örtüsü, harabe, dağlar ve bulutlar (doküman §2.3). */
export function buildEnvironment(world: THREE.Group, scene: THREE.Scene): Environment {
  const mesh = adder(world)

  // ---------- kayalıklar ----------
  const rockMat = M(0x9b8f7e, { flatShading: true, roughness: 0.95 })
  const rockDark = M(0x7c7264, { flatShading: true, roughness: 0.95 })
  const grassMat = M(0x6db347, { roughness: 0.9 })

  function cliff(x0: number, x1: number, top: number, bottom: number, d: number) {
    const w = x1 - x0, h = top - bottom, cx = (x0 + x1) / 2, cy = (top + bottom) / 2
    const g = new THREE.BoxGeometry(w, h, d, Math.ceil(w * 1.3), Math.ceil(h * 1.3), Math.ceil(d * 1.3))
    const p = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i)
      const wx = x + cx, wy = y + cy, isTop = y > h / 2 - 1e-3
      x += noise3(wx * 0.9, wy * 0.9, z * 0.9) * 0.4
      z += noise3(z * 0.8 + 3, wx * 0.8, wy * 0.8 + 1) * 0.4
      if (!isTop) y += noise3(wy, z, wx) * 0.25
      p.setXYZ(i, x, y, z)
    }
    g.computeVertexNormals()
    mesh(g, rockMat, cx, cy, 0)
    mesh(new THREE.BoxGeometry(w + 0.5, 0.3, d + 0.5), grassMat, cx, top - 0.1, 0)
    const lip = new THREE.SphereGeometry(0.32, 8, 6)
    const edgeX = x0 < 0 ? x1 : x0
    for (let z = -d / 2; z <= d / 2; z += 0.55) {
      const s = mesh(lip, grassMat, edgeX + (x0 < 0 ? 0.2 : -0.2), top - 0.14, z + (Math.random() - 0.5) * 0.2)
      s.scale.set(0.8, 0.45 + Math.random() * 0.3, 1)
    }
  }
  cliff(-22, -EDGE, 0, -7, 26)
  cliff(EDGE, 22, 0, -7, 26)

  const floor = mesh(new THREE.PlaneGeometry(8.5, 60), M(0x5d9a3e), 0, -6.4, 0)
  floor.rotation.x = -Math.PI / 2
  const streamMat = new THREE.MeshStandardMaterial({ color: C(0x63c3ee), roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 })
  const stream = mesh(new THREE.PlaneGeometry(2.2, 60), streamMat, 0, -6.35, 0)
  stream.rotation.x = -Math.PI / 2
  stream.castShadow = false
  for (let i = 0; i < 16; i++) {
    const r = mesh(
      new THREE.DodecahedronGeometry(0.25 + Math.random() * 0.35, 0),
      rockDark,
      (Math.random() < 0.5 ? -1 : 1) * (1.3 + Math.random() * 1.8),
      -6.3,
      -18 + Math.random() * 30,
    )
    r.rotation.set(Math.random(), Math.random(), Math.random())
  }

  // ---------- bitki örtüsü ----------
  const trunkMat = M(0x7a4e2b)
  const leafMats = [M(0x3f9a3a, { flatShading: true }), M(0x58b04a, { flatShading: true }), M(0x2f7d34, { flatShading: true })]
  const leafGeo = new THREE.IcosahedronGeometry(1, 1)

  function tree(x: number, z: number, s = 1) {
    const g = new THREE.Group()
    g.position.set(x, GROUND, z)
    world.add(g)
    mesh(new THREE.CylinderGeometry(0.14 * s, 0.22 * s, 1.8 * s, 7), trunkMat, 0, 0.9 * s, 0, g).rotation.z = (Math.random() - 0.5) * 0.15
    const n = 3 + Math.floor(Math.random() * 3)
    for (let i = 0; i < n; i++) {
      const l = mesh(leafGeo, leafMats[i % 3]!, (Math.random() - 0.5) * 0.9 * s, (1.9 + Math.random() * 0.8) * s, (Math.random() - 0.5) * 0.9 * s, g)
      const k = (0.6 + Math.random() * 0.4) * s
      l.scale.set(k, k * 0.85, k)
      l.rotation.set(Math.random(), Math.random(), 0)
    }
  }
  function bush(x: number, z: number, s = 1) {
    for (let i = 0; i < 3; i++) {
      const b = mesh(leafGeo, leafMats[(i + 1) % 3]!, x + (Math.random() - 0.5) * 0.6 * s, GROUND + 0.25 * s, z + (Math.random() - 0.5) * 0.5 * s)
      b.scale.setScalar((0.35 + Math.random() * 0.2) * s)
    }
  }
  const petal = [M(0xff7aa8), M(0xffd23f), M(0xffffff), M(0xb98cff)]
  const stemMat = M(0x4b8f35)
  const fHead = new THREE.SphereGeometry(0.09, 10, 8)
  const fStem = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 5)
  function flower(x: number, z: number) {
    mesh(fStem, stemMat, x, GROUND + 0.15, z).castShadow = false
    mesh(fHead, petal[Math.floor(Math.random() * 4)]!, x, GROUND + 0.32, z)
  }

  // uzak taraf (kafesin arkası ve yanları)
  ;([[9, -4], [11.5, -2.5], [13, 2], [10, 4.5], [14.5, -5.5], [16, 3.5], [8.2, 6.5], [12, -7.5], [8, -7]] as const).forEach(([x, z], i) => tree(x, z, 1 + (i % 4) * 0.2))
  ;([[7.6, -3], [8, 2.8], [5.4, -3.6], [5.6, 3.8]] as const).forEach(([x, z]) => bush(x, z, 1.2))
  // yakın taraf (kaşifin yanı) — kamerayı kapatmayacak kadar alçak
  ;([[-6, -4.6], [-8.5, -5.5], [-5.5, 4.4], [-8, 3.8], [-10, -1]] as const).forEach(([x, z]) => bush(x, z, 1.1))
  tree(-11, -6.5, 1.2)
  tree(-12.5, 5.5, 1.1)
  for (let i = 0; i < 70; i++) {
    const side = i % 2 ? 1 : -1, x = side * (4.4 + Math.random() * 8), z = -6 + Math.random() * 12
    if (Math.abs(z) < 2 && Math.abs(x) < 8) continue
    flower(x, z)
  }
  // çim tutamları tek çizim çağrısında (doküman §14)
  const tufts = new THREE.InstancedMesh(new THREE.ConeGeometry(0.05, 0.28, 4), M(0x4f9a34), 600)
  const dummy = new THREE.Object3D()
  let ti = 0
  while (ti < 600) {
    const side = Math.random() < 0.5 ? -1 : 1, x = side * (4.1 + Math.random() * 12), z = -8 + Math.random() * 16
    if (Math.abs(z) < 1.6 && Math.abs(x) < 8) continue
    dummy.position.set(x, GROUND + 0.12, z)
    dummy.rotation.set((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4)
    dummy.scale.setScalar(0.7 + Math.random() * 0.7)
    dummy.updateMatrix()
    tufts.setMatrixAt(ti++, dummy.matrix)
  }
  world.add(tufts)

  // harabe kemer kafesin arkasında
  const ruinMat = M(0xb7ab97, { flatShading: true })
  const vineMat = M(0x3c8f3a)
  mesh(new THREE.BoxGeometry(0.7, 3.4, 0.7), ruinMat, 9.6, 1.7, -1.6)
  mesh(new THREE.BoxGeometry(0.7, 3.4, 0.7), ruinMat, 9.6, 1.7, 1.6)
  mesh(new THREE.BoxGeometry(0.8, 0.6, 4), ruinMat, 9.6, 3.6, 0).rotation.x = 0.03
  for (let i = 0; i < 6; i++) mesh(leafGeo, vineMat, 9.2, 3.9, -1.8 + i * 0.7).scale.set(0.2, 0.2, 0.28)

  // dağlar ve bulutlar (sahne uzayında, uzakta)
  const mtnMats = [M(0x7fae8f, { flatShading: true }), M(0x8fbca0, { flatShading: true }), M(0x9cc6b8, { flatShading: true })]
  for (let i = 0; i < 9; i++) {
    const h = 12 + Math.random() * 10
    const m = mesh(new THREE.ConeGeometry(7 + Math.random() * 5, h, 6), mtnMats[i % 3]!, -36 + i * 9 + Math.random() * 4, h / 2 - 6, -48 - Math.random() * 12, scene)
    m.castShadow = m.receiveShadow = false
  }
  const cloudMat = new THREE.MeshStandardMaterial({ color: C(0xffffff), roughness: 1, flatShading: true, fog: false })
  const clouds: THREE.Group[] = []
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group()
    g.position.set(-30 + i * 12, 14 + Math.random() * 4, -40 - Math.random() * 8)
    for (let j = 0; j < 5; j++) {
      const s = new THREE.Mesh(leafGeo, cloudMat)
      s.position.set(j * 1.4 - 2.8, Math.sin(j) * 0.5, 0)
      s.scale.setScalar(1.2 + Math.random() * 1.1)
      g.add(s)
    }
    scene.add(g)
    clouds.push(g)
  }

  return { clouds, streamMat }
}

export function updateEnvironment(env: Environment, t: number, dt: number) {
  env.clouds.forEach((c, i) => {
    c.position.x += dt * (0.25 + i * 0.05)
    if (c.position.x > 45) c.position.x = -45
  })
  env.streamMat.opacity = 0.8 + Math.sin(t * 2) * 0.05
}
