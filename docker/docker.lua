local M = {}
local Spore = require('Spore')

-- For creating new containers the config object must contain certain fields
-- Example config contains:
local function config()
   local config = { Hostname = "",
		    User = "",
		    Memory = 0,
		    MemorySwap = 0,
		    AttachStdin = false,
		    AttachStdout = false,
		    AttachStderr = false,
		    PortSpecs = {},
		    Privileged = false,
		    Tty = false,
		    OpenStdin = false,
		    StdinOnce = false,
		    Env = {},
		    Cmd = {'/bin/bash'},
		    Dns = {},
		    Image = "base",
		    Volumes = {},
		    VolumesFrom = "",
		    WorkingDir = ""
		 }
   return config
end

M.config = config

local client = Spore.new_from_string [[{ "name" : "docker remote api",
					  "base_url" : 'http://127.0.0.1:65000',
					  "version" : '0.1.0',
					  "expected_status" : [
					     200,
					     204
					  ],
					  "formats" : "json",
					  "methods" : {
					     "list_containers" : { 
						"path" : "/containers/json",
						"method" : "GET",
						"optional_params" : [
						   'all',
						   'limit',
						   'since',
						   'before',
						   'size'
						]
					     },
					     "inspect_container" : { 
						"path" : "/containers/:id/json",
						"method" : "GET",
						"required_params" : [
						   "id"
						],
					     },
					     "fs_changes_container" : { 
						"path" : "/containers/:id/changes",
						"method" : "GET",
						"required_params" : [
						   "id"
						],
					     },
					     "create_container" : { 
						"path" : "/containers/create",
						"method" : "POST",
						"required_params" : [
						   "config"
						],
					     },
					     "start_container" : { 
						"path" : "/containers/:id/stop",
						"method" : "POST",
						"required_params" : [
						   "id"
						],
						"optional_params" : [
						   'hostConfig',
						]
					     },
					     "stop_container" : { 
						"path" : "/containers/:id/stop",
						"method" : "POST",
						"required_params" : [
						   "id"
						],
					     },
					     "restart_container" : { 
						"path" : "/containers/:id/restart",
						"method" : "POST",
						"required_params" : [
						   "id"
						],
					     },
					     "kill_container" : { 
						"path" : "/containers/:id/kill",
						"method" : "POST",
						"required_params" : [
						   "id"
						],
					     },
					     "delete_container" : { 
						"path" : "/containers/:id/kill",
						"method" : "GET",
						"required_params" : [
						   "id"
						],
					     },
					     "kill_container" : { 
						"path" : "/containers/:id/kill",
						"method" : "GET",
						"required_params" : [
						   "id"
						],
					     },
					     "list_processes_container" : { 
						"path" : "/containers/:id/top",
						"method" : "GET",
						"required_params" : [
						   "id"
						],
						"optional_params" : [
						   'ps_args',
						   ]
					     },
					     "list_images" : { 
						"path" : "/images/json",
						"method" : "GET",
						"optional_params" : [
						   'all',
						   'limit',
						   'since',
						   'before',
						   'size']
					     },
					     "inspect_image" : { 
						"path" : "/images/:name/json",
						"method" : "GET",
						"required_params" : [
						   "name"
						],
					     },
					     "history_image" : { 
						"path" : "/images/:name/history",
						"method" : "GET",
						"required_params" : [
						   "name"
						],
					     },
					     "info" : { 
						"path" : "/info",
						"method" : "GET",
					     },
					     "version" : { 
						"path" : "/info",
						"method" : "GET",
					     },
					     "search_images" : { 
						"path" : "/images/search",
						"method" : "GET",
						"required_params" : [
						   "term"
						],
					     },
					  }
				       }]]
M.client = client
--[[
local pretty = require('pl.pretty')
local res = client:list_containers{ all = 1 }
pretty.dump(res)
print "\n=========\n"
res = client:list_images{ all = 1 }
pretty.dump(res)
--]]

return M

