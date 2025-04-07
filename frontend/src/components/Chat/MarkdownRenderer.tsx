import {marked} from "marked";
import {useEffect, useState} from "react";

export function MarkdownRenderer({markdown}: { markdown: string }) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    marked(markdown, {async: true})
      .then(result => setHtml(result))
      .catch(err => console.error('Markdown parsing failed:', err));
  }, [markdown]);

  return <div
    className="prose prose-sm prose-invert max-w-none"
    dangerouslySetInnerHTML={{__html: html}}/>
}
