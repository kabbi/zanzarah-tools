path = require "path"
rufus = require "rufus"
{EventEmitter} = require "events"

rufus.basicConfig()
logger = rufus.getLogger "editor"

module.exports = class Editor extends EventEmitter
	constructor: ->
		@systems = {}
		@entities = {}
		@intervals = []
		@baseDir = __dirname

		logger.info "Hey"
		@setupEnvironment()
		@bootstrapWorld()
		@startEverything()

	stop: ->
		logger.info "Clearing intervals"
		for interval in @intervals
			clearInterval interval
		for id, entity of @entity
			entity.destroy()
		for name, system of @systems
			system.destroy()
		logger.info "All done, exiting"

	requireComponent: (name) ->
		name = name.replace /\./g, "/"
		require "./components/#{name}"

	requireSystem: (name) ->
		name = name.replace /\./g, "/"
		require "./systems/#{name}"

	requireEntity: (name) ->
		name = name.replace /\./g, "/"
		require "./entities/#{name}"

	requireLogger: (module) ->
		# TODO: replace 'coffee' below with some valid ext
		fileName = module.filename[ .. -path.extname(module.filename).length - 1]
		fileName = fileName[__dirname.length + 1 .. ]
		rufus.getLogger fileName.replace /\//g, "."

	setupEnvironment: ->
		# Some useful timer events
		@intervals.push setInterval (=> @emit "tick"), 200
		@intervals.push setInterval (=> @emit "tick:time"), 1000
		# Export some globals, for the sake of convenience
		global.requireEntity = @requireEntity
		global.requireSystem = @requireSystem
		global.requireComponent = @requireComponent
		global.requireLogger = @requireLogger
		global.requireRoot = (file) ->
			require path.join __dirname, file

	bootstrapWorld: ->
		@addSystem "world.loader"

	startEverything: ->
		logger.info "Starting system loop"
		
	addSystem: (name, options) ->
		logger.debug "adding system #{name}"
		system = @requireSystem name
		return unless system
		system = new system @, options
		@systems[name] = system

	removeSystem: (name) ->
		logger.debug "removing system #{name}"
		delete @systems[name]

	getSystem: (name) ->
		@systems[name]

	prepareEntity: (entity) ->
		for name, system of @systems
			system.prepare entity

	addEntity: (entity) ->
		# logger.debug "adding entity #{entity.id}"
		@entities[entity.id] = entity
		for name, system of @systems
			system.attach entity

	removeEntity: (entity) ->
		# logger.debug "removing entity #{entity.id}"
		delete @entities[entity.id]
		for name, system of @systems
			system.detach entity

unless module.parent
	client = new Editor()
	repl = require "repl"
	r = repl.start "debug> "
	r.on "exit", -> client.stop()