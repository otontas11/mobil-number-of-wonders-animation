import * as THREE from 'three'

// three r152+ renk yönetimi: new Color(hex) sRGB → lineer dönüşümünü kendisi yapar,
// r128 demosundaki convertSRGBToLinear() çağrısı artık gereksiz (çift dönüşüm olur).
export const C = (h: number) => new THREE.Color(h)

export const M = (h: number, o: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color: C(h), roughness: 0.85, ...o })

export type Adder = (
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  x?: number,
  y?: number,
  z?: number,
  parent?: THREE.Object3D,
) => THREE.Mesh

/** Gölgeli mesh ekleyen yardımcı; `parent` verilmezse `defaultParent` kullanılır. */
export function adder(defaultParent: THREE.Object3D): Adder {
  return (geo, mat, x = 0, y = 0, z = 0, parent = defaultParent) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, y, z)
    m.castShadow = true
    m.receiveShadow = true
    parent.add(m)
    return m
  }
}

export const S32 = (r: number) => new THREE.SphereGeometry(r, 32, 24)

export const noise3 = (x: number, y: number, z: number) =>
  Math.sin(x * 1.7 + z * 0.9) * 0.5 + Math.sin(y * 2.3 + x * 1.1) * 0.3 + Math.sin(z * 2.9 + y * 1.3 + x * 0.4) * 0.2

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k

export function easeOutBounce(x: number) {
  const n = 7.5625
  const d = 2.75
  if (x < 1 / d) return n * x * x
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375
  return n * (x -= 2.625 / d) * x + 0.984375
}
