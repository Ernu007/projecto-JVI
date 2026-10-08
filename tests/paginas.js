/* As cinco páginas do site (Fase 10). Cada uma é um ficheiro HTML estático
   na raiz. Os testes que antes liam `index.html` para verificar "o site"
   leem agora a página onde a coisa vive, ou `SITE`, que é a concatenação
   das cinco (para as regras que valem em todas: números, ícones, links). */
import fs from 'node:fs';

export const NOMES = ['index.html', 'servicos.html', 'sobre.html', 'orcamento.html', 'contactos.html'];
export const lerPagina = (nome) => fs.readFileSync(nome, 'utf8');
export const PAGINAS = Object.fromEntries(NOMES.map((n) => [n, lerPagina(n)]));
export const SITE = NOMES.map((n) => PAGINAS[n]).join('\n');
