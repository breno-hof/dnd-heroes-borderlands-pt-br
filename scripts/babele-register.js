/**
 * dnd-heroes-borderlands-pt-br | babele-register.js
 * -----------------------------------------------------------------------
 * Responsável por registrar este módulo junto ao Babele para que os
 * compêndios do módulo de origem ("dnd-heroes-borderlands") sejam
 * traduzidos em tempo de execução, sem alterar os arquivos originais.
 *
 * A partir do Babele 2.9.x, o hook recomendado é "babele.init", que
 * entrega a própria instância já pronta para registro — substituindo o
 * padrão antigo (Hooks.once('init') + Babele.get()), hoje marcado como
 * deprecated. Mantemos os dois caminhos por segurança/compatibilidade,
 * com uma trava para nunca registrar duas vezes.
 * -----------------------------------------------------------------------
 */

const MODULE_ID = "dnd-heroes-borderlands-pt-br";
const SOURCE_LANG = "pt-BR";
const TRANSLATION_DIR = "packs"; // relativo à raiz deste módulo

let _registered = false;

/**
 * Executa o registro de fato junto à instância do Babele.
 * @param {Babele} babele - instância ativa do Babele
 */
function registerBabele(babele) {
  if (_registered) return;

  babele.register({
    module: MODULE_ID,
    lang: SOURCE_LANG,
    dir: TRANSLATION_DIR,
    // "mapping" pode ser omitido aqui: cada arquivo dentro de /packs
    // (ex.: dnd-heroes-borderlands.actors.json) já carrega seu próprio
    // "mapping" embutido. Isso mantém o registro genérico e escalável
    // caso novos packs (items, journals, etc.) sejam adicionados depois.
  });

  _registered = true;
  console.log(`${MODULE_ID} | Babele registrado (lang: ${SOURCE_LANG}, dir: ${TRANSLATION_DIR}).`);
}

// Caminho moderno (Babele >= 2.9)
Hooks.once("babele.init", (babele) => registerBabele(babele));

// Fallback para instalações com Babele < 2.9 que ainda não emitem "babele.init"
Hooks.once("init", () => {
  // Pequeno delay não é necessário aqui: no hook 'init' o Babele (se ativo)
  // já expõe a classe global. Se a instância moderna já tiver registrado
  // via "babele.init" antes deste ponto, a trava _registered evita duplicidade.
  if (typeof Babele === "undefined") {
    console.warn(`${MODULE_ID} | Módulo "babele" não encontrado ou não ativo. A tradução não será aplicada.`);
    return;
  }
  registerBabele(Babele.get());
});
