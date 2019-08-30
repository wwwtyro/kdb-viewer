# kdb-viewer

A simple webgl xyz file renderer for the [KDB](http://theory.cm.utexas.edu/KDB/) project.

### Example

See the included `example.html` file for an example.

[Click here](https://wwwtyro.github.io/kdb-viewer/example) to see the example live.

### Interaction

* Click with the left mouse button on the view and translate your mouse to rotate the view.
* Use your scroll wheel on the view to zoom in and out.

### Using the prebuilt script

Copy the `kdb-viewer.min.js` script onto your server and insert the following in your `<head>` tag:

```html
  <script src="kdb-viewer.min.js"></script>
```

This will add the `ViewManager` object to the global namespace, ready to use.

### API

Create a new `ViewManager` instance:

```js
const manager = ViewManager();
```

Pass an xyz file as a string and a radius scale parameter to the `addView` function to create a new view canvas:

```js
const caffeine = `24
Caffeine
H      -3.3804130    -1.1272367     0.5733036
N       0.9668296    -1.0737425    -0.8198227...`

const view = manager.addView(caffeine, 1.0);
```

The resulting `view` object is a canvas that will respond to mouse events and render your data. Append it to your document
however you'd like:

```js
document.body.appendChild(view);
```

Calling the `removeView` function will remove the canvas from its container and destroy all events associated with it.

```js
manager.removeView(view);
```

### Contributing

* Install [Node.js](https://nodejs.org/en/). I recommend [nvm](https://github.com/nvm-sh/nvm) for this.
* Clone this repo.
* Enter the repo and execute `npm i` to install the dependencies.
* Run `npm start` and point your browser to http://localhost:9966.
* Edit the source files (from higher-to-lower levels of abstraction: `example.js`, `view-manager.js`, and `viewer.js`).
* Save your changes. The browser should automatically reload.
* Run `npm run build` to rebuild `kdb-viewer.min.js`.
