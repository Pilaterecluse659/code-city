// city.js — Treemap layout → Three.js buildings, districts, ground, roads
import * as THREE from 'three';

const CITY_SIZE = 200;
const ROAD_WIDTH = 2;
const MAX_BUILDING_HEIGHT = 40;
const MIN_BUILDING_HEIGHT = 0.5;

export class City {
  constructor(scene, data) {
    this.scene = scene;
    this.data = data;
    this.buildings = [];
    this.buildingMeshes = new THREE.Group();
    this.districtGroup = new THREE.Group();
    this.labelGroup = new THREE.Group();
    this.roadGroup = new THREE.Group();

    this.scene.add(this.buildingMeshes);
    this.scene.add(this.districtGroup);
    this.scene.add(this.labelGroup);
    this.scene.add(this.roadGroup);
  }

  build() {
    const files = this.flattenFiles(this.data.tree);
    if (files.length === 0) return;

    const maxLoc = Math.max(...files.map(f => f.metrics?.loc || 1));

    // Compute treemap layout
    const layout = this.computeTreemap(this.data.tree, 0, 0, CITY_SIZE, CITY_SIZE);

    // Create ground
    this.createGround();

    // Create buildings from layout
    for (const item of layout) {
      if (item.type === 'file') {
        this.createBuilding(item, maxLoc);
      } else if (item.type === 'district') {
        this.createDistrict(item);
      }
    }

    // Create dependency roads
    this.createRoads(layout);
  }

  computeTreemap(nodes, x, y, w, h) {
    const result = [];
    if (!nodes || nodes.length === 0) return result;

    // Calculate total value (LOC) for sizing
    const getValue = (node) => {
      if (node.type === 'file') return Math.max(node.metrics?.loc || 1, 1);
      if (node.children) return node.children.reduce((s, c) => s + getValue(c), 0);
      return 1;
    };

    const totalValue = nodes.reduce((s, n) => s + getValue(n), 0);
    if (totalValue === 0) return result;

    // Simple strip layout
    let currentX = x + ROAD_WIDTH / 2;
    let currentY = y + ROAD_WIDTH / 2;
    const innerW = w - ROAD_WIDTH;
    const innerH = h - ROAD_WIDTH;

    // Sort by value descending for better layout
    const sorted = [...nodes].sort((a, b) => getValue(b) - getValue(a));

    let remaining = [...sorted];
    let rx = currentX, ry = currentY;
    let rw = innerW, rh = innerH;

    while (remaining.length > 0) {
      // Decide orientation
      const horizontal = rw >= rh;

      // Find best row
      const row = [];
      let rowValue = 0;
      const totalRemaining = remaining.reduce((s, n) => s + getValue(n), 0);

      for (let i = 0; i < remaining.length; i++) {
        row.push(remaining[i]);
        rowValue += getValue(remaining[i]);

        // Stop when row takes up reasonable proportion
        if (rowValue / totalRemaining > 0.4 && row.length > 1) break;
        if (row.length >= Math.ceil(Math.sqrt(remaining.length))) break;
      }

      remaining = remaining.slice(row.length);

      const rowFraction = rowValue / totalRemaining;
      const rowSize = horizontal ? rw * rowFraction : rh * rowFraction;

      // Layout items in this row
      let offset = 0;
      const crossSize = horizontal ? rh : rw;

      for (const node of row) {
        const fraction = getValue(node) / rowValue;
        const itemSize = crossSize * fraction;

        const ix = horizontal ? rx : rx + offset;
        const iy = horizontal ? ry + offset : ry;
        const iw = horizontal ? rowSize : itemSize;
        const ih = horizontal ? itemSize : rowSize;

        if (node.type === 'file') {
          result.push({
            type: 'file',
            ...node,
            layout: { x: ix + iw / 2, z: iy + ih / 2, w: Math.max(iw - 0.3, 0.3), d: Math.max(ih - 0.3, 0.3) }
          });
        } else if (node.type === 'directory' && node.children) {
          result.push({
            type: 'district',
            name: node.name,
            path: node.path,
            layout: { x: ix, z: iy, w: iw, d: ih }
          });
          // Recurse into directory
          const subItems = this.computeTreemap(node.children, ix, iy, iw, ih);
          result.push(...subItems);
        }

        offset += itemSize;
      }

      // Update remaining area
      if (horizontal) {
        rx += rowSize;
        rw -= rowSize;
      } else {
        ry += rowSize;
        rh -= rowSize;
      }
    }

    return result;
  }

  createGround() {
    // Main ground plane
    const groundGeo = new THREE.PlaneGeometry(CITY_SIZE + 20, CITY_SIZE + 20);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(CITY_SIZE / 2, -0.01, CITY_SIZE / 2);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid
    const gridHelper = new THREE.GridHelper(CITY_SIZE + 20, 40, 0x2a2a4a, 0x1a1a3a);
    gridHelper.position.set(CITY_SIZE / 2, 0, CITY_SIZE / 2);
    this.scene.add(gridHelper);
  }

  createBuilding(item, maxLoc) {
    const loc = item.metrics?.loc || 1;
    const height = MIN_BUILDING_HEIGHT + (loc / maxLoc) * MAX_BUILDING_HEIGHT;
    const { x, z, w, d } = item.layout;

    const geo = new THREE.BoxGeometry(w, height, d);
    const color = new THREE.Color(item.metrics?.color || '#8b949e');

    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.6,
      metalness: 0.3,
      emissive: item.metrics?.age_days < 3 ? color : new THREE.Color(0x000000),
      emissiveIntensity: item.metrics?.age_days < 3 ? 0.3 : 0
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Store metadata for tooltips
    mesh.userData = {
      type: 'building',
      name: item.name,
      path: item.path,
      loc: item.metrics?.loc,
      language: item.metrics?.language,
      churn: item.metrics?.churn,
      bug_count: item.metrics?.bug_count,
      last_author: item.metrics?.last_author,
      is_test: item.metrics?.is_test,
      age_days: item.metrics?.age_days,
      height
    };

    this.buildingMeshes.add(mesh);
    this.buildings.push({ mesh, data: item });

    // Add window lights for tall buildings
    if (height > 5) {
      this.addWindows(mesh, w, height, d, color);
    }

    // Test buildings get a green beacon
    if (item.metrics?.is_test) {
      this.addBeacon(x, height, z, 0x00ff88, 0.3);
    }
  }

  addWindows(building, w, h, d, baseColor) {
    const windowColor = new THREE.Color(0xffee88);
    const windowMat = new THREE.MeshBasicMaterial({ color: windowColor });
    const windowSize = 0.15;
    const spacing = 1.2;

    const pos = building.position;
    const floors = Math.floor(h / spacing);
    const windowsPerFloor = Math.max(1, Math.floor(w / spacing));

    // Only add windows to front face for performance
    for (let floor = 0; floor < Math.min(floors, 8); floor++) {
      for (let wi = 0; wi < Math.min(windowsPerFloor, 4); wi++) {
        if (Math.random() > 0.6) continue; // Random dark windows

        const windowGeo = new THREE.PlaneGeometry(windowSize, windowSize);
        const windowMesh = new THREE.Mesh(windowGeo, windowMat);
        windowMesh.position.set(
          pos.x - w / 2 + (wi + 0.5) * (w / windowsPerFloor),
          floor * spacing + spacing / 2,
          pos.z + d / 2 + 0.01
        );
        this.buildingMeshes.add(windowMesh);
      }
    }
  }

  addBeacon(x, h, z, color, size) {
    const beaconGeo = new THREE.SphereGeometry(size, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(x, h + size + 0.2, z);
    beacon.userData = { type: 'beacon', pulse: true };
    this.buildingMeshes.add(beacon);
  }

  createDistrict(item) {
    const { x, z, w, d } = item.layout;

    // District boundary
    const points = [
      new THREE.Vector3(x, 0.02, z),
      new THREE.Vector3(x + w, 0.02, z),
      new THREE.Vector3(x + w, 0.02, z + d),
      new THREE.Vector3(x, 0.02, z + d),
      new THREE.Vector3(x, 0.02, z),
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x3a3a5a, transparent: true, opacity: 0.5 });
    const line = new THREE.Line(lineGeo, lineMat);
    this.districtGroup.add(line);

    // District label (floating text sprite)
    if (w > 5 && d > 5) {
      const label = this.createLabel(item.name, x + w / 2, 0.5, z + d / 2);
      this.labelGroup.add(label);
    }
  }

  createLabel(text, x, y, z) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#7aa2f7';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text.slice(0, 20), 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.7 });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(x, y, z);
    sprite.scale.set(8, 2, 1);
    return sprite;
  }

  createRoads(layout) {
    const filePositions = {};
    for (const item of layout) {
      if (item.type === 'file' && item.layout) {
        filePositions[item.path] = item.layout;
      }
    }

    const deps = this.data.dependencies || [];
    const roadMat = new THREE.LineBasicMaterial({ color: 0x4a4a6a, transparent: true, opacity: 0.15 });

    for (const dep of deps.slice(0, 200)) { // Cap for performance
      const from = filePositions[dep.from];
      const to = filePositions[dep.to];
      if (!from || !to) continue;

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(from.x, 0.1, from.z),
        new THREE.Vector3((from.x + to.x) / 2, 2, (from.z + to.z) / 2),
        new THREE.Vector3(to.x, 0.1, to.z)
      );
      const points = curve.getPoints(20);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, roadMat);
      this.roadGroup.add(line);
    }
  }

  update(time) {
    // Pulse beacons
    this.buildingMeshes.children.forEach(child => {
      if (child.userData?.pulse) {
        child.material.opacity = 0.5 + 0.3 * Math.sin(time * 3);
        child.scale.setScalar(1 + 0.1 * Math.sin(time * 3));
      }
    });
  }

  getBuildingAt(raycaster) {
    const intersects = raycaster.intersectObjects(this.buildingMeshes.children, false);
    for (const hit of intersects) {
      if (hit.object.userData?.type === 'building') return hit.object;
    }
    return null;
  }

  flattenFiles(nodes, result = []) {
    if (!nodes) return result;
    for (const node of nodes) {
      if (node.type === 'file') result.push(node);
      else if (node.children) this.flattenFiles(node.children, result);
    }
    return result;
  }
}
