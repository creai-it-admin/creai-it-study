import assert from 'node:assert/strict';
import {test} from 'node:test';
import {validateHtml,validDeckPath} from '../lib/storage';
test('single-file interactive HTML is accepted, external sibling files are rejected',()=>{
 assert.doesNotThrow(()=>validateHtml('<!doctype html><html><body><button onclick="this.textContent=42">Next</button><img src="data:image/png;base64,AA"/></body></html>'));
 assert.throws(()=>validateHtml('%PDF-1.7'));
 assert.throws(()=>validateHtml('<html><script src="./slides.js"></script></html>'));
 assert.equal(validDeckPath('session/decks/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.html','session'),true);
 assert.equal(validDeckPath('session/../other/decks/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.html','session'),false);
 assert.equal(validDeckPath('another/decks/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.html','session'),false);
});

test('embedded image identifiers in data-src are not external file references',()=>{
 assert.doesNotThrow(()=>validateHtml('<html><img data-src="embedded-image"/><script>const image="data:image/png;base64,AA";</script></html>'));
 assert.throws(()=>validateHtml('<html><img data-src="embedded-image" src="./missing.png"/></html>'));
});
