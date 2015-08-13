THREE = require "node.three.js"
yargs = require "yargs"
fs = require "fs"

FirstPersonControls = require "../lib/controls/FirstPersonControls"
OrbitControls = require "../lib/controls/OrbitControls"
{loadSceneAsync} = require "../lib/loaders/scene-loader"

argv = yargs.demand(1).argv

[width, height] = [800, 600]
[windowHalfX, windowHalfY] = [width / 2, height / 2]
[mouseX, mouseY] = [0, 0]

sceneBar = null

renderer = new THREE.WebGLRenderer
	width: 800
	height: 600
renderer.setClearColor 0xffffff

camera = new THREE.PerspectiveCamera 75, width/height, 0.1, 1000
camera.far *= 1000
camera.updateProjectionMatrix()
camera.position.y = 100
camera.position.z = 200

scene = new THREE.Scene()

controls = new OrbitControls camera, renderer.domElement, {width: width, height: height}

sceneFileStream = fs.createReadStream argv._[0]
sceneFileStream.on "error", ->
	console.error "Error: Scene file not found"
	process.exit 1
loadSceneAsync(sceneFileStream).then (container) ->
	controls.center = container.getObjectByName("sceneCenter").position
	scene.add container

prevTime = 0
render = (currentTime) ->
	THREE.requestAnimationFrame render
	renderer.render scene, camera

	currentTime ?= 0
	delta = currentTime - prevTime
	prevTime = currentTime

	controls.update delta / 10

THREE.document.addEventListener 'mousemove', (event) ->
	mouseX = ( event.pageX - windowHalfX ) * 10
	mouseY = ( event.pageY - windowHalfY ) * 10
, false

render()