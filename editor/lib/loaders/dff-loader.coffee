THREE = require "node.three.js"
Promise = require "bluebird"
fs = require "fs"
{StreamParser} = require "../../../dff-parser"
utils = require "../utils"

parseVertices = (geometry, data) ->
	for vert in data.vertices
		geometry.vertices.push new THREE.Vector3 vert.x, vert.y, vert.z

parseFaces = (geometry, data) ->
	for face in data.faces
		threeFace = new THREE.Face3
		threeFace.a = face.vertex1
		threeFace.b = face.vertex2
		threeFace.c = face.vertex3
		threeFace.materialIndex = face.materialIdx
		geometry.faces.push threeFace

parseColors = (geometry, data) ->
	for color in data.vertexColors
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
	for face in data.faces
		uv1 = data.textureCoords[face.vertex1]
		uv2 = data.textureCoords[face.vertex2]
		uv3 = data.textureCoords[face.vertex3]
		geometry.faceVertexUvs[0].push [
			new THREE.Vector2 uv1.u, 1 - uv1.v
			new THREE.Vector2 uv2.u, 1 - uv2.v
			new THREE.Vector2 uv3.u, 1 - uv3.v
		]

parseSkeleton = (geometry, data, frames) ->
	return unless data
	for w in data.vertexWeights
		geometry.skinWeights.push new THREE.Vector4 w.w1, w.w2, w.w3, w.w4
	for i in data.vertexIndices
		geometry.skinIndices.push new THREE.Vector4 i.b1, i.b2, i.b3, i.b4

	# A three helper objects to calculate bone data
	matrix = new THREE.Matrix4()
	pos = new THREE.Vector3()
	rotq = new THREE.Quaternion()

	# Store frames
	geometry.frames = frames

	geometry.bones = []
	for b, idx in data.bones
		frame = b.frame
		matrix.set(
			frame.matrix[0], frame.matrix[3], frame.matrix[6], frame.offset.x,
			frame.matrix[1], frame.matrix[4], frame.matrix[7], frame.offset.y,
			frame.matrix[2], frame.matrix[5], frame.matrix[8], frame.offset.z,
			0,               0,               0,               1
		)

		pos.setFromMatrixPosition matrix
		rotq.setFromRotationMatrix matrix

		geometry.bones.push
			parent: b.parent
			name : "#{b.i1}.#{b.idx}.#{b.i3}"
			pos: pos.toArray()
			rotq: rotq.toArray()

calculateBoneParentship = (frames, skeleton) ->
	return unless skeleton?.bones?

	boneParents = {}
	boneById = {}

	# Find bone-to-frame mapping, save reverse lookup table
	for frame, idx in frames.animations when frame.someFlag
		continue if frames[idx].parentFrame is -1
		parentBoneId = frames.animations[frames[idx].parentFrame].i1
		boneParents[frame.i1] =
			boneId: parentBoneId
			frame: frames[idx]
		boneById[parentBoneId] ?= []
		boneById[parentBoneId].push boneParents[frame.i1]

	# Fill parent bone id's in the boneParents mapping
	for bone, idx in skeleton.bones
		for obj in boneById[bone.i1] or []
			obj.index = idx

	# Save parent bone id's for every bone
	for bone, idx in skeleton.bones
		parent = boneParents[bone.i1]
		bone.parent = if parent.boneId is -1 then -1 else parent.index
		bone.frame = parent.frame

parseMaterials = (materials, data, filePath, skinned) ->
	texturePath = utils.texturePathByModelPath filePath
	textureFormat = ".BMP"
	addressModes =
		0: THREE.ClampToEdgeWrapping
		1: THREE.RepeatWrapping
		2: THREE.MirroredRepeatWrapping
		3: THREE.ClampToEdgeWrapping
		4: THREE.ClampToEdgeWrapping
	for material in data
		threeMaterial = new THREE.MeshBasicMaterial()
		wrapS = THREE.RepeatWrapping # addressModes[material.texture.addrModeU]
		wrapT = THREE.RepeatWrapping # addressModes[material.texture.addrModeV]
		threeMaterial.vertexColors = THREE.VertexColors
		threeMaterial.skinning = skinned
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
			threeMaterial.depthWrite = false
			threeMaterial.alphaTest = 0.05
		materials.push threeMaterial

parseModel = (data, filePath) ->
	geometry = new THREE.Geometry()
	materials = []

	modelFrames = data.entries[1].data.frames
	modelFrames.animations = data.entries[1].animations
	modelGeometry = data.entries[3].data
	modelMaterials = data.entries[4].materials
	modelSkin = data.entries[5].skin

	if modelSkin
		calculateBoneParentship modelFrames, modelSkin
		parseSkeleton geometry, modelSkin, modelFrames

	parseVertices geometry, modelGeometry
	parseFaces geometry, modelGeometry
	# parseColors geometry, modelGeometry
	parseUVs geometry, modelGeometry
	parseMaterials materials, modelMaterials, filePath, !!modelSkin

	geometry.dynamic = false
	geometry.computeFaceNormals()
	geometry.computeBoundingSphere()

	Mesh = if modelSkin then THREE.SkinnedMesh else THREE.Mesh
	new Mesh geometry, new THREE.MeshFaceMaterial materials

exports.loadModel = (filePath, callback) ->
	file = fs.createReadStream filePath
	file.on "error", -> # nothings
	parser = new StreamParser()
	parser.on "data", (data) ->
		try
			callback null, parseModel data, filePath
		catch e
			callback e
	file.pipe parser

exports.loadModelAsync = Promise.promisify exports.loadModel