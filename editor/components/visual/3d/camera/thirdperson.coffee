Component = requireComponent "base"
logger = requireLogger module

module.exports = class ThirdpersonCamera extends Component
	attach: (entity) ->
		super entity

		THREE = entity.THREE
		entity.controlsEnabled = true

		entity.noRotate = false
		entity.rotateSpeed = 1.0
		entity.moveSpeed = 1

		entity.autoRotate = false
		entity.autoRotateSpeed = 2.0 # 30 seconds per round when fps is 60

		entity.minPolarAngle = 0
		entity.maxPolarAngle = Math.PI

		entity.minAzimuthAngle = - Infinity
		entity.maxAzimuthAngle = Infinity

		entity.mouseButtons = ORBIT: THREE.MOUSE.LEFT
		entity.controlKeys ?=
			jump: 32
			forward: 87
			backward: 83
			left: 65
			right: 68

		entity._EPS = 0.000001

		entity._rotateStart = new THREE.Vector2()
		entity._rotateEnd = new THREE.Vector2()
		entity._rotateDelta = new THREE.Vector2()

		entity._offset = new THREE.Vector3()

		entity._theta = 0
		entity._phi = 0
		entity._phiDelta = 0
		entity._thetaDelta = 0

		entity._scale = 1

		entity._lastPosition = new THREE.Vector3()
		entity._lastQuaternion = new THREE.Quaternion()

		entity._STATE = NONE: -1, ROTATE: 0

		entity._state = entity._STATE.NONE

		entity._quat = new THREE.Quaternion().setFromUnitVectors entity.camera.up, new THREE.Vector3(0, 1, 0)
		entity._quatInverse = entity._quat.clone().inverse()

		@client.on "render:before", ->
			entity.processUserInput()

	processUserInput: ->
		vector = @camera.position.clone().sub @model.position
		vector.normalize().multiplyScalar @moveSpeed

		if @keyboard.pressed[@controlKeys.forward]
			@model.position.sub vector
			@updateCamera()

		if @keyboard.pressed[@controlKeys.backward]
			@model.position.add vector
			@updateCamera()

	mouseDown: (event) ->
		return unless @controlsEnabled

		if event.button is @mouseButtons.ORBIT
			return if @noRotate
			@_state = @_STATE.ROTATE
			@_rotateStart.set event.pageX, event.pageY

	mouseMove: (event) ->
		return unless @controlsEnabled

		if @_state is @_STATE.ROTATE
			return if @noRotate

			@_rotateEnd.set event.pageX, event.pageY
			@_rotateDelta.subVectors @_rotateEnd, @_rotateStart

			@_thetaDelta -= 2 * Math.PI * @_rotateDelta.x / @windowSize.width * @rotateSpeed
			@_phiDelta -= 2 * Math.PI * @_rotateDelta.y / @windowSize.height * @rotateSpeed

			@_rotateStart.copy @_rotateEnd

		@updateCamera()

	mouseUp: (event) ->
		return unless @controlsEnabled
		@_state = @_STATE.NONE

	updateCamera: ->
		position = @camera.position

		@_offset.copy(position).sub @model.position

		@_offset.applyQuaternion @_quat

		@_theta = Math.atan2 @_offset.x, @_offset.z

		@_phi = Math.atan2 Math.sqrt(@_offset.x * @_offset.x + @_offset.z * @_offset.z), @_offset.y

		@_theta += @_thetaDelta
		@_phi += @_phiDelta

		@_theta = Math.max @minAzimuthAngle, Math.min(@maxAzimuthAngle, @_theta)
		@_phi = Math.max @minPolarAngle, Math.min(@maxPolarAngle, @_phi)

		@_phi = Math.max @_EPS, Math.min(Math.PI - @_EPS, @_phi)

		radius = @_offset.length() * @_scale

		@_offset.x = radius * Math.sin( @_phi ) * Math.sin( @_theta )
		@_offset.y = radius * Math.cos( @_phi )
		@_offset.z = radius * Math.sin( @_phi ) * Math.cos( @_theta )

		@_offset.applyQuaternion @_quatInverse

		position.copy(@model.position).add @_offset

		@camera.lookAt @model.position

		@_thetaDelta = 0
		@_phiDelta = 0

		if @_lastPosition.distanceToSquared(@camera.position) > @_EPS or 8 * (1 - @_lastQuaternion.dot(@camera.quaternion)) > @_EPS
			@_lastPosition.copy @camera.position
			@_lastQuaternion.copy @camera.quaternion
