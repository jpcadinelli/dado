"""Testes e2e Chromium sem rede: carrega HTML/CSS/JS locais via set_content.
Em ambiente normal, executar `python -m http.server` e verificar diretamente as URLs.
"""
import asyncio
import re
from pathlib import Path
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
CSS = re.sub(r'^@import[^\n]*\n', '', (ROOT/'assets/styles.css').read_text(), flags=re.M)
DICE = (ROOT/'assets/dice.js').read_text()
CONFIG = (ROOT/'assets/config.js').read_text()
APP = (ROOT/'assets/app.js').read_text()
DICE = re.sub(r'\bexport\s+', '', DICE)
CONFIG = re.sub(r'^import\s+.+?;\s*$', '', CONFIG, flags=re.M)
CONFIG = re.sub(r'\bexport\s+', '', CONFIG)
APP = re.sub(r'^import\s+.+?;\s*$', '', APP, flags=re.M)
BUNDLE = DICE + '\n' + CONFIG + '\n' + APP
ROUTES=['/','/dados/tradicional/','/dados/letras/','/jogos/imagem-e-acao/','/dados/personalizado/']

async def show(page, route):
    source = ROOT/route.strip('/')/'index.html' if route != '/' else ROOT/'index.html'
    html = source.read_text()
    html = re.sub(r'<link rel="stylesheet"[^>]+>', lambda m: '<style>'+CSS+'</style>',html)
    html = re.sub(r'<script type="module" src="[^"]+"></script>', lambda m: '<script type="module">'+BUNDLE+'</script>',html)
    await page.set_content(html,wait_until='domcontentloaded',timeout=10000)
    await page.wait_for_timeout(130)

def assert_links():
    for route in ROUTES:
        source = ROOT/route.strip('/')/'index.html' if route!='/' else ROOT/'index.html'
        soup = BeautifulSoup(source.read_text(), 'html.parser')
        for link in soup.select('a[href],script[src],link[href]'):
            attr = link.get('href') or link.get('src')
            if attr.startswith(('http','mailto:','#')): continue
            resolved=urlparse(urljoin('https://example.com'+route,attr)).path
            local = ROOT / resolved.lstrip('/')
            if resolved.endswith('/'):local=local/'index.html'
            assert local.is_file(),(route,attr,local)
    print('PASS links e recursos locais')

async def main():
    assert_links()
    failures=[]
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        for width,height in [(320,720),(360,780),(390,844),(768,1024),(1440,900)]:
            page=await browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce')
            page.on('pageerror',lambda e: failures.append(str(e)))
            for route in ROUTES:
                await show(page,route)
                assert await page.locator('h1').count()==1,(route,width,'h1')
                overflow=await page.evaluate('document.documentElement.scrollWidth > window.innerWidth')
                assert not overflow,(route,width,'horizontal scroll')
            print('PASS viewport',width)
            await page.close()
        page=await browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
        page.on('pageerror',lambda e: failures.append(str(e)))
        # localStorage mock persistente enquanto alterna o HTML no mesmo documento about:blank
        await page.evaluate('''() => {
            const data = new Map();
            Object.defineProperty(window,'localStorage',{configurable:true,value:{
                getItem(key){return data.has(key)?data.get(key):null},
                setItem(key,v){data.set(key,String(v))},
                removeItem(key){data.delete(key)}
            }});
        }''')
        await show(page,'/jogos/imagem-e-acao/')
        assert await page.locator('#numberResult').inner_text()=='—'
        assert await page.locator('#letterResult').inner_text()=='—'
        await page.locator('#rollNumber').click()
        await page.wait_for_function('document.querySelector("#numberResult").textContent.trim() !== "—"')
        num=await page.locator('#numberResult').inner_text()
        assert num in '123456',num
        assert await page.locator('#letterResult').inner_text()=='—'
        await page.locator('#rollLetter').click()
        await page.wait_for_function('document.querySelector("#letterResult").textContent.trim() !== "—"')
        let=await page.locator('#letterResult').inner_text()
        assert let in 'POADLT',let
        assert await page.locator('#numberResult').inner_text()==num
        assert await page.locator('#combinedResult').inner_text()==num+' + '+let
        await page.locator('#rollBoth').click()
        await page.wait_for_function('!document.querySelector("#rollBoth").disabled')
        assert await page.locator('#combinedHistory .history-chip').count()==1
        assert await page.locator('#numberHistory .history-chip').count()==2
        assert await page.locator('#letterHistory .history-chip').count()==2
        await page.locator('#letterPreset').select_option('custom')
        for i,v in enumerate('ABCDEF'):
            await page.locator(f'input[name="letter{i}"]').fill(v)
            await page.locator(f'input[name="title{i}"]').fill(f'Categoria {v}')
        await page.locator('#categoryForm button[type=submit]').click()
        assert await page.locator('#categoryFeedback').inner_text()=='Categorias personalizadas salvas neste navegador.'
        await show(page,'/jogos/imagem-e-acao/')
        assert await page.locator('#letterPreset').input_value()=='custom'
        assert await page.locator('input[name="letter0"]').input_value()=='A'
        await page.locator('#rollLetter').click()
        await page.wait_for_function('document.querySelector("#letterResult").textContent.trim() !== "—"')
        assert await page.locator('#letterResult').inner_text() in 'ABCDEF'
        print('PASS Imagem & Ação individual, conjunto, edição e persistência')
        await show(page,'/dados/personalizado/')
        assert await page.locator('.builder-card').count()==2
        await page.locator('#builderType').select_option('D20')
        await page.locator('#addBuilder').click()
        assert await page.locator('.builder-card').count()==3
        await page.locator('#rollAll').click()
        await page.wait_for_function('!document.querySelector("#rollAll").disabled')
        assert (await page.locator('#builderTotal').inner_text()).startswith('Soma:')
        await page.locator('#applyCustomFaces').click()
        assert await page.locator('.builder-card').count()==4
        await show(page,'/dados/personalizado/')
        assert await page.locator('.builder-card').count()==4
        print('PASS construtor, soma, dados personalizados e localStorage')
        await show(page,'/dados/tradicional/')
        await page.locator('#rollNumber').click()
        await page.wait_for_function('document.querySelector("#numberResult").textContent.trim() !== "—"')
        print('PASS tradicional')
        await page.screenshot(path=str(ROOT/'tests/tradicional-mobile.png'),full_page=True)
        await show(page,'/jogos/imagem-e-acao/')
        await page.screenshot(path=str(ROOT/'tests/imagem-e-acao-mobile.png'),full_page=True)
        await page.set_viewport_size({'width':1440,'height':900})
        await page.screenshot(path=str(ROOT/'tests/imagem-e-acao-desktop.png'),full_page=True)
        assert not failures, failures
        print('PASS sem exceções JavaScript')
        await browser.close()

if __name__=='__main__': asyncio.run(main())
