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
        let subNameList = null;
        [subNameList,j] = parseNameList(expr,j+1);
        
        return [[firstName].concat(subNameList), j]
    } else {
        return [[firstName], j]
    }
}

function parseNumberList(expr,i) {
    let firstNumber = null;
    
    let j = i;
    while(j < expr.length && /[0-9]/.test(expr[j])) j++;

    firstNumber = Number.parseInt(expr.slice(i,j));

    if(expr[j] == "-") {
        let subNumberList = null;
        [subNumberList,j] = parseNumberList(expr,j+1);
        
        return [[firstNumber].concat(subNumberList), j]
    } else {
        return [[firstNumber], j]
    }
}

function parseTokenList(expr,tokenLookup,i) {
    let firstToken = null;
    
    let j = i;
    while(j < expr.length && /[a-zA-Z+=\-]/.test(expr[j])) j++;

    let firstTokenStr = expr.slice(i,j);
    if(firstTokenStr in tokenLookup) {
        firstToken = tokenLookup[firstTokenStr];
    }else {
        firstToken = ['unknown',firstTokenStr]
    }

    if(expr[j] == "-") {
        let subTokenList = null;
        [subTokenList,j] = parseTokenList(expr,j+1);
        
        return [[firstToken].concat(subTokenList), j]
    } else {
        return [[firstToken], j]
    }
}

function parseExpr(expr,tokenLookup,i=0) {
    let parsedExpr = [];

    while(i < expr.length) {
        if(expr[i] == '"' || /[A-Z]/.test(expr[i])) {
            let nameList = null;
            [nameList,i] = parseNameList(expr,i);

            console.log(nameList)
        }else if(/[0-9]/.test(expr[i])) {
            let numberList = null;
            [numberList,i] = parseNumberList(expr,i);

            console.log(numberList)
        } else {
            let tokenList = null;
            [tokenList,i] = parseTokenList(expr,tokenLookup,i);

            console.log(tokenList);
        }
        i++;
    }
}

function parseNotation(data,tokenLookup) {
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
                parseExpr(expr.trim(),tokenLookup)
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
    const parsedData = parseNotation(data,tokenLookup);
} catch (err) {
    console.error(err);
}