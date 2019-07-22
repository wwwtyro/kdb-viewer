"use strict";

const REGL = require("regl");
const mat4 = require("gl-matrix").mat4;
const icosphere = require("icosphere");
const normals = require("normals");
const elements = require("@atomistics/elements");

module.exports = function Viewer(sphereResolution = 3) {
  const sphere = icosphere(sphereResolution);
  sphere.normals = normals.vertexNormals(sphere.cells, sphere.positions);

  const canvas = document.createElement("canvas");

  const regl = REGL({
    canvas: canvas,
    extensions: ["angle_instanced_arrays"],
    attributes: {
      preserveDrawingBuffer: true
    }
  });

  const bOffsets = regl.buffer();
  const bColors = regl.buffer();
  const bRadii = regl.buffer();
  let count = 0;

  let model = mat4.create();
  let view = mat4.lookAt([], [0, 0, 16], [0, 0, 0], [0, 1, 0]);

  let ortho = {
    left: -10,
    right: 10,
    bottom: -10,
    top: 10,
    near: -1000,
    far: 1000
  };

  const cmdRender = regl({
    vert: `
      precision highp float;
      uniform mat4 model, view, projection;
      uniform mat4 rotation;
      attribute vec3 position, normal;
      attribute vec3 offset, color;
      attribute float radius;
      varying vec3 vNormal, vColor;
      void main() {
        gl_Position = projection * view * model * vec4(position * 1.5 * radius + offset, 1);
        vNormal = vec3(rotation * vec4(normal, 1));
        vColor = color;
      }`,
    frag: `
      precision highp float;
      varying vec3 vNormal, vColor;
      void main() {
        float l = max(dot(vNormal, normalize(vec3(0,0,1))), 0.0);
        gl_FragColor = vec4(vColor * l, 1);
      }`,
    attributes: {
      position: sphere.positions,
      normal: sphere.normals,
      offset: {
        buffer: regl.prop("offsets"),
        divisor: 1
      },
      color: {
        buffer: regl.prop("colors"),
        divisor: 1
      },
      radius: {
        buffer: regl.prop("radii"),
        divisor: 1
      }
    },
    uniforms: {
      model: regl.prop("model"),
      view: regl.prop("view"),
      projection: regl.prop("projection"),
      rotation: regl.prop("rotation")
    },
    viewport: regl.prop("viewport"),
    elements: sphere.cells,
    instances: regl.prop("count")
  });

  function setLabels(labels) {
    count = labels.length;
    bColors({
      data: labels.map(l => elements[l].color)
    });
    bRadii({
      data: labels.map(l => elements[l].radius)
    });
  }

  function setPositions(positions) {
    count = positions.data.length / 3;
    bOffsets({
      data: new Float32Array(positions.data)
    });
  }

  function setModel(m) {
    model = mat4.clone(m);
  }

  function setView(eye, center, up) {
    view = mat4.lookAt([], eye, center, up);
  }

  function setOrtho({
    left = ortho.left,
    right = ortho.right,
    bottom = ortho.bottom,
    top = ortho.top,
    near = ortho.near,
    far = ortho.far
  } = {}) {
    ortho = {
      left,
      right,
      bottom,
      top,
      near,
      far
    };
  }

  function render() {
    let projection = mat4.ortho(
      [],
      ortho.left,
      ortho.right,
      ortho.bottom,
      ortho.top,
      ortho.near,
      ortho.far
    );
    regl.clear({
      color: [0, 0, 0, 0],
      depth: 1
    });
    const rotation = mat4.fromQuat([], mat4.getRotation([], model));
    cmdRender({
      offsets: bOffsets,
      colors: bColors,
      radii: bRadii,
      rotation: rotation,
      model: model,
      view: view,
      projection: projection,
      count: count,
      viewport: { x: 0, y: 0, width: canvas.width, height: canvas.height }
    });
  }

  function renderTo(target) {
    canvas.width = target.width;
    canvas.height = target.height;
    target.width = target.width;
    render();
    const ctx = target.getContext("2d");
    ctx.drawImage(canvas, 0, 0);
  }

  return {
    setLabels,
    setPositions,
    setModel,
    setView,
    setOrtho,
    render,
    renderTo
  };
};
