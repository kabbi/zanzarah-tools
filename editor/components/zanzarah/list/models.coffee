Component = requireComponent "base"
logger = requireLogger module

utils = requireRoot "lib/utils"
glob = require "glob"
path = require "path"
fs = require "fs"

module.exports = class SceneList extends Component
	attach: (entity) ->
		super entity
		entity.makeModelListWindow()

	makeModelListWindow: ->
		@modelListBar = @ATB.NewBar "modelsList"
		@ATB.Define " modelsList label='Model list' "
		modelsRootPath = "#{utils.resourcesPath}../MODELS"
		modelsPath = "#{modelsRootPath}/**/*.DFF"
		glob modelsPath, (err, files) =>
			throw new Error(err) if err
			@modelFiles = files
			for file, idx in files
				@modelListBar.AddButton "loadModel#{idx++}", @makeModelLoaderCallback(file),
					" label='#{path.relative modelsRootPath, file}'"

	setModelsWindowVisible: (flag) ->
		@ATB.Define " modelsList iconified=#{!flag} "

	makeModelLoaderCallback: (fileName) ->
		=> @client.getSystem("world.loaders.model").loadModel fileName
