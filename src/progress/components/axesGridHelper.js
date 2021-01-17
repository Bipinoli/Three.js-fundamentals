/* eslint-disable no-underscore-dangle */
import * as THREE from 'three';

// Turns both axes and grid visible on/off
// GUI requires a property that returns a bool
// to decide to make a checkbox so we make a setter
// can getter for `visible` which we can tell GUI
// to look at.
export default class AxesGridHelper {
  constructor(node, units = 15) {
    const axes = new THREE.AxesHelper();
    const grid = new THREE.GridHelper(units, units);
    axes.material.depthTest = false;
    grid.material.depthTest = false;
    grid.renderOrder = 1;
    axes.renderOrder = 2;
    node.add(axes);
    node.add(grid);
    this.axes = axes;
    this.grid = grid;
    this.visible = false;
  }

  get visible() {
    return this._visible;
  }

  set visible(val) {
    this._visible = val;
    this.grid.visible = val;
    this.axes.visible = val;
  }
}
