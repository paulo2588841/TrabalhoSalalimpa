// Integração local exclusivamente com emuladores; nenhuma conta de produção é usada.
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
const projectId = 'demo-sala-limpa';
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080' || !process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Execute com npm run test:live e somente emuladores locais.');
const password = randomUUID(); const checks = []; const errors = [];
const testEnv = await initializeTestEnvironment({ projectId, firestore: {host:'127.0.0.1',port:8080,rules:await readFile('firestore.rules','utf8')} });
await testEnv.clearFirestore();
const accounts = [];
for (const name of ['Paulo','Maria']) {
  const email = `${name.toLowerCase()}-${randomUUID()}@example.test`;
  const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
  const data = await response.json(); if(!response.ok) throw new Error(JSON.stringify(data));
  accounts.push({email,uid:data.localId,name});
  await testEnv.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(),'admins',data.localId),{name,active:true}));
}
const server = spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5174','--strictPort'],{windowsHide:true,stdio:'pipe',env:{...process.env,VITE_FIREBASE_API_KEY:'fake-api-key',VITE_FIREBASE_AUTH_DOMAIN:`${projectId}.firebaseapp.com`,VITE_FIREBASE_PROJECT_ID:projectId,VITE_FIREBASE_APP_ID:'1:123:web:emulator',VITE_FIREBASE_STORAGE_BUCKET:`${projectId}.appspot.com`,VITE_FIREBASE_MESSAGING_SENDER_ID:'123',VITE_USE_FIREBASE_EMULATORS:'true',VITE_BASE_PATH:'/'}});
let serverOutput=''; server.stdout.on('data',d=>serverOutput+=d); server.stderr.on('data',d=>serverOutput+=d);
const url='http://127.0.0.1:5174/'; let ready=false;
for(let i=0;i<90;i++){try{if((await fetch(url)).ok){ready=true;break;}}catch{} await new Promise(r=>setTimeout(r,500));}
if(!ready){server.kill();throw new Error(serverOutput);}
const browser=await chromium.launch({headless:true,...(process.env.QA_BROWSER_PATH?{executablePath:process.env.QA_BROWSER_PATH}:{})});
await mkdir('qa',{recursive:true});
const contextP=await browser.newContext({viewport:{width:1280,height:900}}); const contextM=await browser.newContext({viewport:{width:390,height:844}}); const publicContext=await browser.newContext();
const paulo=await contextP.newPage(); const maria=await contextM.newPage(); const visitor=await publicContext.newPage();
for(const page of [paulo,maria,visitor]) page.on('pageerror',e=>errors.push(e.message));
try {
  async function login(page,account){await page.goto(`${url}#/admin`);await page.getByLabel('E-mail',{exact:true}).fill(account.email);await page.getByLabel('Senha',{exact:true}).fill(password);await page.getByRole('button',{name:'Entrar no painel'}).click();await page.getByRole('heading',{name:new RegExp(`^Olá, ${account.name}`)}).waitFor();}
  await login(paulo,accounts[0]); await paulo.getByRole('button',{name:'Publicar conteúdo inicial'}).click(); await paulo.getByText('Alterações publicadas com sucesso.').waitFor();
  await login(maria,accounts[1]); await visitor.goto(url); await visitor.getByText('Sincronizado',{exact:true}).first().waitFor();
  checks.push('Login individual, permissão por UID, publicação inicial e visitante sem login');
  const p0=paulo.locator('.live-editor').nth(0); const m0=maria.locator('.live-editor').nth(0); const m1=maria.locator('.live-editor').nth(1);
  await p0.getByRole('button',{name:'Editar ao vivo'}).click(); await p0.getByLabel('Texto da fala').waitFor();
  await m0.getByRole('button',{name:/Paulo está editando/}).waitFor(); assert.equal(await m0.getByRole('button',{name:/Paulo está editando/}).isDisabled(),true);
  await visitor.getByText('Paulo está editando…',{exact:true}).waitFor();
  await p0.getByLabel('Texto da fala').fill('Bom dia! Texto colaborativo escrito por Paulo.'); await visitor.getByText('“Bom dia! Texto colaborativo escrito por Paulo.”',{exact:true}).waitFor();
  checks.push('Debounce e onSnapshot reais até o visitante; destaque e bloqueio por fala');
  await m1.getByRole('button',{name:'Editar ao vivo'}).click(); await m1.getByLabel('Texto da fala').fill('Maria também edita, em uma fala diferente.');
  await visitor.getByText('“Maria também edita, em uma fala diferente.”',{exact:true}).waitFor();
  assert.equal(await visitor.getByText('“Bom dia! Texto colaborativo escrito por Paulo.”',{exact:true}).count(),1);
  checks.push('Paulo e Maria em falas diferentes sem perder alterações');
  await contextP.setOffline(true); await p0.getByLabel('Texto da fala').fill('Rascunho preservado durante a perda de conexão.');
  await p0.getByText('Alterações pendentes',{exact:true}).waitFor();
  assert.equal(await visitor.getByText('“Rascunho preservado durante a perda de conexão.”',{exact:true}).count(),0);
  await contextP.setOffline(false);
  const retry=p0.getByRole('button',{name:'Tentar sincronizar'}); if(await retry.count()) await retry.click();
  await visitor.getByText('“Rascunho preservado durante a perda de conexão.”',{exact:true}).waitFor();
  checks.push('Perda de conexão, texto pendente e reconexão sem atualização falsa');
  await p0.getByRole('button',{name:'Concluir edição'}).click(); await m1.getByRole('button',{name:'Concluir edição'}).click();
  await paulo.getByRole('button',{name:'Histórico de versões'}).click();
  const first=paulo.locator('.history-list article').filter({hasText:/Versão 1 ·/}); await first.waitFor();
  paulo.once('dialog',d=>d.accept()); await first.getByRole('button',{name:'Restaurar',exact:true}).click();
  await paulo.getByText('Versão restaurada e registrada no histórico.').waitFor();
  await visitor.getByText(/“Bom dia! Nosso grupo vai apresentar/).waitFor();
  checks.push('Histórico real e restauração atômica até o visitante');
  await maria.screenshot({path:'qa/live-admin-mobile.png',fullPage:true}); await visitor.locator('#apresentacao').screenshot({path:'qa/live-public.png'});
  assert.equal(errors.length,0,'Erros JavaScript na integração');
  await writeFile('qa/live-report.json',JSON.stringify({checks,errors,backend:'Firebase Auth e Firestore Emulator',projectId},null,2));
  console.log(JSON.stringify({checks,errors},null,2));
} finally {await browser.close();server.kill();await testEnv.cleanup();}
