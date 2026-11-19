import {catalog} from './catalogo.js';

const clean=value=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ø/g,'o');
const format=c=>c.price.toFixed(2).replace('.',',')+' €';

export function demo(message,state) {
  const q=clean(message);
  const {filters,last}=state;
  const named=catalog.filter(c=>q.includes(clean(c.name).split(/ cafe| coffee| specialty| madrid| \(/)[0]));
  const focus=named.length?named:last.map(id=>catalog[id]);
  const follow=/\b(wi[- ]?fi|internet|resenas?|reviews?|opiniones?|foto|fotos|imagenes|direccion|llegar|horario|abre|cierra|precio|cuanto|enchufes)\b/;
  const question=/^(?:¿)?(?:y\s+(?:cual|como|a que hora|donde)|cual|donde|como|cuanto|a que hora|tiene|tienen|hay enchufe|me mandas|me pasas|muestrame|pasame)/;
  const reviews=/resen|review|opinion|valoracion/.test(q);
  const photo=/\b(fotos?|imagenes?)\b/.test(q);
  const result=(text,items=[])=>({text,ids:items.map(c=>c.id)});
  if(focus.length && (named.length || photo || reviews || (follow.test(q)&&question.test(q)))) {
    const info=focus.map(c=>{
      if(reviews)return c.name+': '+(c.reviewNote || 'Te dejo el enlace a su ficha de Google Maps para que veas las opiniones.');
      if(/horario|abre|cierra/.test(q)) return c.name+': '+c.hours+'.';
      if(/direccion|llegar/.test(q)) return c.name+' está en '+c.address+'.';
      if(/precio|cuanto/.test(q)) return c.name+' figura desde '+format(c)+' como referencia. '+(clean(c.notes).includes('sin confirmar')?'El precio está pendiente de confirmar.':'');
      if(/wi[- ]?fi|internet/.test(q)) {
        const speed=c.notes.match(/Wi-Fi (?:rápido|de alta velocidad|gratuito ilimitado)/i)?.[0];
        return c.name+': '+(speed || 'la ficha indica Wi-Fi, sin velocidad confirmada')+'.';
      }
      if(/enchufe/.test(q)) return c.name+': '+(c.outlets==='sin'?'sin enchufes según la ficha':c.outlets+' enchufes según la ficha')+'.';
      return photo ? 'Te paso la imagen del catálogo de '+c.name+'.' : c.name+': '+c.notes;
    }).join(' ');
    return result(info,focus);
  }
  if(/\b(gracias|perfecto|genial)\b/.test(q)&&q.split(' ').length<4) return result('¡De nada! ☕');
  if(/\b(reinicia|otro plan|empecemos de nuevo)\b/.test(q)) Object.keys(filters).forEach(key=>delete filters[key]);
  const preferences=[
    ['laptop',/trabaj|estudi|portatil|ordenador|laptop|teletrabaj/],
    ['quiet',/tranquil|silencio|poco ruido|sin ruido|leer|concentra/],
    ['outlet',/enchufe|cargar|tomacorriente/],
    ['terrace',/terraza|aire libre/],
    ['pets',/perr[oa]|mascota|pet.friendly/],
    ['wifi',/wi[- ]?fi|internet/],
    ['food',/brunch|desayun|comer|meriend/],
    ['vegan',/vegan|vegetal/],
    ['matcha',/matcha/],
    ['tasting',/\bcata\b|filtrad[oa]|v60/],
    ['cheap',/barat|economico|asequible/],
    ['saturday',/sabado|fin de semana|finde/],
    ['sunday',/domingo|fin de semana|finde/],
    ['monday',/lunes/],
  ];
  let understood=false;
  for(const [key,pattern] of preferences){
    if(!pattern.test(q)) continue;
    filters[key]=!new RegExp('(?:sin|no necesito|no hace falta) (?:much[oa]s? )?(?:'+pattern.source+')').test(q);
    if(key==='quiet'&&/sin ruido/.test(q)) filters.quiet=true;
    understood=true;
  }
  const budget=q.match(/(?:menos de|hasta|maximo(?: de)?)\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros)/);
  if(budget){filters.budget=Number(budget[1].replace(',','.'));understood=true;}
  if(reviews) return result('¿De qué cafetería quieres ver las reseñas?');
  if(photo) return result('¿De qué cafetería quieres ver una foto?');
  const another=/otra opcion|algo mas|otra cafeteria|alguna otra/.test(q);
  if(!understood&&!another) return result('¿Qué te apetece hacer en Malasaña? Cuéntame si buscas trabajar, tomar brunch, ir con tu perro o algo distinto.');
  const ranked=catalog.filter(c=>{
    const n=clean(c.notes);
    if(another&&last.includes(c.id)) return false;
    if(filters.laptop&&(c.laptop==='no'||((filters.saturday||filters.sunday)&&/solo entre semana|admite portatil entre semana|desayuno del fin de semana/.test(n))||(filters.saturday&&n.includes('restriccion de portatil los sabados'))))return false;
    return !(filters.outlet&&c.outlets==='sin'||filters.terrace&&c.terrace!=='sí'||filters.quiet&&c.noise!=='tranquilo'||
      filters.food&&!/brunch|pancake|bolleria|desayun/.test(n)||filters.vegan&&!/vegan|100 % vegetal/.test(n)||
      filters.matcha&&!/matcha/.test(n)||filters.tasting&&!/catas?|filtra|v60/.test(n)||
      filters.budget&&c.price>filters.budget||filters.monday&&n.includes('cierra los lunes'));
  }).map(c=>({c,score:(filters.laptop?(c.laptop==='sí'?5:0)+(c.noise==='tranquilo'?3:0)+(c.outlets==='sin'?0:3):0)+
    (filters.wifi&&/rápido|alta velocidad|ilimitado/.test(c.notes)?4:0)+(filters.outlet&&/muchos|numerosos/.test(c.outlets)?3:0)+
    (filters.vegan&&/100 % vegetal/.test(c.notes)?4:0)-(filters.cheap?c.price:0)}))
    .sort((a,b)=>b.score-a.score).slice(0,2).map(row=>row.c);
  if(!ranked.length) return result('No encuentro una opción confirmada en las fichas que reúna todo lo que buscas. ¿Qué requisito podríamos flexibilizar?');
  const limits=/\b\d+\s*horas?\b|toda la manana|toda la tarde/.test(q)?' La ficha no confirma cuánto tiempo se puede permanecer.':'';
  return result(ranked.map(c=>c.name+': '+c.notes).join(' ')+limits,ranked);
}
