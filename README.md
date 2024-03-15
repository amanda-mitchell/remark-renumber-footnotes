# @amanda-mitchell/remark-renumber-footnotes

This is a remark-parse plugin that renumbers footnotes so that they're always sequential in order of when the reference first appears in the document.

## Installation

```
yarn add @amanda-mitchell/remark-renumber-footnotes
```

## Use

Construct a unified parser and pass `renumberFootnotes` to it as a plugin:

```js
const unified = require('unified');
const markdown = require('remark-parse');
const remarkGfm = require('remark-gfm');
const {
  renumberFootnotes,
} = require('@amanda-mitchell/remark-renumber-footnotes');
const html = require('remark-html');

const doc = `[^1]: Second

This is a document[^2] with[^2] a couple[^1] of footnotes[^foo].

[^foo]: Last item

[^2]:	First
`;

const processor = unified()
	.use(markdown)
	.use(remarkGfm)
	.use(renumberFootnotes)
	.use(html)
	.freeze();

processor.process(doc).then({ contents } => console.log(contents))
```

When run, this script will print

<!-- prettier-ignore-start -->
```html
<p>This is a document<sup><a href="#user-content-fn-1" id="user-content-user-content-fnref-1" data-footnote-ref aria-describedby="user-content-footnote-label">1</a></sup> with<sup><a href="#user-content-fn-1" id="user-content-user-content-fnref-1-2" data-footnote-ref aria-describedby="user-content-footnote-label">1</a></sup> a couple<sup><a href="#user-content-fn-2" id="user-content-user-content-fnref-2" data-footnote-ref aria-describedby="user-content-footnote-label">2</a></sup> of footnotes<sup><a href="#user-content-fn-3" id="user-content-user-content-fnref-3" data-footnote-ref aria-describedby="user-content-footnote-label">3</a></sup>.</p>
<section data-footnotes class="footnotes"><h2 class="sr-only" id="user-content-footnote-label">Footnotes</h2>
<ol>
<li id="user-content-user-content-fn-1">
<p>First <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a> <a href="#user-content-fnref-1-2" data-footnote-backref="" aria-label="Back to reference 1-2" class="data-footnote-backref">↩<sup>2</sup></a></p>
</li>
<li id="user-content-user-content-fn-2">
<p>Second <a href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-user-content-fn-3">
<p>Last item <a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>
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
