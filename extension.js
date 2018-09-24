// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const CPPParser = require('./languages/cpp')

class VSCodeLineReader 
{
  constructor(doc, start) {this.doc = doc, this.pos = start}

  next_line() {
    if (this.pos.line >= this.doc.lineCount)
        return null

    let t  = this.doc.lineAt(this.pos).text
    this.pos = new vscode.Position(this.pos.line+1, this.pos.character)
    return t
  }
}

class CppSnippet
{
    constructor() {
    }

    provideCompletionItems(document, position, token)
    {
        const result = []
        // match "/**"
        if (document.getWordRangeAtPosition(position, /\/\*\*/) != undefined )
        {
            const item = new vscode.CompletionItem('/**', vscode.CompletionItemKind.Snippet); 
            const parser = new CPPParser({param_description:true, return_description:true})
            const reader = new VSCodeLineReader(document, position)
            const definition = parser.get_definition(reader)
            const snippets = parser.parse(definition)
            const alignedSnippets = this.alignTags(snippets)
            
            let comment_snippet = ""
            for (const snippet of alignedSnippets)
            {
                comment_snippet += "\n *" + snippet
            }
            comment_snippet += "\n */"

            item.insertText = new vscode.SnippetString(comment_snippet);
            // Display details for docblock string
            item.detail = 'CPP DocBlockr';
            result.push(item)
            console.log("match")
        }

        return result
    }

    alignTags(snippets)
    {
        function outputWidth(str)
        {
            // get the length of a string, after it is output as a snippet,
            // "${1:foo}" --> 3
            return str.replace(new RegExp("[$][{]\\d+:([^}]+)[}]"), "$1").replace("\$", "$").length;
        }

        // count how many columns we have
        let maxCols = 0
        // this is a 2d list of the widths per column per line
        let widths = []

        for (let line of snippets)
        {
            if (line.startsWith('@param'))
            {
                let columns = line.split(" ") 
                let colWidths = columns.map(outputWidth)
                widths.push(colWidths)
                maxCols = Math.max(maxCols, colWidths.length)
            }
        }

        //  initialize a list to 0
        let maxWidths = Array(maxCols).fill(0)

        for (let i = 0; i < maxCols; ++i)
        {
            for (let width of widths)
            {
                if (i < width.length)  maxWidths[i] = Math.max(maxWidths[i], width[i])
            }
        }

        let alignedOut = []
        for (let line of snippets)
        {
            if (line.startsWith('@param'))
            {
                let newLine = ""
                let parts = line.split(" ")
                for (let i = 0; i < parts.length; ++i)
                {
                    newLine += parts[i].padEnd(1+maxWidths[i], " ")
                }
                alignedOut.push(newLine)
            }
            else
            {
                alignedOut.push(line)
            }
        }

        return alignedOut
    }
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "cpp-docblockr" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    vscode.languages.registerCompletionItemProvider("cpp", new CppSnippet(), '*')
    vscode.languages.registerCompletionItemProvider("c", new CppSnippet(), '*')
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;