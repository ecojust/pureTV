/** The static SVG subset accepted by existing layout.json v5 launchers. */
const namespace='http://www.w3.org/2000/svg';
const xmlnsNamespace='http://www.w3.org/2000/xmlns/';
const tags=new Set(['svg','g','path','rect','circle','ellipse','line','polyline','polygon']);
const attrs=new Set(['viewBox','width','height','x','y','x1','y1','x2','y2','cx','cy','r','rx','ry','d','points','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','fill-rule','clip-rule','opacity','fill-opacity','stroke-opacity','transform','color']);
const limit=8192;

export type SvgErrorCode='type'|'size'|'document'|'root'|'namespace'|'element'|'attribute'|'resource'|'metadata';
export interface SvgIssue {code:SvgErrorCode;detail?:string}
export class SvgError extends Error implements SvgIssue {
  constructor(public readonly code:SvgErrorCode,public readonly detail?:string){super(code);this.name='SvgError';}
}

function parse(value:unknown):XMLDocument {
  if(typeof value!=='string')throw new SvgError('type');
  if(new TextEncoder().encode(value).length>limit)throw new SvgError('size');
  if(/<!DOCTYPE|<!ENTITY/i.test(value))throw new SvgError('document');
  const doc=new DOMParser().parseFromString(value,'image/svg+xml');
  if(doc.querySelector('parsererror'))throw new SvgError('document');
  if(doc.documentElement.localName!=='svg')throw new SvgError('root');
  return doc;
}

function inspect(doc:XMLDocument,normalize:boolean):boolean {
  let changed=false;
  for(const element of [...doc.querySelectorAll('*')]){
    if(element.namespaceURI&&element.namespaceURI!==namespace)throw new SvgError('namespace',element.tagName);
    const metadata=normalize&&(element.localName==='title'||element.localName==='desc');
    if(!tags.has(element.localName)&&!metadata)throw new SvgError('element',element.tagName);
    // A description can be removed only when it contains text, never nested SVG/HTML.
    if(metadata&&[...element.childNodes].some(node=>node.nodeType!==Node.TEXT_NODE&&node.nodeType!==Node.CDATA_SECTION_NODE))throw new SvgError('metadata',element.tagName);
    for(const attribute of [...element.attributes]){
      if(attribute.name==='xmlns'&&attribute.namespaceURI===xmlnsNamespace){
        if(attribute.value!==namespace)throw new SvgError('namespace','xmlns');
        continue;
      }
      if(attribute.namespaceURI)throw new SvgError('namespace',attribute.name);
      if(normalize&&(attribute.name==='role'||/^aria-[a-z][a-z0-9-]*$/.test(attribute.name))){
        element.removeAttribute(attribute.name);changed=true;continue;
      }
      if(!attrs.has(attribute.name))throw new SvgError('attribute',attribute.name);
      // Match the Rust core and Android launchers, including their bare "url" restriction.
      if(/url|javascript:|http:|https:|data:|@import|[<>]/i.test(attribute.value))throw new SvgError('resource',attribute.name);
    }
    if(metadata){element.remove();changed=true;}
  }
  return changed;
}

/** Strict protocol validation. Importing a layout never silently changes its icons. */
export function svgError(value:unknown):SvgIssue|null {
  try{inspect(parse(value),false);return null;}
  catch(error){return error instanceof SvgError?{code:error.code,...(error.detail?{detail:error.detail}:{})}:{code:'document'};}
}

/** Strip only nonvisual accessibility metadata when pasting into the icon editor. */
export function prepareSvg(value:string):{svg:string;normalized:boolean} {
  let doc:XMLDocument;
  try{doc=parse(value);}catch(error){if(error instanceof SvgError)throw error;throw new SvgError('document');}
  const normalized=inspect(doc,true);
  if(!normalized)return {svg:value,normalized:false};
  const svg=new XMLSerializer().serializeToString(doc.documentElement);
  const issue=svgError(svg);
  if(issue)throw new SvgError(issue.code,issue.detail);
  return {svg,normalized:true};
}
