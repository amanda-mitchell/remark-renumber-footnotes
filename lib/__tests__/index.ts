import { unified } from 'unified';
import markdown from 'remark-parse';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';
import { u as build } from 'unist-builder';
import { renumberFootnotes } from '../index';

function createProcessor(options?: Parameters<typeof renumberFootnotes>[0]) {
  const processor = unified()
    .use(markdown)
    .use(remarkGfm)
    .use(renumberFootnotes, options)
    .freeze();

  return (doc: string) => {
    const tree = processor.parse(doc);
    return processor.run(tree);
  };
}

it('does not modify already sequential footnotes', async () => {
  const doc = `This is a document[^1] with a couple[^2] of footnotes.

[^1]:	First

[^2]: Second
`;

  const process = createProcessor();

  const result = await process(doc);

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
    ]),
  );
});

it('renumbers out-of-order footnotes', async () => {
  const doc = `This is a document[^2] with a couple[^1] of footnotes.

[^2]:	First

[^1]: Second
`;

  const process = createProcessor();

  const result = await process(doc);

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
    ]),
  );
});

it('correctly handles multiple references to a single note', async () => {
  const doc = `This is a document[^2] with[^2] a couple[^1] of footnotes.

[^2]:	First

[^1]: Second
`;

  const process = createProcessor();

  const result = await process(doc);

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
    ]),
  );
});

it('correctly handles orphaned definitions', async () => {
  const doc = `This is a document[^2] with a couple[^3] of footnotes.

[^1]: Zeroth

[^2]:	First

[^3]: Second
`;

  const process = createProcessor();

  const result = await process(doc);

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
    ]),
  );
});

it('correctly handles definitions that occur prior to the note', async () => {
  const doc = `[^1]: Second
	
This is a document[^2] with[^2] a couple[^1] of footnotes.

[^2]:	First
`;

  const process = createProcessor();

  const result = await process(doc);

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
    ]),
  );
});

it('number non-numeric footnotes', async () => {
  const doc = `This is a document[^foo] with a couple[^bar] of footnotes.

[^foo]:	First

[^bar]: Second
`;

  const process = createProcessor();

  const result = await process(doc);

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
    ]),
  );
});

it('skips non-numeric footnotes when the option is set', async () => {
  const doc = `This is a document[^foo] with a couple[^2] of footnotes.

[^foo]:	First

[^2]: Second
`;

  const process = createProcessor({
    ignoreNonnumericFootnotes: true,
  });

  const result = await process(doc);

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
    ]),
  );
});

it('renders to html correctly', async () => {
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

  const { value } = await processor.process(doc);

  expect(value)
    .toEqual(`<p>This is a document<sup><a href="#user-content-fn-1" id="user-content-user-content-fnref-1" data-footnote-ref aria-describedby="user-content-footnote-label">1</a></sup> with<sup><a href="#user-content-fn-1" id="user-content-user-content-fnref-1-2" data-footnote-ref aria-describedby="user-content-footnote-label">1</a></sup> a couple<sup><a href="#user-content-fn-2" id="user-content-user-content-fnref-2" data-footnote-ref aria-describedby="user-content-footnote-label">2</a></sup> of footnotes<sup><a href="#user-content-fn-3" id="user-content-user-content-fnref-3" data-footnote-ref aria-describedby="user-content-footnote-label">3</a></sup>.</p>
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
`);
});
