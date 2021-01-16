import * as THREE from 'three';

export default class {
  constructor() {
    const canvas = document.getElementById('canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.camera = new THREE.PerspectiveCamera(75, 2, 0.1, 5);
    this.camera.position.z = 2;
    this.scene = new THREE.Scene();
  }

  init() {
    this.buildScene();
    this.light = new THREE.DirectionalLight(0x00ffaa, 1);
    this.light.position.set(-1, 2, 4);
    this.scene.add(this.light);
    this.render = this.render.bind(this);
    requestAnimationFrame(this.render);
  }

  buildScene() {
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.material = new THREE.MeshPhongMaterial({ color: 0x00ffaa });
    this.cube = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.cube);
  }

  render(time) {
    const secs = time * 0.001;
    this.cube.rotation.x = secs;
    this.cube.rotation.y = secs;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render);
  }
}
