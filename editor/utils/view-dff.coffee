THREE = require "node.three.js"
yargs = require "yargs"
fs = require "fs"

OrbitControls = require "../lib/controls/OrbitControls"
{loadModelAsync} = require "../lib/loaders/dff-loader"
{loadAnimationAsync} = require "../lib/loaders/ska-loader"

# Load THREE.js font
global._typeface_js = THREE.typeface_js
require "../data/fonts/helvetiker_regular.typeface"

argv = yargs.demand(1).argv

[width, height] = [800, 600]
[windowHalfX, windowHalfY] = [width / 2, height / 2]
[mouseX, mouseY] = [0, 0]

renderer = new THREE.WebGLRenderer
	width: 800
	height: 600
renderer.setClearColor 0xffffff

camera = new THREE.PerspectiveCamera 75, width/height, 0.1, 10000
camera.position.y = 100
camera.position.z = 200

scene = new THREE.Scene()
clock = new THREE.Clock()

controls = new OrbitControls camera, renderer.domElement
controls.userPanSpeed = 0.1
skeletonHelper = null

meshObject = null
meshAnimation = null
frameContainer = null
boneContainer = null

frameContainer = new THREE.Object3D()
frameContainer.visible = false
boneContainer = new THREE.Object3D()

scene.add frameContainer
scene.add boneContainer

loadModelAsync(argv._[0]).then (mesh) ->
	scale = 50 / mesh.geometry.boundingSphere.radius
	controls.zoomIn scale
	scene.add mesh
	meshObject = mesh

	skeletonHelper = new THREE.SkeletonHelper mesh
	skeletonHelper.material.linewidth = 3
	# scene.add skeletonHelper

	loadAnimationAsync("../../MODELS/ACTORSEX/G21ID2.SKA").then (animation) ->
		meshAnimation = new THREE.Animation meshObject, animation
		meshAnimation.play()

	for frame in mesh.geometry.frames or []
		idx = mesh.geometry.frames.indexOf frame
		color = 0xff0000
		unless mesh.geometry.frames.animations[idx].someFlag
			color = 0x00ff00

		cubeGeometry = new THREE.BoxGeometry 0.05, 0.05, 0.05
		cubeMaterial = new THREE.MeshBasicMaterial color: color
		cube = new THREE.Mesh cubeGeometry, cubeMaterial
		cube.matrix.set(
			frame.matrix[0], frame.matrix[3], frame.matrix[6], frame.offset.x,
			frame.matrix[1], frame.matrix[4], frame.matrix[7], frame.offset.y,
			frame.matrix[2], frame.matrix[5], frame.matrix[8], frame.offset.z,
			0,               0,               0,               1
		)
		cube.matrixAutoUpdate = false

		shapes = THREE.FontUtils.generateShapes "f#{mesh.geometry.frames.indexOf frame}",
			font: "helvetiker"
			weight: "normal"
			size: 0.01
		geom = new THREE.ShapeGeometry shapes
		mat = new THREE.MeshBasicMaterial color: 0, depthTest: false, depthWrite: false, transparent: true
		label = new THREE.Mesh geom, mat
		geom.computeBoundingSphere()
		label.position.x -= geom.boundingSphere.radius
		cube.add label

		if frame.parentFrame isnt -1
			mesh.geometry.frames[frame.parentFrame].cube.add cube
		else
			frameContainer.add cube
		frame.cube = cube

	for bone in mesh.skeleton.bones or []
		cubeGeometry = new THREE.SphereGeometry 0.03, 16, 16
		cubeMaterial = new THREE.MeshBasicMaterial color: 0xffff00
		cube = new THREE.Mesh cubeGeometry, cubeMaterial
		# cube.position.copy bone.position
		# cube.rotation.copy bone.rotation

		shapes = THREE.FontUtils.generateShapes "b#{mesh.skeleton.bones.indexOf bone}",
			font: "helvetiker"
			weight: "normal"
			size: 0.01
		geom = new THREE.ShapeGeometry shapes
		mat = new THREE.MeshBasicMaterial color: 0, depthTest: false, depthWrite: false, transparent: true
		label = new THREE.Mesh geom, mat
		geom.computeBoundingSphere()
		label.position.x -= geom.boundingSphere.radius
		cube.add label

		# bone.add cube

	# console.log "s #{mesh.geometry.bones?.length} #{mesh.geometry.skinIndices?.length} #{mesh.geometry.skinWeights?.length} #{mesh.geometry.vertices.length}"
	# console.log "#{mesh.geometry.frames?.length}, #{mesh.geometry.bones?.length}"

direction = 0.01
render = ->
	delta = 0.75 * clock.getDelta()
	THREE.requestAnimationFrame render

	THREE.AnimationHandler.update delta

	# camera.position.x += ( mouseX - camera.position.x ) * .05
	# camera.position.y += ( - mouseY - camera.position.y ) * .05
	# camera.lookAt scene.position
	# if meshObject
	# 	bone = meshObject.skeleton.bones[5]
	# 	bone.rotation.z += direction
	# 	if bone.rotation.z > 0.2 || bone.rotation.z < -0.4
	# 		direction = -direction

	renderer.render scene, camera
	controls.update()

THREE.document.addEventListener "keydown", (event) ->
	switch event.keyCode
		when "1".charCodeAt 0
			flag = !meshObject.material.materials[0].transparent
			for mat in meshObject.material.materials
				mat.transparent = flag
				mat.opacity = if flag then 0.7 else 1.0
		when "2".charCodeAt 0
			flag = !meshObject.material.materials[0].wireframe
			for mat in meshObject.material.materials
				mat.wireframe = flag
				mat.opacity = if flag then 0.7 else 1.0
		when "3".charCodeAt 0
			meshObject.visible = !meshObject.visible
		when "4".charCodeAt 0
			frameContainer.visible = !frameContainer.visible
		when "5".charCodeAt 0
			boneContainer.visible = !boneContainer.visible
, false

THREE.document.addEventListener "mousemove", (event) ->
	mouseX = ( event.pageX - windowHalfX ) * 10
	mouseY = ( event.pageY - windowHalfY ) * 10
, false

render()