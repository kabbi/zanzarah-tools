Component = requireComponent "base"
logger = requireLogger module

module.exports = class Mouse extends Component
	attach: (entity) ->
		super entity

		doc = entity.THREE.document
		doc.on "mousemove", (event) ->
			entity.mouseMove? event
		doc.on "mouseup", (event) ->
			entity.mouseUp? event
		doc.on "mousedown", (event) ->
			entity.mouseDown? event