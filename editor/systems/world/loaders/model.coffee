System = requireSystem "base"
logger = requireLogger module
path = require "path"
fs = require "fs"
_ = require "lodash"

utils = requireRoot "lib/utils"
{loadModelAsync} = requireRoot "lib/loaders/dff-loader"

module.exports = class ModelLoader extends System
	constructor: (client, viewer) ->
		super client
		logger.info "Bootstrapping world"

		@client.addSystem "world.renderer.three"
		@client.addSystem "ui.base"

		entity = requireEntity "base"
		@sceneEntity = entity = new entity @client
		entity.addComponent "world.renderer.scene",
			backgroundColor: 0xffffff
		entity.addComponent "world.camera.orbit"
		entity.addComponent "zanzarah.list.models"
		client.addEntity entity

		@checkArguments()

	prepare: (entity) ->
		entity.loader = @

	checkArguments: ->
		yargs = require "yargs"
		args = yargs.argv
		modelFile = args["_"][0]
		return unless modelFile
		modelMath = "#{utils.resourcesPath}Worlds/#{modelFile}.scn"
		@loadModel modelMath

	loadModel: (modelFile) ->
		@unloadModel() if @loadedModel
		logger.info "Loading model #{modelFile}"

		# Actually load model file
		loadModelAsync(modelFile).then (mesh) =>
			scale = mesh.geometry.boundingSphere.radius / 50
			# @sceneEntity.controls.setScale scale
			@sceneEntity.controls.center = mesh.position
			@sceneEntity.scene.add mesh

			entity = requireEntity "base"
			entity = new entity @client
			entity.addComponent "zanzarah.model",
				object: mesh
			entity.addComponent "ui.window",
				windowName: path.basename modelFile
				createByDefault: true
				closeable: false
			@client.addEntity entity
			mesh.userData = entity

			@loadedModel = modelFile

	unloadModel: ->
		logger.info "Unloading model #{@loadedModel}"
		entities = @client.entities
		for id, entity of entities
			entity.destroy()
		@loadedModel = null

String::toTitleCase ?= ->
	@replace /\w\S*/g, (txt) ->
		txt[0].toUpperCase() + txt[1..txt.length - 1].toLowerCase()
