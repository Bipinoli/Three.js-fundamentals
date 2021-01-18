import * as THREE from 'three';
import * as dat from 'dat.gui';
import AxesGridHelper from './components/axesGridHelper';

export default class SceneGraph {
  constructor() {
    const canvas = document.getElementById('canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.scene = new THREE.Scene();
    this.gui = new dat.GUI();
    this.splineCurve = undefined;
    this.targetMaterial = undefined;
    this.turret = undefined;
    this.target = undefined;
    this.cameras = [];
  }

  start() {
    this.configureRenderer();
    this.buildScene();
    this.light();
    this.camera();
    this.action();
  }

  configureRenderer() {
    this.renderer.setClearColor(0xB8B8D1);
    this.renderer.shadowMap.enabled = true;
  }

  buildScene() {
    this.buildGround();
    this.buildTank();
    this.buildTarget();
    this.buildPath();
    this.makeAxesGrid(this.scene, 100, 'world');
  }

  light() {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(-10, 20, -10);
    light.lookAt(0, 0, 0);
    light.name = 'light1';
    this.scene.add(light);

    const helper = new AxesGridHelper(light);
    this.gui.add(helper, 'visible').name('light');

    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;

    const d = 50;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 50;
    light.shadow.bias = 0.001;

    const light2 = new THREE.DirectionalLight(0xffffff, 0.3);
    light2.position.set(10, 20, 10);
    light2.name = 'light2';
    this.scene.add(light2);
    const helper2 = new AxesGridHelper(light2);
    this.gui.add(helper2, 'visible').name('light2 helper');
  }

  camera() {
    const camera1 = SceneGraph.makeCamera();
    const camera2 = SceneGraph.makeCamera();
    camera1.position.set(1, 1, 1).multiplyScalar(10);
    camera2.position.set(-1, 1, 1).multiplyScalar(10);
    camera1.lookAt(0, 0, 0);
    camera2.lookAt(0, 0, 0);
    this.cameras.push({ camera: camera1, name: 'camera 1' });
    this.cameras.push({ camera: camera2, name: 'camera 2' });
  }

  action() {
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  animate(millis) {
    const secs = millis * 0.001;

    const { camera, name } = this.cameras[Math.floor(secs % this.cameras.length)];
    document.getElementById('info').innerText = `as seen from ${name}`;

    const canvas = this.renderer.domElement;
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    }
    this.renderer.render(this.scene, camera);

    {
      // move tank
      const travelTime = 15;
      const travelProgress = this.normalizeTime(secs, travelTime);
      const lookAtPointProgress = this.normalizeTime(secs + 0.1, travelTime);
      const tank = this.scene.getObjectByName('tank');
      const tankPosition = this.splineCurve.getPointAt(travelProgress);
      const lookAtPosition = this.splineCurve.getPointAt(lookAtPointProgress);
      tank.position.set(tankPosition.x, 0, tankPosition.y);
      tank.lookAt(lookAtPosition.x, 0, lookAtPosition.y);
    }
    // rotate wheels
    this.wheels.forEach((obj) => {
      const node = obj;
      node.rotation.x = secs * 10;
    });
    {
      // slow shimmer effect on target
      const r = this.normalizeTime(secs, 1);
      const g = this.normalizeTime(secs, 1.2);
      const b = this.normalizeTime(secs, 1.5);
      this.targetMaterial.emissive.setRGB(r * 0.4, 1 - g * 0.8, 1 - b * 0.6);

      // move target
      this.target.position.x = Math.sin(secs) * 8;
      this.target.position.y = 5 + Math.cos(secs * 10);
      this.target.position.z = Math.sin(secs * 2) + 6;
    }
    {
      // point turret to the target
      const targetPosition = this.target.getWorldPosition();
      this.turret.lookAt(targetPosition);
    }

    requestAnimationFrame(this.animate);
  }

  normalizeTime(currentTime, cyclePeriod) {
    /*
      return value between 0 and 1 signifying % complete of cycle
      0 = start of new cycle
      1 = end of the cycle
      travelTime = total period of the cycle
    */
    this.previousCycleEndTime = this.previousCycleEnd ?? 0;
    while (currentTime >= this.previousCycleEndTime + cyclePeriod) {
      this.previousCycleEndTime += cyclePeriod;
    }
    return (currentTime - this.previousCycleEndTime) / cyclePeriod;
  }

  buildGround() {
    const groundGeometry = new THREE.PlaneBufferGeometry(50, 50);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0xFFC145 });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = Math.PI * -0.5;
    groundMesh.receiveShadow = true;
    groundMesh.name = 'ground';
    this.scene.add(groundMesh);
  }

  buildTank() {
    const tank = new THREE.Object3D();
    tank.name = 'tank';
    this.scene.add(tank);

    // chassis
    const chassisWidth = 4;
    const chassisHeight = 1;
    const chassisLength = 8;
    const chassisGeometry = new THREE.BoxBufferGeometry(chassisWidth, chassisHeight, chassisLength);
    const chassisMaterial = new THREE.MeshPhongMaterial({ color: 0x5B5F97 });
    const chassisMesh = new THREE.Mesh(chassisGeometry, chassisMaterial);
    chassisMesh.position.y = 1.4;
    chassisMesh.castShadow = true;
    chassisMesh.name = 'chassis';
    tank.add(chassisMesh);

    const helper = new AxesGridHelper(chassisMesh);
    this.gui.add(helper, 'visible').name('chassis');

    {
      // wheels
      const radius = 1;
      const thickness = 0.5;
      const segments = 5;
      const wheelGeometry = new THREE.CylinderBufferGeometry(radius, radius, thickness, segments);
      const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0xFF6B6C });
      const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
      const wheelPositions = [
        [-chassisWidth / 2 - thickness / 2, -chassisHeight / 2, chassisLength / 3],
        [-chassisWidth / 2 - thickness / 2, -chassisHeight / 2, 0],
        [-chassisWidth / 2 - thickness / 2, -chassisHeight / 2, -chassisLength / 3],
        [chassisWidth / 2 + thickness / 2, -chassisHeight / 2, chassisLength / 3],
        [chassisWidth / 2 + thickness / 2, -chassisHeight / 2, 0],
        [chassisWidth / 2 + thickness / 2, -chassisHeight / 2, -chassisLength / 3],
      ];
      this.wheels = wheelPositions.map((position) => {
        const mesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
        mesh.position.set(...position);
        mesh.rotation.z = Math.PI * 0.5;
        mesh.castShadow = true;
        mesh.name = 'wheel';
        chassisMesh.add(mesh);
        return mesh;
      });
      wheelMesh.rotation.z = Math.PI * 0.5;
      chassisMesh.add(wheelMesh);
    }
    {
      // dome
      const radius = 2;
      const widthSubDivs = 20;
      const heightSubDivs = 20;
      const phiStart = 0;
      const phiEnd = Math.PI * 2;
      const thetaStart = 0;
      const thetaEnd = Math.PI * 0.5;
      const domeGeometry = new THREE.SphereBufferGeometry(radius, widthSubDivs, heightSubDivs,
        phiStart, phiEnd, thetaStart, thetaEnd);
      const domeMaterial = new THREE.MeshPhongMaterial({ color: 0xFF6B6C });
      const domeMesh = new THREE.Mesh(domeGeometry, domeMaterial);
      domeMesh.castShadow = true;
      domeMesh.name = 'dome';
      chassisMesh.add(domeMesh);
    }
    {
      // turret
      const width = 0.1;
      const height = 0.1;
      const length = chassisLength * 0.5 * 0.2;
      const turretGeometry = new THREE.BoxBufferGeometry(width, height, length);
      const turretMaterial = new THREE.MeshPhongMaterial({ color: 0xFF6B6C });
      const turretMesh = new THREE.Mesh(turretGeometry, turretMaterial);
      const turretPivot = new THREE.Object3D();
      const scale = 5;
      turretPivot.scale.set(scale, scale, scale);
      turretPivot.position.y = 1;
      turretPivot.position.x = 0;
      turretMesh.position.z = (length) / 2;
      turretPivot.name = 'turret';
      turretPivot.add(turretMesh);
      chassisMesh.add(turretPivot);
      this.turret = turretPivot;

      const camera = SceneGraph.makeCamera();
      camera.position.y = 0.5;
      camera.lookAt(0, 0, 1);
      turretPivot.add(camera);

      this.makeAxesGrid(camera, 10, 'turret camera');
      this.cameras.push({ camera, name: 'turret camera' });

      this.makeAxesGrid(turretPivot, 10, 'turretPivot');
    }
  }

  buildTarget() {
    const geometry = new THREE.SphereBufferGeometry(1, 9, 10, 0, 2 * Math.PI, 0, Math.PI);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ffaa });
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
    mesh.position.y = 7;
    material.emissive.setRGB(0.2, 0.5, 0.6);
    this.targetMaterial = material;
    this.target = mesh;
  }

  buildPath() {
    const curve = new THREE.SplineCurve([
      new THREE.Vector2(-20, 0),
      new THREE.Vector2(-15, 10),
      new THREE.Vector2(-10, -10),
      new THREE.Vector2(0, 8),
      new THREE.Vector2(5, -15),
      new THREE.Vector2(8, 5),
      new THREE.Vector2(13, -5),
      new THREE.Vector2(15, -10),
      new THREE.Vector2(8, -7),
      new THREE.Vector2(0, 0),
      new THREE.Vector2(-10, 8),
      new THREE.Vector2(-10, 8),
      new THREE.Vector2(-18, -7),
      new THREE.Vector2(-20, 0),
    ]);
    this.splineCurve = curve;
    const points = curve.getPoints(200);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xFFFFFB });
    const curveObject = new THREE.Line(geometry, material);
    this.scene.add(curveObject);
    curveObject.rotation.x = Math.PI * 0.5;
    curveObject.position.y = 0.5;
  }

  makeAxesGrid(node, units, label) {
    const helper = new AxesGridHelper(node, units);
    this.gui.add(helper, 'visible').name(label);
  }

  static makeCamera() {
    return new THREE.PerspectiveCamera(90, 1.5, 0.1, 1000);
  }
}
