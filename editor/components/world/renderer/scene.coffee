Component = requireComponent "base"
logger = requireLogger module
path = require "path"

module.exports = class Three extends Component
	attach: (entity) ->
		super entity

		THREE = entity.THREE

		entity.camera = camera = new THREE.PerspectiveCamera 75,
			entity.windowSize.width / entity.windowSize.height, 0.1, 1000
		camera.far *= 1000
		camera.updateProjectionMatrix()
		camera.position.y = 100
		camera.position.z = 100

		entity.scene = scene = new THREE.Scene()

		entity.renderer.setClearColor entity.backgroundColor
		