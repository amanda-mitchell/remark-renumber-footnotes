import { convert } from 'unist-util-is';

export function renumberFootnotes(options) {
  const { ignoreNonnumericFootnotes } = options || {
    ignoreNonnumericFootnotes: false,
  };

  return function transform(tree) {
    const nodes = findFootnoteNodes(tree);

    let identifierCount = 0;
    const remappedIdentifiers = {};

    for (const node of nodes) {
      if (isFootnoteDefinition(node)) {
        continue;
      }

      if (isFootnote(node)) {
        // Footnote nodes don't get an identifier until rendered
        // to HTML, but we still need to account for them in our
        // numbering.
        ++identifierCount;
        continue;
      }

      const identifier = node.identifier;
      if (ignoreNonnumericFootnotes && !isNumeric(identifier)) {
        continue;
      }

      if (!remappedIdentifiers[identifier]) {
        remappedIdentifiers[identifier] = (++identifierCount).toString();
      }
    }

    const orphanedDefinitions = nodes.filter(
      node =>
        isFootnoteDefinition(node) &&
        !remappedIdentifiers[node.identifier] &&
        (!ignoreNonnumericFootnotes || isNumeric(node.identifier)),
    );

    for (const node of orphanedDefinitions) {
      // Two definitions might use the same identifier, so we still need
      // to perform this check.
      if (!remappedIdentifiers[node.identifier]) {
        remappedIdentifiers[node.identifier] = (++identifierCount).toString();
      }
    }

    return applyNewIdentifiers(tree, remappedIdentifiers);
  };
}

function findFootnoteNodes(node) {
  if (
    isFootnote(node) ||
    isFootnoteReference(node) ||
    isFootnoteDefinition(node)
  ) {
    return [node];
  }

  if (!node.children) {
    return [];
  }

  return node.children.flatMap(findFootnoteNodes);
}

function isNumeric(text) {
  return /^\d+$/.test(text);
}

function applyNewIdentifiers(node, remappedIdentifiers) {
  if (isFootnoteReference(node) || isFootnoteDefinition(node)) {
    const identifier = remappedIdentifiers[node.identifier];
    if (!identifier) {
      return node;
    }

    return { ...node, identifier, label: identifier };
  }

  if (!node.children) {
    return node;
  }

  return {
    ...node,
    children: node.children.map(child =>
      applyNewIdentifiers(child, remappedIdentifiers),
    ),
  };
}

const isFootnoteReference = convert('footnoteReference');
const isFootnoteDefinition = convert('footnoteDefinition');
const isFootnote = convert('footnote');
