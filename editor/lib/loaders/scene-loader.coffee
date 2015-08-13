THREE = require "node.three.js"
Promise = require "bluebird"
fs = require "fs"

DffLoader = require "./dff-loader"
BspLoader = require "./bsp-loader"
{SceneParser} = require "../../../scene-parser"

dbNpcs = require "../../data/_fb0x05.fbs"

pathPrefix = "../../MODELS/MODELS/"
actorPathPrefix = "../../MODELS/ACTORSEX/"
pathExt = ".DFF"

dbFindNpcById = (uid) ->
	for entry in dbNpcs.entries when entry.uid is uid
		return entry
	return null

parseNpcModelScript = (str) ->
	for line in str.split "\n" when line[...2] is "C."
		return line[2..]
	return null

parseFOModels = (container, data, callback) ->
	return unless data?
	for model in data
		# continue if model.fileName is "ila04h"
		fileName = "#{pathPrefix}#{model.fileName.toUpperCase()}#{pathExt}"
		# console.log "Loading model #{fileName}"
		do (model, fileName) ->
			DffLoader.loadModelAsync(fileName).then (mesh) ->
				mesh.rotation.set 0, Math.PI / 2 * model.v2.x, 0
				mesh.position.copy model.v1
				# mesh.scale.set 1, 0.1, 0.1
				callback? model, mesh, "fomodel"
				container.add mesh

parseModels = (container, data, callback) ->
	return unless data?
	for model in data
		fileName = "#{pathPrefix}#{model.fileName.toUpperCase()}#{pathExt}"
		# console.log "Loading model #{fileName}"
		do (model, fileName) ->
			DffLoader.loadModelAsync(fileName).then (mesh) ->
				mesh.rotation.set 0, Math.PI / 2 * model.rotation.x, 0
				mesh.position.copy model.position
				# mesh.scale.set 1, 0.1, 0.1
				callback? model, mesh, "model"
				container.add mesh

parseLights = (container, data, callback) ->
	return unless data?
	for light in data
		geometry = new THREE.SphereGeometry 0.5, 32, 32
		material = new THREE.MeshBasicMaterial color: 0xffffff
		mesh = new THREE.Mesh geometry, material
		# mesh.rotation.set 0, Math.PI / 2 * light.v2.x, 0
		mesh.position.copy light.v1 if light.v1
		callback? light, mesh, "light"
		container.add mesh

debugDynamicModels = (container, data, callback) ->
	return unless data?
	for model in data
		geometry = new THREE.SphereGeometry 0.5, 16, 16
		material = new THREE.MeshBasicMaterial color: 0xff0000
		mesh = new THREE.Mesh geometry, material
		mesh.position.copy model.position
		callback? model, mesh, "dymodel"
		container.add mesh

debugTriggers = (container, data, callback) ->
	return unless data?
	triggerColors =
		0: 0x00f044 # maybe portals
		1: 0x43706e # maybe starting pos
		3: 0xff7fee # maybe interactable
		5: 0x4f7fee # maybe unknown
	for trigger in data
		triggerMesh = null
		color = triggerColors[trigger.ii] or 0xffff00
		# continue unless trigger.type is 1 or trigger.type is 2
		if trigger.int
			radius = trigger.int
			geometry = new THREE.OctahedronGeometry 1
			material = new THREE.MeshBasicMaterial color: color, wireframe: true
			triggerMesh = new THREE.Mesh geometry, material
			triggerMesh.scale.set radius, radius, radius
			triggerMesh.position.copy trigger.vv
			callback? trigger, triggerMesh, "trigger"
			container.add triggerMesh
		else
			geometry = new THREE.OctahedronGeometry 1
			material = new THREE.MeshBasicMaterial color: color, wireframe: true
			triggerMesh = new THREE.Mesh geometry, material
			triggerMesh.scale.set 0.5, 0.5, 0.5
			triggerMesh.position.copy trigger.vv

			directionArrow = new THREE.ArrowHelper trigger.v,
				new THREE.Vector3(), 2, 0x0000ff, undefined, 0.3
			triggerMesh.add directionArrow

			callback? trigger, triggerMesh, "trigger"
			container.add triggerMesh

		if trigger.ii is 3
			npc = dbFindNpcById trigger.ii1.toString(16).toUpperCase()
			continue unless npc and trigger.vv
			fileName = parseNpcModelScript npc.data1[2].string
			fileName = "#{actorPathPrefix}#{fileName.toUpperCase()}#{pathExt}"
			do (trigger, triggerMesh, fileName) ->
				DffLoader.loadModelAsync(fileName).then (mesh) ->
					# Compensate trigger object scaling
					mesh.scale.set 2, 2, 2
					triggerMesh.add mesh

debugEffects = (container, data, callback) ->
	return unless data?
	for effect in data
		continue unless effect.type is "ef2UNKNOWN5"
		geometry = new THREE.SphereGeometry 0.1, 16, 16
		material = new THREE.MeshBasicMaterial color: 0x00ff00
		mesh = new THREE.Mesh geometry, material
		mesh.position.copy effect.v3
		callback? effect, mesh, "effect"
		container.add mesh

loadBackdrop = (container, data, callback) ->
	return unless data?.Backdrop?.backdropFile
	fileName = "../../MODELS/BACKDROPS/#{data.Backdrop.backdropFile.toUpperCase()}.DFF"
	DffLoader.loadModelAsync(fileName).then (mesh) ->
		callback? data.Backdrop, mesh, "backdrop"
		container.add mesh

loadWorld = (container, data, callback) ->
	worldFileName = "../../WORLDS/#{data.Misc.sceneFile.toUpperCase()}.BSP"
	# console.log "Loading world #{worldFileName}"
	BspLoader.loadModelAsync(worldFileName).then (mesh) ->
		callback? data.Misc, mesh, "world"
		container.add mesh

parseScene = (data, objectLoadCallback) ->
	container = new THREE.Object3D()
	THREE.document.setTitle "#{data.Misc.sceneFile}"
	parseFOModels container, data.FOModels_v4.models, objectLoadCallback
	parseModels container, data.Models_v3.models, objectLoadCallback
	parseLights container, data.Lights.lights, objectLoadCallback

	debugDynamicModels container, data.DynamicModels.models, objectLoadCallback
	debugTriggers container, data.Triggers.triggers, objectLoadCallback
	debugEffects container, data.Effects_v2.effects, objectLoadCallback

	loadBackdrop container, data, objectLoadCallback
	loadWorld container, data, objectLoadCallback

	geometry = new THREE.SphereGeometry 0.1, 16, 16
	material = new THREE.MeshBasicMaterial color: 0x000000
	centerObj = new THREE.Mesh geometry, material
	centerObj.position.copy data.Misc.v1
	centerObj.name = "sceneCenter"
	objectLoadCallback data, centerObj, "scene"
	container.add centerObj

	container

exports.loadScene = (stream, objectLoadCallback, callback) ->
	parser = new SceneParser()
	parser.on "data", (data) ->
		callback null, parseScene data, objectLoadCallback
	stream.pipe parser

exports.loadSceneAsync = Promise.promisify exports.loadScene