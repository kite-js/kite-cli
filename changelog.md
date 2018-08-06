# ver 0.4.3 (2018-08-06)
- source template resolving enhanced, resolves "~/somepath" to a relative path like "../somepath" base on module path
- source template resolving bug fixed

# ver 0.4.2 (2018-03-23)
- app template bug fixed

# ver 0.4.1 (2018-03-21)
- add '--yes' option to '-p' and '-i', create / init project without questioning

# ver 0.4.0 (2018-03-21)
- meet Kite framework 0.5.x changing:
  * templates is customizable
- add __-p, create-project__ option, now supports create and init Kite projects

# ver 0.3.0 (2017-10-02)
- configuration file "kite-cli.config.js" now is supported
- user can modify templates in "kite-cli.config.js"

# ver 0.2.4 (2017-09-04)
- changed the template of "kite.config.js"

# ver 0.2.3 (2017-09-01)
- add "Inject" as default import for controller template

# ver 0.2.2 (2017-09-01)
- change controller file name surfix from ".ts" to ".controller.ts"

# ver 0.2.1 (2017-08-31)
- fix controller creator generated filename not matching with Kite 0.3.4

# ver 0.2.0 (2017-08-31)
- more functions (options):
  * __-i, init__ - initialize a kite project
  * __-a, api__ - create a kite controller
  * __-c, controller__ - same as option '-a, api'
  * __-s, service__ - create a kite service
  * __-m, model__ - create a kite model

# ver 0.1.0 (2017-08-30)
- first release