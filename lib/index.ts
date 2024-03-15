import type { FootnoteDefinition, FootnoteReference, Root } from 'mdast';
import type { Node } from 'unist';
import { convert } from 'unist-util-is';

export function renumberFootnotes(options?: {
  ignoreNonnumericFootnotes: boolean;
}) {
  const { ignoreNonnumericFootnotes } = options || {
    ignoreNonnumericFootnotes: false,
  };

  return function transform(tree: Root) {
    const nodes = findFootnoteNodes(tree);

    let identifierCount = 0;
    const remappedIdentifiers: Partial<Record<string, string>> = {};

    for (const node of nodes) {
      if (!isFootnoteReference(node)) {
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

    const orphanedDefinitions = nodes
      .filter(isFootnoteDefinition)
      .filter(
        node =>
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

function findFootnoteNodes(
  node: Node,
): (FootnoteDefinition | FootnoteReference)[] {
  if (isFootnoteReference(node) || isFootnoteDefinition(node)) {
    return [node];
  }

  if (!('children' in node) || !Array.isArray(node.children)) {
    return [];
  }

  return node.children.flatMap(findFootnoteNodes);
}

function isNumeric(text: string) {
  return /^\d+$/.test(text);
}

function applyNewIdentifiers<TNode extends Node>(
  node: TNode,
  remappedIdentifiers: Partial<Record<string, string>>,
): TNode {
  if (isFootnoteReference(node) || isFootnoteDefinition(node)) {
    const identifier = remappedIdentifiers[node.identifier];
    if (!identifier) {
      return node;
    }

    return { ...node, identifier, label: identifier };
  }

  if (!('children' in node) || !Array.isArray(node.children)) {
    return node;
  }

  return {
    ...node,
    children: node.children.map(child =>
      applyNewIdentifiers(child, remappedIdentifiers),
    ),
  };
}

const isFootnoteReference = convert('footnoteReference') as (
  node: Node,
) => node is FootnoteReference;
const isFootnoteDefinition = convert('footnoteDefinition') as (
  node: Node,
) => node is FootnoteDefinition;
