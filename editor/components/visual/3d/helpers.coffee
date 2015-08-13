Component = requireComponent "base"
logger = requireLogger module

module.exports = class Helpers extends Component
	schema:
		$schema: "http://json-schema.org/draft-04/schema#"
		title: "Three helpers"
		description: "Some 3D helper functions"
		type: "object"

	polarToCartesian: (vectorLength, vectorDirection) ->
		x: vectorLength * Math.cos vectorDirection
		y: vectorLength * Math.sin vectorDirection