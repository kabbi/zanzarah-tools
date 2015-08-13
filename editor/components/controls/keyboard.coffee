Component = requireComponent "base"
logger = requireLogger module

module.exports = class Keyboard extends Component
	attach: (entity) ->
		super entity
		entity.keyboard = pressed: {}

		pressedKeys = entity.keyboard.pressed
		doc = entity.THREE.document
		doc.on "keydown", (event) ->
			pressedKeys[event.keyCode] = true
			entity.keyDown? event
		doc.on "keyup", (event) ->
			pressedKeys[event.keyCode] = false
			entity.keyUp? event