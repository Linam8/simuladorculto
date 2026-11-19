import {catalog} from './catalogo.js';
import {demo} from './demo.js';

const log=document.querySelector('#log');
const form=document.querySelector('form');
const input=form.querySelector('input');
const send=form.querySelector('button');
const mode=document.querySelector('#mode');
let messages=[],state={filters:{},last:[]},session=0;

function append(tag,text,parent=log){
  const node=document.createElement(tag);
  if(text)node.textContent=text;
  parent.append(node);
  return node;
}
function say(text,user=false){
  const node=append('p',text);
  node.className=user?'bubble user':'bubble';
  log.scrollTop=log.scrollHeight;
  return node;
}
function externalLink(parent,label,url){
  const link=append('a',label,parent);
  link.href=url;
  link.target='_blank';
  link.rel='noopener noreferrer';
  return link;
}

function card(c){
  const article=append('article');
  article.className='card';
  const details=append('div',null,article);
  append('h2',c.name,details);
  append('p','Dirección · '+c.address+', Madrid',details);
  const photo=externalLink(article,c.illustrativeImage?'Abrir imagen ilustrativa':'Abrir foto en grande',c.image);
  photo.className='card-photo';
  const image=document.createElement('img');
  image.alt=c.illustrativeImage?'Imagen ilustrativa del catálogo':'Foto del catálogo de '+c.name;
  image.src=c.image;
  photo.prepend(image);
  image.addEventListener('error',()=>image.remove());
  const reviews=append('div',null,article);
  append('h3','Reseñas',reviews);
  if(c.reviewNote)append('p',c.reviewNote,reviews);
  else append('p','Consulta las opiniones de quienes han visitado este local.',reviews);
  const links=append('nav',null,reviews);
  links.setAttribute('aria-label','Enlaces de '+c.name);
  externalLink(links,'Ver reseñas en Google Maps ↗',c.reviews);
  externalLink(links,'Cómo llegar ↗',c.map);
}
async function submit(text){
  if(!text||send.disabled)return;
  const turn=session;
  say(text,true);
  input.value='';
  send.disabled=true;
  messages.push({role:'user',content:text});
  const pending=say('Culto está escribiendo…');
  const fallback=demo(text,state);
  let reply=fallback;
  try {
    const response=await fetch('/.netlify/functions/chat',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages:messages.slice(-12)}),signal:AbortSignal.timeout(15000)
    });
    if(!response.ok)throw Error();
    reply=await response.json();
    if(turn===session)mode.textContent='Agente de IA';
  } catch {
    if(turn===session)mode.textContent='Modo demo';
  }
  if(turn!==session)return;
  pending.remove();
  say(reply.text);
  reply.ids.forEach(id=>{if(catalog[id])card(catalog[id]);});
  if(reply.ids.length)state.last=reply.ids;
  const names=reply.ids.map(id=>catalog[id]?.name).filter(Boolean);
  messages.push({role:'assistant',content:reply.text+(names.length?' Cafeterías mostradas: '+names.join(', '):'')});
  log.scrollTop=log.scrollHeight;
  send.disabled=false;
}
form.addEventListener('submit',event=>{event.preventDefault();submit(input.value.trim());});
document.querySelectorAll('.chips button').forEach(button=>button.addEventListener('click',()=>submit(button.textContent)));
function reset(){
  session++;
  messages=[];
  state={filters:{},last:[]};
  log.replaceChildren();
  input.value='';
  send.disabled=false;
  say('¡Hola! Soy Culto ☕ ¿Qué tipo de cafetería estás buscando hoy?');
}
document.querySelector('#reset').addEventListener('click',reset);
reset();
