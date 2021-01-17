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
  }

  light() {
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(1, 2, 4);
    this.scene.add(light);
  }

  camera() {
    const canvas = this.renderer.domElement;
    this.camera = new THREE.PerspectiveCamera(75,
      canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    this.camera.position.set(4, 10, 10).multiplyScalar(3);
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
    this.scene.add(groundMesh);
  }

  makeAxesGrid(node, units, label) {
    const helper = new AxesGridHelper(node, units);
    this.gui.add(helper, 'visible').name(label);
  }
}
