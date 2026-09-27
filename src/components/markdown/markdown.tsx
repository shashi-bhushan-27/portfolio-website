import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import type { Element } from 'hast';
import { remarkShiftHeadings } from '@/lib/markdown';
import { CodeBlock } from '@/components/markdown/code-block';
import { cn } from '@/lib/utils';

/*
 * One renderer for both the public article page (rendered on the server)
 * and the admin editor preview (rendered in the browser), so what you see
 * while writing is exactly what gets published. Raw HTML in markdown is
 * intentionally not enabled.
 */

function languageOf(node: Element | undefined) {
  const code = node?.children.find(
    (c): c is Element => c.type === 'element' && c.tagName === 'code'
  );
  const classes = code?.properties?.className;
  if (!Array.isArray(classes)) return undefined;
  const lang = classes.map(String).find((c) => c.startsWith('language-'));
  return lang?.slice('language-'.length);
}

function heading(Tag: 'h2' | 'h3' | 'h4') {
  return function Heading({ id, children, node: _node, ...rest }: React.ComponentProps<'h2'> & { node?: Element }) {
    return (
      <Tag id={id} {...rest}>
        {id && (
          <a href={`#${id}`} className="heading-anchor" aria-hidden tabIndex={-1}>
            #
          </a>
        )}
        {children}
      </Tag>
    );
  };
}

const components: Components = {
  h2: heading('h2'),
  h3: heading('h3'),
  h4: heading('h4'),
  pre({ node, children }) {
    return <CodeBlock language={languageOf(node)}>{children}</CodeBlock>;
  },
  table({ node: _node, ...props }) {
    return (
      <div className="table-wrap">
        <table {...props} />
      </div>
    );
  },
  a({ node: _node, href, ...props }) {
    const external = href ? /^https?:\/\//.test(href) : false;
    return (
      <a
        href={href}
        {...props}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      />
    );
  },
  img({ node: _node, alt, ...props }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt ?? ''} loading="lazy" decoding="async" {...props} />;
  },
};

export function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn('md', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkShiftHeadings]}
        rehypePlugins={[rehypeSlug, [rehypeHighlight, { detect: false }]]}
        components={components}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
