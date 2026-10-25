import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

// Run the actual Java-generated script against a minimal DOM. No credentials or network are used.
const source = readFileSync(new URL('../../main/java/com/ecojust/hifinitv/LoginAutofill.java', import.meta.url), 'utf8');
const expression = source.slice(source.indexOf('return "') + 7, source.lastIndexOf(';')).trim();
const fixture = { username: 'fixture-";globalThis.tampered=true;//', password: 'fixture-\\\n\"\u2028-only' };
const token = /\s+|\+|"(?:\\.|[^"\\])*"|JSONObject\.quote\(credentials\.(username|password)\)|submit/gy;
function actualScript(explicit, javaExpression=expression) {
  let script = '', position = 0;
  while (position < javaExpression.length) {
    token.lastIndex = position;
    const match = token.exec(javaExpression);
    assert.ok(match, `Unrecognized Java string expression at ${position}`);
    position = token.lastIndex;
    if (match[1]) script += JSON.stringify(fixture[match[1]]);
    else if (match[0][0] === '"') script += JSON.parse(match[0]);
    else if (match[0] === 'submit') script += JSON.stringify(Boolean(explicit));
  }
  return script;
}

function run(options = {}) {
  const location = new URL(options.url || 'https://www.hifini.net/user-login.htm');
  const base = options.base || location.href;
  class Input {
    constructor(type, name) { this.type=type;this.name=name;this.disabled=false;this.readOnly=false;this.text='';this.events=[]; }
    get value() { return this.text; } set value(value) { this.text=value; }
    hasAttribute() { return false; } dispatchEvent(event) { this.events.push(event.type); if(options.actionChangedOnInput)form.action='https://example.invalid/collect'; }
  }
  const user = new Input('text', 'email'), password = new Input('password', 'password');
  const form = { method: options.method || 'post', action: new URL(options.action || 'user-login.htm', base).href,
    elements: [user,password], querySelectorAll: () => options.registration ? [password,new Input('password','confirm')] : [password],
    querySelector: () => user, submissions: 0, submit() { throw new Error('Direct submit bypasses validation'); } };
  class Form { requestSubmit() { this.submissions++; if(options.submitError)throw new Error('Verification needed'); } }
  if(options.missingRequest)delete Form.prototype.requestSubmit;
  user.form = options.foreignOwner ? {} : form; password.form = form;
  if(options.readOnly)password.readOnly=true;
  if(options.submitAction)form.elements.push({ formAction: new URL(options.submitAction,base).href,
    hasAttribute: name => name === 'formaction', getAttribute: () => options.submitAction });
  const window = {}; window.top = options.frame ? {} : window;
  const context = { location, window, document:{forms:[form],baseURI:base},URL,HTMLInputElement:Input,HTMLFormElement:Form,Event:class {constructor(type){this.type=type;}} };
  const result = new Script(actualScript(options.explicit)).runInNewContext(context, {timeout:1000});
  return {result,user,password,context,form};
}

test('fills an official POST login form, safely quotes values and never submits', () => {
  const result=run(); assert.equal(result.result,'filled'); assert.equal(result.user.value,fixture.username);
  assert.equal(result.password.value,fixture.password); assert.equal(result.context.tampered,undefined);
  assert.deepEqual(result.password.events,['input','change']);
  assert.equal(result.form.submissions,0);
});
test('only an explicit native login invokes standard requestSubmit once', () => {
  const result=run({explicit:true});assert.equal(result.result,'submitted');assert.equal(result.form.submissions,1);
});
test('explicit login keeps every origin and form guard', () => {
  for(const options of [{url:'https://example.invalid/user-login.htm'},{base:'https://example.invalid/'},
    {method:'get'},{submitAction:'https://example.invalid/collect'},{foreignOwner:true},{registration:true}]) {
    const result=run({...options,explicit:true});assert.notEqual(result.result,'submitted');assert.equal(result.form.submissions,0);
  }
});
test('unsupported submission and a dynamically changed destination fall back to the official page', () => {
  for(const options of [{missingRequest:true},{actionChangedOnInput:true}]) {
    const result=run({...options,explicit:true});assert.equal(result.result,'filled');assert.equal(result.form.submissions,0);
  }
  const validation=run({explicit:true,submitError:true});assert.equal(validation.result,'filled');
});
test('rejects untrusted origins, HTTP, unusual ports and child frames', () => {
  for(const options of [{url:'https://example.invalid/user-login.htm'},{url:'http://www.hifini.net/user-login.htm'},
    {url:'https://www.hifini.net:444/user-login.htm'},{url:'https://user@www.hifini.net/user-login.htm'},{frame:true}]) {
    const result=run(options);assert.equal(result.result,'blocked');assert.equal(result.password.value,'');
  }
});
test('validates browser-resolved form action including base URLs', () => {
  for(const options of [{base:'https://example.invalid/'},{action:'https://example.invalid/user-login.htm'},
    {action:'/user-register.htm'},{method:'get'},{submitAction:'https://example.invalid/collect'}]) {
    const result=run(options);assert.equal(result.result,'no-form');assert.equal(result.password.value,'');
  }
});
test('does not fill controls owned by another form or registration/readonly fields', () => {
  for(const options of [{foreignOwner:true},{registration:true},{readOnly:true}]) {
    const result=run(options);assert.equal(result.result,'no-form');assert.equal(result.password.value,'');
  }
});

const sessionSource = readFileSync(new URL('../../main/java/com/ecojust/hifinitv/HifiniSession.java', import.meta.url), 'utf8');
const sessionMethod = sessionSource.indexOf('static String authenticatedPageScript()');
const sessionStart = sessionSource.indexOf('return "',sessionMethod)+7;
const sessionEnd = sessionSource.indexOf('\n    }',sessionStart);
const sessionExpression = sessionSource.slice(sessionStart,sessionEnd).trim().replace(/;$/,'');
function authenticatedPage(options={}) {
  const location=new URL(options.url||'https://www.hifini.net/');const window={};window.top=options.frame?{}:window;
  const account=options.account===false?[]:[{href:new URL(options.accountPath||'my.htm',location).href,get textContent(){throw new Error('Do not read account identity');}}];
  const logout=options.logout===false?[]:[{href:new URL(options.logoutPath||'user-logout.htm',location).href}];
  const document={baseURI:location.href,querySelectorAll:selector=>selector==='.navbar li.username > a'?account:logout};
  return new Script(actualScript(false,sessionExpression)).runInNewContext({location,window,document,URL},{timeout:1000});
}
test('requires both official authenticated navigation markers without reading account identity',()=>{
  assert.equal(authenticatedPage(),true);
  for(const options of [{account:false},{logout:false},{account:false,logout:false},{accountPath:'https://example.invalid/my.htm'},
    {logoutPath:'https://example.invalid/user-logout.htm'},{url:'https://example.invalid/'},{frame:true}])assert.equal(authenticatedPage(options),false);
});
