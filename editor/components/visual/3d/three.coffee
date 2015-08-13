Component = requireComponent "base"
logger = requireLogger module

module.exports = class Helpers extends Component
	schema:
		$schema: "http://json-schema.org/draft-04/schema#"
		title: "Three helpers"
		description: "Some 3D helper functions"
		type: "object"

	attach: (entity) ->
		super entity
		
		threeSystem = @client.getSystem "world.renderer.three"
		singleton = threeSystem.singleton

		logger.debug "injecting three into #{entity.id}"
		entity.THREE = singleton.THREE
		entity.scene = singleton.scene
		entity.camera = singleton.camera