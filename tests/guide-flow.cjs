const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{try{const f=path.join(process.cwd(),'dist',req.url==='/'?'index.html':req.url);res.setHeader('Content-Type',mime[path.extname(f)]||'application/json');res.end(fs.readFileSync(f));}catch{res.statusCode=404;res.end();}});
(async()=>{await new Promise(r=>server.listen(4196,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});let requests=[], enabled=true;
 await page.route('**/api/guide',async route=>{
  if(route.request().method()==='GET')return route.fulfill({json:{enabled}});
  const data=route.request().postDataJSON();requests.push(data);
  await route.fulfill({json:{status:'documented',answer:'Consulta la referencia de tu instrumento.',nextAction:'Confirma el modelo del péndulo.',missing:'',citations:[{id:'manual:19',title:'Manual oficial',pages:[19],url:''}]}});
 });
 await page.goto('http://127.0.0.1:4196');await page.locator('header nav').getByRole('button',{name:'Espacios',exact:true}).click();
 const guide=page.getByRole('region',{name:'Guía de la etapa actual'});await guide.getByRole('heading',{name:'Define tu lugar',exact:true}).waitFor();
 await guide.locator('.guide-chat > summary').click();await guide.getByLabel('Código de acceso a la guía').fill('synthetic-test-access');await guide.getByLabel('Tu pregunta sobre este paso').fill('¿Cómo empiezo?');await guide.getByRole('button',{name:'Consultar AI',exact:true}).click();await guide.getByText('Confirma el modelo del péndulo.',{exact:true}).waitFor();
 assert.deepEqual(Object.keys(requests[0]).sort(),['instrument','question','route','step']);assert.equal(requests[0].route,'spaces');
 await page.getByRole('button',{name:'Continuar al instrumento',exact:true}).click();await guide.getByText('Confirma el modelo del péndulo.',{exact:true}).waitFor({state:'hidden'});assert.equal(await guide.getByText('Confirma el modelo del péndulo.',{exact:true}).count(),0);
 await page.getByLabel('Instrumento del protocolo',{exact:true}).selectOption('Vertical BioGeometry');
 await guide.getByText(/Por qué · consultar las fuentes/).click();await guide.getByRole('heading',{name:'¿Cómo preparo el péndulo vertical que describe el manual?',exact:true}).waitFor();
 assert.equal(await guide.getByRole('heading',{name:'¿El horizontal se prepara igual?',exact:true}).count(),0);
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
 await page.setViewportSize({width:1440,height:1000});await page.locator('header nav').getByRole('button',{name:'Estudio',exact:true}).click();await page.getByRole('button',{name:/Crear desde cero/}).click();await guide.getByRole('heading',{name:'Elige tus referencias',exact:true}).waitFor();
 await page.getByRole('button',{name:'Siguiente paso de ayuda',exact:true}).click();await guide.getByRole('heading',{name:'Personaliza la composición',exact:true}).waitFor();await page.setViewportSize({width:390,height:844});
 await guide.getByText(/Por qué · consultar las fuentes/).click();assert(await guide.getByRole('heading',{name:'¿Dónde pongo mi foto?',exact:true}).isVisible());
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
 enabled=false;const fallback=await browser.newPage();await fallback.route('**/api/guide',r=>r.fulfill({json:{enabled:false}}));await fallback.goto('http://127.0.0.1:4196');await fallback.locator('header nav').getByRole('button',{name:'Espacios',exact:true}).click();await fallback.getByRole('region',{name:'Guía de la etapa actual'}).locator('.guide-chat > summary').click();await fallback.getByText('La conversación AI requiere activar el servicio y su acceso privado.',{exact:false}).waitFor();
 assert.equal(await fallback.getByRole('button',{name:'Consultar AI',exact:true}).count(),0);
 console.log('PASS: contextual guide, instrument-specific references, AI request privacy, stale answer reset, emitter steps, mobile width and unavailable AI fallback');
}finally{await browser.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
