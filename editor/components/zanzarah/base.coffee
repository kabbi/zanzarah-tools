Component = requireComponent "base"
logger = requireLogger module

OrbitControls = requireRoot "lib/controls/OrbitControls"

module.exports = class ZanzarahComponent extends Component
	attach: (entity) ->
		super entity

	detach: (entity) ->
		super entity
		entity.object.parent.remove entity.object
		
	dataOnly: true