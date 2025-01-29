'use strict';

// First attempt at a complete Wordle solver

Promise.all([

    // fetch('https://postdoc71.github.io/Wordle/SolutionList.json').then(r => r.json()),  // Development version
    // fetch('https://postdoc71.github.io/Wordle/GuessList.json').then(r => r.json()),

    fetch('SolutionList.json').then(r => r.json()),  // Production version
    fetch('GuessList.json').then(r => r.json()),
    
]).then (([SolutionList, GuessList]) => {

//======================================
// GLOBAL VARIABLES
//======================================

const El = {
    Guess: document.getElementById('guessbox'),
    CalcGuess: document.getElementById('guess-to-table'),
    GuessTable: document.getElementById('guess-table'),
    FindWords: document.getElementById('find-matches'),
    Erase: document.getElementById('eraseline'),
    WordsInput: document.getElementById('words-input'),
    Calculate: document.getElementById('statistics'),
    CheckWord: document.getElementById('check-word'),
    Clear: document.getElementById('clear-all'),
    ClearGuess: document.getElementById('clear-guesses'),
    SolutionList: document.getElementById('solution-list'),
    GuessList: document.getElementById('guess-list'),
    OutputBox: document.getElementById('output-box'),
    };

// Build the Guess Table and store references to each of the cells in the Cell array.
let Cell = [];
for (let y = 0; y < 6; y++) {
    let RowObj = [];
    let RowEl = document.createElement('tr');
    for (let x = 0; x < 5; x++) {
        let CellEl = document.createElement('td');
        RowObj.push({letter: '', color: 0, element: CellEl});
        RowEl.appendChild(CellEl);
    }
    Cell.push(RowObj);
    El.GuessTable.appendChild(RowEl);
}

const Color = {
    Gray: 0,
    Green: 1,
    Yellow: 2,
};
let GuessBox = ['', '', '', '', '', '']
let GreenBoxes = ['', '', '', '', ''];
let YellowBoxes = ['', '', '', '', ''];
let YellowLetters = '';
let GrayLetters = '';
let Row = -1;                       // current row
let LastDataRow = -1;               // summary data collected through this row
let DataCollected = [false, false, false, false, false, false];     // not currently in use
let Solutions = ['', '', '', '', '', ''];
let Guesses = ['', '', '', '', '', ''];

//======================================
// MAIN PROGRAM
//======================================
El.Guess.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
        DisplayGuess(El.Guess.value);
    }
});
El.CalcGuess.addEventListener('click', () => DisplayGuess(El.Guess.value));
for (let i = 0; i < 6; i++) {       // change grid element colors
    for (let j = 0; j < 5; j++) {
        Cell[i][j].element.addEventListener('click', () => ChangeColor(i, j));
    }
}
El.FindWords.addEventListener('click', FindWords);
El.Erase.addEventListener('click', EraseLine);
El.Calculate.addEventListener('click', Statistics);
El.CheckWord.addEventListener('click', CheckWords);
El.Clear.addEventListener('click', ClearAnswers);
El.ClearGuess.addEventListener('click', ClearGuesses);
El.SolutionList.addEventListener('click', () => ShowList(SolutionList));
El.GuessList.addEventListener('click', () => ShowList(GuessList));
El.WordsInput.oninput = function() {
    El.WordsInput.value = El.WordsInput.value.toUpperCase();
    return;
};

//======================================
// FUNCTIONS
//======================================

function DisplayGuess(guessword) {
    if (Row > LastDataRow) FindWords();
    let word = "";
    word += guessword.toUpperCase().split(/[^A-Za-z]+/).filter(x => x);
    if (!ValidateGuess(word) || Row > 6) return;
    Row++;
    GuessBox[Row] = word;
    for (let i = 0; i < 5; i++) {
        Cell[Row][i].element.innerHTML = word[i];
        Cell[Row][i].letter = word[i];
        Cell[Row][i].element.style.backgroundColor='gray';
        Cell[Row][i].color = Color.Gray;
    }
    El.Guess.value = '';
}

function ChangeColor(row, col) {
    if (row != Row) return;
    if (DataCollected[row]) {
        alert('To change colors, press CLEAR LAST LINE and retype the word.');
        return;
    }
    // if (DataCollected[row]) {       // if data already collected, erase and start the line over
    //     let word = Guesses[row];
    //     let colors = ['', '', '', '', ''];
    //     for (let i = 0; i < 5; i++) colors[i] = Cell[Row][i].color;
    //     EraseLine();
    //     DataCollected[row] = false;    
    //     DisplayGuess(word);
    //     for (let i = 0; i < 5; i++) {
    //         Cell[row][i].color = colors[i];
    //         switch(colors[i]) {
    //             case Color.Gray:
    //                 Cell[row][i].element.style.backgroundColor='gray';
    //                 break;
    //             case Color.Green:
    //                 Cell[row][i].element.style.backgroundColor='mediumseagreen';
    //                 break;
    //             case Color.Yellow:
    //                 Cell[row][i].element.style.backgroundColor='rgb(255, 225, 0)';
    //                 break;
    //         }
    //     }
    // }
    Cell[row][col].color = ++Cell[row][col].color % 3;
    switch (Cell[row][col].color) {
        case Color.Gray:
            Cell[row][col].element.style.backgroundColor='gray';
            break;
        case Color.Green:
            Cell[row][col].element.style.backgroundColor='mediumseagreen';
            break;
        case Color.Yellow:
            Cell[row][col].element.style.backgroundColor='rgb(230, 205, 0)';
            break;
    }
    return;
}

function ValidateGuess(word) {
    let errorMsg = word;
    if (!(/^[A-Z]{5}$/.test(word))) {
        errorMsg += ' must be alpha only & exactly 5 letters long';
    } else if ((SearchStringInArray(word, SolutionList) < 0) && (SearchStringInArray(word, GuessList) < 0) ) {
        errorMsg += ' is not in the dictionary';
    } else return true;
    alert(errorMsg);
    return false;
}

// Find all words in the dictionaries that match the guess word pattern
function FindWords() {
    CollectData();
    if (Row === 0) {
        Solutions[0] = CullList(SolutionList);
        Guesses[0] = CullList(GuessList);
    } else {
        Solutions[Row] = CullList(Solutions[Row - 1]);
        Guesses[Row] = CullList(Guesses[Row - 1]);
    }
    ClearAnswers();
    El.WordsInput.value = Solutions[Row].join(' ') + ' <===> ' + Guesses[Row].join(' ');
}

function CollectData() {
    if (Row === -1) return;
    LastDataRow++;
    DataCollected[Row] = true;
    for (let i = LastDataRow; i <= Row; i++) {  //Process each row

        for (let j = 0; j < 5; j++) {           // Process green and yellow letters in the row
            let cellIJletter = Cell[i][j].letter;
            switch(Cell[i][j].color) {
                case Color.Green:
                    GreenBoxes[j] = cellIJletter;
                    break;

// if cellIJletter is currently yellow, remove it from YellowBoxes and
//      check if 
//          letter is gray in another postiton -> remove from YellowLetters
//          letter has another yellow position -> no action
//          letter has no other position -> remove from YellowLetters
// 


                case Color.Yellow:
                    YellowLetters = AddUniqLetterToString(cellIJletter, YellowLetters);
                    YellowBoxes[j] = AddUniqLetterToString(cellIJletter, YellowBoxes[j]);
                    break;
            }
        }
        // Process gray letters AFTER yellow and green.
        // LOGIC Matching green: at least this cell is yellow.
        //       Matching yellow: mark this cell yellow (if there is only one other gray cell,
        //         that cell is green with this letter--not implemented).
        //       No matching yellow or green: truly a gray.

        for (let j = 0; j < 5; j++) {
            if (Cell[i][j].color === Color.Gray) {
                if (SearchStringInArray(Cell[i][j].letter, GreenBoxes)  >= 0 ||
                        YellowLetters.includes(Cell[i][j].letter)) {
                    YellowLetters = AddUniqLetterToString(Cell[i][j].letter, YellowLetters);
                    YellowBoxes[j] = AddUniqLetterToString(Cell[i][j].letter, YellowBoxes[j]);
                    Cell[i][j].color = Color.Yellow;
                }
                if (Cell[i][j].color === Color.Gray) {
                    GrayLetters = AddUniqLetterToString(Cell[i][j].letter, GrayLetters);
                }
            }
        }
    }
}

function AddUniqLetterToString(letter, string) {
    if (!string.includes(letter)) {
        string += letter;
    }
    return string;
}

function CullList(list) { 
    let newList = [];
    list.forEach((word, i) => {

    // Exclude words with gray letters
        for (let j = 0; j < GrayLetters.length; j++) {
            if (word.includes(GrayLetters[j])) {
                return;
            }
        }

    // Exclude if green letters not in proper place
       for (let j = 0; j < 5; j++) {
            if ((GreenBoxes[j] != '') && (word[j] != GreenBoxes[j])) {
                return;
            }
        }

    // If yellow letter present, check for presence and position
        for (let j = 0; j < YellowLetters.length; j++) {
            if (!word.includes(YellowLetters[j])) {
                return;                    // missing a yellow letter
            }
        }
        for (let j = 0; j < 5; j++) {
            for (let k = 0; k < YellowBoxes[j].length; k++) {
                if (YellowBoxes[j][k] === word[j]) {
                    return;                // don't repeat a yellow letter
                }
            }
        }
    newList.push(word);
    });
    return newList;
}

// Erase the last entry in the table
function EraseLine() {
    GuessBox[Row] = '';                        // Reset last row
    Solutions[Row] = '';
    Guesses[Row] = '';
    DataCollected[Row] = false;
    for (let i = 0; i < 5; i++) {
        Cell[Row][i].letter = '';
        Cell[Row][i].color = Color.Gray;
        Cell[Row][i].element.style.backgroundColor = '#eee';
        Cell[Row][i].element.innerHTML = '';
        GreenBoxes[i] = '';                    // Reset to initial state
        YellowBoxes[i] = '';
    }
    YellowLetters = '';
    GrayLetters = '';
    LastDataRow = -1;

    Row--;
    ClearAnswers();
}

function ClearAnswers() {
    El.WordsInput.value = '';
    El.OutputBox.innerHTML = '';
}

function ClearGuesses() {
    let words = El.WordsInput.value;
    let index = words.indexOf("<===>");
    if (index < 0) {
        alert("'The word list must contain the separator '<===>' between the solution words and guess words.");
        return;
    }
    ClearAnswers();
    El.WordsInput.value = words.slice(0, index);
}


// Returns index of str in strArray or -1 if not found
function SearchStringInArray(str, strArray) {
    for (let j=0; j < strArray.length; j++) {
        if (strArray[j].match(str)) return j;
    }
    return -1;
}

// Returns index of str in strArray or -1 if not found
function BinarySearchStringInArray(str, strArr) {
    let left = 0;
    let right = strArr.length - 1;
    let mid;
    while (left <= right) {
        mid = Math.floor((left + right) / 2);
        if (str === strArr[mid]) {
            return mid;
        } else if (str > strArr[mid]) {
            left = ++mid;
        } else {
            right = --mid;
        }
    }
    return -1;
}

function ShowList (list) {
    El.OutputBox.innerHTML = '';
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

    El.OutputBox.innerHTML = output;
}

function CheckWords() {
    let words = El.WordsInput.value.toUpperCase().split(/[^A-Za-z]+/).filter(x => x);
    if (!Validate(words)) {
        return;
    }
    El.OutputBox.innerHTML = '';

    /* Check which list the word is in */
    let Msg = [];
    for (let i = 0; i < words.length; i++) {
        Msg[i] = words[i] + ' - '; 
        if (BinarySearchStringInArray(words[i], SolutionList) >= 0) {
            Msg[i] += `bonafide solution<br>`;
        } else if (BinarySearchStringInArray(words[i], GuessList) >= 0) {
            Msg[i] += `valid guess word<br>`;
        } else {
            Msg[i] += `not in the dictionary<br>`;
        }
    }

    /* Sort and display the list */
    let output1 = '';
    let output2 = '';
    let output3 = '';
    for (let i = 0; i < words.length; i++) {
        switch(Msg[i][8]) {
            case 'b':
                output1 += (Msg[i]);  
                break; 
            case 'v':
                output2 += (Msg[i]);  
                break; 
            case 'n':
                output3 += (Msg[i]);  
                break; 
        }
    El.OutputBox.innerHTML = output1 + output2 + output3;
    }
}

// Display each group with stats
function Statistics() {
    let words = El.WordsInput.value.toUpperCase().split(/[^A-Za-z]+/).filter(x => x);
    if (!Validate(words)) return; 
    let wordGroups = test(words);
    El.OutputBox.innerHTML = '';
    for (let i = 0; (i < wordGroups.length) && (i < 75); i++) {
        let WordGroup = wordGroups[i];
        WordGroup.GroupSizes.sort((a,b) => b - a);
        El.OutputBox.innerText += WordGroup.Guess + ' ';
        El.OutputBox.innerHTML += WordGroup.GroupSizes.length;
        if(SearchStringInArray(WordGroup.Guess, SolutionList) > 0) {
            El.OutputBox.innerHTML += '-> ';
        } else {
            El.OutputBox.innerHTML += '-- ';
        }
        El.OutputBox.innerHTML += WordGroup.GroupSizes.join('-');
        El.OutputBox.innerHTML += '<br>';
    }
}

function test(possibleAnswers) {
    let wordGroups = [];
    for (let i = 0; i < possibleAnswers.length; i++) {  // Collect the patterns
        let guessWord = possibleAnswers[i];
        let patterns = [];
        for (let j = 0; j < possibleAnswers.length; j++) {
            let matchWord = possibleAnswers[j];
            if (BinarySearchStringInArray(matchWord, GuessList) >= 0) {
                continue;
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
            // CALCULATE AVERAGE OF GROUP SIZES  DEBUG


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
            El.OutputBox.innerHTML = errorMsg;
            return false;
        }
    }
    return true;
}
}
)