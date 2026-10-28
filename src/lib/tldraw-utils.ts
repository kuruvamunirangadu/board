/**
 * Utility functions for tldraw v3 shape text and richText interoperability
 */

export function toRichText(text: string) {
  const lines = (text || '').split('\n');
  const content = lines.map((line) => {
    if (!line) {
      return {
        type: 'paragraph',
      };
    }
    return {
      type: 'paragraph',
      content: [{ type: 'text', text: line }],
    };
  });
  return {
    type: 'doc',
    content,
  };
}

function extractNodeText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node.text === 'string') return node.text;
  if (Array.isArray(node.content)) {
    return node.content
      .map(extractNodeText)
      .join(node.type === 'doc' || node.type === 'paragraph' ? '\n' : '');
  }
  return '';
}

export function getShapeText(shape: any): string {
  if (!shape) return '';
  const props = shape.props || {};

  // 1. Direct text prop if available
  if (typeof props.text === 'string' && props.text.trim().length > 0) {
    return props.text.trim();
  }

  // 2. ProseMirror richText structure (tldraw v3.7 standard)
  if (props.richText) {
    const extracted = extractNodeText(props.richText).trim();
    if (extracted.length > 0) return extracted;
  }

  // 3. Name or label prop fallback
  if (typeof props.name === 'string' && props.name.trim().length > 0) {
    return props.name.trim();
  }

  return '';
}

