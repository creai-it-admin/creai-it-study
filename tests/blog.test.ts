import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanHtml,parseContent,parseSlug,validatePublication,EMPTY_CONTENT} from '../lib/blog/content';
test('blog strips active HTML while keeping editorial structure',()=>{
 const html=cleanHtml('<html><head><title>Hidden</title><style>body{display:none}</style></head><body><h2>Heading</h2><script>alert(1)</script><p onclick="x()">Text <a href="javascript:alert(1)">link</a></p><iframe src="https://evil.test"></iframe><img src="https://example.com/a.png" onerror="x()"><img src="data:image/svg+xml,evil"><table><tr><td>Cell</td></tr></table></body></html>');
 assert.ok(html.includes('<h2>Heading</h2>'));assert.ok(html.includes('<td>Cell</td>'));assert.ok(html.includes('loading="lazy"'));assert.doesNotMatch(html,/script|onclick|onerror|javascript|iframe|data:image|Hidden|display:none/);
});
test('blog validates addresses and publication readiness',()=>{
 assert.equal(parseSlug('hello-ai-2'),'hello-ai-2');for(const slug of ['../admin','Hello','a/b','','a--b'])assert.throws(()=>parseSlug(slug));
 const draft=parseContent({...EMPTY_CONTENT,title:'Title',html:'<p>Body</p>'});assert.throws(()=>validatePublication(draft));
 assert.throws(()=>parseContent({...draft,coverUrl:'javascript:evil'}));
 assert.throws(()=>parseContent({...draft,title:'x'.repeat(121)}));
 assert.doesNotThrow(()=>validatePublication({...draft,excerpt:'Description'}));
 assert.throws(()=>validatePublication({...draft,excerpt:'Description',coverUrl:'https://example.com/a.png'}));
});
