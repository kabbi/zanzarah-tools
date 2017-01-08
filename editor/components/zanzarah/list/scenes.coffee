Component = requireComponent "base"
logger = requireLogger module

utils = requireRoot "lib/utils"
fs = require "fs"

module.exports = class SceneList extends Component
	attach: (entity) ->
		super entity
		entity.makeSceneListWindow()

	makeSceneListWindow: ->
		@sceneListBar = @ATB.NewBar "sceneList"
		@ATB.Define " sceneList label='Scene list' "
		scenesPath = "#{utils.resourcesPath}Worlds/"
		fs.readdir scenesPath, (err, files) =>
			return if err
			idx = 0
			for file in files
				do (file) =>
					@sceneListBar.AddButton "loadScene#{idx++}", =>
						@client.getSystem("world.loaders.scene").loadScene "#{scenesPath}#{file}"
					, " label='#{file}' help='Load scene from #{scenesPath}#{file}'"

	setScenesWindowVisible: (flag) ->
		@ATB.Define " sceneList iconified=#{!flag} "