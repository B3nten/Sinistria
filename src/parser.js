const fs = require("fs")
const fsp = require('fs/promises')
const jsdom = require("jsdom")
const path = require("path")
const msg = require('./utils/msg')
const walk = require('./utils/walk')

function urlFilter(configURLs, url) {
    if (configURLs.length === 0) return true
    let r = false
    for (const cURL of configURLs) {
        if (url.indexOf(cURL) === 0) r = true
    }
    return r
}
function formatFilter(configFormats, url) {
    if (configFormats.length === 0) return true
    console.log(path.extname(url))
    let r = false
    for (const format of configFormats) {
        if (path.extname(url) === format) {
            r = true
        }
    }
    return r
}

async function parseHTML(output_folder, asset_map, select_images, select_data, provided_url_array, provided_formats, filter) {
    for await (const p of walk(output_folder, asset_map)) {
        if (path.extname(p) === '.html') {
            const filePath = path.resolve(p)
            const file = await fsp.readFile(filePath, { encoding: 'utf-8' })
            let dom = new jsdom.JSDOM(file, { resources: 'usable' })
            let imgSrcs = select_images ? dom.window.document.querySelectorAll('img[src]:not([data-nofetch])') : []
            let dataSrcs = select_data ? dom.window.document.querySelectorAll('[data-prefetch]') : []
            let srcs = new Set([
                ...imgSrcs,
                ...dataSrcs
            ])
            srcs.forEach((e) => {
                let url
                if (e.hasAttribute('src')) {
                    url = e.getAttribute('src')
                } else if (e.hasAttribute('href')) {
                    url = e.getAttribute('href')
                }
                if (url.indexOf('https://') === 0) {
                    if (urlFilter(provided_url_array, url) && formatFilter(provided_formats, url) && filter({ url: url, element: e, file: p  })) {
                        asset_map[url] = null
                        console.log(msg('Found external asset: ', 'success'), msg(url))
                    }
                }
            })
        }
    }
}

async function writeHTML(output_folder, asset_map, select_images, select_data, provided_url_array, provided_formats, filter) {
    for await (const p of walk(output_folder, asset_map)) {
        if (path.extname(p) === '.html') {
            const filePath = path.resolve(p)
            const file = await fsp.readFile(filePath, { encoding: 'utf-8' })
            let dom = new jsdom.JSDOM(file, { resources: 'usable' })
            let imgSrcs = select_images ? dom.window.document.querySelectorAll('img[src]:not([data-nofetch])') : []
            let dataSrcs = select_data ? dom.window.document.querySelectorAll('[data-prefetch]') : []
            let srcs = new Set([
                ...imgSrcs,
                ...dataSrcs
            ])
            srcs.forEach((e) => {
                let url
                let attr
                if (e.hasAttribute('src')) {
                    url = e.getAttribute('src')
                    attr = 'src'
                } else if (e.hasAttribute('href')) {
                    url = e.getAttribute('href')
                    attr = 'href'
                }
                if (url.indexOf('https://') === 0) {
                    if (urlFilter(provided_url_array, url) && formatFilter(provided_formats, url) && filter({ url: url, element: e, directory: p })) {
                        if (url in asset_map) {
                            e.setAttribute(attr, asset_map[url])
                        }
                    }
                }
            })
            fs.writeFile(filePath, dom.serialize(), (error) => {
                if (error) console.log('error')
                else return
            })
        }
    }
}


module.exports = {
    parseHTML,
    writeHTML
}