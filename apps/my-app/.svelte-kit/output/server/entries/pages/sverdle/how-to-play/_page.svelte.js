import { X as head } from "../../../../chunks/index3.js";
function _page($$payload) {
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>How to play Sverdle</title>`;
    $$payload2.out += `<meta name="description" content="How to play Sverdle">`;
  });
  $$payload.out += `<div class="text-column"><h1>How to play Sverdle</h1> <p>Sverdle is a clone of <a href="https://www.nytimes.com/games/wordle/index.html">Wordle</a>, the
		word guessing game. To play, enter a five-letter English word. For example:</p> <div class="example svelte-1x5nq1n"><span class="close svelte-1x5nq1n">r</span> <span class="missing svelte-1x5nq1n">i</span> <span class="close svelte-1x5nq1n">t</span> <span class="missing svelte-1x5nq1n">z</span> <span class="exact svelte-1x5nq1n">y</span></div> <p class="svelte-1x5nq1n">The <span class="exact svelte-1x5nq1n">y</span> is in the right place. <span class="close svelte-1x5nq1n">r</span> and <span class="close svelte-1x5nq1n">t</span> are the right letters, but in the wrong place. The other letters are wrong, and can be discarded.
		Let's make another guess:</p> <div class="example svelte-1x5nq1n"><span class="exact svelte-1x5nq1n">p</span> <span class="exact svelte-1x5nq1n">a</span> <span class="exact svelte-1x5nq1n">r</span> <span class="exact svelte-1x5nq1n">t</span> <span class="exact svelte-1x5nq1n">y</span></div> <p>This time we guessed right! You have <strong>six</strong> guesses to get the word.</p> <p>Unlike the original Wordle, Sverdle runs on the server instead of in the browser, making it
		impossible to cheat. It uses <code>&lt;form></code> and cookies to submit data, meaning you can
		even play with JavaScript disabled!</p></div>`;
}
export {
  _page as default
};
