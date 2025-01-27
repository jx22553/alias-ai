// const { parse } = require('@babel/parser');
// const traverse = require('@babel/traverse').default;
// const generate = require('@babel/generator').default; // Import Babel's generator module
// function getVariableContexts(code) {
//     console.log('Parsing code for variables'); // Logs when parsing starts
//     const variables = [];
//     const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
//     traverse(ast, {
//         VariableDeclarator(path) {
//             const id = path.node.id;
//             // Check if the id is an Identifier
//             if (id.type === 'Identifier') {
//                 const name = id.name; // Extract the variable name
//                 const init = path.node.init;
//                 let assignedValue = 'No value assigned';
//                 let type = 'unknown';
//                 const locations = [];
//                 // Extract assigned values and their types
//                 if (init) {
//                     switch (init.type) {
//                         case 'StringLiteral':
//                             assignedValue = `"${init.value}"`;
//                             type = 'string';
//                             break;
//                         case 'NumericLiteral':
//                             assignedValue = init.value.toString();
//                             type = 'number';
//                             break;
//                         case 'ArrayExpression':
//                             assignedValue = generate(init).code; // Convert the AST node to a string
//                             type = 'array';
//                             break;
//                         case 'ObjectExpression':
//                             assignedValue = generate(init).code; 
//                             type = 'object';
//                             break;
//                         case 'ArrowFunctionExpression':
//                         case 'FunctionExpression':
//                             assignedValue = generate(init).code; // Convert the function AST node to string 
//                             type = 'function';
//                             break;
//                         case 'Identifier':
//                             assignedValue = init.name; // Reference to another variable
//                             type = 'reference';
//                             break;
//                         case 'TemplateLiteral':
//                             assignedValue = init.quasis.map(q => q.value.raw).join('${...}');
//                             type = 'template string';
//                             break;
//                         case 'BooleanLiteral':
//                             assignedValue = init.value.toString();
//                             type = 'boolean';
//                             break;
//                         default:
//                             assignedValue = 'Complex expression';
//                             type = init.type;
//                     }
//                 }
//                 // Record all usage locations
//                 if (path.scope.bindings[name]) {
//                     path.scope.bindings[name].referencePaths.forEach((refPath) => {
//                         const location = refPath.node.loc.start.line;
//                         locations.push(location);
//                     });
//                 }
//                 console.log(`Variable found: ${name}, Type: ${type}, Assigned Value: ${assignedValue}, Locations: ${locations}`); // Debug log
//                 variables.push({ name, assignedValue, type, locations });
//             } else {
//                 // Log unsupported cases for debugging
//                 console.log(`Unsupported VariableDeclarator id type: ${id.type}`);
//             }
//         },
//     });
//     return variables;
// }
// module.exports = { getVariableContexts };
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator'; // For JavaScript/TypeScript
import Parser from 'tree-sitter';
import Python from 'tree-sitter-python';
import { parse as javaParse } from 'java-parser';
export function getVariableContexts(code, languageId) {
    console.log(`Parsing code for variables in language: ${languageId}`); // Logs the language being processed
    const variables = [];
    if (languageId === 'javascript' || languageId === 'typescript') {
        // JavaScript/TypeScript Parsing
        const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
        traverse(ast, {
            VariableDeclarator(path) {
                const id = path.node.id;
                // Check if the id is an Identifier
                if (id.type === 'Identifier') {
                    const name = id.name; // Extract the variable name
                    const init = path.node.init;
                    let assignedValue = 'No value assigned';
                    let type = 'unknown';
                    const locations = [];
                    // Extract assigned values and their types
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
                            case 'ObjectExpression':
                                assignedValue = generate(init).code;
                                type = init.type === 'ArrayExpression' ? 'array' : 'object';
                                break;
                            case 'ArrowFunctionExpression':
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
                    // Record all usage locations
                    if (path.scope.bindings[name]) {
                        path.scope.bindings[name].referencePaths.forEach((refPath) => {
                            const location = refPath.node.loc.start.line;
                            locations.push(location);
                        });
                    }
                    console.log(`Variable found: ${name}, Type: ${type}, Assigned Value: ${assignedValue}, Locations: ${locations}`);
                    variables.push({ name, assignedValue, type, locations });
                }
            },
        });
    }
    else if (languageId === 'python') {
        // Python Parsing using tree-sitter-python
        const parser = new Parser();
        parser.setLanguage(Python);
        const tree = parser.parse(code);
        // Traverse Python AST
        traversePython(tree.rootNode, variables);
    }
    else if (languageId === 'java') {
        // Java Parsing using java-parser
        const cst = javaParse(code);
        // Traverse Java CST
        traverseJava(cst, variables);
    }
    else {
        console.log(`Unsupported language: ${languageId}`);
    }
    return variables;
}
function traversePython(node, variables) {
    if (!node)
        return;
    if (node.type === 'assignment') {
        const variableName = node.child(0)?.text || 'unknown';
        const assignedValue = node.child(2)?.text || 'No value assigned';
        console.log(`Python Variable found: ${variableName}, Assigned Value: ${assignedValue}`);
        variables.push({
            name: variableName,
            assignedValue,
            type: 'variable',
            locations: [node.startPosition.row + 1],
        });
    }
    // Recursively traverse child nodes
    for (let i = 0; i < node.childCount; i++) {
        traversePython(node.child(i), variables);
    }
}
function traverseJava(cst, variables) {
    if (!cst)
        return;
    if (cst.name === 'variableDeclarator') {
        const variableName = cst.children.variableDeclaratorId[0]?.image || 'unknown';
        const assignedValue = cst.children.variableInitializer?.[0]?.children?.expression?.[0]?.image || 'No value assigned';
        console.log(`Java Variable found: ${variableName}, Assigned Value: ${assignedValue}`);
        variables.push({
            name: variableName,
            assignedValue,
            type: 'variable',
            locations: [], // Java CST does not provide direct line numbers
        });
    }
    // Recursively traverse child nodes
    if (cst.children) {
        for (const key in cst.children) {
            if (Array.isArray(cst.children[key])) {
                cst.children[key].forEach(child => traverseJava(child, variables));
            }
        }
    }
}
