Dissolve = require "dissolve"
iconv = require "iconv"
fs = require "fs"

con = require "./constants"
conv = new iconv.Iconv "windows-1251", "utf8"

fatal = (msg) ->
	process.stderr.write "Fail: #{msg}\n"
	# process.exit 0

toHex = (number) ->
	str = ("00000000" + number.toString 16).slice -8
	str.toUpperCase()

class DBIndexParser extends Dissolve
	constructor: ->
		Dissolve.call @
		@loop (end) ->
			@databaseIndex()
			if @stopParsing
				@push @vars
				end()

	zstring: (name) ->
		lenProp = "#{name}_len"
		@uint32le lenProp
		.string name, lenProp
		.tap -> delete @vars[lenProp]

	counted: (name, countVar, cb) ->
		currentCount = 0
		@uint32le countVar
		# .tap -> process.stderr.write "Parsing #{@vars[countVar]} items #{name}\n"
		.loop name, (end) ->
			# TODO: remove stopParsing check here, it's only for debug
			return end true if currentCount++ is @vars[countVar] or @stopParsing
			cb.call @

	databaseIndex: ->
		@counted "columns", "count", ->
			@uint32le "ii"
			.zstring "name"
		.tap ->
			@stopParsing = true

class DatabaseParser extends Dissolve
	constructor: ->
		Dissolve.call @
		@loop (end) ->
			@database()
			if @stopParsing
				@push @vars
				end()

	zstring: (name) ->
		lenProp = "#{name}_len"
		@uint32le lenProp
		.buffer name, lenProp
		.tap ->
			# Strip the last zero
			buffer = @vars[name].slice 0, -1
			@vars[name] = conv.convert(buffer).toString()
			delete @vars[lenProp]

	counted: (name, countVar, cb) ->
		currentCount = 0
		@uint32le countVar
		# .tap -> process.stderr.write "Parsing #{@vars[countVar]} items #{name}\n"
		.loop name, (end) ->
			# TODO: remove stopParsing check here, it's only for debug
			return end true if currentCount++ is @vars[countVar] or @stopParsing
			cb.call @

	exactlyCounted: (name, count, cb) ->
		currentCount = 0
		@loop name, (end) ->
			return end true if currentCount++ is count
			cb.call @

	dbEntry: ->
		@uint32le "uid"
		.counted "data1", "data1count", ->
			@uint32le "type"
			.uint32le "column"
			.tap ->
				switch @vars.type
					when 0
						@zstring "string"
					when 1
						# Skip size
						@uint32le "int"
						.uint32le "int"
					when 4
						# Skip size
						@uint32le "byte"
						.uint8 "byte"
					when 3
						# Skip size
						@uint32le "uid"
						.uint32le "uid"
						.uint32le "type"
						.tap ->
							@vars.uid = toHex @vars.uid
					else
						@uint32le "dataSize"
						.buffer "data", "dataSize"
						.tap -> delete @vars.dataSize
				delete @vars.type
		.tap ->
			@vars.uid = toHex @vars.uid
			delete @vars.data1count

	database: ->
		@counted "entries", "count", @dbEntry
		.tap ->
			@stopParsing = true

exports.DatabaseParser = DatabaseParser
exports.DBIndexParser = DBIndexParser

# Handle utility call directly from console
if require.main is module
	yargs = require "yargs"
	path = require "path"
	indexFileName = "_fb0x00.fbs"
	baseFolder = yargs.demand(1).argv["_"][0]

	parseIndex = (callback) ->
		indexFile = path.join baseFolder, indexFileName
		indexFile = fs.createReadStream indexFile
		indexParser = new DBIndexParser()
		indexParser.on "data", (index) ->
			callback index
		indexFile.pipe indexParser

	parseDataFile = (index, file, callback) ->
		dataFile = path.join baseFolder, file
		dataFile = fs.createReadStream dataFile
		dataParser = new DatabaseParser()
		dataParser.on "data", (data) ->
			# Inject column names from index
			for entry in data.entries
				for d in entry.data1
					d.column = index.columns[d.column].name
			fs.writeFileSync "#{file}.json", JSON.stringify data, null, 4
		dataFile.pipe dataParser

	parseIndex (index) ->
		files = fs.readdir baseFolder, (err, files) ->
			return if err
			for file in files when file isnt indexFileName
				do (file) -> parseDataFile index, file, null
			console.log "Parsed #{files.length} files"
