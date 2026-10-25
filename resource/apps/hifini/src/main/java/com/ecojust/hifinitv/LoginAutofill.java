package com.ecojust.hifinitv;

import org.json.JSONObject;

/** Fills a recognized official login form. Submission requires one explicit native login action. */
final class LoginAutofill {
    private LoginAutofill() { }

    static String script(CredentialStore.Credentials credentials) {
        return script(credentials, false);
    }

    static String script(CredentialStore.Credentials credentials, boolean submit) {
        return "(function(explicit){'use strict';"
                + "if(window.top!==window||location.protocol!=='https:'||!['www.hifini.net','hifini.net'].includes(location.hostname)"
                + "||(location.port&&location.port!=='443')||location.username||location.password)return 'blocked';"
                + "function actionFor(f){var a;try{a=new URL(f.action||location.href,document.baseURI);}catch(e){return null;}"
                + "if(f.method.toLowerCase()!=='post'||a.origin!==location.origin||a.username||a.password||!/^\\/user-login(?:\\.htm)?\\/?$/.test(a.pathname))return null;"
                + "var overrides=Array.from(f.elements).filter(function(b){return b.hasAttribute('formaction')||b.hasAttribute('formmethod');});"
                + "if(overrides.some(function(b){try{var u=new URL(b.hasAttribute('formaction')?b.formAction:a.href,document.baseURI);"
                + "return u.origin!==location.origin||u.username||u.password||!/^\\/user-login(?:\\.htm)?\\/?$/.test(u.pathname)"
                + "||(b.hasAttribute('formmethod')&&b.getAttribute('formmethod').toLowerCase()!=='post');}catch(e){return true;}}))return null;return a;}"
                + "var forms=Array.from(document.forms);"
                + "for(var i=0;i<forms.length;i++){var f=forms[i];if(!actionFor(f))continue;"
                + "var passwords=f.querySelectorAll('input[type=password]');if(passwords.length!==1)continue;"
                + "var p=passwords[0],u=f.querySelector('input[name=email],input[name=username],input[name=account]');"
                + "if(!u||u.form!==f||p.form!==f||!['text','email'].includes(u.type)||p.name!=='password'||p.disabled||p.readOnly||u.disabled||u.readOnly)continue;"
                + "var setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;"
                + "setter.call(u," + JSONObject.quote(credentials.username) + ");setter.call(p," + JSONObject.quote(credentials.password) + ");"
                + "[u,p].forEach(function(input){input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});"
                + "if(explicit&&actionFor(f)&&u.form===f&&p.form===f){var request=typeof HTMLFormElement!=='undefined'&&HTMLFormElement.prototype.requestSubmit;"
                + "if(typeof request==='function'){try{request.call(f);return 'submitted';}catch(e){}}}"
                + "return 'filled';}return 'no-form';})(" + submit + ")";
    }
}
