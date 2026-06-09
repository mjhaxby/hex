// With some LLM help, this file can be used both in the browser and in node for markdown conversions. 
// In the browser, showdown will need to be included seperately, and in node, showdown will need to be installed as a dependency.
// In the browser, this file will be available as window.MarkdownUtils, and in node it can be imported with require('markdown-utils.js')
// This is used in the activityEditor for applying markdown for run and export.
// It is used in the tableManager for the detailEditor (as the WYSIWYG editor receives HTML)
(function(root, factory) {
	if (typeof module === 'object' && module.exports) {
		module.exports = factory(require('showdown'))
	} else {
		root.MarkdownUtils = factory(root.showdown)
	}
})(typeof globalThis !== 'undefined' ? globalThis : this, function(showdown) {
	if (!showdown) {
		throw new Error('Showdown is required for markdown-utils.js')
	}

	showdown.setOption('strikethrough', true)

	function getDocumentForMarkdownConversion(documentOverride) {
		if (documentOverride) {
			return documentOverride
		}

		if (typeof document !== 'undefined') {
			return document
		}

		if (typeof require === 'function') {
			const { JSDOM } = require('jsdom') // for HTML to markdown conversion
			const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
			return dom.window.document
		}

		throw new Error('No document available for HTML to markdown conversion')
	}

	// convert markdown to HTML for activities that support this
	function applyMarkdown(activityData,activitySettings, settingsInfo,linksInNewWindow=true){
		console.log('applying markdown')
		// let converter = new showdown.Converter()
		for (i = 0; i < activityData.length; i++){
			for (j = 0; j < activityData[i].length; j++){
				let cell
				let type = 'text'
				if(typeof activityData[i][j] == 'string'){
					cell = activityData[i][j]
				} else {
					cell = activityData[i][j].text
					type = 'object'
				}

				// TO REMOVE
				// cell = cell.replaceAll('\\\\n','\\<span></span>n') // protect \\n (this seems over the top, but it doesn't work another way). We're using <span></span> because any < and > will have already been removed anyway
				// // apply markdown, but remove <p> tags which should never be necessary. Replace \n with <br>
				// cell = cell.replaceAll('<span></span>','') // remove this just in case anyway
				// cell = converter.makeHtml(cell)
				// cell = cell.replaceAll(/<\/?p>/g,'').replaceAll(/(^|[^\\])(\\n)/g,'$1<br>').replaceAll(/(^|[^\\])(\\n)/g,'$1<br>') // replace \n twice in a row because otherwise some can get orphanned

				cell = convertMarkdownToHTMLWithLineBreaks(cell,linksInNewWindow)

				if (type == 'object'){
					activityData[i][j].text = cell
				} else {
					activityData[i][j] = cell
				}
			}
		}
		// data.forEach(line =>{
		//   line.forEach(cell =>{
		//     cell = converter.makeHtml(cell)
		//   })
		// })
		settingsInfo.forEach(setting =>{
			if(setting.type == 'text' && (!setting.hasOwnProperty('markdown') || setting.markdown == true)){
				console.log(`applying markdown to setting ${setting.name}`)
				// apply markdown, but remove <p> tags which should never be necessary
				// activitySettings[setting.name] = converter.makeHtml(activitySettings[setting.name]).replaceAll(/<\/?p>/g,'')
				activitySettings[setting.name] = convertMarkdownToHTMLWithLineBreaks(activitySettings[setting.name],linksInNewWindow)
			}
		})
		console.log(activityData)
		console.log(activitySettings)
		return {data: activityData, settings: activitySettings}
	}

	function convertHTMLToMarkdown(string, documentOverride){
		let converter = new showdown.Converter()
		converter.setOption('strikethrough', true)

		let md = converter.makeMarkdown(string, getDocumentForMarkdownConversion(documentOverride))
		console.log('Converted markdown:',md)

		// remove <br> tags and replace with \n
		md = md.replaceAll(/<br\s*\/?>\s*/gi,'\n') 
		// turn &lt; and &gt; back into < and >
		md = md.replaceAll(/&lt;/g, '<').replaceAll(/&gt;/g, '>')

		return md
	}

	function convertMarkdownToHTMLWithLineBreaks(string,linksInNewWindow=true){
		// TO DO: modify regex if necessary AND OR change how \n are treated
		let converter = new showdown.Converter()
		converter.setOption('openLinksInNewWindow', linksInNewWindow)
		converter.setOption('strikethrough', true)
		let headersOrListsRegex = /^\s*(#+|- )/gm
		let result
		const splitLines = string.split(/(^|[^\\])(\\n)/)

		// console.log(string)
		// console.log(`${splitLines.length} lines`)
		// console.log(`${splitLines.length} is > 1? ${splitLines.length > 1}`)
		// console.log(`test result is ${headersOrListsRegex.test(string)}`)
		let normalized = string.replace(/\\n/g, '\n')
		let matches = normalized.match(headersOrListsRegex)
		// console.log('matches are', matches)
		// console.log('string is ' + string)
		// console.log(`matches are ${matches}`)
		if(matches && matches.length > 0 && splitLines.length > 1){
			// if we have headers (#) or bullet point lists AND more than one line, we probably want to include <p> tags
			// also, if we use the other method ("else" below), everything will get lumped under the first heading or list item
			// so simple convert with no fiddling about
			// console.log(`exporting regular html (lines ${string.split(/(^|[^\\])(\\n)/).length})`)
			result = string.replaceAll(/(^|[^\\])(\\n)/g,'$1\n').replaceAll(/(^|[^\\])(\\n)/g,'$1\n') // turn \n back into real \n characters (do it twice to get them all)
			result = converter.makeHtml(result)
		} else {
			// console.log('exporting html with no <p>')
			// best method for single line or multiline without headers (#) or bullet point lists (-)
			// since we don't want to introduce <p> to simple strings, which clutter the final code and result in unexpected css

			// first protect \\n (this seems over the top, but it doesn't work another way). We're using <span></span> because any < and > will have already been removed, so nothing can break this way
			result = string.replaceAll('\\\\n','\\<span></span>n')
			// apply markdown
			result = converter.makeHtml(result)
			result = result.replaceAll('<span></span>','') // remove this just in case (not that it should affect anything)
			// remove <p> tags and replace \n with <br>
			result = result.replaceAll(/<\/?p>/g,'').replaceAll(/(^|[^\\])(\\n)/g,'$1<br>').replaceAll(/(^|[^\\])(\\n)/g,'$1<br>') // replace \n twice in a row because otherwise some can get orphanned
		}
		return result

	}



	return {
		applyMarkdown,
		convertHTMLToMarkdown,
		convertMarkdownToHTMLWithLineBreaks
	}
})
