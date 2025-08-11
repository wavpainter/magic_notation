import fs from 'node:fs/promises';

function parseNameList(expr,start=0,end=expr.length) {
    let firstName = null;
    let i = -1;
    if(expr[start] == '"') {
        i = start+1;
        while(i < (end - 1) && expr[i] != '"') i++;

        firstName = expr.slice(start+1,i);
        i++;
    }else{
        i = start;
        while(i < end && /[A-Za-z]/.test(expr[i])) i++;

        firstName = expr.slice(start,i);
    }

    if(expr[i] == "-") {
        let subNameList = null;
        [subNameList,i] = parseNameList(expr,i+1,end);
        
        return [[firstName].concat(subNameList), i]
    } else {
        return [[firstName], i]
    }
}

function parseNumberList(expr,start=0,end=expr.length) {
    let firstNumber = null;
    
    let i = start;
    while(i < end && /[0-9]/.test(expr[i])) i++;

    firstNumber = Number.parseInt(expr.slice(start,i));

    if(expr[i] == "-") {
        let subNumberList = null;
        [subNumberList,i] = parseNumberList(expr,i+1,end);
        
        return [[firstNumber].concat(subNumberList), i]
    } else {
        return [[firstNumber], i]
    }
}

function parseTokenList(expr,tokenLookup,start=0,end=expr.length) {
    let firstToken = null;
    
    let i = start;
    while(i < end && /[a-zA-Z+=]/.test(expr[i])) i++;

    let firstTokenStr = expr.slice(start,i);
    if(firstTokenStr in tokenLookup) {
        firstToken = tokenLookup[firstTokenStr];
    }else {
        firstToken = ['unknown',firstTokenStr]
    }

    if(expr[i] == "-") {
        let subTokenList = null;
        [subTokenList,i] = parseTokenList(expr,tokenLookup,i+1,end);
        
        return [[firstToken].concat(subTokenList), i]
    } else {
        return [[firstToken], i]
    }
}

function parseFilterExpr(expr,tokenLookup,start=0,end=expr.length) {
    let i = start + 1;
    while(i < end && expr[i] != ")") i++;

    return parseExprSection(filterExpr,tokenLookup,start+1,i);
}

function parseExprSection(expr,tokenLookup,start=0,end=expr.length) {
    let parsedExpr = [];
    let i = start;
    let exprChunk = [];

    while(i < end) {
        let j = i;

        console.log(expr);
        console.log(i);

        if(expr[i] == '"' || /[A-Z]/.test(expr[i])) {
            let nameList = null;
            [nameList,i] = parseNameList(expr,i,end);

            exprChunk.push({
                "type": "names",
                "value": nameList
            })
        }else if(/[0-9]/.test(expr[i])) {
            let numberList = null;

            [numberList,i] = parseNumberList(expr,i,end);

            console.log(numberList)

            exprChunk.push({
                "type": "numbers",
                "value": numberList
            })
        } else {
            let tokenList = null;
            [tokenList,i] = parseTokenList(expr,tokenLookup,i,end);

            exprChunk.push({
                "type": "tokens",
                "value": tokenList
            })
        }

        while(i < end) {

            if(expr[i] == "'") {
                if(i + 1 < end && expr[i+1] == "'") {
                    exprChunk.push({
                        "type":"untap"
                    })
                    i += 2;
                }else {
                    exprChunk.push({
                        "type":"tap"
                    })
                    i++;
                }
            }else if(expr[i] == "(") {
                // Filter
                let filterExpr = null;
                [filterExpr,i] = parseFilterExpr(expr,tokenLookup,i+1,end);
                exprChunk.push({
                    "type":"filter",
                    "value": filterExpr
                })

                i++;
            } else if(expr[i] == "/"){
                exprChunk.push({
                    "type": "statdivider"
                })
                i++;
            } else if(expr[i] == ">"){
                exprChunk.push({
                    "type": "reference"
                })
                i++;
            } else {
                break;
            }
        }

        if(expr[i] == ' ') {
            if(exprChunk != []) {
                parsedExpr.push(exprChunk);
                exprChunk = [];
            }
            i++;
        } else if (i == j) {
            exprChunk.push({
                "type": "unknown",
                "character": expr[i]
            })
            i++;
        }
    }

    if(exprChunk != []) {
        parsedExpr.push(exprChunk)
    }

    return [parsedExpr,i]
}

function parseExpr(expr,tokenLookup) {
    const [parsedExpr,i] = parseExprSection(expr,tokenLookup)
    return parsedExpr
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
                return parseExpr(expr.trim(),tokenLookup)
            })

            return {
                "type": "playerActions",
                "player": line[0],
                "sequence": parsed
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
    const parsedDataJSON = JSON.stringify(parsedData,null,4);
    await fs.writeFile(output_path,parsedDataJSON,{encoding: "utf-8"})

} catch (err) {
    console.error(err);
}