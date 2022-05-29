#!/usr/bin/env node

const config = `/*
┌───────────────────────────────────────────────────────────────┐
│ Configuration:                                                |
│ output:        The directory your HTML resides in.            |
│                All HTML in this directory will be parsed.     │
│ images:        Should all <img> tags be parsed.               │
│ dataPrefetch:  Should all elements with a                     |
│                data-prefetch attribute be parsed.             │
│ formats:       An array of file formats to filter.            │
│ urls:          An array of URL's to filter                    │
│ filter:        A callback that receives the URL and element.  │
│                Must return a truthy or falsy value.           │
└───────────────────────────────────────────────────────────────┘
 */

const config = {
    output: './out',
    images: true,
    dataPrefetch: true,
    formats: [],
    urls: [],
    filter: (node)=>{
        return true
    }
}

module.exports = config`

const fs = require('fs')
const main = require('./main')

const [, , ...args] = process.argv
if (args[0] === 'init') {
    if (fs.existsSync('./ssgfetcher.config.cjs')) {
        console.log('')
        console.log('\u001b[' + 93 + 'm' + 'Configuration file already exists.' + '\u001b[0m')
        return
    }
    fs.writeFile('ssgfetcher.config.cjs', config, () => {
        console.log('')
        console.log('\u001b[' + 32 + 'm' + 'Created configuration file in root directory.' + '\u001b[0m')
    })
}else if(args[0] === 'run'){
    main()
}else{
    console.log('')
    console.log('Unknown command. Did you mean "init" (to create a config file) or "run" (to fetch assets)?')
}

