import * as THREE from 'three';
import * as dat from 'dat.gui';
import AxesGridHelper from './components/axesGridHelper';

export default class {
  constructor() {
    const canvas = document.getElementById('canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.scene = new THREE.Scene();
    this.gui = new dat.GUI();
  }

  start() {
    this.configureRenderer();
    this.buildScene();
    this.light();
    this.camera();
    this.action();
  }

  configureRenderer() {
    this.renderer.setClearColor(0xaaaaaa);
    this.renderer.shadowMap.enabled = true;
  }

  buildScene() {
    this.buildGround();
    this.buildTank();
  }

  light() {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(-10, 20, -10);
    light.lookAt(0, 0, 0);
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
    this.scene.add(light2);
    const helper2 = new AxesGridHelper(light2);
    this.gui.add(helper2, 'visible').name('light2 helper');
  }

  camera() {
    const canvas = this.renderer.domElement;
    this.camera = new THREE.PerspectiveCamera(75,
      canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    this.camera.position.set(4, 10, 10).multiplyScalar(1);
    this.camera.lookAt(0, 0, 0);
  }

  action() {
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  animate() {
    const canvas = this.renderer.domElement;
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    }
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }

  buildGround() {
    const groundGeometry = new THREE.PlaneBufferGeometry(50, 50);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x449922 });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = Math.PI * -0.5;
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);
  }

  buildTank() {
    const tank = new THREE.Object3D();
    this.scene.add(tank);

    // chassis
    const chassisWidth = 4;
    const chassisHeight = 1;
    const chassisLength = 8;
    const chassisGeometry = new THREE.BoxBufferGeometry(chassisWidth, chassisHeight, chassisLength);
    const chassisMaterial = new THREE.MeshPhongMaterial({ color: 0x6688aa });
    const chassisMesh = new THREE.Mesh(chassisGeometry, chassisMaterial);
    chassisMesh.position.y = 1.4;
    chassisMesh.castShadow = true;
    tank.add(chassisMesh);

    const helper = new AxesGridHelper(chassisMesh);
    this.gui.add(helper, 'visible').name('chassis');

    {
      // wheels
      const radius = 1;
      const thickness = 0.5;
      const segments = 8;
      const wheelGeometry = new THREE.CylinderBufferGeometry(radius, radius, thickness, segments);
      const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
      const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
      const wheelPositions = [
        [-chassisWidth / 2 - thickness / 2, -chassisHeight / 2, chassisLength / 3],
        [-chassisWidth / 2 - thickness / 2, -chassisHeight / 2, 0],
        [-chassisWidth / 2 - thickness / 2, -chassisHeight / 2, -chassisLength / 3],
        [chassisWidth / 2 + thickness / 2, -chassisHeight / 2, chassisLength / 3],
        [chassisWidth / 2 + thickness / 2, -chassisHeight / 2, 0],
        [chassisWidth / 2 + thickness / 2, -chassisHeight / 2, -chassisLength / 3],
      ];
      wheelPositions.map((position) => {
        const mesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
        mesh.position.set(...position);
        mesh.rotation.z = Math.PI * 0.5;
        mesh.castShadow = true;
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
      const domeMesh = new THREE.Mesh(domeGeometry, chassisMaterial);
      domeMesh.castShadow = true;
      chassisMesh.add(domeMesh);
    }
    {
      // turret
      const width = 0.1;
      const height = 0.1;
      const length = chassisLength * 0.75 * 0.2;
      const turretGeometry = new THREE.BoxBufferGeometry(width, height, length);
      const turretMesh = new THREE.Mesh(turretGeometry, chassisMaterial);
      const turretPivot = new THREE.Object3D();
      const scale = 5;
      turretPivot.scale.set(scale, scale, scale);
      turretPivot.position.y = 0.5;
      turretPivot.position.z = (length * scale) / 2;
      turretPivot.add(turretMesh);
      chassisMesh.add(turretPivot);
    }
  }

  makeAxesGrid(node, units, label) {
    const helper = new AxesGridHelper(node, units);
    this.gui.add(helper, 'visible').name(label);
  }
}
