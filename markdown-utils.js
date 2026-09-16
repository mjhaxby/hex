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
		// showdown always wraps link/image destinations in <>; unwrap simple (space-free) ones so the later
		// mandatory HTML-entity sanitization on export can't corrupt the < > into a broken href
		md = md.replace(/\]\(<([^<>\s]+)>(?=[ )])/g, ']($1')
		// contenteditable/Quill can silently turn regular spaces into non-breaking spaces; undo that on save
		md = md.replace(/&nbsp;/gi, ' ').replace(/\u00A0/g, ' ')
		// makeMarkdown always appends a trailing blank line; left in, it reads as an intentional extra paragraph later
		md = md.trim()

		return md
	}

	function convertMarkdownToHTMLWithLineBreaks(string,linksInNewWindow=true){
		let converter = new showdown.Converter()
		converter.setOption('openLinksInNewWindow', linksInNewWindow)
		converter.setOption('strikethrough', true)
		// let showdown's own block parser (lists/headers) consume the newlines it needs;
		// any newline left over after that is a plain line break, rendered as <br>
		converter.setOption('simpleLineBreaks', true)

		// protect literal (escaped) \n text the user actually typed, so it isn't mistaken for our line-break marker
		let protectedString = string.replaceAll('\\\\n','\\<span></span>n')
		// turn our \n line-break markers into real newlines (twice, to catch overlapping matches)
		let normalized = protectedString.replaceAll(/(^|[^\\])(\\n)/g,'$1\n').replaceAll(/(^|[^\\])(\\n)/g,'$1\n').trim()

		let result = converter.makeHtml(normalized).replaceAll('<span></span>','')

		// a single simple paragraph (no headers/lists, no blank-line paragraph break) shouldn't be wrapped in <p>,
		// since that clutters the output and can trigger unwanted css; anything more structured keeps its <p>/<h#>/<ul> as-is
		let hasParagraphBreakOrStructure = /\n\s*\n/.test(normalized) || /^\s*(#+|- )/m.test(normalized)
		if (!hasParagraphBreakOrStructure){
			result = result.replaceAll(/<\/?p>/g,'')
		}

		return result

	}



	return {
		applyMarkdown,
		convertHTMLToMarkdown,
		convertMarkdownToHTMLWithLineBreaks
	}
})
