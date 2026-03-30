// controls.js — Camera, UI overlay, tooltips, minimap
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class CityControls {
  constructor(camera, renderer, city, data) {
    this.camera = camera;
    this.renderer = renderer;
    this.city = city;
    this.data = data;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredBuilding = null;

    // Orbit controls
    this.orbit = new OrbitControls(camera, renderer.domElement);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.08;
    this.orbit.minDistance = 10;
    this.orbit.maxDistance = 300;
    this.orbit.maxPolarAngle = Math.PI / 2.1;

    // Set initial camera position (isometric-ish overview)
    camera.position.set(150, 120, 150);
    this.orbit.target.set(100, 0, 100);

    // Create UI overlay
    this.createOverlay();

    // Event listeners
    renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
    renderer.domElement.addEventListener('click', (e) => this.onClick(e));
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  createOverlay() {
    // Top bar
    const topBar = document.createElement('div');
    topBar.id = 'top-bar';
    topBar.innerHTML = `
      <div class="top-left">
        <span class="city-name">${this.data.name || 'Code City'}</span>
        <span class="stat">${this.data.stats?.files || 0} buildings</span>
        <span class="stat">${this.formatNumber(this.data.stats?.loc || 0)} LOC</span>
        <span class="stat">${this.data.stats?.commits || 0} commits</span>
        <span class="stat">${this.data.stats?.contributors || 0} devs</span>
      </div>
      <div class="top-right">
        <button id="btn-toggle-fires" class="ctrl-btn" title="Toggle fires">🔥</button>
        <button id="btn-toggle-roads" class="ctrl-btn" title="Toggle roads">🛣️</button>
        <button id="btn-rocket" class="ctrl-btn" title="Launch rocket">🚀</button>
        <button id="btn-reset-cam" class="ctrl-btn" title="Reset camera">📷</button>
      </div>
    `;
    document.body.appendChild(topBar);

    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.id = 'tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
    this.tooltip = tooltip;

    // Legend
    const legend = document.createElement('div');
    legend.id = 'legend';
    const languages = this.data.stats?.languages || {};
    const topLangs = Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const langColors = {
      javascript: '#f7df1e', typescript: '#3178c6', python: '#3572A5',
      rust: '#dea584', go: '#00ADD8', java: '#b07219', ruby: '#701516',
      html: '#e34c26', css: '#563d7c', vue: '#41b883', svelte: '#ff3e00',
      shell: '#89e051', json: '#40d47e', markdown: '#083fa1', other: '#8b949e'
    };
    legend.innerHTML = `<div class="legend-title">Languages</div>` +
      topLangs.map(([lang, count]) =>
        `<div class="legend-item"><span class="legend-dot" style="background:${langColors[lang] || '#8b949e'}"></span>${lang} (${count})</div>`
      ).join('');
    document.body.appendChild(legend);

    // Activity feed
    const feed = document.createElement('div');
    feed.id = 'activity-feed';
    feed.innerHTML = '<div class="feed-title">Recent Activity</div>';
    const activities = (this.data.recent_activity || []).slice(0, 8);
    for (const a of activities) {
      const el = document.createElement('div');
      el.className = 'feed-item';
      el.textContent = `${a.author}: ${a.type} ${a.file?.split('/').pop() || ''}`;
      feed.appendChild(el);
    }
    document.body.appendChild(feed);
  }

  onMouseMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const building = this.city.getBuildingAt(this.raycaster);

    if (building) {
      this.hoveredBuilding = building;
      const d = building.userData;
      this.tooltip.style.display = 'block';
      this.tooltip.style.left = event.clientX + 15 + 'px';
      this.tooltip.style.top = event.clientY + 15 + 'px';
      this.tooltip.innerHTML = `
        <div class="tt-name">${d.name}</div>
        <div class="tt-path">${d.path}</div>
        <div class="tt-row"><span>LOC:</span> <strong>${d.loc}</strong></div>
        <div class="tt-row"><span>Language:</span> <strong>${d.language}</strong></div>
        <div class="tt-row"><span>Churn:</span> <strong>${d.churn} edits</strong></div>
        <div class="tt-row"><span>Bugs:</span> <strong>${d.bug_count || 0}</strong></div>
        <div class="tt-row"><span>Author:</span> <strong>${d.last_author}</strong></div>
        ${d.is_test ? '<div class="tt-test">✅ Test file</div>' : ''}
        ${d.bug_count > 0 ? '<div class="tt-bug">🔥 Has bugs</div>' : ''}
      `;
      this.renderer.domElement.style.cursor = 'pointer';
    } else {
      this.hoveredBuilding = null;
      this.tooltip.style.display = 'none';
      this.renderer.domElement.style.cursor = 'default';
    }
  }

  onClick(event) {
    if (this.hoveredBuilding) {
      const pos = this.hoveredBuilding.position;
      const h = this.hoveredBuilding.userData.height || 5;
      // Smooth zoom to building
      this.animateCamera(pos.x + 5, h + 8, pos.z + 5, pos.x, h / 2, pos.z);
    }
  }

  animateCamera(px, py, pz, tx, ty, tz) {
    const startPos = this.camera.position.clone();
    const startTarget = this.orbit.target.clone();
    const endPos = new THREE.Vector3(px, py, pz);
    const endTarget = new THREE.Vector3(tx, ty, tz);
    let t = 0;

    const animate = () => {
      t += 0.02;
      if (t > 1) t = 1;
      const ease = t * t * (3 - 2 * t); // smoothstep

      this.camera.position.lerpVectors(startPos, endPos, ease);
      this.orbit.target.lerpVectors(startTarget, endTarget, ease);
      this.orbit.update();

      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }

  onKeyDown(event) {
    if (event.key === 'r' || event.key === 'R') {
      this.animateCamera(150, 120, 150, 100, 0, 100);
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  update() {
    this.orbit.update();
  }

  formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  }

  // Expose for external button binding
  bindButtons(effects) {
    document.getElementById('btn-toggle-fires')?.addEventListener('click', () => {
      effects.group.visible = !effects.group.visible;
    });
    document.getElementById('btn-toggle-roads')?.addEventListener('click', () => {
      this.city.roadGroup.visible = !this.city.roadGroup.visible;
    });
    document.getElementById('btn-rocket')?.addEventListener('click', () => {
      effects.launchRocket(100, 100);
    });
    document.getElementById('btn-reset-cam')?.addEventListener('click', () => {
      this.animateCamera(150, 120, 150, 100, 0, 100);
    });
  }
}
