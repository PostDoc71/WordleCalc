'use strict';

// First attempt at a complete Wordle solver

Promise.all([
    // fetch('https://babelthuap.github.io/kokowordle/solutions.json').then(r => r.json()),
    // fetch('https://babelthuap.github.io/kokowordle/guesses.json').then(r => r.json()),
    fetch('https://postdoc71.github.io/WordleCalc/SolutionList.json').then(r => r.json()),
    fetch('https://postdoc71.github.io/WordleCalc/GuessList.json').then(r => r.json()),
]).then (([s, g]) => {
    let SolutionList = [...s];
    let GuessList = [...g];

//======================================
// GLOBAL VARIABLES
//======================================

let GuessEl = document.getElementById('guessbox');
let CalcGuessEl = document.getElementById('guesscalc1');
let FindEl = document.getElementById('wordmatch');
let EraseEl = document.getElementById('eraseline');
let WordsInputEl = document.getElementById('words-input');
let CalculateEl = document.getElementById('statistics');
let CheckWordEl = document.getElementById('check-word');
let ClearEl = document.getElementById('clear-all');
let ClearGuessEl = document.getElementById('clear-guesses');
let SolutionListEl = document.getElementById('solution-list');
let GuessListEl = document.getElementById('guess-list');
let OutputBox = document.getElementById('output-box');

let ColObj = {
    letter: '',
    color: 0,
    element: '',
}
let Cell = [
    [Object.assign({}, ColObj), Object.assign({}, ColObj), Object.assign({}, ColObj), Object.assign({}, ColObj), Object.assign({}, ColObj)],
    [Object.assign({}, ColObj), Object.assign({}, ColObj), Object.assign({}, ColObj), Object.assign({}, ColObj), Object.assign({}, ColObj)],
    [Object.assign({}, ColObj), Object.assign({}, ColObj), Object.assign({}, ColObj), Object.assign({}, ColObj), Object.assign({}, ColObj)],
    [Object.assign({}, ColObj), Object.assign({}, ColObj), Object.assign({}, ColObj), Object.assign({}, ColObj), Object.assign({}, ColObj)],
    [Object.assign({}, ColObj), Object.assign({}, ColObj), Object.assign({}, ColObj), Object.assign({}, ColObj), Object.assign({}, ColObj)],
    [Object.assign({}, ColObj), Object.assign({}, ColObj), Object.assign({}, ColObj), Object.assign({}, ColObj), Object.assign({}, ColObj)]
]
for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 5; j++) {
        Cell[i][j].element =  document.getElementById("r" + i + j);
    }
}

const GREY = '#eee';
const GRAY = 0;
const GREEN = 1;
const YELLOW = 2;
let GuessBox = ['', '', '', '', '', '']
let GreenBoxes = ['', '', '', '', ''];
let YellowBoxes = ['', '', '', '', ''];
let YellowLetters = '';
let GrayLetters = '';
let Row = -1;   // initialize
let LastDataRow = -1;
let SolutionsLeft = [];
let GuessesLeft = [];

//======================================
// MAIN PROGRAM
//======================================

GuessEl.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
        DisplayGuess();
    }
});
CalcGuessEl.addEventListener('click', DisplayGuess);
for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 5; j++) {
        Cell[i][j].element.addEventListener('click', () => ChangeColor(i, j));
    }
}
FindEl.addEventListener('click', FindWords);
EraseEl.addEventListener('click', EraseLine);
CalculateEl.addEventListener('click', Statistics);
CheckWordEl.addEventListener('click', CheckWords);
ClearEl.addEventListener('click', ClearAnswers);
ClearGuessEl.addEventListener('click', ClearGuesses);
SolutionListEl.addEventListener('click', () => ShowList(SolutionList));
GuessListEl.addEventListener('click', () => ShowList(GuessList));

//======================================
// FUNCTIONS
//======================================

function DisplayGuess() {
    let word = String(GuessEl.value.toUpperCase().split(/[^A-Za-z]+/).filter(x => x));
    if (!ValidateGuess(word) || Row > 6) return;
    Row++;
    GuessBox[Row] = word;
    for (let i = 0; i < 5; i++) {                       // transfer letters
        Cell[Row][i].element.innerHTML = word[i];
        Cell[Row][i].letter = word[i];
    }
    for (let i = 0; i < 5; i++) {                       // initialize color
        if ((Row > 0) && (Cell[Row-1][i].color === GREEN)) {
            Cell[Row][i].element.style.backgroundColor='mediumseagreen';
            Cell[Row][i].color = GREEN;
        } else {
            Cell[Row][i].element.style.backgroundColor='gray';
            Cell[Row][i].color = GRAY;
        }
    }
    GuessEl.value = '';
}

function ChangeColor(row, col) {
    if (row != Row) return;
    Cell[row][col].color = ++Cell[row][col].color % 3;
    switch (Cell[row][col].color) {
        case GRAY:
            Cell[row][col].element.style.backgroundColor='gray';
            break;
        case GREEN:
            Cell[row][col].element.style.backgroundColor='mediumseagreen';
            break;
        case YELLOW:
            Cell[row][col].element.style.backgroundColor='rgb(255, 225, 0)';
            break;
    }
    return;
}

function ValidateGuess(Word) {
    let errorMsg = Word;
    if (!(/^[A-Z]{5}$/.test(Word))) {
        errorMsg += ' must be alpha only & exactly 5 letters long';
    } else if ((SearchStringInArray(Word, SolutionList) < 0) && (SearchStringInArray(Word, GuessList) < 0) ) {
        errorMsg += ' is not in the dictionary';
    } else return true;
    alert(errorMsg);
    return false;
}

function FindWords() {
    let output = '';
    CollectData();
    SolutionsLeft = CullList(SolutionList);    // WHY DOES THIS RETURN A STRING INSTEAD OF AN ARRAY?
    for (let i = 0; i < SolutionsLeft.length; i = i + 5) {
        output += SolutionsLeft.slice(i, i + 5) + ' ';
    }
    output += '<===> ';
    GuessesLeft = CullList(GuessList);
    for (let i = 0; i < GuessList.length; i = i + 5) {
        output += GuessesLeft.slice(i, i + 5) + ' ';
    }
    WordsInputEl.value = output;
}

function CollectData() {
    if (Row === -1) return;
    LastDataRow++;
    for (let i = LastDataRow; i <= Row; i++) {
        
        // Green letters
        for (let j = 0; j < 5; j++) {
            if (Cell[i][j].color === GREEN) {
                GreenBoxes[j] =Cell[i][j].letter;
            }
        }

        // Yellow letters and boxes
        for (let j = 0; j < 5; j++) {
            if (Cell[i][j].color === YELLOW) {
                if (YellowLetters.search(Cell[i][j].letter) < 0) {
                    YellowLetters += Cell[i][j].letter;
                }
                if (YellowBoxes[j].search(Cell[i][j].letter) < 0) {
                    YellowBoxes[j] += Cell[i][j].letter;
                }
            }
        }

        // Gray letters
        for (let j = 0; j < 5; j++) {
            if (Cell[i][j].color === GRAY) {
                if (GrayLetters.search(Cell[i][j].letter) < 0) {
                    GrayLetters += Cell[i][j].letter;
                }
            }
        }
    }
    LastDataRow = Row;
}

function CullList(list) {
    let newList = [];
    iLoop:
    for (let i = 0; i < list.length; i++) {

    // Exclude words with gray letters
        for (let j = 0; j < GrayLetters.length; j++) {
            if (list[i].search(GrayLetters[j]) >= 0) {
                continue iLoop;
            }
        }

    // Exclude if green letters not in proper place
       for (let j = 0; j < 5; j++) {
            if ((GreenBoxes[j] != '') && (list[i][j] != GreenBoxes[j])) {
                continue iLoop;
            }
        }

    // If yellow letter present, check for presence and position
        for (let j = 0; j < YellowLetters.length; j++) {
            if (list[i].search(YellowLetters[j]) < 0) {
                continue iLoop;                             // missing a yellow letter
            }
        }
        for (let j = 0; j < 5; j++) {
            for (let k = 0; k < YellowBoxes[j].length; k++) {
                if (YellowBoxes[j][k] === list[i][j]) {
                    continue iLoop;                         // matches a yellow letter position
                }
            }
        }
    newList += list[i];
    }
    return newList;
}

function EraseLine() {
for (let i = 0; i < 5; i++) {
    Cell[Row][i].letter = '';
    Cell[Row][i].color = GRAY;
    Cell[Row][i].element.style.backgroundColor = GREY;
    Cell[Row][i].element.innerHTML = '';
    GreenBoxes[i] = '';
    YellowBoxes[i] = '';
}
YellowLetters = ''
GuessBox[Row] = '';
GrayLetters = '';
ClearAnswers();
LastDataRow = -1;
Row--;
}

function ClearAnswers() {
    WordsInputEl.value = '';
    OutputBox.innerHTML = '';
}

function ClearGuesses() {
    let words = WordsInputEl.value;
    let index = words.indexOf("<===>");
    if (index < 0) {
        alert("'The word list must contain the separator '<===>' between the solution words and guess words.");
        return;
    }
    WordsInputEl.value = words.slice(0, index);
    OutputBox.innerHTML = '';
}


// Returns index of str in strArray or -1 if not found
function SearchStringInArray(str, strArray) {
    for (let j=0; j<strArray.length; j++) {
        if (strArray[j].match(str)) return j;
    }
    return -1;
}

function ShowList (list) {
    OutputBox.innerHTML = '';
    let output = '';
    let h = Math.floor(list.length / 6) + 1;
    let j = h + h;
    let k = j + h;
    let m = k + h;
    let n = m + h;

    for (let i = 0; i < h; i++) {
        output += list[i] + ' ' + list[h+i] +' ' +  list[j+i] +' ' +  list[k+i] +' ' +  list[m+i];
        if (list[n + i]) {
            output += ' ' + list[n+i] + `<br>`;
        } else {
            output += `<br>`;
        }
    }

    OutputBox.innerHTML = output;
}

function CheckWords() {
    let words = WordsInputEl.value.toUpperCase().split(/[^A-Za-z]+/).filter(x => x);
    if (Validate(words)) {
        let output = '';
        let Msg = [];
        OutputBox.innerHTML = '';

        /* Check which list the word is in */
        for (let i = 0; i < words.length; i++) {
            Msg[i] = words[i] + ' - '; 
            if (SearchStringInArray(words[i], SolutionList) >= 0) {
                Msg[i] += `bonafide solution<br>`;
            } else if (SearchStringInArray(words[i], GuessList) >= 0) {
                Msg[i] += `valid guess word<br>`;
            } else {
                Msg[i] += `not in the dictionary<br>`;
            }
        }

        /* Sort and display the list */
        for (let i = 0; i < words.length; i++) {
            if (Msg[i].match(/\bbonafide\b/)) {
                output +=  Msg[i];
            }
        }        
        for (let i = 0; i < words.length; i++) {
            if (Msg[i].match(/\bvalid\b/)) {
                output += Msg[i];
            }           
        }        
        for (let i = 0; i < words.length; i++) {
            if (Msg[i].match(/\bnot\b/)) {
                output += Msg[i];
            }  
        }
        OutputBox.innerHTML = output;
    }
}

function Statistics() {
    let words = WordsInputEl.value.toUpperCase().split(/[^A-Za-z]+/).filter(x => x);
    if (!Validate(words)) return; 
    let wordGroups = test(words);
    OutputBox.innerHTML = '';
    for (let i = 0; (i < wordGroups.length) && (i < 25); i++) {
        let WordGroup = wordGroups[i];
        WordGroup.GroupSizes.sort((a,b) => b - a);
        OutputBox.innerText += WordGroup.Guess + ' ';
        OutputBox.innerHTML += WordGroup.GroupSizes.length;
        if(SearchStringInArray(WordGroup.Guess, SolutionList) > 0) {
            OutputBox.innerHTML += '-> ';
        } else {
            OutputBox.innerHTML += '-- ';
        }
        OutputBox.innerHTML += WordGroup.GroupSizes.join('-');
        OutputBox.innerHTML += '<br>';
    }
}

// Display each group with stats
function test(possibleAnswers) {
    let wordGroups = [];
    for (let i = 0; i < possibleAnswers.length; i++) {  // Collect the patterns
        let guessWord = possibleAnswers[i];
        let patterns = [];
        jLoop:
        for (let j = 0; j < possibleAnswers.length; j++) {
            let matchWord = possibleAnswers[j];
            if (SearchStringInArray(matchWord, GuessList) >= 0) {
                continue jLoop;
            }
            let pattern = MatchPattern(guessWord, matchWord);
            patterns.push(pattern);
        }
        let groups ={};
        for (let j = 0; j < patterns.length; j++) {
            let pattern = patterns[j];
            if (groups[pattern] === undefined) {
                groups[pattern] = 0;
            }
            groups[pattern]++;
        }
        wordGroups.push({ Guess: guessWord, GroupSizes: Object.values(groups) });
    }
    wordGroups.sort ((a,b) => b.GroupSizes.length - a.GroupSizes.length);
    return wordGroups;
}

function MatchPattern(guessStr, matchStr) {
// Change strings to arrays
    let outputArr = ['.', '.', '.', '.', '.']  //Initialize to no match
    let guessArr = [guessStr[0], guessStr[1], guessStr[2], guessStr[3], guessStr[4]];
    let matchArr = [matchStr[0], matchStr[1], matchStr[2], matchStr[3], matchStr[4]];
    let outputStr = '';

    for (let i = 0; i < guessStr.length; i++) {
// Test for green exact matches
        if (guessArr[i] === matchArr[i]) {
            matchArr[i] = '#';
            guessArr[i] = '%';              // assures that this does not get replaced by a yellow
            outputArr[i] = 'X';
        }
        outputStr = outputArr[0] + outputArr[1] + outputArr[2] + outputArr[3] + outputArr[4];
    }
// Test for yellow match in wrong place
    for (let i = 0; i < guessStr.length; i++) {
        if (matchArr.indexOf(guessArr[i]) !== -1) {
            matchArr[matchArr.indexOf(guessArr[i])] = '$';
            outputArr[i] = 'O';
        }
        outputStr = outputArr[0] + outputArr[1] + outputArr[2] + outputArr[3] + outputArr[4];
    }
    outputStr = outputArr[0] + outputArr[1] + outputArr[2] + outputArr[3] + outputArr[4];
    return outputStr;
}

function Validate(words) {
    for (let i=0; i < words.length; i++) {
        if (!(/^[A-Z]{5}$/.test(words[i]))) {
            let errorMsg = words[i] + ' must be alpha only & exactly 5 letters long';
            OutputBox.innerHTML = errorMsg;
            return false;
        }
    }
    return true;
}

}
)

