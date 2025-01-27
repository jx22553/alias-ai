const { parse: parseJS } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const fs = require('fs');
const path = require('path');

// Parse JavaScript variables
function parseJavaScriptVariables(code) {
    console.log('Parsing JavaScript code for variables'); // Log start of JS parsing
    const variables = [];
    const ast = parseJS(code, { sourceType: 'module', plugins: ['jsx'] });

    traverse(ast, {
        VariableDeclarator(path) {
            const id = path.node.id;

            if (id.type === 'Identifier') {
                const name = id.name;
                const init = path.node.init;
                let assignedValue = 'No value assigned';
                let type = 'unknown';
                const locations = [];

                if (init) {
                    switch (init.type) {
                        case 'StringLiteral':
                            assignedValue = `"${init.value}"`;
                            type = 'string';
                            break;
                        case 'NumericLiteral':
                            assignedValue = init.value.toString();
                            type = 'number';
                            break;
                        case 'ArrayExpression':
                            assignedValue = generate(init).code;
                            type = 'array';
                            break;
                        case 'ObjectExpression':
                            assignedValue = generate(init).code;
                            type = 'object';
                            break;
                        case 'ArrowFunctionExpression':
                            assignedValue = generate(init).code;
                            type = 'function';
                            break;
                        case 'FunctionExpression':
                            assignedValue = generate(init).code;
                            type = 'function';
                            break;
                        case 'Identifier':
                            assignedValue = init.name;
                            type = 'reference';
                            break;
                        case 'TemplateLiteral':
                            assignedValue = init.quasis.map(q => q.value.raw).join('${...}');
                            type = 'template string';
                            break;
                        case 'BooleanLiteral':
                            assignedValue = init.value.toString();
                            type = 'boolean';
                            break;
                        default:
                            assignedValue = 'Complex expression';
                            type = init.type;
                    }
                }

                if (path.scope.bindings[name]) {
                    path.scope.bindings[name].referencePaths.forEach((refPath) => {
                        const location = refPath.node.loc.start.line;
                        locations.push(location);
                    });
                }

                console.log(`Variable found: ${name}, Type: ${type}, Assigned Value: ${assignedValue}, Locations: ${locations}`);
                variables.push({ name, assignedValue, type, locations });
            } else {
                console.log(`Unsupported VariableDeclarator id type: ${id.type}`);
            }
        },
    });

    console.log(`Finished parsing JavaScript code. Found ${variables.length} variables.`);
    return variables;
}

// Parse Python variables
function parsePythonVariables(code) {
    console.log('Parsing Python code for variables'); // Log start of Python parsing
    const variableRegex = /(\w+)\s*=\s*(.+)/g;
    const variables = [];
    let match;

    while ((match = variableRegex.exec(code)) !== null) {
        const name = match[1];
        const assignedValue = match[2];
        let type = 'unknown';

        if (/^['"]/.test(assignedValue)) {
            type = 'string';
        } else if (/^\d+$/.test(assignedValue)) {
            type = 'number';
        } else if (/^\[.*\]$/.test(assignedValue)) {
            type = 'list';
        }

        console.log(`Variable found: ${name}, Type: ${type}, Assigned Value: ${assignedValue}`);
        variables.push({ name, assignedValue, type });
    }

    console.log(`Finished parsing Python code. Found ${variables.length} variables.`);
    return variables;
}

// Parse Java variables
function parseJavaVariables(code) {
    console.log('Parsing Java code for variables'); // Log start of Java parsing

    // Enhanced regex to capture complex expressions, including multi-line ones
    const variableRegex = /(?:int|double|boolean|char|String|int\[\]|String\[\]|List<.*?>|Map<.*?>|[A-Z][a-zA-Z0-9_]*<.*?>|[A-Z][a-zA-Z0-9_]*)\s+(\w+)\s*=\s*((?:.|\s)*?);/g;
    const variables = [];
    let match;

    while ((match = variableRegex.exec(code)) !== null) {
        const declaration = match[0]; // Full variable declaration
        const typeMatch = declaration.match(/(?:int|double|boolean|char|String|int\[\]|String\[\]|List<.*?>|Map<.*?>|[A-Z][a-zA-Z0-9_]*<.*?>|[A-Z][a-zA-Z0-9_]*)/);
        const type = typeMatch ? typeMatch[0] : 'unknown'; // Extract variable type
        const name = match[1]; // Extract variable name
        const assignedValue = match[2] ? match[2].trim().replace(/\s+/g, ' ') : 'No value assigned'; // Extract assigned value and normalize whitespace

        console.log(`Variable found: ${name}, Type: ${type}, Assigned Value: ${assignedValue}`);
        variables.push({ name, assignedValue, type });
    }

    console.log(`Finished parsing Java code. Found ${variables.length} variables.`);
    return variables;
}





// Parse C++ variables
function parseCppVariables(code) {
    console.log('Parsing C++ code for variables'); // Log start of C++ parsing

    // Enhanced regex to capture primitive, array, STL containers, pointers, references, and uninitialized variables
    const variableRegex = /(?:int|double|bool|char|std::string|std::vector<.*?>|std::map<.*?>|int\[\]|std::string\[\]|int\*|int&|[A-Z][a-zA-Z0-9_]*)\s+(\w+)\s*(?:=\s*((?:.|\s)*?))?;/g;
    const variables = [];
    let match;

    while ((match = variableRegex.exec(code)) !== null) {
        const declaration = match[0]; // Full variable declaration
        const typeMatch = declaration.match(/(?:int|double|bool|char|std::string|std::vector<.*?>|std::map<.*?>|int\[\]|std::string\[\]|int\*|int&)/);
        const type = typeMatch ? typeMatch[0] : 'unknown'; // Extract variable type
        const name = match[1]; // Extract variable name
        const assignedValue = match[2] ? match[2].trim().replace(/\s+/g, ' ') : 'No value assigned'; // Extract assigned value or default to "No value assigned"

        console.log(`Variable found: ${name}, Type: ${type}, Assigned Value: ${assignedValue}`);
        variables.push({ name, assignedValue, type });
    }

    console.log(`Finished parsing C++ code. Found ${variables.length} variables.`);
    return variables;
}




// Master function to parse variables based on file type
function getVariableContexts(code, languageId) {


    switch (languageId) {
        case 'javascript':
            return parseJavaScriptVariables(code);
        case 'python':
            return parsePythonVariables(code);
        case 'java':
            return parseJavaVariables(code);
        case 'cpp':
            return parseCppVariables(code);
        default:
            console.error(`Unsupported file type: ${languageId}`);
            throw new Error(`Unsupported file type: ${languageId}`);
    }
}

module.exports = { getVariableContexts };
