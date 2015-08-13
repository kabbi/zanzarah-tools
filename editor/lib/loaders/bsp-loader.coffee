THREE = require "node.three.js"
Promise = require "bluebird"
path = require "path"
fs = require "fs"
{StreamParser} = require "../../../bsp-parser"
utils = require "../utils"

parseVertices = (geometry, data) ->
	for vert in data.vertices
		geometry.vertices.push new THREE.Vector3 vert.x, vert.y, vert.z

parseFaces = (geometry, data) ->
	for face in data.triangles
		threeFace = new THREE.Face3
		threeFace.a = face.v1
		threeFace.b = face.v2
		threeFace.c = face.v3
		threeFace.materialIndex = face.m
		geometry.faces.push threeFace

parseColors = (geometry, data) ->
	for color in data.colors
		threeColor = new THREE.Color()
		threeColor.setHex color
		threeColor.multiplyScalar 2
		geometry.colors.push threeColor
	for face in geometry.faces
		face.vertexColors.push geometry.colors[face.a]
		face.vertexColors.push geometry.colors[face.b]
		face.vertexColors.push geometry.colors[face.c]

parseUVs = (geometry, data) ->
	geometry.faceVertexUvs[0] = []
	for face in data.triangles
		uv1 = data.textureCoords[face.v1]
		uv2 = data.textureCoords[face.v2]
		uv3 = data.textureCoords[face.v3]
		geometry.faceVertexUvs[0].push [
			new THREE.Vector2 uv1.u, 1 - uv1.v
			new THREE.Vector2 uv2.u, 1 - uv2.v
			new THREE.Vector2 uv3.u, 1 - uv3.v
		]

parseMaterials = (data, filePath) ->
	materials = []
	texturePath = utils.texturePathByWorldPath filePath
	textureFormat = ".BMP"
	addressModes =
		0: THREE.ClampToEdgeWrapping
		1: THREE.RepeatWrapping
		2: THREE.MirroredRepeatWrapping
		3: THREE.ClampToEdgeWrapping
		4: THREE.ClampToEdgeWrapping
	for material in data.entries[1].materials
		if not material or not material.texture or not material.texture.colorFile
			materials.push new THREE.MeshBasicMaterial()
			continue
		threeMaterial = new THREE.MeshBasicMaterial()
		wrapS = THREE.RepeatWrapping # addressModes[material.texture.addrModeU]
		wrapT = THREE.RepeatWrapping # addressModes[material.texture.addrModeV]
		threeMaterial.vertexColors = THREE.VertexColors
		if material.texture.colorFile.length
			colorFile = "#{texturePath}/#{material.texture.colorFile.toUpperCase()}#{textureFormat}"
			# console.log "Using texture #{colorFile}"
			threeMaterial.map = THREE.ImageUtils.loadTexture colorFile
			threeMaterial.map.wrapS = wrapS
			threeMaterial.map.wrapT = wrapT
		if material.texture.maskFile.length
			maskFile = "#{texturePath}/#{material.texture.maskFile.toUpperCase()}#{textureFormat}"
			# console.log "Using alpha texture #{maskFile}"
			threeMaterial.alphaMap = THREE.ImageUtils.loadTexture maskFile
			threeMaterial.alphaMap.wrapS = wrapS
			threeMaterial.alphaMap.wrapT = wrapT
			threeMaterial.transparent = true
		materials.push threeMaterial
	materials

parseModel = (data, materials) ->
	geometry = new THREE.Geometry()
	parseVertices geometry, data
	parseFaces geometry, data
	parseColors geometry, data
	parseUVs geometry, data

	geometry.dynamic = false
	geometry.computeFaceNormals()
	geometry.computeBoundingSphere()

	new THREE.Mesh geometry, new THREE.MeshFaceMaterial materials

parseWorld = (data, filePath) ->
	materials = parseMaterials data, filePath

	container = new THREE.Object3D()
	for entry in data.entries
		continue unless entry.type is "rwID_ATOMICSECT"
		container.add parseModel entry, materials
		# break
	container

exports.loadModel = (filePath, callback) ->
	# Enhance buffer size a bit
	file = fs.createReadStream filePath,
		highWaterMark: 1e6
	parser = new StreamParser()
	parser.on "data", (data) ->
		callback null, parseWorld data, filePath
	file.pipe parser

exports.loadModelAsync = Promise.promisify exports.loadModel