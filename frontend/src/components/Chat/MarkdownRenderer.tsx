import {marked} from "marked";
import {useEffect, useState} from "react";

export function MarkdownRenderer({markdown, className}: { markdown: string, className?: string }) {
  const [html, setHtml] = useState('');
  const classes = `prose prose-sm prose-invert max-w-none ${className ?? ''}`;

  useEffect(() => {
    marked(markdown, {async: true})
      .then(result => setHtml(result))
      .catch(err => console.error('Markdown parsing failed:', err));
  }, [markdown]);

  return <div
    className={classes}
    dangerouslySetInnerHTML={{__html: html}}/>
}
