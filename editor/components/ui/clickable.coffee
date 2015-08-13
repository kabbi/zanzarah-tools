Component = requireComponent "base"
logger = requireLogger module

module.exports = class Clickable extends Component
	attach: (entity) ->
		super entity
		# Default properties
		entity.clickable ?= true
		
	click: (event) ->
		return unless @clickable
		@onClick? event
