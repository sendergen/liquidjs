'use strict'
const Liquid = require('..')
const lexical = Liquid.lexical
const re = new RegExp(`(${lexical.identifier.source})`)
const assert = require('../util/assert.js')
const types = require('../scope.js').types

module.exports = function (liquid) {
  liquid.registerTag('capture', {
    parse: function (tagToken, remainTokens) {
      let match = tagToken.args.match(re)
      assert(match, `${tagToken.args} not valid identifier`)

      this.variable = match[1]
      this.templates = []

      let stream = liquid.parser.parseStream(remainTokens)
      stream.on('tag:endcapture', token => stream.stop())
        .on('template', tpl => this.templates.push(tpl))
        .on('end', x => {
          throw new Error(`tag ${tagToken.raw} not closed`)
        })
      stream.start()
    },
    render: function (scope, hash) {
      return liquid.renderer.renderTemplates(this.templates, scope)
        .then((html) => {
          let ctx = Object.create(types.CaptureScope)
          ctx[this.variable] = html
          scope.push(ctx)
        })
    }
  })
}