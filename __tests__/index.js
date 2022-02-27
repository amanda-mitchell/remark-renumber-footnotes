import unified from 'unified';
import markdown from 'remark-parse';
import html from 'remark-html';
import footnotes from 'remark-footnotes';
import build from 'unist-builder';
import { renumberFootnotes } from '../index.js';

function createProcessor(options) {
  function nullCompiler() {
    this.Compiler = tree => tree;
  }

  return unified()
    .use(markdown)
    .use(footnotes, { inlineNotes: true })
    .use(renumberFootnotes, options)
    .use(nullCompiler)
    .freeze();
}

it('does not modify already sequential footnotes', async () => {
  const doc = `This is a document[^1] with a couple[^2] of footnotes.

[^1]:	First

[^2]: Second
`;

  const processor = createProcessor();

  const { result } = await processor.process(doc);

  expect(result).toMatchObject(
    build('root', [
      build('paragraph', [
        build('text', 'This is a document'),
        build('footnoteReference', { identifier: '1', label: '1' }),
        build('text', ' with a couple'),
        build('footnoteReference', { identifier: '2', label: '2' }),
        build('text', ' of footnotes.'),
      ]),
      build('footnoteDefinition', { identifier: '1', label: '1' }, [
        build('paragraph', [build('text', 'First')]),
      ]),
      build('footnoteDefinition', { identifier: '2', label: '2' }, [
        build('paragraph', [build('text', 'Second')]),
      ]),
    ])
  );
});

it('renumbers out-of-order footnotes', async () => {
  const doc = `This is a document[^2] with a couple[^1] of footnotes.

[^2]:	First

[^1]: Second
`;

  const processor = createProcessor();

  const { result } = await processor.process(doc);

  expect(result).toMatchObject(
    build('root', [
      build('paragraph', [
        build('text', 'This is a document'),
        build('footnoteReference', { identifier: '1', label: '1' }),
        build('text', ' with a couple'),
        build('footnoteReference', { identifier: '2', label: '2' }),
        build('text', ' of footnotes.'),
      ]),
      build('footnoteDefinition', { identifier: '1', label: '1' }, [
        build('paragraph', [build('text', 'First')]),
      ]),
      build('footnoteDefinition', { identifier: '2', label: '2' }, [
        build('paragraph', [build('text', 'Second')]),
      ]),
    ])
  );
});

it('accounts for inline footnotes', async () => {
  const doc = `This is a document[^2] with^[inline note] a couple[^1] of footnotes.

[^2]:	First

[^1]: Second
`;

  const processor = createProcessor();

  const { result } = await processor.process(doc);

  expect(result).toMatchObject(
    build('root', [
      build('paragraph', [
        build('text', 'This is a document'),
        build('footnoteReference', { identifier: '1', label: '1' }),
        build('text', ' with'),
        build('footnote', [build('text', 'inline note')]),
        build('text', ' a couple'),
        build('footnoteReference', { identifier: '3', label: '3' }),
        build('text', ' of footnotes.'),
      ]),
      build('footnoteDefinition', { identifier: '1', label: '1' }, [
        build('paragraph', [build('text', 'First')]),
      ]),
      build('footnoteDefinition', { identifier: '3', label: '3' }, [
        build('paragraph', [build('text', 'Second')]),
      ]),
    ])
  );
});

it('correctly handles multiple references to a single note', async () => {
  const doc = `This is a document[^2] with[^2] a couple[^1] of footnotes.

[^2]:	First

[^1]: Second
`;

  const processor = createProcessor();

  const { result } = await processor.process(doc);

  expect(result).toMatchObject(
    build('root', [
      build('paragraph', [
        build('text', 'This is a document'),
        build('footnoteReference', { identifier: '1', label: '1' }),
        build('text', ' with'),
        build('footnoteReference', { identifier: '1', label: '1' }),
        build('text', ' a couple'),
        build('footnoteReference', { identifier: '2', label: '2' }),
        build('text', ' of footnotes.'),
      ]),
      build('footnoteDefinition', { identifier: '1', label: '1' }, [
        build('paragraph', [build('text', 'First')]),
      ]),
      build('footnoteDefinition', { identifier: '2', label: '2' }, [
        build('paragraph', [build('text', 'Second')]),
      ]),
    ])
  );
});

it('correctly handles orphaned definitions', async () => {
  const doc = `This is a document[^2] with a couple[^3] of footnotes.

[^1]: Zeroth

[^2]:	First

[^3]: Second
`;

  const processor = createProcessor();

  const { result } = await processor.process(doc);

  expect(result).toMatchObject(
    build('root', [
      build('paragraph', [
        build('text', 'This is a document'),
        build('footnoteReference', { identifier: '1', label: '1' }),
        build('text', ' with a couple'),
        build('footnoteReference', { identifier: '2', label: '2' }),
        build('text', ' of footnotes.'),
      ]),
      build('footnoteDefinition', { identifier: '3', label: '3' }, [
        build('paragraph', [build('text', 'Zeroth')]),
      ]),
      build('footnoteDefinition', { identifier: '1', label: '1' }, [
        build('paragraph', [build('text', 'First')]),
      ]),
      build('footnoteDefinition', { identifier: '2', label: '2' }, [
        build('paragraph', [build('text', 'Second')]),
      ]),
    ])
  );
});

it('correctly handles definitions that occur prior to the note', async () => {
  const doc = `[^1]: Second
	
This is a document[^2] with[^2] a couple[^1] of footnotes.

[^2]:	First
`;

  const processor = createProcessor();

  const { result } = await processor.process(doc);

  expect(result).toMatchObject(
    build('root', [
      build('footnoteDefinition', { identifier: '2', label: '2' }, [
        build('paragraph', [build('text', 'Second')]),
      ]),
      build('paragraph', [
        build('text', 'This is a document'),
        build('footnoteReference', { identifier: '1', label: '1' }),
        build('text', ' with'),
        build('footnoteReference', { identifier: '1', label: '1' }),
        build('text', ' a couple'),
        build('footnoteReference', { identifier: '2', label: '2' }),
        build('text', ' of footnotes.'),
      ]),
      build('footnoteDefinition', { identifier: '1', label: '1' }, [
        build('paragraph', [build('text', 'First')]),
      ]),
    ])
  );
});

it('number non-numeric footnotes', async () => {
  const doc = `This is a document[^foo] with a couple[^bar] of footnotes.

[^foo]:	First

[^bar]: Second
`;

  const processor = createProcessor();

  const { result } = await processor.process(doc);

  expect(result).toMatchObject(
    build('root', [
      build('paragraph', [
        build('text', 'This is a document'),
        build('footnoteReference', { identifier: '1', label: '1' }),
        build('text', ' with a couple'),
        build('footnoteReference', { identifier: '2', label: '2' }),
        build('text', ' of footnotes.'),
      ]),
      build('footnoteDefinition', { identifier: '1', label: '1' }, [
        build('paragraph', [build('text', 'First')]),
      ]),
      build('footnoteDefinition', { identifier: '2', label: '2' }, [
        build('paragraph', [build('text', 'Second')]),
      ]),
    ])
  );
});

it('skips non-numeric footnotes when the option is set', async () => {
  const doc = `This is a document[^foo] with a couple[^2] of footnotes.

[^foo]:	First

[^2]: Second
`;

  const processor = createProcessor({
    ignoreNonnumericFootnotes: true,
  });

  const { result } = await processor.process(doc);

  expect(result).toMatchObject(
    build('root', [
      build('paragraph', [
        build('text', 'This is a document'),
        build('footnoteReference', { identifier: 'foo', label: 'foo' }),
        build('text', ' with a couple'),
        build('footnoteReference', { identifier: '1', label: '1' }),
        build('text', ' of footnotes.'),
      ]),
      build('footnoteDefinition', { identifier: 'foo', label: 'foo' }, [
        build('paragraph', [build('text', 'First')]),
      ]),
      build('footnoteDefinition', { identifier: '1', label: '1' }, [
        build('paragraph', [build('text', 'Second')]),
      ]),
    ])
  );
});

it('renders to html correctly', async () => {
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

  const { contents } = await processor.process(doc);

  expect(contents)
    .toEqual(`<p>This is a document<sup id="fnref-1"><a href="#fn-1" class="footnote-ref">1</a></sup> with<sup id="fnref-1"><a href="#fn-1" class="footnote-ref">1</a></sup> a couple<sup id="fnref-2"><a href="#fn-2" class="footnote-ref">2</a></sup> of<sup id="fnref-3"><a href="#fn-3" class="footnote-ref">3</a></sup> footnotes<sup id="fnref-4"><a href="#fn-4" class="footnote-ref">4</a></sup>.</p>
<div class="footnotes">
<hr>
<ol>
<li id="fn-1">First<a href="#fnref-1" class="footnote-backref">↩</a></li>
<li id="fn-2">Second<a href="#fnref-2" class="footnote-backref">↩</a></li>
<li id="fn-3">inline<a href="#fnref-3" class="footnote-backref">↩</a></li>
<li id="fn-4">Last item<a href="#fnref-4" class="footnote-backref">↩</a></li>
</ol>
</div>
`);
});
