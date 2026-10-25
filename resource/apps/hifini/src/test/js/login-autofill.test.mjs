import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

// Execute the actual Java-generated JavaScript against a minimal DOM with synthetic credentials.
const source=readFileSync(new URL('../../main/java/com/ecojust/hifinitv/LoginAutofill.java',import.meta.url),'utf8');
const fixture={username:'fixture-";globalThis.tampered=true;//',password:'fixture-\\\n"\u2028-only'};
function expressionAfter(marker,text=source){const start=text.indexOf('return "',text.indexOf(marker))+7;const end=text.indexOf('\n    }',start);return text.slice(start,end).trim().replace(/;$/,'');}
const token=/\s+|\+|"(?:\\.|[^"\\])*"|JSONObject\.quote\(credentials\.(username|password)\)|helpers\(\)|submit/gy;
function expressionValue(expression,explicit=false){let script='',position=0;while(position<expression.length){token.lastIndex=position;const match=token.exec(expression);assert.ok(match,`Unrecognized Java expression at ${position}`);position=token.lastIndex;if(match[1])script+=JSON.stringify(fixture[match[1]]);else if(match[0][0]==='"')script+=JSON.parse(match[0]);else if(match[0]==='submit')script+=JSON.stringify(explicit);else if(match[0]==='helpers()')script+=expressionValue(expressionAfter('private static String helpers()'));}return script;}
function actualScript(explicit=false,state=false){return expressionValue(expressionAfter(state?'static String stateScript()':'static String script(CredentialStore.Credentials credentials, boolean submit)'),explicit);}

function element(options={}){return {nodeType:1,type:options.type||'',hidden:Boolean(options.hidden),parentElement:options.parent||null,
  getAttribute:name=>name==='aria-hidden'?(options.ariaHidden?'true':null):null,
  getClientRects:()=>options.noRect?[]:[{}],style:{display:options.display||'block',visibility:options.visibility||'visible',opacity:options.opacity||'1'},
  get textContent(){throw new Error('State classification must not read raw text');}};}

function run(options={}){
  const location=new URL(options.url||'https://www.hifini.net/user-login.htm'),base=options.base||location.href;
  let submitControl;
  class Element{
    click(){this.clicks=(this.clicks||0)+1;this.form.submissions++;}
    matches(selector){assert.equal(selector,':disabled');return Boolean(this.fieldsetDisabled);}
  }
  class Input extends Element{
    constructor(type,name){super();this.type=type;this.name=name;this.disabled=false;this.readOnly=false;this.text='';this.events=[];}
    get value(){if(options.forbidValueRead)throw new Error('Do not inspect website credential values');return this.text;}
    set value(value){this.text=value;}
    hasAttribute(){return false;}dispatchEvent(event){this.events.push(event.type);if(options.actionChangedOnInput)form.action='https://example.invalid/collect';if(options.submitActionChangedOnInput){submitControl.overrideAction=true;submitControl.formAction='https://example.invalid/collect';}}
  }
  class Button extends Element{}
  const user=new Input('text','email'),password=new Input('password','password');
  const errors=options.error?[element(options.error===true?{}:options.error)]:[];
  const form={method:options.method||'post',action:new URL(options.action||'user-login.htm',base).href,elements:[user,password],
    querySelectorAll:selector=>selector==='input[type=password]'?(options.registration?[password,new Input('password','confirm')]:[password]):errors,
    querySelector:()=>user,submissions:0,checkValidity:()=>!options.invalid,submit(){throw new Error('Direct submit bypasses validation');}};
  class Form{requestSubmit(){this.submissions++;if(options.submitError)throw new Error('Verification needed');}}
  if(options.missingRequest)delete Form.prototype.requestSubmit;
  user.form=options.foreignOwner?{}:form;password.form=form;if(options.readOnly)password.readOnly=true;
  if(options.submitAction)form.elements.push({formAction:new URL(options.submitAction,base).href,hasAttribute:name=>name==='formaction',getAttribute:()=>options.submitAction});
  if(options.control){
    submitControl=options.control==='input'?new Input('submit','submit'):options.control==='fake'?{}:new Button();
    Object.assign(submitControl,{type:options.controlType||'submit',form:options.controlForeign?{}:form,disabled:Boolean(options.controlDisabled),fieldsetDisabled:Boolean(options.fieldsetDisabled),formNoValidate:Boolean(options.noValidate),overrideAction:Boolean(options.controlAction),formAction:new URL(options.controlAction||'user-login.htm',base).href,
      hasAttribute(name){return name==='formaction'?this.overrideAction:name==='formmethod'&&Boolean(options.controlMethod);},getAttribute(name){return name==='formmethod'?options.controlMethod:null;}});
    form.elements.push(submitControl);
  }
  const window={};window.top=options.frame?{}:window;
  const account=options.account?[{href:new URL(options.accountPath||'my.htm',location).href,get textContent(){throw new Error('Do not read account identity');}}]:[];
  const logout=options.logout?[{href:new URL(options.logoutPath||'user-logout.htm',location).href}]:[];
  const captcha=options.captcha?[element(options.captcha===true?{}:options.captcha)]:[];
  const document={forms:options.noForm?[]:[form],baseURI:base,querySelectorAll:selector=>{
    if(selector==='.navbar li.username > a')return account;if(selector==='.navbar a')return logout;
    if(selector.startsWith('.g-recaptcha'))return captcha;if(selector.startsWith('.alert-danger'))return options.outsideError?errors:[];throw new Error(`Unknown selector: ${selector}`);
  }};
  const context={location,window,document,URL,HTMLInputElement:Input,HTMLButtonElement:Button,HTMLElement:Element,HTMLFormElement:Form,getComputedStyle:e=>e.style,Event:class{constructor(type){this.type=type;}}};
  const result=new Script(actualScript(Boolean(options.explicit),Boolean(options.state))).runInNewContext(context,{timeout:1000});
  return {result,user,password,context,form,submitControl};
}

test('fills official POST login safely without automatically submitting',()=>{const r=run();assert.equal(r.result,'filled');assert.equal(r.user.value,fixture.username);assert.equal(r.password.value,fixture.password);assert.equal(r.context.tampered,undefined);assert.deepEqual(r.password.events,['input','change']);assert.equal(r.form.submissions,0);});
test('only an explicit native action invokes standard requestSubmit once',()=>{const r=run({explicit:true});assert.equal(r.result,'submitted');assert.equal(r.form.submissions,1);});
test('origin and form guards also apply to explicit submission',()=>{for(const o of [{url:'https://example.invalid/user-login.htm'},{base:'https://example.invalid/'},{method:'get'},{submitAction:'https://example.invalid/collect'},{foreignOwner:true},{registration:true}]){const r=run({...o,explicit:true});assert.notEqual(r.result,'submitted');assert.equal(r.form.submissions,0);}});
test('unsupported requestSubmit and changed destinations never directly submit',()=>{for(const o of [{missingRequest:true},{actionChangedOnInput:true}]){const r=run({...o,explicit:true});assert.equal(r.result,'filled');assert.equal(r.form.submissions,0);}assert.equal(run({explicit:true,submitError:true}).result,'filled');});
test('older WebViews use one native click on a validated owned submit button or input',()=>{
  for(const control of ['button','input']){const r=run({explicit:true,missingRequest:true,control});assert.equal(r.result,'submitted');assert.equal(r.submitControl.clicks,1);assert.equal(r.form.submissions,1);}
  const regular=run({explicit:true,control:'button'});assert.equal(regular.result,'submitted');assert.equal(regular.submitControl.clicks,undefined);assert.equal(regular.form.submissions,1);
  const restored=run({missingRequest:true,control:'button'});assert.equal(restored.result,'filled');assert.equal(restored.form.submissions,0);
});
test('click fallback rejects missing, fake, disabled, foreign and destination-overridden controls',()=>{
  for(const options of [{},{control:'fake'},{control:'button',controlType:'button'},{control:'button',controlDisabled:true},{control:'button',fieldsetDisabled:true},{control:'button',noValidate:true},{control:'button',controlForeign:true},{control:'button',controlAction:'https://example.invalid/collect'},{control:'button',controlMethod:'get'},{control:'button',submitActionChangedOnInput:true},{control:'input',invalid:true}]){
    const r=run({explicit:true,missingRequest:true,...options});assert.notEqual(r.result,'submitted');assert.equal(r.form.submissions,0);assert.equal(r.submitControl?.clicks,undefined);
  }
  const throwingRequest=run({explicit:true,control:'button',submitError:true});assert.equal(throwingRequest.result,'filled');assert.equal(throwingRequest.submitControl.clicks,undefined);assert.equal(throwingRequest.form.submissions,1);
});
test('both scripts reject foreign origins, HTTP, unusual ports, userinfo and frames',()=>{for(const o of [{url:'https://example.invalid/user-login.htm'},{url:'http://www.hifini.net/user-login.htm'},{url:'https://www.hifini.net:444/user-login.htm'},{url:'https://user@www.hifini.net/user-login.htm'},{frame:true}])for(const state of [false,true]){const r=run({...o,state});assert.equal(r.result,'blocked');assert.equal(r.password.value,'');}});
test('validates browser-resolved action, base URLs and control ownership',()=>{for(const o of [{base:'https://example.invalid/'},{action:'https://example.invalid/user-login.htm'},{action:'/user-register.htm'},{method:'get'},{submitAction:'https://example.invalid/collect'},{foreignOwner:true},{registration:true},{readOnly:true}]){const r=run(o);assert.equal(r.result,'no-form');assert.equal(r.password.value,'');assert.equal(run({...o,state:true}).result,'pending');}});
test('visible verification blocks filling and submission, but hidden captcha fields do not',()=>{for(const state of [false,true]){const r=run({captcha:true,explicit:true,state});assert.equal(r.result,'verification');assert.equal(r.password.value,'');assert.equal(r.form.submissions,0);}for(const captcha of [{type:'hidden'},{hidden:true},{display:'none'},{visibility:'hidden'},{opacity:'0'},{noRect:true},{ariaHidden:true},{parent:element({display:'none'})}]){assert.equal(run({captcha,state:true}).result,'ready');assert.equal(run({captcha,explicit:true}).result,'submitted');}});
test('visible official form errors and native constraint failures classify as rejected',()=>{assert.equal(run({error:true,state:true}).result,'rejected');assert.equal(run({error:{display:'none'},state:true}).result,'ready');const r=run({invalid:true,explicit:true});assert.equal(r.result,'rejected');assert.equal(r.form.submissions,0);});
test('authenticated requires both official markers and never reads identity',()=>{assert.equal(run({account:true,logout:true,state:true}).result,'authenticated');for(const o of [{account:true},{logout:true},{account:true,logout:true,accountPath:'https://example.invalid/my.htm'},{account:true,logout:true,logoutPath:'https://example.invalid/user-logout.htm'}])assert.equal(run({...o,state:true}).result,'ready');});
test('polling returns only classifications, never reads fields or returns raw credentials',()=>{for(const o of [{},{noForm:true},{captcha:true},{error:true},{account:true,logout:true}]){const result=run({...o,state:true,forbidValueRead:true}).result;assert.ok(['ready','pending','verification','rejected','authenticated'].includes(result));assert.equal(result.includes(fixture.username),false);assert.equal(result.includes(fixture.password),false);}});

const sessionSource=readFileSync(new URL('../../main/java/com/ecojust/hifinitv/HifiniSession.java',import.meta.url),'utf8');
function authenticatedPage(options={}){const location=new URL(options.url||'https://www.hifini.net/'),window={};window.top=options.frame?{}:window;const account=options.account===false?[]:[{href:new URL(options.accountPath||'my.htm',location).href,get textContent(){throw new Error('Do not read account identity');}}],logout=options.logout===false?[]:[{href:new URL(options.logoutPath||'user-logout.htm',location).href}];const document={baseURI:location.href,querySelectorAll:selector=>selector==='.navbar li.username > a'?account:logout};return new Script(expressionValue(expressionAfter('static String authenticatedPageScript()',sessionSource))).runInNewContext({location,window,document,URL},{timeout:1000});}
test('session confirmation requires official account and logout navigation markers',()=>{assert.equal(authenticatedPage(),true);for(const o of [{account:false},{logout:false},{account:false,logout:false},{accountPath:'https://example.invalid/my.htm'},{logoutPath:'https://example.invalid/user-logout.htm'},{url:'https://example.invalid/'},{frame:true}])assert.equal(authenticatedPage(o),false);});
