# @amanda-mitchell/remark-renumber-footnotes

This is a remark-parse plugin that renumbers footnotes so that they're always sequential in order of when the reference first appears in the document.

## Installation

```
yarn add @amanda-mitchell/remark-renumber-footnotes
```

## Use

Construct a unified parser and pass `renumerFooters` to it as a plugin:

```js
const unified = require('unified');
const markdown = require('remark-parse');
const footnotes = require('remark-footnotes');
const {
  renumberFootnotes,
} = require('@amanda-mitchell/remark-renumber-footnotes');
const html = require('remark-html');

const doc = `[^1]: Second

This is a document[^2] with[^2] a couple[^1] of^[inline] footnotes[^foo].

[^foo]: Last item

[^2]:	First
`;

const processor = unified()
	.use(markdown)
	.use(footnotes, { inlineNotes: true })
	.use(renumberFootnotes)
	.use(html)
	.freeze();

processor.process(doc).then({ contents } => console.log(contents))
```

When run, this script will print

<!-- prettier-ignore-start -->
```html
<p>This is a document<sup id="fnref-1"><a href="#fn-1" class="footnote-ref">1</a></sup> with<sup id="fnref-1"><a href="#fn-1" class="footnote-ref">1</a></sup> a couple<sup id="fnref-2"><a href="#fn-2" class="footnote-ref">2</a></sup> of<sup id="fnref-3"><a href="#fn-3" class="footnote-ref">3</a></sup> footnotes<sup id="fnref-4"><a href="#fn-4" class="footnote-ref">4</a></sup>.</p>
<div class="footnotes">
<hr>
<ol>
<li id="fn-1">First<a href="#fnref-1" class="footnote-backref">↩</a></li>
<li id="fn-2">Second<a href="#fnref-2" class="footnote-backref">↩</a></li>
<li id="fn-3">inline<a href="#fnref-3" class="footnote-backref">↩</a></li>
<li id="fn-4">Last item<a href="#fnref-4" class="footnote-backref">↩</a></li>
</ol>
</div>
```
<!-- prettier-ignore-end -->

## Options

By default, this plugin will modify footnotes with non-numeric identifiers.
If you would like to disable this behavior you can pass

<!-- prettier-ignore-start -->
```js
{ ignoreNonnumericFootnotes: true }
```
<!-- prettier-ignore-end -->

As the `options` for this plugin.
