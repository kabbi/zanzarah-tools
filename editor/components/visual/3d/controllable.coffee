Component = requireComponent "base"
logger = requireLogger module

module.exports = class Controllable extends Component
	schema:
		$schema: "http://json-schema.org/draft-04/schema#"
		title: "#TODO"
		description: "#TODO"
		dependencies: ["visual.3d.three", "visual.3d.helpers", "visual.3d.model"]
		type: "object"
		properties:
			cameraOffsetH:
				type: "integer"
			cameraOffsetV:
				type: "integer"
		required: []

	attach: (entity) ->
		super entity
		entity.controlKeys ?=
			jump: 32
			forward: 87
			backward: 83
			left: 65
			right: 68
		entity.accelerationValues =
			position:
				acceleration: "acceleration"
				speed: "speed"
				speedMax: "speedMax"
			rotation:
				acceleration: "rotationAcceleration"
				speed: "rotationSpeed"
				speedMax: "rotationSpeedMax"
		entity.rotationRadians = new entity.THREE.Vector3 0, 0, 0
		entity.rotationAngleX = null
		entity.rotationAngleY = null
		entity.acceleration = 0;
		entity.rotationAcceleration = 0;
		entity.speed = 1.5
		entity.speedMax = 45
		entity.rotationSpeed = 0.007
		entity.rotationSpeedMax = 0.04

		@client.on "render:before", ->
			entity.processUserInput()
			entity.accelerate()
			entity.rotate()
			entity.updateCamera?()

	processUserInput: ->
		if @keyboard.pressed[@controlKeys.forward]
			@updateAcceleration @accelerationValues.position, 1
		if @keyboard.pressed[@controlKeys.backward]
			@updateAcceleration @accelerationValues.position, -1

		if @keyboard.pressed[@controlKeys.right]
			@updateAcceleration @accelerationValues.rotation, 1
		if @keyboard.pressed[@controlKeys.left]
			@updateAcceleration @accelerationValues.rotation, -1

	updateAcceleration: (values, direction) ->
		# Distinguish between acceleration/rotation and forward/right (1) and backward/left (-1)
		if direction is 1
			# Forward/right
			if @[values.acceleration] > -@[values.speedMax]
				if @[values.acceleration] >= @[values.speedMax] / 2
					@[values.acceleration] = -(@[values.speedMax] / 4)
				else
					@[values.acceleration] -= @[values.speed]
			else
				@[values.acceleration] = -@[values.speedMax]
		else
			# Backward/left
			if @[values.acceleration] < -@[values.speedMax]
				if @[values.acceleration] <= @[values.speedMax] / 2
					@[values.acceleration] = (@[values.speedMax] / 4)
				else
					@[values.acceleration] += @[values.speed]
			else
				@[values.acceleration] = @[values.speedMax]

	mouseMoved: (event) ->
		@cameraOffsetH = event.x - @windowSize.width / 2
