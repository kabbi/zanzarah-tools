Component = requireComponent "base"
logger = requireLogger module

module.exports = class Body extends Component
	attach: (entity) ->
		super entity