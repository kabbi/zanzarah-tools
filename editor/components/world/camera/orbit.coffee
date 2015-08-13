Component = requireComponent "base"
logger = requireLogger module

OrbitControls = requireRoot "lib/controls/OrbitControls"
TransformControls = requireRoot "lib/controls/TransformControls"

module.exports = class Orbit extends Component
	attach: (entity) ->
		super entity

		entity.controls = new OrbitControls entity.camera,
			entity.renderer.domElement, entity.windowSize

		entity.transformControls = new TransformControls entity.camera,
			entity.renderer.domElement, entity.controls, entity.windowSize

		entity.scene.add entity.transformControls

		entity.client.on "render:before", (delta) ->
			entity.transformControls.update delta