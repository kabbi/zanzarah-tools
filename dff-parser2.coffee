Dissolve = require "dissolve"
fs = require "fs"

sectionTypes = 
	0x0000: "rwID_NAOBJECT"
	0x0001: "rwID_STRUCT"
	0x0002: "rwID_STRING"
	0x0003: "rwID_EXTENSION"
	0x0010: "rwID_CLUMP"
	0x0202: "eof"

dataSections = ["rwID_STRUCT", "rwID_STRING"]

loaderCount = 0

# Utility base class

class BaseStreamParser extends Dissolve

	constructor: ->
		Dissolve.call @

	unparse: (names...) ->
		@tap -> delete @vars[name] for name in names
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

class StreamParser extends BaseStreamParser

	constructor: ->
		BaseStreamParser.call @
		@sectionList().tap ->
			# Pop eof chunk
			@vars.entries.pop()
			@push @vars	

	section: ->
		@header()
		.tap ->
			switch @vars.type
				when "eof"
					@stopParsing = true
					return
				when "rwID_STRING"
					@buffer "data", @vars.size
					.unparse "data"
				when "rwID_STRUCT"
					@buffer "data", @vars.size
					.unparse "data"
				else
					@buffer "data", @vars.size
					.tap ->
						vars = @vars
						parser = new StreamParser()
						parser.on "data", (chunkList) ->
							vars.children = chunkList.entries
							loaderCount--
						parser.write @vars.data
						delete @vars.data
						loaderCount++

	header: ->
		@uint32le "type"
		.uint32le "size"
		.uint32le "version"
		.tap ->
			@vars.type = sectionTypes[@vars.type] or "rwID_ERROR@#{@vars.type}"

	sectionList: ->
		@loop "entries", (end) ->
			return end true if @stopParsing
			@section()

exports.StreamParser = StreamParser

# Handle utility call directly from console
if require.main is module
	parser = new StreamParser()
	parser.on "data", (model) ->
		console.log JSON.stringify model, null, 4
	process.stdin.pipe parser