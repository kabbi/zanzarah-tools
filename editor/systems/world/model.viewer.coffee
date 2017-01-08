System = requireSystem "base"
logger = requireLogger module
fs = require "fs"
_ = require "lodash"

utils = requireRoot "lib/utils"
{loadModelAsync} = requireRoot "lib/loaders/dff-loader"
{loadAnimationAsync} = requireRoot "lib/loaders/ska-loader"

module.exports = class SceneLoader extends System
	constructor: (client) ->
		super client
		logger.info "Bootstrapping world"

		@client.addSystem "world.renderer.three"
		@client.addSystem "ui.base"

		entity = requireEntity "base"
		@sceneEntity = entity = new entity @client
		entity.addComponent "world.renderer.scene",
			backgroundColor: 0xffffff
		entity.addComponent "world.camera.orbit"
		client.addEntity entity

	prepare: (entity) ->
		entity.loader = @

	# loadScene: (sceneFile) ->
	# 	@unloadScene() if @loadedScene
	# 	logger.info "Loading scene #{sceneFile}"
	# 	objectLoadCallback = (data, object, type) =>
	# 		if data.idx?
	# 			@lastIdxByType[type] = Math.max @lastIdxByType[type], data.idx
	# 		entity = requireEntity "base"
	# 		entity = new entity @client
	# 		entity.addComponent "zanzarah.#{type}",
	# 			type: type
	# 			data: data
	# 			object: object
	# 		entity.addComponent "ui.selectable",
	# 			selectable: type not in ["backdrop", "world", "scene"]
	# 		entity.addComponent "ui.editable",
	# 			editable: type not in ["backdrop", "world"]
	# 		entity.addComponent "ui.clickable"
	# 		windowName = if type is "scene" then data.Misc.sceneFile else "#{type.toTitleCase()} #{data.idx}"
	# 		entity.addComponent "ui.window",
	# 			windowName: windowName
	# 			createByDefault: type in ["scene"]
	# 			closeable: type not in ["scene"]
	# 		@zanzarahScene = entity if type is "scene"
	# 		@client.addEntity entity
	# 		object.userData = entity
    #
	# 	# Actually load scene file
	# 	sceneFileStream = fs.createReadStream sceneFile
	# 	sceneFileStream.on "error", ->
	# 		logger.error "Scene file not found: #{sceneFile}"
	# 		process.exit 1
	# 	loadSceneAsync(sceneFileStream, objectLoadCallback).then (container) =>
	# 		@loadedScene = sceneFile
	# 		@sceneEntity.controls.center = container.getObjectByName("sceneCenter").position
	# 		@sceneEntity.scene.add container
	# 		# Hide load scene window
	# 		@client.getSystem("ui.base").setScenesWindowVisible false

	# unloadScene: ->
	# 	logger.info "Unloading scenee #{@loadedScene}"
	# 	entities = @client.entities
	# 	for id, entity of entities
	# 		entity.destroy()
	# 	@loadedScene = null

	# reloadScene: ->
	# 	@loadScene @loadedScene

String::toTitleCase ?= ->
	@replace /\w\S*/g, (txt) ->
        txt[0].toUpperCase() + txt[1..txt.length - 1].toLowerCase()
