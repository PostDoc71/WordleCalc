import {writeFileSync} from 'fs';

// Run this file with Node if the official words lists get updated. We:
// 1. Find the filename of the new Wordle JS file.
// 2. Fetch that file and extract the word list.
// 3. Figure out where the break between guesses and solutions is.
// 4. Write guesses and solutions to the respective JSON files.

main();

async function main() {
    let url = await getAssetUrl();
    let resp = await fetch(url);
    let text = await resp.text();

    let words = JSON.parse(text.match(/\[[^\]]*?aahed.*?\]/));
    if (!words) return;

    let solnStart;
    for (let i = 1; i < words.length; i++) {
        if (words[i] < words[i - 1]) {
            solnStart = i;
            break;
        }
    }

    let guesses = [...new Set(words.slice(0, solnStart))].map(x => x.toUpperCase()).sort();
    if (guesses) {
        writeFileSync('GuessList.json', JSON.stringify(guesses));
    }

    let solutions = words.slice(solnStart).map(x => x.toUpperCase()).sort();
    if (solutions) {
        writeFileSync('SolutionList.json', JSON.stringify(solutions));
    }
}

async function getAssetUrl() {
    let resp = await fetch('https://www.nytimes.com/games/wordle/index.html');
    let text = await resp.text();
    return text.match('(https://www.nytimes.com/games-assets/v2/wordle[^"]*?js)')[1];
}
