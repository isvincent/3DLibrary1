import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { dimensions } from "./data/layout.js";
export function createScene(host, areas, onSelect) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  host.append(renderer.domElement);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(42, 1, 0.1, 500);
  camera.position.set(45, 43, 53);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 8;
  controls.maxDistance = 120;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.target.set(0, 2, 0);
  scene.add(new T.HemisphereLight(0xffffff, 0x79876c, 2.8));
  const sun = new T.DirectionalLight(0xfff5dc, 3.1);
  sun.position.set(-20, 55, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -40,
    right: 40,
    top: 40,
    bottom: -40,
  });
  scene.add(sun);
  const materials = new Map();
  const mat = (c) => {
    if (!materials.has(c))
      materials.set(
        c,
        new T.MeshStandardMaterial({ color: c, roughness: 0.8 }),
      );
    return materials.get(c);
  };
  const palette = {
    閱讀: 0xe5c28c,
    展示: 0xecad82,
    設備: 0x92bac5,
    討論: 0xc3b8dd,
    辦公: 0xa9b9b2,
    服務: 0x4a9d88,
    入口: 0x65b29b,
    樓梯: 0xa0b6b8,
    書庫: 0xcfa474,
  };
  const cube = (parent, x, y, z, w, h, d, c) => {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat(c));
    m.position.set(x, y + h / 2, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const island = new T.Group();
  scene.add(island);
  const soil = new T.Mesh(new T.CylinderGeometry(30, 23, 5, 9), mat(0xc2a889));
  soil.position.y = -4;
  soil.receiveShadow = true;
  island.add(soil);
  const grass = new T.Mesh(
    new T.CylinderGeometry(30.2, 30, 1, 9),
    mat(0xb8cc9d),
  );
  grass.position.y = -1;
  grass.receiveShadow = true;
  island.add(grass);
  cube(island, 0, -0.5, 0, 43, 0.45, 25, 0xe4dfcf);
  cube(island, 0, -0.55, 17, 4, 0.2, 10, 0xece5d7);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2,
      x = Math.cos(a) * 26,
      z = Math.sin(a) * 23;
    if (Math.abs(x) < 7 && z > 0) continue;
    cube(island, x, -0.5, z, 0.38, 2.2, 0.38, 0x8b765a);
    const crown = new T.Mesh(
      new T.IcosahedronGeometry(1.6, 0),
      mat([0x6a9c70, 0x88ad76, 0x507f67][i % 3]),
    );
    crown.position.set(x, 2, z);
    crown.castShadow = true;
    island.add(crown);
  }
  for (const [x, z] of [
    [-5, 15],
    [7, 14],
    [-23, -8],
  ]) {
    const p = new T.Group();
    island.add(p);
    cube(p, x, -0.4, z, 0.35, 1.1, 0.35, 0x385b74);
    const head = new T.Mesh(new T.SphereGeometry(0.24, 8, 6), mat(0xf0c59d));
    head.position.set(x, 0.95, z);
    p.add(head);
  }
  const floors = [new T.Group(), new T.Group()];
  floors.forEach((g, i) => {
    g.position.y = i * dimensions.floorHeight;
    scene.add(g);
    cube(g, 0, 0, 0, dimensions.width, 0.35, dimensions.depth, 0xf7f1e5);
    cube(
      g,
      0,
      0.35,
      -dimensions.depth / 2,
      dimensions.width,
      1.5,
      0.15,
      0xf1e9d8,
    );
    cube(
      g,
      -dimensions.width / 2,
      0.35,
      0,
      0.15,
      1.5,
      dimensions.depth,
      0xf1e9d8,
    );
    cube(
      g,
      dimensions.width / 2,
      0.35,
      0,
      0.15,
      1.5,
      dimensions.depth,
      0xf1e9d8,
    );
  });
  const groups = new Map(),
    targets = [],
    labels = [];
  const bookBatches = new Map();
  function book(parent, x, y, z, i) {
    if (!bookBatches.has(parent)) bookBatches.set(parent, []);
    bookBatches.get(parent).push({ x, y, z, i });
  }
  function table(parent, w, d) {
    cube(parent, 0, 0.9, 0, w, 0.14, d, 0xdcb88b);
    for (const x of [-w * 0.38, w * 0.38])
      for (const z of [-d * 0.3, d * 0.3])
        cube(parent, x, 0, z, 0.12, 0.9, 0.12, 0x85968b);
    const count = Math.min(8, Math.max(2, Math.floor(w / 1.1)));
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * (w / count);
      for (const s of [-1, 1]) {
        cube(parent, x, 0.35, s * (d / 2 + 0.25), 0.4, 0.12, 0.4, 0x7baba0);
        cube(parent, x, 0.47, s * (d / 2 + 0.4), 0.4, 0.4, 0.08, 0x7baba0);
      }
    }
  }
  function label(text) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 96;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "rgba(255,255,249,.94)";
    ctx.beginPath();
    ctx.roundRect(0, 0, 512, 96, 22);
    ctx.fill();
    ctx.fillStyle = "#294b42";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, 256, 61);
    const sprite = new T.Sprite(
      new T.SpriteMaterial({ map: new T.CanvasTexture(c), depthTest: false }),
    );
    sprite.scale.set(4.3, 0.8, 1);
    sprite.renderOrder = 4;
    return sprite;
  }
  for (const a of areas) {
    const parent = floors[a.floor - 1],
      g = new T.Group();
    g.position.set(a.position.x, 0.36, a.position.z);
    parent.add(g);
    groups.set(a.id, g);
    const w = a.size.x,
      d = a.size.z;
    const base = cube(g, 0, 0, 0, w, 0.06, d, palette[a.category]);
    base.material = base.material.clone();
    base.material.transparent = true;
    base.material.opacity = 0.3;
    if (a.category === "閱讀") table(g, w * 0.88, d * 0.65);
    else if (a.category === "書庫") {
      cube(g, 0, 0, 0, w, 2.1, d, 0xc0a078);
      for (let k = 0; k < 4; k++) {
        cube(g, 0, 0.2 + k * 0.49, 0, w + 0.1, 0.08, d + 0.04, 0xedd3ac);
        for (let j = 0; j < Math.floor(d / 0.23); j++)
          for (const s of [-1, 1])
            book(
              g,
              s * w * 0.48,
              0.28 + k * 0.49,
              -d / 2 + 0.16 + j * 0.23,
              j + k,
            );
      }
    } else if (
      a.category === "討論" ||
      a.id === "office" ||
      a.id === "storage"
    ) {
      cube(g, 0, 0, -d / 2, w, 1.9, 0.12, palette[a.category]);
      cube(g, -w / 2, 0, 0, 0.12, 1.9, d, palette[a.category]);
      table(g, w * 0.55, d * 0.45);
      if (a.category === "討論")
        cube(g, -w * 0.43, 0.8, 0, 0.1, 0.8, d * 0.55, 0x35464b);
    } else if (a.category === "樓梯") {
      for (let k = 0; k < 10; k++)
        cube(
          g,
          0,
          0,
          d / 2 - ((k + 0.5) * d) / 10,
          w,
          (k + 1) * 0.21,
          d / 10,
          0xa9bfc0,
        );
    } else if (a.id === "catalog") {
      table(g, w * 0.95, d * 0.7);
      for (let i = 0; i < 6; i++) {
        const x = ((i - 2.5) * w) / 6;
        cube(g, x, 1.05, 0, 0.1, 0.35, 0.15, 0x56686a);
        cube(g, x, 1.35, 0, 0.8, 0.5, 0.08, 0x395b69);
        cube(g, x, 1.4, 0.05, 0.67, 0.36, 0.02, 0xa6d8cf);
      }
    } else if (a.id === "counter") {
      cube(g, -w * 0.36, 0, 0, w * 0.25, 1.2, d, 0x5f9d8b);
      cube(g, 0, 0, d * 0.36, w, 1.2, d * 0.23, 0x5f9d8b);
    } else if (a.id === "printer") {
      cube(g, 0, 0, 0, w * 0.8, 1.4, d * 0.7, 0xd7dfdc);
      cube(g, 0, 1.4, 0, w * 0.8, 0.15, d * 0.6, 0x536b70);
    } else if (a.id.startsWith("screen")) {
      cube(g, 0, 0.6, 0, w, 0.8, Math.min(d, 0.2), 0x3d6269);
    } else if (a.category === "展示") {
      cube(g, 0, 0, 0, w, 0.8, d, 0xe2bd96);
      for (let i = 0; i < Math.min(20, w * 3); i++)
        book(g, -w / 2 + 0.2 + i * 0.29, 0.8, 0, i);
    } else
      cube(
        g,
        0,
        0,
        0,
        w,
        a.id === "entrance" ? 0.2 : 1,
        d,
        palette[a.category],
      );
    const hit = new T.Mesh(
      new T.BoxGeometry(w, 2.6, d),
      new T.MeshBasicMaterial({ visible: false }),
    );
    hit.position.y = 1.3;
    hit.userData.area = a;
    g.add(hit);
    targets.push(hit);
    if (
      [
        "discussion1",
        "sdgs",
        "newbooks",
        "special",
        "catalog",
        "counter",
        "stairs1",
        "shelf4",
        "central210",
        "stairs2",
        "printer",
      ].includes(a.id)
    ) {
      const s = label(a.name);
      s.position.set(0, 3, 0);
      g.add(s);
      labels.push(s);
    }
  }
  for (const [parent, entries] of bookBatches) {
    for (let color = 0; color < 5; color++) {
      const batch = entries.filter((b) => b.i % 5 === color);
      if (!batch.length) continue;
      const mesh = new T.InstancedMesh(
        new T.BoxGeometry(1, 1, 1),
        mat([0x568f83, 0xdf9c72, 0xdac572, 0x6b879f, 0xd8baa3][color]),
        batch.length,
      );
      const dummy = new T.Object3D();
      batch.forEach((b, index) => {
        const h = 0.4 + (b.i % 4) * 0.06;
        dummy.position.set(b.x, b.y + h / 2, b.z);
        dummy.scale.set(0.13 + (b.i % 3) * 0.04, h, 0.32);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
      });
      mesh.castShadow = true;
      parent.add(mesh);
    }
  }
  const overlay = new T.Mesh(
    new T.PlaneGeometry(dimensions.width, dimensions.depth),
    new T.MeshBasicMaterial({
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      side: T.DoubleSide,
    }),
  );
  overlay.rotation.x = -Math.PI / 2;
  overlay.visible = false;
  scene.add(overlay);
  const ray = new T.Raycaster(),
    pointer = new T.Vector2();
  let down;
  renderer.domElement.addEventListener(
    "pointerdown",
    (e) => (down = [e.clientX, e.clientY]),
  );
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6)
      return;
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    const hits = ray
      .intersectObjects(targets)
      .filter((h) => floors[h.object.userData.area.floor - 1].visible);
    if (hits[0]) onSelect(hits[0].object.userData.area.id);
  });
  let move = null,
    currentFloor = 1,
    mode = "exploded",
    gap = 8,
    selected = null,
    route = null;
  const outline = new T.BoxHelper(
    new T.Mesh(new T.BoxGeometry(1, 1, 1)),
    0x177a5f,
  );
  outline.visible = false;
  scene.add(outline);
  const connection = new T.LineSegments(
    new T.BufferGeometry().setFromPoints([
      new T.Vector3(19, 0.5, -10),
      new T.Vector3(19, 8, -10),
      new T.Vector3(-19, 0.5, -10),
      new T.Vector3(-19, 8, -10),
    ]),
    new T.LineBasicMaterial({
      color: 0x92aaa2,
      transparent: true,
      opacity: 0.5,
    }),
  );
  scene.add(connection);
  function fly(pos, target) {
    move = {
      from: camera.position.clone(),
      to: new T.Vector3(...pos),
      start: controls.target.clone(),
      target: new T.Vector3(...target),
      time: performance.now(),
    };
  }
  function setMode(next, f = currentFloor) {
    overlay.visible = next === "validate" && Boolean(overlay.material.map);
    overlay.position.y = (Number(f) === 2 ? dimensions.floorHeight : 0) + 2.9;
    mode = next;
    currentFloor = Number(f);
    floors[0].visible =
      next === "full" || next === "exploded" || currentFloor === 1;
    floors[1].visible =
      next === "full" || next === "exploded" || currentFloor === 2;
    floors[1].position.y = next === "exploded" ? gap : dimensions.floorHeight;
    connection.visible = next === "exploded";
    const y =
      next === "full" || next === "exploded"
        ? 3
        : currentFloor === 2
          ? dimensions.floorHeight
          : 0;
    if (next === "top" || next === "compare" || next === "validate")
      fly([0, y + 47, 0.01], [0, y, 0]);
    else fly([44, y + 37, 47], [0, y, 0]);
    refreshOutline();
  }
  function refreshOutline() {
    if (!selected) return;
    const g = groups.get(selected);
    g.updateWorldMatrix(true, true);
    outline.setFromObject(g);
    outline.visible =
      floors[areas.find((a) => a.id === selected).floor - 1].visible;
  }
  function select(id, focus = true) {
    selected = id;
    const a = areas.find((a) => a.id === id);
    if (!a) return;
    if (a.floor !== currentFloor || !floors[a.floor - 1].visible)
      setMode("floor", a.floor);
    refreshOutline();
    if (focus) {
      const y = floors[a.floor - 1].position.y;
      fly(
        [a.position.x + 9, y + 12, a.position.z + 13],
        [a.position.x, y + 1, a.position.z],
      );
    }
  }
  function drawRoute(ids) {
    if (route) {
      scene.remove(route);
      route.geometry.dispose();
    }
    const points = [];
    for (const id of ids) {
      const a = areas.find((a) => a.id === id);
      if (a) {
        const y = floors[a.floor - 1].position.y + 0.65;
        points.push(new T.Vector3(a.position.x, y, a.position.z));
      }
    }
    route = new T.Line(
      new T.BufferGeometry().setFromPoints(points),
      new T.LineDashedMaterial({
        color: 0xe18047,
        dashSize: 0.6,
        gapSize: 0.25,
      }),
    );
    route.computeLineDistances();
    scene.add(route);
  }
  const resize = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });
  resize.observe(host);
  let power = false,
    speed = 1,
    last = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    if (power && t - last < 65) return;
    last = t;
    if (move) {
      const p = Math.min(1, (t - move.time) / (850 / speed)),
        v = p * p * (3 - 2 * p);
      camera.position.lerpVectors(move.from, move.to, v);
      controls.target.lerpVectors(move.start, move.target, v);
      if (p === 1) move = null;
    }
    controls.update();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  setMode("exploded");
  return {
    setMode,
    select,
    drawRoute,
    overlay(url, opacity = 0.6) {
      new T.TextureLoader().load(url, (texture) => {
        overlay.material.map?.dispose();
        overlay.material.map = texture;
        overlay.material.opacity = +opacity;
        overlay.material.needsUpdate = true;
        overlay.visible = mode === "validate";
        overlay.position.y =
          (currentFloor === 2 ? dimensions.floorHeight : 0) + 2.9;
      });
    },
    overlayOpacity(v) {
      overlay.material.opacity = +v;
    },
    setGap(v) {
      gap = +v;
      setMode(mode);
    },
    rotate(v) {
      controls.autoRotate = v;
    },
    labels(v) {
      labels.forEach((s) => (s.visible = v));
    },
    night(v) {
      sun.intensity = v ? 0.5 : 3.1;
      scene.children.find((o) => o.isHemisphereLight).intensity = v ? 1 : 2.8;
      host.classList.toggle("night", v);
    },
    performance(v) {
      power = v === "省電";
      renderer.setPixelRatio(
        v === "高" ? Math.min(devicePixelRatio, 2) : v === "省電" ? 1 : 1.4,
      );
    },
    speed(v) {
      speed = +v;
    },
    get mode() {
      return mode;
    },
    renderer,
    groups,
  };
}
