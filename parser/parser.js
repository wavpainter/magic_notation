import fs from 'node:fs/promises';

function parseNameList(expr,i) {
    let firstName = null;
    let j = -1;
    if(expr[i] == '"') {
        j = i+1;
        while(j < (expr.length - 1) && expr[j] != '"') j++;

        firstName = expr.slice(i+1,j);
        j++;
    }else{
        j = i;
        while(j < expr.length && /[A-Za-z]/.test(expr[j])) j++;

        firstName = expr.slice(i,j);
    }

    if(expr[j] == "-") {
        var res = parseNameList(expr,j+1);
        let subNameList = res["nameList"];
        j = res["index"];
        
        return {
            "nameList": [firstName].concat(subNameList),
            "index": j
        }
    } else {
        return {
            "nameList": [firstName],
            "index": j
        }
    }
}

function parseExpr(expr) {
    let parsedExpr = [];

    let i = 0;
    while(i < expr.length) {
        if(expr[i] == '"' || /[A-Z]/.test(expr[i])) {
            let res = parseNameList(expr,i);
            let nameList = res['nameList'];
            i = res['index'];

            console.log(nameList)
        }
        i++;
    }
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