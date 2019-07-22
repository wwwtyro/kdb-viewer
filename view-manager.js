const { vec3, mat4 } = require("gl-matrix");
const xyz = require("@atomistics/xyz");
const Viewer = require("./viewer");

module.exports = function ViewManager() {
  const views = [];
  const viewer = Viewer();

  function addView(xyzString) {
    const view = {};
    view.data = xyz(xyzString)[0];
    view.bounds = getBounds(view.data.positions.data);
    view.centroid = getCentroid(view.bounds);
    view.diagonal = getDiagonalLength(view.bounds);
    view.zoom = 1.0;
    view.mouse = {
      down: false,
      x: null,
      y: null
    };
    view.rotation = mat4.create();
    view.canvas = document.createElement("canvas");
    view.canvas.width = 128;
    view.canvas.height = 128;
    view.onPointerDown = function(e) {
      view.canvas.setPointerCapture(e.pointerId);
      document.body.style.cursor = "none";
      view.mouse.down = true;
      view.mouse.x = e.clientX;
      view.mouse.y = e.clientY;
    };
    view.onPointerUp = function(e) {
      view.canvas.releasePointerCapture(e.pointerId);
      document.body.style.cursor = "default";
      view.mouse.down = false;
    };
    view.onPointerMove = function(e) {
      if (view.mouse.down) {
        const dx = e.clientX - view.mouse.x;
        const dy = e.clientY - view.mouse.y;
        view.mouse.x = e.clientX;
        view.mouse.y = e.clientY;
        const rot = mat4.create();
        const speed = 0.01;
        mat4.rotateY(rot, rot, dx * speed);
        mat4.rotateX(rot, rot, dy * speed);
        mat4.multiply(view.rotation, rot, view.rotation);
        renderView(view);
      }
    };
    view.onWheel = function(e) {
      e.preventDefault();
      view.zoom *= 1.0 + Math.sign(e.deltaY) * 0.1;
      view.zoom = Math.max(0.1, Math.min(10.0, view.zoom));
      renderView(view);
      return false;
    };
    view.onResize = function(e) {
      renderView(view);
    };
    view.onInsert = function(e) {
      renderView(view);
    };
    view.canvas.addEventListener("pointerdown", view.onPointerDown);
    view.canvas.addEventListener("pointerup", view.onPointerUp);
    view.canvas.addEventListener("pointermove", view.onPointerMove);
    view.canvas.addEventListener("wheel", view.onWheel);
    view.canvas.addEventListener("resize", view.onResize);
    view.canvas.addEventListener("DOMNodeInserted", view.onInsert);
    views.push(view);
    return view.canvas;
  }

  function removeView(canvas, removeFromDOM = true) {
    document.body.style.cursor = "default";
    const view = views.filter(v => v.canvas === canvas)[0];
    if (!view) {
      return;
    }
    view.canvas.removeEventListener("pointerdown", view.onPointerDown);
    view.canvas.removeEventListener("pointerup", view.onPointerUp);
    view.canvas.removeEventListener("pointermove", view.onPointerMove);
    view.canvas.removeEventListener("wheel", view.onWheel);
    view.canvas.removeEventListener("resize", view.onResize);
    view.canvas.removeEventListener("DOMNodeInserted", view.onInsert);
    views.splice(views.indexOf(view), 1);
    if (removeFromDOM) {
      if (view.canvas.parentNode) {
        view.canvas.parentNode.removeChild(view.canvas);
      }
    }
  }

  function renderView(view) {
    view.canvas.height = view.canvas.clientHeight;
    view.canvas.width = view.canvas.clientWidth;
    const radius = 1.01 * view.diagonal * 0.5 * view.zoom;
    const aspect = view.canvas.width / view.canvas.height;
    const width = aspect >= 1 ? aspect * radius : radius;
    const height = aspect >= 1 ? radius : radius / aspect;
    viewer.setOrtho({
      left: -width,
      right: width,
      bottom: -height,
      top: height,
      near: -1000,
      far: 1000
    });
    const model = mat4.create();
    mat4.translate(model, model, vec3.negate([], view.centroid));
    mat4.multiply(model, view.rotation, model);
    viewer.setModel(model);
    viewer.setPositions(view.data.positions);
    viewer.setLabels(view.data.numbers);
    viewer.renderTo(view.canvas);
  }

  return {
    addView,
    removeView
  };
};

function getBounds(positions) {
  const bounds = {
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity]
  };
  for (let i = 0; i < positions.length / 3; i++) {
    const x = positions[i * 3 + 0];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    bounds.max[0] = Math.max(x, bounds.max[0]);
    bounds.max[1] = Math.max(y, bounds.max[1]);
    bounds.max[2] = Math.max(z, bounds.max[2]);
    bounds.min[0] = Math.min(x, bounds.min[0]);
    bounds.min[1] = Math.min(y, bounds.min[1]);
    bounds.min[2] = Math.min(z, bounds.min[2]);
  }
  return bounds;
}

function getCentroid(bounds) {
  return vec3.add(
    [],
    bounds.min,
    vec3.scale([], vec3.subtract([], bounds.max, bounds.min), 0.5)
  );
}

function getDiagonalLength(bounds) {
  return vec3.length(vec3.subtract([], bounds.max, bounds.min));
}
