// Tries to validate, standard-outputs nothing if it is valid.

var fs= require('fs');
var env = require('schema')('envIdentifier');

//(note: argv[0]==='node', argv[1]==='validate.js')
var schema_data = fs.readFileSync(process.argv[2])+"";   //First argument is scheme file path.
var example_data = fs.readFileSync(process.argv[3])+"";  // second the example(or an instance)

var schema = env.Schema.create(JSON.parse(schema_data));
var example = JSON.parse(example_data);

var validity = schema.validate(example);

if( validity.isError() )
{    console.log(validity); //NOTE: messy way to get the error.
     console.log("\n(Found error)");
}
