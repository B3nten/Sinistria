const fs = require("fs")
const path = require('path')
const fsp = require("fs/promises")
const https = require('https')
const parser = require('./parser')
const msg = require('./utils/msg')

async function main() {

    const workingDir = path.join(process.cwd(), 'ssgfetcher.config.cjs')
    const config = await require(workingDir)

    if (!config.output) {
        console.log(msg('No output directory given. Set one in ./assets.config.cjs', 'error'))
        return
    }
    console.log(config.output)
    if (!fs.existsSync(config.output)) {
        console.log(msg('The output folder does not exist.', 'error'))
        return
    }

    const output_folder = config.output
    const output_folder_name = config.output.substring('./')
    const asset_directory = `./${output_folder_name}/assets`
    const asset_map = {}
    const provided_url_array = config.urls ?? []
    const provided_formats = config.formats ?? []
    const filter = config.filter ?? function () { return true }
    const select_images = config.images ?? true
    const select_data = config.dataPrefetch ?? true

    // get asset URLs
    try {
        await parser.parseHTML(output_folder, asset_map, select_images, select_data, provided_url_array, provided_formats, filter)
    } catch (err) {
        console.log(msg('Could not parse HTML.', 'error'))
        return
    }

    // Check if assets exist
    if (Object.keys(asset_map).length === 0) {
        console.log(msg('No assets found. Check your filters, or you might have already run this command.', 'warn'))
        return
    }

    // Create asset folder
    console.log(asset_directory)
    try {
        if (!fs.existsSync(asset_directory)) {
            fs.mkdirSync(asset_directory)
        }
    } catch (err) {
        console.log(msg('Could not access asset directory.', 'error'))
        return
    }

    // Fetch Assets
    console.log(msg('Fetching assets...'))
    Promise.all(
        Object.keys(asset_map).map(async url => {
            return new Promise((resolve, reject) => {
                https.get(url, (res) => {
                    const filename = url.substring(8).replace(/[^a-z0-9]/gi, '0').toLowerCase()
                    const pathName = `${asset_directory}/${filename}`
                    const filePath = fs.createWriteStream(pathName)
                    res.pipe(filePath)
                    filePath.on('error', () => {
                        reject('Filepath error. Could not fetch assets.')
                    })
                    filePath.on('finish', () => {
                        filePath.close()
                        asset_map[url] = `/assets/${filename}`
                        console.log(msg('Downloaded asset: ', 'success'), msg(filename))
                        resolve()
                    })
                })
            })
        })
    ).then(async () => {
        console.log(msg('Fetched all external assets.', 'success'))
        console.log(msg('Writing to HTML...'))
        try {
            await parser.writeHTML(output_folder, asset_map, select_images, select_data, provided_url_array, provided_formats, filter)
            console.log(msg('Assets fetched successfully.', 'success'))
        } catch {
            throw ('Could not write local asset links to HTML.')
        }
    }).catch((err) => { console.log(msg(err, 'error')) })
}
module.exports = main
