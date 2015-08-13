System = requireSystem "base"
logger = requireLogger module
fs = require "fs"
_ = require "lodash"

utils = requireRoot "lib/utils"
{loadSceneAsync} = requireRoot "lib/loaders/scene-loader"
{SceneSerializer} = require "../../../scene-serializer"

module.exports = class SceneLoader extends System
	constructor: (client, sceneFile) ->
		super client
		logger.info "Bootstrapping world"

		@client.addSystem "world.renderer.three"
		@client.addSystem "ui.base"

		@lastIdxByType =
			model: 0
			fomodel: 0
			dymodel: 0
			light: 0
			trigger: 0

		entity = requireEntity "base"
		@sceneEntity = entity = new entity @client
		entity.addComponent "world.renderer.scene",
			backgroundColor: 0xffffff
		entity.addComponent "world.camera.orbit"
		client.addEntity entity

		@checkArguments()

	prepare: (entity) ->
		entity.loader = @

	checkArguments: ->
		yargs = require "yargs"
		args = yargs.argv
		sceneFile = args["_"][0]
		return unless sceneFile
		scenesPath = "#{utils.resourcesPath}Worlds/#{sceneFile}.scn"
		@loadScene scenesPath

	loadScene: (sceneFile) ->
		@unloadScene() if @loadedScene
		logger.info "Loading scene #{sceneFile}"
		objectLoadCallback = (data, object, type) =>
			if data.idx?
				@lastIdxByType[type] = Math.max @lastIdxByType[type], data.idx
			entity = requireEntity "base"
			entity = new entity @client
			entity.addComponent "zanzarah.#{type}",
				type: type
				data: data
				object: object
			entity.addComponent "ui.selectable",
				selectable: type not in ["backdrop", "world", "scene"]
			entity.addComponent "ui.editable",
				editable: type not in ["backdrop", "world"]
			entity.addComponent "ui.clickable"
			windowName = if type is "scene" then data.Misc.sceneFile else "#{type.toTitleCase()} #{data.idx}"
			entity.addComponent "ui.window",
				windowName: windowName
				createByDefault: type in ["scene"]
				closeable: type not in ["scene"]
			@zanzarahScene = entity if type is "scene"
			@client.addEntity entity
			object.userData = entity

		# Actually load scene file
		sceneFileStream = fs.createReadStream sceneFile
		sceneFileStream.on "error", ->
			logger.error "Scene file not found: #{sceneFile}"
			process.exit 1
		loadSceneAsync(sceneFileStream, objectLoadCallback).then (container) =>
			@loadedScene = sceneFile
			@sceneEntity.controls.center = container.getObjectByName("sceneCenter").position
			@sceneEntity.scene.add container
			# Hide load scene window
			@client.getSystem("ui.base").setScenesWindowVisible false

	unloadScene: ->
		logger.info "Unloading scenee #{@loadedScene}"
		entities = @client.entities
		for id, entity of entities
			entity.destroy()
		@loadedScene = null

	reloadScene: ->
		@loadScene @loadedScene

	saveScene: ->
		return logger.error "Cannot save, no scene loaded" unless @zanzarahScene
		# Prepare object mapping, for serializer to know
		# wich objects correspond to each scene member
		entityMapping = {}
		objectTypes = ["trigger", "light", "model", "fomodel", "dymodel"]
		for id, entity of @client.entities when entity.type in objectTypes
			entityMapping[entity.type] ?= {}
			entityMapping[entity.type][entity.data.idx] = entity.object
		# Write triggers
		@zanzarahScene.data.Triggers.triggers = []
		for idx, trigger of entityMapping["trigger"]
			@zanzarahScene.data.Triggers.triggers.push trigger
		@zanzarahScene.data.Triggers.count = @zanzarahScene.data.Trigger.triggers.length
		serializer = new SceneSerializer()
		data = serializer.serialize @zanzarahScene.data
		fs.writeFile @loadedScene, data, (err) ->
			return logger.error err if err
			logger.info "Saved scene #{@loadedScene}"

	cloneEntity: (entity) ->
		return if entity.type in ["backdrop", "world", "scene"]
		newEntity = requireEntity "base"
		newEntity = new newEntity @client
		# We are owerwriting userData here to overcome three.js
		# user data limitation, as we use refs, and three.js uses JSON.stringify
		entity.object.userData = null
		# Clone every thing we can
		newEntity.addComponent "zanzarah.#{entity.type}",
			type: entity.type
			data: _.cloneDeep entity.data
			object: entity.object.clone()
		newEntity.data.idx = @lastIdxByType[entity.type]++
		# Put back the old userData pointer
		entity.object.userData = entity
		newEntity.addComponent "ui.selectable"
		newEntity.addComponent "ui.editable"
		newEntity.addComponent "ui.clickable"
		newEntity.addComponent "ui.window",
			windowName: "#{entity.type.toTitleCase()} #{newEntity.data.idx}"
		@client.addEntity newEntity
		newEntity.object.userData = newEntity
		# Don't forget to add object back to scene graph
		entity.object.parent.add newEntity.object
		return newEntity


String::toTitleCase ?= ->
	@replace /\w\S*/g, (txt) ->
        txt[0].toUpperCase() + txt[1..txt.length - 1].toLowerCase()
