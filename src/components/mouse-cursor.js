import AFRAME, { THREE } from 'aframe/src';
import flattenDeep from 'lodash/flattenDeep';

import { bind, callLater } from '../utils/components';

/**
 * Copyright https://github.com/mayognaise/aframe-mouse-cursor-component
 * I've modified it to consider only subset of all children by 'objects' property
 */

const IsVrAvailable = AFRAME.utils.device.isMobile() || window.hasNonPolyfillWebVRSupport;
const AbortClickDistanceEps = 0.04;

AFRAME.registerComponent('mouse-cursor', {
  schema: {
    objects: { type: 'string' },
  },

  init() {
    this.__raycaster = new THREE.Raycaster();
    this.__mouse = new THREE.Vector2();
    this.__isMobile = this.el.sceneEl.isMobile;
    this.__isStereo = false;
    this.__active = false;
    this.__isDown = false;
    this.__intersectedEl = null;
    this.attachEventListeners();
  },

  remove() {
    this.detachEventListeners();
    this.__raycaster = null;
  },

  pause() {
    this.__active = false;
  },
  play() {
    this.__active = true;
  },

  attachEventListeners() {
    const { el } = this;
    const { sceneEl } = el;
    const { canvas } = sceneEl;

    if (!canvas) {
      this.detachEventListeners = bind(
        this, 'attachEventListeners',
        sceneEl, 'render-target-loaded'
      );
      return;
    }

    if (this.detachEventListeners) {
      this.detachEventListeners();
    }

    this.detachEventListeners = callLater(
      bind(this, 'handleEnterVR', sceneEl, 'enter-vr'),
      bind(this, 'handleExitVR', sceneEl, 'exit-vr'),
      bind(this, 'handleMouseDown', canvas, 'mousedown'),
      bind(this, 'handleMouseMove', canvas, 'mousemove'),
      bind(this, 'handleRelease', canvas, 'mouseup'),
      bind(this, 'handleRelease', canvas, 'mouseout'),
      bind(this, 'handleMouseDown', canvas, 'touchstart'),
      bind(this, 'handleTouchMove', canvas, 'touchmove'),
      bind(this, 'handleRelease', canvas, 'touchend'),
      bind(this, 'handleComponentChanged', el, 'componentchanged'),
    );
  },

  isActive() {
    return Boolean(this.__active || this.__raycaster);
  },

  handleMouseDown(evt) {
    if (!this.isActive()) {
      return;
    }

    this.__isDown = true;

    this.updateMousePosition(evt);
    this.updateIntersectedObjects();

    if (!this.__isMobile) {
      this.setInitialMousePosition(evt);
    }
  },
  handleRelease() {
    if (!this.isActive()) {
      return;
    }

    /* check if mouse position has updated */
    if (this.__lastMousePosition) {
      const defX = Math.abs(this.__mouseDownPosition.x - this.__lastMousePosition.x);
      const defY = Math.abs(this.__mouseDownPosition.y - this.__lastMousePosition.y);
      const def = Math.max(defX, defY);
      if (def > AbortClickDistanceEps) {
        this.__isDown = false;
      }
    }

    if (this.__isDown) {
      (this.__intersectedEl || this.el.sceneEl).emit('click');
    }
    this.__isDown = false;
    this.resetMousePosition();
  },
  handleMouseMove(evt) {
    if (!this.isActive()) {
      return;
    }
    this.updateMousePosition(evt);
    this.updateIntersectedObjects();
    if (this.__isDown) {
      this.setMousePosition(evt);
    }
  },
  handleTouchMove() {
    if (!this.isActive()) {
      return;
    }
    this.__isDown = false;
  },

  handleEnterVR() {
    if (IsVrAvailable) {
      this.__isStereo = true;
    }
  },
  handleExitVR() {
    this.__isStereo = false;
  },
  handleComponentChanged(evt) {
    if (evt.detail.name === 'position') {
      this.updateIntersectedObjects();
    }
  },

  getMousePosition(evt) {
    const { innerWidth: w, innerHeight: h } = window;

    let cx;
    let cy;
    if (this.__isMobile) {
      const { touches } = evt;
      if (!touches || touches.length !== 1) {
        return;
      }
      const touch = touches[0];
      cx = touch.pageX;
      cy = touch.pageY;
    } else {
      cx = evt.clientX;
      cy = evt.clientY;
    }

    if (this.__isStereo) {
      cx = (cx % (w / 2)) * 2;
    }

    const x = ((cx / w) * 2) - 1;
    const y = (-(cy / h) * 2) + 1;

    return { x, y };
  },
  updateMousePosition(evt) {
    const pos = this.getMousePosition(evt);
    if (pos === null) {
      return;
    }
    this.__mouse.x = pos.x;
    this.__mouse.y = pos.y;
  },
  setMousePosition(evt) {
    this.__lastMousePosition = this.getMousePosition(evt);
  },
  setInitialMousePosition(evt) {
    this.__mouseDownPosition = this.getMousePosition(evt);
  },
  resetMousePosition() {
    this.__mouseDownPosition = this.__lastMousePosition = null;
  },

  getChildren(object3D) {
    return object3D.children.map(obj => (
      (obj.type === 'Group') ? this.getChildren(obj) : obj
    ));
  },
  getAllChildren() {
    const { objects: selector } = this.data;
    const entities = Array.from(document.querySelectorAll(selector));
    const children = entities.map(el => (
      this.getChildren(el.object3D)
    ));
    return flattenDeep(children);
  },

  updateIntersectedObjects() {
    const { __raycaster, __mouse } = this;
    const camera = this.el.getObject3D('camera');

    /* find intersections */
    __raycaster.setFromCamera(__mouse, camera); /* this somehow gets error so did the below */
    // __raycaster.ray.origin.setFromMatrixPosition(camera.matrixWorld);
    // __raycaster.ray.direction.set(__mouse.x, __mouse.y, 0.5).unproject(camera).sub(__raycaster.ray.origin).normalize();

    /* get objects intersected between mouse and camera */
    const children = this.getAllChildren();
    const intersects = __raycaster.intersectObjects(children);

    /* get the closest three obj */
    const intersection = intersects.find(item => (
      item.object.parent.visible
    ));
    if (!intersection) {
      this.clearIntersectedObjects();
      return;
    }
    /* get the entity */
    const { el } = intersection.object.parent;
    /* only updates if the object is not the activated object */
    if (this.__intersectedEl === el) {
      return;
    }
    this.clearIntersectedObjects();
    this.setIntersectedObjects(el);
  },

  setIntersectedObjects(el) {
    this.__intersectedEl = el;
    if (this.__isMobile) {
      return;
    }
    el.addState('hovered');
    el.emit('mouseenter');
    this.el.addState('hovering');
  },

  clearIntersectedObjects() {
    const { __intersectedEl: el } = this;
    if (el && !this.__isMobile) {
      el.removeState('hovered');
      el.emit('mouseleave');
      this.el.removeState('hovering');
    }
    this.__intersectedEl = null;
  },
});
