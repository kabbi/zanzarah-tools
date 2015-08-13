Component = requireComponent "base"
logger = requireLogger module

module.exports = class Selectable extends Component
	attach: (entity) ->
		super entity
		# Default properties
		entity.editable ?= true
		# Setup window entries
		entity.windowEntries ?= []
		if entity.editable
			entity.windowEntries.push.apply entity.windowEntries, [
				control: "button"
				name: "cloneObject"
				cb: ->
					newEntity = entity.loader.cloneEntity entity
					entity.loader.sceneEntity.transformControls.attach newEntity.object
					entity.closeWindow()
				def: "group='Scene object' label='[Clone]'"
			,
				control: "button"
				name: "removeObject"
				cb: ->
					entity.destroy()
					entity.closeWindow()
				def: "group='Scene object' label='[Remove]'"
			]