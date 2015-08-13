Component = requireComponent "base"
logger = requireLogger module

module.exports = class Selectable extends Component
	attach: (entity) ->
		super entity
		# Default properties
		entity.selectable ?= true
		# Bounding box helper
		if entity.object and entity.object.type is "Mesh"
			entity.bbox = new entity.THREE.BoxHelper entity.object
			entity.bbox.visible = false
			entity.scene.add entity.bbox
		
	setSelected: (flag) ->
		return unless @selectable
		@selected = flag
		@bbox?.visible = flag
