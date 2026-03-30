// effects.js — Cyberpunk atmosphere: volumetric fog, neon glow, particles, rockets
import * as THREE from 'three';

export class EffectsManager {
  constructor(scene) {
    this.scene = scene;
    this.fires = [];
    this.sparkles = [];
    this.rockets = [];
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.cityLights = [];
  }

  createAtmosphere() {
    // Dark ambient — very dim, night city
    const ambient = new THREE.AmbientLight(0x0a0a20, 0.15);
    this.scene.add(ambient);

    // Moonlight — blue-ish directional
    const moon = new THREE.DirectionalLight(0x2244aa, 0.2);
    moon.position.set(80, 100, 40);
    moon.castShadow = true;
    moon.shadow.mapSize.width = 2048;
    moon.shadow.mapSize.height = 2048;
    moon.shadow.camera.near = 1;
    moon.shadow.camera.far = 300;
    moon.shadow.camera.left = -150;
    moon.shadow.camera.right = 150;
    moon.shadow.camera.top = 150;
    moon.shadow.camera.bottom = -150;
    this.scene.add(moon);

    // Hemisphere sky → ground color bleeding
    const hemi = new THREE.HemisphereLight(0x0a1030, 0x000005, 0.1);
    this.scene.add(hemi);

    // Dense exponential fog for depth
    this.scene.fog = new THREE.FogExp2(0x040810, 0.004);

    // Scattered neon point lights across the city
    this.createCityLights();

    // Stars
    this.createStarfield();

    // Ground glow (subtle upward light to simulate city light pollution)
    const groundGlow = new THREE.PointLight(0x1a2040, 3, 200);
    groundGlow.position.set(150, -5, 150);
    this.scene.add(groundGlow);
  }

  createCityLights() {
    const neonColors = [0x4488ff, 0x6644ff, 0x0088ff, 0x00aaff, 0x8844ff, 0x22ccff];
    const count = 30;

    for (let i = 0; i < count; i++) {
      const color = neonColors[Math.floor(Math.random() * neonColors.length)];
      const light = new THREE.PointLight(color, 1.5, 25);
      light.position.set(
        20 + Math.random() * 260,
        2 + Math.random() * 15,
        20 + Math.random() * 260
      );
      this.scene.add(light);
      this.cityLights.push({ light, baseIntensity: 1 + Math.random() * 2, phase: Math.random() * Math.PI * 2 });
    }

    // A few warm accent lights
    for (let i = 0; i < 8; i++) {
      const light = new THREE.PointLight(0xff6633, 1, 20);
      light.position.set(30 + Math.random() * 240, 1 + Math.random() * 5, 30 + Math.random() * 240);
      this.scene.add(light);
      this.cityLights.push({ light, baseIntensity: 0.8 + Math.random(), phase: Math.random() * Math.PI * 2 });
    }
  }

  createStarfield() {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Distribute on a large sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 200 + Math.random() * 200;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta) + 150;
      positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 30; // Only upper hemisphere
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) + 150;
      sizes[i] = 0.1 + Math.random() * 0.4;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.3,
      color: 0xccddff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);
  }

  // --- Fire (bugs) ---
  addFire(x, y, z, intensity = 1) {
    const count = Math.floor(30 * intensity);
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = x + (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = y + Math.random();
      positions[i * 3 + 2] = z + (Math.random() - 0.5) * 2;
      velocities.push({ vy: 1.5 + Math.random() * 3, life: Math.random() });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.5,
      color: 0xff4400,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geo, mat);
    this.group.add(points);

    const light = new THREE.PointLight(0xff3300, 3 * intensity, 12);
    light.position.set(x, y + 1, z);
    this.group.add(light);

    this.fires.push({ points, light, baseX: x, baseY: y, baseZ: z, velocities, count });
  }

  // --- Sparkles (new features) ---
  addSparkle(x, y, z) {
    const count = 20;
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      velocities.push({
        vx: (Math.random() - 0.5) * 4,
        vy: 3 + Math.random() * 5,
        vz: (Math.random() - 0.5) * 4,
        life: Math.random()
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.35,
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geo, mat);
    this.group.add(points);
    this.sparkles.push({ points, baseX: x, baseY: y, baseZ: z, velocities, count, time: 0 });
  }

  // --- Rockets ---
  launchRocket(x, z) {
    const rocketGeo = new THREE.ConeGeometry(0.4, 1.5, 6);
    const rocketMat = new THREE.MeshBasicMaterial({ color: 0xff8800 });
    const rocket = new THREE.Mesh(rocketGeo, rocketMat);
    rocket.position.set(x, 0, z);

    const trailCount = 50;
    const trailPos = new Float32Array(trailCount * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    const trailMat = new THREE.PointsMaterial({
      size: 0.6, color: 0xff6600, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const trail = new THREE.Points(trailGeo, trailMat);

    const light = new THREE.PointLight(0xff6600, 8, 25);
    light.position.copy(rocket.position);

    this.group.add(rocket);
    this.group.add(trail);
    this.group.add(light);

    this.rockets.push({
      mesh: rocket, trail, light, y: 0, speed: 20,
      baseX: x, baseZ: z, trailPositions: trailPos,
      trailIndex: 0, trailCount, alive: true
    });
  }

  // --- Update ---
  update(time, delta) {
    // City light flicker
    for (const cl of this.cityLights) {
      cl.light.intensity = cl.baseIntensity * (0.7 + 0.3 * Math.sin(time * 2 + cl.phase));
    }

    // Star twinkle
    if (this.stars) {
      this.stars.material.opacity = 0.3 + 0.15 * Math.sin(time * 0.4);
    }

    // Fires
    for (const fire of this.fires) {
      const pos = fire.points.geometry.attributes.position.array;
      for (let i = 0; i < fire.count; i++) {
        const v = fire.velocities[i];
        v.life += delta;
        if (v.life > 1) {
          pos[i * 3] = fire.baseX + (Math.random() - 0.5) * 2;
          pos[i * 3 + 1] = fire.baseY;
          pos[i * 3 + 2] = fire.baseZ + (Math.random() - 0.5) * 2;
          v.life = 0;
        } else {
          pos[i * 3 + 1] += v.vy * delta;
          pos[i * 3] += (Math.random() - 0.5) * delta * 3;
        }
      }
      fire.points.geometry.attributes.position.needsUpdate = true;
      fire.light.intensity = 2 + Math.sin(time * 10) * 1.5;
    }

    // Sparkles
    for (const s of this.sparkles) {
      s.time += delta;
      const pos = s.points.geometry.attributes.position.array;
      for (let i = 0; i < s.count; i++) {
        const v = s.velocities[i];
        v.life += delta;
        if (v.life > 2.5) {
          pos[i * 3] = s.baseX;
          pos[i * 3 + 1] = s.baseY;
          pos[i * 3 + 2] = s.baseZ;
          v.life = 0;
          v.vy = 3 + Math.random() * 5;
        } else {
          pos[i * 3] += v.vx * delta;
          pos[i * 3 + 1] += v.vy * delta;
          pos[i * 3 + 2] += v.vz * delta;
          v.vy -= 4 * delta;
        }
      }
      s.points.geometry.attributes.position.needsUpdate = true;
    }

    // Rockets
    for (const r of this.rockets) {
      if (!r.alive) continue;
      r.y += r.speed * delta;
      r.mesh.position.y = r.y;
      r.light.position.y = r.y;
      r.light.intensity = Math.max(0, 8 - r.y * 0.1);

      const tp = r.trailPositions;
      const idx = (r.trailIndex % r.trailCount) * 3;
      tp[idx] = r.baseX + (Math.random() - 0.5) * 0.8;
      tp[idx + 1] = r.y - 1;
      tp[idx + 2] = r.baseZ + (Math.random() - 0.5) * 0.8;
      r.trailIndex++;
      r.trail.geometry.attributes.position.needsUpdate = true;

      if (r.y > 120) {
        this.group.remove(r.mesh);
        this.group.remove(r.trail);
        this.group.remove(r.light);
        r.alive = false;
      }
    }
  }

  addBugFires(buildings) {
    for (const b of buildings) {
      if (b.data.metrics?.bug_count > 0 && b.position) {
        this.addFire(b.position.x, b.height, b.position.z, Math.min(b.data.metrics.bug_count / 2, 3));
      }
    }
  }

  addNewFeatureSparkles(buildings) {
    for (const b of buildings) {
      if (b.data.metrics?.age_days < 3 && b.position) {
        this.addSparkle(b.position.x, b.height + 1, b.position.z);
      }
    }
  }
}
