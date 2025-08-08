import fs from 'node:fs/promises';

function parseExpr(expr) {
    console.log(expr)
}

function parseNotation(data) {
    const lines = data.split("\n")
    const parsedLines = lines.map(line => {
        if(line[0] == "#") {
            return {
                "type": "comment",
                "value": line.slice(1).trim()
            }
        } else {
            var exprs = line.slice(1).split(',')
            var parsed = exprs.map(expr => {
                parseExpr(expr.trim())
            })

            return {
                "type": "playerActions",
                "player": line[0]
            }
        }
    })

    return parsedLines
}

function createTokenLookup(tokens) {
    var lookup = {};

    Object.keys(tokens).forEach(tokenType => {
        var ts = tokens[tokenType];
        Object.keys(ts).forEach(token => {
            var syntax = ts[token];
            syntax.forEach(word => {
                lookup[word] = [tokenType,token];
            })
        })
    })

    return lookup;
}

const expressions_path = "../expressions.json"
const tokens_path = "../tokens.json"
const game_path = "../examples/game1.mn"
const output_path = "../examples/game1.json"

try {
    const data = await fs.readFile(game_path, { encoding: 'utf8' });
    const exprsData = await fs.readFile(expressions_path, { encoding: 'utf8' });
    const exprs = JSON.parse(exprsData);
    const tokensData = await fs.readFile(tokens_path, {encoding: 'utf8' });
    const tokens = JSON.parse(tokensData);
    const tokenLookup = createTokenLookup(tokens);
    console.log(tokenLookup);
    const parsedData = parseNotation(data);
} catch (err) {
    console.error(err);
}