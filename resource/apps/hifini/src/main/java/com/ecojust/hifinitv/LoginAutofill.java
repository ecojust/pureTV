package com.ecojust.hifinitv;

import org.json.JSONObject;

/** Official login form interaction and status classification; no site credential values are read. */
final class LoginAutofill {
    private LoginAutofill() { }

    static String stateScript() {
        return "(function(){'use strict';" + helpers() + "return state();})()";
    }

    static String script(CredentialStore.Credentials credentials) { return script(credentials, false); }

    static String script(CredentialStore.Credentials credentials, boolean submit) {
        return "(function(explicit){'use strict';" + helpers()
                + "if(verification())return 'verification';var login=loginForm();if(!login)return 'no-form';"
                + "var f=login.form,u=login.user,p=login.password;"
                + "var setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;"
                + "setter.call(u," + JSONObject.quote(credentials.username) + ");setter.call(p," + JSONObject.quote(credentials.password) + ");"
                + "[u,p].forEach(function(input){input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});"
                + "if(verification())return 'verification';"
                + "if(explicit&&actionFor(f)&&u.form===f&&p.form===f){"
                + "if(typeof f.checkValidity==='function'&&!f.checkValidity())return 'rejected';"
                + "var request=typeof HTMLFormElement!=='undefined'&&HTMLFormElement.prototype.requestSubmit;"
                + "if(typeof request==='function'){try{request.call(f);return 'submitted';}catch(e){}}}"
                + "return 'filled';})(" + submit + ")";
    }

    private static String helpers() {
        return "if(window.top!==window||location.protocol!=='https:'||!['www.hifini.net','hifini.net'].includes(location.hostname)"
                + "||(location.port&&location.port!=='443')||location.username||location.password)return 'blocked';"
                + "function visible(e){if(!e||e.type==='hidden'||e.hidden||e.getAttribute('aria-hidden')==='true'||!e.getClientRects().length)return false;"
                + "for(var n=e;n&&n.nodeType===1;n=n.parentElement){var s=getComputedStyle(n);if(n.hidden||n.getAttribute('aria-hidden')==='true'||s.display==='none'||s.visibility==='hidden'||s.visibility==='collapse'||s.opacity==='0')return false;}return true;}"
                + "function anyVisible(root,selector){return Array.from(root.querySelectorAll(selector)).some(visible);}"
                + "function verification(){return anyVisible(document,'.g-recaptcha,.h-captcha,.cf-turnstile,#captcha,.captcha,input[name=captcha],input[name=verifycode],input[name=verify],input[name=vcode],iframe[src*=\"recaptcha\"],iframe[src*=\"hcaptcha\"],iframe[src*=\"challenges.cloudflare.com\"],form#challenge-form,form[action*=\"/cdn-cgi/challenge-platform/\"]');}"
                + "function has(selector,path){return Array.from(document.querySelectorAll(selector)).some(function(a){try{var u=new URL(a.href,document.baseURI);return u.origin===location.origin&&u.pathname===path&&!u.username&&!u.password;}catch(e){return false;}});}"
                + "function authenticated(){return has('.navbar li.username > a','/my.htm')&&has('.navbar a','/user-logout.htm');}"
                + "function actionFor(f){var a;try{a=new URL(f.action||location.href,document.baseURI);}catch(e){return null;}"
                + "if(f.method.toLowerCase()!=='post'||a.origin!==location.origin||a.username||a.password||!/^\\/user-login(?:\\.htm)?\\/?$/.test(a.pathname))return null;"
                + "var overrides=Array.from(f.elements).filter(function(b){return b.hasAttribute('formaction')||b.hasAttribute('formmethod');});"
                + "if(overrides.some(function(b){try{var u=new URL(b.hasAttribute('formaction')?b.formAction:a.href,document.baseURI);"
                + "return u.origin!==location.origin||u.username||u.password||!/^\\/user-login(?:\\.htm)?\\/?$/.test(u.pathname)"
                + "||(b.hasAttribute('formmethod')&&b.getAttribute('formmethod').toLowerCase()!=='post');}catch(e){return true;}}))return null;return a;}"
                + "function loginForm(){var forms=Array.from(document.forms);for(var i=0;i<forms.length;i++){var f=forms[i];if(!actionFor(f))continue;"
                + "var passwords=f.querySelectorAll('input[type=password]');if(passwords.length!==1)continue;"
                + "var p=passwords[0],u=f.querySelector('input[name=email],input[name=username],input[name=account]');"
                + "if(!u||u.form!==f||p.form!==f||!['text','email'].includes(u.type)||p.name!=='password'||p.disabled||p.readOnly||u.disabled||u.readOnly)continue;"
                + "return {form:f,user:u,password:p};}return null;}"
                + "function state(){if(authenticated())return 'authenticated';if(verification())return 'verification';var login=loginForm();"
                + "if(login&&(anyVisible(login.form,'.invalid-feedback,.alert-danger,.is-invalid')||anyVisible(document,'.alert-danger[role=alert],.card-body > .alert-danger')))return 'rejected';"
                + "return login?'ready':'pending';}";
    }
}
