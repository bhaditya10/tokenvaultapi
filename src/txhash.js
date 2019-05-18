var axios = require("axios");
const abiDecoder = require('abi-decoder'); 
const ercABI = require('../data/abi.json')

async function txhash(ctx) {
    try {
        let txh = ctx.params.txh.toLowerCase();
        result =   {
            "currency": "ETH",
            "chain": "ETH.main",
            "hash" : txh
        }
        var options = { 
            url: 'http://node.web3api.com:8545/',
            headers: 
            { 
                'postman-token': '7925307c-29f8-e13a-e7b5-f4e8aacf1392',
                'cache-control': 'no-cache',
                'content-type': 'application/json' 
            },
            body: 
            { 
                jsonrpc: '2.0',
                method: 'eth_getTransactionByHash',
                params: [ txh ],
                id: 1 
            },
            json: true
        };
        let res = await axios.post(options.url, options.body);
        let response = res.data.result
        console.log(response);
        if ("blockNumber" in response){
            result["state"] = "confirmed"
            result["block"] = {
                "blockHeight" : parseInt(response["blockNumber"], 16)
            }
        } else {
            result["state"] = "pending"
        }

        if (response["input"] == '0x') {
            value = parseInt(response["value"], 16)
            result["depositType"] = "account"
            result["ins"] = {
                "address" : response["to"],
                "value" : value
            }
            result["outs"] = {
                "address" : response["from"],
                "value" : -1 * value
            }
        }
        else {
            result["depositType"] = "Contract"
            abiDecoder.addABI(ercABI);
            let decodedData = abiDecoder.decodeMethod(response.input);
            console.log(decodedData)
            if (decodedData){
                value = decodedData.params[1].value
                value = parseFloat(value, 16)
                to = decodedData.params[0].value
                result["ins"] = {
                    "address" : response["from"],
                    "value" : -1 *value,
                    "type": "token",
                    "coinspecific": {
                        "tokenAddress": response["to"]
                    }
                }
                result["outs"] = {
                    "address" : to,
                    "value" : value,
                    "type": "token",
                    "coinspecific": {
                        "tokenAddress": response["to"]
                    }
                }
            }
            else {
                value = parseInt(response["value"], 16)
                result["depositType"] = "account"
                result["ins"] = {
                    "address" : response["to"],
                    "value" : value,
                    "type": "transfer",
                    "coinspecific": {
                        "tracehash": txh
                    }
                }
                result["outs"] = {
                    "address" :response["from"],
                    "value" : value,
                    "type": "transfer",
                    "coinspecific": {
                        "tracehash": txh
                    }
                }
            }
            
        }

        ctx.body = result
        
    } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = {
            status : "request failed",
            error : err.message
        }
        ctx.app.emit('error', err, ctx);
    }
}

module.exports = txhash;