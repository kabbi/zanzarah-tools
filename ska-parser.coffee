Dissolve = require "dissolve"
fs = require "fs"

clump = (fval) ->
	val = if fval >= 1 then 255 else fval * 255
	val = Math.round val
	clumpInt val
clumpInt = (val) ->
	val = val.toString 16
	val = "0#{val}" if val.length < 2
	val
floatColorToStr = (c) ->
	"0x#{clump c.a}#{clump c.r}#{clump c.g}#{clump c.b}"
intColorToStr = (c) ->
	"0x#{clumpInt c.a}#{clumpInt c.r}#{clumpInt c.g}#{clumpInt c.b}"

class AnimationParser extends Dissolve

	constructor: ->
		Dissolve.call @
		# Main parser loop
		@animation().tap ->
			@push @vars

	# Utility methods

	unparse: (names...) ->
		@tap -> delete @vars[name] for name in names
		return @

	break: ->
		@tap -> @stopParsing = true
		return @

	counted: (name, countVar, cb) ->
		currentCount = 0
		@uint32le countVar
		.loop name, (end) ->
			return end true if currentCount++ is @vars[countVar]
			cb.call @

	exactlyCounted: (name, count, cb) ->
		currentCount = 0
		@loop name, (end) ->
			return end true if currentCount++ is count
			cb.call @

	flatten: (item, prop) ->
		@tap ->
			for i in [0...@vars[item].length]
				@vars[item][i] = @vars[item][i][prop]

	# Renderware specific item parsers

	animation: () ->
		@uint32le "pointCount"
		.int32le "flags"
		.floatle "duration"
		.tap ->
			@exactlyCounted "points", @vars.pointCount, @point
		# .unparse "blocks"

	point: ->
		@tap "rot", ->
			@floatle "x"
			.floatle "y"
			.floatle "z"
			.floatle "w"
		.tap "pos", ->
			@floatle "x"
			.floatle "y"
			.floatle "z"
		.floatle "time"
		.uint32le "parent"
		.tap ->
			@vars.parent /= 36
			# TODO: consider enabling back normalization code
			# recipr = Math.sqrt @vars.f1 * @vars.f1 + @vars.f2 * @vars.f2 +
			# 	@vars.f3 * @vars.f3 + @vars.f4 * @vars.f4
			# @vars.f1 /= recipr
			# @vars.f2 /= recipr
			# @vars.f3 /= recipr
			# @vars.f4 /= recipr

exports.AnimationParser = AnimationParser

# Handle utility call directly from console
if require.main is module
	parser = new AnimationParser()
	parser.on "data", (animation) ->
		console.log JSON.stringify animation, null, 4
	process.stdin.pipe parser