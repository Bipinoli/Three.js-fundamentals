import * as THREE from 'three';
import { BoxGeometry, MeshBasicMaterial } from 'three';

function main() {
  const canvas = document.getElementById('canvas');

  const renderer = new THREE.WebGLRenderer({ canvas });

  const camera = new THREE.PerspectiveCamera(75, 2, 0.1, 5);
  camera.position.z = 2;

  const scene = new THREE.Scene();

  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshBasicMaterial({ color: 0xff0000 });
  const cube = new THREE.Mesh(geometry, material);

  scene.add(cube);

  renderer.render(scene, camera);
}

main();
