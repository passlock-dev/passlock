import { Y as ensure_array_like, X as head, W as stringify, Z as bind_props, Q as pop, O as push } from "../../../chunks/index3.js";
import "../../../chunks/client.js";
import { r as readable } from "../../../chunks/index2.js";
import { a as attr } from "../../../chunks/attributes.js";
import { e as escape_html } from "../../../chunks/escaping.js";
const getInitialMotionPreference = () => {
  return false;
};
readable(getInitialMotionPreference(), (set) => {
});
function _page($$payload, $$props) {
  push();
  let { data, form = void 0 } = $$props;
  let won = data.answers.at(-1) === "xxxxx";
  let i = won ? -1 : data.answers.length;
  let currentGuess = data.guesses[i] || "";
  let submittable = currentGuess.length === 5;
  const { classnames, description } = (() => {
    let classnames2 = {};
    let description2 = {};
    data.answers.forEach((answer, i2) => {
      const guess = data.guesses[i2];
      for (let i3 = 0; i3 < 5; i3 += 1) {
        const letter = guess[i3];
        if (answer[i3] === "x") {
          classnames2[letter] = "exact";
          description2[letter] = "correct";
        } else if (!classnames2[letter]) {
          classnames2[letter] = answer[i3] === "c" ? "close" : "missing";
          description2[letter] = answer[i3] === "c" ? "present" : "absent";
        }
      }
    });
    return { classnames: classnames2, description: description2 };
  })();
  const each_array = ensure_array_like(Array.from(Array(6).keys()));
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Sverdle</title>`;
    $$payload2.out += `<meta name="description" content="A Wordle clone written in SvelteKit" class="svelte-1pg2j5l">`;
  });
  $$payload.out += `<h1 class="visually-hidden svelte-1pg2j5l">Sverdle</h1> <form method="post" action="?/enter" class="svelte-1pg2j5l"><a class="how-to-play svelte-1pg2j5l" href="/sverdle/how-to-play">How to play</a> <div${attr("class", `grid svelte-1pg2j5l ${stringify([
    !won ? "playing" : "",
    form?.badGuess ? "bad-guess" : ""
  ].filter(Boolean).join(" "))}`)}><!--[-->`;
  for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
    let row = each_array[$$index_1];
    const current = row === i;
    const each_array_1 = ensure_array_like(Array.from(Array(5).keys()));
    $$payload.out += `<h2 class="visually-hidden svelte-1pg2j5l">Row ${escape_html(row + 1)}</h2> <div${attr("class", `row svelte-1pg2j5l ${stringify([current ? "current" : ""].filter(Boolean).join(" "))}`)}><!--[-->`;
    for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
      let column = each_array_1[$$index];
      const guess = current ? currentGuess : data.guesses[row];
      const answer = data.answers[row]?.[column];
      const value = guess?.[column] ?? "";
      const selected = current && column === guess.length;
      const exact = answer === "x";
      const close = answer === "c";
      const missing = answer === "_";
      $$payload.out += `<div${attr("class", `letter svelte-1pg2j5l ${stringify([
        exact ? "exact" : "",
        close ? "close" : "",
        missing ? "missing" : "",
        selected ? "selected" : ""
      ].filter(Boolean).join(" "))}`)}>${escape_html(value)} <span class="visually-hidden svelte-1pg2j5l">`;
      if (exact) {
        $$payload.out += "<!--[-->";
        $$payload.out += `(correct)`;
      } else {
        $$payload.out += "<!--[!-->";
        if (close) {
          $$payload.out += "<!--[-->";
          $$payload.out += `(present)`;
        } else {
          $$payload.out += "<!--[!-->";
          if (missing) {
            $$payload.out += "<!--[-->";
            $$payload.out += `(absent)`;
          } else {
            $$payload.out += "<!--[!-->";
            $$payload.out += `empty`;
          }
          $$payload.out += `<!--]-->`;
        }
        $$payload.out += `<!--]-->`;
      }
      $$payload.out += `<!--]--></span> <input name="guess"${attr("disabled", !current, true)} type="hidden"${attr("value", value)} class="svelte-1pg2j5l"></div>`;
    }
    $$payload.out += `<!--]--></div>`;
  }
  $$payload.out += `<!--]--></div> <div class="controls svelte-1pg2j5l">`;
  if (won || data.answers.length >= 6) {
    $$payload.out += "<!--[-->";
    if (!won && data.answer) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="svelte-1pg2j5l">the answer was "${escape_html(data.answer)}"</p>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <button data-key="enter" class="restart selected svelte-1pg2j5l" formaction="?/restart">${escape_html(won ? "you won :)" : `game over :(`)} play again?</button>`;
  } else {
    $$payload.out += "<!--[!-->";
    const each_array_2 = ensure_array_like(["qwertyuiop", "asdfghjkl", "zxcvbnm"]);
    $$payload.out += `<div class="keyboard svelte-1pg2j5l"><button data-key="enter"${attr("disabled", !submittable, true)}${attr("class", `svelte-1pg2j5l ${stringify([submittable ? "selected" : ""].filter(Boolean).join(" "))}`)}>enter</button> <button data-key="backspace" formaction="?/update" name="key" value="backspace" class="svelte-1pg2j5l">back</button> <!--[-->`;
    for (let $$index_3 = 0, $$length = each_array_2.length; $$index_3 < $$length; $$index_3++) {
      let row = each_array_2[$$index_3];
      const each_array_3 = ensure_array_like(row);
      $$payload.out += `<div class="row svelte-1pg2j5l"><!--[-->`;
      for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
        let letter = each_array_3[$$index_2];
        $$payload.out += `<button${attr("data-key", letter)}${attr("class", `${stringify(classnames[letter])} svelte-1pg2j5l`)}${attr("disabled", submittable, true)} formaction="?/update" name="key"${attr("value", letter)}${attr("aria-label", `${stringify(letter)} ${stringify(description[letter] || "")}`)}>${escape_html(letter)}</button>`;
      }
      $$payload.out += `<!--]--></div>`;
    }
    $$payload.out += `<!--]--></div>`;
  }
  $$payload.out += `<!--]--></div></form> `;
  if (won) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div style="position: absolute; left: 50%; top: 30%" class="svelte-1pg2j5l"></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, { form });
  pop();
}
export {
  _page as default
};
