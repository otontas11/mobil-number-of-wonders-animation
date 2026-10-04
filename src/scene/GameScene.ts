import * as THREE from 'three'
import { CFG, REDUCE_MOTION } from '@/config'
import { TL } from '@/game/timeline'
import type { SceneEvent, SceneHandle, SceneListener } from '@/game/types'
import { buildBridge, dropPlank, resetBridge, updateBridge } from './bridge'
import { buildCage, resetCage, updateCage } from './cage'
import { buildConfetti, resetConfetti, spawnConfetti, updateConfetti } from './confetti'
import { buildEnvironment, updateEnvironment } from './environment'
import { createExplorer, resetExplorer, updateExplorer } from './explorer'
import type { FrameCtx } from './frame'
import { C, lerp } from './helpers'
import { BASE, bridgeY, CX, GROUND, N_PLANKS, plankX, PUP_HOME, W2, XA, XB } from './layout'
import { createPuppy, resetPuppy, updatePuppy } from './puppy'

/** Sahnenin her karede okuduğu oyun durumu (Pinia store'u bu arayüzü sağlar). */
export interface SceneSource {
  readonly solved: number
  readonly placed: number
}

/**
 * three.js renderer, kamera ve oyun döngüsü — Vue reaktivitesinin dışında (doküman §11.2).
 * Vue tarafı `SceneHandle` metotlarıyla komut verir, sahne `SceneEvent` ile geri bildirir.
 */
export class GameScene implements SceneHandle {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly world = new THREE.Group()
  private readonly camera = new THREE.PerspectiveCamera(46, 9 / 12, 0.1, 200)

  private readonly env
  private readonly bridge
  private readonly cage
  private readonly pup
  private readonly owner
  private readonly confetti

  private readonly walkCurve: THREE.CatmullRomCurve3
  private readonly walkDur: number
  /** Sarılma anı: WALK_START + yolUzunluğu / walkSpeed (doküman §6.2) */
  readonly hugAt: number

  // animasyon sayaçları (sn)
  private t = 0
  private last = performance.now()
  private rescued = false
  private rescueT = 0
  private cheerT = 0
  private sadT = 0
  private hintT = 0
  private wobbleT = 0
  private lastStep = 0
  private fired = new Set<string>()

  private camDist = 1
  private readonly look = new THREE.Vector3(0, 0.3, -0.8)
  private readonly tmp = new THREE.Vector3()

  private raf = 0
  private readonly ro: ResizeObserver
  private readonly listeners = new Set<SceneListener>()
  private readonly container: HTMLElement
  private readonly src: SceneSource

  constructor(container: HTMLElement, src: SceneSource) {
    this.container = container
    this.src = src
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)) // doküman §14
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap // PCFSoft r186'da kaldırıldı
    container.prepend(this.renderer.domElement)

    this.scene.fog = new THREE.Fog(C(0xd9efe4), 26, 80)
    this.world.rotation.y = Math.PI / 2
    this.scene.add(this.world)

    this.scene.add(new THREE.HemisphereLight(C(0xcfe9ff), C(0x5f8a3a), 0.8))
    const sun = new THREE.DirectionalLight(C(0xfff0d2), 2.4)
    sun.position.set(-8, 13, 6)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.bias = -0.0004
    sun.shadow.normalBias = 0.02
    Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 14, bottom: -12, near: 1, far: 50 })
    this.scene.add(sun)
    const rim = new THREE.DirectionalLight(C(0xbfe3ff), 0.9)
    rim.position.set(6, 7, -10)
    this.scene.add(rim)

    this.env = buildEnvironment(this.world, this.scene)
    this.bridge = buildBridge(this.world)
    this.cage = buildCage(this.world, this.scene)
    this.pup = createPuppy(this.world)
    this.owner = createExplorer(this.world)
    this.confetti = buildConfetti(this.world)

    // kurtarma yolu: kafes → köprü (tahtalar üstünden) → kaşif
    const pts = [PUP_HOME.clone(), new THREE.Vector3(CX - W2 - 0.3, BASE, 0), new THREE.Vector3(XB + 0.25, GROUND, 0)]
    for (let i = N_PLANKS - 1; i >= 0; i--) {
      const x = plankX(i)
      pts.push(new THREE.Vector3(x, bridgeY(x) + 0.06, 0))
    }
    pts.push(new THREE.Vector3(XA - 0.25, GROUND, 0), new THREE.Vector3(-4.6, GROUND, -0.05), new THREE.Vector3(-4.95, GROUND, -0.1))
    this.walkCurve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
    this.walkDur = this.walkCurve.getLength() / CFG.walkSpeed
    this.hugAt = TL.WALK_START + this.walkDur

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(container)
    this.resize()
    this.reset()
    this.raf = requestAnimationFrame(this.frame)
  }

  // ---------- SceneHandle ----------

  reset() {
    this.rescued = false
    this.rescueT = this.cheerT = this.sadT = this.hintT = this.wobbleT = 0
    this.fired.clear()
    resetBridge(this.bridge)
    resetCage(this.cage)
    resetConfetti(this.confetti)
    resetPuppy(this.pup)
    resetExplorer(this.owner)
  }

  addPlank(index: number) {
    dropPlank(this.bridge, index, this.t)
  }

  cheer() {
    this.cheerT = 1.4
  }

  sad() {
    this.sadT = 1.1
    this.wobbleT = 0.5
  }

  hint() {
    this.hintT = TL.HINT
  }

  startRescue() {
    this.rescued = true
    this.rescueT = 0
    this.lastStep = this.t
    this.fired.clear()
  }

  // ---------- olaylar ----------

  on(fn: SceneListener) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit(e: SceneEvent) {
    this.listeners.forEach((fn) => fn(e))
  }

  private fireOnce(key: SceneEvent['type'], cond: boolean) {
    if (!cond || this.fired.has(key)) return false
    this.fired.add(key)
    return true
  }

  /** Dünya noktasını sahne kapsayıcısı içindeki piksel koordinatına çevirir. */
  private toScreen(v: THREE.Vector3) {
    const p = v.clone().project(this.camera)
    return { x: (p.x * 0.5 + 0.5) * this.container.clientWidth, y: (-p.y * 0.5 + 0.5) * this.container.clientHeight }
  }

  // ---------- döngü ----------

  private readonly frame = (now: number) => {
    const dt = Math.min(0.1, (now - this.last) / 1000) // arka plandan dönüşte sıçrama olmaz
    this.last = now
    this.t += dt
    const t = this.t
    if (this.rescued) this.rescueT += dt
    this.cheerT = Math.max(0, this.cheerT - dt)
    this.sadT = Math.max(0, this.sadT - dt)
    this.hintT = Math.max(0, this.hintT - dt)
    this.wobbleT = Math.max(0, this.wobbleT - dt)

    const rt = this.rescueT
    const rescued = this.rescued
    const keyPhase = this.src.solved >= N_PLANKS && !rescued
    const hugging = rescued && rt > this.hugAt

    updateBridge(this.bridge, t, this.src.placed, this.wobbleT)
    updateCage(this.cage, { t, dt, rescued, rt, keyPhase, sadT: this.sadT })

    const ctx: FrameCtx = {
      t, dt, rescued, rt, keyPhase, hugging,
      cheerT: this.cheerT,
      sadT: this.sadT,
      hintT: this.hintT,
      prog: this.src.placed / N_PLANKS,
      walk: { curve: this.walkCurve, start: TL.WALK_START, dur: this.walkDur },
    }
    updatePuppy(this.pup, ctx)
    updateExplorer(this.owner, ctx)

    // kurtarma zaman çizelgesi olayları (doküman §6.2)
    if (rescued) {
      if (this.fireOnce('lockBreak', rt >= TL.LOCK_BREAK)) this.emit({ type: 'lockBreak' })
      if (this.fireOnce('doorCreak', rt >= TL.DOOR_CREAK)) this.emit({ type: 'doorCreak' })
      if (this.fireOnce('bark', rt >= TL.WALK_START)) this.emit({ type: 'bark' })
      if (rt >= TL.WALK_START && !hugging && t - this.lastStep >= TL.STEP_INTERVAL) {
        this.lastStep = t
        this.emit({ type: 'step' })
      }
      if (this.fireOnce('hug', hugging)) {
        spawnConfetti(this.confetti)
        this.owner.root.getWorldPosition(this.tmp)
        this.tmp.y += 2.3
        this.tmp.x += 0.4
        this.emit({ type: 'hug', ...this.toScreen(this.tmp) })
      }
      if (this.fireOnce('finale', rt > this.hugAt + TL.FINALE_AFTER_HUG)) this.emit({ type: 'finale' })
    }

    updateConfetti(this.confetti, dt)
    updateEnvironment(this.env, t, dt)

    // kamera: kaşifin arkasından köprü boyunca kafese bakar; yürüyüşte köpeği izler
    let focusZ = -0.8
    if (rescued && rt > TL.WALK_START && !hugging) {
      this.pup.root.getWorldPosition(this.tmp)
      focusZ = Math.max(-0.8, Math.min(2.6, this.tmp.z * 0.55))
    }
    if (hugging) focusZ = 2.2
    this.look.z = lerp(this.look.z, focusZ, Math.min(1, dt * 1.3))
    const sway = REDUCE_MOTION ? 0 : Math.sin(t * 0.25) * 0.3
    this.camera.position.set(1.4 + sway, 7.2 * this.camDist, this.look.z + 13.2 * this.camDist)
    this.camera.lookAt(this.look)

    this.renderer.render(this.scene, this.camera)
    this.raf = requestAnimationFrame(this.frame)
  }

  private resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camDist = Math.max(0.85, Math.min(1.4, 0.82 / this.camera.aspect))
    this.camera.updateProjectionMatrix()
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    this.ro.disconnect()
    this.listeners.clear()
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Sprite) {
        o.geometry?.dispose()
        const m = o.material as THREE.Material | THREE.Material[]
        ;(Array.isArray(m) ? m : [m]).forEach((x) => x.dispose())
      }
    })
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
