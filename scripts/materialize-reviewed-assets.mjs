import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const packed=readFileSync(resolve(root,'scripts/reviewed-catalogue.tar.gz'));
if(createHash('sha256').update(packed).digest('hex')!=='d1bbbe98678bcd0414d9f2e4ddb3acb218b7199be3fb3d599a8804e7e45678bd')throw new Error('El archivo de figuras no corresponde al cotejo registrado.');
const tar=gunzipSync(packed,{maxOutputLength:120_000_000});let count=0;
for(let at=0;at+512<=tar.length;){
 const header=tar.subarray(at,at+512);if(header.every(b=>b===0))break;
 const name=header.subarray(0,100).toString('utf8').split('\0')[0];
 const size=parseInt(header.subarray(124,136).toString('ascii').replace(/\0/g,'').trim(),8)||0;
 const type=header[156];at+=512;if(!Number.isSafeInteger(size)||size<0||at+size>tar.length)throw new Error('Archivo de figuras incompleto.');
 if(type===0||type===48){
  if(!/^(verified-figures\/[a-z0-9_]+\.(png|svg)|source-pages\/(151|152|153)\.webp)$/.test(name))throw new Error('Ruta de figura no autorizada.');
  const output=resolve(root,'public',name);mkdirSync(dirname(output),{recursive:true});writeFileSync(output,tar.subarray(at,at+size));count++;
 }
 at+=Math.ceil(size/512)*512;
}
if(count!==527)throw new Error('Faltan figuras del catálogo cotejado.');
// Keep the public copy aligned with the source used by the application.
writeFileSync(resolve(root,'public/catalogue.json'),readFileSync(resolve(root,'src/figures.json')));
console.log('Figuras materializadas: 262 PNG, 262 SVG y tres páginas documentales.');
